define(["require", "exports", "../createUI", "../localizeWithFallback"], function (require, exports, createUI_1, localizeWithFallback_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runWithCustomLogs = exports.clearLogs = exports.runPlugin = void 0;
    let allLogs = [];
    let addedClearAction = false;
    const cancelButtonSVG = `
<svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="6" cy="7" r="5" stroke-width="2"/>
<line x1="0.707107" y1="1.29289" x2="11.7071" y2="12.2929" stroke-width="2"/>
</svg>
`;
    const runPlugin = (i, utils) => {
        const plugin = {
            id: "logs",
            displayName: i("play_sidebar_logs"),
            willMount: (sandbox, container) => {
                const ui = (0, createUI_1.createUI)();
                const clearLogsAction = {
                    id: "clear-logs-play",
                    label: "Clear Playground Logs",
                    keybindings: [sandbox.monaco.KeyMod.CtrlCmd | sandbox.monaco.KeyCode.KeyK],
                    contextMenuGroupId: "run",
                    contextMenuOrder: 1.5,
                    run: function () {
                        (0, exports.clearLogs)();
                        ui.flashInfo(i("play_clear_logs"));
                    },
                };
                if (!addedClearAction) {
                    sandbox.editor.addAction(clearLogsAction);
                    addedClearAction = true;
                }
                const errorUL = document.createElement("div");
                errorUL.id = "log-container";
                container.appendChild(errorUL);
                const logs = document.createElement("div");
                logs.id = "log";
                logs.innerHTML = allLogs.join("<hr />");
                errorUL.appendChild(logs);
                const logToolsContainer = document.createElement("div");
                logToolsContainer.id = "log-tools";
                container.appendChild(logToolsContainer);
                const clearLogsButton = document.createElement("div");
                clearLogsButton.id = "clear-logs-button";
                clearLogsButton.innerHTML = cancelButtonSVG;
                clearLogsButton.onclick = e => {
                    e.preventDefault();
                    clearLogsAction.run();
                    const filterTextBox = document.getElementById("filter-logs");
                    filterTextBox.value = "";
                };
                logToolsContainer.appendChild(clearLogsButton);
                const filterTextBox = document.createElement("input");
                filterTextBox.id = "filter-logs";
                filterTextBox.placeholder = i("play_sidebar_tools_filter_placeholder");
                filterTextBox.addEventListener("input", (e) => {
                    const inputText = e.target.value;
                    const eleLog = document.getElementById("log");
                    eleLog.innerHTML = allLogs
                        .filter(log => {
                        const userLoggedText = log.substring(log.indexOf(":") + 1, log.indexOf("&nbsp;<br>"));
                        return userLoggedText.includes(inputText);
                    })
                        .join("<hr />");
                    if (inputText === "") {
                        const logContainer = document.getElementById("log-container");
                        logContainer.scrollTop = logContainer.scrollHeight;
                    }
                });
                logToolsContainer.appendChild(filterTextBox);
                if (allLogs.length === 0) {
                    const noErrorsMessage = document.createElement("div");
                    noErrorsMessage.id = "empty-message-container";
                    container.appendChild(noErrorsMessage);
                    const message = document.createElement("div");
                    message.textContent = (0, localizeWithFallback_1.localize)("play_sidebar_logs_no_logs", "No logs");
                    message.classList.add("empty-plugin-message");
                    noErrorsMessage.appendChild(message);
                    errorUL.style.display = "none";
                    logToolsContainer.style.display = "none";
                }
            },
        };
        return plugin;
    };
    exports.runPlugin = runPlugin;
    const clearLogs = () => {
        allLogs = [];
        const logs = document.getElementById("log");
        if (logs) {
            logs.textContent = "";
        }
    };
    exports.clearLogs = clearLogs;
    const runWithCustomLogs = (closure, i) => {
        const noLogs = document.getElementById("empty-message-container");
        const logContainer = document.getElementById("log-container");
        const logToolsContainer = document.getElementById("log-tools");
        if (noLogs) {
            noLogs.style.display = "none";
            logContainer.style.display = "block";
            logToolsContainer.style.display = "flex";
        }
        rewireLoggingToElement(() => document.getElementById("log"), () => document.getElementById("log-container"), closure, true, i);
    };
    exports.runWithCustomLogs = runWithCustomLogs;
    // Thanks SO: https://stackoverflow.com/questions/20256760/javascript-console-log-to-html/35449256#35449256
    function rewireLoggingToElement(eleLocator, eleOverflowLocator, closure, autoScroll, i) {
        const rawConsole = console;
        closure.then(js => {
            const replace = {};
            bindLoggingFunc(replace, rawConsole, "log", "LOG");
            bindLoggingFunc(replace, rawConsole, "debug", "DBG");
            bindLoggingFunc(replace, rawConsole, "info", "INF");
            bindLoggingFunc(replace, rawConsole, "warn", "WRN");
            bindLoggingFunc(replace, rawConsole, "error", "ERR");
            replace["clear"] = exports.clearLogs;
            const console = Object.assign({}, rawConsole, replace);
            try {
                const safeJS = sanitizeJS(js);
                eval(safeJS);
            }
            catch (error) {
                console.error(i("play_run_js_fail"));
                console.error(error);
                if (error instanceof SyntaxError && /\bexport\b/u.test(error.message)) {
                    console.warn('Tip: Change the Module setting to "CommonJS" in TS Config settings to allow top-level exports to work in the Playground');
                }
            }
        });
        function bindLoggingFunc(obj, raw, name, id) {
            obj[name] = function (...objs) {
                const output = produceOutput(objs);
                const eleLog = eleLocator();
                const prefix = `[<span class="log-${name}">${id}</span>]: `;
                const eleContainerLog = eleOverflowLocator();
                allLogs.push(`${prefix}${output}<br>`);
                eleLog.innerHTML = allLogs.join("<hr />");
                if (autoScroll && eleContainerLog) {
                    eleContainerLog.scrollTop = eleContainerLog.scrollHeight;
                }
                raw[name](...objs);
            };
        }
        // Inline constants which are switched out at the end of processing
        const replacers = {
            "<span class='literal'>null</span>": "1231232131231231423434534534",
            "<span class='literal'>undefined</span>": "4534534534563567567567",
            "<span class='comma'>, </span>": "785y8345873485763874568734y535438",
        };
        const objectToText = (arg) => {
            const isObj = typeof arg === "object";
            let textRep = "";
            if (arg && arg.stack && arg.message) {
                // special case for err
                textRep = htmlEscape(arg.message);
            }
            else if (arg === null) {
                textRep = replacers["<span class='literal'>null</span>"];
            }
            else if (arg === undefined) {
                textRep = replacers["<span class='literal'>undefined</span>"];
            }
            else if (typeof arg === "symbol") {
                textRep = `<span class='literal'>${htmlEscape(String(arg))}</span>`;
            }
            else if (Array.isArray(arg)) {
                textRep = "[" + arg.map(objectToText).join(replacers["<span class='comma'>, </span>"]) + "]";
            }
            else if (arg instanceof Set) {
                const setIter = [...arg];
                textRep = `Set (${arg.size}) {` + setIter.map(objectToText).join(replacers["<span class='comma'>, </span>"]) + "}";
            }
            else if (arg instanceof Map) {
                const mapIter = [...arg.entries()];
                textRep =
                    `Map (${arg.size}) {` +
                        mapIter
                            .map(([k, v]) => `${objectToText(k)} => ${objectToText(v)}`)
                            .join(replacers["<span class='comma'>, </span>"]) +
                        "}";
            }
            else if (typeof arg === "string") {
                textRep = '"' + htmlEscape(arg) + '"';
            }
            else if (isObj) {
                const name = arg.constructor && arg.constructor.name || "";
                // No one needs to know an obj is an obj
                const nameWithoutObject = name && name === "Object" ? "" : htmlEscape(name);
                const prefix = nameWithoutObject ? `${nameWithoutObject}: ` : "";
                textRep =
                    prefix +
                        JSON.stringify(arg, (_, value) => {
                            // JSON.stringify omits any keys with a value of undefined. To get around this, we replace undefined with the text __undefined__ and then do a global replace using regex back to keyword undefined
                            if (value === undefined)
                                return "__undefined__";
                            if (typeof value === 'bigint')
                                return `BigInt('${value.toString()}')`;
                            return value;
                        }, 2).replace(/"__undefined__"/g, "undefined");
                textRep = htmlEscape(textRep);
            }
            else {
                textRep = htmlEscape(String(arg));
            }
            return textRep;
        };
        function produceOutput(args) {
            let result = args.reduce((output, arg, index) => {
                const textRep = objectToText(arg);
                const showComma = index !== args.length - 1;
                const comma = showComma ? "<span class='comma'>, </span>" : "";
                return output + textRep + comma + " ";
            }, "");
            Object.keys(replacers).forEach(k => {
                result = result.replace(new RegExp(replacers[k], "g"), k);
            });
            return result;
        }
    }
    // The reflect-metadata runtime is available, so allow that to go through
    function sanitizeJS(code) {
        return code.replace(`import "reflect-metadata"`, "").replace(`require("reflect-metadata")`, "");
    }
    function htmlEscape(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVudGltZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL3NpZGViYXIvcnVudGltZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBSUEsSUFBSSxPQUFPLEdBQWEsRUFBRSxDQUFBO0lBQzFCLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFBO0lBQzVCLE1BQU0sZUFBZSxHQUFHOzs7OztDQUt2QixDQUFBO0lBRU0sTUFBTSxTQUFTLEdBQWtCLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ25ELE1BQU0sTUFBTSxHQUFxQjtZQUMvQixFQUFFLEVBQUUsTUFBTTtZQUNWLFdBQVcsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUM7WUFDbkMsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNoQyxNQUFNLEVBQUUsR0FBRyxJQUFBLG1CQUFRLEdBQUUsQ0FBQTtnQkFFckIsTUFBTSxlQUFlLEdBQUc7b0JBQ3RCLEVBQUUsRUFBRSxpQkFBaUI7b0JBQ3JCLEtBQUssRUFBRSx1QkFBdUI7b0JBQzlCLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7b0JBRTFFLGtCQUFrQixFQUFFLEtBQUs7b0JBQ3pCLGdCQUFnQixFQUFFLEdBQUc7b0JBRXJCLEdBQUcsRUFBRTt3QkFDSCxJQUFBLGlCQUFTLEdBQUUsQ0FBQTt3QkFDWCxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUE7b0JBQ3BDLENBQUM7aUJBQ0YsQ0FBQTtnQkFFRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDdEIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7b0JBQ3pDLGdCQUFn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LENBQUMsQ0FBQTtnQkFDakMsTUFBTSxTQUFTLEdBQUcsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFBO2dCQUMzQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7Z0JBQzlELE9BQU8sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ3ZDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUVOLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNqQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE1BQU0sQ0FBRSxTQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQ3BFLENBQUMsQ0FBQyxDQUFBO1lBRUYsT0FBTyxNQUFNLENBQUE7UUFDZixDQUFDO0lBQ0gsQ0FBQztJQUVELHlFQUF5RTtJQUN6RSxTQUFTLFVBQVUsQ0FBQyxJQUFZO1FBQzlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsNkJBQTZCLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFDakcsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLEdBQVc7UUFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQTtJQUN2RyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGxheWdyb3VuZFBsdWdpbiwgUGx1Z2luRmFjdG9yeSB9IGZyb20gXCIuLlwiXG5pbXBvcnQgeyBjcmVhdGVVSSB9IGZyb20gXCIuLi9jcmVhdGVVSVwiXG5pbXBvcnQgeyBsb2NhbGl6ZSB9IGZyb20gXCIuLi9sb2NhbGl6ZVdpdGhGYWxsYmFja1wiXG5cbmxldCBhbGxMb2dzOiBzdHJpbmdbXSA9IFtdXG5sZXQgYWRkZWRDbGVhckFjdGlvbiA9IGZhbHNlXG5jb25zdCBjYW5jZWxCdXR0b25TVkcgPSBgXG48c3ZnIHdpZHRoPVwiMTNcIiBoZWlnaHQ9XCIxM1wiIHZpZXdCb3g9XCIwIDAgMTMgMTNcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbjxjaXJjbGUgY3g9XCI2XCIgY3k9XCI3XCIgcj1cIjVcIiBzdHJva2Utd2lkdGg9XCIyXCIvPlxuPGxpbmUgeDE9XCIwLjcwNzEwN1wiIHkxPVwiMS4yOTI4OVwiIHgyPVwiMTEuNzA3MVwiIHkyPVwiMTIuMjkyOVwiIHN0cm9rZS13aWR0aD1cIjJcIi8+XG48L3N2Zz5cbmBcblxuZXhwb3J0IGNvbnN0IHJ1blBsdWdpbjogUGx1Z2luRmFjdG9yeSA9IChpLCB1dGlscykgPT4ge1xuICBjb25zdCBwbHVnaW46IFBsYXlncm91bmRQbHVnaW4gPSB7XG4gICAgaWQ6IFwibG9nc1wiLFxuICAgIGRpc3BsYXlOYW1lOiBpKFwicGxheV9zaWRlYmFyX2xvZ3NcIiksXG4gICAgd2lsbE1vdW50OiAoc2FuZGJveCwgY29udGFpbmVyKSA9PiB7XG4gICAgICBjb25zdCB1aSA9IGNyZWF0ZVVJKClcblxuICAgICAgY29uc3QgY2xlYXJMb2dzQWN0aW9uID0ge1xuICAgICAgICBpZDogXCJjbGVhci1sb2dzLXBsYXlcIixcbiAgICAgICAgbGFiZWw6IFwiQ2xlYXIgUGxheWdyb3VuZCBMb2dzXCIsXG4gICAgICAgIGtleWJpbmRpbmdzOiBbc2FuZGJveC5tb25hY28uS2V5TW9kLkN0cmxDbWQgfCBzYW5kYm94Lm1vbmFjby5LZXlDb2RlLktleUtdLFxuXG4gICAgICAgIGNvbnRleHRNZW51R3JvdXBJZDogXCJydW5cIixcbiAgICAgICAgY29udGV4dE1lbnVPcmRlcjogMS41LFxuXG4gICAgICAgIHJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNsZWFyTG9ncygpXG4gICAgICAgICAgdWkuZmxhc2hJbmZvKGkoXCJwbGF5X2NsZWFyX2xvZ3NcIikpXG4gICAgICAgIH0sXG4gICAgICB9XG5cbiAgICAgIGlmICghYWRkZWRDbGVhckFjdGlvbikge1xuICAgICAgICBzYW5kYm94LmVkaXRvci5hZGRBY3Rpb24oY2xlYXJMb2dzQWN0aW9uKVxuICAgICAgICBhZGRlZENsZWFyQWN0aW9uID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBjb25zdCBlcnJvclVMID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgICAgZXJyb3JVTC5pZCA9IFwibG9nLWNvbnRhaW5lclwiXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZXJyb3JVTClcblxuICAgICAgY29uc3QgbG9ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgIGxvZ3MuaWQgPSBcImxvZ1wiXG4gICAgICBsb2dzLmlubmVySFRNTCA9IGFsbExvZ3Muam9pbihcIjxociAvPlwiKVxuICAgICAgZXJyb3JVTC5hcHBlbmRDaGlsZChsb2dzKVxuXG4gICAgICBjb25zdCBsb2dUb29sc0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgIGxvZ1Rvb2xzQ29udGFpbmVyLmlkID0gXCJsb2ctdG9vbHNcIlxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxvZ1Rvb2xzQ29udGFpbmVyKVxuXG4gICAgICBjb25zdCBjbGVhckxvZ3NCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gICAgICBjbGVhckxvZ3NCdXR0b24uaWQgPSBcImNsZWFyLWxvZ3MtYnV0dG9uXCJcbiAgICAgIGNsZWFyTG9nc0J1dHRvbi5pbm5lckhUTUwgPSBjYW5jZWxCdXR0b25TVkdcbiAgICAgIGNsZWFyTG9nc0J1dHRvbi5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICBjbGVhckxvZ3NBY3Rpb24ucnVuKClcblxuICAgICAgICBjb25zdCBmaWx0ZXJUZXh0Qm94OiBhbnkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbHRlci1sb2dzXCIpXG4gICAgICAgIGZpbHRlclRleHRCb3ghLnZhbHVlID0gXCJcIlxuICAgICAgfVxuICAgICAgbG9nVG9vbHNDb250YWluZXIuYXBwZW5kQ2hpbGQoY2xlYXJMb2dzQnV0dG9uKVxuXG4gICAgICBjb25zdCBmaWx0ZXJUZXh0Qm94ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpXG4gICAgICBmaWx0ZXJUZXh0Qm94LmlkID0gXCJmaWx0ZXItbG9nc1wiXG4gICAgICBmaWx0ZXJUZXh0Qm94LnBsYWNlaG9sZGVyID0gaShcInBsYXlfc2lkZWJhcl90b29sc19maWx0ZXJfcGxhY2Vob2xkZXJcIilcbiAgICAgIGZpbHRlclRleHRCb3guYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIChlOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgaW5wdXRUZXh0ID0gZS50YXJnZXQudmFsdWVcblxuICAgICAgICBjb25zdCBlbGVMb2cgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ1wiKSFcbiAgICAgICAgZWxlTG9nLmlubmVySFRNTCA9IGFsbExvZ3NcbiAgICAgICAgICAuZmlsdGVyKGxvZyA9PiB7XG4gICAgICAgICAgICBjb25zdCB1c2VyTG9nZ2VkVGV4dCA9IGxvZy5zdWJzdHJpbmcobG9nLmluZGV4T2YoXCI6XCIpICsgMSwgbG9nLmluZGV4T2YoXCImbmJzcDs8YnI+XCIpKVxuICAgICAgICAgICAgcmV0dXJuIHVzZXJMb2dnZWRUZXh0LmluY2x1ZGVzKGlucHV0VGV4dClcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5qb2luKFwiPGhyIC8+XCIpXG5cbiAgICAgICAgaWYgKGlucHV0VGV4dCA9PT0gXCJcIikge1xuICAgICAgICAgIGNvbnN0IGxvZ0NvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9nLWNvbnRhaW5lclwiKSFcbiAgICAgICAgICBsb2dDb250YWluZXIuc2Nyb2xsVG9wID0gbG9nQ29udGFpbmVyLnNjcm9sbEhlaWdodFxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgbG9nVG9vbHNDb250YWluZXIuYXBwZW5kQ2hpbGQoZmlsdGVyVGV4dEJveClcblxuICAgICAgaWYgKGFsbExvZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IG5vRXJyb3JzTWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgbm9FcnJvcnNNZXNzYWdlLmlkID0gXCJlbXB0eS1tZXNzYWdlLWNvbnRhaW5lclwiXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChub0Vycm9yc01lc3NhZ2UpXG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICAgICAgbWVzc2FnZS50ZXh0Q29udGVudCA9IGxvY2FsaXplKFwicGxheV9zaWRlYmFyX2xvZ3Nfbm9fbG9nc1wiLCBcIk5vIGxvZ3NcIilcbiAgICAgICAgbWVzc2FnZS5jbGFzc0xpc3QuYWRkKFwiZW1wdHktcGx1Z2luLW1lc3NhZ2VcIilcbiAgICAgICAgbm9FcnJvcnNNZXNzYWdlLmFwcGVuZENoaWxkKG1lc3NhZ2UpXG5cbiAgICAgICAgZXJyb3JVTC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICAgICAgbG9nVG9vbHNDb250YWluZXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gICAgICB9XG4gICAgfSxcbiAgfVxuXG4gIHJldHVybiBwbHVnaW5cbn1cblxuZXhwb3J0IGNvbnN0IGNsZWFyTG9ncyA9ICgpID0+IHtcbiAgYWxsTG9ncyA9IFtdXG4gIGNvbnN0IGxvZ3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZ1wiKVxuICBpZiAobG9ncykge1xuICAgIGxvZ3MudGV4dENvbnRlbnQgPSBcIlwiXG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHJ1bldpdGhDdXN0b21Mb2dzID0gKGNsb3N1cmU6IFByb21pc2U8c3RyaW5nPiwgaTogRnVuY3Rpb24pID0+IHtcbiAgY29uc3Qgbm9Mb2dzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlbXB0eS1tZXNzYWdlLWNvbnRhaW5lclwiKVxuICBjb25zdCBsb2dDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxvZy1jb250YWluZXJcIikhXG4gIGNvbnN0IGxvZ1Rvb2xzQ29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2ctdG9vbHNcIikhXG4gIGlmIChub0xvZ3MpIHtcbiAgICBub0xvZ3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gICAgbG9nQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCJcbiAgICBsb2dUb29sc0NvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gXCJmbGV4XCJcbiAgfVxuXG4gIHJld2lyZUxvZ2dpbmdUb0VsZW1lbnQoXG4gICAgKCkgPT4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsb2dcIikhLFxuICAgICgpID0+IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibG9nLWNvbnRhaW5lclwiKSEsXG4gICAgY2xvc3VyZSxcbiAgICB0cnVlLFxuICAgIGlcbiAgKVxufVxuXG4vLyBUaGFua3MgU086IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIwMjU2NzYwL2phdmFzY3JpcHQtY29uc29sZS1sb2ctdG8taHRtbC8zNTQ0OTI1NiMzNTQ0OTI1NlxuXG5mdW5jdGlvbiByZXdpcmVMb2dnaW5nVG9FbGVtZW50KFxuICBlbGVMb2NhdG9yOiAoKSA9PiBFbGVtZW50LFxuICBlbGVPdmVyZmxvd0xvY2F0b3I6ICgpID0+IEVsZW1lbnQsXG4gIGNsb3N1cmU6IFByb21pc2U8c3RyaW5nPixcbiAgYXV0b1Njcm9sbDogYm9vbGVhbixcbiAgaTogRnVuY3Rpb25cbikge1xuICBjb25zdCByYXdDb25zb2xlID0gY29uc29sZVxuXG4gIGNsb3N1cmUudGhlbihqcyA9PiB7XG4gICAgY29uc3QgcmVwbGFjZSA9IHt9IGFzIGFueVxuICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCBcImxvZ1wiLCBcIkxPR1wiKVxuICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCBcImRlYnVnXCIsIFwiREJHXCIpXG4gICAgYmluZExvZ2dpbmdGdW5jKHJlcGxhY2UsIHJhd0NvbnNvbGUsIFwiaW5mb1wiLCBcIklORlwiKVxuICAgIGJpbmRMb2dnaW5nRnVuYyhyZXBsYWNlLCByYXdDb25zb2xlLCBcIndhcm5cIiwgXCJXUk5cIilcbiAgICBiaW5kTG9nZ2luZ0Z1bmMocmVwbGFjZSwgcmF3Q29uc29sZSwgXCJlcnJvclwiLCBcIkVSUlwiKVxuICAgIHJlcGxhY2VbXCJjbGVhclwiXSA9IGNsZWFyTG9nc1xuICAgIGNvbnN0IGNvbnNvbGUgPSBPYmplY3QuYXNzaWduKHt9LCByYXdDb25zb2xlLCByZXBsYWNlKVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBzYWZlSlMgPSBzYW5pdGl6ZUpTKGpzKVxuICAgICAgZXZhbChzYWZlSlMpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoaShcInBsYXlfcnVuX2pzX2ZhaWxcIikpXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKVxuXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBTeW50YXhFcnJvciAmJiAvXFxiZXhwb3J0XFxiL3UudGVzdChlcnJvci5tZXNzYWdlKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgJ1RpcDogQ2hhbmdlIHRoZSBNb2R1bGUgc2V0dGluZyB0byBcIkNvbW1vbkpTXCIgaW4gVFMgQ29uZmlnIHNldHRpbmdzIHRvIGFsbG93IHRvcC1sZXZlbCBleHBvcnRzIHRvIHdvcmsgaW4gdGhlIFBsYXlncm91bmQnXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gYmluZExvZ2dpbmdGdW5jKG9iajogYW55LCByYXc6IGFueSwgbmFtZTogc3RyaW5nLCBpZDogc3RyaW5nKSB7XG4gICAgb2JqW25hbWVdID0gZnVuY3Rpb24gKC4uLm9ianM6IGFueVtdKSB7XG4gICAgICBjb25zdCBvdXRwdXQgPSBwcm9kdWNlT3V0cHV0KG9ianMpXG4gICAgICBjb25zdCBlbGVMb2cgPSBlbGVMb2NhdG9yKClcbiAgICAgIGNvbnN0IHByZWZpeCA9IGBbPHNwYW4gY2xhc3M9XCJsb2ctJHtuYW1lfVwiPiR7aWR9PC9zcGFuPl06IGBcbiAgICAgIGNvbnN0IGVsZUNvbnRhaW5lckxvZyA9IGVsZU92ZXJmbG93TG9jYXRvcigpXG4gICAgICBhbGxMb2dzLnB1c2goYCR7cHJlZml4fSR7b3V0cHV0fTxicj5gKVxuICAgICAgZWxlTG9nLmlubmVySFRNTCA9IGFsbExvZ3Muam9pbihcIjxociAvPlwiKVxuICAgICAgaWYgKGF1dG9TY3JvbGwgJiYgZWxlQ29udGFpbmVyTG9nKSB7XG4gICAgICAgIGVsZUNvbnRhaW5lckxvZy5zY3JvbGxUb3AgPSBlbGVDb250YWluZXJMb2cuc2Nyb2xsSGVpZ2h0XG4gICAgICB9XG4gICAgICByYXdbbmFtZV0oLi4ub2JqcylcbiAgICB9XG4gIH1cblxuICAvLyBJbmxpbmUgY29uc3RhbnRzIHdoaWNoIGFyZSBzd2l0Y2hlZCBvdXQgYXQgdGhlIGVuZCBvZiBwcm9jZXNzaW5nXG4gIGNvbnN0IHJlcGxhY2VycyA9IHtcbiAgICBcIjxzcGFuIGNsYXNzPSdsaXRlcmFsJz5udWxsPC9zcGFuPlwiOiBcIjEyMzEyMzIxMzEyMzEyMzE0MjM0MzQ1MzQ1MzRcIixcbiAgICBcIjxzcGFuIGNsYXNzPSdsaXRlcmFsJz51bmRlZmluZWQ8L3NwYW4+XCI6IFwiNDUzNDUzNDUzNDU2MzU2NzU2NzU2N1wiLFxuICAgIFwiPHNwYW4gY2xhc3M9J2NvbW1hJz4sIDwvc3Bhbj5cIjogXCI3ODV5ODM0NTg3MzQ4NTc2Mzg3NDU2ODczNHk1MzU0MzhcIixcbiAgfVxuXG4gIGNvbnN0IG9iamVjdFRvVGV4dCA9IChhcmc6IGFueSk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgaXNPYmogPSB0eXBlb2YgYXJnID09PSBcIm9iamVjdFwiXG4gICAgbGV0IHRleHRSZXAgPSBcIlwiXG4gICAgaWYgKGFyZyAmJiBhcmcuc3RhY2sgJiYgYXJnLm1lc3NhZ2UpIHtcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgZXJyXG4gICAgICB0ZXh0UmVwID0gaHRtbEVzY2FwZShhcmcubWVzc2FnZSlcbiAgICB9IGVsc2UgaWYgKGFyZyA9PT0gbnVsbCkge1xuICAgICAgdGV4dFJlcCA9IHJlcGxhY2Vyc1tcIjxzcGFuIGNsYXNzPSdsaXRlcmFsJz5udWxsPC9zcGFuPlwiXVxuICAgIH0gZWxzZSBpZiAoYXJnID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRleHRSZXAgPSByZXBsYWNlcnNbXCI8c3BhbiBjbGFzcz0nbGl0ZXJhbCc+dW5kZWZpbmVkPC9zcGFuPlwiXVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJzeW1ib2xcIikge1xuICAgICAgdGV4dFJlcCA9IGA8c3BhbiBjbGFzcz0nbGl0ZXJhbCc+JHtodG1sRXNjYXBlKFN0cmluZyhhcmcpKX08L3NwYW4+YFxuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICB0ZXh0UmVwID0gXCJbXCIgKyBhcmcubWFwKG9iamVjdFRvVGV4dCkuam9pbihyZXBsYWNlcnNbXCI8c3BhbiBjbGFzcz0nY29tbWEnPiwgPC9zcGFuPlwiXSkgKyBcIl1cIlxuICAgIH0gZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICBjb25zdCBzZXRJdGVyID0gWy4uLmFyZ11cbiAgICAgIHRleHRSZXAgPSBgU2V0ICgke2FyZy5zaXplfSkge2AgKyBzZXRJdGVyLm1hcChvYmplY3RUb1RleHQpLmpvaW4ocmVwbGFjZXJzW1wiPHNwYW4gY2xhc3M9J2NvbW1hJz4sIDwvc3Bhbj5cIl0pICsgXCJ9XCJcbiAgICB9IGVsc2UgaWYgKGFyZyBpbnN0YW5jZW9mIE1hcCkge1xuICAgICAgY29uc3QgbWFwSXRlciA9IFsuLi5hcmcuZW50cmllcygpXVxuICAgICAgdGV4dFJlcCA9XG4gICAgICAgIGBNYXAgKCR7YXJnLnNpemV9KSB7YCArXG4gICAgICAgIG1hcEl0ZXJcbiAgICAgICAgICAubWFwKChbaywgdl0pID0+IGAke29iamVjdFRvVGV4dChrKX0gPT4gJHtvYmplY3RUb1RleHQodil9YClcbiAgICAgICAgICAuam9pbihyZXBsYWNlcnNbXCI8c3BhbiBjbGFzcz0nY29tbWEnPiwgPC9zcGFuPlwiXSkgK1xuICAgICAgICBcIn1cIlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGV4dFJlcCA9ICdcIicgKyBodG1sRXNjYXBlKGFyZykgKyAnXCInXG4gICAgfSBlbHNlIGlmIChpc09iaikge1xuICAgICAgY29uc3QgbmFtZSA9IGFyZy5jb25zdHJ1Y3RvciAmJiBhcmcuY29uc3RydWN0b3IubmFtZSB8fCBcIlwiXG4gICAgICAvLyBObyBvbmUgbmVlZHMgdG8ga25vdyBhbiBvYmogaXMgYW4gb2JqXG4gICAgICBjb25zdCBuYW1lV2l0aG91dE9iamVjdCA9IG5hbWUgJiYgbmFtZSA9PT0gXCJPYmplY3RcIiA/IFwiXCIgOiBodG1sRXNjYXBlKG5hbWUpXG4gICAgICBjb25zdCBwcmVmaXggPSBuYW1lV2l0aG91dE9iamVjdCA/IGAke25hbWVXaXRob3V0T2JqZWN0fTogYCA6IFwiXCJcblxuICAgICAgdGV4dFJlcCA9XG4gICAgICAgIHByZWZpeCArXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgIGFyZyxcbiAgICAgICAgICAoXywgdmFsdWUpID0+IHtcbiAgICAgICAgICAgIC8vIEpTT04uc3RyaW5naWZ5IG9taXRzIGFueSBrZXlzIHdpdGggYSB2YWx1ZSBvZiB1bmRlZmluZWQuIFRvIGdldCBhcm91bmQgdGhpcywgd2UgcmVwbGFjZSB1bmRlZmluZWQgd2l0aCB0aGUgdGV4dCBfX3VuZGVmaW5lZF9fIGFuZCB0aGVuIGRvIGEgZ2xvYmFsIHJlcGxhY2UgdXNpbmcgcmVnZXggYmFjayB0byBrZXl3b3JkIHVuZGVmaW5lZFxuICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiBcIl9fdW5kZWZpbmVkX19cIlxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCcpIHJldHVybiBgQmlnSW50KCcke3ZhbHVlLnRvU3RyaW5nKCl9JylgXG4gICAgICAgICAgICByZXR1cm4gdmFsdWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIDJcbiAgICAgICAgKS5yZXBsYWNlKC9cIl9fdW5kZWZpbmVkX19cIi9nLCBcInVuZGVmaW5lZFwiKVxuXG4gICAgICB0ZXh0UmVwID0gaHRtbEVzY2FwZSh0ZXh0UmVwKVxuICAgIH0gZWxzZSB7XG4gICAgICB0ZXh0UmVwID0gaHRtbEVzY2FwZShTdHJpbmcoYXJnKSlcbiAgICB9XG4gICAgcmV0dXJuIHRleHRSZXBcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2R1Y2VPdXRwdXQoYXJnczogYW55W10pIHtcbiAgICBsZXQgcmVzdWx0OiBzdHJpbmcgPSBhcmdzLnJlZHVjZSgob3V0cHV0OiBhbnksIGFyZzogYW55LCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgdGV4dFJlcCA9IG9iamVjdFRvVGV4dChhcmcpXG4gICAgICBjb25zdCBzaG93Q29tbWEgPSBpbmRleCAhPT0gYXJncy5sZW5ndGggLSAxXG4gICAgICBjb25zdCBjb21tYSA9IHNob3dDb21tYSA/IFwiPHNwYW4gY2xhc3M9J2NvbW1hJz4sIDwvc3Bhbj5cIiA6IFwiXCJcbiAgICAgIHJldHVybiBvdXRwdXQgKyB0ZXh0UmVwICsgY29tbWEgKyBcIiBcIlxuICAgIH0sIFwiXCIpXG5cbiAgICBPYmplY3Qua2V5cyhyZXBsYWNlcnMpLmZvckVhY2goayA9PiB7XG4gICAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZShuZXcgUmVnRXhwKChyZXBsYWNlcnMgYXMgYW55KVtrXSwgXCJnXCIpLCBrKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuLy8gVGhlIHJlZmxlY3QtbWV0YWRhdGEgcnVudGltZSBpcyBhdmFpbGFibGUsIHNvIGFsbG93IHRoYXQgdG8gZ28gdGhyb3VnaFxuZnVuY3Rpb24gc2FuaXRpemVKUyhjb2RlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNvZGUucmVwbGFjZShgaW1wb3J0IFwicmVmbGVjdC1tZXRhZGF0YVwiYCwgXCJcIikucmVwbGFjZShgcmVxdWlyZShcInJlZmxlY3QtbWV0YWRhdGFcIilgLCBcIlwiKVxufVxuXG5mdW5jdGlvbiBodG1sRXNjYXBlKHN0cjogc3RyaW5nKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpLnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpXG59XG4iXX0=