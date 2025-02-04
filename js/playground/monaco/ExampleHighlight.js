define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExampleHighlighter = void 0;
    /**
     * Allows inline clicking on internal URLs to get different example code
     */
    class ExampleHighlighter {
        provideLinks(model) {
            const text = model.getValue();
            // https://regex101.com/r/3uM4Fa/1
            const docRegexLink = /example:([^\s]+)/g;
            const links = [];
            let match;
            while ((match = docRegexLink.exec(text)) !== null) {
                const start = match.index;
                const end = match.index + match[0].length;
                const startPos = model.getPositionAt(start);
                const endPos = model.getPositionAt(end);
                const range = {
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column,
                };
                const url = document.location.href.split('#')[0];
                links.push({
                    url: url + '#example/' + match[1],
                    range,
                });
            }
            return { links };
        }
    }
    exports.ExampleHighlighter = ExampleHighlighter;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXhhbXBsZUhpZ2hsaWdodC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL21vbmFjby9FeGFtcGxlSGlnaGxpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7SUFBQTs7T0FFRztJQUNILE1BQWEsa0JBQWtCO1FBQzdCLFlBQVksQ0FBQyxLQUE0QztZQUN2RCxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7WUFFN0Isa0NBQWtDO1lBQ2xDLE1BQU0sWUFBWSxHQUFHLG1CQUFtQixDQUFBO1lBRXhDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUVoQixJQUFJLEtBQUssQ0FBQTtZQUNULE9BQU8sQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNsRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFBO2dCQUN6QixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUE7Z0JBQ3pDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzNDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBRXZDLE1BQU0sS0FBSyxHQUFHO29CQUNaLGVBQWUsRUFBRSxRQUFRLENBQUMsVUFBVTtvQkFDcEMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxNQUFNO29CQUM1QixhQUFhLEVBQUUsTUFBTSxDQUFDLFVBQVU7b0JBQ2hDLFNBQVMsRUFBRSxNQUFNLENBQUMsTUFBTTtpQkFDekIsQ0FBQTtnQkFFRCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ2hELEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ1QsR0FBRyxFQUFFLEdBQUcsR0FBRyxXQUFXLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDakMsS0FBSztpQkFDTixDQUFDLENBQUE7WUFDSixDQUFDO1lBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO1FBQ2xCLENBQUM7S0FDRjtJQWhDRCxnREFnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFsbG93cyBpbmxpbmUgY2xpY2tpbmcgb24gaW50ZXJuYWwgVVJMcyB0byBnZXQgZGlmZmVyZW50IGV4YW1wbGUgY29kZVxuICovXG5leHBvcnQgY2xhc3MgRXhhbXBsZUhpZ2hsaWdodGVyIHtcbiAgcHJvdmlkZUxpbmtzKG1vZGVsOiBpbXBvcnQoJ21vbmFjby1lZGl0b3InKS5lZGl0b3IuSU1vZGVsKSB7XG4gICAgY29uc3QgdGV4dCA9IG1vZGVsLmdldFZhbHVlKClcblxuICAgIC8vIGh0dHBzOi8vcmVnZXgxMDEuY29tL3IvM3VNNEZhLzFcbiAgICBjb25zdCBkb2NSZWdleExpbmsgPSAvZXhhbXBsZTooW15cXHNdKykvZ1xuXG4gICAgY29uc3QgbGlua3MgPSBbXVxuXG4gICAgbGV0IG1hdGNoXG4gICAgd2hpbGUgKChtYXRjaCA9IGRvY1JlZ2V4TGluay5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgc3RhcnQgPSBtYXRjaC5pbmRleFxuICAgICAgY29uc3QgZW5kID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGhcbiAgICAgIGNvbnN0IHN0YXJ0UG9zID0gbW9kZWwuZ2V0UG9zaXRpb25BdChzdGFydClcbiAgICAgIGNvbnN0IGVuZFBvcyA9IG1vZGVsLmdldFBvc2l0aW9uQXQoZW5kKVxuXG4gICAgICBjb25zdCByYW5nZSA9IHtcbiAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBzdGFydFBvcy5saW5lTnVtYmVyLFxuICAgICAgICBzdGFydENvbHVtbjogc3RhcnRQb3MuY29sdW1uLFxuICAgICAgICBlbmRMaW5lTnVtYmVyOiBlbmRQb3MubGluZU51bWJlcixcbiAgICAgICAgZW5kQ29sdW1uOiBlbmRQb3MuY29sdW1uLFxuICAgICAgfVxuXG4gICAgICBjb25zdCB1cmwgPSBkb2N1bWVudC5sb2NhdGlvbi5ocmVmLnNwbGl0KCcjJylbMF1cbiAgICAgIGxpbmtzLnB1c2goe1xuICAgICAgICB1cmw6IHVybCArICcjZXhhbXBsZS8nICsgbWF0Y2hbMV0sXG4gICAgICAgIHJhbmdlLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4geyBsaW5rcyB9XG4gIH1cbn1cbiJdfQ==