var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./createElements", "./sidebar/runtime", "./exporter", "./createUI", "./getExample", "./monaco/ExampleHighlight", "./createConfigDropdown", "./sidebar/plugins", "./pluginUtils", "./sidebar/settings", "./navigation", "./twoslashInlays"], function (require, exports, createElements_1, runtime_1, exporter_1, createUI_1, getExample_1, ExampleHighlight_1, createConfigDropdown_1, plugins_1, pluginUtils_1, settings_1, navigation_1, twoslashInlays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupPlayground = void 0;
    const setupPlayground = (sandbox, monaco, config, i, react) => {
        const playgroundParent = sandbox.getDomNode().parentElement.parentElement.parentElement;
        // UI to the left
        const leftNav = (0, createElements_1.createNavigationSection)();
        playgroundParent.insertBefore(leftNav, sandbox.getDomNode().parentElement.parentElement);
        const dragBarLeft = (0, createElements_1.createDragBar)("left");
        playgroundParent.insertBefore(dragBarLeft, sandbox.getDomNode().parentElement.parentElement);
        const showNav = () => {
            const right = document.getElementsByClassName("playground-sidebar").item(0);
            const middle = document.getElementById("editor-container");
            middle.style.width = `calc(100% - ${right.clientWidth + 210}px)`;
            leftNav.style.display = "block";
            leftNav.style.width = "210px";
            leftNav.style.minWidth = "210px";
            leftNav.style.maxWidth = "210px";
            dragBarLeft.style.display = "block";
        };
        const hideNav = () => {
            leftNav.style.display = "none";
            dragBarLeft.style.display = "none";
        };
        hideNav();
        // UI to the right
        const dragBar = (0, createElements_1.createDragBar)("right");
        playgroundParent.appendChild(dragBar);
        const sidebar = (0, createElements_1.createSidebar)();
        playgroundParent.appendChild(sidebar);
        const tabBar = (0, createElements_1.createTabBar)();
        sidebar.appendChild(tabBar);
        const container = (0, createElements_1.createPluginContainer)();
        sidebar.appendChild(container);
        const plugins = [];
        const tabs = [];
        // Let's things like the workbench hook into tab changes
        let didUpdateTab;
        const registerPlugin = (plugin) => {
            plugins.push(plugin);
            const tab = (0, createElements_1.createTabForPlugin)(plugin);
            tabs.push(tab);
            const tabClicked = e => {
                const previousPlugin = getCurrentPlugin();
                let newTab = e.target;
                // It could be a notification you clicked on
                if (newTab.tagName === "DIV")
                    newTab = newTab.parentElement;
                const newPlugin = plugins.find(p => `playground-plugin-tab-${p.id}` == newTab.id);
                (0, createElements_1.activatePlugin)(newPlugin, previousPlugin, sandbox, tabBar, container);
                didUpdateTab && didUpdateTab(newPlugin, previousPlugin);
            };
            tabBar.appendChild(tab);
            tab.onclick = tabClicked;
        };
        const setDidUpdateTab = (func) => {
            didUpdateTab = func;
        };
        const getCurrentPlugin = () => {
            const selectedTab = tabs.find(t => t.classList.contains("active"));
            return plugins[tabs.indexOf(selectedTab)];
        };
        const defaultPlugins = config.plugins || (0, settings_1.getPlaygroundPlugins)();
        const utils = (0, pluginUtils_1.createUtils)(sandbox, react);
        const initialPlugins = defaultPlugins.map(f => f(i, utils));
        initialPlugins.forEach(p => registerPlugin(p));
        // Choose which should be selected
        const priorityPlugin = plugins.find(plugin => plugin.shouldBeSelected && plugin.shouldBeSelected());
        const selectedPlugin = priorityPlugin || plugins[0];
        const selectedTab = tabs[plugins.indexOf(selectedPlugin)];
        selectedTab.onclick({ target: selectedTab });
        let debouncingTimer = false;
        sandbox.editor.onDidChangeModelContent(_event => {
            const plugin = getCurrentPlugin();
            if (plugin.modelChanged)
                plugin.modelChanged(sandbox, sandbox.getModel(), container);
            // This needs to be last in the function
            if (debouncingTimer)
                return;
            debouncingTimer = true;
            setTimeout(() => {
                debouncingTimer = false;
                playgroundDebouncedMainFunction();
                // Only call the plugin function once every 0.3s
                if (plugin.modelChangedDebounce && plugin.id === getCurrentPlugin().id) {
                    plugin.modelChangedDebounce(sandbox, sandbox.getModel(), container);
                }
            }, 300);
        });
        // When there are multi-file playgrounds, we should show the implicit filename, ideally this would be
        // something more inline, but we can abuse the code lenses for now because they get their own line!
        sandbox.monaco.languages.registerCodeLensProvider(sandbox.language, {
            provideCodeLenses: function (model, token) {
                // If you have @filename on the first line, don't show the implicit filename
                const lenses = !showFileCodeLens && !model.getLineContent(1).startsWith("// @filename")
                    ? []
                    : [
                        {
                            range: {
                                startLineNumber: 1,
                                startColumn: 1,
                                endLineNumber: 2,
                                endColumn: 1,
                            },
                            id: "implicit-filename-first",
                            command: {
                                id: "noop",
                                title: `// @filename: ${sandbox.filepath}`,
                            },
                        },
                    ];
                return { lenses, dispose: () => { } };
            },
        });
        let showFileCodeLens = false;
        // If you set this to true, then the next time the playground would
        // have set the user's hash it would be skipped - used for setting
        // the text in examples
        let suppressNextTextChangeForHashChange = false;
        // Sets the URL and storage of the sandbox string
        const playgroundDebouncedMainFunction = () => {
            showFileCodeLens = sandbox.getText().includes("// @filename");
            localStorage.setItem("sandbox-history", sandbox.getText());
        };
        sandbox.editor.onDidBlurEditorText(() => {
            const alwaysUpdateURL = !localStorage.getItem("disable-save-on-type");
            if (alwaysUpdateURL) {
                if (suppressNextTextChangeForHashChange) {
                    suppressNextTextChangeForHashChange = false;
                    return;
                }
                const newURL = sandbox.createURLQueryWithCompilerOptions(sandbox);
                window.history.replaceState({}, "", newURL);
            }
        });
        // Keeps track of whether the project has been set up as an ESM module via a package.json
        let isESMMode = false;
        // When any compiler flags are changed, trigger a potential change to the URL
        sandbox.setDidUpdateCompilerSettings(() => __awaiter(void 0, void 0, void 0, function* () {
            playgroundDebouncedMainFunction();
            // @ts-ignore
            window.appInsights && window.appInsights.trackEvent({ name: "Compiler Settings changed" });
            const model = sandbox.editor.getModel();
            const plugin = getCurrentPlugin();
            if (model && plugin.modelChanged)
                plugin.modelChanged(sandbox, model, container);
            if (model && plugin.modelChangedDebounce)
                plugin.modelChangedDebounce(sandbox, model, container);
            const alwaysUpdateURL = !localStorage.getItem("disable-save-on-type");
            if (alwaysUpdateURL) {
                const newURL = sandbox.createURLQueryWithCompilerOptions(sandbox);
                window.history.replaceState({}, "", newURL);
            }
            // Add an outer package.json with 'module: type' and ensures all the
            // other settings are inline for ESM mode
            const moduleNumber = sandbox.getCompilerOptions().module || 0;
            const isESMviaModule = moduleNumber > 99 && moduleNumber < 200;
            const moduleResNumber = sandbox.getCompilerOptions().moduleResolution || 0;
            const isESMviaModuleRes = moduleResNumber > 2 && moduleResNumber < 100;
            if (isESMviaModule || isESMviaModuleRes) {
                if (isESMMode)
                    return;
                isESMMode = true;
                setTimeout(() => {
                    ui.flashInfo(i("play_esm_mode"));
                }, 300);
                const nextRes = (moduleNumber === 199 || moduleNumber === 100 ? 99 : 2);
                sandbox.setCompilerSettings({ target: 99, moduleResolution: nextRes, module: moduleNumber });
                sandbox.addLibraryToRuntime(JSON.stringify({ name: "playground", type: "module" }), "/package.json");
            }
        }));
        const skipInitiallySettingHash = document.location.hash && document.location.hash.includes("example/");
        if (!skipInitiallySettingHash)
            playgroundDebouncedMainFunction();
        // Setup working with the existing UI, once it's loaded
        // Versions of TypeScript
        // Set up the label for the dropdown
        const versionButton = document.querySelectorAll("#versions > a").item(0);
        versionButton.textContent = "v" + sandbox.ts.version + " ";
        const caret = document.createElement("spam");
        caret.classList.add("caret");
        versionButton.appendChild(caret);
        versionButton.setAttribute("aria-label", `Select version of TypeScript, currently ${sandbox.ts.version}`);
        // Add the versions to the dropdown
        const versionsMenu = document.querySelectorAll("#versions > ul").item(0);
        // Enable all submenus
        document.querySelectorAll("nav ul li").forEach(e => e.classList.add("active"));
        const notWorkingInPlayground = ["3.1.6", "3.0.1", "2.8.1", "2.7.2", "2.4.1"];
        const allVersions = ["Nightly", ...sandbox.supportedVersions.filter(f => !notWorkingInPlayground.includes(f))];
        allVersions.forEach((v) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.textContent = v;
            a.href = "#";
            if (v === "Nightly") {
                li.classList.add("nightly");
            }
            if (v.toLowerCase().includes("beta")) {
                li.classList.add("beta");
            }
            li.onclick = () => {
                const currentURL = sandbox.createURLQueryWithCompilerOptions(sandbox);
                const params = new URLSearchParams(currentURL.split("#")[0]);
                const version = v === "Nightly" ? "next" : v;
                params.set("ts", version);
                const hash = document.location.hash.length ? document.location.hash : "";
                const newURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}?${params}${hash}`;
                // @ts-ignore - it is allowed
                document.location = newURL;
            };
            li.appendChild(a);
            versionsMenu.appendChild(li);
        });
        // Support dropdowns
        document.querySelectorAll(".navbar-sub li.dropdown > a").forEach(link => {
            const a = link;
            a.onclick = _e => {
                if (a.parentElement.classList.contains("open")) {
                    escapePressed();
                }
                else {
                    escapePressed();
                    a.parentElement.classList.toggle("open");
                    a.setAttribute("aria-expanded", "true");
                    const exampleContainer = a.closest("li").getElementsByClassName("dropdown-dialog").item(0);
                    if (!exampleContainer)
                        return;
                    const firstLabel = exampleContainer.querySelector("label");
                    if (firstLabel)
                        firstLabel.focus();
                    // Set exact height and widths for the popovers for the main playground navigation
                    const isPlaygroundSubmenu = !!a.closest("nav");
                    if (isPlaygroundSubmenu) {
                        const playgroundContainer = document.getElementById("playground-container");
                        exampleContainer.style.height = `calc(${playgroundContainer.getBoundingClientRect().height + 26}px - 4rem)`;
                        const sideBarWidth = document.querySelector(".playground-sidebar").offsetWidth;
                        exampleContainer.style.width = `calc(100% - ${sideBarWidth}px - 71px)`;
                        // All this is to make sure that tabbing stays inside the dropdown for tsconfig/examples
                        const buttons = exampleContainer.querySelectorAll("input");
                        const lastButton = buttons.item(buttons.length - 1);
                        if (lastButton) {
                            redirectTabPressTo(lastButton, exampleContainer, ".examples-close");
                        }
                        else {
                            const sections = document.querySelectorAll(".dropdown-dialog .section-content");
                            sections.forEach(s => {
                                const buttons = s.querySelectorAll("a.example-link");
                                const lastButton = buttons.item(buttons.length - 1);
                                if (lastButton) {
                                    redirectTabPressTo(lastButton, exampleContainer, ".examples-close");
                                }
                            });
                        }
                    }
                }
                return false;
            };
        });
        /** Handles removing the dropdowns like tsconfig/examples/handbook */
        const escapePressed = () => {
            document.querySelectorAll(".navbar-sub li.open").forEach(i => i.classList.remove("open"));
            document.querySelectorAll(".navbar-sub li").forEach(i => i.setAttribute("aria-expanded", "false"));
            (0, navigation_1.hideNavForHandbook)(sandbox);
        };
        // Handle escape closing dropdowns etc
        document.onkeydown = function (evt) {
            evt = evt || window.event;
            var isEscape = false;
            if ("key" in evt) {
                isEscape = evt.key === "Escape" || evt.key === "Esc";
            }
            else {
                // @ts-ignore - this used to be the case
                isEscape = evt.keyCode === 27;
            }
            if (isEscape)
                escapePressed();
        };
        const shareAction = {
            id: "copy-clipboard",
            label: "Save to clipboard",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            contextMenuGroupId: "run",
            contextMenuOrder: 1.5,
            run: function () {
                // Update the URL, then write that to the clipboard
                const newURL = sandbox.createURLQueryWithCompilerOptions(sandbox);
                window.history.replaceState({}, "", newURL);
                window.navigator.clipboard.writeText(location.href.toString()).then(() => ui.flashInfo(i("play_export_clipboard")), (e) => alert(e));
            },
        };
        const shareButton = document.getElementById("share-button");
        if (shareButton) {
            shareButton.onclick = e => {
                e.preventDefault();
                shareAction.run();
                return false;
            };
            // Set up some key commands
            sandbox.editor.addAction(shareAction);
            sandbox.editor.addAction({
                id: "run-js",
                label: "Run the evaluated JavaScript for your TypeScript file",
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                contextMenuGroupId: "run",
                contextMenuOrder: 1.5,
                run: function (ed) {
                    const runButton = document.getElementById("run-button");
                    runButton && runButton.onclick && runButton.onclick({});
                },
            });
        }
        const runButton = document.getElementById("run-button");
        if (runButton) {
            runButton.onclick = () => {
                const run = sandbox.getRunnableJS();
                const runPlugin = plugins.find(p => p.id === "logs");
                (0, createElements_1.activatePlugin)(runPlugin, getCurrentPlugin(), sandbox, tabBar, container);
                (0, runtime_1.runWithCustomLogs)(run, i);
                const isJS = sandbox.config.filetype === "js";
                ui.flashInfo(i(isJS ? "play_run_js" : "play_run_ts"));
                return false;
            };
        }
        // Handle the close buttons on the examples
        document.querySelectorAll("button.examples-close").forEach(b => {
            const button = b;
            button.onclick = escapePressed;
        });
        // Support clicking the handbook button on the top nav
        const handbookButton = document.getElementById("handbook-button");
        if (handbookButton) {
            handbookButton.onclick = () => {
                // Two potentially concurrent sidebar navs is just a bit too much
                // state to keep track of ATM
                if (!handbookButton.parentElement.classList.contains("active")) {
                    ui.flashInfo("Cannot open the Playground handbook when in a Gist");
                    return;
                }
                const showingHandbook = handbookButton.parentElement.classList.contains("open");
                if (!showingHandbook) {
                    escapePressed();
                    showNav();
                    handbookButton.parentElement.classList.add("open");
                    (0, navigation_1.showNavForHandbook)(sandbox, escapePressed);
                }
                else {
                    escapePressed();
                }
                return false;
            };
        }
        (0, createElements_1.setupSidebarToggle)();
        if (document.getElementById("config-container")) {
            (0, createConfigDropdown_1.createConfigDropdown)(sandbox, monaco);
            (0, createConfigDropdown_1.updateConfigDropdownForCompilerOptions)(sandbox, monaco);
        }
        if (document.getElementById("playground-settings")) {
            const settingsToggle = document.getElementById("playground-settings");
            settingsToggle.onclick = () => {
                const open = settingsToggle.parentElement.classList.contains("open");
                const sidebarTabs = document.querySelector(".playground-plugin-tabview");
                const sidebarContent = document.querySelector(".playground-plugin-container");
                let settingsContent = document.querySelector(".playground-settings-container");
                if (!settingsContent) {
                    settingsContent = document.createElement("div");
                    settingsContent.className = "playground-settings-container playground-plugin-container";
                    const settings = (0, settings_1.settingsPlugin)(i, utils);
                    settings.didMount && settings.didMount(sandbox, settingsContent);
                    document.querySelector(".playground-sidebar").appendChild(settingsContent);
                    // When the last tab item is hit, go back to the settings button
                    const labels = document.querySelectorAll(".playground-sidebar input");
                    const lastLabel = labels.item(labels.length - 1);
                    if (lastLabel) {
                        redirectTabPressTo(lastLabel, undefined, "#playground-settings");
                    }
                }
                if (open) {
                    sidebarTabs.style.display = "flex";
                    sidebarContent.style.display = "block";
                    settingsContent.style.display = "none";
                }
                else {
                    sidebarTabs.style.display = "none";
                    sidebarContent.style.display = "none";
                    settingsContent.style.display = "block";
                    document.querySelector(".playground-sidebar label").focus();
                }
                settingsToggle.parentElement.classList.toggle("open");
            };
            settingsToggle.addEventListener("keydown", e => {
                const isOpen = settingsToggle.parentElement.classList.contains("open");
                if (e.key === "Tab" && isOpen) {
                    const result = document.querySelector(".playground-options li input");
                    result.focus();
                    e.preventDefault();
                }
            });
        }
        // Support grabbing examples from the location hash
        if (location.hash.startsWith("#example")) {
            const exampleName = location.hash.replace("#example/", "").trim();
            sandbox.config.logger.log("Loading example:", exampleName);
            (0, getExample_1.getExampleSourceCode)(config.prefix, config.lang, exampleName).then(ex => {
                if (ex.example && ex.code) {
                    const { example, code } = ex;
                    // Update the localstorage showing that you've seen this page
                    if (localStorage) {
                        const seenText = localStorage.getItem("examples-seen") || "{}";
                        const seen = JSON.parse(seenText);
                        seen[example.id] = example.hash;
                        localStorage.setItem("examples-seen", JSON.stringify(seen));
                    }
                    const allLinks = document.querySelectorAll("example-link");
                    // @ts-ignore
                    for (const link of allLinks) {
                        if (link.textContent === example.title) {
                            link.classList.add("highlight");
                        }
                    }
                    document.title = "TypeScript Playground - " + example.title;
                    suppressNextTextChangeForHashChange = true;
                    sandbox.setText(code);
                }
                else {
                    suppressNextTextChangeForHashChange = true;
                    sandbox.setText("// There was an issue getting the example, bad URL? Check the console in the developer tools");
                }
            });
        }
        // Set the errors number in the sidebar tabs
        const model = sandbox.getModel();
        model.onDidChangeDecorations(() => {
            const markers = sandbox.monaco.editor.getModelMarkers({ resource: model.uri }).filter(m => m.severity !== 1);
            utils.setNotifications("errors", markers.length);
        });
        // Sets up a way to click between examples
        monaco.languages.registerLinkProvider(sandbox.language, new ExampleHighlight_1.ExampleHighlighter());
        const languageSelector = document.getElementById("language-selector");
        if (languageSelector) {
            const params = new URLSearchParams(location.search);
            const options = ["ts", "d.ts", "js"];
            languageSelector.options.selectedIndex = options.indexOf(params.get("filetype") || "ts");
            languageSelector.onchange = () => {
                const filetype = options[Number(languageSelector.selectedIndex || 0)];
                const query = sandbox.createURLQueryWithCompilerOptions(sandbox, { filetype });
                const fullURL = `${document.location.protocol}//${document.location.host}${document.location.pathname}${query}`;
                // @ts-ignore
                document.location = fullURL;
            };
        }
        // Ensure that the editor is full-width when the screen resizes
        window.addEventListener("resize", () => {
            sandbox.editor.layout();
        });
        // Tells monaco to check out the font sizes in order to make
        // sure that selecting text in the editor provides the same
        // length as unselected text - otherwise space for a selection
        // will be a little bit wider than it should be. s
        setTimeout(() => {
            monaco.editor.remeasureFonts();
        }, 5000);
        const ui = (0, createUI_1.createUI)();
        const exporter = (0, exporter_1.createExporter)(sandbox, monaco, ui);
        const playground = {
            exporter,
            ui,
            registerPlugin,
            plugins,
            getCurrentPlugin,
            tabs,
            setDidUpdateTab,
            createUtils: pluginUtils_1.createUtils,
        };
        window.ts = sandbox.ts;
        window.sandbox = sandbox;
        window.playground = playground;
        console.log(`Using TypeScript ${window.ts.version}`);
        console.log("Available globals:");
        console.log("\twindow.ts", window.ts);
        console.log("\twindow.sandbox", window.sandbox);
        console.log("\twindow.playground", window.playground);
        console.log("\twindow.react", window.react);
        console.log("\twindow.reactDOM", window.reactDOM);
        /** The plugin system */
        const activateExternalPlugin = (plugin, autoActivate) => {
            let readyPlugin;
            // Can either be a factory, or object
            if (typeof plugin === "function") {
                const utils = (0, pluginUtils_1.createUtils)(sandbox, react);
                readyPlugin = plugin(utils);
            }
            else {
                readyPlugin = plugin;
            }
            if (autoActivate) {
                console.log(readyPlugin);
            }
            playground.registerPlugin(readyPlugin);
            // Auto-select the dev plugin
            const pluginWantsFront = readyPlugin.shouldBeSelected && readyPlugin.shouldBeSelected();
            if (pluginWantsFront || autoActivate) {
                // Auto-select the dev plugin
                (0, createElements_1.activatePlugin)(readyPlugin, getCurrentPlugin(), sandbox, tabBar, container);
            }
        };
        // Dev mode plugin
        if (config.supportCustomPlugins && (0, plugins_1.allowConnectingToLocalhost)()) {
            window.exports = {};
            console.log("Connecting to dev plugin");
            try {
                // @ts-ignore
                const re = window.require;
                re(["local/index"], (devPlugin) => {
                    console.log("Set up dev plugin from localhost:5000");
                    try {
                        activateExternalPlugin(devPlugin, true);
                    }
                    catch (error) {
                        console.error(error);
                        setTimeout(() => {
                            ui.flashInfo("Error: Could not load dev plugin from localhost:5000");
                        }, 700);
                    }
                });
            }
            catch (error) {
                console.error("Problem loading up the dev plugin");
                console.error(error);
            }
        }
        const downloadPlugin = (plugin, autoEnable) => {
            try {
                // @ts-ignore
                const re = window.require;
                re([`unpkg/${plugin}@latest/dist/index`], (devPlugin) => {
                    activateExternalPlugin(devPlugin, autoEnable);
                });
            }
            catch (error) {
                console.error("Problem loading up the plugin:", plugin);
                console.error(error);
            }
        };
        if (config.supportCustomPlugins) {
            // Grab ones from localstorage
            (0, plugins_1.activePlugins)().forEach(p => downloadPlugin(p.id, false));
            // Offer to install one if 'install-plugin' is a query param
            const params = new URLSearchParams(location.search);
            const pluginToInstall = params.get("install-plugin");
            if (pluginToInstall) {
                const alreadyInstalled = (0, plugins_1.activePlugins)().find(p => p.id === pluginToInstall);
                if (!alreadyInstalled) {
                    const shouldDoIt = confirm("Would you like to install the third party plugin?\n\n" + pluginToInstall);
                    if (shouldDoIt) {
                        (0, plugins_1.addCustomPlugin)(pluginToInstall);
                        downloadPlugin(pluginToInstall, true);
                    }
                }
            }
        }
        const [tsMajor, tsMinor] = sandbox.ts.version.split(".");
        if ((parseInt(tsMajor) > 4 || (parseInt(tsMajor) == 4 && parseInt(tsMinor) >= 6)) &&
            monaco.languages.registerInlayHintsProvider) {
            monaco.languages.registerInlayHintsProvider(sandbox.language, (0, twoslashInlays_1.createTwoslashInlayProvider)(sandbox));
        }
        if (location.hash.startsWith("#show-examples")) {
            setTimeout(() => {
                var _a;
                (_a = document.getElementById("examples-button")) === null || _a === void 0 ? void 0 : _a.click();
            }, 100);
        }
        if (location.hash.startsWith("#show-whatisnew")) {
            setTimeout(() => {
                var _a;
                (_a = document.getElementById("whatisnew-button")) === null || _a === void 0 ? void 0 : _a.click();
            }, 100);
        }
        // Auto-load into the playground
        if (location.hash.startsWith("#handbook")) {
            setTimeout(() => {
                var _a;
                (_a = document.getElementById("handbook-button")) === null || _a === void 0 ? void 0 : _a.click();
            }, 100);
        }
        return playground;
    };
    exports.setupPlayground = setupPlayground;
    const redirectTabPressTo = (element, container, query) => {
        element.addEventListener("keydown", e => {
            if (e.key === "Tab") {
                const host = container || document;
                const result = host.querySelector(query);
                if (!result)
                    throw new Error(`Expected to find a result for keydown`);
                result.focus();
                e.preventDefault();
            }
        });
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBeUVPLE1BQU0sZUFBZSxHQUFHLENBQzdCLE9BQWdCLEVBQ2hCLE1BQWMsRUFDZCxNQUF3QixFQUN4QixDQUEwQixFQUMxQixLQUFtQixFQUNuQixFQUFFO1FBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsYUFBYyxDQUFDLGFBQWMsQ0FBQyxhQUFjLENBQUE7UUFFMUYsaUJBQWlCO1FBQ2pCLE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXVCLEdBQUUsQ0FBQTtRQUN6QyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxhQUFjLENBQUMsYUFBYyxDQUFDLENBQUE7UUFFMUYsTUFBTSxXQUFXLEdBQUcsSUFBQSw4QkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLGFBQWMsQ0FBQyxhQUFjLENBQUMsQ0FBQTtRQUU5RixNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDbkIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFBO1lBQzVFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUUsQ0FBQTtZQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxlQUFlLEtBQUssQ0FBQyxXQUFXLEdBQUcsR0FBRyxLQUFLLENBQUE7WUFFaEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQy9CLE9BQU8sQ0FBQyxLQUFL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QUUsU0FBa0MsRUFBRSxLQUFhLEVBQUUsRUFBRTtRQUNyRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3RDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxJQUFJLEdBQUcsU0FBUyxJQUFJLFFBQVEsQ0FBQTtnQkFDbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQVEsQ0FBQTtnQkFDL0MsSUFBSSxDQUFDLE1BQU07b0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO2dCQUNyRSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7Z0JBQ2QsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFBO1lBQ3BCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInR5cGUgU2FuZGJveCA9IGltcG9ydChcIkB0eXBlc2NyaXB0L3NhbmRib3hcIikuU2FuZGJveFxudHlwZSBNb25hY28gPSB0eXBlb2YgaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKVxuXG5kZWNsYXJlIGNvbnN0IHdpbmRvdzogYW55XG5cbmltcG9ydCB7XG4gIGNyZWF0ZVNpZGViYXIsXG4gIGNyZWF0ZVRhYkZvclBsdWdpbixcbiAgY3JlYXRlVGFiQmFyLFxuICBjcmVhdGVQbHVnaW5Db250YWluZXIsXG4gIGFjdGl2YXRlUGx1Z2luLFxuICBjcmVhdGVEcmFnQmFyLFxuICBzZXR1cFNpZGViYXJUb2dnbGUsXG4gIGNyZWF0ZU5hdmlnYXRpb25TZWN0aW9uLFxufSBmcm9tIFwiLi9jcmVhdGVFbGVtZW50c1wiXG5pbXBvcnQgeyBydW5XaXRoQ3VzdG9tTG9ncyB9IGZyb20gXCIuL3NpZGViYXIvcnVudGltZVwiXG5pbXBvcnQgeyBjcmVhdGVFeHBvcnRlciB9IGZyb20gXCIuL2V4cG9ydGVyXCJcbmltcG9ydCB7IGNyZWF0ZVVJIH0gZnJvbSBcIi4vY3JlYXRlVUlcIlxuaW1wb3J0IHsgZ2V0RXhhbXBsZVNvdXJjZUNvZGUgfSBmcm9tIFwiLi9nZXRFeGFtcGxlXCJcbmltcG9ydCB7IEV4YW1wbGVIaWdobGlnaHRlciB9IGZyb20gXCIuL21vbmFjby9FeGFtcGxlSGlnaGxpZ2h0XCJcbmltcG9ydCB7IGNyZWF0ZUNvbmZpZ0Ryb3Bkb3duLCB1cGRhdGVDb25maWdEcm9wZG93bkZvckNvbXBpbGVyT3B0aW9ucyB9IGZyb20gXCIuL2NyZWF0ZUNvbmZpZ0Ryb3Bkb3duXCJcbmltcG9ydCB7IGFsbG93Q29ubmVjdGluZ1RvTG9jYWxob3N0LCBhY3RpdmVQbHVnaW5zLCBhZGRDdXN0b21QbHVnaW4gfSBmcm9tIFwiLi9zaWRlYmFyL3BsdWdpbnNcIlxuaW1wb3J0IHsgY3JlYXRlVXRpbHMsIFBsdWdpblV0aWxzIH0gZnJvbSBcIi4vcGx1Z2luVXRpbHNcIlxuaW1wb3J0IHR5cGUgUmVhY3QgZnJvbSBcInJlYWN0XCJcbmltcG9ydCB7IHNldHRpbmdzUGx1Z2luLCBnZXRQbGF5Z3JvdW5kUGx1Z2lucyB9IGZyb20gXCIuL3NpZGViYXIvc2V0dGluZ3NcIlxuaW1wb3J0IHsgaGlkZU5hdkZvckhhbmRib29rLCBzaG93TmF2Rm9ySGFuZGJvb2sgfSBmcm9tIFwiLi9uYXZpZ2F0aW9uXCJcbmltcG9ydCB7IGNyZWF0ZVR3b3NsYXNoSW5sYXlQcm92aWRlciB9IGZyb20gXCIuL3R3b3NsYXNoSW5sYXlzXCJcblxuZXhwb3J0IHsgUGx1Z2luVXRpbHMgfSBmcm9tIFwiLi9wbHVnaW5VdGlsc1wiXG5cbmV4cG9ydCB0eXBlIFBsdWdpbkZhY3RvcnkgPSB7XG4gIChpOiAoa2V5OiBzdHJpbmcsIGNvbXBvbmVudHM/OiBhbnkpID0+IHN0cmluZywgdXRpbHM6IFBsdWdpblV0aWxzKTogUGxheWdyb3VuZFBsdWdpblxufVxuXG4vKiogVGhlIGludGVyZmFjZSBvZiBhbGwgc2lkZWJhciBwbHVnaW5zICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYXlncm91bmRQbHVnaW4ge1xuICAvKiogTm90IHB1YmxpYyBmYWNpbmcsIGJ1dCB1c2VkIGJ5IHRoZSBwbGF5Z3JvdW5kIHRvIHVuaXF1ZWx5IGlkZW50aWZ5IHBsdWdpbnMgKi9cbiAgaWQ6IHN0cmluZ1xuICAvKiogVG8gc2hvdyBpbiB0aGUgdGFicyAqL1xuICBkaXNwbGF5TmFtZTogc3RyaW5nXG4gIC8qKiBTaG91bGQgdGhpcyBwbHVnaW4gYmUgc2VsZWN0ZWQgd2hlbiB0aGUgcGx1Z2luIGlzIGZpcnN0IGxvYWRlZD8gTGV0cyB5b3UgY2hlY2sgZm9yIHF1ZXJ5IHZhcnMgZXRjIHRvIGxvYWQgYSBwYXJ0aWN1bGFyIHBsdWdpbiAqL1xuICBzaG91bGRCZVNlbGVjdGVkPzogKCkgPT4gYm9vbGVhblxuICAvKiogQmVmb3JlIHdlIHNob3cgdGhlIHRhYiwgdXNlIHRoaXMgdG8gc2V0IHVwIHlvdXIgSFRNTCAtIGl0IHdpbGwgYWxsIGJlIHJlbW92ZWQgYnkgdGhlIHBsYXlncm91bmQgd2hlbiBzb21lb25lIG5hdmlnYXRlcyBvZmYgdGhlIHRhYiAqL1xuICB3aWxsTW91bnQ/OiAoc2FuZGJveDogU2FuZGJveCwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkgPT4gdm9pZFxuICAvKiogQWZ0ZXIgd2Ugc2hvdyB0aGUgdGFiICovXG4gIGRpZE1vdW50PzogKHNhbmRib3g6IFNhbmRib3gsIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQpID0+IHZvaWRcbiAgLyoqIE1vZGVsIGNoYW5nZXMgd2hpbGUgdGhpcyBwbHVnaW4gaXMgYWN0aXZlbHkgc2VsZWN0ZWQgICovXG4gIG1vZGVsQ2hhbmdlZD86IChzYW5kYm94OiBTYW5kYm94LCBtb2RlbDogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5lZGl0b3IuSVRleHRNb2RlbCwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkgPT4gdm9pZFxuICAvKiogRGVsYXllZCBtb2RlbCBjaGFuZ2VzIHdoaWxlIHRoaXMgcGx1Z2luIGlzIGFjdGl2ZWx5IHNlbGVjdGVkLCB1c2VmdWwgd2hlbiB5b3UgYXJlIHdvcmtpbmcgd2l0aCB0aGUgVFMgQVBJIGJlY2F1c2UgaXQgd29uJ3QgcnVuIG9uIGV2ZXJ5IGtleXByZXNzICovXG4gIG1vZGVsQ2hhbmdlZERlYm91bmNlPzogKFxuICAgIHNhbmRib3g6IFNhbmRib3gsXG4gICAgbW9kZWw6IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikuZWRpdG9yLklUZXh0TW9kZWwsXG4gICAgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudFxuICApID0+IHZvaWRcbiAgLyoqIEJlZm9yZSB3ZSByZW1vdmUgdGhlIHRhYiAqL1xuICB3aWxsVW5tb3VudD86IChzYW5kYm94OiBTYW5kYm94LCBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50KSA9PiB2b2lkXG4gIC8qKiBBZnRlciB3ZSByZW1vdmUgdGhlIHRhYiAqL1xuICBkaWRVbm1vdW50PzogKHNhbmRib3g6IFNhbmRib3gsIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQpID0+IHZvaWRcbiAgLyoqIEFuIG9iamVjdCB5b3UgY2FuIHVzZSB0byBrZWVwIGRhdGEgYXJvdW5kIGluIHRoZSBzY29wZSBvZiB5b3VyIHBsdWdpbiBvYmplY3QgKi9cbiAgZGF0YT86IGFueVxufVxuXG5pbnRlcmZhY2UgUGxheWdyb3VuZENvbmZpZyB7XG4gIC8qKiBMYW5ndWFnZSBsaWtlIFwiZW5cIiAvIFwiamFcIiBldGMgKi9cbiAgbGFuZzogc3RyaW5nXG4gIC8qKiBTaXRlIHByZWZpeCwgbGlrZSBcInYyXCIgZHVyaW5nIHRoZSBwcmUtcmVsZWFzZSAqL1xuICBwcmVmaXg6IHN0cmluZ1xuICAvKiogT3B0aW9uYWwgcGx1Z2lucyBzbyB0aGF0IHdlIGNhbiByZS11c2UgdGhlIHBsYXlncm91bmQgd2l0aCBkaWZmZXJlbnQgc2lkZWJhcnMgKi9cbiAgcGx1Z2lucz86IFBsdWdpbkZhY3RvcnlbXVxuICAvKiogU2hvdWxkIHRoaXMgcGxheWdyb3VuZCBsb2FkIHVwIGN1c3RvbSBwbHVnaW5zIGZyb20gbG9jYWxTdG9yYWdlPyAqL1xuICBzdXBwb3J0Q3VzdG9tUGx1Z2luczogYm9vbGVhblxufVxuXG5leHBvcnQgY29uc3Qgc2V0dXBQbGF5Z3JvdW5kID0gKFxuICBzYW5kYm94OiBTYW5kYm94LFxuICBtb25hY286IE1vbmFjbyxcbiAgY29uZmlnOiBQbGF5Z3JvdW5kQ29uZmlnLFxuICBpOiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZyxcbiAgcmVhY3Q6IHR5cGVvZiBSZWFjdFxuKSA9PiB7XG4gIGNvbnN0IHBsYXlncm91bmRQYXJlbnQgPSBzYW5kYm94LmdldERvbU5vZGUoKS5wYXJlbnRFbGVtZW50IS5wYXJlbnRFbGVtZW50IS5wYXJlbnRFbGVtZW50IVxuXG4gIC8vIFVJIHRvIHRoZSBsZWZ0XG4gIGNvbnN0IGxlZnROYXYgPSBjcmVhdGVOYXZpZ2F0aW9uU2VjdGlvbigpXG4gIHBsYXlncm91bmRQYXJlbnQuaW5zZXJ0QmVmb3JlKGxlZnROYXYsIHNhbmRib3guZ2V0RG9tTm9kZSgpLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhKVxuXG4gIGNvbnN0IGRyYWdCYXJMZWZ0ID0gY3JlYXRlRHJhZ0JhcihcImxlZnRcIilcbiAgcGxheWdyb3VuZFBhcmVudC5pbnNlcnRCZWZvcmUoZHJhZ0JhckxlZnQsIHNhbmRib3guZ2V0RG9tTm9kZSgpLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhKVxuXG4gIGNvbnN0IHNob3dOYXYgPSAoKSA9PiB7XG4gICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicGxheWdyb3VuZC1zaWRlYmFyXCIpLml0ZW0oMCkhXG4gICAgY29uc3QgbWlkZGxlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItY29udGFpbmVyXCIpIVxuICAgIG1pZGRsZS5zdHlsZS53aWR0aCA9IGBjYWxjKDEwMCUgLSAke3JpZ2h0LmNsaWVudFdpZHRoICsgMjEwfXB4KWBcblxuICAgIGxlZnROYXYuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgIGxlZnROYXYuc3R5bGUud2lkdGggPSBcIjIxMHB4XCJcbiAgICBsZWZ0TmF2LnN0eWxlLm1pbldpZHRoID0gXCIyMTBweFwiXG4gICAgbGVmdE5hdi5zdHlsZS5tYXhXaWR0aCA9IFwiMjEwcHhcIlxuICAgIGRyYWdCYXJMZWZ0LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgfVxuICBjb25zdCBoaWRlTmF2ID0gKCkgPT4ge1xuICAgIGxlZnROYXYuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gICAgZHJhZ0JhckxlZnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gIH1cblxuICBoaWRlTmF2KClcblxuICAvLyBVSSB0byB0aGUgcmlnaHRcbiAgY29uc3QgZHJhZ0JhciA9IGNyZWF0ZURyYWdCYXIoXCJyaWdodFwiKVxuICBwbGF5Z3JvdW5kUGFyZW50LmFwcGVuZENoaWxkKGRyYWdCYXIpXG5cbiAgY29uc3Qgc2lkZWJhciA9IGNyZWF0ZVNpZGViYXIoKVxuICBwbGF5Z3JvdW5kUGFyZW50LmFwcGVuZENoaWxkKHNpZGViYXIpXG5cbiAgY29uc3QgdGFiQmFyID0gY3JlYXRlVGFiQmFyKClcbiAgc2lkZWJhci5hcHBlbmRDaGlsZCh0YWJCYXIpXG5cbiAgY29uc3QgY29udGFpbmVyID0gY3JlYXRlUGx1Z2luQ29udGFpbmVyKClcbiAgc2lkZWJhci5hcHBlbmRDaGlsZChjb250YWluZXIpXG5cbiAgY29uc3QgcGx1Z2lucyA9IFtdIGFzIFBsYXlncm91bmRQbHVnaW5bXVxuICBjb25zdCB0YWJzID0gW10gYXMgSFRNTEJ1dHRvbkVsZW1lbnRbXVxuXG4gIC8vIExldCdzIHRoaW5ncyBsaWtlIHRoZSB3b3JrYmVuY2ggaG9vayBpbnRvIHRhYiBjaGFuZ2VzXG4gIGxldCBkaWRVcGRhdGVUYWI6IChuZXdQbHVnaW46IFBsYXlncm91bmRQbHVnaW4sIHByZXZpb3VzUGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luKSA9PiB2b2lkIHwgdW5kZWZpbmVkXG5cbiAgY29uc3QgcmVnaXN0ZXJQbHVnaW4gPSAocGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luKSA9PiB7XG4gICAgcGx1Z2lucy5wdXNoKHBsdWdpbilcblxuICAgIGNvbnN0IHRhYiA9IGNyZWF0ZVRhYkZvclBsdWdpbihwbHVnaW4pXG5cbiAgICB0YWJzLnB1c2godGFiKVxuXG4gICAgY29uc3QgdGFiQ2xpY2tlZDogSFRNTEVsZW1lbnRbXCJvbmNsaWNrXCJdID0gZSA9PiB7XG4gICAgICBjb25zdCBwcmV2aW91c1BsdWdpbiA9IGdldEN1cnJlbnRQbHVnaW4oKVxuICAgICAgbGV0IG5ld1RhYiA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50XG4gICAgICAvLyBJdCBjb3VsZCBiZSBhIG5vdGlmaWNhdGlvbiB5b3UgY2xpY2tlZCBvblxuICAgICAgaWYgKG5ld1RhYi50YWdOYW1lID09PSBcIkRJVlwiKSBuZXdUYWIgPSBuZXdUYWIucGFyZW50RWxlbWVudCFcbiAgICAgIGNvbnN0IG5ld1BsdWdpbiA9IHBsdWdpbnMuZmluZChwID0+IGBwbGF5Z3JvdW5kLXBsdWdpbi10YWItJHtwLmlkfWAgPT0gbmV3VGFiLmlkKSFcbiAgICAgIGFjdGl2YXRlUGx1Z2luKG5ld1BsdWdpbiwgcHJldmlvdXNQbHVnaW4sIHNhbmRib3gsIHRhYkJhciwgY29udGFpbmVyKVxuICAgICAgZGlkVXBkYXRlVGFiICYmIGRpZFVwZGF0ZVRhYihuZXdQbHVnaW4sIHByZXZpb3VzUGx1Z2luKVxuICAgIH1cblxuICAgIHRhYkJhci5hcHBlbmRDaGlsZCh0YWIpXG4gICAgdGFiLm9uY2xpY2sgPSB0YWJDbGlja2VkXG4gIH1cblxuICBjb25zdCBzZXREaWRVcGRhdGVUYWIgPSAoZnVuYzogKG5ld1BsdWdpbjogUGxheWdyb3VuZFBsdWdpbiwgcHJldmlvdXNQbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHZvaWQpID0+IHtcbiAgICBkaWRVcGRhdGVUYWIgPSBmdW5jXG4gIH1cblxuICBjb25zdCBnZXRDdXJyZW50UGx1Z2luID0gKCkgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGVkVGFiID0gdGFicy5maW5kKHQgPT4gdC5jbGFzc0xpc3QuY29udGFpbnMoXCJhY3RpdmVcIikpIVxuICAgIHJldHVybiBwbHVnaW5zW3RhYnMuaW5kZXhPZihzZWxlY3RlZFRhYildXG4gIH1cblxuICBjb25zdCBkZWZhdWx0UGx1Z2lucyA9IGNvbmZpZy5wbHVnaW5zIHx8IGdldFBsYXlncm91bmRQbHVnaW5zKClcbiAgY29uc3QgdXRpbHMgPSBjcmVhdGVVdGlscyhzYW5kYm94LCByZWFjdClcbiAgY29uc3QgaW5pdGlhbFBsdWdpbnMgPSBkZWZhdWx0UGx1Z2lucy5tYXAoZiA9PiBmKGksIHV0aWxzKSlcbiAgaW5pdGlhbFBsdWdpbnMuZm9yRWFjaChwID0+IHJlZ2lzdGVyUGx1Z2luKHApKVxuXG4gIC8vIENob29zZSB3aGljaCBzaG91bGQgYmUgc2VsZWN0ZWRcbiAgY29uc3QgcHJpb3JpdHlQbHVnaW4gPSBwbHVnaW5zLmZpbmQocGx1Z2luID0+IHBsdWdpbi5zaG91bGRCZVNlbGVjdGVkICYmIHBsdWdpbi5zaG91bGRCZVNlbGVjdGVkKCkpXG4gIGNvbnN0IHNlbGVjdGVkUGx1Z2luID0gcHJpb3JpdHlQbHVnaW4gfHwgcGx1Z2luc1swXVxuICBjb25zdCBzZWxlY3RlZFRhYiA9IHRhYnNbcGx1Z2lucy5pbmRleE9mKHNlbGVjdGVkUGx1Z2luKV0hXG4gIHNlbGVjdGVkVGFiLm9uY2xpY2shKHsgdGFyZ2V0OiBzZWxlY3RlZFRhYiB9IGFzIGFueSlcblxuICBsZXQgZGVib3VuY2luZ1RpbWVyID0gZmFsc2VcbiAgc2FuZGJveC5lZGl0b3Iub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQoX2V2ZW50ID0+IHtcbiAgICBjb25zdCBwbHVnaW4gPSBnZXRDdXJyZW50UGx1Z2luKClcbiAgICBpZiAocGx1Z2luLm1vZGVsQ2hhbmdlZCkgcGx1Z2luLm1vZGVsQ2hhbmdlZChzYW5kYm94LCBzYW5kYm94LmdldE1vZGVsKCksIGNvbnRhaW5lcilcblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgbGFzdCBpbiB0aGUgZnVuY3Rpb25cbiAgICBpZiAoZGVib3VuY2luZ1RpbWVyKSByZXR1cm5cbiAgICBkZWJvdW5jaW5nVGltZXIgPSB0cnVlXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkZWJvdW5jaW5nVGltZXIgPSBmYWxzZVxuICAgICAgcGxheWdyb3VuZERlYm91bmNlZE1haW5GdW5jdGlvbigpXG5cbiAgICAgIC8vIE9ubHkgY2FsbCB0aGUgcGx1Z2luIGZ1bmN0aW9uIG9uY2UgZXZlcnkgMC4zc1xuICAgICAgaWYgKHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZSAmJiBwbHVnaW4uaWQgPT09IGdldEN1cnJlbnRQbHVnaW4oKS5pZCkge1xuICAgICAgICBwbHVnaW4ubW9kZWxDaGFuZ2VkRGVib3VuY2Uoc2FuZGJveCwgc2FuZGJveC5nZXRNb2RlbCgpLCBjb250YWluZXIpXG4gICAgICB9XG4gICAgfSwgMzAwKVxuICB9KVxuXG4gIC8vIFdoZW4gdGhlcmUgYXJlIG11bHRpLWZpbGUgcGxheWdyb3VuZHMsIHdlIHNob3VsZCBzaG93IHRoZSBpbXBsaWNpdCBmaWxlbmFtZSwgaWRlYWxseSB0aGlzIHdvdWxkIGJlXG4gIC8vIHNvbWV0aGluZyBtb3JlIGlubGluZSwgYnV0IHdlIGNhbiBhYnVzZSB0aGUgY29kZSBsZW5zZXMgZm9yIG5vdyBiZWNhdXNlIHRoZXkgZ2V0IHRoZWlyIG93biBsaW5lIVxuICBzYW5kYm94Lm1vbmFjby5sYW5ndWFnZXMucmVnaXN0ZXJDb2RlTGVuc1Byb3ZpZGVyKHNhbmRib3gubGFuZ3VhZ2UsIHtcbiAgICBwcm92aWRlQ29kZUxlbnNlczogZnVuY3Rpb24gKG1vZGVsLCB0b2tlbikge1xuICAgICAgLy8gSWYgeW91IGhhdmUgQGZpbGVuYW1lIG9uIHRoZSBmaXJzdCBsaW5lLCBkb24ndCBzaG93IHRoZSBpbXBsaWNpdCBmaWxlbmFtZVxuICAgICAgY29uc3QgbGVuc2VzID0gIXNob3dGaWxlQ29kZUxlbnMgJiYgIW1vZGVsLmdldExpbmVDb250ZW50KDEpLnN0YXJ0c1dpdGgoXCIvLyBAZmlsZW5hbWVcIilcbiAgICAgICAgPyBbXVxuICAgICAgICA6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IDEsXG4gICAgICAgICAgICAgICAgc3RhcnRDb2x1bW46IDEsXG4gICAgICAgICAgICAgICAgZW5kTGluZU51bWJlcjogMixcbiAgICAgICAgICAgICAgICBlbmRDb2x1bW46IDEsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGlkOiBcImltcGxpY2l0LWZpbGVuYW1lLWZpcnN0XCIsXG4gICAgICAgICAgICAgIGNvbW1hbmQ6IHtcbiAgICAgICAgICAgICAgICBpZDogXCJub29wXCIsXG4gICAgICAgICAgICAgICAgdGl0bGU6IGAvLyBAZmlsZW5hbWU6ICR7c2FuZGJveC5maWxlcGF0aH1gLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdXG4gICAgICByZXR1cm4geyBsZW5zZXMsIGRpc3Bvc2U6ICgpID0+IHt9IH1cbiAgICB9LFxuICB9KVxuXG4gIGxldCBzaG93RmlsZUNvZGVMZW5zID0gZmFsc2VcblxuICAvLyBJZiB5b3Ugc2V0IHRoaXMgdG8gdHJ1ZSwgdGhlbiB0aGUgbmV4dCB0aW1lIHRoZSBwbGF5Z3JvdW5kIHdvdWxkXG4gIC8vIGhhdmUgc2V0IHRoZSB1c2VyJ3MgaGFzaCBpdCB3b3VsZCBiZSBza2lwcGVkIC0gdXNlZCBmb3Igc2V0dGluZ1xuICAvLyB0aGUgdGV4dCBpbiBleGFtcGxlc1xuICBsZXQgc3VwcHJlc3NOZXh0VGV4dENoYW5nZUZvckhhc2hDaGFuZ2UgPSBmYWxzZVxuXG4gIC8vIFNldHMgdGhlIFVSTCBhbmQgc3RvcmFnZSBvZiB0aGUgc2FuZGJveCBzdHJpbmdcbiAgY29uc3QgcGxheWdyb3VuZERlYm91bmNlZE1haW5GdW5jdGlvbiA9ICgpID0+IHtcbiAgICBzaG93RmlsZUNvZGVMZW5zID0gc2FuZGJveC5nZXRUZXh0KCkuaW5jbHVkZXMoXCIvLyBAZmlsZW5hbWVcIilcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInNhbmRib3gtaGlzdG9yeVwiLCBzYW5kYm94LmdldFRleHQoKSlcbiAgfVxuXG4gIHNhbmRib3guZWRpdG9yLm9uRGlkQmx1ckVkaXRvclRleHQoKCkgPT4ge1xuICAgIGNvbnN0IGFsd2F5c1VwZGF0ZVVSTCA9ICFsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImRpc2FibGUtc2F2ZS1vbi10eXBlXCIpXG4gICAgaWYgKGFsd2F5c1VwZGF0ZVVSTCkge1xuICAgICAgaWYgKHN1cHByZXNzTmV4dFRleHRDaGFuZ2VGb3JIYXNoQ2hhbmdlKSB7XG4gICAgICAgIHN1cHByZXNzTmV4dFRleHRDaGFuZ2VGb3JIYXNoQ2hhbmdlID0gZmFsc2VcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG4gICAgICBjb25zdCBuZXdVUkwgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94KVxuICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBcIlwiLCBuZXdVUkwpXG4gICAgfVxuICB9KVxuXG4gIC8vIEtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgdGhlIHByb2plY3QgaGFzIGJlZW4gc2V0IHVwIGFzIGFuIEVTTSBtb2R1bGUgdmlhIGEgcGFja2FnZS5qc29uXG4gIGxldCBpc0VTTU1vZGUgPSBmYWxzZVxuXG4gIC8vIFdoZW4gYW55IGNvbXBpbGVyIGZsYWdzIGFyZSBjaGFuZ2VkLCB0cmlnZ2VyIGEgcG90ZW50aWFsIGNoYW5nZSB0byB0aGUgVVJMXG4gIHNhbmRib3guc2V0RGlkVXBkYXRlQ29tcGlsZXJTZXR0aW5ncyhhc3luYyAoKSA9PiB7XG4gICAgcGxheWdyb3VuZERlYm91bmNlZE1haW5GdW5jdGlvbigpXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIHdpbmRvdy5hcHBJbnNpZ2h0cyAmJiB3aW5kb3cuYXBwSW5zaWdodHMudHJhY2tFdmVudCh7IG5hbWU6IFwiQ29tcGlsZXIgU2V0dGluZ3MgY2hhbmdlZFwiIH0pXG5cbiAgICBjb25zdCBtb2RlbCA9IHNhbmRib3guZWRpdG9yLmdldE1vZGVsKClcbiAgICBjb25zdCBwbHVnaW4gPSBnZXRDdXJyZW50UGx1Z2luKClcbiAgICBpZiAobW9kZWwgJiYgcGx1Z2luLm1vZGVsQ2hhbmdlZCkgcGx1Z2luLm1vZGVsQ2hhbmdlZChzYW5kYm94LCBtb2RlbCwgY29udGFpbmVyKVxuICAgIGlmIChtb2RlbCAmJiBwbHVnaW4ubW9kZWxDaGFuZ2VkRGVib3VuY2UpIHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZShzYW5kYm94LCBtb2RlbCwgY29udGFpbmVyKVxuXG4gICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGlzYWJsZS1zYXZlLW9uLXR5cGVcIilcbiAgICBpZiAoYWx3YXlzVXBkYXRlVVJMKSB7XG4gICAgICBjb25zdCBuZXdVUkwgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94KVxuICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBcIlwiLCBuZXdVUkwpXG4gICAgfVxuXG4gICAgLy8gQWRkIGFuIG91dGVyIHBhY2thZ2UuanNvbiB3aXRoICdtb2R1bGU6IHR5cGUnIGFuZCBlbnN1cmVzIGFsbCB0aGVcbiAgICAvLyBvdGhlciBzZXR0aW5ncyBhcmUgaW5saW5lIGZvciBFU00gbW9kZVxuICAgIGNvbnN0IG1vZHVsZU51bWJlciA9IChzYW5kYm94LmdldENvbXBpbGVyT3B0aW9ucygpLm1vZHVsZSBhcyBudW1iZXIpIHx8IDBcbiAgICBjb25zdCBpc0VTTXZpYU1vZHVsZSA9IG1vZHVsZU51bWJlciA+IDk5ICYmIG1vZHVsZU51bWJlciA8IDIwMFxuICAgIGNvbnN0IG1vZHVsZVJlc051bWJlciA9IHNhbmRib3guZ2V0Q29tcGlsZXJPcHRpb25zKCkubW9kdWxlUmVzb2x1dGlvbiB8fCAwXG4gICAgY29uc3QgaXNFU012aWFNb2R1bGVSZXMgPSBtb2R1bGVSZXNOdW1iZXIgPiAyICYmIG1vZHVsZVJlc051bWJlciA8IDEwMFxuXG4gICAgaWYgKGlzRVNNdmlhTW9kdWxlIHx8IGlzRVNNdmlhTW9kdWxlUmVzKSB7XG4gICAgICBpZiAoaXNFU01Nb2RlKSByZXR1cm5cbiAgICAgIGlzRVNNTW9kZSA9IHRydWVcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB1aS5mbGFzaEluZm8oaShcInBsYXlfZXNtX21vZGVcIikpXG4gICAgICB9LCAzMDApXG5cbiAgICAgIGNvbnN0IG5leHRSZXMgPSAobW9kdWxlTnVtYmVyID09PSAxOTkgfHwgbW9kdWxlTnVtYmVyID09PSAxMDAgPyA5OSA6IDIpIGFzIGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikubGFuZ3VhZ2VzLnR5cGVzY3JpcHQuTW9kdWxlUmVzb2x1dGlvbktpbmRcbiAgICAgIHNhbmRib3guc2V0Q29tcGlsZXJTZXR0aW5ncyh7IHRhcmdldDogOTksIG1vZHVsZVJlc29sdXRpb246IG5leHRSZXMsIG1vZHVsZTogbW9kdWxlTnVtYmVyIH0pXG4gICAgICBzYW5kYm94LmFkZExpYnJhcnlUb1J1bnRpbWUoSlNPTi5zdHJpbmdpZnkoeyBuYW1lOiBcInBsYXlncm91bmRcIiwgdHlwZTogXCJtb2R1bGVcIiB9KSwgXCIvcGFja2FnZS5qc29uXCIpXG4gICAgfVxuICB9KVxuXG4gIGNvbnN0IHNraXBJbml0aWFsbHlTZXR0aW5nSGFzaCA9IGRvY3VtZW50LmxvY2F0aW9uLmhhc2ggJiYgZG9jdW1lbnQubG9jYXRpb24uaGFzaC5pbmNsdWRlcyhcImV4YW1wbGUvXCIpXG4gIGlmICghc2tpcEluaXRpYWxseVNldHRpbmdIYXNoKSBwbGF5Z3JvdW5kRGVib3VuY2VkTWFpbkZ1bmN0aW9uKClcblxuICAvLyBTZXR1cCB3b3JraW5nIHdpdGggdGhlIGV4aXN0aW5nIFVJLCBvbmNlIGl0J3MgbG9hZGVkXG5cbiAgLy8gVmVyc2lvbnMgb2YgVHlwZVNjcmlwdFxuXG4gIC8vIFNldCB1cCB0aGUgbGFiZWwgZm9yIHRoZSBkcm9wZG93blxuICBjb25zdCB2ZXJzaW9uQnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN2ZXJzaW9ucyA+IGFcIikuaXRlbSgwKVxuICB2ZXJzaW9uQnV0dG9uLnRleHRDb250ZW50ID0gXCJ2XCIgKyBzYW5kYm94LnRzLnZlcnNpb24gKyBcIiBcIlxuICBjb25zdCBjYXJldCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFtXCIpXG4gIGNhcmV0LmNsYXNzTGlzdC5hZGQoXCJjYXJldFwiKVxuICB2ZXJzaW9uQnV0dG9uLmFwcGVuZENoaWxkKGNhcmV0KVxuICB2ZXJzaW9uQnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgYFNlbGVjdCB2ZXJzaW9uIG9mIFR5cGVTY3JpcHQsIGN1cnJlbnRseSAke3NhbmRib3gudHMudmVyc2lvbn1gKVxuXG4gIC8vIEFkZCB0aGUgdmVyc2lvbnMgdG8gdGhlIGRyb3Bkb3duXG4gIGNvbnN0IHZlcnNpb25zTWVudSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIjdmVyc2lvbnMgPiB1bFwiKS5pdGVtKDApXG5cbiAgLy8gRW5hYmxlIGFsbCBzdWJtZW51c1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibmF2IHVsIGxpXCIpLmZvckVhY2goZSA9PiBlLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIikpXG5cbiAgY29uc3Qgbm90V29ya2luZ0luUGxheWdyb3VuZCA9IFtcIjMuMS42XCIsIFwiMy4wLjFcIiwgXCIyLjguMVwiLCBcIjIuNy4yXCIsIFwiMi40LjFcIl1cblxuICBjb25zdCBhbGxWZXJzaW9ucyA9IFtcIk5pZ2h0bHlcIiwgLi4uc2FuZGJveC5zdXBwb3J0ZWRWZXJzaW9ucy5maWx0ZXIoZiA9PiAhbm90V29ya2luZ0luUGxheWdyb3VuZC5pbmNsdWRlcyhmKSldXG5cbiAgYWxsVmVyc2lvbnMuZm9yRWFjaCgodjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIilcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIilcbiAgICBhLnRleHRDb250ZW50ID0gdlxuICAgIGEuaHJlZiA9IFwiI1wiXG5cbiAgICBpZiAodiA9PT0gXCJOaWdodGx5XCIpIHtcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoXCJuaWdodGx5XCIpXG4gICAgfVxuXG4gICAgaWYgKHYudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhcImJldGFcIikpIHtcbiAgICAgIGxpLmNsYXNzTGlzdC5hZGQoXCJiZXRhXCIpXG4gICAgfVxuXG4gICAgbGkub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRVUkwgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94KVxuICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhjdXJyZW50VVJMLnNwbGl0KFwiI1wiKVswXSlcbiAgICAgIGNvbnN0IHZlcnNpb24gPSB2ID09PSBcIk5pZ2h0bHlcIiA/IFwibmV4dFwiIDogdlxuICAgICAgcGFyYW1zLnNldChcInRzXCIsIHZlcnNpb24pXG5cbiAgICAgIGNvbnN0IGhhc2ggPSBkb2N1bWVudC5sb2NhdGlvbi5oYXNoLmxlbmd0aCA/IGRvY3VtZW50LmxvY2F0aW9uLmhhc2ggOiBcIlwiXG4gICAgICBjb25zdCBuZXdVUkwgPSBgJHtkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbH0vLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH0ke2RvY3VtZW50LmxvY2F0aW9uLnBhdGhuYW1lfT8ke3BhcmFtc30ke2hhc2h9YFxuXG4gICAgICAvLyBAdHMtaWdub3JlIC0gaXQgaXMgYWxsb3dlZFxuICAgICAgZG9jdW1lbnQubG9jYXRpb24gPSBuZXdVUkxcbiAgICB9XG5cbiAgICBsaS5hcHBlbmRDaGlsZChhKVxuICAgIHZlcnNpb25zTWVudS5hcHBlbmRDaGlsZChsaSlcbiAgfSlcblxuICAvLyBTdXBwb3J0IGRyb3Bkb3duc1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLm5hdmJhci1zdWIgbGkuZHJvcGRvd24gPiBhXCIpLmZvckVhY2gobGluayA9PiB7XG4gICAgY29uc3QgYSA9IGxpbmsgYXMgSFRNTEFuY2hvckVsZW1lbnRcbiAgICBhLm9uY2xpY2sgPSBfZSA9PiB7XG4gICAgICBpZiAoYS5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuY29udGFpbnMoXCJvcGVuXCIpKSB7XG4gICAgICAgIGVzY2FwZVByZXNzZWQoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXNjYXBlUHJlc3NlZCgpXG4gICAgICAgIGEucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LnRvZ2dsZShcIm9wZW5cIilcbiAgICAgICAgYS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwidHJ1ZVwiKVxuXG4gICAgICAgIGNvbnN0IGV4YW1wbGVDb250YWluZXIgPSBhLmNsb3Nlc3QoXCJsaVwiKSEuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImRyb3Bkb3duLWRpYWxvZ1wiKS5pdGVtKDApIGFzIEhUTUxFbGVtZW50XG4gICAgICAgIGlmICghZXhhbXBsZUNvbnRhaW5lcikgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZmlyc3RMYWJlbCA9IGV4YW1wbGVDb250YWluZXIucXVlcnlTZWxlY3RvcihcImxhYmVsXCIpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgIGlmIChmaXJzdExhYmVsKSBmaXJzdExhYmVsLmZvY3VzKClcblxuICAgICAgICAvLyBTZXQgZXhhY3QgaGVpZ2h0IGFuZCB3aWR0aHMgZm9yIHRoZSBwb3BvdmVycyBmb3IgdGhlIG1haW4gcGxheWdyb3VuZCBuYXZpZ2F0aW9uXG4gICAgICAgIGNvbnN0IGlzUGxheWdyb3VuZFN1Ym1lbnUgPSAhIWEuY2xvc2VzdChcIm5hdlwiKVxuICAgICAgICBpZiAoaXNQbGF5Z3JvdW5kU3VibWVudSkge1xuICAgICAgICAgIGNvbnN0IHBsYXlncm91bmRDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXlncm91bmQtY29udGFpbmVyXCIpIVxuICAgICAgICAgIGV4YW1wbGVDb250YWluZXIuc3R5bGUuaGVpZ2h0ID0gYGNhbGMoJHtwbGF5Z3JvdW5kQ29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCArIDI2fXB4IC0gNHJlbSlgXG5cbiAgICAgICAgICBjb25zdCBzaWRlQmFyV2lkdGggPSAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5Z3JvdW5kLXNpZGViYXJcIikgYXMgYW55KS5vZmZzZXRXaWR0aFxuICAgICAgICAgIGV4YW1wbGVDb250YWluZXIuc3R5bGUud2lkdGggPSBgY2FsYygxMDAlIC0gJHtzaWRlQmFyV2lkdGh9cHggLSA3MXB4KWBcblxuICAgICAgICAgIC8vIEFsbCB0aGlzIGlzIHRvIG1ha2Ugc3VyZSB0aGF0IHRhYmJpbmcgc3RheXMgaW5zaWRlIHRoZSBkcm9wZG93biBmb3IgdHNjb25maWcvZXhhbXBsZXNcbiAgICAgICAgICBjb25zdCBidXR0b25zID0gZXhhbXBsZUNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIilcbiAgICAgICAgICBjb25zdCBsYXN0QnV0dG9uID0gYnV0dG9ucy5pdGVtKGJ1dHRvbnMubGVuZ3RoIC0gMSkgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgICBpZiAobGFzdEJ1dHRvbikge1xuICAgICAgICAgICAgcmVkaXJlY3RUYWJQcmVzc1RvKGxhc3RCdXR0b24sIGV4YW1wbGVDb250YWluZXIsIFwiLmV4YW1wbGVzLWNsb3NlXCIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHNlY3Rpb25zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5kcm9wZG93bi1kaWFsb2cgLnNlY3Rpb24tY29udGVudFwiKVxuICAgICAgICAgICAgc2VjdGlvbnMuZm9yRWFjaChzID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgYnV0dG9ucyA9IHMucXVlcnlTZWxlY3RvckFsbChcImEuZXhhbXBsZS1saW5rXCIpXG4gICAgICAgICAgICAgIGNvbnN0IGxhc3RCdXR0b24gPSBidXR0b25zLml0ZW0oYnV0dG9ucy5sZW5ndGggLSAxKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgICAgICBpZiAobGFzdEJ1dHRvbikge1xuICAgICAgICAgICAgICAgIHJlZGlyZWN0VGFiUHJlc3NUbyhsYXN0QnV0dG9uLCBleGFtcGxlQ29udGFpbmVyLCBcIi5leGFtcGxlcy1jbG9zZVwiKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9KVxuXG4gIC8qKiBIYW5kbGVzIHJlbW92aW5nIHRoZSBkcm9wZG93bnMgbGlrZSB0c2NvbmZpZy9leGFtcGxlcy9oYW5kYm9vayAqL1xuICBjb25zdCBlc2NhcGVQcmVzc2VkID0gKCkgPT4ge1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubmF2YmFyLXN1YiBsaS5vcGVuXCIpLmZvckVhY2goaSA9PiBpLmNsYXNzTGlzdC5yZW1vdmUoXCJvcGVuXCIpKVxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubmF2YmFyLXN1YiBsaVwiKS5mb3JFYWNoKGkgPT4gaS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWV4cGFuZGVkXCIsIFwiZmFsc2VcIikpXG5cbiAgICBoaWRlTmF2Rm9ySGFuZGJvb2soc2FuZGJveClcbiAgfVxuXG4gIC8vIEhhbmRsZSBlc2NhcGUgY2xvc2luZyBkcm9wZG93bnMgZXRjXG4gIGRvY3VtZW50Lm9ua2V5ZG93biA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICBldnQgPSBldnQgfHwgd2luZG93LmV2ZW50XG4gICAgdmFyIGlzRXNjYXBlID0gZmFsc2VcbiAgICBpZiAoXCJrZXlcIiBpbiBldnQpIHtcbiAgICAgIGlzRXNjYXBlID0gZXZ0LmtleSA9PT0gXCJFc2NhcGVcIiB8fCBldnQua2V5ID09PSBcIkVzY1wiXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEB0cy1pZ25vcmUgLSB0aGlzIHVzZWQgdG8gYmUgdGhlIGNhc2VcbiAgICAgIGlzRXNjYXBlID0gZXZ0LmtleUNvZGUgPT09IDI3XG4gICAgfVxuICAgIGlmIChpc0VzY2FwZSkgZXNjYXBlUHJlc3NlZCgpXG4gIH1cblxuICBjb25zdCBzaGFyZUFjdGlvbiA9IHtcbiAgICBpZDogXCJjb3B5LWNsaXBib2FyZFwiLFxuICAgIGxhYmVsOiBcIlNhdmUgdG8gY2xpcGJvYXJkXCIsXG4gICAga2V5YmluZGluZ3M6IFttb25hY28uS2V5TW9kLkN0cmxDbWQgfCBtb25hY28uS2V5Q29kZS5LZXlTXSxcblxuICAgIGNvbnRleHRNZW51R3JvdXBJZDogXCJydW5cIixcbiAgICBjb250ZXh0TWVudU9yZGVyOiAxLjUsXG5cbiAgICBydW46IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIFVwZGF0ZSB0aGUgVVJMLCB0aGVuIHdyaXRlIHRoYXQgdG8gdGhlIGNsaXBib2FyZFxuICAgICAgY29uc3QgbmV3VVJMID0gc2FuZGJveC5jcmVhdGVVUkxRdWVyeVdpdGhDb21waWxlck9wdGlvbnMoc2FuZGJveClcbiAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgXCJcIiwgbmV3VVJMKVxuICAgICAgd2luZG93Lm5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGxvY2F0aW9uLmhyZWYudG9TdHJpbmcoKSkudGhlbihcbiAgICAgICAgKCkgPT4gdWkuZmxhc2hJbmZvKGkoXCJwbGF5X2V4cG9ydF9jbGlwYm9hcmRcIikpLFxuICAgICAgICAoZTogYW55KSA9PiBhbGVydChlKVxuICAgICAgKVxuICAgIH0sXG4gIH1cblxuICBjb25zdCBzaGFyZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hhcmUtYnV0dG9uXCIpXG4gIGlmIChzaGFyZUJ1dHRvbikge1xuICAgIHNoYXJlQnV0dG9uLm9uY2xpY2sgPSBlID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgc2hhcmVBY3Rpb24ucnVuKClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIFNldCB1cCBzb21lIGtleSBjb21tYW5kc1xuICAgIHNhbmRib3guZWRpdG9yLmFkZEFjdGlvbihzaGFyZUFjdGlvbilcblxuICAgIHNhbmRib3guZWRpdG9yLmFkZEFjdGlvbih7XG4gICAgICBpZDogXCJydW4tanNcIixcbiAgICAgIGxhYmVsOiBcIlJ1biB0aGUgZXZhbHVhdGVkIEphdmFTY3JpcHQgZm9yIHlvdXIgVHlwZVNjcmlwdCBmaWxlXCIsXG4gICAgICBrZXliaW5kaW5nczogW21vbmFjby5LZXlNb2QuQ3RybENtZCB8IG1vbmFjby5LZXlDb2RlLkVudGVyXSxcblxuICAgICAgY29udGV4dE1lbnVHcm91cElkOiBcInJ1blwiLFxuICAgICAgY29udGV4dE1lbnVPcmRlcjogMS41LFxuXG4gICAgICBydW46IGZ1bmN0aW9uIChlZCkge1xuICAgICAgICBjb25zdCBydW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInJ1bi1idXR0b25cIilcbiAgICAgICAgcnVuQnV0dG9uICYmIHJ1bkJ1dHRvbi5vbmNsaWNrICYmIHJ1bkJ1dHRvbi5vbmNsaWNrKHt9IGFzIGFueSlcbiAgICAgIH0sXG4gICAgfSlcbiAgfVxuXG4gIGNvbnN0IHJ1bkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicnVuLWJ1dHRvblwiKVxuICBpZiAocnVuQnV0dG9uKSB7XG4gICAgcnVuQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjb25zdCBydW4gPSBzYW5kYm94LmdldFJ1bm5hYmxlSlMoKVxuICAgICAgY29uc3QgcnVuUGx1Z2luID0gcGx1Z2lucy5maW5kKHAgPT4gcC5pZCA9PT0gXCJsb2dzXCIpIVxuICAgICAgYWN0aXZhdGVQbHVnaW4ocnVuUGx1Z2luLCBnZXRDdXJyZW50UGx1Z2luKCksIHNhbmRib3gsIHRhYkJhciwgY29udGFpbmVyKVxuXG4gICAgICBydW5XaXRoQ3VzdG9tTG9ncyhydW4sIGkpXG5cbiAgICAgIGNvbnN0IGlzSlMgPSBzYW5kYm94LmNvbmZpZy5maWxldHlwZSA9PT0gXCJqc1wiXG4gICAgICB1aS5mbGFzaEluZm8oaShpc0pTID8gXCJwbGF5X3J1bl9qc1wiIDogXCJwbGF5X3J1bl90c1wiKSlcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8vIEhhbmRsZSB0aGUgY2xvc2UgYnV0dG9ucyBvbiB0aGUgZXhhbXBsZXNcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvbi5leGFtcGxlcy1jbG9zZVwiKS5mb3JFYWNoKGIgPT4ge1xuICAgIGNvbnN0IGJ1dHRvbiA9IGIgYXMgSFRNTEJ1dHRvbkVsZW1lbnRcbiAgICBidXR0b24ub25jbGljayA9IGVzY2FwZVByZXNzZWRcbiAgfSlcblxuICAvLyBTdXBwb3J0IGNsaWNraW5nIHRoZSBoYW5kYm9vayBidXR0b24gb24gdGhlIHRvcCBuYXZcbiAgY29uc3QgaGFuZGJvb2tCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhbmRib29rLWJ1dHRvblwiKVxuXG4gIGlmIChoYW5kYm9va0J1dHRvbikge1xuICAgIGhhbmRib29rQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAvLyBUd28gcG90ZW50aWFsbHkgY29uY3VycmVudCBzaWRlYmFyIG5hdnMgaXMganVzdCBhIGJpdCB0b28gbXVjaFxuICAgICAgLy8gc3RhdGUgdG8ga2VlcCB0cmFjayBvZiBBVE1cbiAgICAgIGlmICghaGFuZGJvb2tCdXR0b24ucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYWN0aXZlXCIpKSB7XG4gICAgICAgIHVpLmZsYXNoSW5mbyhcIkNhbm5vdCBvcGVuIHRoZSBQbGF5Z3JvdW5kIGhhbmRib29rIHdoZW4gaW4gYSBHaXN0XCIpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBzaG93aW5nSGFuZGJvb2sgPSBoYW5kYm9va0J1dHRvbi5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuY29udGFpbnMoXCJvcGVuXCIpXG4gICAgICBpZiAoIXNob3dpbmdIYW5kYm9vaykge1xuICAgICAgICBlc2NhcGVQcmVzc2VkKClcblxuICAgICAgICBzaG93TmF2KClcbiAgICAgICAgaGFuZGJvb2tCdXR0b24ucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LmFkZChcIm9wZW5cIilcbiAgICAgICAgc2hvd05hdkZvckhhbmRib29rKHNhbmRib3gsIGVzY2FwZVByZXNzZWQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlc2NhcGVQcmVzc2VkKClcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgc2V0dXBTaWRlYmFyVG9nZ2xlKClcblxuICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb25maWctY29udGFpbmVyXCIpKSB7XG4gICAgY3JlYXRlQ29uZmlnRHJvcGRvd24oc2FuZGJveCwgbW9uYWNvKVxuICAgIHVwZGF0ZUNvbmZpZ0Ryb3Bkb3duRm9yQ29tcGlsZXJPcHRpb25zKHNhbmRib3gsIG1vbmFjbylcbiAgfVxuXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXlncm91bmQtc2V0dGluZ3NcIikpIHtcbiAgICBjb25zdCBzZXR0aW5nc1RvZ2dsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZC1zZXR0aW5nc1wiKSFcblxuICAgIHNldHRpbmdzVG9nZ2xlLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICBjb25zdCBvcGVuID0gc2V0dGluZ3NUb2dnbGUucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3BlblwiKVxuICAgICAgY29uc3Qgc2lkZWJhclRhYnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtcGx1Z2luLXRhYnZpZXdcIikgYXMgSFRNTERpdkVsZW1lbnRcbiAgICAgIGNvbnN0IHNpZGViYXJDb250ZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5Z3JvdW5kLXBsdWdpbi1jb250YWluZXJcIikgYXMgSFRNTERpdkVsZW1lbnRcbiAgICAgIGxldCBzZXR0aW5nc0NvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtc2V0dGluZ3MtY29udGFpbmVyXCIpIGFzIEhUTUxEaXZFbGVtZW50XG5cbiAgICAgIGlmICghc2V0dGluZ3NDb250ZW50KSB7XG4gICAgICAgIHNldHRpbmdzQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgc2V0dGluZ3NDb250ZW50LmNsYXNzTmFtZSA9IFwicGxheWdyb3VuZC1zZXR0aW5ncy1jb250YWluZXIgcGxheWdyb3VuZC1wbHVnaW4tY29udGFpbmVyXCJcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSBzZXR0aW5nc1BsdWdpbihpLCB1dGlscylcbiAgICAgICAgc2V0dGluZ3MuZGlkTW91bnQgJiYgc2V0dGluZ3MuZGlkTW91bnQoc2FuZGJveCwgc2V0dGluZ3NDb250ZW50KVxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtc2lkZWJhclwiKSEuYXBwZW5kQ2hpbGQoc2V0dGluZ3NDb250ZW50KVxuXG4gICAgICAgIC8vIFdoZW4gdGhlIGxhc3QgdGFiIGl0ZW0gaXMgaGl0LCBnbyBiYWNrIHRvIHRoZSBzZXR0aW5ncyBidXR0b25cbiAgICAgICAgY29uc3QgbGFiZWxzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5wbGF5Z3JvdW5kLXNpZGViYXIgaW5wdXRcIilcbiAgICAgICAgY29uc3QgbGFzdExhYmVsID0gbGFiZWxzLml0ZW0obGFiZWxzLmxlbmd0aCAtIDEpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgIGlmIChsYXN0TGFiZWwpIHtcbiAgICAgICAgICByZWRpcmVjdFRhYlByZXNzVG8obGFzdExhYmVsLCB1bmRlZmluZWQsIFwiI3BsYXlncm91bmQtc2V0dGluZ3NcIilcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob3Blbikge1xuICAgICAgICBzaWRlYmFyVGFicy5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCJcbiAgICAgICAgc2lkZWJhckNvbnRlbnQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICAgICAgICBzZXR0aW5nc0NvbnRlbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaWRlYmFyVGFicy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgICAgc2lkZWJhckNvbnRlbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gICAgICAgIHNldHRpbmdzQ29udGVudC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLnBsYXlncm91bmQtc2lkZWJhciBsYWJlbFwiKSEuZm9jdXMoKVxuICAgICAgfVxuICAgICAgc2V0dGluZ3NUb2dnbGUucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LnRvZ2dsZShcIm9wZW5cIilcbiAgICB9XG5cbiAgICBzZXR0aW5nc1RvZ2dsZS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlID0+IHtcbiAgICAgIGNvbnN0IGlzT3BlbiA9IHNldHRpbmdzVG9nZ2xlLnBhcmVudEVsZW1lbnQhLmNsYXNzTGlzdC5jb250YWlucyhcIm9wZW5cIilcbiAgICAgIGlmIChlLmtleSA9PT0gXCJUYWJcIiAmJiBpc09wZW4pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5wbGF5Z3JvdW5kLW9wdGlvbnMgbGkgaW5wdXRcIikgYXMgYW55XG4gICAgICAgIHJlc3VsdC5mb2N1cygpXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvLyBTdXBwb3J0IGdyYWJiaW5nIGV4YW1wbGVzIGZyb20gdGhlIGxvY2F0aW9uIGhhc2hcbiAgaWYgKGxvY2F0aW9uLmhhc2guc3RhcnRzV2l0aChcIiNleGFtcGxlXCIpKSB7XG4gICAgY29uc3QgZXhhbXBsZU5hbWUgPSBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoXCIjZXhhbXBsZS9cIiwgXCJcIikudHJpbSgpXG4gICAgc2FuZGJveC5jb25maWcubG9nZ2VyLmxvZyhcIkxvYWRpbmcgZXhhbXBsZTpcIiwgZXhhbXBsZU5hbWUpXG4gICAgZ2V0RXhhbXBsZVNvdXJjZUNvZGUoY29uZmlnLnByZWZpeCwgY29uZmlnLmxhbmcsIGV4YW1wbGVOYW1lKS50aGVuKGV4ID0+IHtcbiAgICAgIGlmIChleC5leGFtcGxlICYmIGV4LmNvZGUpIHtcbiAgICAgICAgY29uc3QgeyBleGFtcGxlLCBjb2RlIH0gPSBleFxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbG9jYWxzdG9yYWdlIHNob3dpbmcgdGhhdCB5b3UndmUgc2VlbiB0aGlzIHBhZ2VcbiAgICAgICAgaWYgKGxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgIGNvbnN0IHNlZW5UZXh0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJleGFtcGxlcy1zZWVuXCIpIHx8IFwie31cIlxuICAgICAgICAgIGNvbnN0IHNlZW4gPSBKU09OLnBhcnNlKHNlZW5UZXh0KVxuICAgICAgICAgIHNlZW5bZXhhbXBsZS5pZF0gPSBleGFtcGxlLmhhc2hcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImV4YW1wbGVzLXNlZW5cIiwgSlNPTi5zdHJpbmdpZnkoc2VlbikpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbGxMaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJleGFtcGxlLWxpbmtcIilcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgYWxsTGlua3MpIHtcbiAgICAgICAgICBpZiAobGluay50ZXh0Q29udGVudCA9PT0gZXhhbXBsZS50aXRsZSkge1xuICAgICAgICAgICAgbGluay5jbGFzc0xpc3QuYWRkKFwiaGlnaGxpZ2h0XCIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSBcIlR5cGVTY3JpcHQgUGxheWdyb3VuZCAtIFwiICsgZXhhbXBsZS50aXRsZVxuICAgICAgICBzdXBwcmVzc05leHRUZXh0Q2hhbmdlRm9ySGFzaENoYW5nZSA9IHRydWVcbiAgICAgICAgc2FuZGJveC5zZXRUZXh0KGNvZGUpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdXBwcmVzc05leHRUZXh0Q2hhbmdlRm9ySGFzaENoYW5nZSA9IHRydWVcbiAgICAgICAgc2FuZGJveC5zZXRUZXh0KFwiLy8gVGhlcmUgd2FzIGFuIGlzc3VlIGdldHRpbmcgdGhlIGV4YW1wbGUsIGJhZCBVUkw/IENoZWNrIHRoZSBjb25zb2xlIGluIHRoZSBkZXZlbG9wZXIgdG9vbHNcIilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLy8gU2V0IHRoZSBlcnJvcnMgbnVtYmVyIGluIHRoZSBzaWRlYmFyIHRhYnNcbiAgY29uc3QgbW9kZWwgPSBzYW5kYm94LmdldE1vZGVsKClcbiAgbW9kZWwub25EaWRDaGFuZ2VEZWNvcmF0aW9ucygoKSA9PiB7XG4gICAgY29uc3QgbWFya2VycyA9IHNhbmRib3gubW9uYWNvLmVkaXRvci5nZXRNb2RlbE1hcmtlcnMoeyByZXNvdXJjZTogbW9kZWwudXJpIH0pLmZpbHRlcihtID0+IG0uc2V2ZXJpdHkgIT09IDEpXG4gICAgdXRpbHMuc2V0Tm90aWZpY2F0aW9ucyhcImVycm9yc1wiLCBtYXJrZXJzLmxlbmd0aClcbiAgfSlcblxuICAvLyBTZXRzIHVwIGEgd2F5IHRvIGNsaWNrIGJldHdlZW4gZXhhbXBsZXNcbiAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckxpbmtQcm92aWRlcihzYW5kYm94Lmxhbmd1YWdlLCBuZXcgRXhhbXBsZUhpZ2hsaWdodGVyKCkpXG5cbiAgY29uc3QgbGFuZ3VhZ2VTZWxlY3RvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGFuZ3VhZ2Utc2VsZWN0b3JcIikgYXMgSFRNTFNlbGVjdEVsZW1lbnRcbiAgaWYgKGxhbmd1YWdlU2VsZWN0b3IpIHtcbiAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGxvY2F0aW9uLnNlYXJjaClcbiAgICBjb25zdCBvcHRpb25zID0gW1widHNcIiwgXCJkLnRzXCIsIFwianNcIl1cbiAgICBsYW5ndWFnZVNlbGVjdG9yLm9wdGlvbnMuc2VsZWN0ZWRJbmRleCA9IG9wdGlvbnMuaW5kZXhPZihwYXJhbXMuZ2V0KFwiZmlsZXR5cGVcIikgfHwgXCJ0c1wiKVxuXG4gICAgbGFuZ3VhZ2VTZWxlY3Rvci5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGV0eXBlID0gb3B0aW9uc1tOdW1iZXIobGFuZ3VhZ2VTZWxlY3Rvci5zZWxlY3RlZEluZGV4IHx8IDApXVxuICAgICAgY29uc3QgcXVlcnkgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94LCB7IGZpbGV0eXBlIH0pXG4gICAgICBjb25zdCBmdWxsVVJMID0gYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZX0ke3F1ZXJ5fWBcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGRvY3VtZW50LmxvY2F0aW9uID0gZnVsbFVSTFxuICAgIH1cbiAgfVxuXG4gIC8vIEVuc3VyZSB0aGF0IHRoZSBlZGl0b3IgaXMgZnVsbC13aWR0aCB3aGVuIHRoZSBzY3JlZW4gcmVzaXplc1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCAoKSA9PiB7XG4gICAgc2FuZGJveC5lZGl0b3IubGF5b3V0KClcbiAgfSlcblxuICAvLyBUZWxscyBtb25hY28gdG8gY2hlY2sgb3V0IHRoZSBmb250IHNpemVzIGluIG9yZGVyIHRvIG1ha2VcbiAgLy8gc3VyZSB0aGF0IHNlbGVjdGluZyB0ZXh0IGluIHRoZSBlZGl0b3IgcHJvdmlkZXMgdGhlIHNhbWVcbiAgLy8gbGVuZ3RoIGFzIHVuc2VsZWN0ZWQgdGV4dCAtIG90aGVyd2lzZSBzcGFjZSBmb3IgYSBzZWxlY3Rpb25cbiAgLy8gd2lsbCBiZSBhIGxpdHRsZSBiaXQgd2lkZXIgdGhhbiBpdCBzaG91bGQgYmUuIHNcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgbW9uYWNvLmVkaXRvci5yZW1lYXN1cmVGb250cygpXG4gIH0sIDUwMDApXG5cbiAgY29uc3QgdWkgPSBjcmVhdGVVSSgpXG4gIGNvbnN0IGV4cG9ydGVyID0gY3JlYXRlRXhwb3J0ZXIoc2FuZGJveCwgbW9uYWNvLCB1aSlcblxuICBjb25zdCBwbGF5Z3JvdW5kID0ge1xuICAgIGV4cG9ydGVyLFxuICAgIHVpLFxuICAgIHJlZ2lzdGVyUGx1Z2luLFxuICAgIHBsdWdpbnMsXG4gICAgZ2V0Q3VycmVudFBsdWdpbixcbiAgICB0YWJzLFxuICAgIHNldERpZFVwZGF0ZVRhYixcbiAgICBjcmVhdGVVdGlscyxcbiAgfVxuXG4gIHdpbmRvdy50cyA9IHNhbmRib3gudHNcbiAgd2luZG93LnNhbmRib3ggPSBzYW5kYm94XG4gIHdpbmRvdy5wbGF5Z3JvdW5kID0gcGxheWdyb3VuZFxuXG4gIGNvbnNvbGUubG9nKGBVc2luZyBUeXBlU2NyaXB0ICR7d2luZG93LnRzLnZlcnNpb259YClcblxuICBjb25zb2xlLmxvZyhcIkF2YWlsYWJsZSBnbG9iYWxzOlwiKVxuICBjb25zb2xlLmxvZyhcIlxcdHdpbmRvdy50c1wiLCB3aW5kb3cudHMpXG4gIGNvbnNvbGUubG9nKFwiXFx0d2luZG93LnNhbmRib3hcIiwgd2luZG93LnNhbmRib3gpXG4gIGNvbnNvbGUubG9nKFwiXFx0d2luZG93LnBsYXlncm91bmRcIiwgd2luZG93LnBsYXlncm91bmQpXG4gIGNvbnNvbGUubG9nKFwiXFx0d2luZG93LnJlYWN0XCIsIHdpbmRvdy5yZWFjdClcbiAgY29uc29sZS5sb2coXCJcXHR3aW5kb3cucmVhY3RET01cIiwgd2luZG93LnJlYWN0RE9NKVxuXG4gIC8qKiBUaGUgcGx1Z2luIHN5c3RlbSAqL1xuICBjb25zdCBhY3RpdmF0ZUV4dGVybmFsUGx1Z2luID0gKFxuICAgIHBsdWdpbjogUGxheWdyb3VuZFBsdWdpbiB8ICgodXRpbHM6IFBsdWdpblV0aWxzKSA9PiBQbGF5Z3JvdW5kUGx1Z2luKSxcbiAgICBhdXRvQWN0aXZhdGU6IGJvb2xlYW5cbiAgKSA9PiB7XG4gICAgbGV0IHJlYWR5UGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luXG4gICAgLy8gQ2FuIGVpdGhlciBiZSBhIGZhY3RvcnksIG9yIG9iamVjdFxuICAgIGlmICh0eXBlb2YgcGx1Z2luID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IHV0aWxzID0gY3JlYXRlVXRpbHMoc2FuZGJveCwgcmVhY3QpXG4gICAgICByZWFkeVBsdWdpbiA9IHBsdWdpbih1dGlscylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVhZHlQbHVnaW4gPSBwbHVnaW5cbiAgICB9XG5cbiAgICBpZiAoYXV0b0FjdGl2YXRlKSB7XG4gICAgICBjb25zb2xlLmxvZyhyZWFkeVBsdWdpbilcbiAgICB9XG5cbiAgICBwbGF5Z3JvdW5kLnJlZ2lzdGVyUGx1Z2luKHJlYWR5UGx1Z2luKVxuXG4gICAgLy8gQXV0by1zZWxlY3QgdGhlIGRldiBwbHVnaW5cbiAgICBjb25zdCBwbHVnaW5XYW50c0Zyb250ID0gcmVhZHlQbHVnaW4uc2hvdWxkQmVTZWxlY3RlZCAmJiByZWFkeVBsdWdpbi5zaG91bGRCZVNlbGVjdGVkKClcblxuICAgIGlmIChwbHVnaW5XYW50c0Zyb250IHx8IGF1dG9BY3RpdmF0ZSkge1xuICAgICAgLy8gQXV0by1zZWxlY3QgdGhlIGRldiBwbHVnaW5cbiAgICAgIGFjdGl2YXRlUGx1Z2luKHJlYWR5UGx1Z2luLCBnZXRDdXJyZW50UGx1Z2luKCksIHNhbmRib3gsIHRhYkJhciwgY29udGFpbmVyKVxuICAgIH1cbiAgfVxuXG4gIC8vIERldiBtb2RlIHBsdWdpblxuICBpZiAoY29uZmlnLnN1cHBvcnRDdXN0b21QbHVnaW5zICYmIGFsbG93Q29ubmVjdGluZ1RvTG9jYWxob3N0KCkpIHtcbiAgICB3aW5kb3cuZXhwb3J0cyA9IHt9XG4gICAgY29uc29sZS5sb2coXCJDb25uZWN0aW5nIHRvIGRldiBwbHVnaW5cIilcbiAgICB0cnkge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgcmUgPSB3aW5kb3cucmVxdWlyZVxuICAgICAgcmUoW1wibG9jYWwvaW5kZXhcIl0sIChkZXZQbHVnaW46IGFueSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcIlNldCB1cCBkZXYgcGx1Z2luIGZyb20gbG9jYWxob3N0OjUwMDBcIilcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhY3RpdmF0ZUV4dGVybmFsUGx1Z2luKGRldlBsdWdpbiwgdHJ1ZSlcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdWkuZmxhc2hJbmZvKFwiRXJyb3I6IENvdWxkIG5vdCBsb2FkIGRldiBwbHVnaW4gZnJvbSBsb2NhbGhvc3Q6NTAwMFwiKVxuICAgICAgICAgIH0sIDcwMClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlByb2JsZW0gbG9hZGluZyB1cCB0aGUgZGV2IHBsdWdpblwiKVxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcilcbiAgICB9XG4gIH1cblxuICBjb25zdCBkb3dubG9hZFBsdWdpbiA9IChwbHVnaW46IHN0cmluZywgYXV0b0VuYWJsZTogYm9vbGVhbikgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBjb25zdCByZSA9IHdpbmRvdy5yZXF1aXJlXG4gICAgICByZShbYHVucGtnLyR7cGx1Z2lufUBsYXRlc3QvZGlzdC9pbmRleGBdLCAoZGV2UGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luKSA9PiB7XG4gICAgICAgIGFjdGl2YXRlRXh0ZXJuYWxQbHVnaW4oZGV2UGx1Z2luLCBhdXRvRW5hYmxlKVxuICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlByb2JsZW0gbG9hZGluZyB1cCB0aGUgcGx1Z2luOlwiLCBwbHVnaW4pXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIGlmIChjb25maWcuc3VwcG9ydEN1c3RvbVBsdWdpbnMpIHtcbiAgICAvLyBHcmFiIG9uZXMgZnJvbSBsb2NhbHN0b3JhZ2VcbiAgICBhY3RpdmVQbHVnaW5zKCkuZm9yRWFjaChwID0+IGRvd25sb2FkUGx1Z2luKHAuaWQsIGZhbHNlKSlcblxuICAgIC8vIE9mZmVyIHRvIGluc3RhbGwgb25lIGlmICdpbnN0YWxsLXBsdWdpbicgaXMgYSBxdWVyeSBwYXJhbVxuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICAgIGNvbnN0IHBsdWdpblRvSW5zdGFsbCA9IHBhcmFtcy5nZXQoXCJpbnN0YWxsLXBsdWdpblwiKVxuICAgIGlmIChwbHVnaW5Ub0luc3RhbGwpIHtcbiAgICAgIGNvbnN0IGFscmVhZHlJbnN0YWxsZWQgPSBhY3RpdmVQbHVnaW5zKCkuZmluZChwID0+IHAuaWQgPT09IHBsdWdpblRvSW5zdGFsbClcbiAgICAgIGlmICghYWxyZWFkeUluc3RhbGxlZCkge1xuICAgICAgICBjb25zdCBzaG91bGREb0l0ID0gY29uZmlybShcIldvdWxkIHlvdSBsaWtlIHRvIGluc3RhbGwgdGhlIHRoaXJkIHBhcnR5IHBsdWdpbj9cXG5cXG5cIiArIHBsdWdpblRvSW5zdGFsbClcbiAgICAgICAgaWYgKHNob3VsZERvSXQpIHtcbiAgICAgICAgICBhZGRDdXN0b21QbHVnaW4ocGx1Z2luVG9JbnN0YWxsKVxuICAgICAgICAgIGRvd25sb2FkUGx1Z2luKHBsdWdpblRvSW5zdGFsbCwgdHJ1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IFt0c01ham9yLCB0c01pbm9yXSA9IHNhbmRib3gudHMudmVyc2lvbi5zcGxpdChcIi5cIilcbiAgaWYgKFxuICAgIChwYXJzZUludCh0c01ham9yKSA+IDQgfHwgKHBhcnNlSW50KHRzTWFqb3IpID09IDQgJiYgcGFyc2VJbnQodHNNaW5vcikgPj0gNikpICYmXG4gICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlcklubGF5SGludHNQcm92aWRlclxuICApIHtcbiAgICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVySW5sYXlIaW50c1Byb3ZpZGVyKHNhbmRib3gubGFuZ3VhZ2UsIGNyZWF0ZVR3b3NsYXNoSW5sYXlQcm92aWRlcihzYW5kYm94KSlcbiAgfVxuXG4gIGlmIChsb2NhdGlvbi5oYXNoLnN0YXJ0c1dpdGgoXCIjc2hvdy1leGFtcGxlc1wiKSkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJleGFtcGxlcy1idXR0b25cIik/LmNsaWNrKClcbiAgICB9LCAxMDApXG4gIH1cblxuICBpZiAobG9jYXRpb24uaGFzaC5zdGFydHNXaXRoKFwiI3Nob3ctd2hhdGlzbmV3XCIpKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIndoYXRpc25ldy1idXR0b25cIik/LmNsaWNrKClcbiAgICB9LCAxMDApXG4gIH1cblxuICAvLyBBdXRvLWxvYWQgaW50byB0aGUgcGxheWdyb3VuZFxuICBpZiAobG9jYXRpb24uaGFzaC5zdGFydHNXaXRoKFwiI2hhbmRib29rXCIpKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhhbmRib29rLWJ1dHRvblwiKT8uY2xpY2soKVxuICAgIH0sIDEwMClcbiAgfVxuXG4gIHJldHVybiBwbGF5Z3JvdW5kXG59XG5cbmV4cG9ydCB0eXBlIFBsYXlncm91bmQgPSBSZXR1cm5UeXBlPHR5cGVvZiBzZXR1cFBsYXlncm91bmQ+XG5cbmNvbnN0IHJlZGlyZWN0VGFiUHJlc3NUbyA9IChlbGVtZW50OiBIVE1MRWxlbWVudCwgY29udGFpbmVyOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCwgcXVlcnk6IHN0cmluZykgPT4ge1xuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGUgPT4ge1xuICAgIGlmIChlLmtleSA9PT0gXCJUYWJcIikge1xuICAgICAgY29uc3QgaG9zdCA9IGNvbnRhaW5lciB8fCBkb2N1bWVudFxuICAgICAgY29uc3QgcmVzdWx0ID0gaG9zdC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSBhcyBhbnlcbiAgICAgIGlmICghcmVzdWx0KSB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHRvIGZpbmQgYSByZXN1bHQgZm9yIGtleWRvd25gKVxuICAgICAgcmVzdWx0LmZvY3VzKClcbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIH1cbiAgfSlcbn1cbiJdfQ==