var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./apis", "./edgeCases"], function (require, exports, apis_1, edgeCases_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFileTreeForModuleWithTag = exports.getReferencesForModule = exports.setupTypeAcquisition = void 0;
    exports.getNewDependencies = getNewDependencies;
    /**
     * The function which starts up type acquisition,
     * returns a function which you then pass the initial
     * source code for the app with.
     *
     * This is effectively the main export, everything else is
     * basically exported for tests and should be considered
     * implementation details by consumers.
     */
    const setupTypeAcquisition = (config) => {
        const moduleMap = new Map();
        const fsMap = new Map();
        let estimatedToDownload = 0;
        let estimatedDownloaded = 0;
        return (initialSourceFile) => {
            estimatedToDownload = 0;
            estimatedDownloaded = 0;
            return resolveDeps(initialSourceFile, 0).then(t => {
                var _a, _b;
                if (estimatedDownloaded > 0) {
                    (_b = (_a = config.delegate).finished) === null || _b === void 0 ? void 0 : _b.call(_a, fsMap);
                }
            });
        };
        function resolveDeps(initialSourceFile, depth) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e;
                const depsToGet = getNewDependencies(config, moduleMap, initialSourceFile);
                // Make it so it won't get re-downloaded
                depsToGet.forEach(dep => moduleMap.set(dep.module, { state: "loading" }));
                // Grab the module trees which gives us a list of files to download
                const trees = yield Promise.all(depsToGet.map(f => (0, exports.getFileTreeForModuleWithTag)(config, f.module, f.version)));
                const treesOnly = trees.filter(t => !("error" in t));
                // These are the modules which we can grab directly
                const hasDTS = treesOnly.filter(t => t.files.find(f => isDtsFile(f.name)));
                const dtsFilesFromNPM = hasDTS.map(t => treeToDTSFiles(t, `/node_modules/${t.moduleName}`));
                // These are ones we need to look on DT for (which may not be there, who knows)
                const mightBeOnDT = treesOnly.filter(t => !hasDTS.includes(t));
                const dtTrees = yield Promise.all(
                // TODO: Switch from 'latest' to the version from the original tree which is user-controlled
                mightBeOnDT.map(f => (0, exports.getFileTreeForModuleWithTag)(config, `@types/${getDTName(f.moduleName)}`, "latest")));
                const dtTreesOnly = dtTrees.filter(t => !("error" in t));
                const dtsFilesFromDT = dtTreesOnly.map(t => treeToDTSFiles(t, `/node_modules/@types/${getDTName(t.moduleName).replace("types__", "")}`));
                // Collect all the npm and DT DTS requests and flatten their arrays
                const allDTSFiles = dtsFilesFromNPM.concat(dtsFilesFromDT).reduce((p, c) => p.concat(c), []);
                estimatedToDownload += allDTSFiles.length;
                if (allDTSFiles.length && depth === 0) {
                    (_b = (_a = config.delegate).started) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                // Grab the package.jsons for each dependency
                for (const tree of treesOnly) {
                    let prefix = `/node_modules/${tree.moduleName}`;
                    if (dtTreesOnly.includes(tree))
                        prefix = `/node_modules/@types/${getDTName(tree.moduleName).replace("types__", "")}`;
                    const path = prefix + "/package.json";
                    const pkgJSON = yield (0, apis_1.getDTSFileForModuleWithVersion)(config, tree.moduleName, tree.version, "/package.json");
                    if (typeof pkgJSON == "string") {
                        fsMap.set(path, pkgJSON);
                        (_d = (_c = config.delegate).receivedFile) === null || _d === void 0 ? void 0 : _d.call(_c, pkgJSON, path);
                    }
                    else {
                        (_e = config.logger) === null || _e === void 0 ? void 0 : _e.error(`Could not download package.json for ${tree.moduleName}`);
                    }
                }
                // Grab all dts files
                yield Promise.all(allDTSFiles.map((dts) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    const dtsCode = yield (0, apis_1.getDTSFileForModuleWithVersion)(config, dts.moduleName, dts.moduleVersion, dts.path);
                    estimatedDownloaded++;
                    if (dtsCode instanceof Error) {
                        // TODO?
                        (_a = config.logger) === null || _a === void 0 ? void 0 : _a.error(`Had an issue getting ${dts.path} for ${dts.moduleName}`);
                    }
                    else {
                        fsMap.set(dts.vfsPath, dtsCode);
                        (_c = (_b = config.delegate).receivedFile) === null || _c === void 0 ? void 0 : _c.call(_b, dtsCode, dts.vfsPath);
                        // Send a progress note every 5 downloads
                        if (config.delegate.progress && estimatedDownloaded % 5 === 0) {
                            config.delegate.progress(estimatedDownloaded, estimatedToDownload);
                        }
                        // Recurse through deps
                        yield resolveDeps(dtsCode, depth + 1);
                    }
                })));
            });
        }
    };
    exports.setupTypeAcquisition = setupTypeAcquisition;
    function treeToDTSFiles(tree, vfsPrefix) {
        const dtsRefs = [];
        for (const file of tree.files) {
            if (isDtsFile(file.name)) {
                dtsRefs.push({
                    moduleName: tree.moduleName,
                    moduleVersion: tree.version,
                    vfsPath: `${vfsPrefix}${file.name}`,
                    path: file.name,
                });
            }
        }
        return dtsRefs;
    }
    /**
     * Pull out any potential references to other modules (including relatives) with their
     * npm versioning strat too if someone opts into a different version via an inline end of line comment
     */
    const getReferencesForModule = (ts, code) => {
        const meta = ts.preProcessFile(code);
        // Ensure we don't try download TypeScript lib references
        // @ts-ignore - private but likely to never change
        const libMap = ts.libMap || new Map();
        // TODO: strip /// <reference path='X' />?
        const references = meta.referencedFiles
            .concat(meta.importedFiles)
            .concat(meta.libReferenceDirectives)
            .filter(f => !isDtsFile(f.fileName))
            .filter(d => !libMap.has(d.fileName));
        return references.map(r => {
            let version = undefined;
            if (!r.fileName.startsWith(".")) {
                version = "latest";
                const line = code.slice(r.end).split("\n")[0];
                if (line.includes("// types:"))
                    version = line.split("// types: ")[1].trim();
            }
            return {
                module: r.fileName,
                version,
            };
        });
    };
    exports.getReferencesForModule = getReferencesForModule;
    /** A list of modules from the current sourcefile which we don't have existing files for */
    function getNewDependencies(config, moduleMap, code) {
        const refs = (0, exports.getReferencesForModule)(config.typescript, code).map(ref => (Object.assign(Object.assign({}, ref), { module: (0, edgeCases_1.mapModuleNameToModule)(ref.module) })));
        // Drop relative paths because we're getting all the files
        const modules = refs.filter(f => !f.module.startsWith(".")).filter(m => !moduleMap.has(m.module));
        return modules;
    }
    /** The bulk load of the work in getting the filetree based on how people think about npm names and versions */
    const getFileTreeForModuleWithTag = (config, moduleName, tag) => __awaiter(void 0, void 0, void 0, function* () {
        let toDownload = tag || "latest";
        // I think having at least 2 dots is a reasonable approx for being a semver and not a tag,
        // we can skip an API request, TBH this is probably rare
        if (toDownload.split(".").length < 2) {
            // The jsdelivr API needs a _version_ not a tag. So, we need to switch out
            // the tag to the version via an API request.
            const response = yield (0, apis_1.getNPMVersionForModuleReference)(config, moduleName, toDownload);
            if (response instanceof Error) {
                return {
                    error: response,
                    userFacingMessage: `Could not go from a tag to version on npm for ${moduleName} - possible typo?`,
                };
            }
            const neededVersion = response.version;
            if (!neededVersion) {
                const versions = yield (0, apis_1.getNPMVersionsForModule)(config, moduleName);
                if (versions instanceof Error) {
                    return {
                        error: response,
                        userFacingMessage: `Could not get versions on npm for ${moduleName} - possible typo?`,
                    };
                }
                const tags = Object.entries(versions.tags).join(", ");
                return {
                    error: new Error("Could not find tag for module"),
                    userFacingMessage: `Could not find a tag for ${moduleName} called ${tag}. Did find ${tags}`,
                };
            }
            toDownload = neededVersion;
        }
        const res = yield (0, apis_1.getFiletreeForModuleWithVersion)(config, moduleName, toDownload);
        if (res instanceof Error) {
            return {
                error: res,
                userFacingMessage: `Could not get the files for ${moduleName}@${toDownload}. Is it possibly a typo?`,
            };
        }
        return res;
    });
    exports.getFileTreeForModuleWithTag = getFileTreeForModuleWithTag;
    // Taken from dts-gen: https://github.com/microsoft/dts-gen/blob/master/lib/names.ts
    function getDTName(s) {
        if (s.indexOf("@") === 0 && s.indexOf("/") !== -1) {
            // we have a scoped module, e.g. @bla/foo
            // which should be converted to   bla__foo
            s = s.substr(1).replace("/", "__");
        }
        return s;
    }
    function isDtsFile(file) {
        return /\.d\.([^\.]+\.)?[cm]?ts$/i.test(file);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zYW5kYm94L3NyYy92ZW5kb3IvYXRhL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7SUErTEEsZ0RBU0M7SUFyS0Q7Ozs7Ozs7O09BUUc7SUFDSSxNQUFNLG9CQUFvQixHQUFHLENBQUMsTUFBMEIsRUFBRSxFQUFFO1FBQ2pFLE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFBO1FBQy9DLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFBO1FBRXZDLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFBO1FBQzNCLElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFBO1FBRTNCLE9BQU8sQ0FBQyxpQkFBeUIsRUFBRSxFQUFFO1lBQ25DLG1CQUFtQixHQUFHLENBQUMsQ0FBQTtZQUN2QixtQkFBbUIsR0FBRyxDQUFDLENBQUE7WUFFdkIsT0FBTyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFOztnQkFDaEQsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDNUIsTUFBQSxNQUFBLE1BQU0sQ0FBQyxRQUFRLEVBQUMsUUFBUSxtREFBRyxLQUFLLENBQUMsQ0FBQTtnQkFDbkMsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFBO1FBRUQsU0FBZSxXQUFXLENBQUMsaUJBQXlCLEVBQUUsS0FBYTs7O2dCQUNqRSxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUE7Z0JBRTFFLHdDQUF3QztnQkFDeEMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLEtB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QUEyQiwrQkFpRHZDO0lBU0Qsb0ZBQW9GO0lBQ3BGLFNBQVMsU0FBUyxDQUFDLENBQVM7UUFDMUIsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDbEQseUNBQXlDO1lBQ3pDLDBDQUEwQztZQUMxQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3BDLENBQUM7UUFDRCxPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFFRCxTQUFTLFNBQVMsQ0FBQyxJQUFZO1FBQzdCLE9BQU8sMkJBQTJCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQy9DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBnZXREVFNGaWxlRm9yTW9kdWxlV2l0aFZlcnNpb24sXG4gIGdldEZpbGV0cmVlRm9yTW9kdWxlV2l0aFZlcnNpb24sXG4gIGdldE5QTVZlcnNpb25Gb3JNb2R1bGVSZWZlcmVuY2UsXG4gIGdldE5QTVZlcnNpb25zRm9yTW9kdWxlLFxuICBOUE1UcmVlTWV0YSxcbn0gZnJvbSBcIi4vYXBpc1wiXG5pbXBvcnQgeyBtYXBNb2R1bGVOYW1lVG9Nb2R1bGUgfSBmcm9tIFwiLi9lZGdlQ2FzZXNcIlxuXG5leHBvcnQgaW50ZXJmYWNlIEFUQUJvb3RzdHJhcENvbmZpZyB7XG4gIC8qKiBBIG9iamVjdCB5b3UgcGFzcyBpbiB0byBnZXQgY2FsbGJhY2tzICovXG4gIGRlbGVnYXRlOiB7XG4gICAgLyoqIFRoZSBjYWxsYmFjayB3aGljaCBnZXRzIGNhbGxlZCB3aGVuIEFUQSBkZWNpZGVzIGEgZmlsZSBuZWVkcyB0byBiZSB3cml0dGVuIHRvIHlvdXIgVkZTICAqL1xuICAgIHJlY2VpdmVkRmlsZT86IChjb2RlOiBzdHJpbmcsIHBhdGg6IHN0cmluZykgPT4gdm9pZFxuICAgIC8qKiBBIHdheSB0byBkaXNwbGF5IHByb2dyZXNzICovXG4gICAgcHJvZ3Jlc3M/OiAoZG93bmxvYWRlZDogbnVtYmVyLCBlc3RpbWF0ZWRUb3RhbDogbnVtYmVyKSA9PiB2b2lkXG4gICAgLyoqIE5vdGU6IEFuIGVycm9yIG1lc3NhZ2UgZG9lcyBub3QgbWVhbiBBVEEgaGFzIHN0b3BwZWQhICovXG4gICAgZXJyb3JNZXNzYWdlPzogKHVzZXJGYWNpbmdNZXNzYWdlOiBzdHJpbmcsIGVycm9yOiBFcnJvcikgPT4gdm9pZFxuICAgIC8qKiBBIGNhbGxiYWNrIGluZGljYXRpbmcgdGhhdCBBVEEgYWN0dWFsbHkgaGFzIHdvcmsgdG8gZG8gKi9cbiAgICBzdGFydGVkPzogKCkgPT4gdm9pZFxuICAgIC8qKiBUaGUgY2FsbGJhY2sgd2hlbiBhbGwgQVRBIGhhcyBmaW5pc2hlZCAqL1xuICAgIGZpbmlzaGVkPzogKGZpbGVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSA9PiB2b2lkXG4gIH1cbiAgLyoqIFBhc3NlZCB0byBmZXRjaCBhcyB0aGUgdXNlci1hZ2VudCAqL1xuICBwcm9qZWN0TmFtZTogc3RyaW5nXG4gIC8qKiBZb3VyIGxvY2FsIGNvcHkgb2YgdHlwZXNjcmlwdCAqL1xuICB0eXBlc2NyaXB0OiB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKVxuICAvKiogSWYgeW91IG5lZWQgYSBjdXN0b20gdmVyc2lvbiBvZiBmZXRjaCAqL1xuICBmZXRjaGVyPzogdHlwZW9mIGZldGNoXG4gIC8qKiBJZiB5b3UgbmVlZCBhIGN1c3RvbSBsb2dnZXIgaW5zdGVhZCBvZiB0aGUgY29uc29sZSBnbG9iYWwgKi9cbiAgbG9nZ2VyPzogTG9nZ2VyXG59XG5cbnR5cGUgTW9kdWxlTWV0YSA9IHsgc3RhdGU6IFwibG9hZGluZ1wiIH1cblxuLyoqXG4gKiBUaGUgZnVuY3Rpb24gd2hpY2ggc3RhcnRzIHVwIHR5cGUgYWNxdWlzaXRpb24sXG4gKiByZXR1cm5zIGEgZnVuY3Rpb24gd2hpY2ggeW91IHRoZW4gcGFzcyB0aGUgaW5pdGlhbFxuICogc291cmNlIGNvZGUgZm9yIHRoZSBhcHAgd2l0aC5cbiAqXG4gKiBUaGlzIGlzIGVmZmVjdGl2ZWx5IHRoZSBtYWluIGV4cG9ydCwgZXZlcnl0aGluZyBlbHNlIGlzXG4gKiBiYXNpY2FsbHkgZXhwb3J0ZWQgZm9yIHRlc3RzIGFuZCBzaG91bGQgYmUgY29uc2lkZXJlZFxuICogaW1wbGVtZW50YXRpb24gZGV0YWlscyBieSBjb25zdW1lcnMuXG4gKi9cbmV4cG9ydCBjb25zdCBzZXR1cFR5cGVBY3F1aXNpdGlvbiA9IChjb25maWc6IEFUQUJvb3RzdHJhcENvbmZpZykgPT4ge1xuICBjb25zdCBtb2R1bGVNYXAgPSBuZXcgTWFwPHN0cmluZywgTW9kdWxlTWV0YT4oKVxuICBjb25zdCBmc01hcCA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcblxuICBsZXQgZXN0aW1hdGVkVG9Eb3dubG9hZCA9IDBcbiAgbGV0IGVzdGltYXRlZERvd25sb2FkZWQgPSAwXG5cbiAgcmV0dXJuIChpbml0aWFsU291cmNlRmlsZTogc3RyaW5nKSA9PiB7XG4gICAgZXN0aW1hdGVkVG9Eb3dubG9hZCA9IDBcbiAgICBlc3RpbWF0ZWREb3dubG9hZGVkID0gMFxuXG4gICAgcmV0dXJuIHJlc29sdmVEZXBzKGluaXRpYWxTb3VyY2VGaWxlLCAwKS50aGVuKHQgPT4ge1xuICAgICAgaWYgKGVzdGltYXRlZERvd25sb2FkZWQgPiAwKSB7XG4gICAgICAgIGNvbmZpZy5kZWxlZ2F0ZS5maW5pc2hlZD8uKGZzTWFwKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBhc3luYyBmdW5jdGlvbiByZXNvbHZlRGVwcyhpbml0aWFsU291cmNlRmlsZTogc3RyaW5nLCBkZXB0aDogbnVtYmVyKSB7XG4gICAgY29uc3QgZGVwc1RvR2V0ID0gZ2V0TmV3RGVwZW5kZW5jaWVzKGNvbmZpZywgbW9kdWxlTWFwLCBpbml0aWFsU291cmNlRmlsZSlcblxuICAgIC8vIE1ha2UgaXQgc28gaXQgd29uJ3QgZ2V0IHJlLWRvd25sb2FkZWRcbiAgICBkZXBzVG9HZXQuZm9yRWFjaChkZXAgPT4gbW9kdWxlTWFwLnNldChkZXAubW9kdWxlLCB7IHN0YXRlOiBcImxvYWRpbmdcIiB9KSlcblxuICAgIC8vIEdyYWIgdGhlIG1vZHVsZSB0cmVlcyB3aGljaCBnaXZlcyB1cyBhIGxpc3Qgb2YgZmlsZXMgdG8gZG93bmxvYWRcbiAgICBjb25zdCB0cmVlcyA9IGF3YWl0IFByb21pc2UuYWxsKGRlcHNUb0dldC5tYXAoZiA9PiBnZXRGaWxlVHJlZUZvck1vZHVsZVdpdGhUYWcoY29uZmlnLCBmLm1vZHVsZSwgZi52ZXJzaW9uKSkpXG4gICAgY29uc3QgdHJlZXNPbmx5ID0gdHJlZXMuZmlsdGVyKHQgPT4gIShcImVycm9yXCIgaW4gdCkpIGFzIE5QTVRyZWVNZXRhW11cblxuICAgIC8vIFRoZXNlIGFyZSB0aGUgbW9kdWxlcyB3aGljaCB3ZSBjYW4gZ3JhYiBkaXJlY3RseVxuICAgIGNvbnN0IGhhc0RUUyA9IHRyZWVzT25seS5maWx0ZXIodCA9PiB0LmZpbGVzLmZpbmQoZiA9PiBpc0R0c0ZpbGUoZi5uYW1lKSkpXG4gICAgY29uc3QgZHRzRmlsZXNGcm9tTlBNID0gaGFzRFRTLm1hcCh0ID0+IHRyZWVUb0RUU0ZpbGVzKHQsIGAvbm9kZV9tb2R1bGVzLyR7dC5tb2R1bGVOYW1lfWApKVxuXG4gICAgLy8gVGhlc2UgYXJlIG9uZXMgd2UgbmVlZCB0byBsb29rIG9uIERUIGZvciAod2hpY2ggbWF5IG5vdCBiZSB0aGVyZSwgd2hvIGtub3dzKVxuICAgIGNvbnN0IG1pZ2h0QmVPbkRUID0gdHJlZXNPbmx5LmZpbHRlcih0ID0+ICFoYXNEVFMuaW5jbHVkZXModCkpXG4gICAgY29uc3QgZHRUcmVlcyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgLy8gVE9ETzogU3dpdGNoIGZyb20gJ2xhdGVzdCcgdG8gdGhlIHZlcnNpb24gZnJvbSB0aGUgb3JpZ2luYWwgdHJlZSB3aGljaCBpcyB1c2VyLWNvbnRyb2xsZWRcbiAgICAgIG1pZ2h0QmVPbkRULm1hcChmID0+IGdldEZpbGVUcmVlRm9yTW9kdWxlV2l0aFRhZyhjb25maWcsIGBAdHlwZXMvJHtnZXREVE5hbWUoZi5tb2R1bGVOYW1lKX1gLCBcImxhdGVzdFwiKSlcbiAgICApXG5cbiAgICBjb25zdCBkdFRyZWVzT25seSA9IGR0VHJlZXMuZmlsdGVyKHQgPT4gIShcImVycm9yXCIgaW4gdCkpIGFzIE5QTVRyZWVNZXRhW11cbiAgICBjb25zdCBkdHNGaWxlc0Zyb21EVCA9IGR0VHJlZXNPbmx5Lm1hcCh0ID0+IHRyZWVUb0RUU0ZpbGVzKHQsIGAvbm9kZV9tb2R1bGVzL0B0eXBlcy8ke2dldERUTmFtZSh0Lm1vZHVsZU5hbWUpLnJlcGxhY2UoXCJ0eXBlc19fXCIsIFwiXCIpfWApKVxuXG4gICAgLy8gQ29sbGVjdCBhbGwgdGhlIG5wbSBhbmQgRFQgRFRTIHJlcXVlc3RzIGFuZCBmbGF0dGVuIHRoZWlyIGFycmF5c1xuICAgIGNvbnN0IGFsbERUU0ZpbGVzID0gZHRzRmlsZXNGcm9tTlBNLmNvbmNhdChkdHNGaWxlc0Zyb21EVCkucmVkdWNlKChwLCBjKSA9PiBwLmNvbmNhdChjKSwgW10pXG4gICAgZXN0aW1hdGVkVG9Eb3dubG9hZCArPSBhbGxEVFNGaWxlcy5sZW5ndGhcbiAgICBpZiAoYWxsRFRTRmlsZXMubGVuZ3RoICYmIGRlcHRoID09PSAwKSB7XG4gICAgICBjb25maWcuZGVsZWdhdGUuc3RhcnRlZD8uKClcbiAgICB9XG5cbiAgICAvLyBHcmFiIHRoZSBwYWNrYWdlLmpzb25zIGZvciBlYWNoIGRlcGVuZGVuY3lcbiAgICBmb3IgKGNvbnN0IHRyZWUgb2YgdHJlZXNPbmx5KSB7XG4gICAgICBsZXQgcHJlZml4ID0gYC9ub2RlX21vZHVsZXMvJHt0cmVlLm1vZHVsZU5hbWV9YFxuICAgICAgaWYgKGR0VHJlZXNPbmx5LmluY2x1ZGVzKHRyZWUpKSBwcmVmaXggPSBgL25vZGVfbW9kdWxlcy9AdHlwZXMvJHtnZXREVE5hbWUodHJlZS5tb2R1bGVOYW1lKS5yZXBsYWNlKFwidHlwZXNfX1wiLCBcIlwiKX1gXG4gICAgICBjb25zdCBwYXRoID0gcHJlZml4ICsgXCIvcGFja2FnZS5qc29uXCJcbiAgICAgIGNvbnN0IHBrZ0pTT04gPSBhd2FpdCBnZXREVFNGaWxlRm9yTW9kdWxlV2l0aFZlcnNpb24oY29uZmlnLCB0cmVlLm1vZHVsZU5hbWUsIHRyZWUudmVyc2lvbiwgXCIvcGFja2FnZS5qc29uXCIpXG5cbiAgICAgIGlmICh0eXBlb2YgcGtnSlNPTiA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGZzTWFwLnNldChwYXRoLCBwa2dKU09OKVxuICAgICAgICBjb25maWcuZGVsZWdhdGUucmVjZWl2ZWRGaWxlPy4ocGtnSlNPTiwgcGF0aClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5sb2dnZXI/LmVycm9yKGBDb3VsZCBub3QgZG93bmxvYWQgcGFja2FnZS5qc29uIGZvciAke3RyZWUubW9kdWxlTmFtZX1gKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEdyYWIgYWxsIGR0cyBmaWxlc1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgYWxsRFRTRmlsZXMubWFwKGFzeW5jIGR0cyA9PiB7XG4gICAgICAgIGNvbnN0IGR0c0NvZGUgPSBhd2FpdCBnZXREVFNGaWxlRm9yTW9kdWxlV2l0aFZlcnNpb24oY29uZmlnLCBkdHMubW9kdWxlTmFtZSwgZHRzLm1vZHVsZVZlcnNpb24sIGR0cy5wYXRoKVxuICAgICAgICBlc3RpbWF0ZWREb3dubG9hZGVkKytcbiAgICAgICAgaWYgKGR0c0NvZGUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgIC8vIFRPRE8/XG4gICAgICAgICAgY29uZmlnLmxvZ2dlcj8uZXJyb3IoYEhhZCBhbiBpc3N1ZSBnZXR0aW5nICR7ZHRzLnBhdGh9IGZvciAke2R0cy5tb2R1bGVOYW1lfWApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnNNYXAuc2V0KGR0cy52ZnNQYXRoLCBkdHNDb2RlKVxuICAgICAgICAgIGNvbmZpZy5kZWxlZ2F0ZS5yZWNlaXZlZEZpbGU/LihkdHNDb2RlLCBkdHMudmZzUGF0aClcblxuICAgICAgICAgIC8vIFNlbmQgYSBwcm9ncmVzcyBub3RlIGV2ZXJ5IDUgZG93bmxvYWRzXG4gICAgICAgICAgaWYgKGNvbmZpZy5kZWxlZ2F0ZS5wcm9ncmVzcyAmJiBlc3RpbWF0ZWREb3dubG9hZGVkICUgNSA9PT0gMCkge1xuICAgICAgICAgICAgY29uZmlnLmRlbGVnYXRlLnByb2dyZXNzKGVzdGltYXRlZERvd25sb2FkZWQsIGVzdGltYXRlZFRvRG93bmxvYWQpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVjdXJzZSB0aHJvdWdoIGRlcHNcbiAgICAgICAgICBhd2FpdCByZXNvbHZlRGVwcyhkdHNDb2RlLCBkZXB0aCArIDEpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKVxuICB9XG59XG5cbnR5cGUgQVRBRG93bmxvYWQgPSB7XG4gIG1vZHVsZU5hbWU6IHN0cmluZ1xuICBtb2R1bGVWZXJzaW9uOiBzdHJpbmdcbiAgdmZzUGF0aDogc3RyaW5nXG4gIHBhdGg6IHN0cmluZ1xufVxuXG5mdW5jdGlvbiB0cmVlVG9EVFNGaWxlcyh0cmVlOiBOUE1UcmVlTWV0YSwgdmZzUHJlZml4OiBzdHJpbmcpIHtcbiAgY29uc3QgZHRzUmVmczogQVRBRG93bmxvYWRbXSA9IFtdXG5cbiAgZm9yIChjb25zdCBmaWxlIG9mIHRyZWUuZmlsZXMpIHtcbiAgICBpZiAoaXNEdHNGaWxlKGZpbGUubmFtZSkpIHtcbiAgICAgIGR0c1JlZnMucHVzaCh7XG4gICAgICAgIG1vZHVsZU5hbWU6IHRyZWUubW9kdWxlTmFtZSxcbiAgICAgICAgbW9kdWxlVmVyc2lvbjogdHJlZS52ZXJzaW9uLFxuICAgICAgICB2ZnNQYXRoOiBgJHt2ZnNQcmVmaXh9JHtmaWxlLm5hbWV9YCxcbiAgICAgICAgcGF0aDogZmlsZS5uYW1lLFxuICAgICAgfSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGR0c1JlZnNcbn1cblxuLyoqXG4gKiBQdWxsIG91dCBhbnkgcG90ZW50aWFsIHJlZmVyZW5jZXMgdG8gb3RoZXIgbW9kdWxlcyAoaW5jbHVkaW5nIHJlbGF0aXZlcykgd2l0aCB0aGVpclxuICogbnBtIHZlcnNpb25pbmcgc3RyYXQgdG9vIGlmIHNvbWVvbmUgb3B0cyBpbnRvIGEgZGlmZmVyZW50IHZlcnNpb24gdmlhIGFuIGlubGluZSBlbmQgb2YgbGluZSBjb21tZW50XG4gKi9cbmV4cG9ydCBjb25zdCBnZXRSZWZlcmVuY2VzRm9yTW9kdWxlID0gKHRzOiB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKSwgY29kZTogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IG1ldGEgPSB0cy5wcmVQcm9jZXNzRmlsZShjb2RlKVxuXG4gIC8vIEVuc3VyZSB3ZSBkb24ndCB0cnkgZG93bmxvYWQgVHlwZVNjcmlwdCBsaWIgcmVmZXJlbmNlc1xuICAvLyBAdHMtaWdub3JlIC0gcHJpdmF0ZSBidXQgbGlrZWx5IHRvIG5ldmVyIGNoYW5nZVxuICBjb25zdCBsaWJNYXA6IE1hcDxzdHJpbmcsIHN0cmluZz4gPSB0cy5saWJNYXAgfHwgbmV3IE1hcCgpXG5cbiAgLy8gVE9ETzogc3RyaXAgLy8vIDxyZWZlcmVuY2UgcGF0aD0nWCcgLz4/XG5cbiAgY29uc3QgcmVmZXJlbmNlcyA9IG1ldGEucmVmZXJlbmNlZEZpbGVzXG4gICAgLmNvbmNhdChtZXRhLmltcG9ydGVkRmlsZXMpXG4gICAgLmNvbmNhdChtZXRhLmxpYlJlZmVyZW5jZURpcmVjdGl2ZXMpXG4gICAgLmZpbHRlcihmID0+ICFpc0R0c0ZpbGUoZi5maWxlTmFtZSkpXG4gICAgLmZpbHRlcihkID0+ICFsaWJNYXAuaGFzKGQuZmlsZU5hbWUpKVxuXG4gIHJldHVybiByZWZlcmVuY2VzLm1hcChyID0+IHtcbiAgICBsZXQgdmVyc2lvbiA9IHVuZGVmaW5lZFxuICAgIGlmICghci5maWxlTmFtZS5zdGFydHNXaXRoKFwiLlwiKSkge1xuICAgICAgdmVyc2lvbiA9IFwibGF0ZXN0XCJcbiAgICAgIGNvbnN0IGxpbmUgPSBjb2RlLnNsaWNlKHIuZW5kKS5zcGxpdChcIlxcblwiKVswXSFcbiAgICAgIGlmIChsaW5lLmluY2x1ZGVzKFwiLy8gdHlwZXM6XCIpKSB2ZXJzaW9uID0gbGluZS5zcGxpdChcIi8vIHR5cGVzOiBcIilbMV0hLnRyaW0oKVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtb2R1bGU6IHIuZmlsZU5hbWUsXG4gICAgICB2ZXJzaW9uLFxuICAgIH1cbiAgfSlcbn1cblxuLyoqIEEgbGlzdCBvZiBtb2R1bGVzIGZyb20gdGhlIGN1cnJlbnQgc291cmNlZmlsZSB3aGljaCB3ZSBkb24ndCBoYXZlIGV4aXN0aW5nIGZpbGVzIGZvciAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5ld0RlcGVuZGVuY2llcyhjb25maWc6IEFUQUJvb3RzdHJhcENvbmZpZywgbW9kdWxlTWFwOiBNYXA8c3RyaW5nLCBNb2R1bGVNZXRhPiwgY29kZTogc3RyaW5nKSB7XG4gIGNvbnN0IHJlZnMgPSBnZXRSZWZlcmVuY2VzRm9yTW9kdWxlKGNvbmZpZy50eXBlc2NyaXB0LCBjb2RlKS5tYXAocmVmID0+ICh7XG4gICAgLi4ucmVmLFxuICAgIG1vZHVsZTogbWFwTW9kdWxlTmFtZVRvTW9kdWxlKHJlZi5tb2R1bGUpLFxuICB9KSlcblxuICAvLyBEcm9wIHJlbGF0aXZlIHBhdGhzIGJlY2F1c2Ugd2UncmUgZ2V0dGluZyBhbGwgdGhlIGZpbGVzXG4gIGNvbnN0IG1vZHVsZXMgPSByZWZzLmZpbHRlcihmID0+ICFmLm1vZHVsZS5zdGFydHNXaXRoKFwiLlwiKSkuZmlsdGVyKG0gPT4gIW1vZHVsZU1hcC5oYXMobS5tb2R1bGUpKVxuICByZXR1cm4gbW9kdWxlc1xufVxuXG4vKiogVGhlIGJ1bGsgbG9hZCBvZiB0aGUgd29yayBpbiBnZXR0aW5nIHRoZSBmaWxldHJlZSBiYXNlZCBvbiBob3cgcGVvcGxlIHRoaW5rIGFib3V0IG5wbSBuYW1lcyBhbmQgdmVyc2lvbnMgKi9cbmV4cG9ydCBjb25zdCBnZXRGaWxlVHJlZUZvck1vZHVsZVdpdGhUYWcgPSBhc3luYyAoXG4gIGNvbmZpZzogQVRBQm9vdHN0cmFwQ29uZmlnLFxuICBtb2R1bGVOYW1lOiBzdHJpbmcsXG4gIHRhZzogc3RyaW5nIHwgdW5kZWZpbmVkXG4pID0+IHtcbiAgbGV0IHRvRG93bmxvYWQgPSB0YWcgfHwgXCJsYXRlc3RcIlxuXG4gIC8vIEkgdGhpbmsgaGF2aW5nIGF0IGxlYXN0IDIgZG90cyBpcyBhIHJlYXNvbmFibGUgYXBwcm94IGZvciBiZWluZyBhIHNlbXZlciBhbmQgbm90IGEgdGFnLFxuICAvLyB3ZSBjYW4gc2tpcCBhbiBBUEkgcmVxdWVzdCwgVEJIIHRoaXMgaXMgcHJvYmFibHkgcmFyZVxuICBpZiAodG9Eb3dubG9hZC5zcGxpdChcIi5cIikubGVuZ3RoIDwgMikge1xuICAgIC8vIFRoZSBqc2RlbGl2ciBBUEkgbmVlZHMgYSBfdmVyc2lvbl8gbm90IGEgdGFnLiBTbywgd2UgbmVlZCB0byBzd2l0Y2ggb3V0XG4gICAgLy8gdGhlIHRhZyB0byB0aGUgdmVyc2lvbiB2aWEgYW4gQVBJIHJlcXVlc3QuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBnZXROUE1WZXJzaW9uRm9yTW9kdWxlUmVmZXJlbmNlKGNvbmZpZywgbW9kdWxlTmFtZSwgdG9Eb3dubG9hZClcbiAgICBpZiAocmVzcG9uc2UgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3I6IHJlc3BvbnNlLFxuICAgICAgICB1c2VyRmFjaW5nTWVzc2FnZTogYENvdWxkIG5vdCBnbyBmcm9tIGEgdGFnIHRvIHZlcnNpb24gb24gbnBtIGZvciAke21vZHVsZU5hbWV9IC0gcG9zc2libGUgdHlwbz9gLFxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IG5lZWRlZFZlcnNpb24gPSByZXNwb25zZS52ZXJzaW9uXG4gICAgaWYgKCFuZWVkZWRWZXJzaW9uKSB7XG4gICAgICBjb25zdCB2ZXJzaW9ucyA9IGF3YWl0IGdldE5QTVZlcnNpb25zRm9yTW9kdWxlKGNvbmZpZywgbW9kdWxlTmFtZSlcbiAgICAgIGlmICh2ZXJzaW9ucyBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZXJyb3I6IHJlc3BvbnNlLFxuICAgICAgICAgIHVzZXJGYWNpbmdNZXNzYWdlOiBgQ291bGQgbm90IGdldCB2ZXJzaW9ucyBvbiBucG0gZm9yICR7bW9kdWxlTmFtZX0gLSBwb3NzaWJsZSB0eXBvP2AsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgdGFncyA9IE9iamVjdC5lbnRyaWVzKHZlcnNpb25zLnRhZ3MpLmpvaW4oXCIsIFwiKVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZXJyb3I6IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBmaW5kIHRhZyBmb3IgbW9kdWxlXCIpLFxuICAgICAgICB1c2VyRmFjaW5nTWVzc2FnZTogYENvdWxkIG5vdCBmaW5kIGEgdGFnIGZvciAke21vZHVsZU5hbWV9IGNhbGxlZCAke3RhZ30uIERpZCBmaW5kICR7dGFnc31gLFxuICAgICAgfVxuICAgIH1cblxuICAgIHRvRG93bmxvYWQgPSBuZWVkZWRWZXJzaW9uXG4gIH1cblxuICBjb25zdCByZXMgPSBhd2FpdCBnZXRGaWxldHJlZUZvck1vZHVsZVdpdGhWZXJzaW9uKGNvbmZpZywgbW9kdWxlTmFtZSwgdG9Eb3dubG9hZClcbiAgaWYgKHJlcyBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiByZXMsXG4gICAgICB1c2VyRmFjaW5nTWVzc2FnZTogYENvdWxkIG5vdCBnZXQgdGhlIGZpbGVzIGZvciAke21vZHVsZU5hbWV9QCR7dG9Eb3dubG9hZH0uIElzIGl0IHBvc3NpYmx5IGEgdHlwbz9gLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXNcbn1cblxuaW50ZXJmYWNlIExvZ2dlciB7XG4gIGxvZzogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkXG4gIGVycm9yOiAoLi4uYXJnczogYW55W10pID0+IHZvaWRcbiAgZ3JvdXBDb2xsYXBzZWQ6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZFxuICBncm91cEVuZDogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkXG59XG5cbi8vIFRha2VuIGZyb20gZHRzLWdlbjogaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9kdHMtZ2VuL2Jsb2IvbWFzdGVyL2xpYi9uYW1lcy50c1xuZnVuY3Rpb24gZ2V0RFROYW1lKHM6IHN0cmluZykge1xuICBpZiAocy5pbmRleE9mKFwiQFwiKSA9PT0gMCAmJiBzLmluZGV4T2YoXCIvXCIpICE9PSAtMSkge1xuICAgIC8vIHdlIGhhdmUgYSBzY29wZWQgbW9kdWxlLCBlLmcuIEBibGEvZm9vXG4gICAgLy8gd2hpY2ggc2hvdWxkIGJlIGNvbnZlcnRlZCB0byAgIGJsYV9fZm9vXG4gICAgcyA9IHMuc3Vic3RyKDEpLnJlcGxhY2UoXCIvXCIsIFwiX19cIilcbiAgfVxuICByZXR1cm4gc1xufVxuXG5mdW5jdGlvbiBpc0R0c0ZpbGUoZmlsZTogc3RyaW5nKSB7XG4gIHJldHVybiAvXFwuZFxcLihbXlxcLl0rXFwuKT9bY21dP3RzJC9pLnRlc3QoZmlsZSlcbn1cbiJdfQ==