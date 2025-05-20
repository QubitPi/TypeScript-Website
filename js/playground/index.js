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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBeUVPLE1BQU0sZUFBZSxHQUFHLENBQzdCLE9BQWdCLEVBQ2hCLE1BQWMsRUFDZCxNQUF3QixFQUN4QixDQUEwQixFQUMxQixLQUFtQixFQUNuQixFQUFFO1FBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsYUFBYyxDQUFDLGFBQWMsQ0FBQyxhQUFjLENBQUE7UUFFMUYsaUJBQWlCO1FBQ2pCLE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXVCLEdBQUUsQ0FBQTtRQUN6QyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxhQUFjLENBQUMsYUFBYyxDQUFDLENBQUE7UUFFMUYsTUFBTSxXQUFXLEdBQUcsSUFBQSw4QkFBYSxFQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLGFBQWMsQ0FBQyxhQUFjLENBQUMsQ0FBQTtRQUU5RixNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDbkIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBRSxDQUFBO1lBQzVFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUUsQ0FBQTtZQUMzRCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxlQUFlLEtBQUssQ0FBQyxXQUFXLEdBQUcsR0FBRyxLQUFLLENBQUE7WUFFaEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1lBQy9CLE9BQU8sQ0FBQyxLQUFL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R0FBRyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUNwQixNQUFNLElBQUksR0FBRyxTQUFTLElBQUksUUFBUSxDQUFBO2dCQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBUSxDQUFBO2dCQUMvQyxJQUFJLENBQUMsTUFBTTtvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUE7Z0JBQ3JFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtnQkFDZCxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUE7WUFDcEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsidHlwZSBTYW5kYm94ID0gaW1wb3J0KFwiQHR5cGVzY3JpcHQvc2FuZGJveFwiKS5TYW5kYm94XG50eXBlIE1vbmFjbyA9IHR5cGVvZiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpXG5cbmRlY2xhcmUgY29uc3Qgd2luZG93OiBhbnlcblxuaW1wb3J0IHtcbiAgY3JlYXRlU2lkZWJhcixcbiAgY3JlYXRlVGFiRm9yUGx1Z2luLFxuICBjcmVhdGVUYWJCYXIsXG4gIGNyZWF0ZVBsdWdpbkNvbnRhaW5lcixcbiAgYWN0aXZhdGVQbHVnaW4sXG4gIGNyZWF0ZURyYWdCYXIsXG4gIHNldHVwU2lkZWJhclRvZ2dsZSxcbiAgY3JlYXRlTmF2aWdhdGlvblNlY3Rpb24sXG59IGZyb20gXCIuL2NyZWF0ZUVsZW1lbnRzXCJcbmltcG9ydCB7IHJ1bldpdGhDdXN0b21Mb2dzIH0gZnJvbSBcIi4vc2lkZWJhci9ydW50aW1lXCJcbmltcG9ydCB7IGNyZWF0ZUV4cG9ydGVyIH0gZnJvbSBcIi4vZXhwb3J0ZXJcIlxuaW1wb3J0IHsgY3JlYXRlVUkgfSBmcm9tIFwiLi9jcmVhdGVVSVwiXG5pbXBvcnQgeyBnZXRFeGFtcGxlU291cmNlQ29kZSB9IGZyb20gXCIuL2dldEV4YW1wbGVcIlxuaW1wb3J0IHsgRXhhbXBsZUhpZ2hsaWdodGVyIH0gZnJvbSBcIi4vbW9uYWNvL0V4YW1wbGVIaWdobGlnaHRcIlxuaW1wb3J0IHsgY3JlYXRlQ29uZmlnRHJvcGRvd24sIHVwZGF0ZUNvbmZpZ0Ryb3Bkb3duRm9yQ29tcGlsZXJPcHRpb25zIH0gZnJvbSBcIi4vY3JlYXRlQ29uZmlnRHJvcGRvd25cIlxuaW1wb3J0IHsgYWxsb3dDb25uZWN0aW5nVG9Mb2NhbGhvc3QsIGFjdGl2ZVBsdWdpbnMsIGFkZEN1c3RvbVBsdWdpbiB9IGZyb20gXCIuL3NpZGViYXIvcGx1Z2luc1wiXG5pbXBvcnQgeyBjcmVhdGVVdGlscywgUGx1Z2luVXRpbHMgfSBmcm9tIFwiLi9wbHVnaW5VdGlsc1wiXG5pbXBvcnQgdHlwZSBSZWFjdCBmcm9tIFwicmVhY3RcIlxuaW1wb3J0IHsgc2V0dGluZ3NQbHVnaW4sIGdldFBsYXlncm91bmRQbHVnaW5zIH0gZnJvbSBcIi4vc2lkZWJhci9zZXR0aW5nc1wiXG5pbXBvcnQgeyBoaWRlTmF2Rm9ySGFuZGJvb2ssIHNob3dOYXZGb3JIYW5kYm9vayB9IGZyb20gXCIuL25hdmlnYXRpb25cIlxuaW1wb3J0IHsgY3JlYXRlVHdvc2xhc2hJbmxheVByb3ZpZGVyIH0gZnJvbSBcIi4vdHdvc2xhc2hJbmxheXNcIlxuXG5leHBvcnQgeyBQbHVnaW5VdGlscyB9IGZyb20gXCIuL3BsdWdpblV0aWxzXCJcblxuZXhwb3J0IHR5cGUgUGx1Z2luRmFjdG9yeSA9IHtcbiAgKGk6IChrZXk6IHN0cmluZywgY29tcG9uZW50cz86IGFueSkgPT4gc3RyaW5nLCB1dGlsczogUGx1Z2luVXRpbHMpOiBQbGF5Z3JvdW5kUGx1Z2luXG59XG5cbi8qKiBUaGUgaW50ZXJmYWNlIG9mIGFsbCBzaWRlYmFyIHBsdWdpbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGxheWdyb3VuZFBsdWdpbiB7XG4gIC8qKiBOb3QgcHVibGljIGZhY2luZywgYnV0IHVzZWQgYnkgdGhlIHBsYXlncm91bmQgdG8gdW5pcXVlbHkgaWRlbnRpZnkgcGx1Z2lucyAqL1xuICBpZDogc3RyaW5nXG4gIC8qKiBUbyBzaG93IGluIHRoZSB0YWJzICovXG4gIGRpc3BsYXlOYW1lOiBzdHJpbmdcbiAgLyoqIFNob3VsZCB0aGlzIHBsdWdpbiBiZSBzZWxlY3RlZCB3aGVuIHRoZSBwbHVnaW4gaXMgZmlyc3QgbG9hZGVkPyBMZXRzIHlvdSBjaGVjayBmb3IgcXVlcnkgdmFycyBldGMgdG8gbG9hZCBhIHBhcnRpY3VsYXIgcGx1Z2luICovXG4gIHNob3VsZEJlU2VsZWN0ZWQ/OiAoKSA9PiBib29sZWFuXG4gIC8qKiBCZWZvcmUgd2Ugc2hvdyB0aGUgdGFiLCB1c2UgdGhpcyB0byBzZXQgdXAgeW91ciBIVE1MIC0gaXQgd2lsbCBhbGwgYmUgcmVtb3ZlZCBieSB0aGUgcGxheWdyb3VuZCB3aGVuIHNvbWVvbmUgbmF2aWdhdGVzIG9mZiB0aGUgdGFiICovXG4gIHdpbGxNb3VudD86IChzYW5kYm94OiBTYW5kYm94LCBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50KSA9PiB2b2lkXG4gIC8qKiBBZnRlciB3ZSBzaG93IHRoZSB0YWIgKi9cbiAgZGlkTW91bnQ/OiAoc2FuZGJveDogU2FuZGJveCwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkgPT4gdm9pZFxuICAvKiogTW9kZWwgY2hhbmdlcyB3aGlsZSB0aGlzIHBsdWdpbiBpcyBhY3RpdmVseSBzZWxlY3RlZCAgKi9cbiAgbW9kZWxDaGFuZ2VkPzogKHNhbmRib3g6IFNhbmRib3gsIG1vZGVsOiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmVkaXRvci5JVGV4dE1vZGVsLCBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50KSA9PiB2b2lkXG4gIC8qKiBEZWxheWVkIG1vZGVsIGNoYW5nZXMgd2hpbGUgdGhpcyBwbHVnaW4gaXMgYWN0aXZlbHkgc2VsZWN0ZWQsIHVzZWZ1bCB3aGVuIHlvdSBhcmUgd29ya2luZyB3aXRoIHRoZSBUUyBBUEkgYmVjYXVzZSBpdCB3b24ndCBydW4gb24gZXZlcnkga2V5cHJlc3MgKi9cbiAgbW9kZWxDaGFuZ2VkRGVib3VuY2U/OiAoXG4gICAgc2FuZGJveDogU2FuZGJveCxcbiAgICBtb2RlbDogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5lZGl0b3IuSVRleHRNb2RlbCxcbiAgICBjb250YWluZXI6IEhUTUxEaXZFbGVtZW50XG4gICkgPT4gdm9pZFxuICAvKiogQmVmb3JlIHdlIHJlbW92ZSB0aGUgdGFiICovXG4gIHdpbGxVbm1vdW50PzogKHNhbmRib3g6IFNhbmRib3gsIGNvbnRhaW5lcjogSFRNTERpdkVsZW1lbnQpID0+IHZvaWRcbiAgLyoqIEFmdGVyIHdlIHJlbW92ZSB0aGUgdGFiICovXG4gIGRpZFVubW91bnQ/OiAoc2FuZGJveDogU2FuZGJveCwgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCkgPT4gdm9pZFxuICAvKiogQW4gb2JqZWN0IHlvdSBjYW4gdXNlIHRvIGtlZXAgZGF0YSBhcm91bmQgaW4gdGhlIHNjb3BlIG9mIHlvdXIgcGx1Z2luIG9iamVjdCAqL1xuICBkYXRhPzogYW55XG59XG5cbmludGVyZmFjZSBQbGF5Z3JvdW5kQ29uZmlnIHtcbiAgLyoqIExhbmd1YWdlIGxpa2UgXCJlblwiIC8gXCJqYVwiIGV0YyAqL1xuICBsYW5nOiBzdHJpbmdcbiAgLyoqIFNpdGUgcHJlZml4LCBsaWtlIFwidjJcIiBkdXJpbmcgdGhlIHByZS1yZWxlYXNlICovXG4gIHByZWZpeDogc3RyaW5nXG4gIC8qKiBPcHRpb25hbCBwbHVnaW5zIHNvIHRoYXQgd2UgY2FuIHJlLXVzZSB0aGUgcGxheWdyb3VuZCB3aXRoIGRpZmZlcmVudCBzaWRlYmFycyAqL1xuICBwbHVnaW5zPzogUGx1Z2luRmFjdG9yeVtdXG4gIC8qKiBTaG91bGQgdGhpcyBwbGF5Z3JvdW5kIGxvYWQgdXAgY3VzdG9tIHBsdWdpbnMgZnJvbSBsb2NhbFN0b3JhZ2U/ICovXG4gIHN1cHBvcnRDdXN0b21QbHVnaW5zOiBib29sZWFuXG59XG5cbmV4cG9ydCBjb25zdCBzZXR1cFBsYXlncm91bmQgPSAoXG4gIHNhbmRib3g6IFNhbmRib3gsXG4gIG1vbmFjbzogTW9uYWNvLFxuICBjb25maWc6IFBsYXlncm91bmRDb25maWcsXG4gIGk6IChrZXk6IHN0cmluZykgPT4gc3RyaW5nLFxuICByZWFjdDogdHlwZW9mIFJlYWN0XG4pID0+IHtcbiAgY29uc3QgcGxheWdyb3VuZFBhcmVudCA9IHNhbmRib3guZ2V0RG9tTm9kZSgpLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhLnBhcmVudEVsZW1lbnQhXG5cbiAgLy8gVUkgdG8gdGhlIGxlZnRcbiAgY29uc3QgbGVmdE5hdiA9IGNyZWF0ZU5hdmlnYXRpb25TZWN0aW9uKClcbiAgcGxheWdyb3VuZFBhcmVudC5pbnNlcnRCZWZvcmUobGVmdE5hdiwgc2FuZGJveC5nZXREb21Ob2RlKCkucGFyZW50RWxlbWVudCEucGFyZW50RWxlbWVudCEpXG5cbiAgY29uc3QgZHJhZ0JhckxlZnQgPSBjcmVhdGVEcmFnQmFyKFwibGVmdFwiKVxuICBwbGF5Z3JvdW5kUGFyZW50Lmluc2VydEJlZm9yZShkcmFnQmFyTGVmdCwgc2FuZGJveC5nZXREb21Ob2RlKCkucGFyZW50RWxlbWVudCEucGFyZW50RWxlbWVudCEpXG5cbiAgY29uc3Qgc2hvd05hdiA9ICgpID0+IHtcbiAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJwbGF5Z3JvdW5kLXNpZGViYXJcIikuaXRlbSgwKSFcbiAgICBjb25zdCBtaWRkbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRvci1jb250YWluZXJcIikhXG4gICAgbWlkZGxlLnN0eWxlLndpZHRoID0gYGNhbGMoMTAwJSAtICR7cmlnaHQuY2xpZW50V2lkdGggKyAyMTB9cHgpYFxuXG4gICAgbGVmdE5hdi5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgbGVmdE5hdi5zdHlsZS53aWR0aCA9IFwiMjEwcHhcIlxuICAgIGxlZnROYXYuc3R5bGUubWluV2lkdGggPSBcIjIxMHB4XCJcbiAgICBsZWZ0TmF2LnN0eWxlLm1heFdpZHRoID0gXCIyMTBweFwiXG4gICAgZHJhZ0JhckxlZnQuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICB9XG4gIGNvbnN0IGhpZGVOYXYgPSAoKSA9PiB7XG4gICAgbGVmdE5hdi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICBkcmFnQmFyTGVmdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgfVxuXG4gIGhpZGVOYXYoKVxuXG4gIC8vIFVJIHRvIHRoZSByaWdodFxuICBjb25zdCBkcmFnQmFyID0gY3JlYXRlRHJhZ0JhcihcInJpZ2h0XCIpXG4gIHBsYXlncm91bmRQYXJlbnQuYXBwZW5kQ2hpbGQoZHJhZ0JhcilcblxuICBjb25zdCBzaWRlYmFyID0gY3JlYXRlU2lkZWJhcigpXG4gIHBsYXlncm91bmRQYXJlbnQuYXBwZW5kQ2hpbGQoc2lkZWJhcilcblxuICBjb25zdCB0YWJCYXIgPSBjcmVhdGVUYWJCYXIoKVxuICBzaWRlYmFyLmFwcGVuZENoaWxkKHRhYkJhcilcblxuICBjb25zdCBjb250YWluZXIgPSBjcmVhdGVQbHVnaW5Db250YWluZXIoKVxuICBzaWRlYmFyLmFwcGVuZENoaWxkKGNvbnRhaW5lcilcblxuICBjb25zdCBwbHVnaW5zID0gW10gYXMgUGxheWdyb3VuZFBsdWdpbltdXG4gIGNvbnN0IHRhYnMgPSBbXSBhcyBIVE1MQnV0dG9uRWxlbWVudFtdXG5cbiAgLy8gTGV0J3MgdGhpbmdzIGxpa2UgdGhlIHdvcmtiZW5jaCBob29rIGludG8gdGFiIGNoYW5nZXNcbiAgbGV0IGRpZFVwZGF0ZVRhYjogKG5ld1BsdWdpbjogUGxheWdyb3VuZFBsdWdpbiwgcHJldmlvdXNQbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHZvaWQgfCB1bmRlZmluZWRcblxuICBjb25zdCByZWdpc3RlclBsdWdpbiA9IChwbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKVxuXG4gICAgY29uc3QgdGFiID0gY3JlYXRlVGFiRm9yUGx1Z2luKHBsdWdpbilcblxuICAgIHRhYnMucHVzaCh0YWIpXG5cbiAgICBjb25zdCB0YWJDbGlja2VkOiBIVE1MRWxlbWVudFtcIm9uY2xpY2tcIl0gPSBlID0+IHtcbiAgICAgIGNvbnN0IHByZXZpb3VzUGx1Z2luID0gZ2V0Q3VycmVudFBsdWdpbigpXG4gICAgICBsZXQgbmV3VGFiID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnRcbiAgICAgIC8vIEl0IGNvdWxkIGJlIGEgbm90aWZpY2F0aW9uIHlvdSBjbGlja2VkIG9uXG4gICAgICBpZiAobmV3VGFiLnRhZ05hbWUgPT09IFwiRElWXCIpIG5ld1RhYiA9IG5ld1RhYi5wYXJlbnRFbGVtZW50IVxuICAgICAgY29uc3QgbmV3UGx1Z2luID0gcGx1Z2lucy5maW5kKHAgPT4gYHBsYXlncm91bmQtcGx1Z2luLXRhYi0ke3AuaWR9YCA9PSBuZXdUYWIuaWQpIVxuICAgICAgYWN0aXZhdGVQbHVnaW4obmV3UGx1Z2luLCBwcmV2aW91c1BsdWdpbiwgc2FuZGJveCwgdGFiQmFyLCBjb250YWluZXIpXG4gICAgICBkaWRVcGRhdGVUYWIgJiYgZGlkVXBkYXRlVGFiKG5ld1BsdWdpbiwgcHJldmlvdXNQbHVnaW4pXG4gICAgfVxuXG4gICAgdGFiQmFyLmFwcGVuZENoaWxkKHRhYilcbiAgICB0YWIub25jbGljayA9IHRhYkNsaWNrZWRcbiAgfVxuXG4gIGNvbnN0IHNldERpZFVwZGF0ZVRhYiA9IChmdW5jOiAobmV3UGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luLCBwcmV2aW91c1BsdWdpbjogUGxheWdyb3VuZFBsdWdpbikgPT4gdm9pZCkgPT4ge1xuICAgIGRpZFVwZGF0ZVRhYiA9IGZ1bmNcbiAgfVxuXG4gIGNvbnN0IGdldEN1cnJlbnRQbHVnaW4gPSAoKSA9PiB7XG4gICAgY29uc3Qgc2VsZWN0ZWRUYWIgPSB0YWJzLmZpbmQodCA9PiB0LmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSkhXG4gICAgcmV0dXJuIHBsdWdpbnNbdGFicy5pbmRleE9mKHNlbGVjdGVkVGFiKV1cbiAgfVxuXG4gIGNvbnN0IGRlZmF1bHRQbHVnaW5zID0gY29uZmlnLnBsdWdpbnMgfHwgZ2V0UGxheWdyb3VuZFBsdWdpbnMoKVxuICBjb25zdCB1dGlscyA9IGNyZWF0ZVV0aWxzKHNhbmRib3gsIHJlYWN0KVxuICBjb25zdCBpbml0aWFsUGx1Z2lucyA9IGRlZmF1bHRQbHVnaW5zLm1hcChmID0+IGYoaSwgdXRpbHMpKVxuICBpbml0aWFsUGx1Z2lucy5mb3JFYWNoKHAgPT4gcmVnaXN0ZXJQbHVnaW4ocCkpXG5cbiAgLy8gQ2hvb3NlIHdoaWNoIHNob3VsZCBiZSBzZWxlY3RlZFxuICBjb25zdCBwcmlvcml0eVBsdWdpbiA9IHBsdWdpbnMuZmluZChwbHVnaW4gPT4gcGx1Z2luLnNob3VsZEJlU2VsZWN0ZWQgJiYgcGx1Z2luLnNob3VsZEJlU2VsZWN0ZWQoKSlcbiAgY29uc3Qgc2VsZWN0ZWRQbHVnaW4gPSBwcmlvcml0eVBsdWdpbiB8fCBwbHVnaW5zWzBdXG4gIGNvbnN0IHNlbGVjdGVkVGFiID0gdGFic1twbHVnaW5zLmluZGV4T2Yoc2VsZWN0ZWRQbHVnaW4pXSFcbiAgc2VsZWN0ZWRUYWIub25jbGljayEoeyB0YXJnZXQ6IHNlbGVjdGVkVGFiIH0gYXMgYW55KVxuXG4gIGxldCBkZWJvdW5jaW5nVGltZXIgPSBmYWxzZVxuICBzYW5kYm94LmVkaXRvci5vbkRpZENoYW5nZU1vZGVsQ29udGVudChfZXZlbnQgPT4ge1xuICAgIGNvbnN0IHBsdWdpbiA9IGdldEN1cnJlbnRQbHVnaW4oKVxuICAgIGlmIChwbHVnaW4ubW9kZWxDaGFuZ2VkKSBwbHVnaW4ubW9kZWxDaGFuZ2VkKHNhbmRib3gsIHNhbmRib3guZ2V0TW9kZWwoKSwgY29udGFpbmVyKVxuXG4gICAgLy8gVGhpcyBuZWVkcyB0byBiZSBsYXN0IGluIHRoZSBmdW5jdGlvblxuICAgIGlmIChkZWJvdW5jaW5nVGltZXIpIHJldHVyblxuICAgIGRlYm91bmNpbmdUaW1lciA9IHRydWVcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRlYm91bmNpbmdUaW1lciA9IGZhbHNlXG4gICAgICBwbGF5Z3JvdW5kRGVib3VuY2VkTWFpbkZ1bmN0aW9uKClcblxuICAgICAgLy8gT25seSBjYWxsIHRoZSBwbHVnaW4gZnVuY3Rpb24gb25jZSBldmVyeSAwLjNzXG4gICAgICBpZiAocGx1Z2luLm1vZGVsQ2hhbmdlZERlYm91bmNlICYmIHBsdWdpbi5pZCA9PT0gZ2V0Q3VycmVudFBsdWdpbigpLmlkKSB7XG4gICAgICAgIHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZShzYW5kYm94LCBzYW5kYm94LmdldE1vZGVsKCksIGNvbnRhaW5lcilcbiAgICAgIH1cbiAgICB9LCAzMDApXG4gIH0pXG5cbiAgLy8gV2hlbiB0aGVyZSBhcmUgbXVsdGktZmlsZSBwbGF5Z3JvdW5kcywgd2Ugc2hvdWxkIHNob3cgdGhlIGltcGxpY2l0IGZpbGVuYW1lLCBpZGVhbGx5IHRoaXMgd291bGQgYmVcbiAgLy8gc29tZXRoaW5nIG1vcmUgaW5saW5lLCBidXQgd2UgY2FuIGFidXNlIHRoZSBjb2RlIGxlbnNlcyBmb3Igbm93IGJlY2F1c2UgdGhleSBnZXQgdGhlaXIgb3duIGxpbmUhXG4gIHNhbmRib3gubW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckNvZGVMZW5zUHJvdmlkZXIoc2FuZGJveC5sYW5ndWFnZSwge1xuICAgIHByb3ZpZGVDb2RlTGVuc2VzOiBmdW5jdGlvbiAobW9kZWwsIHRva2VuKSB7XG4gICAgICAvLyBJZiB5b3UgaGF2ZSBAZmlsZW5hbWUgb24gdGhlIGZpcnN0IGxpbmUsIGRvbid0IHNob3cgdGhlIGltcGxpY2l0IGZpbGVuYW1lXG4gICAgICBjb25zdCBsZW5zZXMgPSAhc2hvd0ZpbGVDb2RlTGVucyAmJiAhbW9kZWwuZ2V0TGluZUNvbnRlbnQoMSkuc3RhcnRzV2l0aChcIi8vIEBmaWxlbmFtZVwiKVxuICAgICAgICA/IFtdXG4gICAgICAgIDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogMSxcbiAgICAgICAgICAgICAgICBzdGFydENvbHVtbjogMSxcbiAgICAgICAgICAgICAgICBlbmRMaW5lTnVtYmVyOiAyLFxuICAgICAgICAgICAgICAgIGVuZENvbHVtbjogMSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgaWQ6IFwiaW1wbGljaXQtZmlsZW5hbWUtZmlyc3RcIixcbiAgICAgICAgICAgICAgY29tbWFuZDoge1xuICAgICAgICAgICAgICAgIGlkOiBcIm5vb3BcIixcbiAgICAgICAgICAgICAgICB0aXRsZTogYC8vIEBmaWxlbmFtZTogJHtzYW5kYm94LmZpbGVwYXRofWAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF1cbiAgICAgIHJldHVybiB7IGxlbnNlcywgZGlzcG9zZTogKCkgPT4ge30gfVxuICAgIH0sXG4gIH0pXG5cbiAgbGV0IHNob3dGaWxlQ29kZUxlbnMgPSBmYWxzZVxuXG4gIC8vIElmIHlvdSBzZXQgdGhpcyB0byB0cnVlLCB0aGVuIHRoZSBuZXh0IHRpbWUgdGhlIHBsYXlncm91bmQgd291bGRcbiAgLy8gaGF2ZSBzZXQgdGhlIHVzZXIncyBoYXNoIGl0IHdvdWxkIGJlIHNraXBwZWQgLSB1c2VkIGZvciBzZXR0aW5nXG4gIC8vIHRoZSB0ZXh0IGluIGV4YW1wbGVzXG4gIGxldCBzdXBwcmVzc05leHRUZXh0Q2hhbmdlRm9ySGFzaENoYW5nZSA9IGZhbHNlXG5cbiAgLy8gU2V0cyB0aGUgVVJMIGFuZCBzdG9yYWdlIG9mIHRoZSBzYW5kYm94IHN0cmluZ1xuICBjb25zdCBwbGF5Z3JvdW5kRGVib3VuY2VkTWFpbkZ1bmN0aW9uID0gKCkgPT4ge1xuICAgIHNob3dGaWxlQ29kZUxlbnMgPSBzYW5kYm94LmdldFRleHQoKS5pbmNsdWRlcyhcIi8vIEBmaWxlbmFtZVwiKVxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwic2FuZGJveC1oaXN0b3J5XCIsIHNhbmRib3guZ2V0VGV4dCgpKVxuICB9XG5cbiAgc2FuZGJveC5lZGl0b3Iub25EaWRCbHVyRWRpdG9yVGV4dCgoKSA9PiB7XG4gICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGlzYWJsZS1zYXZlLW9uLXR5cGVcIilcbiAgICBpZiAoYWx3YXlzVXBkYXRlVVJMKSB7XG4gICAgICBpZiAoc3VwcHJlc3NOZXh0VGV4dENoYW5nZUZvckhhc2hDaGFuZ2UpIHtcbiAgICAgICAgc3VwcHJlc3NOZXh0VGV4dENoYW5nZUZvckhhc2hDaGFuZ2UgPSBmYWxzZVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cbiAgICAgIGNvbnN0IG5ld1VSTCA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIFwiXCIsIG5ld1VSTClcbiAgICB9XG4gIH0pXG5cbiAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hldGhlciB0aGUgcHJvamVjdCBoYXMgYmVlbiBzZXQgdXAgYXMgYW4gRVNNIG1vZHVsZSB2aWEgYSBwYWNrYWdlLmpzb25cbiAgbGV0IGlzRVNNTW9kZSA9IGZhbHNlXG5cbiAgLy8gV2hlbiBhbnkgY29tcGlsZXIgZmxhZ3MgYXJlIGNoYW5nZWQsIHRyaWdnZXIgYSBwb3RlbnRpYWwgY2hhbmdlIHRvIHRoZSBVUkxcbiAgc2FuZGJveC5zZXREaWRVcGRhdGVDb21waWxlclNldHRpbmdzKGFzeW5jICgpID0+IHtcbiAgICBwbGF5Z3JvdW5kRGVib3VuY2VkTWFpbkZ1bmN0aW9uKClcblxuICAgIGNvbnN0IG1vZGVsID0gc2FuZGJveC5lZGl0b3IuZ2V0TW9kZWwoKVxuICAgIGNvbnN0IHBsdWdpbiA9IGdldEN1cnJlbnRQbHVnaW4oKVxuICAgIGlmIChtb2RlbCAmJiBwbHVnaW4ubW9kZWxDaGFuZ2VkKSBwbHVnaW4ubW9kZWxDaGFuZ2VkKHNhbmRib3gsIG1vZGVsLCBjb250YWluZXIpXG4gICAgaWYgKG1vZGVsICYmIHBsdWdpbi5tb2RlbENoYW5nZWREZWJvdW5jZSkgcGx1Z2luLm1vZGVsQ2hhbmdlZERlYm91bmNlKHNhbmRib3gsIG1vZGVsLCBjb250YWluZXIpXG5cbiAgICBjb25zdCBhbHdheXNVcGRhdGVVUkwgPSAhbG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkaXNhYmxlLXNhdmUtb24tdHlwZVwiKVxuICAgIGlmIChhbHdheXNVcGRhdGVVUkwpIHtcbiAgICAgIGNvbnN0IG5ld1VSTCA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoe30sIFwiXCIsIG5ld1VSTClcbiAgICB9XG5cbiAgICAvLyBBZGQgYW4gb3V0ZXIgcGFja2FnZS5qc29uIHdpdGggJ21vZHVsZTogdHlwZScgYW5kIGVuc3VyZXMgYWxsIHRoZVxuICAgIC8vIG90aGVyIHNldHRpbmdzIGFyZSBpbmxpbmUgZm9yIEVTTSBtb2RlXG4gICAgY29uc3QgbW9kdWxlTnVtYmVyID0gKHNhbmRib3guZ2V0Q29tcGlsZXJPcHRpb25zKCkubW9kdWxlIGFzIG51bWJlcikgfHwgMFxuICAgIGNvbnN0IGlzRVNNdmlhTW9kdWxlID0gbW9kdWxlTnVtYmVyID4gOTkgJiYgbW9kdWxlTnVtYmVyIDwgMjAwXG4gICAgY29uc3QgbW9kdWxlUmVzTnVtYmVyID0gc2FuZGJveC5nZXRDb21waWxlck9wdGlvbnMoKS5tb2R1bGVSZXNvbHV0aW9uIHx8IDBcbiAgICBjb25zdCBpc0VTTXZpYU1vZHVsZVJlcyA9IG1vZHVsZVJlc051bWJlciA+IDIgJiYgbW9kdWxlUmVzTnVtYmVyIDwgMTAwXG5cbiAgICBpZiAoaXNFU012aWFNb2R1bGUgfHwgaXNFU012aWFNb2R1bGVSZXMpIHtcbiAgICAgIGlmIChpc0VTTU1vZGUpIHJldHVyblxuICAgICAgaXNFU01Nb2RlID0gdHJ1ZVxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHVpLmZsYXNoSW5mbyhpKFwicGxheV9lc21fbW9kZVwiKSlcbiAgICAgIH0sIDMwMClcblxuICAgICAgY29uc3QgbmV4dFJlcyA9IChtb2R1bGVOdW1iZXIgPT09IDE5OSB8fCBtb2R1bGVOdW1iZXIgPT09IDEwMCA/IDk5IDogMikgYXMgaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5sYW5ndWFnZXMudHlwZXNjcmlwdC5Nb2R1bGVSZXNvbHV0aW9uS2luZFxuICAgICAgc2FuZGJveC5zZXRDb21waWxlclNldHRpbmdzKHsgdGFyZ2V0OiA5OSwgbW9kdWxlUmVzb2x1dGlvbjogbmV4dFJlcywgbW9kdWxlOiBtb2R1bGVOdW1iZXIgfSlcbiAgICAgIHNhbmRib3guYWRkTGlicmFyeVRvUnVudGltZShKU09OLnN0cmluZ2lmeSh7IG5hbWU6IFwicGxheWdyb3VuZFwiLCB0eXBlOiBcIm1vZHVsZVwiIH0pLCBcIi9wYWNrYWdlLmpzb25cIilcbiAgICB9XG4gIH0pXG5cbiAgY29uc3Qgc2tpcEluaXRpYWxseVNldHRpbmdIYXNoID0gZG9jdW1lbnQubG9jYXRpb24uaGFzaCAmJiBkb2N1bWVudC5sb2NhdGlvbi5oYXNoLmluY2x1ZGVzKFwiZXhhbXBsZS9cIilcbiAgaWYgKCFza2lwSW5pdGlhbGx5U2V0dGluZ0hhc2gpIHBsYXlncm91bmREZWJvdW5jZWRNYWluRnVuY3Rpb24oKVxuXG4gIC8vIFNldHVwIHdvcmtpbmcgd2l0aCB0aGUgZXhpc3RpbmcgVUksIG9uY2UgaXQncyBsb2FkZWRcblxuICAvLyBWZXJzaW9ucyBvZiBUeXBlU2NyaXB0XG5cbiAgLy8gU2V0IHVwIHRoZSBsYWJlbCBmb3IgdGhlIGRyb3Bkb3duXG4gIGNvbnN0IHZlcnNpb25CdXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3ZlcnNpb25zID4gYVwiKS5pdGVtKDApXG4gIHZlcnNpb25CdXR0b24udGV4dENvbnRlbnQgPSBcInZcIiArIHNhbmRib3gudHMudmVyc2lvbiArIFwiIFwiXG4gIGNvbnN0IGNhcmV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW1cIilcbiAgY2FyZXQuY2xhc3NMaXN0LmFkZChcImNhcmV0XCIpXG4gIHZlcnNpb25CdXR0b24uYXBwZW5kQ2hpbGQoY2FyZXQpXG4gIHZlcnNpb25CdXR0b24uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBgU2VsZWN0IHZlcnNpb24gb2YgVHlwZVNjcmlwdCwgY3VycmVudGx5ICR7c2FuZGJveC50cy52ZXJzaW9ufWApXG5cbiAgLy8gQWRkIHRoZSB2ZXJzaW9ucyB0byB0aGUgZHJvcGRvd25cbiAgY29uc3QgdmVyc2lvbnNNZW51ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN2ZXJzaW9ucyA+IHVsXCIpLml0ZW0oMClcblxuICAvLyBFbmFibGUgYWxsIHN1Ym1lbnVzXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJuYXYgdWwgbGlcIikuZm9yRWFjaChlID0+IGUuY2xhc3NMaXN0LmFkZChcImFjdGl2ZVwiKSlcblxuICBjb25zdCBub3RXb3JraW5nSW5QbGF5Z3JvdW5kID0gW1wiMy4xLjZcIiwgXCIzLjAuMVwiLCBcIjIuOC4xXCIsIFwiMi43LjJcIiwgXCIyLjQuMVwiXVxuXG4gIGNvbnN0IGFsbFZlcnNpb25zID0gW1wiTmlnaHRseVwiLCAuLi5zYW5kYm94LnN1cHBvcnRlZFZlcnNpb25zLmZpbHRlcihmID0+ICFub3RXb3JraW5nSW5QbGF5Z3JvdW5kLmluY2x1ZGVzKGYpKV1cblxuICBhbGxWZXJzaW9ucy5mb3JFYWNoKCh2OiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKVxuICAgIGEudGV4dENvbnRlbnQgPSB2XG4gICAgYS5ocmVmID0gXCIjXCJcblxuICAgIGlmICh2ID09PSBcIk5pZ2h0bHlcIikge1xuICAgICAgbGkuY2xhc3NMaXN0LmFkZChcIm5pZ2h0bHlcIilcbiAgICB9XG5cbiAgICBpZiAodi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKFwiYmV0YVwiKSkge1xuICAgICAgbGkuY2xhc3NMaXN0LmFkZChcImJldGFcIilcbiAgICB9XG5cbiAgICBsaS5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFVSTCA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gpXG4gICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKGN1cnJlbnRVUkwuc3BsaXQoXCIjXCIpWzBdKVxuICAgICAgY29uc3QgdmVyc2lvbiA9IHYgPT09IFwiTmlnaHRseVwiID8gXCJuZXh0XCIgOiB2XG4gICAgICBwYXJhbXMuc2V0KFwidHNcIiwgdmVyc2lvbilcblxuICAgICAgY29uc3QgaGFzaCA9IGRvY3VtZW50LmxvY2F0aW9uLmhhc2gubGVuZ3RoID8gZG9jdW1lbnQubG9jYXRpb24uaGFzaCA6IFwiXCJcbiAgICAgIGNvbnN0IG5ld1VSTCA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWV9PyR7cGFyYW1zfSR7aGFzaH1gXG5cbiAgICAgIC8vIEB0cy1pZ25vcmUgLSBpdCBpcyBhbGxvd2VkXG4gICAgICBkb2N1bWVudC5sb2NhdGlvbiA9IG5ld1VSTFxuICAgIH1cblxuICAgIGxpLmFwcGVuZENoaWxkKGEpXG4gICAgdmVyc2lvbnNNZW51LmFwcGVuZENoaWxkKGxpKVxuICB9KVxuXG4gIC8vIFN1cHBvcnQgZHJvcGRvd25zXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubmF2YmFyLXN1YiBsaS5kcm9wZG93biA+IGFcIikuZm9yRWFjaChsaW5rID0+IHtcbiAgICBjb25zdCBhID0gbGluayBhcyBIVE1MQW5jaG9yRWxlbWVudFxuICAgIGEub25jbGljayA9IF9lID0+IHtcbiAgICAgIGlmIChhLnBhcmVudEVsZW1lbnQhLmNsYXNzTGlzdC5jb250YWlucyhcIm9wZW5cIikpIHtcbiAgICAgICAgZXNjYXBlUHJlc3NlZCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlc2NhcGVQcmVzc2VkKClcbiAgICAgICAgYS5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKVxuICAgICAgICBhLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJ0cnVlXCIpXG5cbiAgICAgICAgY29uc3QgZXhhbXBsZUNvbnRhaW5lciA9IGEuY2xvc2VzdChcImxpXCIpIS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiZHJvcGRvd24tZGlhbG9nXCIpLml0ZW0oMCkgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgaWYgKCFleGFtcGxlQ29udGFpbmVyKSByZXR1cm5cblxuICAgICAgICBjb25zdCBmaXJzdExhYmVsID0gZXhhbXBsZUNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKFwibGFiZWxcIikgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgaWYgKGZpcnN0TGFiZWwpIGZpcnN0TGFiZWwuZm9jdXMoKVxuXG4gICAgICAgIC8vIFNldCBleGFjdCBoZWlnaHQgYW5kIHdpZHRocyBmb3IgdGhlIHBvcG92ZXJzIGZvciB0aGUgbWFpbiBwbGF5Z3JvdW5kIG5hdmlnYXRpb25cbiAgICAgICAgY29uc3QgaXNQbGF5Z3JvdW5kU3VibWVudSA9ICEhYS5jbG9zZXN0KFwibmF2XCIpXG4gICAgICAgIGlmIChpc1BsYXlncm91bmRTdWJtZW51KSB7XG4gICAgICAgICAgY29uc3QgcGxheWdyb3VuZENvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZC1jb250YWluZXJcIikhXG4gICAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5zdHlsZS5oZWlnaHQgPSBgY2FsYygke3BsYXlncm91bmRDb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0ICsgMjZ9cHggLSA0cmVtKWBcblxuICAgICAgICAgIGNvbnN0IHNpZGVCYXJXaWR0aCA9IChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtc2lkZWJhclwiKSBhcyBhbnkpLm9mZnNldFdpZHRoXG4gICAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGBjYWxjKDEwMCUgLSAke3NpZGVCYXJXaWR0aH1weCAtIDcxcHgpYFxuXG4gICAgICAgICAgLy8gQWxsIHRoaXMgaXMgdG8gbWFrZSBzdXJlIHRoYXQgdGFiYmluZyBzdGF5cyBpbnNpZGUgdGhlIGRyb3Bkb3duIGZvciB0c2NvbmZpZy9leGFtcGxlc1xuICAgICAgICAgIGNvbnN0IGJ1dHRvbnMgPSBleGFtcGxlQ29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoXCJpbnB1dFwiKVxuICAgICAgICAgIGNvbnN0IGxhc3RCdXR0b24gPSBidXR0b25zLml0ZW0oYnV0dG9ucy5sZW5ndGggLSAxKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgIGlmIChsYXN0QnV0dG9uKSB7XG4gICAgICAgICAgICByZWRpcmVjdFRhYlByZXNzVG8obGFzdEJ1dHRvbiwgZXhhbXBsZUNvbnRhaW5lciwgXCIuZXhhbXBsZXMtY2xvc2VcIilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmRyb3Bkb3duLWRpYWxvZyAuc2VjdGlvbi1jb250ZW50XCIpXG4gICAgICAgICAgICBzZWN0aW9ucy5mb3JFYWNoKHMgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBidXR0b25zID0gcy5xdWVyeVNlbGVjdG9yQWxsKFwiYS5leGFtcGxlLWxpbmtcIilcbiAgICAgICAgICAgICAgY29uc3QgbGFzdEJ1dHRvbiA9IGJ1dHRvbnMuaXRlbShidXR0b25zLmxlbmd0aCAtIDEpIGFzIEhUTUxFbGVtZW50XG4gICAgICAgICAgICAgIGlmIChsYXN0QnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUYWJQcmVzc1RvKGxhc3RCdXR0b24sIGV4YW1wbGVDb250YWluZXIsIFwiLmV4YW1wbGVzLWNsb3NlXCIpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0pXG5cbiAgLyoqIEhhbmRsZXMgcmVtb3ZpbmcgdGhlIGRyb3Bkb3ducyBsaWtlIHRzY29uZmlnL2V4YW1wbGVzL2hhbmRib29rICovXG4gIGNvbnN0IGVzY2FwZVByZXNzZWQgPSAoKSA9PiB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5uYXZiYXItc3ViIGxpLm9wZW5cIikuZm9yRWFjaChpID0+IGkuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5cIikpXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5uYXZiYXItc3ViIGxpXCIpLmZvckVhY2goaSA9PiBpLnNldEF0dHJpYnV0ZShcImFyaWEtZXhwYW5kZWRcIiwgXCJmYWxzZVwiKSlcblxuICAgIGhpZGVOYXZGb3JIYW5kYm9vayhzYW5kYm94KVxuICB9XG5cbiAgLy8gSGFuZGxlIGVzY2FwZSBjbG9zaW5nIGRyb3Bkb3ducyBldGNcbiAgZG9jdW1lbnQub25rZXlkb3duID0gZnVuY3Rpb24gKGV2dCkge1xuICAgIGV2dCA9IGV2dCB8fCB3aW5kb3cuZXZlbnRcbiAgICB2YXIgaXNFc2NhcGUgPSBmYWxzZVxuICAgIGlmIChcImtleVwiIGluIGV2dCkge1xuICAgICAgaXNFc2NhcGUgPSBldnQua2V5ID09PSBcIkVzY2FwZVwiIHx8IGV2dC5rZXkgPT09IFwiRXNjXCJcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQHRzLWlnbm9yZSAtIHRoaXMgdXNlZCB0byBiZSB0aGUgY2FzZVxuICAgICAgaXNFc2NhcGUgPSBldnQua2V5Q29kZSA9PT0gMjdcbiAgICB9XG4gICAgaWYgKGlzRXNjYXBlKSBlc2NhcGVQcmVzc2VkKClcbiAgfVxuXG4gIGNvbnN0IHNoYXJlQWN0aW9uID0ge1xuICAgIGlkOiBcImNvcHktY2xpcGJvYXJkXCIsXG4gICAgbGFiZWw6IFwiU2F2ZSB0byBjbGlwYm9hcmRcIixcbiAgICBrZXliaW5kaW5nczogW21vbmFjby5LZXlNb2QuQ3RybENtZCB8IG1vbmFjby5LZXlDb2RlLktleVNdLFxuXG4gICAgY29udGV4dE1lbnVHcm91cElkOiBcInJ1blwiLFxuICAgIGNvbnRleHRNZW51T3JkZXI6IDEuNSxcblxuICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgLy8gVXBkYXRlIHRoZSBVUkwsIHRoZW4gd3JpdGUgdGhhdCB0byB0aGUgY2xpcGJvYXJkXG4gICAgICBjb25zdCBuZXdVUkwgPSBzYW5kYm94LmNyZWF0ZVVSTFF1ZXJ5V2l0aENvbXBpbGVyT3B0aW9ucyhzYW5kYm94KVxuICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBcIlwiLCBuZXdVUkwpXG4gICAgICB3aW5kb3cubmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobG9jYXRpb24uaHJlZi50b1N0cmluZygpKS50aGVuKFxuICAgICAgICAoKSA9PiB1aS5mbGFzaEluZm8oaShcInBsYXlfZXhwb3J0X2NsaXBib2FyZFwiKSksXG4gICAgICAgIChlOiBhbnkpID0+IGFsZXJ0KGUpXG4gICAgICApXG4gICAgfSxcbiAgfVxuXG4gIGNvbnN0IHNoYXJlQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaGFyZS1idXR0b25cIilcbiAgaWYgKHNoYXJlQnV0dG9uKSB7XG4gICAgc2hhcmVCdXR0b24ub25jbGljayA9IGUgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBzaGFyZUFjdGlvbi5ydW4oKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gU2V0IHVwIHNvbWUga2V5IGNvbW1hbmRzXG4gICAgc2FuZGJveC5lZGl0b3IuYWRkQWN0aW9uKHNoYXJlQWN0aW9uKVxuXG4gICAgc2FuZGJveC5lZGl0b3IuYWRkQWN0aW9uKHtcbiAgICAgIGlkOiBcInJ1bi1qc1wiLFxuICAgICAgbGFiZWw6IFwiUnVuIHRoZSBldmFsdWF0ZWQgSmF2YVNjcmlwdCBmb3IgeW91ciBUeXBlU2NyaXB0IGZpbGVcIixcbiAgICAgIGtleWJpbmRpbmdzOiBbbW9uYWNvLktleU1vZC5DdHJsQ21kIHwgbW9uYWNvLktleUNvZGUuRW50ZXJdLFxuXG4gICAgICBjb250ZXh0TWVudUdyb3VwSWQ6IFwicnVuXCIsXG4gICAgICBjb250ZXh0TWVudU9yZGVyOiAxLjUsXG5cbiAgICAgIHJ1bjogZnVuY3Rpb24gKGVkKSB7XG4gICAgICAgIGNvbnN0IHJ1bkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicnVuLWJ1dHRvblwiKVxuICAgICAgICBydW5CdXR0b24gJiYgcnVuQnV0dG9uLm9uY2xpY2sgJiYgcnVuQnV0dG9uLm9uY2xpY2soe30gYXMgYW55KVxuICAgICAgfSxcbiAgICB9KVxuICB9XG5cbiAgY29uc3QgcnVuQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJydW4tYnV0dG9uXCIpXG4gIGlmIChydW5CdXR0b24pIHtcbiAgICBydW5CdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHJ1biA9IHNhbmRib3guZ2V0UnVubmFibGVKUygpXG4gICAgICBjb25zdCBydW5QbHVnaW4gPSBwbHVnaW5zLmZpbmQocCA9PiBwLmlkID09PSBcImxvZ3NcIikhXG4gICAgICBhY3RpdmF0ZVBsdWdpbihydW5QbHVnaW4sIGdldEN1cnJlbnRQbHVnaW4oKSwgc2FuZGJveCwgdGFiQmFyLCBjb250YWluZXIpXG5cbiAgICAgIHJ1bldpdGhDdXN0b21Mb2dzKHJ1biwgaSlcblxuICAgICAgY29uc3QgaXNKUyA9IHNhbmRib3guY29uZmlnLmZpbGV0eXBlID09PSBcImpzXCJcbiAgICAgIHVpLmZsYXNoSW5mbyhpKGlzSlMgPyBcInBsYXlfcnVuX2pzXCIgOiBcInBsYXlfcnVuX3RzXCIpKVxuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLy8gSGFuZGxlIHRoZSBjbG9zZSBidXR0b25zIG9uIHRoZSBleGFtcGxlc1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uLmV4YW1wbGVzLWNsb3NlXCIpLmZvckVhY2goYiA9PiB7XG4gICAgY29uc3QgYnV0dG9uID0gYiBhcyBIVE1MQnV0dG9uRWxlbWVudFxuICAgIGJ1dHRvbi5vbmNsaWNrID0gZXNjYXBlUHJlc3NlZFxuICB9KVxuXG4gIC8vIFN1cHBvcnQgY2xpY2tpbmcgdGhlIGhhbmRib29rIGJ1dHRvbiBvbiB0aGUgdG9wIG5hdlxuICBjb25zdCBoYW5kYm9va0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFuZGJvb2stYnV0dG9uXCIpXG5cbiAgaWYgKGhhbmRib29rQnV0dG9uKSB7XG4gICAgaGFuZGJvb2tCdXR0b24ub25jbGljayA9ICgpID0+IHtcbiAgICAgIC8vIFR3byBwb3RlbnRpYWxseSBjb25jdXJyZW50IHNpZGViYXIgbmF2cyBpcyBqdXN0IGEgYml0IHRvbyBtdWNoXG4gICAgICAvLyBzdGF0ZSB0byBrZWVwIHRyYWNrIG9mIEFUTVxuICAgICAgaWYgKCFoYW5kYm9va0J1dHRvbi5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuY29udGFpbnMoXCJhY3RpdmVcIikpIHtcbiAgICAgICAgdWkuZmxhc2hJbmZvKFwiQ2Fubm90IG9wZW4gdGhlIFBsYXlncm91bmQgaGFuZGJvb2sgd2hlbiBpbiBhIEdpc3RcIilcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNob3dpbmdIYW5kYm9vayA9IGhhbmRib29rQnV0dG9uLnBhcmVudEVsZW1lbnQhLmNsYXNzTGlzdC5jb250YWlucyhcIm9wZW5cIilcbiAgICAgIGlmICghc2hvd2luZ0hhbmRib29rKSB7XG4gICAgICAgIGVzY2FwZVByZXNzZWQoKVxuXG4gICAgICAgIHNob3dOYXYoKVxuICAgICAgICBoYW5kYm9va0J1dHRvbi5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuYWRkKFwib3BlblwiKVxuICAgICAgICBzaG93TmF2Rm9ySGFuZGJvb2soc2FuZGJveCwgZXNjYXBlUHJlc3NlZClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVzY2FwZVByZXNzZWQoKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBzZXR1cFNpZGViYXJUb2dnbGUoKVxuXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbmZpZy1jb250YWluZXJcIikpIHtcbiAgICBjcmVhdGVDb25maWdEcm9wZG93bihzYW5kYm94LCBtb25hY28pXG4gICAgdXBkYXRlQ29uZmlnRHJvcGRvd25Gb3JDb21waWxlck9wdGlvbnMoc2FuZGJveCwgbW9uYWNvKVxuICB9XG5cbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZC1zZXR0aW5nc1wiKSkge1xuICAgIGNvbnN0IHNldHRpbmdzVG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kLXNldHRpbmdzXCIpIVxuXG4gICAgc2V0dGluZ3NUb2dnbGUub25jbGljayA9ICgpID0+IHtcbiAgICAgIGNvbnN0IG9wZW4gPSBzZXR0aW5nc1RvZ2dsZS5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QuY29udGFpbnMoXCJvcGVuXCIpXG4gICAgICBjb25zdCBzaWRlYmFyVGFicyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWdyb3VuZC1wbHVnaW4tdGFidmlld1wiKSBhcyBIVE1MRGl2RWxlbWVudFxuICAgICAgY29uc3Qgc2lkZWJhckNvbnRlbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtcGx1Z2luLWNvbnRhaW5lclwiKSBhcyBIVE1MRGl2RWxlbWVudFxuICAgICAgbGV0IHNldHRpbmdzQ29udGVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWdyb3VuZC1zZXR0aW5ncy1jb250YWluZXJcIikgYXMgSFRNTERpdkVsZW1lbnRcblxuICAgICAgaWYgKCFzZXR0aW5nc0NvbnRlbnQpIHtcbiAgICAgICAgc2V0dGluZ3NDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgICBzZXR0aW5nc0NvbnRlbnQuY2xhc3NOYW1lID0gXCJwbGF5Z3JvdW5kLXNldHRpbmdzLWNvbnRhaW5lciBwbGF5Z3JvdW5kLXBsdWdpbi1jb250YWluZXJcIlxuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IHNldHRpbmdzUGx1Z2luKGksIHV0aWxzKVxuICAgICAgICBzZXR0aW5ncy5kaWRNb3VudCAmJiBzZXR0aW5ncy5kaWRNb3VudChzYW5kYm94LCBzZXR0aW5nc0NvbnRlbnQpXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWdyb3VuZC1zaWRlYmFyXCIpIS5hcHBlbmRDaGlsZChzZXR0aW5nc0NvbnRlbnQpXG5cbiAgICAgICAgLy8gV2hlbiB0aGUgbGFzdCB0YWIgaXRlbSBpcyBoaXQsIGdvIGJhY2sgdG8gdGhlIHNldHRpbmdzIGJ1dHRvblxuICAgICAgICBjb25zdCBsYWJlbHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnBsYXlncm91bmQtc2lkZWJhciBpbnB1dFwiKVxuICAgICAgICBjb25zdCBsYXN0TGFiZWwgPSBsYWJlbHMuaXRlbShsYWJlbHMubGVuZ3RoIC0gMSkgYXMgSFRNTEVsZW1lbnRcbiAgICAgICAgaWYgKGxhc3RMYWJlbCkge1xuICAgICAgICAgIHJlZGlyZWN0VGFiUHJlc3NUbyhsYXN0TGFiZWwsIHVuZGVmaW5lZCwgXCIjcGxheWdyb3VuZC1zZXR0aW5nc1wiKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvcGVuKSB7XG4gICAgICAgIHNpZGViYXJUYWJzLnN0eWxlLmRpc3BsYXkgPSBcImZsZXhcIlxuICAgICAgICBzaWRlYmFyQ29udGVudC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgICAgIHNldHRpbmdzQ29udGVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpZGViYXJUYWJzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuICAgICAgICBzaWRlYmFyQ29udGVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgICAgc2V0dGluZ3NDb250ZW50LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIucGxheWdyb3VuZC1zaWRlYmFyIGxhYmVsXCIpIS5mb2N1cygpXG4gICAgICB9XG4gICAgICBzZXR0aW5nc1RvZ2dsZS5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKVxuICAgIH1cblxuICAgIHNldHRpbmdzVG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGUgPT4ge1xuICAgICAgY29uc3QgaXNPcGVuID0gc2V0dGluZ3NUb2dnbGUucGFyZW50RWxlbWVudCEuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3BlblwiKVxuICAgICAgaWYgKGUua2V5ID09PSBcIlRhYlwiICYmIGlzT3Blbikge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtb3B0aW9ucyBsaSBpbnB1dFwiKSBhcyBhbnlcbiAgICAgICAgcmVzdWx0LmZvY3VzKClcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIC8vIFN1cHBvcnQgZ3JhYmJpbmcgZXhhbXBsZXMgZnJvbSB0aGUgbG9jYXRpb24gaGFzaFxuICBpZiAobG9jYXRpb24uaGFzaC5zdGFydHNXaXRoKFwiI2V4YW1wbGVcIikpIHtcbiAgICBjb25zdCBleGFtcGxlTmFtZSA9IGxvY2F0aW9uLmhhc2gucmVwbGFjZShcIiNleGFtcGxlL1wiLCBcIlwiKS50cmltKClcbiAgICBzYW5kYm94LmNvbmZpZy5sb2dnZXIubG9nKFwiTG9hZGluZyBleGFtcGxlOlwiLCBleGFtcGxlTmFtZSlcbiAgICBnZXRFeGFtcGxlU291cmNlQ29kZShjb25maWcucHJlZml4LCBjb25maWcubGFuZywgZXhhbXBsZU5hbWUpLnRoZW4oZXggPT4ge1xuICAgICAgaWYgKGV4LmV4YW1wbGUgJiYgZXguY29kZSkge1xuICAgICAgICBjb25zdCB7IGV4YW1wbGUsIGNvZGUgfSA9IGV4XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBsb2NhbHN0b3JhZ2Ugc2hvd2luZyB0aGF0IHlvdSd2ZSBzZWVuIHRoaXMgcGFnZVxuICAgICAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICAgICAgY29uc3Qgc2VlblRleHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImV4YW1wbGVzLXNlZW5cIikgfHwgXCJ7fVwiXG4gICAgICAgICAgY29uc3Qgc2VlbiA9IEpTT04ucGFyc2Uoc2VlblRleHQpXG4gICAgICAgICAgc2VlbltleGFtcGxlLmlkXSA9IGV4YW1wbGUuaGFzaFxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZXhhbXBsZXMtc2VlblwiLCBKU09OLnN0cmluZ2lmeShzZWVuKSlcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFsbExpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImV4YW1wbGUtbGlua1wiKVxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGZvciAoY29uc3QgbGluayBvZiBhbGxMaW5rcykge1xuICAgICAgICAgIGlmIChsaW5rLnRleHRDb250ZW50ID09PSBleGFtcGxlLnRpdGxlKSB7XG4gICAgICAgICAgICBsaW5rLmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHRcIilcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBkb2N1bWVudC50aXRsZSA9IFwiVHlwZVNjcmlwdCBQbGF5Z3JvdW5kIC0gXCIgKyBleGFtcGxlLnRpdGxlXG4gICAgICAgIHN1cHByZXNzTmV4dFRleHRDaGFuZ2VGb3JIYXNoQ2hhbmdlID0gdHJ1ZVxuICAgICAgICBzYW5kYm94LnNldFRleHQoY29kZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN1cHByZXNzTmV4dFRleHRDaGFuZ2VGb3JIYXNoQ2hhbmdlID0gdHJ1ZVxuICAgICAgICBzYW5kYm94LnNldFRleHQoXCIvLyBUaGVyZSB3YXMgYW4gaXNzdWUgZ2V0dGluZyB0aGUgZXhhbXBsZSwgYmFkIFVSTD8gQ2hlY2sgdGhlIGNvbnNvbGUgaW4gdGhlIGRldmVsb3BlciB0b29sc1wiKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvLyBTZXQgdGhlIGVycm9ycyBudW1iZXIgaW4gdGhlIHNpZGViYXIgdGFic1xuICBjb25zdCBtb2RlbCA9IHNhbmRib3guZ2V0TW9kZWwoKVxuICBtb2RlbC5vbkRpZENoYW5nZURlY29yYXRpb25zKCgpID0+IHtcbiAgICBjb25zdCBtYXJrZXJzID0gc2FuZGJveC5tb25hY28uZWRpdG9yLmdldE1vZGVsTWFya2Vycyh7IHJlc291cmNlOiBtb2RlbC51cmkgfSkuZmlsdGVyKG0gPT4gbS5zZXZlcml0eSAhPT0gMSlcbiAgICB1dGlscy5zZXROb3RpZmljYXRpb25zKFwiZXJyb3JzXCIsIG1hcmtlcnMubGVuZ3RoKVxuICB9KVxuXG4gIC8vIFNldHMgdXAgYSB3YXkgdG8gY2xpY2sgYmV0d2VlbiBleGFtcGxlc1xuICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVyTGlua1Byb3ZpZGVyKHNhbmRib3gubGFuZ3VhZ2UsIG5ldyBFeGFtcGxlSGlnaGxpZ2h0ZXIoKSlcblxuICBjb25zdCBsYW5ndWFnZVNlbGVjdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsYW5ndWFnZS1zZWxlY3RvclwiKSBhcyBIVE1MU2VsZWN0RWxlbWVudFxuICBpZiAobGFuZ3VhZ2VTZWxlY3Rvcikge1xuICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMobG9jYXRpb24uc2VhcmNoKVxuICAgIGNvbnN0IG9wdGlvbnMgPSBbXCJ0c1wiLCBcImQudHNcIiwgXCJqc1wiXVxuICAgIGxhbmd1YWdlU2VsZWN0b3Iub3B0aW9ucy5zZWxlY3RlZEluZGV4ID0gb3B0aW9ucy5pbmRleE9mKHBhcmFtcy5nZXQoXCJmaWxldHlwZVwiKSB8fCBcInRzXCIpXG5cbiAgICBsYW5ndWFnZVNlbGVjdG9yLm9uY2hhbmdlID0gKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZXR5cGUgPSBvcHRpb25zW051bWJlcihsYW5ndWFnZVNlbGVjdG9yLnNlbGVjdGVkSW5kZXggfHwgMCldXG4gICAgICBjb25zdCBxdWVyeSA9IHNhbmRib3guY3JlYXRlVVJMUXVlcnlXaXRoQ29tcGlsZXJPcHRpb25zKHNhbmRib3gsIHsgZmlsZXR5cGUgfSlcbiAgICAgIGNvbnN0IGZ1bGxVUkwgPSBgJHtkb2N1bWVudC5sb2NhdGlvbi5wcm90b2NvbH0vLyR7ZG9jdW1lbnQubG9jYXRpb24uaG9zdH0ke2RvY3VtZW50LmxvY2F0aW9uLnBhdGhuYW1lfSR7cXVlcnl9YFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgZG9jdW1lbnQubG9jYXRpb24gPSBmdWxsVVJMXG4gICAgfVxuICB9XG5cbiAgLy8gRW5zdXJlIHRoYXQgdGhlIGVkaXRvciBpcyBmdWxsLXdpZHRoIHdoZW4gdGhlIHNjcmVlbiByZXNpemVzXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsICgpID0+IHtcbiAgICBzYW5kYm94LmVkaXRvci5sYXlvdXQoKVxuICB9KVxuXG4gIC8vIFRlbGxzIG1vbmFjbyB0byBjaGVjayBvdXQgdGhlIGZvbnQgc2l6ZXMgaW4gb3JkZXIgdG8gbWFrZVxuICAvLyBzdXJlIHRoYXQgc2VsZWN0aW5nIHRleHQgaW4gdGhlIGVkaXRvciBwcm92aWRlcyB0aGUgc2FtZVxuICAvLyBsZW5ndGggYXMgdW5zZWxlY3RlZCB0ZXh0IC0gb3RoZXJ3aXNlIHNwYWNlIGZvciBhIHNlbGVjdGlvblxuICAvLyB3aWxsIGJlIGEgbGl0dGxlIGJpdCB3aWRlciB0aGFuIGl0IHNob3VsZCBiZS4gc1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBtb25hY28uZWRpdG9yLnJlbWVhc3VyZUZvbnRzKClcbiAgfSwgNTAwMClcblxuICBjb25zdCB1aSA9IGNyZWF0ZVVJKClcbiAgY29uc3QgZXhwb3J0ZXIgPSBjcmVhdGVFeHBvcnRlcihzYW5kYm94LCBtb25hY28sIHVpKVxuXG4gIGNvbnN0IHBsYXlncm91bmQgPSB7XG4gICAgZXhwb3J0ZXIsXG4gICAgdWksXG4gICAgcmVnaXN0ZXJQbHVnaW4sXG4gICAgcGx1Z2lucyxcbiAgICBnZXRDdXJyZW50UGx1Z2luLFxuICAgIHRhYnMsXG4gICAgc2V0RGlkVXBkYXRlVGFiLFxuICAgIGNyZWF0ZVV0aWxzLFxuICB9XG5cbiAgd2luZG93LnRzID0gc2FuZGJveC50c1xuICB3aW5kb3cuc2FuZGJveCA9IHNhbmRib3hcbiAgd2luZG93LnBsYXlncm91bmQgPSBwbGF5Z3JvdW5kXG5cbiAgY29uc29sZS5sb2coYFVzaW5nIFR5cGVTY3JpcHQgJHt3aW5kb3cudHMudmVyc2lvbn1gKVxuXG4gIGNvbnNvbGUubG9nKFwiQXZhaWxhYmxlIGdsb2JhbHM6XCIpXG4gIGNvbnNvbGUubG9nKFwiXFx0d2luZG93LnRzXCIsIHdpbmRvdy50cylcbiAgY29uc29sZS5sb2coXCJcXHR3aW5kb3cuc2FuZGJveFwiLCB3aW5kb3cuc2FuZGJveClcbiAgY29uc29sZS5sb2coXCJcXHR3aW5kb3cucGxheWdyb3VuZFwiLCB3aW5kb3cucGxheWdyb3VuZClcbiAgY29uc29sZS5sb2coXCJcXHR3aW5kb3cucmVhY3RcIiwgd2luZG93LnJlYWN0KVxuICBjb25zb2xlLmxvZyhcIlxcdHdpbmRvdy5yZWFjdERPTVwiLCB3aW5kb3cucmVhY3RET00pXG5cbiAgLyoqIFRoZSBwbHVnaW4gc3lzdGVtICovXG4gIGNvbnN0IGFjdGl2YXRlRXh0ZXJuYWxQbHVnaW4gPSAoXG4gICAgcGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luIHwgKCh1dGlsczogUGx1Z2luVXRpbHMpID0+IFBsYXlncm91bmRQbHVnaW4pLFxuICAgIGF1dG9BY3RpdmF0ZTogYm9vbGVhblxuICApID0+IHtcbiAgICBsZXQgcmVhZHlQbHVnaW46IFBsYXlncm91bmRQbHVnaW5cbiAgICAvLyBDYW4gZWl0aGVyIGJlIGEgZmFjdG9yeSwgb3Igb2JqZWN0XG4gICAgaWYgKHR5cGVvZiBwbHVnaW4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgdXRpbHMgPSBjcmVhdGVVdGlscyhzYW5kYm94LCByZWFjdClcbiAgICAgIHJlYWR5UGx1Z2luID0gcGx1Z2luKHV0aWxzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZWFkeVBsdWdpbiA9IHBsdWdpblxuICAgIH1cblxuICAgIGlmIChhdXRvQWN0aXZhdGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKHJlYWR5UGx1Z2luKVxuICAgIH1cblxuICAgIHBsYXlncm91bmQucmVnaXN0ZXJQbHVnaW4ocmVhZHlQbHVnaW4pXG5cbiAgICAvLyBBdXRvLXNlbGVjdCB0aGUgZGV2IHBsdWdpblxuICAgIGNvbnN0IHBsdWdpbldhbnRzRnJvbnQgPSByZWFkeVBsdWdpbi5zaG91bGRCZVNlbGVjdGVkICYmIHJlYWR5UGx1Z2luLnNob3VsZEJlU2VsZWN0ZWQoKVxuXG4gICAgaWYgKHBsdWdpbldhbnRzRnJvbnQgfHwgYXV0b0FjdGl2YXRlKSB7XG4gICAgICAvLyBBdXRvLXNlbGVjdCB0aGUgZGV2IHBsdWdpblxuICAgICAgYWN0aXZhdGVQbHVnaW4ocmVhZHlQbHVnaW4sIGdldEN1cnJlbnRQbHVnaW4oKSwgc2FuZGJveCwgdGFiQmFyLCBjb250YWluZXIpXG4gICAgfVxuICB9XG5cbiAgLy8gRGV2IG1vZGUgcGx1Z2luXG4gIGlmIChjb25maWcuc3VwcG9ydEN1c3RvbVBsdWdpbnMgJiYgYWxsb3dDb25uZWN0aW5nVG9Mb2NhbGhvc3QoKSkge1xuICAgIHdpbmRvdy5leHBvcnRzID0ge31cbiAgICBjb25zb2xlLmxvZyhcIkNvbm5lY3RpbmcgdG8gZGV2IHBsdWdpblwiKVxuICAgIHRyeSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBjb25zdCByZSA9IHdpbmRvdy5yZXF1aXJlXG4gICAgICByZShbXCJsb2NhbC9pbmRleFwiXSwgKGRldlBsdWdpbjogYW55KSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiU2V0IHVwIGRldiBwbHVnaW4gZnJvbSBsb2NhbGhvc3Q6NTAwMFwiKVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGFjdGl2YXRlRXh0ZXJuYWxQbHVnaW4oZGV2UGx1Z2luLCB0cnVlKVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB1aS5mbGFzaEluZm8oXCJFcnJvcjogQ291bGQgbm90IGxvYWQgZGV2IHBsdWdpbiBmcm9tIGxvY2FsaG9zdDo1MDAwXCIpXG4gICAgICAgICAgfSwgNzAwKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiUHJvYmxlbSBsb2FkaW5nIHVwIHRoZSBkZXYgcGx1Z2luXCIpXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRvd25sb2FkUGx1Z2luID0gKHBsdWdpbjogc3RyaW5nLCBhdXRvRW5hYmxlOiBib29sZWFuKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGNvbnN0IHJlID0gd2luZG93LnJlcXVpcmVcbiAgICAgIHJlKFtgdW5wa2cvJHtwbHVnaW59QGxhdGVzdC9kaXN0L2luZGV4YF0sIChkZXZQbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHtcbiAgICAgICAgYWN0aXZhdGVFeHRlcm5hbFBsdWdpbihkZXZQbHVnaW4sIGF1dG9FbmFibGUpXG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiUHJvYmxlbSBsb2FkaW5nIHVwIHRoZSBwbHVnaW46XCIsIHBsdWdpbilcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgaWYgKGNvbmZpZy5zdXBwb3J0Q3VzdG9tUGx1Z2lucykge1xuICAgIC8vIEdyYWIgb25lcyBmcm9tIGxvY2Fsc3RvcmFnZVxuICAgIGFjdGl2ZVBsdWdpbnMoKS5mb3JFYWNoKHAgPT4gZG93bmxvYWRQbHVnaW4ocC5pZCwgZmFsc2UpKVxuXG4gICAgLy8gT2ZmZXIgdG8gaW5zdGFsbCBvbmUgaWYgJ2luc3RhbGwtcGx1Z2luJyBpcyBhIHF1ZXJ5IHBhcmFtXG4gICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyhsb2NhdGlvbi5zZWFyY2gpXG4gICAgY29uc3QgcGx1Z2luVG9JbnN0YWxsID0gcGFyYW1zLmdldChcImluc3RhbGwtcGx1Z2luXCIpXG4gICAgaWYgKHBsdWdpblRvSW5zdGFsbCkge1xuICAgICAgY29uc3QgYWxyZWFkeUluc3RhbGxlZCA9IGFjdGl2ZVBsdWdpbnMoKS5maW5kKHAgPT4gcC5pZCA9PT0gcGx1Z2luVG9JbnN0YWxsKVxuICAgICAgaWYgKCFhbHJlYWR5SW5zdGFsbGVkKSB7XG4gICAgICAgIGNvbnN0IHNob3VsZERvSXQgPSBjb25maXJtKFwiV291bGQgeW91IGxpa2UgdG8gaW5zdGFsbCB0aGUgdGhpcmQgcGFydHkgcGx1Z2luP1xcblxcblwiICsgcGx1Z2luVG9JbnN0YWxsKVxuICAgICAgICBpZiAoc2hvdWxkRG9JdCkge1xuICAgICAgICAgIGFkZEN1c3RvbVBsdWdpbihwbHVnaW5Ub0luc3RhbGwpXG4gICAgICAgICAgZG93bmxvYWRQbHVnaW4ocGx1Z2luVG9JbnN0YWxsLCB0cnVlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgW3RzTWFqb3IsIHRzTWlub3JdID0gc2FuZGJveC50cy52ZXJzaW9uLnNwbGl0KFwiLlwiKVxuICBpZiAoXG4gICAgKHBhcnNlSW50KHRzTWFqb3IpID4gNCB8fCAocGFyc2VJbnQodHNNYWpvcikgPT0gNCAmJiBwYXJzZUludCh0c01pbm9yKSA+PSA2KSkgJiZcbiAgICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVySW5sYXlIaW50c1Byb3ZpZGVyXG4gICkge1xuICAgIG1vbmFjby5sYW5ndWFnZXMucmVnaXN0ZXJJbmxheUhpbnRzUHJvdmlkZXIoc2FuZGJveC5sYW5ndWFnZSwgY3JlYXRlVHdvc2xhc2hJbmxheVByb3ZpZGVyKHNhbmRib3gpKVxuICB9XG5cbiAgaWYgKGxvY2F0aW9uLmhhc2guc3RhcnRzV2l0aChcIiNzaG93LWV4YW1wbGVzXCIpKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImV4YW1wbGVzLWJ1dHRvblwiKT8uY2xpY2soKVxuICAgIH0sIDEwMClcbiAgfVxuXG4gIGlmIChsb2NhdGlvbi5oYXNoLnN0YXJ0c1dpdGgoXCIjc2hvdy13aGF0aXNuZXdcIikpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwid2hhdGlzbmV3LWJ1dHRvblwiKT8uY2xpY2soKVxuICAgIH0sIDEwMClcbiAgfVxuXG4gIC8vIEF1dG8tbG9hZCBpbnRvIHRoZSBwbGF5Z3JvdW5kXG4gIGlmIChsb2NhdGlvbi5oYXNoLnN0YXJ0c1dpdGgoXCIjaGFuZGJvb2tcIikpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGFuZGJvb2stYnV0dG9uXCIpPy5jbGljaygpXG4gICAgfSwgMTAwKVxuICB9XG5cbiAgcmV0dXJuIHBsYXlncm91bmRcbn1cblxuZXhwb3J0IHR5cGUgUGxheWdyb3VuZCA9IFJldHVyblR5cGU8dHlwZW9mIHNldHVwUGxheWdyb3VuZD5cblxuY29uc3QgcmVkaXJlY3RUYWJQcmVzc1RvID0gKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjb250YWluZXI6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkLCBxdWVyeTogc3RyaW5nKSA9PiB7XG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiB7XG4gICAgaWYgKGUua2V5ID09PSBcIlRhYlwiKSB7XG4gICAgICBjb25zdCBob3N0ID0gY29udGFpbmVyIHx8IGRvY3VtZW50XG4gICAgICBjb25zdCByZXN1bHQgPSBob3N0LnF1ZXJ5U2VsZWN0b3IocXVlcnkpIGFzIGFueVxuICAgICAgaWYgKCFyZXN1bHQpIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdG8gZmluZCBhIHJlc3VsdCBmb3Iga2V5ZG93bmApXG4gICAgICByZXN1bHQuZm9jdXMoKVxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgfVxuICB9KVxufVxuIl19