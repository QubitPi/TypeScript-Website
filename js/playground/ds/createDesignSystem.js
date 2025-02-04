define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDesignSystem = void 0;
    const el = (str, elementType, container) => {
        const el = document.createElement(elementType);
        el.innerHTML = str;
        container.appendChild(el);
        return el;
    };
    // The Playground Plugin design system
    const createDesignSystem = (sandbox) => {
        const ts = sandbox.ts;
        return (container) => {
            const clear = () => {
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            };
            let decorations = [];
            let decorationLock = false;
            const clearDeltaDecorators = (force) => {
                // console.log(`clearing, ${decorations.length}}`)
                // console.log(sandbox.editor.getModel()?.getAllDecorations())
                if (force) {
                    sandbox.editor.deltaDecorations(decorations, []);
                    decorations = [];
                    decorationLock = false;
                }
                else if (!decorationLock) {
                    sandbox.editor.deltaDecorations(decorations, []);
                    decorations = [];
                }
            };
            /** Lets a HTML Element hover to highlight code in the editor  */
            const addEditorHoverToElement = (element, pos, config) => {
                element.onmouseenter = () => {
                    if (!decorationLock) {
                        const model = sandbox.getModel();
                        const start = model.getPositionAt(pos.start);
                        const end = model.getPositionAt(pos.end);
                        decorations = sandbox.editor.deltaDecorations(decorations, [
                            {
                                range: new sandbox.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                                options: { inlineClassName: "highlight-" + config.type },
                            },
                        ]);
                    }
                };
                element.onmouseleave = () => {
                    clearDeltaDecorators();
                };
            };
            const declareRestartRequired = (i) => {
                if (document.getElementById("restart-required"))
                    return;
                const localize = i || window.i;
                const li = document.createElement("li");
                li.id = "restart-required";
                const a = document.createElement("a");
                a.style.color = "#c63131";
                a.textContent = localize("play_sidebar_options_restart_required");
                a.href = "#";
                a.onclick = () => document.location.reload();
                const nav = document.getElementsByClassName("navbar-right")[0];
                li.appendChild(a);
                nav.insertBefore(li, nav.firstChild);
            };
            const localStorageOption = (setting) => {
                // Think about this as being something which you want enabled by default and can suppress whether
                // it should do something.
                const invertedLogic = setting.emptyImpliesEnabled;
                const li = document.createElement("li");
                const label = document.createElement("label");
                const split = setting.oneline ? "" : "<br/>";
                label.innerHTML = `<span>${setting.display}</span>${split}${setting.blurb}`;
                const key = setting.flag;
                const input = document.createElement("input");
                input.type = "checkbox";
                input.id = key;
                input.checked = invertedLogic ? !localStorage.getItem(key) : !!localStorage.getItem(key);
                input.onchange = () => {
                    if (input.checked) {
                        if (!invertedLogic)
                            localStorage.setItem(key, "true");
                        else
                            localStorage.removeItem(key);
                    }
                    else {
                        if (invertedLogic)
                            localStorage.setItem(key, "true");
                        else
                            localStorage.removeItem(key);
                    }
                    if (setting.onchange) {
                        setting.onchange(!!localStorage.getItem(key));
                    }
                    if (setting.requireRestart) {
                        declareRestartRequired();
                    }
                };
                label.htmlFor = input.id;
                li.appendChild(input);
                li.appendChild(label);
                container.appendChild(li);
                return li;
            };
            const button = (settings) => {
                const join = document.createElement("input");
                join.type = "button";
                join.value = settings.label;
                if (settings.onclick) {
                    join.onclick = settings.onclick;
                }
                container.appendChild(join);
                return join;
            };
            const code = (code) => {
                const createCodePre = document.createElement("pre");
                createCodePre.setAttribute("tabindex", "0");
                const codeElement = document.createElement("code");
                codeElement.innerHTML = code;
                createCodePre.appendChild(codeElement);
                container.appendChild(createCodePre);
                // When <pre> focused, Ctrl+A should select only code pre instead of the entire document
                createCodePre.addEventListener("keydown", e => {
                    if (e.key.toUpperCase() === "A" && (e.ctrlKey || e.metaKey)) {
                        const selection = window.getSelection();
                        if (!selection)
                            return;
                        selection.selectAllChildren(createCodePre);
                        e.preventDefault();
                    }
                });
                return codeElement;
            };
            const showEmptyScreen = (message) => {
                clear();
                const noErrorsMessage = document.createElement("div");
                noErrorsMessage.id = "empty-message-container";
                const messageDiv = document.createElement("div");
                messageDiv.textContent = message;
                messageDiv.classList.add("empty-plugin-message");
                noErrorsMessage.appendChild(messageDiv);
                container.appendChild(noErrorsMessage);
                return noErrorsMessage;
            };
            const createTabBar = () => {
                const tabBar = document.createElement("div");
                tabBar.classList.add("playground-plugin-tabview");
                /** Support left/right in the tab bar for accessibility */
                let tabFocus = 0;
                tabBar.addEventListener("keydown", e => {
                    const tabs = tabBar.querySelectorAll('[role="tab"]');
                    // Move right
                    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        tabs[tabFocus].setAttribute("tabindex", "-1");
                        if (e.key === "ArrowRight") {
                            tabFocus++;
                            // If we're at the end, go to the start
                            if (tabFocus >= tabs.length) {
                                tabFocus = 0;
                            }
                            // Move left
                        }
                        else if (e.key === "ArrowLeft") {
                            tabFocus--;
                            // If we're at the start, move to the end
                            if (tabFocus < 0) {
                                tabFocus = tabs.length - 1;
                            }
                        }
                        tabs[tabFocus].setAttribute("tabindex", "0");
                        tabs[tabFocus].focus();
                    }
                });
                container.appendChild(tabBar);
                return tabBar;
            };
            const createTabButton = (text) => {
                const element = document.createElement("button");
                element.setAttribute("role", "tab");
                element.textContent = text;
                return element;
            };
            const listDiags = (model, diags) => {
                const errorUL = document.createElement("ul");
                errorUL.className = "compiler-diagnostics";
                errorUL.onmouseleave = ev => {
                    clearDeltaDecorators();
                };
                container.appendChild(errorUL);
                diags.forEach(diag => {
                    const li = document.createElement("li");
                    li.classList.add("diagnostic");
                    switch (diag.category) {
                        case 0:
                            li.classList.add("warning");
                            break;
                        case 1:
                            li.classList.add("error");
                            break;
                        case 2:
                            li.classList.add("suggestion");
                            break;
                        case 3:
                            li.classList.add("message");
                            break;
                    }
                    if (typeof diag === "string") {
                        li.textContent = diag;
                    }
                    else {
                        li.textContent = sandbox.ts.flattenDiagnosticMessageText(diag.messageText, "\n", 4);
                    }
                    errorUL.appendChild(li);
                    if (diag.start && diag.length) {
                        addEditorHoverToElement(li, { start: diag.start, end: diag.start + diag.length }, { type: "error" });
                    }
                    li.onclick = () => {
                        if (diag.start && diag.length) {
                            const start = model.getPositionAt(diag.start);
                            sandbox.editor.revealLine(start.lineNumber);
                            const end = model.getPositionAt(diag.start + diag.length);
                            decorations = sandbox.editor.deltaDecorations(decorations, [
                                {
                                    range: new sandbox.monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                                    options: { inlineClassName: "error-highlight", isWholeLine: true },
                                },
                            ]);
                            decorationLock = true;
                            setTimeout(() => {
                                decorationLock = false;
                                sandbox.editor.deltaDecorations(decorations, []);
                            }, 300);
                        }
                    };
                });
                return errorUL;
            };
            const showOptionList = (options, style) => {
                const ol = document.createElement("ol");
                ol.className = style.style === "separated" ? "playground-options" : "playground-options tight";
                options.forEach(option => {
                    if (style.style === "rows")
                        option.oneline = true;
                    if (style.requireRestart)
                        option.requireRestart = true;
                    const settingButton = localStorageOption(option);
                    ol.appendChild(settingButton);
                });
                container.appendChild(ol);
            };
            const createASTTree = (node, settings) => {
                const autoOpen = !settings || !settings.closedByDefault;
                const div = document.createElement("div");
                div.className = "ast";
                const infoForNode = (node) => {
                    const name = ts.SyntaxKind[node.kind];
                    return {
                        name,
                    };
                };
                const renderLiteralField = (key, value, info) => {
                    const li = document.createElement("li");
                    const typeofSpan = `ast-node-${typeof value}`;
                    let suffix = "";
                    if (key === "kind") {
                        suffix = ` (SyntaxKind.${info.name})`;
                    }
                    li.textContent = `${key}: `;
                    const span = document.createElement('span');
                    span.className = typeofSpan;
                    span.textContent = value;
                    li.appendChild(span);
                    li.appendChild(document.createTextNode(suffix));
                    return li;
                };
                const renderSingleChild = (key, value, depth) => {
                    const li = document.createElement("li");
                    li.innerHTML = `${key}: `;
                    renderItem(li, value, depth + 1);
                    return li;
                };
                const renderManyChildren = (key, nodes, depth) => {
                    const children = document.createElement("div");
                    children.classList.add("ast-children");
                    const li = document.createElement("li");
                    li.innerHTML = `${key}: [<br/>`;
                    children.appendChild(li);
                    nodes.forEach(node => {
                        renderItem(children, node, depth + 1);
                    });
                    const liEnd = document.createElement("li");
                    liEnd.innerHTML += "]";
                    children.appendChild(liEnd);
                    return children;
                };
                const renderItem = (parentElement, node, depth) => {
                    const itemDiv = document.createElement("div");
                    parentElement.appendChild(itemDiv);
                    itemDiv.className = "ast-tree-start";
                    itemDiv.attributes.setNamedItem;
                    // @ts-expect-error
                    itemDiv.dataset.pos = node.pos;
                    // @ts-expect-error
                    itemDiv.dataset.end = node.end;
                    // @ts-expect-error
                    itemDiv.dataset.depth = depth;
                    if (depth === 0 && autoOpen)
                        itemDiv.classList.add("open");
                    const info = infoForNode(node);
                    const a = document.createElement("a");
                    a.classList.add("node-name");
                    a.textContent = info.name;
                    itemDiv.appendChild(a);
                    a.onclick = _ => a.parentElement.classList.toggle("open");
                    addEditorHoverToElement(a, { start: node.pos, end: node.end }, { type: "info" });
                    const properties = document.createElement("ul");
                    properties.className = "ast-tree";
                    itemDiv.appendChild(properties);
                    Object.keys(node).forEach(field => {
                        if (typeof field === "function")
                            return;
                        if (field === "parent" || field === "flowNode")
                            return;
                        const value = node[field];
                        if (typeof value === "object" && Array.isArray(value) && value[0] && "pos" in value[0] && "end" in value[0]) {
                            //  Is an array of Nodes
                            properties.appendChild(renderManyChildren(field, value, depth));
                        }
                        else if (typeof value === "object" && "pos" in value && "end" in value) {
                            // Is a single child property
                            properties.appendChild(renderSingleChild(field, value, depth));
                        }
                        else {
                            properties.appendChild(renderLiteralField(field, value, info));
                        }
                    });
                };
                renderItem(div, node, 0);
                container.append(div);
                return div;
            };
            const createTextInput = (config) => {
                const form = document.createElement("form");
                const textbox = document.createElement("input");
                textbox.id = config.id;
                textbox.placeholder = config.placeholder;
                textbox.autocomplete = "off";
                textbox.autocapitalize = "off";
                textbox.spellcheck = false;
                // @ts-ignore
                textbox.autocorrect = "off";
                const localStorageKey = "playground-input-" + config.id;
                if (config.value) {
                    textbox.value = config.value;
                }
                else if (config.keepValueAcrossReloads) {
                    const storedQuery = localStorage.getItem(localStorageKey);
                    if (storedQuery)
                        textbox.value = storedQuery;
                }
                if (config.isEnabled) {
                    const enabled = config.isEnabled(textbox);
                    textbox.classList.add(enabled ? "good" : "bad");
                }
                else {
                    textbox.classList.add("good");
                }
                const textUpdate = (e) => {
                    const href = e.target.value.trim();
                    if (config.keepValueAcrossReloads) {
                        localStorage.setItem(localStorageKey, href);
                    }
                    if (config.onChanged)
                        config.onChanged(e.target.value, textbox);
                };
                textbox.style.width = "90%";
                textbox.style.height = "2rem";
                textbox.addEventListener("input", textUpdate);
                // Suppress the enter key
                textbox.onkeydown = (evt) => {
                    if (evt.key === "Enter" || evt.code === "Enter") {
                        config.onEnter(textbox.value, textbox);
                        return false;
                    }
                };
                form.appendChild(textbox);
                container.appendChild(form);
                return form;
            };
            const createSubDesignSystem = () => {
                const div = document.createElement("div");
                container.appendChild(div);
                const ds = (0, exports.createDesignSystem)(sandbox)(div);
                return ds;
            };
            return {
                /** The element of the design system */
                container,
                /** Clear the sidebar */
                clear,
                /** Present code in a pre > code  */
                code,
                /** Ideally only use this once, and maybe even prefer using subtitles everywhere */
                title: (title) => el(title, "h3", container),
                /** Used to denote sections, give info etc */
                subtitle: (subtitle) => el(subtitle, "h4", container),
                /** Used to show a paragraph */
                p: (subtitle) => el(subtitle, "p", container),
                /** When you can't do something, or have nothing to show */
                showEmptyScreen,
                /**
                 * Shows a list of hoverable, and selectable items (errors, highlights etc) which have code representation.
                 * The type is quite small, so it should be very feasible for you to massage other data to fit into this function
                 */
                listDiags,
                /** Lets you remove the hovers from listDiags etc */
                clearDeltaDecorators,
                /** Shows a single option in local storage (adds an li to the container BTW) */
                localStorageOption,
                /** Uses localStorageOption to create a list of options */
                showOptionList,
                /** Shows a full-width text input */
                createTextInput,
                /** Renders an AST tree */
                createASTTree,
                /** Creates an input button */
                button,
                /** Used to re-create a UI like the tab bar at the top of the plugins section */
                createTabBar,
                /** Used with createTabBar to add buttons */
                createTabButton,
                /** A general "restart your browser" message  */
                declareRestartRequired,
                /** Create a new Design System instance and add it to the container. You'll need to cast
                 * this after usage, because otherwise the type-system circularly references itself
                 */
                createSubDesignSystem,
            };
        };
    };
    exports.createDesignSystem = createDesignSystem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRGVzaWduU3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcGxheWdyb3VuZC9zcmMvZHMvY3JlYXRlRGVzaWduU3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFtQkEsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFXLEVBQUUsV0FBbUIsRUFBRSxTQUFrQixFQUFFLEVBQUU7UUFDbEUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUM5QyxFQUFFLENBQUMsU0FBUyxHQUFHLEdBQUcsQ0FBQTtRQUNsQixTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pCLE9BQU8sRUFBRSxDQUFBO0lBQ1gsQ0FBQyxDQUFBO0lBSUQsc0NBQXNDO0lBQy9CLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxPQUFnQixFQUFFLEVBQUU7UUFDckQsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQTtRQUVyQixPQUFPLENBQUMsU0FBa0IsRUFBRSxFQUFFO1lBQzVCLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRTtnQkFDakIsT0FBTyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQzVCLFNBQVMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO2dCQUM3QyxDQUFDO1lBQ0gsQ0FBQyxDQUFBO1lBQ0QsSUFBSSxXQUFXLEdBQWEsRUFBRSxDQUFBO1lBQzlCLElBQUksY0FBYyxHQUFHLEtBQUssQ0FBQTtZQUUxQixNQUFNLG9CQUFvQixHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUU7Z0JBQzVDLGtEQUFrRDtnQkFDbEQsOERBQThEO2dCQUM5RCxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUNWLE9BQU8sQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO29CQUNoRCxXQUFXLEdB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cUI7YUFDdEIsQ0FBQTtRQUNILENBQUMsQ0FBQTtJQUNILENBQUMsQ0FBQTtJQXJmWSxRQUFBLGtCQUFrQixzQkFxZjlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTYW5kYm94IH0gZnJvbSBcIkB0eXBlc2NyaXB0L3NhbmRib3hcIlxuaW1wb3J0IHR5cGUgeyBEaWFnbm9zdGljUmVsYXRlZEluZm9ybWF0aW9uLCBOb2RlIH0gZnJvbSBcInR5cGVzY3JpcHRcIlxuXG5leHBvcnQgdHlwZSBMb2NhbFN0b3JhZ2VPcHRpb24gPSB7XG4gIGJsdXJiOiBzdHJpbmdcbiAgZmxhZzogc3RyaW5nXG4gIGRpc3BsYXk6IHN0cmluZ1xuXG4gIGVtcHR5SW1wbGllc0VuYWJsZWQ/OiB0cnVlXG4gIG9uZWxpbmU/OiB0cnVlXG4gIHJlcXVpcmVSZXN0YXJ0PzogdHJ1ZVxuICBvbmNoYW5nZT86IChuZXdWYWx1ZTogYm9vbGVhbikgPT4gdm9pZFxufVxuXG5leHBvcnQgdHlwZSBPcHRpb25zTGlzdENvbmZpZyA9IHtcbiAgc3R5bGU6IFwic2VwYXJhdGVkXCIgfCBcInJvd3NcIlxuICByZXF1aXJlUmVzdGFydD86IHRydWVcbn1cblxuY29uc3QgZWwgPSAoc3RyOiBzdHJpbmcsIGVsZW1lbnRUeXBlOiBzdHJpbmcsIGNvbnRhaW5lcjogRWxlbWVudCkgPT4ge1xuICBjb25zdCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudFR5cGUpXG4gIGVsLmlubmVySFRNTCA9IHN0clxuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpXG4gIHJldHVybiBlbFxufVxuXG5leHBvcnQgdHlwZSBEZXNpZ25TeXN0ZW0gPSBSZXR1cm5UeXBlPFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZURlc2lnblN5c3RlbT4+XG5cbi8vIFRoZSBQbGF5Z3JvdW5kIFBsdWdpbiBkZXNpZ24gc3lzdGVtXG5leHBvcnQgY29uc3QgY3JlYXRlRGVzaWduU3lzdGVtID0gKHNhbmRib3g6IFNhbmRib3gpID0+IHtcbiAgY29uc3QgdHMgPSBzYW5kYm94LnRzXG5cbiAgcmV0dXJuIChjb250YWluZXI6IEVsZW1lbnQpID0+IHtcbiAgICBjb25zdCBjbGVhciA9ICgpID0+IHtcbiAgICAgIHdoaWxlIChjb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQoY29udGFpbmVyLmZpcnN0Q2hpbGQpXG4gICAgICB9XG4gICAgfVxuICAgIGxldCBkZWNvcmF0aW9uczogc3RyaW5nW10gPSBbXVxuICAgIGxldCBkZWNvcmF0aW9uTG9jayA9IGZhbHNlXG5cbiAgICBjb25zdCBjbGVhckRlbHRhRGVjb3JhdG9ycyA9IChmb3JjZT86IHRydWUpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGBjbGVhcmluZywgJHtkZWNvcmF0aW9ucy5sZW5ndGh9fWApXG4gICAgICAvLyBjb25zb2xlLmxvZyhzYW5kYm94LmVkaXRvci5nZXRNb2RlbCgpPy5nZXRBbGxEZWNvcmF0aW9ucygpKVxuICAgICAgaWYgKGZvcmNlKSB7XG4gICAgICAgIHNhbmRib3guZWRpdG9yLmRlbHRhRGVjb3JhdGlvbnMoZGVjb3JhdGlvbnMsIFtdKVxuICAgICAgICBkZWNvcmF0aW9ucyA9IFtdXG4gICAgICAgIGRlY29yYXRpb25Mb2NrID0gZmFsc2VcbiAgICAgIH0gZWxzZSBpZiAoIWRlY29yYXRpb25Mb2NrKSB7XG4gICAgICAgIHNhbmRib3guZWRpdG9yLmRlbHRhRGVjb3JhdGlvbnMoZGVjb3JhdGlvbnMsIFtdKVxuICAgICAgICBkZWNvcmF0aW9ucyA9IFtdXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqIExldHMgYSBIVE1MIEVsZW1lbnQgaG92ZXIgdG8gaGlnaGxpZ2h0IGNvZGUgaW4gdGhlIGVkaXRvciAgKi9cbiAgICBjb25zdCBhZGRFZGl0b3JIb3ZlclRvRWxlbWVudCA9IChcbiAgICAgIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgICAgcG9zOiB7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyIH0sXG4gICAgICBjb25maWc6IHsgdHlwZTogXCJlcnJvclwiIHwgXCJpbmZvXCIgfVxuICAgICkgPT4ge1xuICAgICAgZWxlbWVudC5vbm1vdXNlZW50ZXIgPSAoKSA9PiB7XG4gICAgICAgIGlmICghZGVjb3JhdGlvbkxvY2spIHtcbiAgICAgICAgICBjb25zdCBtb2RlbCA9IHNhbmRib3guZ2V0TW9kZWwoKVxuICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gbW9kZWwuZ2V0UG9zaXRpb25BdChwb3Muc3RhcnQpXG4gICAgICAgICAgY29uc3QgZW5kID0gbW9kZWwuZ2V0UG9zaXRpb25BdChwb3MuZW5kKVxuXG4gICAgICAgICAgZGVjb3JhdGlvbnMgPSBzYW5kYm94LmVkaXRvci5kZWx0YURlY29yYXRpb25zKGRlY29yYXRpb25zLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHJhbmdlOiBuZXcgc2FuZGJveC5tb25hY28uUmFuZ2Uoc3RhcnQubGluZU51bWJlciwgc3RhcnQuY29sdW1uLCBlbmQubGluZU51bWJlciwgZW5kLmNvbHVtbiksXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHsgaW5saW5lQ2xhc3NOYW1lOiBcImhpZ2hsaWdodC1cIiArIGNvbmZpZy50eXBlIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZWxlbWVudC5vbm1vdXNlbGVhdmUgPSAoKSA9PiB7XG4gICAgICAgIGNsZWFyRGVsdGFEZWNvcmF0b3JzKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJlUmVzdGFydFJlcXVpcmVkID0gKGk/OiAoa2V5OiBzdHJpbmcpID0+IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVzdGFydC1yZXF1aXJlZFwiKSkgcmV0dXJuXG4gICAgICBjb25zdCBsb2NhbGl6ZSA9IGkgfHwgKHdpbmRvdyBhcyBhbnkpLmlcbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgICBsaS5pZCA9IFwicmVzdGFydC1yZXF1aXJlZFwiXG5cbiAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKVxuICAgICAgYS5zdHlsZS5jb2xvciA9IFwiI2M2MzEzMVwiXG4gICAgICBhLnRleHRDb250ZW50ID0gbG9jYWxpemUoXCJwbGF5X3NpZGViYXJfb3B0aW9uc19yZXN0YXJ0X3JlcXVpcmVkXCIpXG4gICAgICBhLmhyZWYgPSBcIiNcIlxuICAgICAgYS5vbmNsaWNrID0gKCkgPT4gZG9jdW1lbnQubG9jYXRpb24ucmVsb2FkKClcblxuICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIm5hdmJhci1yaWdodFwiKVswXVxuICAgICAgbGkuYXBwZW5kQ2hpbGQoYSlcbiAgICAgIG5hdi5pbnNlcnRCZWZvcmUobGksIG5hdi5maXJzdENoaWxkKVxuICAgIH1cblxuICAgIGNvbnN0IGxvY2FsU3RvcmFnZU9wdGlvbiA9IChzZXR0aW5nOiBMb2NhbFN0b3JhZ2VPcHRpb24pID0+IHtcbiAgICAgIC8vIFRoaW5rIGFib3V0IHRoaXMgYXMgYmVpbmcgc29tZXRoaW5nIHdoaWNoIHlvdSB3YW50IGVuYWJsZWQgYnkgZGVmYXVsdCBhbmQgY2FuIHN1cHByZXNzIHdoZXRoZXJcbiAgICAgIC8vIGl0IHNob3VsZCBkbyBzb21ldGhpbmcuXG4gICAgICBjb25zdCBpbnZlcnRlZExvZ2ljID0gc2V0dGluZy5lbXB0eUltcGxpZXNFbmFibGVkXG5cbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsYWJlbFwiKVxuICAgICAgY29uc3Qgc3BsaXQgPSBzZXR0aW5nLm9uZWxpbmUgPyBcIlwiIDogXCI8YnIvPlwiXG4gICAgICBsYWJlbC5pbm5lckhUTUwgPSBgPHNwYW4+JHtzZXR0aW5nLmRpc3BsYXl9PC9zcGFuPiR7c3BsaXR9JHtzZXR0aW5nLmJsdXJifWBcblxuICAgICAgY29uc3Qga2V5ID0gc2V0dGluZy5mbGFnXG4gICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKVxuICAgICAgaW5wdXQudHlwZSA9IFwiY2hlY2tib3hcIlxuICAgICAgaW5wdXQuaWQgPSBrZXlcblxuICAgICAgaW5wdXQuY2hlY2tlZCA9IGludmVydGVkTG9naWMgPyAhbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSA6ICEhbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KVxuXG4gICAgICBpbnB1dC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGlucHV0LmNoZWNrZWQpIHtcbiAgICAgICAgICBpZiAoIWludmVydGVkTG9naWMpIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgXCJ0cnVlXCIpXG4gICAgICAgICAgZWxzZSBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGludmVydGVkTG9naWMpIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgXCJ0cnVlXCIpXG4gICAgICAgICAgZWxzZSBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2V0dGluZy5vbmNoYW5nZSkge1xuICAgICAgICAgIHNldHRpbmcub25jaGFuZ2UoISFsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpKVxuICAgICAgICB9XG4gICAgICAgIGlmIChzZXR0aW5nLnJlcXVpcmVSZXN0YXJ0KSB7XG4gICAgICAgICAgZGVjbGFyZVJlc3RhcnRSZXF1aXJlZCgpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGFiZWwuaHRtbEZvciA9IGlucHV0LmlkXG5cbiAgICAgIGxpLmFwcGVuZENoaWxkKGlucHV0KVxuICAgICAgbGkuYXBwZW5kQ2hpbGQobGFiZWwpXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobGkpXG4gICAgICByZXR1cm4gbGlcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b24gPSAoc2V0dGluZ3M6IHsgbGFiZWw6IHN0cmluZzsgb25jbGljaz86IChldjogTW91c2VFdmVudCkgPT4gdm9pZCB9KSA9PiB7XG4gICAgICBjb25zdCBqb2luID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpXG4gICAgICBqb2luLnR5cGUgPSBcImJ1dHRvblwiXG4gICAgICBqb2luLnZhbHVlID0gc2V0dGluZ3MubGFiZWxcbiAgICAgIGlmIChzZXR0aW5ncy5vbmNsaWNrKSB7XG4gICAgICAgIGpvaW4ub25jbGljayA9IHNldHRpbmdzLm9uY2xpY2tcbiAgICAgIH1cblxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGpvaW4pXG4gICAgICByZXR1cm4gam9pblxuICAgIH1cblxuICAgIGNvbnN0IGNvZGUgPSAoY29kZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBjcmVhdGVDb2RlUHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKVxuICAgICAgY3JlYXRlQ29kZVByZS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIilcbiAgICAgIGNvbnN0IGNvZGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIilcblxuICAgICAgY29kZUVsZW1lbnQuaW5uZXJIVE1MID0gY29kZVxuXG4gICAgICBjcmVhdGVDb2RlUHJlLmFwcGVuZENoaWxkKGNvZGVFbGVtZW50KVxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGNyZWF0ZUNvZGVQcmUpXG5cbiAgICAgIC8vIFdoZW4gPHByZT4gZm9jdXNlZCwgQ3RybCtBIHNob3VsZCBzZWxlY3Qgb25seSBjb2RlIHByZSBpbnN0ZWFkIG9mIHRoZSBlbnRpcmUgZG9jdW1lbnRcbiAgICAgIGNyZWF0ZUNvZGVQcmUuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiB7XG4gICAgICAgIGlmIChlLmtleS50b1VwcGVyQ2FzZSgpID09PSBcIkFcIiAmJiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpIHtcbiAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgaWYgKCFzZWxlY3Rpb24pIHJldHVybjtcbiAgICAgICAgICBzZWxlY3Rpb24uc2VsZWN0QWxsQ2hpbGRyZW4oY3JlYXRlQ29kZVByZSlcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBjb2RlRWxlbWVudFxuICAgIH1cblxuICAgIGNvbnN0IHNob3dFbXB0eVNjcmVlbiA9IChtZXNzYWdlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNsZWFyKClcblxuICAgICAgY29uc3Qgbm9FcnJvcnNNZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgbm9FcnJvcnNNZXNzYWdlLmlkID0gXCJlbXB0eS1tZXNzYWdlLWNvbnRhaW5lclwiXG5cbiAgICAgIGNvbnN0IG1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBtZXNzYWdlRGl2LnRleHRDb250ZW50ID0gbWVzc2FnZVxuICAgICAgbWVzc2FnZURpdi5jbGFzc0xpc3QuYWRkKFwiZW1wdHktcGx1Z2luLW1lc3NhZ2VcIilcbiAgICAgIG5vRXJyb3JzTWVzc2FnZS5hcHBlbmRDaGlsZChtZXNzYWdlRGl2KVxuXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9FcnJvcnNNZXNzYWdlKVxuICAgICAgcmV0dXJuIG5vRXJyb3JzTWVzc2FnZVxuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0ZVRhYkJhciA9ICgpID0+IHtcbiAgICAgIGNvbnN0IHRhYkJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgIHRhYkJhci5jbGFzc0xpc3QuYWRkKFwicGxheWdyb3VuZC1wbHVnaW4tdGFidmlld1wiKVxuXG4gICAgICAvKiogU3VwcG9ydCBsZWZ0L3JpZ2h0IGluIHRoZSB0YWIgYmFyIGZvciBhY2Nlc3NpYmlsaXR5ICovXG4gICAgICBsZXQgdGFiRm9jdXMgPSAwXG4gICAgICB0YWJCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiB7XG4gICAgICAgIGNvbnN0IHRhYnMgPSB0YWJCYXIucXVlcnlTZWxlY3RvckFsbCgnW3JvbGU9XCJ0YWJcIl0nKVxuICAgICAgICAvLyBNb3ZlIHJpZ2h0XG4gICAgICAgIGlmIChlLmtleSA9PT0gXCJBcnJvd1JpZ2h0XCIgfHwgZS5rZXkgPT09IFwiQXJyb3dMZWZ0XCIpIHtcbiAgICAgICAgICB0YWJzW3RhYkZvY3VzXS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIi0xXCIpXG4gICAgICAgICAgaWYgKGUua2V5ID09PSBcIkFycm93UmlnaHRcIikge1xuICAgICAgICAgICAgdGFiRm9jdXMrK1xuICAgICAgICAgICAgLy8gSWYgd2UncmUgYXQgdGhlIGVuZCwgZ28gdG8gdGhlIHN0YXJ0XG4gICAgICAgICAgICBpZiAodGFiRm9jdXMgPj0gdGFicy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgdGFiRm9jdXMgPSAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBNb3ZlIGxlZnRcbiAgICAgICAgICB9IGVsc2UgaWYgKGUua2V5ID09PSBcIkFycm93TGVmdFwiKSB7XG4gICAgICAgICAgICB0YWJGb2N1cy0tXG4gICAgICAgICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgc3RhcnQsIG1vdmUgdG8gdGhlIGVuZFxuICAgICAgICAgICAgaWYgKHRhYkZvY3VzIDwgMCkge1xuICAgICAgICAgICAgICB0YWJGb2N1cyA9IHRhYnMubGVuZ3RoIC0gMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRhYnNbdGFiRm9jdXNdLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKVxuICAgICAgICAgIDsodGFic1t0YWJGb2N1c10gYXMgYW55KS5mb2N1cygpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0YWJCYXIpXG4gICAgICByZXR1cm4gdGFiQmFyXG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRlVGFiQnV0dG9uID0gKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIilcbiAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInRhYlwiKVxuICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHRleHRcbiAgICAgIHJldHVybiBlbGVtZW50XG4gICAgfVxuXG4gICAgY29uc3QgbGlzdERpYWdzID0gKG1vZGVsOiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmVkaXRvci5JVGV4dE1vZGVsLCBkaWFnczogRGlhZ25vc3RpY1JlbGF0ZWRJbmZvcm1hdGlvbltdKSA9PiB7XG4gICAgICBjb25zdCBlcnJvclVMID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpXG4gICAgICBlcnJvclVMLmNsYXNzTmFtZSA9IFwiY29tcGlsZXItZGlhZ25vc3RpY3NcIlxuICAgICAgZXJyb3JVTC5vbm1vdXNlbGVhdmUgPSBldiA9PiB7XG4gICAgICAgIGNsZWFyRGVsdGFEZWNvcmF0b3JzKClcbiAgICAgIH1cbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlcnJvclVMKVxuXG4gICAgICBkaWFncy5mb3JFYWNoKGRpYWcgPT4ge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgICBsaS5jbGFzc0xpc3QuYWRkKFwiZGlhZ25vc3RpY1wiKVxuICAgICAgICBzd2l0Y2ggKGRpYWcuY2F0ZWdvcnkpIHtcbiAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICBsaS5jbGFzc0xpc3QuYWRkKFwid2FybmluZ1wiKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBsaS5jbGFzc0xpc3QuYWRkKFwiZXJyb3JcIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgbGkuY2xhc3NMaXN0LmFkZChcInN1Z2dlc3Rpb25cIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgbGkuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VcIilcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGRpYWcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBsaS50ZXh0Q29udGVudCA9IGRpYWdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaS50ZXh0Q29udGVudCA9IHNhbmRib3gudHMuZmxhdHRlbkRpYWdub3N0aWNNZXNzYWdlVGV4dChkaWFnLm1lc3NhZ2VUZXh0LCBcIlxcblwiLCA0KVxuICAgICAgICB9XG4gICAgICAgIGVycm9yVUwuYXBwZW5kQ2hpbGQobGkpXG5cbiAgICAgICAgaWYgKGRpYWcuc3RhcnQgJiYgZGlhZy5sZW5ndGgpIHtcbiAgICAgICAgICBhZGRFZGl0b3JIb3ZlclRvRWxlbWVudChsaSwgeyBzdGFydDogZGlhZy5zdGFydCwgZW5kOiBkaWFnLnN0YXJ0ICsgZGlhZy5sZW5ndGggfSwgeyB0eXBlOiBcImVycm9yXCIgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGxpLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgaWYgKGRpYWcuc3RhcnQgJiYgZGlhZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gbW9kZWwuZ2V0UG9zaXRpb25BdChkaWFnLnN0YXJ0KVxuICAgICAgICAgICAgc2FuZGJveC5lZGl0b3IucmV2ZWFsTGluZShzdGFydC5saW5lTnVtYmVyKVxuXG4gICAgICAgICAgICBjb25zdCBlbmQgPSBtb2RlbC5nZXRQb3NpdGlvbkF0KGRpYWcuc3RhcnQgKyBkaWFnLmxlbmd0aClcbiAgICAgICAgICAgIGRlY29yYXRpb25zID0gc2FuZGJveC5lZGl0b3IuZGVsdGFEZWNvcmF0aW9ucyhkZWNvcmF0aW9ucywgW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IG5ldyBzYW5kYm94Lm1vbmFjby5SYW5nZShzdGFydC5saW5lTnVtYmVyLCBzdGFydC5jb2x1bW4sIGVuZC5saW5lTnVtYmVyLCBlbmQuY29sdW1uKSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7IGlubGluZUNsYXNzTmFtZTogXCJlcnJvci1oaWdobGlnaHRcIiwgaXNXaG9sZUxpbmU6IHRydWUgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0pXG5cbiAgICAgICAgICAgIGRlY29yYXRpb25Mb2NrID0gdHJ1ZVxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIGRlY29yYXRpb25Mb2NrID0gZmFsc2VcbiAgICAgICAgICAgICAgc2FuZGJveC5lZGl0b3IuZGVsdGFEZWNvcmF0aW9ucyhkZWNvcmF0aW9ucywgW10pXG4gICAgICAgICAgICB9LCAzMDApXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgcmV0dXJuIGVycm9yVUxcbiAgICB9XG5cbiAgICBjb25zdCBzaG93T3B0aW9uTGlzdCA9IChvcHRpb25zOiBMb2NhbFN0b3JhZ2VPcHRpb25bXSwgc3R5bGU6IE9wdGlvbnNMaXN0Q29uZmlnKSA9PiB7XG4gICAgICBjb25zdCBvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvbFwiKVxuICAgICAgb2wuY2xhc3NOYW1lID0gc3R5bGUuc3R5bGUgPT09IFwic2VwYXJhdGVkXCIgPyBcInBsYXlncm91bmQtb3B0aW9uc1wiIDogXCJwbGF5Z3JvdW5kLW9wdGlvbnMgdGlnaHRcIlxuXG4gICAgICBvcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlID09PSBcInJvd3NcIikgb3B0aW9uLm9uZWxpbmUgPSB0cnVlXG4gICAgICAgIGlmIChzdHlsZS5yZXF1aXJlUmVzdGFydCkgb3B0aW9uLnJlcXVpcmVSZXN0YXJ0ID0gdHJ1ZVxuXG4gICAgICAgIGNvbnN0IHNldHRpbmdCdXR0b24gPSBsb2NhbFN0b3JhZ2VPcHRpb24ob3B0aW9uKVxuICAgICAgICBvbC5hcHBlbmRDaGlsZChzZXR0aW5nQnV0dG9uKVxuICAgICAgfSlcblxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG9sKVxuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0ZUFTVFRyZWUgPSAobm9kZTogTm9kZSwgc2V0dGluZ3M/OiB7IGNsb3NlZEJ5RGVmYXVsdD86IHRydWUgfSkgPT4ge1xuICAgICAgY29uc3QgYXV0b09wZW4gPSAhc2V0dGluZ3MgfHwgIXNldHRpbmdzLmNsb3NlZEJ5RGVmYXVsdFxuXG4gICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBkaXYuY2xhc3NOYW1lID0gXCJhc3RcIlxuXG4gICAgICBjb25zdCBpbmZvRm9yTm9kZSA9IChub2RlOiBOb2RlKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSB0cy5TeW50YXhLaW5kW25vZGUua2luZF1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWUsXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdHlwZSBOb2RlSW5mbyA9IFJldHVyblR5cGU8dHlwZW9mIGluZm9Gb3JOb2RlPlxuXG4gICAgICBjb25zdCByZW5kZXJMaXRlcmFsRmllbGQgPSAoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIGluZm86IE5vZGVJbmZvKSA9PiB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgICAgIGNvbnN0IHR5cGVvZlNwYW4gPSBgYXN0LW5vZGUtJHt0eXBlb2YgdmFsdWV9YFxuICAgICAgICBsZXQgc3VmZml4ID0gXCJcIlxuICAgICAgICBpZiAoa2V5ID09PSBcImtpbmRcIikge1xuICAgICAgICAgIHN1ZmZpeCA9IGAgKFN5bnRheEtpbmQuJHtpbmZvLm5hbWV9KWBcbiAgICAgICAgfVxuICAgICAgICBsaS50ZXh0Q29udGVudCA9IGAke2tleX06IGA7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uY2xhc3NOYW1lID0gdHlwZW9mU3BhbjtcbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgICAgICBsaS5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3VmZml4KSk7XG4gICAgICAgIHJldHVybiBsaVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZW5kZXJTaW5nbGVDaGlsZCA9IChrZXk6IHN0cmluZywgdmFsdWU6IE5vZGUsIGRlcHRoOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIilcbiAgICAgICAgbGkuaW5uZXJIVE1MID0gYCR7a2V5fTogYFxuXG4gICAgICAgIHJlbmRlckl0ZW0obGksIHZhbHVlLCBkZXB0aCArIDEpXG4gICAgICAgIHJldHVybiBsaVxuICAgICAgfVxuXG4gICAgICBjb25zdCByZW5kZXJNYW55Q2hpbGRyZW4gPSAoa2V5OiBzdHJpbmcsIG5vZGVzOiBOb2RlW10sIGRlcHRoOiBudW1iZXIpID0+IHtcbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICAgIGNoaWxkcmVuLmNsYXNzTGlzdC5hZGQoXCJhc3QtY2hpbGRyZW5cIilcblxuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgICBsaS5pbm5lckhUTUwgPSBgJHtrZXl9OiBbPGJyLz5gXG4gICAgICAgIGNoaWxkcmVuLmFwcGVuZENoaWxkKGxpKVxuXG4gICAgICAgIG5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgICAgcmVuZGVySXRlbShjaGlsZHJlbiwgbm9kZSwgZGVwdGggKyAxKVxuICAgICAgICB9KVxuXG4gICAgICAgIGNvbnN0IGxpRW5kID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgICAgIGxpRW5kLmlubmVySFRNTCArPSBcIl1cIlxuICAgICAgICBjaGlsZHJlbi5hcHBlbmRDaGlsZChsaUVuZClcbiAgICAgICAgcmV0dXJuIGNoaWxkcmVuXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlbmRlckl0ZW0gPSAocGFyZW50RWxlbWVudDogRWxlbWVudCwgbm9kZTogTm9kZSwgZGVwdGg6IG51bWJlcikgPT4ge1xuICAgICAgICBjb25zdCBpdGVtRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgICBwYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKGl0ZW1EaXYpXG4gICAgICAgIGl0ZW1EaXYuY2xhc3NOYW1lID0gXCJhc3QtdHJlZS1zdGFydFwiXG4gICAgICAgIGl0ZW1EaXYuYXR0cmlidXRlcy5zZXROYW1lZEl0ZW1cbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICBpdGVtRGl2LmRhdGFzZXQucG9zID0gbm9kZS5wb3NcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICBpdGVtRGl2LmRhdGFzZXQuZW5kID0gbm9kZS5lbmRcbiAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgICAgICBpdGVtRGl2LmRhdGFzZXQuZGVwdGggPSBkZXB0aFxuXG4gICAgICAgIGlmIChkZXB0aCA9PT0gMCAmJiBhdXRvT3BlbikgaXRlbURpdi5jbGFzc0xpc3QuYWRkKFwib3BlblwiKVxuXG4gICAgICAgIGNvbnN0IGluZm8gPSBpbmZvRm9yTm9kZShub2RlKVxuXG4gICAgICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKVxuICAgICAgICBhLmNsYXNzTGlzdC5hZGQoXCJub2RlLW5hbWVcIilcbiAgICAgICAgYS50ZXh0Q29udGVudCA9IGluZm8ubmFtZVxuICAgICAgICBpdGVtRGl2LmFwcGVuZENoaWxkKGEpXG4gICAgICAgIGEub25jbGljayA9IF8gPT4gYS5wYXJlbnRFbGVtZW50IS5jbGFzc0xpc3QudG9nZ2xlKFwib3BlblwiKVxuICAgICAgICBhZGRFZGl0b3JIb3ZlclRvRWxlbWVudChhLCB7IHN0YXJ0OiBub2RlLnBvcywgZW5kOiBub2RlLmVuZCB9LCB7IHR5cGU6IFwiaW5mb1wiIH0pXG5cbiAgICAgICAgY29uc3QgcHJvcGVydGllcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKVxuICAgICAgICBwcm9wZXJ0aWVzLmNsYXNzTmFtZSA9IFwiYXN0LXRyZWVcIlxuICAgICAgICBpdGVtRGl2LmFwcGVuZENoaWxkKHByb3BlcnRpZXMpXG5cbiAgICAgICAgT2JqZWN0LmtleXMobm9kZSkuZm9yRWFjaChmaWVsZCA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBmaWVsZCA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm5cbiAgICAgICAgICBpZiAoZmllbGQgPT09IFwicGFyZW50XCIgfHwgZmllbGQgPT09IFwiZmxvd05vZGVcIikgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IChub2RlIGFzIGFueSlbZmllbGRdXG4gICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZVswXSAmJiBcInBvc1wiIGluIHZhbHVlWzBdICYmIFwiZW5kXCIgaW4gdmFsdWVbMF0pIHtcbiAgICAgICAgICAgIC8vICBJcyBhbiBhcnJheSBvZiBOb2Rlc1xuICAgICAgICAgICAgcHJvcGVydGllcy5hcHBlbmRDaGlsZChyZW5kZXJNYW55Q2hpbGRyZW4oZmllbGQsIHZhbHVlLCBkZXB0aCkpXG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgXCJwb3NcIiBpbiB2YWx1ZSAmJiBcImVuZFwiIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAvLyBJcyBhIHNpbmdsZSBjaGlsZCBwcm9wZXJ0eVxuICAgICAgICAgICAgcHJvcGVydGllcy5hcHBlbmRDaGlsZChyZW5kZXJTaW5nbGVDaGlsZChmaWVsZCwgdmFsdWUsIGRlcHRoKSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvcGVydGllcy5hcHBlbmRDaGlsZChyZW5kZXJMaXRlcmFsRmllbGQoZmllbGQsIHZhbHVlLCBpbmZvKSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHJlbmRlckl0ZW0oZGl2LCBub2RlLCAwKVxuICAgICAgY29udGFpbmVyLmFwcGVuZChkaXYpXG4gICAgICByZXR1cm4gZGl2XG4gICAgfVxuXG4gICAgdHlwZSBUZXh0SW5wdXRDb25maWcgPSB7XG4gICAgICBpZDogc3RyaW5nXG4gICAgICBwbGFjZWhvbGRlcjogc3RyaW5nXG5cbiAgICAgIG9uQ2hhbmdlZD86ICh0ZXh0OiBzdHJpbmcsIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50KSA9PiB2b2lkXG4gICAgICBvbkVudGVyOiAodGV4dDogc3RyaW5nLCBpbnB1dDogSFRNTElucHV0RWxlbWVudCkgPT4gdm9pZFxuXG4gICAgICB2YWx1ZT86IHN0cmluZ1xuICAgICAga2VlcFZhbHVlQWNyb3NzUmVsb2Fkcz86IHRydWVcbiAgICAgIGlzRW5hYmxlZD86IChpbnB1dDogSFRNTElucHV0RWxlbWVudCkgPT4gYm9vbGVhblxuICAgIH1cblxuICAgIGNvbnN0IGNyZWF0ZVRleHRJbnB1dCA9IChjb25maWc6IFRleHRJbnB1dENvbmZpZykgPT4ge1xuICAgICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJmb3JtXCIpXG5cbiAgICAgIGNvbnN0IHRleHRib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIilcbiAgICAgIHRleHRib3guaWQgPSBjb25maWcuaWRcbiAgICAgIHRleHRib3gucGxhY2Vob2xkZXIgPSBjb25maWcucGxhY2Vob2xkZXJcbiAgICAgIHRleHRib3guYXV0b2NvbXBsZXRlID0gXCJvZmZcIlxuICAgICAgdGV4dGJveC5hdXRvY2FwaXRhbGl6ZSA9IFwib2ZmXCJcbiAgICAgIHRleHRib3guc3BlbGxjaGVjayA9IGZhbHNlXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0ZXh0Ym94LmF1dG9jb3JyZWN0ID0gXCJvZmZcIlxuXG4gICAgICBjb25zdCBsb2NhbFN0b3JhZ2VLZXkgPSBcInBsYXlncm91bmQtaW5wdXQtXCIgKyBjb25maWcuaWRcblxuICAgICAgaWYgKGNvbmZpZy52YWx1ZSkge1xuICAgICAgICB0ZXh0Ym94LnZhbHVlID0gY29uZmlnLnZhbHVlXG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5rZWVwVmFsdWVBY3Jvc3NSZWxvYWRzKSB7XG4gICAgICAgIGNvbnN0IHN0b3JlZFF1ZXJ5ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0obG9jYWxTdG9yYWdlS2V5KVxuICAgICAgICBpZiAoc3RvcmVkUXVlcnkpIHRleHRib3gudmFsdWUgPSBzdG9yZWRRdWVyeVxuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmlzRW5hYmxlZCkge1xuICAgICAgICBjb25zdCBlbmFibGVkID0gY29uZmlnLmlzRW5hYmxlZCh0ZXh0Ym94KVxuICAgICAgICB0ZXh0Ym94LmNsYXNzTGlzdC5hZGQoZW5hYmxlZCA/IFwiZ29vZFwiIDogXCJiYWRcIilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHRib3guY2xhc3NMaXN0LmFkZChcImdvb2RcIilcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGV4dFVwZGF0ZSA9IChlOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgaHJlZiA9IGUudGFyZ2V0LnZhbHVlLnRyaW0oKVxuICAgICAgICBpZiAoY29uZmlnLmtlZXBWYWx1ZUFjcm9zc1JlbG9hZHMpIHtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShsb2NhbFN0b3JhZ2VLZXksIGhyZWYpXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbmZpZy5vbkNoYW5nZWQpIGNvbmZpZy5vbkNoYW5nZWQoZS50YXJnZXQudmFsdWUsIHRleHRib3gpXG4gICAgICB9XG5cbiAgICAgIHRleHRib3guc3R5bGUud2lkdGggPSBcIjkwJVwiXG4gICAgICB0ZXh0Ym94LnN0eWxlLmhlaWdodCA9IFwiMnJlbVwiXG4gICAgICB0ZXh0Ym94LmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCB0ZXh0VXBkYXRlKVxuXG4gICAgICAvLyBTdXBwcmVzcyB0aGUgZW50ZXIga2V5XG4gICAgICB0ZXh0Ym94Lm9ua2V5ZG93biA9IChldnQ6IEtleWJvYXJkRXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2dC5rZXkgPT09IFwiRW50ZXJcIiB8fCBldnQuY29kZSA9PT0gXCJFbnRlclwiKSB7XG4gICAgICAgICAgY29uZmlnLm9uRW50ZXIodGV4dGJveC52YWx1ZSwgdGV4dGJveClcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3JtLmFwcGVuZENoaWxkKHRleHRib3gpXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZm9ybSlcbiAgICAgIHJldHVybiBmb3JtXG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRlU3ViRGVzaWduU3lzdGVtID0gKCk6IGFueSA9PiB7XG4gICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZGl2KVxuICAgICAgY29uc3QgZHMgPSBjcmVhdGVEZXNpZ25TeXN0ZW0oc2FuZGJveCkoZGl2KVxuICAgICAgcmV0dXJuIGRzXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8qKiBUaGUgZWxlbWVudCBvZiB0aGUgZGVzaWduIHN5c3RlbSAqL1xuICAgICAgY29udGFpbmVyLFxuICAgICAgLyoqIENsZWFyIHRoZSBzaWRlYmFyICovXG4gICAgICBjbGVhcixcbiAgICAgIC8qKiBQcmVzZW50IGNvZGUgaW4gYSBwcmUgPiBjb2RlICAqL1xuICAgICAgY29kZSxcbiAgICAgIC8qKiBJZGVhbGx5IG9ubHkgdXNlIHRoaXMgb25jZSwgYW5kIG1heWJlIGV2ZW4gcHJlZmVyIHVzaW5nIHN1YnRpdGxlcyBldmVyeXdoZXJlICovXG4gICAgICB0aXRsZTogKHRpdGxlOiBzdHJpbmcpID0+IGVsKHRpdGxlLCBcImgzXCIsIGNvbnRhaW5lciksXG4gICAgICAvKiogVXNlZCB0byBkZW5vdGUgc2VjdGlvbnMsIGdpdmUgaW5mbyBldGMgKi9cbiAgICAgIHN1YnRpdGxlOiAoc3VidGl0bGU6IHN0cmluZykgPT4gZWwoc3VidGl0bGUsIFwiaDRcIiwgY29udGFpbmVyKSxcbiAgICAgIC8qKiBVc2VkIHRvIHNob3cgYSBwYXJhZ3JhcGggKi9cbiAgICAgIHA6IChzdWJ0aXRsZTogc3RyaW5nKSA9PiBlbChzdWJ0aXRsZSwgXCJwXCIsIGNvbnRhaW5lciksXG4gICAgICAvKiogV2hlbiB5b3UgY2FuJ3QgZG8gc29tZXRoaW5nLCBvciBoYXZlIG5vdGhpbmcgdG8gc2hvdyAqL1xuICAgICAgc2hvd0VtcHR5U2NyZWVuLFxuICAgICAgLyoqXG4gICAgICAgKiBTaG93cyBhIGxpc3Qgb2YgaG92ZXJhYmxlLCBhbmQgc2VsZWN0YWJsZSBpdGVtcyAoZXJyb3JzLCBoaWdobGlnaHRzIGV0Yykgd2hpY2ggaGF2ZSBjb2RlIHJlcHJlc2VudGF0aW9uLlxuICAgICAgICogVGhlIHR5cGUgaXMgcXVpdGUgc21hbGwsIHNvIGl0IHNob3VsZCBiZSB2ZXJ5IGZlYXNpYmxlIGZvciB5b3UgdG8gbWFzc2FnZSBvdGhlciBkYXRhIHRvIGZpdCBpbnRvIHRoaXMgZnVuY3Rpb25cbiAgICAgICAqL1xuICAgICAgbGlzdERpYWdzLFxuICAgICAgLyoqIExldHMgeW91IHJlbW92ZSB0aGUgaG92ZXJzIGZyb20gbGlzdERpYWdzIGV0YyAqL1xuICAgICAgY2xlYXJEZWx0YURlY29yYXRvcnMsXG4gICAgICAvKiogU2hvd3MgYSBzaW5nbGUgb3B0aW9uIGluIGxvY2FsIHN0b3JhZ2UgKGFkZHMgYW4gbGkgdG8gdGhlIGNvbnRhaW5lciBCVFcpICovXG4gICAgICBsb2NhbFN0b3JhZ2VPcHRpb24sXG4gICAgICAvKiogVXNlcyBsb2NhbFN0b3JhZ2VPcHRpb24gdG8gY3JlYXRlIGEgbGlzdCBvZiBvcHRpb25zICovXG4gICAgICBzaG93T3B0aW9uTGlzdCxcbiAgICAgIC8qKiBTaG93cyBhIGZ1bGwtd2lkdGggdGV4dCBpbnB1dCAqL1xuICAgICAgY3JlYXRlVGV4dElucHV0LFxuICAgICAgLyoqIFJlbmRlcnMgYW4gQVNUIHRyZWUgKi9cbiAgICAgIGNyZWF0ZUFTVFRyZWUsXG4gICAgICAvKiogQ3JlYXRlcyBhbiBpbnB1dCBidXR0b24gKi9cbiAgICAgIGJ1dHRvbixcbiAgICAgIC8qKiBVc2VkIHRvIHJlLWNyZWF0ZSBhIFVJIGxpa2UgdGhlIHRhYiBiYXIgYXQgdGhlIHRvcCBvZiB0aGUgcGx1Z2lucyBzZWN0aW9uICovXG4gICAgICBjcmVhdGVUYWJCYXIsXG4gICAgICAvKiogVXNlZCB3aXRoIGNyZWF0ZVRhYkJhciB0byBhZGQgYnV0dG9ucyAqL1xuICAgICAgY3JlYXRlVGFiQnV0dG9uLFxuICAgICAgLyoqIEEgZ2VuZXJhbCBcInJlc3RhcnQgeW91ciBicm93c2VyXCIgbWVzc2FnZSAgKi9cbiAgICAgIGRlY2xhcmVSZXN0YXJ0UmVxdWlyZWQsXG4gICAgICAvKiogQ3JlYXRlIGEgbmV3IERlc2lnbiBTeXN0ZW0gaW5zdGFuY2UgYW5kIGFkZCBpdCB0byB0aGUgY29udGFpbmVyLiBZb3UnbGwgbmVlZCB0byBjYXN0XG4gICAgICAgKiB0aGlzIGFmdGVyIHVzYWdlLCBiZWNhdXNlIG90aGVyd2lzZSB0aGUgdHlwZS1zeXN0ZW0gY2lyY3VsYXJseSByZWZlcmVuY2VzIGl0c2VsZlxuICAgICAgICovXG4gICAgICBjcmVhdGVTdWJEZXNpZ25TeXN0ZW0sXG4gICAgfVxuICB9XG59XG4iXX0=