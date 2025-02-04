define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createURLQueryWithCompilerOptions = exports.getCompilerOptionsFromParams = void 0;
    exports.getDefaultSandboxCompilerOptions = getDefaultSandboxCompilerOptions;
    /**
     * These are the defaults, but they also act as the list of all compiler options
     * which are parsed in the query params.
     */
    function getDefaultSandboxCompilerOptions(config, monaco, ts) {
        const [major] = ts.versionMajorMinor.split(".").map(v => parseInt(v));
        const useJavaScript = config.filetype === "js";
        const settings = {
            strict: true,
            noImplicitAny: true,
            strictNullChecks: !useJavaScript,
            strictFunctionTypes: true,
            strictPropertyInitialization: true,
            strictBindCallApply: true,
            noImplicitThis: true,
            noImplicitReturns: true,
            noUncheckedIndexedAccess: false,
            // 3.7 off, 3.8 on I think
            useDefineForClassFields: false,
            alwaysStrict: true,
            allowUnreachableCode: false,
            allowUnusedLabels: false,
            downlevelIteration: false,
            noEmitHelpers: false,
            noLib: false,
            noStrictGenericChecks: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            esModuleInterop: true,
            preserveConstEnums: false,
            removeComments: false,
            skipLibCheck: false,
            checkJs: useJavaScript,
            allowJs: useJavaScript,
            declaration: true,
            importHelpers: false,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            target: monaco.languages.typescript.ScriptTarget.ES2017,
            jsx: monaco.languages.typescript.JsxEmit.React,
            module: monaco.languages.typescript.ModuleKind.ESNext,
        };
        if (major >= 5) {
            settings.experimentalDecorators = false;
            settings.emitDecoratorMetadata = false;
        }
        return Object.assign(Object.assign({}, settings), config.compilerOptions);
    }
    /**
     * Loop through all of the entries in the existing compiler options then compare them with the
     * query params and return an object which is the changed settings via the query params
     */
    const getCompilerOptionsFromParams = (playgroundDefaults, ts, params) => {
        const returnedOptions = {};
        params.forEach((val, key) => {
            // First use the defaults object to drop compiler flags which are already set to the default
            if (playgroundDefaults[key]) {
                let toSet = undefined;
                if (val === "true" && playgroundDefaults[key] !== true) {
                    toSet = true;
                }
                else if (val === "false" && playgroundDefaults[key] !== false) { // TODO(jakebailey): remove as any, check undefined above
                    toSet = false;
                }
                else if (!isNaN(parseInt(val, 10)) && playgroundDefaults[key] !== parseInt(val, 10)) {
                    toSet = parseInt(val, 10);
                }
                if (toSet !== undefined)
                    returnedOptions[key] = toSet;
            }
            else {
                // If that doesn't work, double check that the flag exists and allow it through
                // @ts-ignore
                const flagExists = ts.optionDeclarations.find(opt => opt.name === key);
                if (flagExists) {
                    let realValue = true;
                    if (val === "false")
                        realValue = false;
                    if (!isNaN(parseInt(val, 10)))
                        realValue = parseInt(val, 10);
                    returnedOptions[key] = realValue;
                }
            }
        });
        return returnedOptions;
    };
    exports.getCompilerOptionsFromParams = getCompilerOptionsFromParams;
    // Can't set sandbox to be the right type because the param would contain this function
    /** Gets a query string representation (hash + queries) */
    const createURLQueryWithCompilerOptions = (_sandbox, paramOverrides) => {
        const sandbox = _sandbox;
        const initialOptions = new URLSearchParams(document.location.search);
        const compilerOptions = sandbox.getCompilerOptions();
        const compilerDefaults = sandbox.compilerDefaults;
        const diff = Object.entries(compilerOptions).reduce((acc, [key, value]) => {
            if (value !== compilerDefaults[key]) {
                // @ts-ignore
                acc[key] = compilerOptions[key];
            }
            return acc;
        }, {});
        // The text of the TS/JS as the hash
        const hash = `code/${sandbox.lzstring.compressToEncodedURIComponent(sandbox.getText())}`;
        let urlParams = Object.assign({}, diff);
        for (const param of ["lib", "ts"]) {
            const params = new URLSearchParams(location.search);
            if (params.has(param)) {
                // Special case the nightly where it uses the TS version to hardcode
                // the nightly build
                if (param === "ts" && (params.get(param) === "Nightly" || params.get(param) === "next")) {
                    urlParams["ts"] = sandbox.ts.version;
                }
                else {
                    urlParams["ts"] = params.get(param);
                }
            }
        }
        // Support sending the selection, but only if there is a selection, and it's not the whole thing
        const s = sandbox.editor.getSelection();
        const isNotEmpty = (s && s.selectionStartLineNumber !== s.positionLineNumber) || (s && s.selectionStartColumn !== s.positionColumn);
        const range = sandbox.editor.getModel().getFullModelRange();
        const isFull = s &&
            s.selectionStartLineNumber === range.startLineNumber &&
            s.selectionStartColumn === range.startColumn &&
            s.positionColumn === range.endColumn &&
            s.positionLineNumber === range.endLineNumber;
        if (s && isNotEmpty && !isFull) {
            urlParams["ssl"] = s.selectionStartLineNumber;
            urlParams["ssc"] = s.selectionStartColumn;
            urlParams["pln"] = s.positionLineNumber;
            urlParams["pc"] = s.positionColumn;
        }
        else {
            urlParams["ssl"] = undefined;
            urlParams["ssc"] = undefined;
            urlParams["pln"] = undefined;
            urlParams["pc"] = undefined;
        }
        if (sandbox.config.filetype !== "ts")
            urlParams["filetype"] = sandbox.config.filetype;
        if (paramOverrides) {
            urlParams = Object.assign(Object.assign({}, urlParams), paramOverrides);
        }
        // @ts-ignore - this is in MDN but not libdom
        const hasInitialOpts = initialOptions.keys().length > 0;
        if (Object.keys(urlParams).length > 0 || hasInitialOpts) {
            let queryString = Object.entries(urlParams)
                .filter(([_k, v]) => v !== undefined)
                .filter(([_k, v]) => v !== null)
                .map(([key, value]) => {
                return `${key}=${encodeURIComponent(value)}`;
            })
                .join("&");
            // We want to keep around custom query variables, which
            // are usually used by playground plugins, with the exception
            // being the install-plugin param and any compiler options
            // which have a default value
            initialOptions.forEach((value, key) => {
                const skip = ["ssl", "ssc", "pln", "pc"];
                if (skip.includes(key))
                    return;
                if (queryString.includes(key))
                    return;
                if (compilerOptions[key])
                    return;
                queryString += `&${key}=${value}`;
            });
            return `?${queryString}#${hash}`;
        }
        else {
            return `#${hash}`;
        }
    };
    exports.createURLQueryWithCompilerOptions = createURLQueryWithCompilerOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZXJPcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvY29tcGlsZXJPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFTQSw0RUEyREM7SUEvREQ7OztPQUdHO0lBQ0gsU0FBZ0IsZ0NBQWdDLENBQzlDLE1BQXFCLEVBQ3JCLE1BQWMsRUFDZCxFQUFpQztRQUVqQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQXFCLENBQUE7UUFDekYsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUE7UUFDOUMsTUFBTSxRQUFRLEdBQW9CO1lBQ2hDLE1BQU0sRUFBRSxJQUFJO1lBRVosYUFBYSxFQUFFLElBQUk7WUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQyxhQUFhO1lBQ2hDLG1CQUFtQixFQUFFLElBQUk7WUFDekIsNEJBQTRCLEVBQUUsSUFBSTtZQUNsQyxtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsd0JBQXdCLEVBQUUsS0FBSztZQUUvQiwwQkFBMEI7WUFDMUIsdUJBQXVCLEVBQUUsS0FBSztZQUU5QixZQUFZLEVBQUUsSUFBSTtZQUNsQixvQkFBb0IsRUFBRSxLQUFLO1lBQzNCLGlCQUFpQixFQUFFLEtBQUs7WUFFeEIsa0JBQWtCLEVBQUUsS0FBSztZQUN6QixhQUFhLEVBQUUsS0FBSztZQUNwQixLQUFLLEVBQUUsS0FBSztZQUNaLHFCQUFxQixFQUFFLEtBQUs7WUFDNUIsY0FBYyxFQUFFLEtBQUs7WUFDckIsa0JBQWtCLEVBQUUsS0FBSztZQUV6QixlQUFlLEVBQUUsSUFBSTtZQUNyQixrQkFB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ZGJveENvbmZpZyB9IGZyb20gXCIuXCJcblxudHlwZSBDb21waWxlck9wdGlvbnMgPSBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmxhbmd1YWdlcy50eXBlc2NyaXB0LkNvbXBpbGVyT3B0aW9uc1xudHlwZSBNb25hY28gPSB0eXBlb2YgaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKVxuXG4vKipcbiAqIFRoZXNlIGFyZSB0aGUgZGVmYXVsdHMsIGJ1dCB0aGV5IGFsc28gYWN0IGFzIHRoZSBsaXN0IG9mIGFsbCBjb21waWxlciBvcHRpb25zXG4gKiB3aGljaCBhcmUgcGFyc2VkIGluIHRoZSBxdWVyeSBwYXJhbXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0U2FuZGJveENvbXBpbGVyT3B0aW9ucyhcbiAgY29uZmlnOiBTYW5kYm94Q29uZmlnLFxuICBtb25hY286IE1vbmFjbyxcbiAgdHM6IHsgdmVyc2lvbk1ham9yTWlub3I6IHN0cmluZyB9XG4pIHtcbiAgY29uc3QgW21ham9yXSA9IHRzLnZlcnNpb25NYWpvck1pbm9yLnNwbGl0KFwiLlwiKS5tYXAodiA9PiBwYXJzZUludCh2KSkgYXMgW251bWJlciwgbnVtYmVyXVxuICBjb25zdCB1c2VKYXZhU2NyaXB0ID0gY29uZmlnLmZpbGV0eXBlID09PSBcImpzXCJcbiAgY29uc3Qgc2V0dGluZ3M6IENvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICBzdHJpY3Q6IHRydWUsXG5cbiAgICBub0ltcGxpY2l0QW55OiB0cnVlLFxuICAgIHN0cmljdE51bGxDaGVja3M6ICF1c2VKYXZhU2NyaXB0LFxuICAgIHN0cmljdEZ1bmN0aW9uVHlwZXM6IHRydWUsXG4gICAgc3RyaWN0UHJvcGVydHlJbml0aWFsaXphdGlvbjogdHJ1ZSxcbiAgICBzdHJpY3RCaW5kQ2FsbEFwcGx5OiB0cnVlLFxuICAgIG5vSW1wbGljaXRUaGlzOiB0cnVlLFxuICAgIG5vSW1wbGljaXRSZXR1cm5zOiB0cnVlLFxuICAgIG5vVW5jaGVja2VkSW5kZXhlZEFjY2VzczogZmFsc2UsXG5cbiAgICAvLyAzLjcgb2ZmLCAzLjggb24gSSB0aGlua1xuICAgIHVzZURlZmluZUZvckNsYXNzRmllbGRzOiBmYWxzZSxcblxuICAgIGFsd2F5c1N0cmljdDogdHJ1ZSxcbiAgICBhbGxvd1VucmVhY2hhYmxlQ29kZTogZmFsc2UsXG4gICAgYWxsb3dVbnVzZWRMYWJlbHM6IGZhbHNlLFxuXG4gICAgZG93bmxldmVsSXRlcmF0aW9uOiBmYWxzZSxcbiAgICBub0VtaXRIZWxwZXJzOiBmYWxzZSxcbiAgICBub0xpYjogZmFsc2UsXG4gICAgbm9TdHJpY3RHZW5lcmljQ2hlY2tzOiBmYWxzZSxcbiAgICBub1VudXNlZExvY2FsczogZmFsc2UsXG4gICAgbm9VbnVzZWRQYXJhbWV0ZXJzOiBmYWxzZSxcblxuICAgIGVzTW9kdWxlSW50ZXJvcDogdHJ1ZSxcbiAgICBwcmVzZXJ2ZUNvbnN0RW51bXM6IGZhbHNlLFxuICAgIHJlbW92ZUNvbW1lbnRzOiBmYWxzZSxcbiAgICBza2lwTGliQ2hlY2s6IGZhbHNlLFxuXG4gICAgY2hlY2tKczogdXNlSmF2YVNjcmlwdCxcbiAgICBhbGxvd0pzOiB1c2VKYXZhU2NyaXB0LFxuICAgIGRlY2xhcmF0aW9uOiB0cnVlLFxuXG4gICAgaW1wb3J0SGVscGVyczogZmFsc2UsXG5cbiAgICBleHBlcmltZW50YWxEZWNvcmF0b3JzOiB0cnVlLFxuICAgIGVtaXREZWNvcmF0b3JNZXRhZGF0YTogdHJ1ZSxcbiAgICBtb2R1bGVSZXNvbHV0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlUmVzb2x1dGlvbktpbmQuTm9kZUpzLFxuXG4gICAgdGFyZ2V0OiBtb25hY28ubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuU2NyaXB0VGFyZ2V0LkVTMjAxNyxcbiAgICBqc3g6IG1vbmFjby5sYW5ndWFnZXMudHlwZXNjcmlwdC5Kc3hFbWl0LlJlYWN0LFxuICAgIG1vZHVsZTogbW9uYWNvLmxhbmd1YWdlcy50eXBlc2NyaXB0Lk1vZHVsZUtpbmQuRVNOZXh0LFxuICB9XG5cbiAgaWYgKG1ham9yID49IDUpIHtcbiAgICBzZXR0aW5ncy5leHBlcmltZW50YWxEZWNvcmF0b3JzID0gZmFsc2VcbiAgICBzZXR0aW5ncy5lbWl0RGVjb3JhdG9yTWV0YWRhdGEgPSBmYWxzZVxuICB9XG5cbiAgcmV0dXJuIHsgLi4uc2V0dGluZ3MsIC4uLmNvbmZpZy5jb21waWxlck9wdGlvbnMgfVxufVxuXG4vKipcbiAqIExvb3AgdGhyb3VnaCBhbGwgb2YgdGhlIGVudHJpZXMgaW4gdGhlIGV4aXN0aW5nIGNvbXBpbGVyIG9wdGlvbnMgdGhlbiBjb21wYXJlIHRoZW0gd2l0aCB0aGVcbiAqIHF1ZXJ5IHBhcmFtcyBhbmQgcmV0dXJuIGFuIG9iamVjdCB3aGljaCBpcyB0aGUgY2hhbmdlZCBzZXR0aW5ncyB2aWEgdGhlIHF1ZXJ5IHBhcmFtc1xuICovXG5leHBvcnQgY29uc3QgZ2V0Q29tcGlsZXJPcHRpb25zRnJvbVBhcmFtcyA9IChcbiAgcGxheWdyb3VuZERlZmF1bHRzOiBDb21waWxlck9wdGlvbnMsXG4gIHRzOiB0eXBlb2YgaW1wb3J0KFwidHlwZXNjcmlwdFwiKSxcbiAgcGFyYW1zOiBVUkxTZWFyY2hQYXJhbXNcbik6IENvbXBpbGVyT3B0aW9ucyA9PiB7XG4gIGNvbnN0IHJldHVybmVkT3B0aW9uczogQ29tcGlsZXJPcHRpb25zID0ge31cblxuICBwYXJhbXMuZm9yRWFjaCgodmFsLCBrZXkpID0+IHtcbiAgICAvLyBGaXJzdCB1c2UgdGhlIGRlZmF1bHRzIG9iamVjdCB0byBkcm9wIGNvbXBpbGVyIGZsYWdzIHdoaWNoIGFyZSBhbHJlYWR5IHNldCB0byB0aGUgZGVmYXVsdFxuICAgIGlmIChwbGF5Z3JvdW5kRGVmYXVsdHNba2V5XSkge1xuICAgICAgbGV0IHRvU2V0ID0gdW5kZWZpbmVkXG4gICAgICBpZiAodmFsID09PSBcInRydWVcIiAmJiBwbGF5Z3JvdW5kRGVmYXVsdHNba2V5XSAhPT0gdHJ1ZSkge1xuICAgICAgICB0b1NldCA9IHRydWVcbiAgICAgIH0gZWxzZSBpZiAodmFsID09PSBcImZhbHNlXCIgJiYgKHBsYXlncm91bmREZWZhdWx0c1trZXldIGFzIGFueSkgIT09IGZhbHNlKSB7IC8vIFRPRE8oamFrZWJhaWxleSk6IHJlbW92ZSBhcyBhbnksIGNoZWNrIHVuZGVmaW5lZCBhYm92ZVxuICAgICAgICB0b1NldCA9IGZhbHNlXG4gICAgICB9IGVsc2UgaWYgKCFpc05hTihwYXJzZUludCh2YWwsIDEwKSkgJiYgcGxheWdyb3VuZERlZmF1bHRzW2tleV0gIT09IHBhcnNlSW50KHZhbCwgMTApKSB7XG4gICAgICAgIHRvU2V0ID0gcGFyc2VJbnQodmFsLCAxMClcbiAgICAgIH1cblxuICAgICAgaWYgKHRvU2V0ICE9PSB1bmRlZmluZWQpIHJldHVybmVkT3B0aW9uc1trZXldID0gdG9TZXRcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gSWYgdGhhdCBkb2Vzbid0IHdvcmssIGRvdWJsZSBjaGVjayB0aGF0IHRoZSBmbGFnIGV4aXN0cyBhbmQgYWxsb3cgaXQgdGhyb3VnaFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgZmxhZ0V4aXN0cyA9IHRzLm9wdGlvbkRlY2xhcmF0aW9ucy5maW5kKG9wdCA9PiBvcHQubmFtZSA9PT0ga2V5KVxuICAgICAgaWYgKGZsYWdFeGlzdHMpIHtcbiAgICAgICAgbGV0IHJlYWxWYWx1ZTogbnVtYmVyIHwgYm9vbGVhbiA9IHRydWVcbiAgICAgICAgaWYgKHZhbCA9PT0gXCJmYWxzZVwiKSByZWFsVmFsdWUgPSBmYWxzZVxuICAgICAgICBpZiAoIWlzTmFOKHBhcnNlSW50KHZhbCwgMTApKSkgcmVhbFZhbHVlID0gcGFyc2VJbnQodmFsLCAxMClcbiAgICAgICAgcmV0dXJuZWRPcHRpb25zW2tleV0gPSByZWFsVmFsdWVcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIHJldHVybmVkT3B0aW9uc1xufVxuXG4vLyBDYW4ndCBzZXQgc2FuZGJveCB0byBiZSB0aGUgcmlnaHQgdHlwZSBiZWNhdXNlIHRoZSBwYXJhbSB3b3VsZCBjb250YWluIHRoaXMgZnVuY3Rpb25cblxuLyoqIEdldHMgYSBxdWVyeSBzdHJpbmcgcmVwcmVzZW50YXRpb24gKGhhc2ggKyBxdWVyaWVzKSAqL1xuZXhwb3J0IGNvbnN0IGNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyA9IChfc2FuZGJveDogYW55LCBwYXJhbU92ZXJyaWRlcz86IGFueSk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHNhbmRib3ggPSBfc2FuZGJveCBhcyBpbXBvcnQoXCIuL2luZGV4XCIpLlNhbmRib3hcbiAgY29uc3QgaW5pdGlhbE9wdGlvbnMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGRvY3VtZW50LmxvY2F0aW9uLnNlYXJjaClcblxuICBjb25zdCBjb21waWxlck9wdGlvbnMgPSBzYW5kYm94LmdldENvbXBpbGVyT3B0aW9ucygpXG4gIGNvbnN0IGNvbXBpbGVyRGVmYXVsdHMgPSBzYW5kYm94LmNvbXBpbGVyRGVmYXVsdHNcbiAgY29uc3QgZGlmZiA9IE9iamVjdC5lbnRyaWVzKGNvbXBpbGVyT3B0aW9ucykucmVkdWNlKChhY2MsIFtrZXksIHZhbHVlXSkgPT4ge1xuICAgIGlmICh2YWx1ZSAhPT0gY29tcGlsZXJEZWZhdWx0c1trZXldKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBhY2Nba2V5XSA9IGNvbXBpbGVyT3B0aW9uc1trZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY1xuICB9LCB7fSlcblxuICAvLyBUaGUgdGV4dCBvZiB0aGUgVFMvSlMgYXMgdGhlIGhhc2hcbiAgY29uc3QgaGFzaCA9IGBjb2RlLyR7c2FuZGJveC5senN0cmluZy5jb21wcmVzc1RvRW5jb2RlZFVSSUNvbXBvbmVudChzYW5kYm94LmdldFRleHQoKSl9YFxuXG4gIGxldCB1cmxQYXJhbXM6IGFueSA9IE9iamVjdC5hc3NpZ24oe30sIGRpZmYpXG4gIGZvciAoY29uc3QgcGFyYW0gb2YgW1wibGliXCIsIFwidHNcIl0pIHtcbiAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaClcbiAgICBpZiAocGFyYW1zLmhhcyhwYXJhbSkpIHtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZSB0aGUgbmlnaHRseSB3aGVyZSBpdCB1c2VzIHRoZSBUUyB2ZXJzaW9uIHRvIGhhcmRjb2RlXG4gICAgICAvLyB0aGUgbmlnaHRseSBidWlsZFxuICAgICAgaWYgKHBhcmFtID09PSBcInRzXCIgJiYgKHBhcmFtcy5nZXQocGFyYW0pID09PSBcIk5pZ2h0bHlcIiB8fCBwYXJhbXMuZ2V0KHBhcmFtKSA9PT0gXCJuZXh0XCIpKSB7XG4gICAgICAgIHVybFBhcmFtc1tcInRzXCJdID0gc2FuZGJveC50cy52ZXJzaW9uXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmxQYXJhbXNbXCJ0c1wiXSA9IHBhcmFtcy5nZXQocGFyYW0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gU3VwcG9ydCBzZW5kaW5nIHRoZSBzZWxlY3Rpb24sIGJ1dCBvbmx5IGlmIHRoZXJlIGlzIGEgc2VsZWN0aW9uLCBhbmQgaXQncyBub3QgdGhlIHdob2xlIHRoaW5nXG4gIGNvbnN0IHMgPSBzYW5kYm94LmVkaXRvci5nZXRTZWxlY3Rpb24oKVxuXG4gIGNvbnN0IGlzTm90RW1wdHkgPVxuICAgIChzICYmIHMuc2VsZWN0aW9uU3RhcnRMaW5lTnVtYmVyICE9PSBzLnBvc2l0aW9uTGluZU51bWJlcikgfHwgKHMgJiYgcy5zZWxlY3Rpb25TdGFydENvbHVtbiAhPT0gcy5wb3NpdGlvbkNvbHVtbilcblxuICBjb25zdCByYW5nZSA9IHNhbmRib3guZWRpdG9yLmdldE1vZGVsKCkhLmdldEZ1bGxNb2RlbFJhbmdlKClcbiAgY29uc3QgaXNGdWxsID1cbiAgICBzICYmXG4gICAgcy5zZWxlY3Rpb25TdGFydExpbmVOdW1iZXIgPT09IHJhbmdlLnN0YXJ0TGluZU51bWJlciAmJlxuICAgIHMuc2VsZWN0aW9uU3RhcnRDb2x1bW4gPT09IHJhbmdlLnN0YXJ0Q29sdW1uICYmXG4gICAgcy5wb3NpdGlvbkNvbHVtbiA9PT0gcmFuZ2UuZW5kQ29sdW1uICYmXG4gICAgcy5wb3NpdGlvbkxpbmVOdW1iZXIgPT09IHJhbmdlLmVuZExpbmVOdW1iZXJcblxuICBpZiAocyAmJiBpc05vdEVtcHR5ICYmICFpc0Z1bGwpIHtcbiAgICB1cmxQYXJhbXNbXCJzc2xcIl0gPSBzLnNlbGVjdGlvblN0YXJ0TGluZU51bWJlclxuICAgIHVybFBhcmFtc1tcInNzY1wiXSA9IHMuc2VsZWN0aW9uU3RhcnRDb2x1bW5cbiAgICB1cmxQYXJhbXNbXCJwbG5cIl0gPSBzLnBvc2l0aW9uTGluZU51bWJlclxuICAgIHVybFBhcmFtc1tcInBjXCJdID0gcy5wb3NpdGlvbkNvbHVtblxuICB9IGVsc2Uge1xuICAgIHVybFBhcmFtc1tcInNzbFwiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInNzY1wiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInBsblwiXSA9IHVuZGVmaW5lZFxuICAgIHVybFBhcmFtc1tcInBjXCJdID0gdW5kZWZpbmVkXG4gIH1cblxuICBpZiAoc2FuZGJveC5jb25maWcuZmlsZXR5cGUgIT09IFwidHNcIikgdXJsUGFyYW1zW1wiZmlsZXR5cGVcIl0gPSBzYW5kYm94LmNvbmZpZy5maWxldHlwZVxuXG4gIGlmIChwYXJhbU92ZXJyaWRlcykge1xuICAgIHVybFBhcmFtcyA9IHsgLi4udXJsUGFyYW1zLCAuLi5wYXJhbU92ZXJyaWRlcyB9XG4gIH1cblxuICAvLyBAdHMtaWdub3JlIC0gdGhpcyBpcyBpbiBNRE4gYnV0IG5vdCBsaWJkb21cbiAgY29uc3QgaGFzSW5pdGlhbE9wdHMgPSBpbml0aWFsT3B0aW9ucy5rZXlzKCkubGVuZ3RoID4gMFxuXG4gIGlmIChPYmplY3Qua2V5cyh1cmxQYXJhbXMpLmxlbmd0aCA+IDAgfHwgaGFzSW5pdGlhbE9wdHMpIHtcbiAgICBsZXQgcXVlcnlTdHJpbmcgPSBPYmplY3QuZW50cmllcyh1cmxQYXJhbXMpXG4gICAgICAuZmlsdGVyKChbX2ssIHZdKSA9PiB2ICE9PSB1bmRlZmluZWQpXG4gICAgICAuZmlsdGVyKChbX2ssIHZdKSA9PiB2ICE9PSBudWxsKVxuICAgICAgLm1hcCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIHJldHVybiBgJHtrZXl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlIGFzIHN0cmluZyl9YFxuICAgICAgfSlcbiAgICAgIC5qb2luKFwiJlwiKVxuXG4gICAgLy8gV2Ugd2FudCB0byBrZWVwIGFyb3VuZCBjdXN0b20gcXVlcnkgdmFyaWFibGVzLCB3aGljaFxuICAgIC8vIGFyZSB1c3VhbGx5IHVzZWQgYnkgcGxheWdyb3VuZCBwbHVnaW5zLCB3aXRoIHRoZSBleGNlcHRpb25cbiAgICAvLyBiZWluZyB0aGUgaW5zdGFsbC1wbHVnaW4gcGFyYW0gYW5kIGFueSBjb21waWxlciBvcHRpb25zXG4gICAgLy8gd2hpY2ggaGF2ZSBhIGRlZmF1bHQgdmFsdWVcblxuICAgIGluaXRpYWxPcHRpb25zLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgIGNvbnN0IHNraXAgPSBbXCJzc2xcIiwgXCJzc2NcIiwgXCJwbG5cIiwgXCJwY1wiXVxuICAgICAgaWYgKHNraXAuaW5jbHVkZXMoa2V5KSkgcmV0dXJuXG4gICAgICBpZiAocXVlcnlTdHJpbmcuaW5jbHVkZXMoa2V5KSkgcmV0dXJuXG4gICAgICBpZiAoY29tcGlsZXJPcHRpb25zW2tleV0pIHJldHVyblxuXG4gICAgICBxdWVyeVN0cmluZyArPSBgJiR7a2V5fT0ke3ZhbHVlfWBcbiAgICB9KVxuXG4gICAgcmV0dXJuIGA/JHtxdWVyeVN0cmluZ30jJHtoYXNofWBcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYCMke2hhc2h9YFxuICB9XG59XG4iXX0=