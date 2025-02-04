define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDefaultMapFromCDN = exports.addFilesForTypesIntoFolder = exports.addAllFilesFromFolder = exports.createDefaultMapFromNodeModules = exports.knownLibFilesForCompilerOptions = void 0;
    exports.createVirtualTypeScriptEnvironment = createVirtualTypeScriptEnvironment;
    exports.createSystem = createSystem;
    exports.createFSBackedSystem = createFSBackedSystem;
    exports.createVirtualCompilerHost = createVirtualCompilerHost;
    exports.createVirtualLanguageServiceHost = createVirtualLanguageServiceHost;
    let hasLocalStorage = false;
    try {
        hasLocalStorage = typeof localStorage !== `undefined`;
    }
    catch (error) { }
    const hasProcess = typeof process !== `undefined`;
    const shouldDebug = (hasLocalStorage && localStorage.getItem("DEBUG")) || (hasProcess && process.env.DEBUG);
    const debugLog = shouldDebug ? console.log : (_message, ..._optionalParams) => "";
    /**
     * Makes a virtual copy of the TypeScript environment. This is the main API you want to be using with
     * @typescript/vfs. A lot of the other exposed functions are used by this function to get set up.
     *
     * @param sys an object which conforms to the TS Sys (a shim over read/write access to the fs)
     * @param rootFiles a list of files which are considered inside the project
     * @param ts a copy pf the TypeScript module
     * @param compilerOptions the options for this compiler run
     * @param customTransformers custom transformers for this compiler run
     */
    function createVirtualTypeScriptEnvironment(sys, rootFiles, ts, compilerOptions = {}, customTransformers) {
        const mergedCompilerOpts = Object.assign(Object.assign({}, defaultCompilerOptions(ts)), compilerOptions);
        const { languageServiceHost, updateFile, deleteFile } = createVirtualLanguageServiceHost(sys, rootFiles, mergedCompilerOpts, ts, customTransformers);
        const languageService = ts.createLanguageService(languageServiceHost);
        const diagnostics = languageService.getCompilerOptionsDiagnostics();
        if (diagnostics.length) {
            const compilerHost = createVirtualCompilerHost(sys, compilerOptions, ts);
            throw new Error(ts.formatDiagnostics(diagnostics, compilerHost.compilerHost));
        }
        return {
            // @ts-ignore
            name: "vfs",
            sys,
            languageService,
            getSourceFile: fileName => { var _a; return (_a = languageService.getProgram()) === null || _a === void 0 ? void 0 : _a.getSourceFile(fileName); },
            createFile: (fileName, content) => {
                updateFile(ts.createSourceFile(fileName, content, mergedCompilerOpts.target, false));
            },
            updateFile: (fileName, content, optPrevTextSpan) => {
                const prevSourceFile = languageService.getProgram().getSourceFile(fileName);
                if (!prevSourceFile) {
                    throw new Error("Did not find a source file for " + fileName);
                }
                const prevFullContents = prevSourceFile.text;
                // TODO: Validate if the default text span has a fencepost error?
                const prevTextSpan = optPrevTextSpan !== null && optPrevTextSpan !== void 0 ? optPrevTextSpan : ts.createTextSpan(0, prevFullContents.length);
                const newText = prevFullContents.slice(0, prevTextSpan.start) +
                    content +
                    prevFullContents.slice(prevTextSpan.start + prevTextSpan.length);
                const newSourceFile = ts.updateSourceFile(prevSourceFile, newText, {
                    span: prevTextSpan,
                    newLength: content.length,
                });
                updateFile(newSourceFile);
            },
            deleteFile(fileName) {
                const sourceFile = languageService.getProgram().getSourceFile(fileName);
                if (sourceFile) {
                    deleteFile(sourceFile);
                }
            }
        };
    }
    // TODO: This could be replaced by grabbing: https://github.com/microsoft/TypeScript/blob/main/src/lib/libs.json
    // and then using that to generate the list of files from the server, but it is not included in the npm package
    /**
     * Grab the list of lib files for a particular target, will return a bit more than necessary (by including
     * the dom) but that's OK, we're really working with the constraint that you can't get a list of files
     * when running in a browser.
     *
     * @param target The compiler settings target baseline
     * @param ts A copy of the TypeScript module
     */
    const knownLibFilesForCompilerOptions = (compilerOptions, ts) => {
        const target = compilerOptions.target || ts.ScriptTarget.ES5;
        const lib = compilerOptions.lib || [];
        // Note that this will include files which can't be found for particular versions of TS
        // TODO: Replace this with some sort of API call if https://github.com/microsoft/TypeScript/pull/54011
        // or similar is merged.
        const files = [
            "lib.d.ts",
            "lib.core.d.ts",
            "lib.decorators.d.ts",
            "lib.decorators.legacy.d.ts",
            "lib.dom.asynciterable.d.ts",
            "lib.dom.d.ts",
            "lib.dom.iterable.d.ts",
            "lib.webworker.asynciterable.d.ts",
            "lib.webworker.d.ts",
            "lib.webworker.importscripts.d.ts",
            "lib.webworker.iterable.d.ts",
            "lib.scripthost.d.ts",
            "lib.es5.d.ts",
            "lib.es6.d.ts",
            "lib.es7.d.ts",
            "lib.core.es6.d.ts",
            "lib.core.es7.d.ts",
            "lib.es2015.collection.d.ts",
            "lib.es2015.core.d.ts",
            "lib.es2015.d.ts",
            "lib.es2015.generator.d.ts",
            "lib.es2015.iterable.d.ts",
            "lib.es2015.promise.d.ts",
            "lib.es2015.proxy.d.ts",
            "lib.es2015.reflect.d.ts",
            "lib.es2015.symbol.d.ts",
            "lib.es2015.symbol.wellknown.d.ts",
            "lib.es2016.array.include.d.ts",
            "lib.es2016.d.ts",
            "lib.es2016.full.d.ts",
            "lib.es2016.intl.d.ts",
            "lib.es2017.arraybuffer.d.ts",
            "lib.es2017.d.ts",
            "lib.es2017.date.d.ts",
            "lib.es2017.full.d.ts",
            "lib.es2017.intl.d.ts",
            "lib.es2017.object.d.ts",
            "lib.es2017.sharedmemory.d.ts",
            "lib.es2017.string.d.ts",
            "lib.es2017.typedarrays.d.ts",
            "lib.es2018.asyncgenerator.d.ts",
            "lib.es2018.asynciterable.d.ts",
            "lib.es2018.d.ts",
            "lib.es2018.full.d.ts",
            "lib.es2018.intl.d.ts",
            "lib.es2018.promise.d.ts",
            "lib.es2018.regexp.d.ts",
            "lib.es2019.array.d.ts",
            "lib.es2019.d.ts",
            "lib.es2019.full.d.ts",
            "lib.es2019.intl.d.ts",
            "lib.es2019.object.d.ts",
            "lib.es2019.string.d.ts",
            "lib.es2019.symbol.d.ts",
            "lib.es2020.bigint.d.ts",
            "lib.es2020.d.ts",
            "lib.es2020.date.d.ts",
            "lib.es2020.full.d.ts",
            "lib.es2020.intl.d.ts",
            "lib.es2020.number.d.ts",
            "lib.es2020.promise.d.ts",
            "lib.es2020.sharedmemory.d.ts",
            "lib.es2020.string.d.ts",
            "lib.es2020.symbol.wellknown.d.ts",
            "lib.es2021.d.ts",
            "lib.es2021.full.d.ts",
            "lib.es2021.intl.d.ts",
            "lib.es2021.promise.d.ts",
            "lib.es2021.string.d.ts",
            "lib.es2021.weakref.d.ts",
            "lib.es2022.array.d.ts",
            "lib.es2022.d.ts",
            "lib.es2022.error.d.ts",
            "lib.es2022.full.d.ts",
            "lib.es2022.intl.d.ts",
            "lib.es2022.object.d.ts",
            "lib.es2022.regexp.d.ts",
            "lib.es2022.sharedmemory.d.ts",
            "lib.es2022.string.d.ts",
            "lib.es2023.array.d.ts",
            "lib.es2023.collection.d.ts",
            "lib.es2023.d.ts",
            "lib.es2023.full.d.ts",
            "lib.es2023.intl.d.ts",
            "lib.es2024.arraybuffer.d.ts",
            "lib.es2024.collection.d.ts",
            "lib.es2024.d.ts",
            "lib.es2024.full.d.ts",
            "lib.es2024.object.d.ts",
            "lib.es2024.promise.d.ts",
            "lib.es2024.regexp.d.ts",
            "lib.es2024.sharedmemory.d.ts",
            "lib.es2024.string.d.ts",
            "lib.esnext.array.d.ts",
            "lib.esnext.asynciterable.d.ts",
            "lib.esnext.bigint.d.ts",
            "lib.esnext.collection.d.ts",
            "lib.esnext.d.ts",
            "lib.esnext.decorators.d.ts",
            "lib.esnext.disposable.d.ts",
            "lib.esnext.float16.d.ts",
            "lib.esnext.full.d.ts",
            "lib.esnext.intl.d.ts",
            "lib.esnext.iterator.d.ts",
            "lib.esnext.object.d.ts",
            "lib.esnext.promise.d.ts",
            "lib.esnext.regexp.d.ts",
            "lib.esnext.string.d.ts",
            "lib.esnext.symbol.d.ts",
            "lib.esnext.weakref.d.ts"
        ];
        const targetToCut = ts.ScriptTarget[target];
        const matches = files.filter(f => f.startsWith(`lib.${targetToCut.toLowerCase()}`));
        const targetCutIndex = files.indexOf(matches.pop());
        const getMax = (array) => array && array.length ? array.reduce((max, current) => (current > max ? current : max)) : undefined;
        // Find the index for everything in
        const indexesForCutting = lib.map(lib => {
            const matches = files.filter(f => f.startsWith(`lib.${lib.toLowerCase()}`));
            if (matches.length === 0)
                return 0;
            const cutIndex = files.indexOf(matches.pop());
            return cutIndex;
        });
        const libCutIndex = getMax(indexesForCutting) || 0;
        const finalCutIndex = Math.max(targetCutIndex, libCutIndex);
        return files.slice(0, finalCutIndex + 1);
    };
    exports.knownLibFilesForCompilerOptions = knownLibFilesForCompilerOptions;
    /**
     * Sets up a Map with lib contents by grabbing the necessary files from
     * the local copy of typescript via the file system.
     *
     * The first two args are un-used, but kept around so as to not cause a
     * semver major bump for no gain to module users.
     */
    const createDefaultMapFromNodeModules = (_compilerOptions, _ts, tsLibDirectory) => {
        const path = requirePath();
        const fs = requireFS();
        const getLib = (name) => {
            const lib = tsLibDirectory || path.dirname(require.resolve("typescript"));
            return fs.readFileSync(path.join(lib, name), "utf8");
        };
        const isDtsFile = (file) => /\.d\.([^\.]+\.)?[cm]?ts$/i.test(file);
        const libFiles = fs.readdirSync(tsLibDirectory || path.dirname(require.resolve("typescript")));
        const knownLibFiles = libFiles.filter(f => f.startsWith("lib.") && isDtsFile(f));
        const fsMap = new Map();
        knownLibFiles.forEach(lib => {
            fsMap.set("/" + lib, getLib(lib));
        });
        return fsMap;
    };
    exports.createDefaultMapFromNodeModules = createDefaultMapFromNodeModules;
    /**
     * Adds recursively files from the FS into the map based on the folder
     */
    const addAllFilesFromFolder = (map, workingDir) => {
        const path = requirePath();
        const fs = requireFS();
        const walk = function (dir) {
            let results = [];
            const list = fs.readdirSync(dir);
            list.forEach(function (file) {
                file = path.join(dir, file);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) {
                    /* Recurse into a subdirectory */
                    results = results.concat(walk(file));
                }
                else {
                    /* Is a file */
                    results.push(file);
                }
            });
            return results;
        };
        const allFiles = walk(workingDir);
        allFiles.forEach(lib => {
            const fsPath = "/node_modules/@types" + lib.replace(workingDir, "");
            const content = fs.readFileSync(lib, "utf8");
            const validExtensions = [".ts", ".tsx"];
            if (validExtensions.includes(path.extname(fsPath))) {
                map.set(fsPath, content);
            }
        });
    };
    exports.addAllFilesFromFolder = addAllFilesFromFolder;
    /** Adds all files from node_modules/@types into the FS Map */
    const addFilesForTypesIntoFolder = (map) => (0, exports.addAllFilesFromFolder)(map, "node_modules/@types");
    exports.addFilesForTypesIntoFolder = addFilesForTypesIntoFolder;
    /**
     * Create a virtual FS Map with the lib files from a particular TypeScript
     * version based on the target, Always includes dom ATM.
     *
     * @param options The compiler target, which dictates the libs to set up
     * @param version the versions of TypeScript which are supported
     * @param cache should the values be stored in local storage
     * @param ts a copy of the typescript import
     * @param lzstring an optional copy of the lz-string import
     * @param fetcher an optional replacement for the global fetch function (tests mainly)
     * @param storer an optional replacement for the localStorage global (tests mainly)
     */
    const createDefaultMapFromCDN = (options, version, cache, ts, lzstring, fetcher, storer) => {
        const fetchlike = fetcher || fetch;
        const fsMap = new Map();
        const files = (0, exports.knownLibFilesForCompilerOptions)(options, ts);
        const prefix = `https://playgroundcdn.typescriptlang.org/cdn/${version}/typescript/lib/`;
        function zip(str) {
            return lzstring ? lzstring.compressToUTF16(str) : str;
        }
        function unzip(str) {
            return lzstring ? lzstring.decompressFromUTF16(str) : str;
        }
        // Map the known libs to a node fetch promise, then return the contents
        function uncached() {
            return (Promise.all(files.map(lib => fetchlike(prefix + lib).then(resp => resp.text())))
                .then(contents => {
                contents.forEach((text, index) => fsMap.set("/" + files[index], text));
            })
                // Return a NOOP for .d.ts files which aren't in the current build of TypeScript
                .catch(() => { }));
        }
        // A localstorage and lzzip aware version of the lib files
        function cached() {
            const storelike = storer || localStorage;
            const keys = Object.keys(storelike);
            keys.forEach(key => {
                // Remove anything which isn't from this version
                if (key.startsWith("ts-lib-") && !key.startsWith("ts-lib-" + version)) {
                    storelike.removeItem(key);
                }
            });
            return Promise.all(files.map(lib => {
                const cacheKey = `ts-lib-${version}-${lib}`;
                const content = storelike.getItem(cacheKey);
                if (!content) {
                    // Make the API call and store the text concent in the cache
                    return (fetchlike(prefix + lib)
                        .then(resp => resp.text())
                        .then(t => {
                        storelike.setItem(cacheKey, zip(t));
                        return t;
                    })
                        // Return a NOOP for .d.ts files which aren't in the current build of TypeScript
                        .catch(() => { }));
                }
                else {
                    return Promise.resolve(unzip(content));
                }
            })).then(contents => {
                contents.forEach((text, index) => {
                    if (text) {
                        const name = "/" + files[index];
                        fsMap.set(name, text);
                    }
                });
            });
        }
        const func = cache ? cached : uncached;
        return func().then(() => fsMap);
    };
    exports.createDefaultMapFromCDN = createDefaultMapFromCDN;
    function notImplemented(methodName) {
        throw new Error(`Method '${methodName}' is not implemented.`);
    }
    function audit(name, fn) {
        return (...args) => {
            const res = fn(...args);
            const smallres = typeof res === "string" ? res.slice(0, 80) + "..." : res;
            debugLog("> " + name, ...args);
            debugLog("< " + smallres);
            return res;
        };
    }
    /** The default compiler options if TypeScript could ever change the compiler options */
    const defaultCompilerOptions = (ts) => {
        return Object.assign(Object.assign({}, ts.getDefaultCompilerOptions()), { jsx: ts.JsxEmit.React, strict: true, esModuleInterop: true, module: ts.ModuleKind.ESNext, suppressOutputPathCheck: true, skipLibCheck: true, skipDefaultLibCheck: true, moduleResolution: ts.ModuleResolutionKind.NodeJs });
    };
    // "/DOM.d.ts" => "/lib.dom.d.ts"
    const libize = (path) => path.replace("/", "/lib.").toLowerCase();
    /**
     * Creates an in-memory System object which can be used in a TypeScript program, this
     * is what provides read/write aspects of the virtual fs
     */
    function createSystem(files) {
        return {
            args: [],
            createDirectory: () => notImplemented("createDirectory"),
            // TODO: could make a real file tree
            directoryExists: audit("directoryExists", directory => {
                return Array.from(files.keys()).some(path => path.startsWith(directory));
            }),
            exit: () => notImplemented("exit"),
            fileExists: audit("fileExists", fileName => files.has(fileName) || files.has(libize(fileName))),
            getCurrentDirectory: () => "/",
            getDirectories: () => [],
            getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
            readDirectory: audit("readDirectory", directory => (directory === "/" ? Array.from(files.keys()) : [])),
            readFile: audit("readFile", fileName => { var _a; return (_a = files.get(fileName)) !== null && _a !== void 0 ? _a : files.get(libize(fileName)); }),
            resolvePath: path => path,
            newLine: "\n",
            useCaseSensitiveFileNames: true,
            write: () => notImplemented("write"),
            writeFile: (fileName, contents) => {
                files.set(fileName, contents);
            },
            deleteFile: (fileName) => {
                files.delete(fileName);
            },
        };
    }
    /**
     * Creates a file-system backed System object which can be used in a TypeScript program, you provide
     * a set of virtual files which are prioritised over the FS versions, then a path to the root of your
     * project (basically the folder your node_modules lives)
     */
    function createFSBackedSystem(files, _projectRoot, ts, tsLibDirectory) {
        // We need to make an isolated folder for the tsconfig, but also need to be able to resolve the
        // existing node_modules structures going back through the history
        const root = _projectRoot + "/vfs";
        const path = requirePath();
        // The default System in TypeScript
        const nodeSys = ts.sys;
        const tsLib = tsLibDirectory !== null && tsLibDirectory !== void 0 ? tsLibDirectory : path.dirname(require.resolve("typescript"));
        return {
            // @ts-ignore
            name: "fs-vfs",
            root,
            args: [],
            createDirectory: () => notImplemented("createDirectory"),
            // TODO: could make a real file tree
            directoryExists: audit("directoryExists", directory => {
                return Array.from(files.keys()).some(path => path.startsWith(directory)) || nodeSys.directoryExists(directory);
            }),
            exit: nodeSys.exit,
            fileExists: audit("fileExists", fileName => {
                if (files.has(fileName))
                    return true;
                // Don't let other tsconfigs end up touching the vfs
                if (fileName.includes("tsconfig.json") || fileName.includes("tsconfig.json"))
                    return false;
                if (fileName.startsWith("/lib")) {
                    const tsLibName = `${tsLib}/${fileName.replace("/", "")}`;
                    return nodeSys.fileExists(tsLibName);
                }
                return nodeSys.fileExists(fileName);
            }),
            getCurrentDirectory: () => root,
            getDirectories: nodeSys.getDirectories,
            getExecutingFilePath: () => notImplemented("getExecutingFilePath"),
            readDirectory: audit("readDirectory", (...args) => {
                if (args[0] === "/") {
                    return Array.from(files.keys());
                }
                else {
                    return nodeSys.readDirectory(...args);
                }
            }),
            readFile: audit("readFile", fileName => {
                if (files.has(fileName))
                    return files.get(fileName);
                if (fileName.startsWith("/lib")) {
                    const tsLibName = `${tsLib}/${fileName.replace("/", "")}`;
                    const result = nodeSys.readFile(tsLibName);
                    if (!result) {
                        const libs = nodeSys.readDirectory(tsLib);
                        throw new Error(`TSVFS: A request was made for ${tsLibName} but there wasn't a file found in the file map. You likely have a mismatch in the compiler options for the CDN download vs the compiler program. Existing Libs: ${libs}.`);
                    }
                    return result;
                }
                return nodeSys.readFile(fileName);
            }),
            resolvePath: path => {
                if (files.has(path))
                    return path;
                return nodeSys.resolvePath(path);
            },
            newLine: "\n",
            useCaseSensitiveFileNames: true,
            write: () => notImplemented("write"),
            writeFile: (fileName, contents) => {
                files.set(fileName, contents);
            },
            deleteFile: (fileName) => {
                files.delete(fileName);
            },
            realpath: nodeSys.realpath,
        };
    }
    /**
     * Creates an in-memory CompilerHost -which is essentially an extra wrapper to System
     * which works with TypeScript objects - returns both a compiler host, and a way to add new SourceFile
     * instances to the in-memory file system.
     */
    function createVirtualCompilerHost(sys, compilerOptions, ts) {
        const sourceFiles = new Map();
        const save = (sourceFile) => {
            sourceFiles.set(sourceFile.fileName, sourceFile);
            return sourceFile;
        };
        const vHost = {
            compilerHost: Object.assign(Object.assign({}, sys), { getCanonicalFileName: fileName => fileName, getDefaultLibFileName: () => "/" + ts.getDefaultLibFileName(compilerOptions), 
                // getDefaultLibLocation: () => '/',
                getNewLine: () => sys.newLine, getSourceFile: (fileName, languageVersionOrOptions) => {
                    var _a;
                    return (sourceFiles.get(fileName) ||
                        save(ts.createSourceFile(fileName, sys.readFile(fileName), (_a = languageVersionOrOptions !== null && languageVersionOrOptions !== void 0 ? languageVersionOrOptions : compilerOptions.target) !== null && _a !== void 0 ? _a : defaultCompilerOptions(ts).target, false)));
                }, useCaseSensitiveFileNames: () => sys.useCaseSensitiveFileNames }),
            updateFile: sourceFile => {
                const alreadyExists = sourceFiles.has(sourceFile.fileName);
                sys.writeFile(sourceFile.fileName, sourceFile.text);
                sourceFiles.set(sourceFile.fileName, sourceFile);
                return alreadyExists;
            },
            deleteFile: sourceFile => {
                const alreadyExists = sourceFiles.has(sourceFile.fileName);
                sourceFiles.delete(sourceFile.fileName);
                sys.deleteFile(sourceFile.fileName);
                return alreadyExists;
            }
        };
        return vHost;
    }
    /**
     * Creates an object which can host a language service against the virtual file-system
     */
    function createVirtualLanguageServiceHost(sys, rootFiles, compilerOptions, ts, customTransformers) {
        const fileNames = [...rootFiles];
        const { compilerHost, updateFile, deleteFile } = createVirtualCompilerHost(sys, compilerOptions, ts);
        const fileVersions = new Map();
        let projectVersion = 0;
        const languageServiceHost = Object.assign(Object.assign({}, compilerHost), { getProjectVersion: () => projectVersion.toString(), getCompilationSettings: () => compilerOptions, getCustomTransformers: () => customTransformers, 
            // A couple weeks of 4.8 TypeScript nightlies had a bug where the Program's
            // list of files was just a reference to the array returned by this host method,
            // which means mutations by the host that ought to result in a new Program being
            // created were not detected, since the old list of files and the new list of files
            // were in fact a reference to the same underlying array. That was fixed in
            // https://github.com/microsoft/TypeScript/pull/49813, but since the twoslash runner
            // is used in bisecting for changes, it needs to guard against being busted in that
            // couple-week period, so we defensively make a slice here.
            getScriptFileNames: () => fileNames.slice(), getScriptSnapshot: fileName => {
                const contents = sys.readFile(fileName);
                if (contents && typeof contents === "string") {
                    return ts.ScriptSnapshot.fromString(contents);
                }
                return;
            }, getScriptVersion: fileName => {
                return fileVersions.get(fileName) || "0";
            }, writeFile: sys.writeFile });
        const lsHost = {
            languageServiceHost,
            updateFile: sourceFile => {
                projectVersion++;
                fileVersions.set(sourceFile.fileName, projectVersion.toString());
                if (!fileNames.includes(sourceFile.fileName)) {
                    fileNames.push(sourceFile.fileName);
                }
                updateFile(sourceFile);
            },
            deleteFile: sourceFile => {
                projectVersion++;
                fileVersions.set(sourceFile.fileName, projectVersion.toString());
                const index = fileNames.indexOf(sourceFile.fileName);
                if (index !== -1) {
                    fileNames.splice(index, 1);
                }
                deleteFile(sourceFile);
            }
        };
        return lsHost;
    }
    const requirePath = () => {
        return require(String.fromCharCode(112, 97, 116, 104));
    };
    const requireFS = () => {
        return require(String.fromCharCode(102, 115));
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXNjcmlwdC12ZnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zYW5kYm94L3NyYy92ZW5kb3IvdHlwZXNjcmlwdC12ZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQWdEQSxnRkE2REM7SUErV0Qsb0NBMEJDO0lBT0Qsb0RBNEVDO0lBT0QsOERBaURDO0lBS0QsNEVBaUVDO0lBcHJCRCxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7SUFDM0IsSUFBSSxDQUFDO1FBQ0gsZUFBZSxHQUFHLE9BQU8sWUFBWSxLQUFLLFdBQVcsQ0FBQTtJQUN2RCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFbkIsTUFBTSxVQUFVLEdBQUcsT0FBTyxPQUFPLEtBQUssV0FBVyxDQUFBO0lBQ2pELE1BQU0sV0FBVyxHQUFHLENBQUMsZUFBZSxJQUFJLFlBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQzVHLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFjLEVBQUUsR0FBRyxlQUFzQixFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUE7SUFXOUY7Ozs7Ozs7OztPQVNHO0lBRUgsU0FBZ0Isa0NBQWtDLENBQ2hELEdBQVcsRUFDWCxTQUFtQixFQUNuQixFQUFNLEVBQ04sa0JBQW1DLEVBQUUsRUFDckMsa0JBQXVDO1FBRXZDLE1BQU0sa0JBQWtCLG1DQUFRLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxHQUFLLGVBQWUsQ0FBRSxDQUFBO1FBRWhGLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsZ0NBQWdDLENBQ3RGLEdBQUcsRUFDSCxTQUFTLEVBQ1Qsa0JBQWtCLEVB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LEVBQUUsQ0FBQyxDQUFDLENBQUE7Z0JBQzVCLENBQUM7Z0JBQ0QsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ3hCLENBQUM7U0FDRixDQUFBO1FBQ0QsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRUQsTUFBTSxXQUFXLEdBQUcsR0FBRyxFQUFFO1FBQ3ZCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQTBCLENBQUE7SUFDakYsQ0FBQyxDQUFBO0lBRUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxFQUFFO1FBQ3JCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUF3QixDQUFBO0lBQ3RFLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInR5cGUgU3lzdGVtID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5TeXN0ZW1cbnR5cGUgQ29tcGlsZXJPcHRpb25zID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5Db21waWxlck9wdGlvbnNcbnR5cGUgQ3VzdG9tVHJhbnNmb3JtZXJzID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5DdXN0b21UcmFuc2Zvcm1lcnNcbnR5cGUgTGFuZ3VhZ2VTZXJ2aWNlSG9zdCA9IGltcG9ydChcInR5cGVzY3JpcHRcIikuTGFuZ3VhZ2VTZXJ2aWNlSG9zdFxudHlwZSBDb21waWxlckhvc3QgPSBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLkNvbXBpbGVySG9zdFxudHlwZSBTb3VyY2VGaWxlID0gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5Tb3VyY2VGaWxlXG50eXBlIFRTID0gdHlwZW9mIGltcG9ydChcInR5cGVzY3JpcHRcIilcblxudHlwZSBGZXRjaExpa2UgPSAodXJsOiBzdHJpbmcpID0+IFByb21pc2U8eyBqc29uKCk6IFByb21pc2U8YW55PjsgdGV4dCgpOiBQcm9taXNlPHN0cmluZz4gfT5cblxuaW50ZXJmYWNlIExvY2FsU3RvcmFnZUxpa2Uge1xuICBnZXRJdGVtKGtleTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbFxuICBzZXRJdGVtKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZFxuICByZW1vdmVJdGVtKGtleTogc3RyaW5nKTogdm9pZFxufVxuXG5kZWNsYXJlIHZhciBsb2NhbFN0b3JhZ2U6IExvY2FsU3RvcmFnZUxpa2UgfCB1bmRlZmluZWQ7XG5kZWNsYXJlIHZhciBmZXRjaDogRmV0Y2hMaWtlIHwgdW5kZWZpbmVkO1xuXG5sZXQgaGFzTG9jYWxTdG9yYWdlID0gZmFsc2VcbnRyeSB7XG4gIGhhc0xvY2FsU3RvcmFnZSA9IHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IGB1bmRlZmluZWRgXG59IGNhdGNoIChlcnJvcikgeyB9XG5cbmNvbnN0IGhhc1Byb2Nlc3MgPSB0eXBlb2YgcHJvY2VzcyAhPT0gYHVuZGVmaW5lZGBcbmNvbnN0IHNob3VsZERlYnVnID0gKGhhc0xvY2FsU3RvcmFnZSAmJiBsb2NhbFN0b3JhZ2UhLmdldEl0ZW0oXCJERUJVR1wiKSkgfHwgKGhhc1Byb2Nlc3MgJiYgcHJvY2Vzcy5lbnYuREVCVUcpXG5jb25zdCBkZWJ1Z0xvZyA9IHNob3VsZERlYnVnID8gY29uc29sZS5sb2cgOiAoX21lc3NhZ2U/OiBhbnksIC4uLl9vcHRpb25hbFBhcmFtczogYW55W10pID0+IFwiXCJcblxuZXhwb3J0IGludGVyZmFjZSBWaXJ0dWFsVHlwZVNjcmlwdEVudmlyb25tZW50IHtcbiAgc3lzOiBTeXN0ZW1cbiAgbGFuZ3VhZ2VTZXJ2aWNlOiBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLkxhbmd1YWdlU2VydmljZVxuICBnZXRTb3VyY2VGaWxlOiAoZmlsZU5hbWU6IHN0cmluZykgPT4gaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5Tb3VyY2VGaWxlIHwgdW5kZWZpbmVkXG4gIGNyZWF0ZUZpbGU6IChmaWxlTmFtZTogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpID0+IHZvaWRcbiAgdXBkYXRlRmlsZTogKGZpbGVOYW1lOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgcmVwbGFjZVRleHRTcGFuPzogaW1wb3J0KFwidHlwZXNjcmlwdFwiKS5UZXh0U3BhbikgPT4gdm9pZFxuICBkZWxldGVGaWxlOiAoZmlsZU5hbWU6IHN0cmluZykgPT4gdm9pZFxufVxuXG4vKipcbiAqIE1ha2VzIGEgdmlydHVhbCBjb3B5IG9mIHRoZSBUeXBlU2NyaXB0IGVudmlyb25tZW50LiBUaGlzIGlzIHRoZSBtYWluIEFQSSB5b3Ugd2FudCB0byBiZSB1c2luZyB3aXRoXG4gKiBAdHlwZXNjcmlwdC92ZnMuIEEgbG90IG9mIHRoZSBvdGhlciBleHBvc2VkIGZ1bmN0aW9ucyBhcmUgdXNlZCBieSB0aGlzIGZ1bmN0aW9uIHRvIGdldCBzZXQgdXAuXG4gKlxuICogQHBhcmFtIHN5cyBhbiBvYmplY3Qgd2hpY2ggY29uZm9ybXMgdG8gdGhlIFRTIFN5cyAoYSBzaGltIG92ZXIgcmVhZC93cml0ZSBhY2Nlc3MgdG8gdGhlIGZzKVxuICogQHBhcmFtIHJvb3RGaWxlcyBhIGxpc3Qgb2YgZmlsZXMgd2hpY2ggYXJlIGNvbnNpZGVyZWQgaW5zaWRlIHRoZSBwcm9qZWN0XG4gKiBAcGFyYW0gdHMgYSBjb3B5IHBmIHRoZSBUeXBlU2NyaXB0IG1vZHVsZVxuICogQHBhcmFtIGNvbXBpbGVyT3B0aW9ucyB0aGUgb3B0aW9ucyBmb3IgdGhpcyBjb21waWxlciBydW5cbiAqIEBwYXJhbSBjdXN0b21UcmFuc2Zvcm1lcnMgY3VzdG9tIHRyYW5zZm9ybWVycyBmb3IgdGhpcyBjb21waWxlciBydW5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlydHVhbFR5cGVTY3JpcHRFbnZpcm9ubWVudChcbiAgc3lzOiBTeXN0ZW0sXG4gIHJvb3RGaWxlczogc3RyaW5nW10sXG4gIHRzOiBUUyxcbiAgY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMgPSB7fSxcbiAgY3VzdG9tVHJhbnNmb3JtZXJzPzogQ3VzdG9tVHJhbnNmb3JtZXJzXG4pOiBWaXJ0dWFsVHlwZVNjcmlwdEVudmlyb25tZW50IHtcbiAgY29uc3QgbWVyZ2VkQ29tcGlsZXJPcHRzID0geyAuLi5kZWZhdWx0Q29tcGlsZXJPcHRpb25zKHRzKSwgLi4uY29tcGlsZXJPcHRpb25zIH1cblxuICBjb25zdCB7IGxhbmd1YWdlU2VydmljZUhvc3QsIHVwZGF0ZUZpbGUsIGRlbGV0ZUZpbGUgfSA9IGNyZWF0ZVZpcnR1YWxMYW5ndWFnZVNlcnZpY2VIb3N0KFxuICAgIHN5cyxcbiAgICByb290RmlsZXMsXG4gICAgbWVyZ2VkQ29tcGlsZXJPcHRzLFxuICAgIHRzLFxuICAgIGN1c3RvbVRyYW5zZm9ybWVyc1xuICApXG4gIGNvbnN0IGxhbmd1YWdlU2VydmljZSA9IHRzLmNyZWF0ZUxhbmd1YWdlU2VydmljZShsYW5ndWFnZVNlcnZpY2VIb3N0KVxuICBjb25zdCBkaWFnbm9zdGljcyA9IGxhbmd1YWdlU2VydmljZS5nZXRDb21waWxlck9wdGlvbnNEaWFnbm9zdGljcygpXG5cbiAgaWYgKGRpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgIGNvbnN0IGNvbXBpbGVySG9zdCA9IGNyZWF0ZVZpcnR1YWxDb21waWxlckhvc3Qoc3lzLCBjb21waWxlck9wdGlvbnMsIHRzKVxuICAgIHRocm93IG5ldyBFcnJvcih0cy5mb3JtYXREaWFnbm9zdGljcyhkaWFnbm9zdGljcywgY29tcGlsZXJIb3N0LmNvbXBpbGVySG9zdCkpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBuYW1lOiBcInZmc1wiLFxuICAgIHN5cyxcbiAgICBsYW5ndWFnZVNlcnZpY2UsXG4gICAgZ2V0U291cmNlRmlsZTogZmlsZU5hbWUgPT4gbGFuZ3VhZ2VTZXJ2aWNlLmdldFByb2dyYW0oKT8uZ2V0U291cmNlRmlsZShmaWxlTmFtZSksXG5cbiAgICBjcmVhdGVGaWxlOiAoZmlsZU5hbWUsIGNvbnRlbnQpID0+IHtcbiAgICAgIHVwZGF0ZUZpbGUodHMuY3JlYXRlU291cmNlRmlsZShmaWxlTmFtZSwgY29udGVudCwgbWVyZ2VkQ29tcGlsZXJPcHRzLnRhcmdldCEsIGZhbHNlKSlcbiAgICB9LFxuICAgIHVwZGF0ZUZpbGU6IChmaWxlTmFtZSwgY29udGVudCwgb3B0UHJldlRleHRTcGFuKSA9PiB7XG4gICAgICBjb25zdCBwcmV2U291cmNlRmlsZSA9IGxhbmd1YWdlU2VydmljZS5nZXRQcm9ncmFtKCkhLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpXG4gICAgICBpZiAoIXByZXZTb3VyY2VGaWxlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRpZCBub3QgZmluZCBhIHNvdXJjZSBmaWxlIGZvciBcIiArIGZpbGVOYW1lKVxuICAgICAgfVxuICAgICAgY29uc3QgcHJldkZ1bGxDb250ZW50cyA9IHByZXZTb3VyY2VGaWxlLnRleHRcblxuICAgICAgLy8gVE9ETzogVmFsaWRhdGUgaWYgdGhlIGRlZmF1bHQgdGV4dCBzcGFuIGhhcyBhIGZlbmNlcG9zdCBlcnJvcj9cbiAgICAgIGNvbnN0IHByZXZUZXh0U3BhbiA9IG9wdFByZXZUZXh0U3BhbiA/PyB0cy5jcmVhdGVUZXh0U3BhbigwLCBwcmV2RnVsbENvbnRlbnRzLmxlbmd0aClcbiAgICAgIGNvbnN0IG5ld1RleHQgPVxuICAgICAgICBwcmV2RnVsbENvbnRlbnRzLnNsaWNlKDAsIHByZXZUZXh0U3Bhbi5zdGFydCkgK1xuICAgICAgICBjb250ZW50ICtcbiAgICAgICAgcHJldkZ1bGxDb250ZW50cy5zbGljZShwcmV2VGV4dFNwYW4uc3RhcnQgKyBwcmV2VGV4dFNwYW4ubGVuZ3RoKVxuICAgICAgY29uc3QgbmV3U291cmNlRmlsZSA9IHRzLnVwZGF0ZVNvdXJjZUZpbGUocHJldlNvdXJjZUZpbGUsIG5ld1RleHQsIHtcbiAgICAgICAgc3BhbjogcHJldlRleHRTcGFuLFxuICAgICAgICBuZXdMZW5ndGg6IGNvbnRlbnQubGVuZ3RoLFxuICAgICAgfSlcblxuICAgICAgdXBkYXRlRmlsZShuZXdTb3VyY2VGaWxlKVxuICAgIH0sXG4gICAgZGVsZXRlRmlsZShmaWxlTmFtZSkge1xuICAgICAgY29uc3Qgc291cmNlRmlsZSA9IGxhbmd1YWdlU2VydmljZS5nZXRQcm9ncmFtKCkhLmdldFNvdXJjZUZpbGUoZmlsZU5hbWUpXG4gICAgICBpZiAoc291cmNlRmlsZSkge1xuICAgICAgICBkZWxldGVGaWxlKHNvdXJjZUZpbGUpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFRPRE86IFRoaXMgY291bGQgYmUgcmVwbGFjZWQgYnkgZ3JhYmJpbmc6IGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9ibG9iL21haW4vc3JjL2xpYi9saWJzLmpzb25cbi8vIGFuZCB0aGVuIHVzaW5nIHRoYXQgdG8gZ2VuZXJhdGUgdGhlIGxpc3Qgb2YgZmlsZXMgZnJvbSB0aGUgc2VydmVyLCBidXQgaXQgaXMgbm90IGluY2x1ZGVkIGluIHRoZSBucG0gcGFja2FnZVxuXG4vKipcbiAqIEdyYWIgdGhlIGxpc3Qgb2YgbGliIGZpbGVzIGZvciBhIHBhcnRpY3VsYXIgdGFyZ2V0LCB3aWxsIHJldHVybiBhIGJpdCBtb3JlIHRoYW4gbmVjZXNzYXJ5IChieSBpbmNsdWRpbmdcbiAqIHRoZSBkb20pIGJ1dCB0aGF0J3MgT0ssIHdlJ3JlIHJlYWxseSB3b3JraW5nIHdpdGggdGhlIGNvbnN0cmFpbnQgdGhhdCB5b3UgY2FuJ3QgZ2V0IGEgbGlzdCBvZiBmaWxlc1xuICogd2hlbiBydW5uaW5nIGluIGEgYnJvd3Nlci5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSBjb21waWxlciBzZXR0aW5ncyB0YXJnZXQgYmFzZWxpbmVcbiAqIEBwYXJhbSB0cyBBIGNvcHkgb2YgdGhlIFR5cGVTY3JpcHQgbW9kdWxlXG4gKi9cbmV4cG9ydCBjb25zdCBrbm93bkxpYkZpbGVzRm9yQ29tcGlsZXJPcHRpb25zID0gKGNvbXBpbGVyT3B0aW9uczogQ29tcGlsZXJPcHRpb25zLCB0czogVFMpID0+IHtcbiAgY29uc3QgdGFyZ2V0ID0gY29tcGlsZXJPcHRpb25zLnRhcmdldCB8fCB0cy5TY3JpcHRUYXJnZXQuRVM1XG4gIGNvbnN0IGxpYiA9IGNvbXBpbGVyT3B0aW9ucy5saWIgfHwgW11cblxuICAvLyBOb3RlIHRoYXQgdGhpcyB3aWxsIGluY2x1ZGUgZmlsZXMgd2hpY2ggY2FuJ3QgYmUgZm91bmQgZm9yIHBhcnRpY3VsYXIgdmVyc2lvbnMgb2YgVFNcbiAgLy8gVE9ETzogUmVwbGFjZSB0aGlzIHdpdGggc29tZSBzb3J0IG9mIEFQSSBjYWxsIGlmIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9wdWxsLzU0MDExXG4gIC8vIG9yIHNpbWlsYXIgaXMgbWVyZ2VkLlxuICBjb25zdCBmaWxlcyA9IFtcbiAgICBcImxpYi5kLnRzXCIsXG4gICAgXCJsaWIuY29yZS5kLnRzXCIsXG4gICAgXCJsaWIuZGVjb3JhdG9ycy5kLnRzXCIsXG4gICAgXCJsaWIuZGVjb3JhdG9ycy5sZWdhY3kuZC50c1wiLFxuICAgIFwibGliLmRvbS5hc3luY2l0ZXJhYmxlLmQudHNcIixcbiAgICBcImxpYi5kb20uZC50c1wiLFxuICAgIFwibGliLmRvbS5pdGVyYWJsZS5kLnRzXCIsXG4gICAgXCJsaWIud2Vid29ya2VyLmFzeW5jaXRlcmFibGUuZC50c1wiLFxuICAgIFwibGliLndlYndvcmtlci5kLnRzXCIsXG4gICAgXCJsaWIud2Vid29ya2VyLmltcG9ydHNjcmlwdHMuZC50c1wiLFxuICAgIFwibGliLndlYndvcmtlci5pdGVyYWJsZS5kLnRzXCIsXG4gICAgXCJsaWIuc2NyaXB0aG9zdC5kLnRzXCIsXG4gICAgXCJsaWIuZXM1LmQudHNcIixcbiAgICBcImxpYi5lczYuZC50c1wiLFxuICAgIFwibGliLmVzNy5kLnRzXCIsXG4gICAgXCJsaWIuY29yZS5lczYuZC50c1wiLFxuICAgIFwibGliLmNvcmUuZXM3LmQudHNcIixcbiAgICBcImxpYi5lczIwMTUuY29sbGVjdGlvbi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LmNvcmUuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LmdlbmVyYXRvci5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1Lml0ZXJhYmxlLmQudHNcIixcbiAgICBcImxpYi5lczIwMTUucHJvbWlzZS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LnByb3h5LmQudHNcIixcbiAgICBcImxpYi5lczIwMTUucmVmbGVjdC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LnN5bWJvbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE1LnN5bWJvbC53ZWxsa25vd24uZC50c1wiLFxuICAgIFwibGliLmVzMjAxNi5hcnJheS5pbmNsdWRlLmQudHNcIixcbiAgICBcImxpYi5lczIwMTYuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNi5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lczIwMTYuaW50bC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE3LmFycmF5YnVmZmVyLmQudHNcIixcbiAgICBcImxpYi5lczIwMTcuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5kYXRlLmQudHNcIixcbiAgICBcImxpYi5lczIwMTcuZnVsbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE3LmludGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5vYmplY3QuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5zaGFyZWRtZW1vcnkuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy5zdHJpbmcuZC50c1wiLFxuICAgIFwibGliLmVzMjAxNy50eXBlZGFycmF5cy5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LmFzeW5jZ2VuZXJhdG9yLmQudHNcIixcbiAgICBcImxpYi5lczIwMTguYXN5bmNpdGVyYWJsZS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LmQudHNcIixcbiAgICBcImxpYi5lczIwMTguZnVsbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE4LmludGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOC5wcm9taXNlLmQudHNcIixcbiAgICBcImxpYi5lczIwMTgucmVnZXhwLmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuYXJyYXkuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOS5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDE5LmZ1bGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAxOS5pbnRsLmQudHNcIixcbiAgICBcImxpYi5lczIwMTkub2JqZWN0LmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMTkuc3ltYm9sLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuYmlnaW50LmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5kYXRlLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuZnVsbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIwLmludGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5udW1iZXIuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMC5wcm9taXNlLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuc2hhcmVkbWVtb3J5LmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMjAuc3ltYm9sLndlbGxrbm93bi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIxLmQudHNcIixcbiAgICBcImxpYi5lczIwMjEuZnVsbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIxLmludGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMS5wcm9taXNlLmQudHNcIixcbiAgICBcImxpYi5lczIwMjEuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMjEud2Vha3JlZi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIyLmFycmF5LmQudHNcIixcbiAgICBcImxpYi5lczIwMjIuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMi5lcnJvci5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDIyLmZ1bGwuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMi5pbnRsLmQudHNcIixcbiAgICBcImxpYi5lczIwMjIub2JqZWN0LmQudHNcIixcbiAgICBcImxpYi5lczIwMjIucmVnZXhwLmQudHNcIixcbiAgICBcImxpYi5lczIwMjIuc2hhcmVkbWVtb3J5LmQudHNcIixcbiAgICBcImxpYi5lczIwMjIuc3RyaW5nLmQudHNcIixcbiAgICBcImxpYi5lczIwMjMuYXJyYXkuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMy5jb2xsZWN0aW9uLmQudHNcIixcbiAgICBcImxpYi5lczIwMjMuZC50c1wiLFxuICAgIFwibGliLmVzMjAyMy5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lczIwMjMuaW50bC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDI0LmFycmF5YnVmZmVyLmQudHNcIixcbiAgICBcImxpYi5lczIwMjQuY29sbGVjdGlvbi5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDI0LmQudHNcIixcbiAgICBcImxpYi5lczIwMjQuZnVsbC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDI0Lm9iamVjdC5kLnRzXCIsXG4gICAgXCJsaWIuZXMyMDI0LnByb21pc2UuZC50c1wiLFxuICAgIFwibGliLmVzMjAyNC5yZWdleHAuZC50c1wiLFxuICAgIFwibGliLmVzMjAyNC5zaGFyZWRtZW1vcnkuZC50c1wiLFxuICAgIFwibGliLmVzMjAyNC5zdHJpbmcuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5hcnJheS5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LmFzeW5jaXRlcmFibGUuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5iaWdpbnQuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5jb2xsZWN0aW9uLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5kZWNvcmF0b3JzLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuZGlzcG9zYWJsZS5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LmZsb2F0MTYuZC50c1wiLFxuICAgIFwibGliLmVzbmV4dC5mdWxsLmQudHNcIixcbiAgICBcImxpYi5lc25leHQuaW50bC5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0Lml0ZXJhdG9yLmQudHNcIixcbiAgICBcImxpYi5lc25leHQub2JqZWN0LmQudHNcIixcbiAgICBcImxpYi5lc25leHQucHJvbWlzZS5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LnJlZ2V4cC5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LnN0cmluZy5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LnN5bWJvbC5kLnRzXCIsXG4gICAgXCJsaWIuZXNuZXh0LndlYWtyZWYuZC50c1wiXG4gIF1cblxuICBjb25zdCB0YXJnZXRUb0N1dCA9IHRzLlNjcmlwdFRhcmdldFt0YXJnZXRdXG4gIGNvbnN0IG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBmLnN0YXJ0c1dpdGgoYGxpYi4ke3RhcmdldFRvQ3V0LnRvTG93ZXJDYXNlKCl9YCkpXG4gIGNvbnN0IHRhcmdldEN1dEluZGV4ID0gZmlsZXMuaW5kZXhPZihtYXRjaGVzLnBvcCgpISlcblxuICBjb25zdCBnZXRNYXggPSAoYXJyYXk6IG51bWJlcltdKSA9PlxuICAgIGFycmF5ICYmIGFycmF5Lmxlbmd0aCA/IGFycmF5LnJlZHVjZSgobWF4LCBjdXJyZW50KSA9PiAoY3VycmVudCA+IG1heCA/IGN1cnJlbnQgOiBtYXgpKSA6IHVuZGVmaW5lZFxuXG4gIC8vIEZpbmQgdGhlIGluZGV4IGZvciBldmVyeXRoaW5nIGluXG4gIGNvbnN0IGluZGV4ZXNGb3JDdXR0aW5nID0gbGliLm1hcChsaWIgPT4ge1xuICAgIGNvbnN0IG1hdGNoZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBmLnN0YXJ0c1dpdGgoYGxpYi4ke2xpYi50b0xvd2VyQ2FzZSgpfWApKVxuICAgIGlmIChtYXRjaGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAgIGNvbnN0IGN1dEluZGV4ID0gZmlsZXMuaW5kZXhPZihtYXRjaGVzLnBvcCgpISlcbiAgICByZXR1cm4gY3V0SW5kZXhcbiAgfSlcblxuICBjb25zdCBsaWJDdXRJbmRleCA9IGdldE1heChpbmRleGVzRm9yQ3V0dGluZykgfHwgMFxuXG4gIGNvbnN0IGZpbmFsQ3V0SW5kZXggPSBNYXRoLm1heCh0YXJnZXRDdXRJbmRleCwgbGliQ3V0SW5kZXgpXG4gIHJldHVybiBmaWxlcy5zbGljZSgwLCBmaW5hbEN1dEluZGV4ICsgMSlcbn1cblxuLyoqXG4gKiBTZXRzIHVwIGEgTWFwIHdpdGggbGliIGNvbnRlbnRzIGJ5IGdyYWJiaW5nIHRoZSBuZWNlc3NhcnkgZmlsZXMgZnJvbVxuICogdGhlIGxvY2FsIGNvcHkgb2YgdHlwZXNjcmlwdCB2aWEgdGhlIGZpbGUgc3lzdGVtLlxuICpcbiAqIFRoZSBmaXJzdCB0d28gYXJncyBhcmUgdW4tdXNlZCwgYnV0IGtlcHQgYXJvdW5kIHNvIGFzIHRvIG5vdCBjYXVzZSBhXG4gKiBzZW12ZXIgbWFqb3IgYnVtcCBmb3Igbm8gZ2FpbiB0byBtb2R1bGUgdXNlcnMuXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVEZWZhdWx0TWFwRnJvbU5vZGVNb2R1bGVzID0gKFxuICBfY29tcGlsZXJPcHRpb25zOiBDb21waWxlck9wdGlvbnMsXG4gIF90cz86IHR5cGVvZiBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLFxuICB0c0xpYkRpcmVjdG9yeT86IHN0cmluZ1xuKSA9PiB7XG4gIGNvbnN0IHBhdGggPSByZXF1aXJlUGF0aCgpXG4gIGNvbnN0IGZzID0gcmVxdWlyZUZTKClcblxuICBjb25zdCBnZXRMaWIgPSAobmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbGliID0gdHNMaWJEaXJlY3RvcnkgfHwgcGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZShcInR5cGVzY3JpcHRcIikpXG4gICAgcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4obGliLCBuYW1lKSwgXCJ1dGY4XCIpXG4gIH1cblxuICBjb25zdCBpc0R0c0ZpbGUgPSAoZmlsZTogc3RyaW5nKSA9PiAvXFwuZFxcLihbXlxcLl0rXFwuKT9bY21dP3RzJC9pLnRlc3QoZmlsZSlcblxuICBjb25zdCBsaWJGaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHRzTGliRGlyZWN0b3J5IHx8IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoXCJ0eXBlc2NyaXB0XCIpKSlcbiAgY29uc3Qga25vd25MaWJGaWxlcyA9IGxpYkZpbGVzLmZpbHRlcihmID0+IGYuc3RhcnRzV2l0aChcImxpYi5cIikgJiYgaXNEdHNGaWxlKGYpKVxuXG4gIGNvbnN0IGZzTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKVxuICBrbm93bkxpYkZpbGVzLmZvckVhY2gobGliID0+IHtcbiAgICBmc01hcC5zZXQoXCIvXCIgKyBsaWIsIGdldExpYihsaWIpKVxuICB9KVxuICByZXR1cm4gZnNNYXBcbn1cblxuLyoqXG4gKiBBZGRzIHJlY3Vyc2l2ZWx5IGZpbGVzIGZyb20gdGhlIEZTIGludG8gdGhlIG1hcCBiYXNlZCBvbiB0aGUgZm9sZGVyXG4gKi9cbmV4cG9ydCBjb25zdCBhZGRBbGxGaWxlc0Zyb21Gb2xkZXIgPSAobWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+LCB3b3JraW5nRGlyOiBzdHJpbmcpOiB2b2lkID0+IHtcbiAgY29uc3QgcGF0aCA9IHJlcXVpcmVQYXRoKClcbiAgY29uc3QgZnMgPSByZXF1aXJlRlMoKVxuXG4gIGNvbnN0IHdhbGsgPSBmdW5jdGlvbiAoZGlyOiBzdHJpbmcpIHtcbiAgICBsZXQgcmVzdWx0czogc3RyaW5nW10gPSBbXVxuICAgIGNvbnN0IGxpc3QgPSBmcy5yZWFkZGlyU3luYyhkaXIpXG4gICAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlOiBzdHJpbmcpIHtcbiAgICAgIGZpbGUgPSBwYXRoLmpvaW4oZGlyLCBmaWxlKVxuICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZpbGUpXG4gICAgICBpZiAoc3RhdCAmJiBzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgLyogUmVjdXJzZSBpbnRvIGEgc3ViZGlyZWN0b3J5ICovXG4gICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdCh3YWxrKGZpbGUpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLyogSXMgYSBmaWxlICovXG4gICAgICAgIHJlc3VsdHMucHVzaChmaWxlKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIGNvbnN0IGFsbEZpbGVzID0gd2Fsayh3b3JraW5nRGlyKVxuXG4gIGFsbEZpbGVzLmZvckVhY2gobGliID0+IHtcbiAgICBjb25zdCBmc1BhdGggPSBcIi9ub2RlX21vZHVsZXMvQHR5cGVzXCIgKyBsaWIucmVwbGFjZSh3b3JraW5nRGlyLCBcIlwiKVxuICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMobGliLCBcInV0ZjhcIilcbiAgICBjb25zdCB2YWxpZEV4dGVuc2lvbnMgPSBbXCIudHNcIiwgXCIudHN4XCJdXG5cbiAgICBpZiAodmFsaWRFeHRlbnNpb25zLmluY2x1ZGVzKHBhdGguZXh0bmFtZShmc1BhdGgpKSkge1xuICAgICAgbWFwLnNldChmc1BhdGgsIGNvbnRlbnQpXG4gICAgfVxuICB9KVxufVxuXG4vKiogQWRkcyBhbGwgZmlsZXMgZnJvbSBub2RlX21vZHVsZXMvQHR5cGVzIGludG8gdGhlIEZTIE1hcCAqL1xuZXhwb3J0IGNvbnN0IGFkZEZpbGVzRm9yVHlwZXNJbnRvRm9sZGVyID0gKG1hcDogTWFwPHN0cmluZywgc3RyaW5nPikgPT5cbiAgYWRkQWxsRmlsZXNGcm9tRm9sZGVyKG1hcCwgXCJub2RlX21vZHVsZXMvQHR5cGVzXCIpXG5cbmV4cG9ydCBpbnRlcmZhY2UgTFpTdHJpbmcge1xuICBjb21wcmVzc1RvVVRGMTYoaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xuICBkZWNvbXByZXNzRnJvbVVURjE2KGNvbXByZXNzZWQ6IHN0cmluZyk6IHN0cmluZ1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHZpcnR1YWwgRlMgTWFwIHdpdGggdGhlIGxpYiBmaWxlcyBmcm9tIGEgcGFydGljdWxhciBUeXBlU2NyaXB0XG4gKiB2ZXJzaW9uIGJhc2VkIG9uIHRoZSB0YXJnZXQsIEFsd2F5cyBpbmNsdWRlcyBkb20gQVRNLlxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBjb21waWxlciB0YXJnZXQsIHdoaWNoIGRpY3RhdGVzIHRoZSBsaWJzIHRvIHNldCB1cFxuICogQHBhcmFtIHZlcnNpb24gdGhlIHZlcnNpb25zIG9mIFR5cGVTY3JpcHQgd2hpY2ggYXJlIHN1cHBvcnRlZFxuICogQHBhcmFtIGNhY2hlIHNob3VsZCB0aGUgdmFsdWVzIGJlIHN0b3JlZCBpbiBsb2NhbCBzdG9yYWdlXG4gKiBAcGFyYW0gdHMgYSBjb3B5IG9mIHRoZSB0eXBlc2NyaXB0IGltcG9ydFxuICogQHBhcmFtIGx6c3RyaW5nIGFuIG9wdGlvbmFsIGNvcHkgb2YgdGhlIGx6LXN0cmluZyBpbXBvcnRcbiAqIEBwYXJhbSBmZXRjaGVyIGFuIG9wdGlvbmFsIHJlcGxhY2VtZW50IGZvciB0aGUgZ2xvYmFsIGZldGNoIGZ1bmN0aW9uICh0ZXN0cyBtYWlubHkpXG4gKiBAcGFyYW0gc3RvcmVyIGFuIG9wdGlvbmFsIHJlcGxhY2VtZW50IGZvciB0aGUgbG9jYWxTdG9yYWdlIGdsb2JhbCAodGVzdHMgbWFpbmx5KVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlRGVmYXVsdE1hcEZyb21DRE4gPSAoXG4gIG9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgdmVyc2lvbjogc3RyaW5nLFxuICBjYWNoZTogYm9vbGVhbixcbiAgdHM6IFRTLFxuICBsenN0cmluZz86IExaU3RyaW5nLFxuICBmZXRjaGVyPzogRmV0Y2hMaWtlLFxuICBzdG9yZXI/OiBMb2NhbFN0b3JhZ2VMaWtlXG4pID0+IHtcbiAgY29uc3QgZmV0Y2hsaWtlID0gZmV0Y2hlciB8fCBmZXRjaCFcbiAgY29uc3QgZnNNYXAgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpXG4gIGNvbnN0IGZpbGVzID0ga25vd25MaWJGaWxlc0ZvckNvbXBpbGVyT3B0aW9ucyhvcHRpb25zLCB0cylcbiAgY29uc3QgcHJlZml4ID0gYGh0dHBzOi8vcGxheWdyb3VuZGNkbi50eXBlc2NyaXB0bGFuZy5vcmcvY2RuLyR7dmVyc2lvbn0vdHlwZXNjcmlwdC9saWIvYFxuXG4gIGZ1bmN0aW9uIHppcChzdHI6IHN0cmluZykge1xuICAgIHJldHVybiBsenN0cmluZyA/IGx6c3RyaW5nLmNvbXByZXNzVG9VVEYxNihzdHIpIDogc3RyXG4gIH1cblxuICBmdW5jdGlvbiB1bnppcChzdHI6IHN0cmluZykge1xuICAgIHJldHVybiBsenN0cmluZyA/IGx6c3RyaW5nLmRlY29tcHJlc3NGcm9tVVRGMTYoc3RyKSA6IHN0clxuICB9XG5cbiAgLy8gTWFwIHRoZSBrbm93biBsaWJzIHRvIGEgbm9kZSBmZXRjaCBwcm9taXNlLCB0aGVuIHJldHVybiB0aGUgY29udGVudHNcbiAgZnVuY3Rpb24gdW5jYWNoZWQoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIFByb21pc2UuYWxsKGZpbGVzLm1hcChsaWIgPT4gZmV0Y2hsaWtlKHByZWZpeCArIGxpYikudGhlbihyZXNwID0+IHJlc3AudGV4dCgpKSkpXG4gICAgICAgIC50aGVuKGNvbnRlbnRzID0+IHtcbiAgICAgICAgICBjb250ZW50cy5mb3JFYWNoKCh0ZXh0LCBpbmRleCkgPT4gZnNNYXAuc2V0KFwiL1wiICsgZmlsZXNbaW5kZXhdLCB0ZXh0KSlcbiAgICAgICAgfSlcbiAgICAgICAgLy8gUmV0dXJuIGEgTk9PUCBmb3IgLmQudHMgZmlsZXMgd2hpY2ggYXJlbid0IGluIHRoZSBjdXJyZW50IGJ1aWxkIG9mIFR5cGVTY3JpcHRcbiAgICAgICAgLmNhdGNoKCgpID0+IHsgfSlcbiAgICApXG4gIH1cblxuICAvLyBBIGxvY2Fsc3RvcmFnZSBhbmQgbHp6aXAgYXdhcmUgdmVyc2lvbiBvZiB0aGUgbGliIGZpbGVzXG4gIGZ1bmN0aW9uIGNhY2hlZCgpIHtcbiAgICBjb25zdCBzdG9yZWxpa2UgPSBzdG9yZXIgfHwgbG9jYWxTdG9yYWdlIVxuXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN0b3JlbGlrZSlcbiAgICBrZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIC8vIFJlbW92ZSBhbnl0aGluZyB3aGljaCBpc24ndCBmcm9tIHRoaXMgdmVyc2lvblxuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKFwidHMtbGliLVwiKSAmJiAha2V5LnN0YXJ0c1dpdGgoXCJ0cy1saWItXCIgKyB2ZXJzaW9uKSkge1xuICAgICAgICBzdG9yZWxpa2UucmVtb3ZlSXRlbShrZXkpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgIGZpbGVzLm1hcChsaWIgPT4ge1xuICAgICAgICBjb25zdCBjYWNoZUtleSA9IGB0cy1saWItJHt2ZXJzaW9ufS0ke2xpYn1gXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBzdG9yZWxpa2UuZ2V0SXRlbShjYWNoZUtleSlcblxuICAgICAgICBpZiAoIWNvbnRlbnQpIHtcbiAgICAgICAgICAvLyBNYWtlIHRoZSBBUEkgY2FsbCBhbmQgc3RvcmUgdGhlIHRleHQgY29uY2VudCBpbiB0aGUgY2FjaGVcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgZmV0Y2hsaWtlKHByZWZpeCArIGxpYilcbiAgICAgICAgICAgICAgLnRoZW4ocmVzcCA9PiByZXNwLnRleHQoKSlcbiAgICAgICAgICAgICAgLnRoZW4odCA9PiB7XG4gICAgICAgICAgICAgICAgc3RvcmVsaWtlLnNldEl0ZW0oY2FjaGVLZXksIHppcCh0KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAvLyBSZXR1cm4gYSBOT09QIGZvciAuZC50cyBmaWxlcyB3aGljaCBhcmVuJ3QgaW4gdGhlIGN1cnJlbnQgYnVpbGQgb2YgVHlwZVNjcmlwdFxuICAgICAgICAgICAgICAuY2F0Y2goKCkgPT4geyB9KVxuICAgICAgICAgIClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuemlwKGNvbnRlbnQpKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICkudGhlbihjb250ZW50cyA9PiB7XG4gICAgICBjb250ZW50cy5mb3JFYWNoKCh0ZXh0LCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgIGNvbnN0IG5hbWUgPSBcIi9cIiArIGZpbGVzW2luZGV4XVxuICAgICAgICAgIGZzTWFwLnNldChuYW1lLCB0ZXh0KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBjb25zdCBmdW5jID0gY2FjaGUgPyBjYWNoZWQgOiB1bmNhY2hlZFxuICByZXR1cm4gZnVuYygpLnRoZW4oKCkgPT4gZnNNYXApXG59XG5cbmZ1bmN0aW9uIG5vdEltcGxlbWVudGVkKG1ldGhvZE5hbWU6IHN0cmluZyk6IGFueSB7XG4gIHRocm93IG5ldyBFcnJvcihgTWV0aG9kICcke21ldGhvZE5hbWV9JyBpcyBub3QgaW1wbGVtZW50ZWQuYClcbn1cblxuZnVuY3Rpb24gYXVkaXQ8QXJnc1QgZXh0ZW5kcyBhbnlbXSwgUmV0dXJuVD4oXG4gIG5hbWU6IHN0cmluZyxcbiAgZm46ICguLi5hcmdzOiBBcmdzVCkgPT4gUmV0dXJuVFxuKTogKC4uLmFyZ3M6IEFyZ3NUKSA9PiBSZXR1cm5UIHtcbiAgcmV0dXJuICguLi5hcmdzKSA9PiB7XG4gICAgY29uc3QgcmVzID0gZm4oLi4uYXJncylcblxuICAgIGNvbnN0IHNtYWxscmVzID0gdHlwZW9mIHJlcyA9PT0gXCJzdHJpbmdcIiA/IHJlcy5zbGljZSgwLCA4MCkgKyBcIi4uLlwiIDogcmVzXG4gICAgZGVidWdMb2coXCI+IFwiICsgbmFtZSwgLi4uYXJncylcbiAgICBkZWJ1Z0xvZyhcIjwgXCIgKyBzbWFsbHJlcylcblxuICAgIHJldHVybiByZXNcbiAgfVxufVxuXG4vKiogVGhlIGRlZmF1bHQgY29tcGlsZXIgb3B0aW9ucyBpZiBUeXBlU2NyaXB0IGNvdWxkIGV2ZXIgY2hhbmdlIHRoZSBjb21waWxlciBvcHRpb25zICovXG5jb25zdCBkZWZhdWx0Q29tcGlsZXJPcHRpb25zID0gKHRzOiB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKSk6IENvbXBpbGVyT3B0aW9ucyA9PiB7XG4gIHJldHVybiB7XG4gICAgLi4udHMuZ2V0RGVmYXVsdENvbXBpbGVyT3B0aW9ucygpLFxuICAgIGpzeDogdHMuSnN4RW1pdC5SZWFjdCxcbiAgICBzdHJpY3Q6IHRydWUsXG4gICAgZXNNb2R1bGVJbnRlcm9wOiB0cnVlLFxuICAgIG1vZHVsZTogdHMuTW9kdWxlS2luZC5FU05leHQsXG4gICAgc3VwcHJlc3NPdXRwdXRQYXRoQ2hlY2s6IHRydWUsXG4gICAgc2tpcExpYkNoZWNrOiB0cnVlLFxuICAgIHNraXBEZWZhdWx0TGliQ2hlY2s6IHRydWUsXG4gICAgbW9kdWxlUmVzb2x1dGlvbjogdHMuTW9kdWxlUmVzb2x1dGlvbktpbmQuTm9kZUpzLFxuICB9XG59XG5cbi8vIFwiL0RPTS5kLnRzXCIgPT4gXCIvbGliLmRvbS5kLnRzXCJcbmNvbnN0IGxpYml6ZSA9IChwYXRoOiBzdHJpbmcpID0+IHBhdGgucmVwbGFjZShcIi9cIiwgXCIvbGliLlwiKS50b0xvd2VyQ2FzZSgpXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbi1tZW1vcnkgU3lzdGVtIG9iamVjdCB3aGljaCBjYW4gYmUgdXNlZCBpbiBhIFR5cGVTY3JpcHQgcHJvZ3JhbSwgdGhpc1xuICogaXMgd2hhdCBwcm92aWRlcyByZWFkL3dyaXRlIGFzcGVjdHMgb2YgdGhlIHZpcnR1YWwgZnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN5c3RlbShmaWxlczogTWFwPHN0cmluZywgc3RyaW5nPik6IFN5c3RlbSB7XG4gIHJldHVybiB7XG4gICAgYXJnczogW10sXG4gICAgY3JlYXRlRGlyZWN0b3J5OiAoKSA9PiBub3RJbXBsZW1lbnRlZChcImNyZWF0ZURpcmVjdG9yeVwiKSxcbiAgICAvLyBUT0RPOiBjb3VsZCBtYWtlIGEgcmVhbCBmaWxlIHRyZWVcbiAgICBkaXJlY3RvcnlFeGlzdHM6IGF1ZGl0KFwiZGlyZWN0b3J5RXhpc3RzXCIsIGRpcmVjdG9yeSA9PiB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShmaWxlcy5rZXlzKCkpLnNvbWUocGF0aCA9PiBwYXRoLnN0YXJ0c1dpdGgoZGlyZWN0b3J5KSlcbiAgICB9KSxcbiAgICBleGl0OiAoKSA9PiBub3RJbXBsZW1lbnRlZChcImV4aXRcIiksXG4gICAgZmlsZUV4aXN0czogYXVkaXQoXCJmaWxlRXhpc3RzXCIsIGZpbGVOYW1lID0+IGZpbGVzLmhhcyhmaWxlTmFtZSkgfHwgZmlsZXMuaGFzKGxpYml6ZShmaWxlTmFtZSkpKSxcbiAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiBcIi9cIixcbiAgICBnZXREaXJlY3RvcmllczogKCkgPT4gW10sXG4gICAgZ2V0RXhlY3V0aW5nRmlsZVBhdGg6ICgpID0+IG5vdEltcGxlbWVudGVkKFwiZ2V0RXhlY3V0aW5nRmlsZVBhdGhcIiksXG4gICAgcmVhZERpcmVjdG9yeTogYXVkaXQoXCJyZWFkRGlyZWN0b3J5XCIsIGRpcmVjdG9yeSA9PiAoZGlyZWN0b3J5ID09PSBcIi9cIiA/IEFycmF5LmZyb20oZmlsZXMua2V5cygpKSA6IFtdKSksXG4gICAgcmVhZEZpbGU6IGF1ZGl0KFwicmVhZEZpbGVcIiwgZmlsZU5hbWUgPT4gZmlsZXMuZ2V0KGZpbGVOYW1lKSA/PyBmaWxlcy5nZXQobGliaXplKGZpbGVOYW1lKSkpLFxuICAgIHJlc29sdmVQYXRoOiBwYXRoID0+IHBhdGgsXG4gICAgbmV3TGluZTogXCJcXG5cIixcbiAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiB0cnVlLFxuICAgIHdyaXRlOiAoKSA9PiBub3RJbXBsZW1lbnRlZChcIndyaXRlXCIpLFxuICAgIHdyaXRlRmlsZTogKGZpbGVOYW1lLCBjb250ZW50cykgPT4ge1xuICAgICAgZmlsZXMuc2V0KGZpbGVOYW1lLCBjb250ZW50cylcbiAgICB9LFxuICAgIGRlbGV0ZUZpbGU6IChmaWxlTmFtZSkgPT4ge1xuICAgICAgZmlsZXMuZGVsZXRlKGZpbGVOYW1lKVxuICAgIH0sXG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgZmlsZS1zeXN0ZW0gYmFja2VkIFN5c3RlbSBvYmplY3Qgd2hpY2ggY2FuIGJlIHVzZWQgaW4gYSBUeXBlU2NyaXB0IHByb2dyYW0sIHlvdSBwcm92aWRlXG4gKiBhIHNldCBvZiB2aXJ0dWFsIGZpbGVzIHdoaWNoIGFyZSBwcmlvcml0aXNlZCBvdmVyIHRoZSBGUyB2ZXJzaW9ucywgdGhlbiBhIHBhdGggdG8gdGhlIHJvb3Qgb2YgeW91clxuICogcHJvamVjdCAoYmFzaWNhbGx5IHRoZSBmb2xkZXIgeW91ciBub2RlX21vZHVsZXMgbGl2ZXMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGU0JhY2tlZFN5c3RlbShcbiAgZmlsZXM6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gIF9wcm9qZWN0Um9vdDogc3RyaW5nLFxuICB0czogVFMsXG4gIHRzTGliRGlyZWN0b3J5Pzogc3RyaW5nXG4pOiBTeXN0ZW0ge1xuICAvLyBXZSBuZWVkIHRvIG1ha2UgYW4gaXNvbGF0ZWQgZm9sZGVyIGZvciB0aGUgdHNjb25maWcsIGJ1dCBhbHNvIG5lZWQgdG8gYmUgYWJsZSB0byByZXNvbHZlIHRoZVxuICAvLyBleGlzdGluZyBub2RlX21vZHVsZXMgc3RydWN0dXJlcyBnb2luZyBiYWNrIHRocm91Z2ggdGhlIGhpc3RvcnlcbiAgY29uc3Qgcm9vdCA9IF9wcm9qZWN0Um9vdCArIFwiL3Zmc1wiXG4gIGNvbnN0IHBhdGggPSByZXF1aXJlUGF0aCgpXG5cbiAgLy8gVGhlIGRlZmF1bHQgU3lzdGVtIGluIFR5cGVTY3JpcHRcbiAgY29uc3Qgbm9kZVN5cyA9IHRzLnN5c1xuICBjb25zdCB0c0xpYiA9IHRzTGliRGlyZWN0b3J5ID8/IHBhdGguZGlybmFtZShyZXF1aXJlLnJlc29sdmUoXCJ0eXBlc2NyaXB0XCIpKVxuXG4gIHJldHVybiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIG5hbWU6IFwiZnMtdmZzXCIsXG4gICAgcm9vdCxcbiAgICBhcmdzOiBbXSxcbiAgICBjcmVhdGVEaXJlY3Rvcnk6ICgpID0+IG5vdEltcGxlbWVudGVkKFwiY3JlYXRlRGlyZWN0b3J5XCIpLFxuICAgIC8vIFRPRE86IGNvdWxkIG1ha2UgYSByZWFsIGZpbGUgdHJlZVxuICAgIGRpcmVjdG9yeUV4aXN0czogYXVkaXQoXCJkaXJlY3RvcnlFeGlzdHNcIiwgZGlyZWN0b3J5ID0+IHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKGZpbGVzLmtleXMoKSkuc29tZShwYXRoID0+IHBhdGguc3RhcnRzV2l0aChkaXJlY3RvcnkpKSB8fCBub2RlU3lzLmRpcmVjdG9yeUV4aXN0cyhkaXJlY3RvcnkpXG4gICAgfSksXG4gICAgZXhpdDogbm9kZVN5cy5leGl0LFxuICAgIGZpbGVFeGlzdHM6IGF1ZGl0KFwiZmlsZUV4aXN0c1wiLCBmaWxlTmFtZSA9PiB7XG4gICAgICBpZiAoZmlsZXMuaGFzKGZpbGVOYW1lKSkgcmV0dXJuIHRydWVcbiAgICAgIC8vIERvbid0IGxldCBvdGhlciB0c2NvbmZpZ3MgZW5kIHVwIHRvdWNoaW5nIHRoZSB2ZnNcbiAgICAgIGlmIChmaWxlTmFtZS5pbmNsdWRlcyhcInRzY29uZmlnLmpzb25cIikgfHwgZmlsZU5hbWUuaW5jbHVkZXMoXCJ0c2NvbmZpZy5qc29uXCIpKSByZXR1cm4gZmFsc2VcbiAgICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKFwiL2xpYlwiKSkge1xuICAgICAgICBjb25zdCB0c0xpYk5hbWUgPSBgJHt0c0xpYn0vJHtmaWxlTmFtZS5yZXBsYWNlKFwiL1wiLCBcIlwiKX1gXG4gICAgICAgIHJldHVybiBub2RlU3lzLmZpbGVFeGlzdHModHNMaWJOYW1lKVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVTeXMuZmlsZUV4aXN0cyhmaWxlTmFtZSlcbiAgICB9KSxcbiAgICBnZXRDdXJyZW50RGlyZWN0b3J5OiAoKSA9PiByb290LFxuICAgIGdldERpcmVjdG9yaWVzOiBub2RlU3lzLmdldERpcmVjdG9yaWVzLFxuICAgIGdldEV4ZWN1dGluZ0ZpbGVQYXRoOiAoKSA9PiBub3RJbXBsZW1lbnRlZChcImdldEV4ZWN1dGluZ0ZpbGVQYXRoXCIpLFxuICAgIHJlYWREaXJlY3Rvcnk6IGF1ZGl0KFwicmVhZERpcmVjdG9yeVwiLCAoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3NbMF0gPT09IFwiL1wiKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKGZpbGVzLmtleXMoKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBub2RlU3lzLnJlYWREaXJlY3RvcnkoLi4uYXJncylcbiAgICAgIH1cbiAgICB9KSxcbiAgICByZWFkRmlsZTogYXVkaXQoXCJyZWFkRmlsZVwiLCBmaWxlTmFtZSA9PiB7XG4gICAgICBpZiAoZmlsZXMuaGFzKGZpbGVOYW1lKSkgcmV0dXJuIGZpbGVzLmdldChmaWxlTmFtZSlcbiAgICAgIGlmIChmaWxlTmFtZS5zdGFydHNXaXRoKFwiL2xpYlwiKSkge1xuICAgICAgICBjb25zdCB0c0xpYk5hbWUgPSBgJHt0c0xpYn0vJHtmaWxlTmFtZS5yZXBsYWNlKFwiL1wiLCBcIlwiKX1gXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5vZGVTeXMucmVhZEZpbGUodHNMaWJOYW1lKVxuICAgICAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAgIGNvbnN0IGxpYnMgPSBub2RlU3lzLnJlYWREaXJlY3RvcnkodHNMaWIpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYFRTVkZTOiBBIHJlcXVlc3Qgd2FzIG1hZGUgZm9yICR7dHNMaWJOYW1lfSBidXQgdGhlcmUgd2Fzbid0IGEgZmlsZSBmb3VuZCBpbiB0aGUgZmlsZSBtYXAuIFlvdSBsaWtlbHkgaGF2ZSBhIG1pc21hdGNoIGluIHRoZSBjb21waWxlciBvcHRpb25zIGZvciB0aGUgQ0ROIGRvd25sb2FkIHZzIHRoZSBjb21waWxlciBwcm9ncmFtLiBFeGlzdGluZyBMaWJzOiAke2xpYnN9LmBcbiAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGVTeXMucmVhZEZpbGUoZmlsZU5hbWUpXG4gICAgfSksXG4gICAgcmVzb2x2ZVBhdGg6IHBhdGggPT4ge1xuICAgICAgaWYgKGZpbGVzLmhhcyhwYXRoKSkgcmV0dXJuIHBhdGhcbiAgICAgIHJldHVybiBub2RlU3lzLnJlc29sdmVQYXRoKHBhdGgpXG4gICAgfSxcbiAgICBuZXdMaW5lOiBcIlxcblwiLFxuICAgIHVzZUNhc2VTZW5zaXRpdmVGaWxlTmFtZXM6IHRydWUsXG4gICAgd3JpdGU6ICgpID0+IG5vdEltcGxlbWVudGVkKFwid3JpdGVcIiksXG4gICAgd3JpdGVGaWxlOiAoZmlsZU5hbWUsIGNvbnRlbnRzKSA9PiB7XG4gICAgICBmaWxlcy5zZXQoZmlsZU5hbWUsIGNvbnRlbnRzKVxuICAgIH0sXG4gICAgZGVsZXRlRmlsZTogKGZpbGVOYW1lKSA9PiB7XG4gICAgICBmaWxlcy5kZWxldGUoZmlsZU5hbWUpXG4gICAgfSxcbiAgICByZWFscGF0aDogbm9kZVN5cy5yZWFscGF0aCxcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW4tbWVtb3J5IENvbXBpbGVySG9zdCAtd2hpY2ggaXMgZXNzZW50aWFsbHkgYW4gZXh0cmEgd3JhcHBlciB0byBTeXN0ZW1cbiAqIHdoaWNoIHdvcmtzIHdpdGggVHlwZVNjcmlwdCBvYmplY3RzIC0gcmV0dXJucyBib3RoIGEgY29tcGlsZXIgaG9zdCwgYW5kIGEgd2F5IHRvIGFkZCBuZXcgU291cmNlRmlsZVxuICogaW5zdGFuY2VzIHRvIHRoZSBpbi1tZW1vcnkgZmlsZSBzeXN0ZW0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaXJ0dWFsQ29tcGlsZXJIb3N0KHN5czogU3lzdGVtLCBjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucywgdHM6IFRTKSB7XG4gIGNvbnN0IHNvdXJjZUZpbGVzID0gbmV3IE1hcDxzdHJpbmcsIFNvdXJjZUZpbGU+KClcbiAgY29uc3Qgc2F2ZSA9IChzb3VyY2VGaWxlOiBTb3VyY2VGaWxlKSA9PiB7XG4gICAgc291cmNlRmlsZXMuc2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUsIHNvdXJjZUZpbGUpXG4gICAgcmV0dXJuIHNvdXJjZUZpbGVcbiAgfVxuXG4gIHR5cGUgUmV0dXJuID0ge1xuICAgIGNvbXBpbGVySG9zdDogQ29tcGlsZXJIb3N0XG4gICAgdXBkYXRlRmlsZTogKHNvdXJjZUZpbGU6IFNvdXJjZUZpbGUpID0+IGJvb2xlYW5cbiAgICBkZWxldGVGaWxlOiAoc291cmNlRmlsZTogU291cmNlRmlsZSkgPT4gYm9vbGVhblxuICB9XG5cbiAgY29uc3Qgdkhvc3Q6IFJldHVybiA9IHtcbiAgICBjb21waWxlckhvc3Q6IHtcbiAgICAgIC4uLnN5cyxcbiAgICAgIGdldENhbm9uaWNhbEZpbGVOYW1lOiBmaWxlTmFtZSA9PiBmaWxlTmFtZSxcbiAgICAgIGdldERlZmF1bHRMaWJGaWxlTmFtZTogKCkgPT4gXCIvXCIgKyB0cy5nZXREZWZhdWx0TGliRmlsZU5hbWUoY29tcGlsZXJPcHRpb25zKSwgLy8gJy9saWIuZC50cycsXG4gICAgICAvLyBnZXREZWZhdWx0TGliTG9jYXRpb246ICgpID0+ICcvJyxcbiAgICAgIGdldE5ld0xpbmU6ICgpID0+IHN5cy5uZXdMaW5lLFxuICAgICAgZ2V0U291cmNlRmlsZTogKGZpbGVOYW1lLCBsYW5ndWFnZVZlcnNpb25Pck9wdGlvbnMpID0+IHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBzb3VyY2VGaWxlcy5nZXQoZmlsZU5hbWUpIHx8XG4gICAgICAgICAgc2F2ZShcbiAgICAgICAgICAgIHRzLmNyZWF0ZVNvdXJjZUZpbGUoXG4gICAgICAgICAgICAgIGZpbGVOYW1lLFxuICAgICAgICAgICAgICBzeXMucmVhZEZpbGUoZmlsZU5hbWUpISxcbiAgICAgICAgICAgICAgbGFuZ3VhZ2VWZXJzaW9uT3JPcHRpb25zID8/IGNvbXBpbGVyT3B0aW9ucy50YXJnZXQgPz8gZGVmYXVsdENvbXBpbGVyT3B0aW9ucyh0cykudGFyZ2V0ISxcbiAgICAgICAgICAgICAgZmFsc2VcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIH0sXG4gICAgICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzOiAoKSA9PiBzeXMudXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcyxcbiAgICB9LFxuICAgIHVwZGF0ZUZpbGU6IHNvdXJjZUZpbGUgPT4ge1xuICAgICAgY29uc3QgYWxyZWFkeUV4aXN0cyA9IHNvdXJjZUZpbGVzLmhhcyhzb3VyY2VGaWxlLmZpbGVOYW1lKVxuICAgICAgc3lzLndyaXRlRmlsZShzb3VyY2VGaWxlLmZpbGVOYW1lLCBzb3VyY2VGaWxlLnRleHQpXG4gICAgICBzb3VyY2VGaWxlcy5zZXQoc291cmNlRmlsZS5maWxlTmFtZSwgc291cmNlRmlsZSlcbiAgICAgIHJldHVybiBhbHJlYWR5RXhpc3RzXG4gICAgfSxcbiAgICBkZWxldGVGaWxlOiBzb3VyY2VGaWxlID0+IHtcbiAgICAgIGNvbnN0IGFscmVhZHlFeGlzdHMgPSBzb3VyY2VGaWxlcy5oYXMoc291cmNlRmlsZS5maWxlTmFtZSlcbiAgICAgIHNvdXJjZUZpbGVzLmRlbGV0ZShzb3VyY2VGaWxlLmZpbGVOYW1lKVxuICAgICAgc3lzLmRlbGV0ZUZpbGUhKHNvdXJjZUZpbGUuZmlsZU5hbWUpXG4gICAgICByZXR1cm4gYWxyZWFkeUV4aXN0c1xuICAgIH1cbiAgfVxuICByZXR1cm4gdkhvc3Rcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIG9iamVjdCB3aGljaCBjYW4gaG9zdCBhIGxhbmd1YWdlIHNlcnZpY2UgYWdhaW5zdCB0aGUgdmlydHVhbCBmaWxlLXN5c3RlbVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlydHVhbExhbmd1YWdlU2VydmljZUhvc3QoXG4gIHN5czogU3lzdGVtLFxuICByb290RmlsZXM6IHN0cmluZ1tdLFxuICBjb21waWxlck9wdGlvbnM6IENvbXBpbGVyT3B0aW9ucyxcbiAgdHM6IFRTLFxuICBjdXN0b21UcmFuc2Zvcm1lcnM/OiBDdXN0b21UcmFuc2Zvcm1lcnNcbikge1xuICBjb25zdCBmaWxlTmFtZXMgPSBbLi4ucm9vdEZpbGVzXVxuICBjb25zdCB7IGNvbXBpbGVySG9zdCwgdXBkYXRlRmlsZSwgZGVsZXRlRmlsZSB9ID0gY3JlYXRlVmlydHVhbENvbXBpbGVySG9zdChzeXMsIGNvbXBpbGVyT3B0aW9ucywgdHMpXG4gIGNvbnN0IGZpbGVWZXJzaW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KClcbiAgbGV0IHByb2plY3RWZXJzaW9uID0gMFxuICBjb25zdCBsYW5ndWFnZVNlcnZpY2VIb3N0OiBMYW5ndWFnZVNlcnZpY2VIb3N0ID0ge1xuICAgIC4uLmNvbXBpbGVySG9zdCxcbiAgICBnZXRQcm9qZWN0VmVyc2lvbjogKCkgPT4gcHJvamVjdFZlcnNpb24udG9TdHJpbmcoKSxcbiAgICBnZXRDb21waWxhdGlvblNldHRpbmdzOiAoKSA9PiBjb21waWxlck9wdGlvbnMsXG4gICAgZ2V0Q3VzdG9tVHJhbnNmb3JtZXJzOiAoKSA9PiBjdXN0b21UcmFuc2Zvcm1lcnMsXG4gICAgLy8gQSBjb3VwbGUgd2Vla3Mgb2YgNC44IFR5cGVTY3JpcHQgbmlnaHRsaWVzIGhhZCBhIGJ1ZyB3aGVyZSB0aGUgUHJvZ3JhbSdzXG4gICAgLy8gbGlzdCBvZiBmaWxlcyB3YXMganVzdCBhIHJlZmVyZW5jZSB0byB0aGUgYXJyYXkgcmV0dXJuZWQgYnkgdGhpcyBob3N0IG1ldGhvZCxcbiAgICAvLyB3aGljaCBtZWFucyBtdXRhdGlvbnMgYnkgdGhlIGhvc3QgdGhhdCBvdWdodCB0byByZXN1bHQgaW4gYSBuZXcgUHJvZ3JhbSBiZWluZ1xuICAgIC8vIGNyZWF0ZWQgd2VyZSBub3QgZGV0ZWN0ZWQsIHNpbmNlIHRoZSBvbGQgbGlzdCBvZiBmaWxlcyBhbmQgdGhlIG5ldyBsaXN0IG9mIGZpbGVzXG4gICAgLy8gd2VyZSBpbiBmYWN0IGEgcmVmZXJlbmNlIHRvIHRoZSBzYW1lIHVuZGVybHlpbmcgYXJyYXkuIFRoYXQgd2FzIGZpeGVkIGluXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9UeXBlU2NyaXB0L3B1bGwvNDk4MTMsIGJ1dCBzaW5jZSB0aGUgdHdvc2xhc2ggcnVubmVyXG4gICAgLy8gaXMgdXNlZCBpbiBiaXNlY3RpbmcgZm9yIGNoYW5nZXMsIGl0IG5lZWRzIHRvIGd1YXJkIGFnYWluc3QgYmVpbmcgYnVzdGVkIGluIHRoYXRcbiAgICAvLyBjb3VwbGUtd2VlayBwZXJpb2QsIHNvIHdlIGRlZmVuc2l2ZWx5IG1ha2UgYSBzbGljZSBoZXJlLlxuICAgIGdldFNjcmlwdEZpbGVOYW1lczogKCkgPT4gZmlsZU5hbWVzLnNsaWNlKCksXG4gICAgZ2V0U2NyaXB0U25hcHNob3Q6IGZpbGVOYW1lID0+IHtcbiAgICAgIGNvbnN0IGNvbnRlbnRzID0gc3lzLnJlYWRGaWxlKGZpbGVOYW1lKVxuICAgICAgaWYgKGNvbnRlbnRzICYmIHR5cGVvZiBjb250ZW50cyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICByZXR1cm4gdHMuU2NyaXB0U25hcHNob3QuZnJvbVN0cmluZyhjb250ZW50cylcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH0sXG4gICAgZ2V0U2NyaXB0VmVyc2lvbjogZmlsZU5hbWUgPT4ge1xuICAgICAgcmV0dXJuIGZpbGVWZXJzaW9ucy5nZXQoZmlsZU5hbWUpIHx8IFwiMFwiXG4gICAgfSxcbiAgICB3cml0ZUZpbGU6IHN5cy53cml0ZUZpbGUsXG4gIH1cblxuICB0eXBlIFJldHVybiA9IHtcbiAgICBsYW5ndWFnZVNlcnZpY2VIb3N0OiBMYW5ndWFnZVNlcnZpY2VIb3N0XG4gICAgdXBkYXRlRmlsZTogKHNvdXJjZUZpbGU6IGltcG9ydChcInR5cGVzY3JpcHRcIikuU291cmNlRmlsZSkgPT4gdm9pZFxuICAgIGRlbGV0ZUZpbGU6IChzb3VyY2VGaWxlOiBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpLlNvdXJjZUZpbGUpID0+IHZvaWRcbiAgfVxuXG4gIGNvbnN0IGxzSG9zdDogUmV0dXJuID0ge1xuICAgIGxhbmd1YWdlU2VydmljZUhvc3QsXG4gICAgdXBkYXRlRmlsZTogc291cmNlRmlsZSA9PiB7XG4gICAgICBwcm9qZWN0VmVyc2lvbisrXG4gICAgICBmaWxlVmVyc2lvbnMuc2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUsIHByb2plY3RWZXJzaW9uLnRvU3RyaW5nKCkpXG4gICAgICBpZiAoIWZpbGVOYW1lcy5pbmNsdWRlcyhzb3VyY2VGaWxlLmZpbGVOYW1lKSkge1xuICAgICAgICBmaWxlTmFtZXMucHVzaChzb3VyY2VGaWxlLmZpbGVOYW1lKVxuICAgICAgfVxuICAgICAgdXBkYXRlRmlsZShzb3VyY2VGaWxlKVxuICAgIH0sXG4gICAgZGVsZXRlRmlsZTogc291cmNlRmlsZSA9PiB7XG4gICAgICBwcm9qZWN0VmVyc2lvbisrXG4gICAgICBmaWxlVmVyc2lvbnMuc2V0KHNvdXJjZUZpbGUuZmlsZU5hbWUsIHByb2plY3RWZXJzaW9uLnRvU3RyaW5nKCkpXG4gICAgICBjb25zdCBpbmRleCA9IGZpbGVOYW1lcy5pbmRleE9mKHNvdXJjZUZpbGUuZmlsZU5hbWUpXG4gICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIGZpbGVOYW1lcy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgICB9XG4gICAgICBkZWxldGVGaWxlKHNvdXJjZUZpbGUpXG4gICAgfVxuICB9XG4gIHJldHVybiBsc0hvc3Rcbn1cblxuY29uc3QgcmVxdWlyZVBhdGggPSAoKSA9PiB7XG4gIHJldHVybiByZXF1aXJlKFN0cmluZy5mcm9tQ2hhckNvZGUoMTEyLCA5NywgMTE2LCAxMDQpKSBhcyB0eXBlb2YgaW1wb3J0KFwicGF0aFwiKVxufVxuXG5jb25zdCByZXF1aXJlRlMgPSAoKSA9PiB7XG4gIHJldHVybiByZXF1aXJlKFN0cmluZy5mcm9tQ2hhckNvZGUoMTAyLCAxMTUpKSBhcyB0eXBlb2YgaW1wb3J0KFwiZnNcIilcbn1cbiJdfQ==