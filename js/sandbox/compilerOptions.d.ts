import { SandboxConfig } from ".";
type CompilerOptions = import("monaco-editor").languages.typescript.CompilerOptions;
type Monaco = typeof import("monaco-editor");
/**
 * These are the defaults, but they also act as the list of all compiler options
 * which are parsed in the query params.
 */
export declare function getDefaultSandboxCompilerOptions(config: SandboxConfig, monaco: Monaco, ts: {
    versionMajorMinor: string;
}): {
    [x: string]: import("monaco-editor").languages.typescript.CompilerOptionsValue;
    allowJs?: boolean;
    allowSyntheticDefaultImports?: boolean;
    allowUmdGlobalAccess?: boolean;
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    alwaysStrict?: boolean;
    baseUrl?: string;
    charset?: string;
    checkJs?: boolean;
    declaration?: boolean;
    declarationMap?: boolean;
    emitDeclarationOnly?: boolean;
    declarationDir?: string;
    disableSizeLimit?: boolean;
    disableSourceOfProjectReferenceRedirect?: boolean;
    downlevelIteration?: boolean;
    emitBOM?: boolean;
    emitDecoratorMetadata?: boolean;
    experimentalDecorators?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    importHelpers?: boolean;
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    isolatedModules?: boolean;
    jsx?: import("monaco-editor").languages.typescript.JsxEmit;
    keyofStringsOnly?: boolean;
    lib?: string[];
    locale?: string;
    mapRoot?: string;
    maxNodeModuleJsDepth?: number;
    module?: import("monaco-editor").languages.typescript.ModuleKind;
    moduleResolution?: import("monaco-editor").languages.typescript.ModuleResolutionKind;
    newLine?: import("monaco-editor").languages.typescript.NewLineKind;
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    noErrorTruncation?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;
    noImplicitReturns?: boolean;
    noImplicitThis?: boolean;
    noStrictGenericChecks?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    noImplicitUseStrict?: boolean;
    noLib?: boolean;
    noResolve?: boolean;
    out?: string;
    outDir?: string;
    outFile?: string;
    paths?: import("monaco-editor").languages.typescript.MapLike<string[]>;
    preserveConstEnums?: boolean;
    preserveSymlinks?: boolean;
    project?: string;
    reactNamespace?: string;
    jsxFactory?: string;
    composite?: boolean;
    removeComments?: boolean;
    rootDir?: string;
    rootDirs?: string[];
    skipLibCheck?: boolean;
    skipDefaultLibCheck?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    strict?: boolean;
    strictFunctionTypes?: boolean;
    strictBindCallApply?: boolean;
    strictNullChecks?: boolean;
    strictPropertyInitialization?: boolean;
    stripInternal?: boolean;
    suppressExcessPropertyErrors?: boolean;
    suppressImplicitAnyIndexErrors?: boolean;
    target?: import("monaco-editor").languages.typescript.ScriptTarget;
    traceResolution?: boolean;
    resolveJsonModule?: boolean;
    types?: string[];
    typeRoots?: string[];
    esModuleInterop?: boolean;
    useDefineForClassFields?: boolean;
};
/**
 * Loop through all of the entries in the existing compiler options then compare them with the
 * query params and return an object which is the changed settings via the query params
 */
export declare const getCompilerOptionsFromParams: (playgroundDefaults: CompilerOptions, ts: typeof import("typescript"), params: URLSearchParams) => CompilerOptions;
/** Gets a query string representation (hash + queries) */
export declare const createURLQueryWithCompilerOptions: (_sandbox: any, paramOverrides?: any) => string;
export {};
