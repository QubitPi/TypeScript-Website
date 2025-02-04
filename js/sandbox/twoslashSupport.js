define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.twoslashCompletions = exports.extractTwoSlashCompilerOptions = void 0;
    exports.parsePrimitive = parsePrimitive;
    const booleanConfigRegexp = /^\/\/\s?@(\w+)$/;
    // https://regex101.com/r/8B2Wwh/1
    const valuedConfigRegexp = /^\/\/\s?@(\w+):\s?(.+)$/;
    /**
     * This is a port of the twoslash bit which grabs compiler options
     * from the source code
     */
    const extractTwoSlashCompilerOptions = (ts) => {
        let optMap = new Map();
        if (!("optionDeclarations" in ts)) {
            console.error("Could not get compiler options from ts.optionDeclarations - skipping twoslash support.");
        }
        else {
            // @ts-ignore - optionDeclarations is not public API
            for (const opt of ts.optionDeclarations) {
                optMap.set(opt.name.toLowerCase(), opt);
            }
        }
        return (code) => {
            const codeLines = code.split("\n");
            const options = {};
            codeLines.forEach(_line => {
                let match;
                const line = _line.trim();
                if ((match = booleanConfigRegexp.exec(line))) {
                    if (optMap.has(match[1].toLowerCase())) {
                        options[match[1]] = true;
                        setOption(match[1], "true", options, optMap);
                    }
                }
                else if ((match = valuedConfigRegexp.exec(line))) {
                    if (optMap.has(match[1].toLowerCase())) {
                        setOption(match[1], match[2], options, optMap);
                    }
                }
            });
            return options;
        };
    };
    exports.extractTwoSlashCompilerOptions = extractTwoSlashCompilerOptions;
    function setOption(name, value, opts, optMap) {
        const opt = optMap.get(name.toLowerCase());
        if (!opt)
            return;
        switch (opt.type) {
            case "number":
            case "string":
            case "boolean":
                opts[opt.name] = parsePrimitive(value, opt.type);
                break;
            case "list":
                const elementType = opt.element.type;
                const strings = value.split(",");
                if (typeof elementType === "string") {
                    opts[opt.name] = strings.map(v => parsePrimitive(v, elementType));
                }
                else {
                    opts[opt.name] = strings.map(v => getOptionValueFromMap(opt.name, v, elementType)).filter(Boolean);
                }
                break;
            default: // It's a map!
                const optMap = opt.type;
                opts[opt.name] = getOptionValueFromMap(opt.name, value, optMap);
        }
        if (opts[opt.name] === undefined) {
            const keys = Array.from(opt.type.keys());
            console.log(`Invalid value ${value} for ${opt.name}. Allowed values: ${keys.join(",")}`);
        }
    }
    function parsePrimitive(value, type) {
        switch (type) {
            case "number":
                return +value;
            case "string":
                return value;
            case "boolean":
                return value.toLowerCase() === "true" || value.length === 0;
        }
        console.log(`Unknown primitive type ${type} with - ${value}`);
    }
    function getOptionValueFromMap(name, key, optMap) {
        const result = optMap.get(key.toLowerCase());
        if (result === undefined) {
            const keys = Array.from(optMap.keys());
            console.error(`Invalid inline compiler value`, `Got ${key} for ${name} but it is not a supported value by the TS compiler.`, `Allowed values: ${keys.join(",")}`);
        }
        return result;
    }
    // Function to generate autocompletion results
    const twoslashCompletions = (ts, monaco) => (model, position, _token) => {
        const result = [];
        // Split everything the user has typed on the current line up at each space, and only look at the last word
        const thisLine = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 0,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
        });
        // Not a comment
        if (!thisLine.startsWith("//")) {
            return { suggestions: [] };
        }
        const words = thisLine.replace("\t", "").split(" ");
        // Not the right amount of
        if (words.length !== 2) {
            return { suggestions: [] };
        }
        const word = words[1];
        if (word.startsWith("-")) {
            return {
                suggestions: [
                    {
                        label: "---cut---",
                        kind: 14,
                        detail: "Twoslash split output",
                        insertText: "---cut---".replace(word, ""),
                    },
                ],
            };
        }
        // Not a @ at the first word
        if (!word.startsWith("@")) {
            return { suggestions: [] };
        }
        const knowns = [
            "noErrors",
            "errors",
            "showEmit",
            "showEmittedFile",
            "noStaticSemanticInfo",
            "emit",
            "noErrorValidation",
            "filename",
        ];
        // @ts-ignore - ts.optionDeclarations is private
        const optsNames = ts.optionDeclarations.map(o => o.name);
        knowns.concat(optsNames).forEach(name => {
            if (name.startsWith(word.slice(1))) {
                // somehow adding the range seems to not give autocomplete results?
                result.push({
                    label: name,
                    kind: 14,
                    detail: "Twoslash comment",
                    insertText: name,
                });
            }
        });
        return {
            suggestions: result,
        };
    };
    exports.twoslashCompletions = twoslashCompletions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdvc2xhc2hTdXBwb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2FuZGJveC9zcmMvdHdvc2xhc2hTdXBwb3J0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUErRUEsd0NBVUM7SUF6RkQsTUFBTSxtQkFBbUIsR0FBRyxpQkFBaUIsQ0FBQTtJQUU3QyxrQ0FBa0M7SUFDbEMsTUFBTSxrQkFBa0IsR0FBRyx5QkFBeUIsQ0FBQTtJQUtwRDs7O09BR0c7SUFFSSxNQUFNLDhCQUE4QixHQUFHLENBQUMsRUFBTSxFQUFFLEVBQUU7UUFDdkQsSUFBSSxNQUFNLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQTtRQUVuQyxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0ZBQXdGLENBQUMsQ0FBQTtRQUN6RyxDQUFDO2FBQU0sQ0FBQztZQUNOLG9EQUFvRDtZQUNwRCxLQUFLLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFDekMsQ0FBQztRQUNILENBQUM7UUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLEVBQUU7WUFDdEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtZQUNsQyxNQUFNLE9BQU8sR0FBRyxFQUFTLENBQUE7WUFFekIsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxLQUFLLENBQUE7Z0JBQ1QsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO2dCQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FB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LEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsQ0FBQTtRQUM1QixDQUFDO1FBRUQsTUFBTSxNQUFNLEdBQUc7WUFDYixVQUFVO1lBQ1YsUUFBUTtZQUNSLFVBQVU7WUFDVixpQkFBaUI7WUFDakIsc0JBQXNCO1lBQ3RCLE1BQU07WUFDTixtQkFBbUI7WUFDbkIsVUFBVTtTQUNYLENBQUE7UUFDRCxnREFBZ0Q7UUFDaEQsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUN0QyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLG1FQUFtRTtnQkFDbkUsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixLQUFLLEVBQUUsSUFBSTtvQkFDWCxJQUFJLEVBQUUsRUFBRTtvQkFDUixNQUFNLEVBQUUsa0JBQWtCO29CQUMxQixVQUFVLEVBQUUsSUFBSTtpQkFDVixDQUFDLENBQUE7WUFDWCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPO1lBQ0wsV0FBVyxFQUFFLE1BQU07U0FDcEIsQ0FBQTtJQUNILENBQUMsQ0FBQTtJQXpFWSxRQUFBLG1CQUFtQix1QkF5RS9CIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgYm9vbGVhbkNvbmZpZ1JlZ2V4cCA9IC9eXFwvXFwvXFxzP0AoXFx3KykkL1xuXG4vLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yLzhCMld3aC8xXG5jb25zdCB2YWx1ZWRDb25maWdSZWdleHAgPSAvXlxcL1xcL1xccz9AKFxcdyspOlxccz8oLispJC9cblxudHlwZSBUUyA9IHR5cGVvZiBpbXBvcnQoXCJ0eXBlc2NyaXB0XCIpXG50eXBlIENvbXBpbGVyT3B0aW9ucyA9IGltcG9ydChcInR5cGVzY3JpcHRcIikuQ29tcGlsZXJPcHRpb25zXG5cbi8qKlxuICogVGhpcyBpcyBhIHBvcnQgb2YgdGhlIHR3b3NsYXNoIGJpdCB3aGljaCBncmFicyBjb21waWxlciBvcHRpb25zXG4gKiBmcm9tIHRoZSBzb3VyY2UgY29kZVxuICovXG5cbmV4cG9ydCBjb25zdCBleHRyYWN0VHdvU2xhc2hDb21waWxlck9wdGlvbnMgPSAodHM6IFRTKSA9PiB7XG4gIGxldCBvcHRNYXAgPSBuZXcgTWFwPHN0cmluZywgYW55PigpXG5cbiAgaWYgKCEoXCJvcHRpb25EZWNsYXJhdGlvbnNcIiBpbiB0cykpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGdldCBjb21waWxlciBvcHRpb25zIGZyb20gdHMub3B0aW9uRGVjbGFyYXRpb25zIC0gc2tpcHBpbmcgdHdvc2xhc2ggc3VwcG9ydC5cIilcbiAgfSBlbHNlIHtcbiAgICAvLyBAdHMtaWdub3JlIC0gb3B0aW9uRGVjbGFyYXRpb25zIGlzIG5vdCBwdWJsaWMgQVBJXG4gICAgZm9yIChjb25zdCBvcHQgb2YgdHMub3B0aW9uRGVjbGFyYXRpb25zKSB7XG4gICAgICBvcHRNYXAuc2V0KG9wdC5uYW1lLnRvTG93ZXJDYXNlKCksIG9wdClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gKGNvZGU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGNvZGVMaW5lcyA9IGNvZGUuc3BsaXQoXCJcXG5cIilcbiAgICBjb25zdCBvcHRpb25zID0ge30gYXMgYW55XG5cbiAgICBjb2RlTGluZXMuZm9yRWFjaChfbGluZSA9PiB7XG4gICAgICBsZXQgbWF0Y2hcbiAgICAgIGNvbnN0IGxpbmUgPSBfbGluZS50cmltKClcbiAgICAgIGlmICgobWF0Y2ggPSBib29sZWFuQ29uZmlnUmVnZXhwLmV4ZWMobGluZSkpKSB7XG4gICAgICAgIGlmIChvcHRNYXAuaGFzKG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkpKSB7XG4gICAgICAgICAgb3B0aW9uc1ttYXRjaFsxXV0gPSB0cnVlXG4gICAgICAgICAgc2V0T3B0aW9uKG1hdGNoWzFdLCBcInRydWVcIiwgb3B0aW9ucywgb3B0TWFwKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKChtYXRjaCA9IHZhbHVlZENvbmZpZ1JlZ2V4cC5leGVjKGxpbmUpKSkge1xuICAgICAgICBpZiAob3B0TWFwLmhhcyhtYXRjaFsxXS50b0xvd2VyQ2FzZSgpKSkge1xuICAgICAgICAgIHNldE9wdGlvbihtYXRjaFsxXSwgbWF0Y2hbMl0sIG9wdGlvbnMsIG9wdE1hcClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIG9wdGlvbnNcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRPcHRpb24obmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nLCBvcHRzOiBDb21waWxlck9wdGlvbnMsIG9wdE1hcDogTWFwPHN0cmluZywgYW55Pikge1xuICBjb25zdCBvcHQgPSBvcHRNYXAuZ2V0KG5hbWUudG9Mb3dlckNhc2UoKSlcblxuICBpZiAoIW9wdCkgcmV0dXJuXG4gIHN3aXRjaCAob3B0LnR5cGUpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgY2FzZSBcInN0cmluZ1wiOlxuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICBvcHRzW29wdC5uYW1lXSA9IHBhcnNlUHJpbWl0aXZlKHZhbHVlLCBvcHQudHlwZSlcbiAgICAgIGJyZWFrXG5cbiAgICBjYXNlIFwibGlzdFwiOlxuICAgICAgY29uc3QgZWxlbWVudFR5cGUgPSBvcHQuZWxlbWVudCEudHlwZVxuICAgICAgY29uc3Qgc3RyaW5ncyA9IHZhbHVlLnNwbGl0KFwiLFwiKVxuICAgICAgaWYgKHR5cGVvZiBlbGVtZW50VHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBvcHRzW29wdC5uYW1lXSA9IHN0cmluZ3MubWFwKHYgPT4gcGFyc2VQcmltaXRpdmUodiwgZWxlbWVudFR5cGUpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0c1tvcHQubmFtZV0gPSBzdHJpbmdzLm1hcCh2ID0+IGdldE9wdGlvblZhbHVlRnJvbU1hcChvcHQubmFtZSwgdiwgZWxlbWVudFR5cGUgYXMgTWFwPHN0cmluZywgc3RyaW5nPikhKS5maWx0ZXIoQm9vbGVhbilcbiAgICAgIH1cbiAgICAgIGJyZWFrXG5cbiAgICBkZWZhdWx0OiAgICAgICAgICAvLyBJdCdzIGEgbWFwIVxuICAgICAgY29uc3Qgb3B0TWFwID0gb3B0LnR5cGUgYXMgTWFwPHN0cmluZywgc3RyaW5nPlxuICAgICAgb3B0c1tvcHQubmFtZV0gPSBnZXRPcHRpb25WYWx1ZUZyb21NYXAob3B0Lm5hbWUsIHZhbHVlLCBvcHRNYXApXG4gIH1cblxuICBpZiAob3B0c1tvcHQubmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5mcm9tKG9wdC50eXBlLmtleXMoKSBhcyBhbnkpXG4gICAgY29uc29sZS5sb2coYEludmFsaWQgdmFsdWUgJHt2YWx1ZX0gZm9yICR7b3B0Lm5hbWV9LiBBbGxvd2VkIHZhbHVlczogJHtrZXlzLmpvaW4oXCIsXCIpfWApXG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUHJpbWl0aXZlKHZhbHVlOiBzdHJpbmcsIHR5cGU6IHN0cmluZyk6IGFueSB7XG4gIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgIHJldHVybiArdmFsdWVcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICByZXR1cm4gdmFsdWVcbiAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgcmV0dXJuIHZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiIHx8IHZhbHVlLmxlbmd0aCA9PT0gMFxuICB9XG4gIGNvbnNvbGUubG9nKGBVbmtub3duIHByaW1pdGl2ZSB0eXBlICR7dHlwZX0gd2l0aCAtICR7dmFsdWV9YClcbn1cblxuXG5mdW5jdGlvbiBnZXRPcHRpb25WYWx1ZUZyb21NYXAobmFtZTogc3RyaW5nLCBrZXk6IHN0cmluZywgb3B0TWFwOiBNYXA8c3RyaW5nLCBzdHJpbmc+KSB7XG4gIGNvbnN0IHJlc3VsdCA9IG9wdE1hcC5nZXQoa2V5LnRvTG93ZXJDYXNlKCkpXG4gIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IGtleXMgPSBBcnJheS5mcm9tKG9wdE1hcC5rZXlzKCkgYXMgYW55KVxuXG4gICAgY29uc29sZS5lcnJvcihcbiAgICAgIGBJbnZhbGlkIGlubGluZSBjb21waWxlciB2YWx1ZWAsXG4gICAgICBgR290ICR7a2V5fSBmb3IgJHtuYW1lfSBidXQgaXQgaXMgbm90IGEgc3VwcG9ydGVkIHZhbHVlIGJ5IHRoZSBUUyBjb21waWxlci5gLFxuICAgICAgYEFsbG93ZWQgdmFsdWVzOiAke2tleXMuam9pbihcIixcIil9YFxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cbi8vIEZ1bmN0aW9uIHRvIGdlbmVyYXRlIGF1dG9jb21wbGV0aW9uIHJlc3VsdHNcbmV4cG9ydCBjb25zdCB0d29zbGFzaENvbXBsZXRpb25zID0gKHRzOiBUUywgbW9uYWNvOiB0eXBlb2YgaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKSkgPT4gKFxuICBtb2RlbDogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5lZGl0b3IuSVRleHRNb2RlbCxcbiAgcG9zaXRpb246IGltcG9ydChcIm1vbmFjby1lZGl0b3JcIikuUG9zaXRpb24sXG4gIF90b2tlbjogYW55XG4pOiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmxhbmd1YWdlcy5Db21wbGV0aW9uTGlzdCA9PiB7XG4gIGNvbnN0IHJlc3VsdDogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSA9IFtdXG5cbiAgLy8gU3BsaXQgZXZlcnl0aGluZyB0aGUgdXNlciBoYXMgdHlwZWQgb24gdGhlIGN1cnJlbnQgbGluZSB1cCBhdCBlYWNoIHNwYWNlLCBhbmQgb25seSBsb29rIGF0IHRoZSBsYXN0IHdvcmRcbiAgY29uc3QgdGhpc0xpbmUgPSBtb2RlbC5nZXRWYWx1ZUluUmFuZ2Uoe1xuICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlcixcbiAgICBzdGFydENvbHVtbjogMCxcbiAgICBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLFxuICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uLFxuICB9KVxuXG4gIC8vIE5vdCBhIGNvbW1lbnRcbiAgaWYgKCF0aGlzTGluZS5zdGFydHNXaXRoKFwiLy9cIikpIHtcbiAgICByZXR1cm4geyBzdWdnZXN0aW9uczogW10gfVxuICB9XG5cbiAgY29uc3Qgd29yZHMgPSB0aGlzTGluZS5yZXBsYWNlKFwiXFx0XCIsIFwiXCIpLnNwbGl0KFwiIFwiKVxuXG4gIC8vIE5vdCB0aGUgcmlnaHQgYW1vdW50IG9mXG4gIGlmICh3b3Jkcy5sZW5ndGggIT09IDIpIHtcbiAgICByZXR1cm4geyBzdWdnZXN0aW9uczogW10gfVxuICB9XG5cbiAgY29uc3Qgd29yZCA9IHdvcmRzWzFdXG4gIGlmICh3b3JkLnN0YXJ0c1dpdGgoXCItXCIpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Z2dlc3Rpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBsYWJlbDogXCItLS1jdXQtLS1cIixcbiAgICAgICAgICBraW5kOiAxNCxcbiAgICAgICAgICBkZXRhaWw6IFwiVHdvc2xhc2ggc3BsaXQgb3V0cHV0XCIsXG4gICAgICAgICAgaW5zZXJ0VGV4dDogXCItLS1jdXQtLS1cIi5yZXBsYWNlKHdvcmQsIFwiXCIpLFxuICAgICAgICB9IGFzIGFueSxcbiAgICAgIF0sXG4gICAgfVxuICB9XG5cbiAgLy8gTm90IGEgQCBhdCB0aGUgZmlyc3Qgd29yZFxuICBpZiAoIXdvcmQuc3RhcnRzV2l0aChcIkBcIikpIHtcbiAgICByZXR1cm4geyBzdWdnZXN0aW9uczogW10gfVxuICB9XG5cbiAgY29uc3Qga25vd25zID0gW1xuICAgIFwibm9FcnJvcnNcIixcbiAgICBcImVycm9yc1wiLFxuICAgIFwic2hvd0VtaXRcIixcbiAgICBcInNob3dFbWl0dGVkRmlsZVwiLFxuICAgIFwibm9TdGF0aWNTZW1hbnRpY0luZm9cIixcbiAgICBcImVtaXRcIixcbiAgICBcIm5vRXJyb3JWYWxpZGF0aW9uXCIsXG4gICAgXCJmaWxlbmFtZVwiLFxuICBdXG4gIC8vIEB0cy1pZ25vcmUgLSB0cy5vcHRpb25EZWNsYXJhdGlvbnMgaXMgcHJpdmF0ZVxuICBjb25zdCBvcHRzTmFtZXMgPSB0cy5vcHRpb25EZWNsYXJhdGlvbnMubWFwKG8gPT4gby5uYW1lKVxuICBrbm93bnMuY29uY2F0KG9wdHNOYW1lcykuZm9yRWFjaChuYW1lID0+IHtcbiAgICBpZiAobmFtZS5zdGFydHNXaXRoKHdvcmQuc2xpY2UoMSkpKSB7XG4gICAgICAvLyBzb21laG93IGFkZGluZyB0aGUgcmFuZ2Ugc2VlbXMgdG8gbm90IGdpdmUgYXV0b2NvbXBsZXRlIHJlc3VsdHM/XG4gICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgIGxhYmVsOiBuYW1lLFxuICAgICAgICBraW5kOiAxNCxcbiAgICAgICAgZGV0YWlsOiBcIlR3b3NsYXNoIGNvbW1lbnRcIixcbiAgICAgICAgaW5zZXJ0VGV4dDogbmFtZSxcbiAgICAgIH0gYXMgYW55KVxuICAgIH1cbiAgfSlcblxuICByZXR1cm4ge1xuICAgIHN1Z2dlc3Rpb25zOiByZXN1bHQsXG4gIH1cbn1cbiJdfQ==