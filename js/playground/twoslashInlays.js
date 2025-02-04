var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTwoslashInlayProvider = void 0;
    const createTwoslashInlayProvider = (sandbox) => {
        const provider = {
            provideInlayHints: (model, _, cancel) => __awaiter(void 0, void 0, void 0, function* () {
                const text = model.getValue();
                const queryRegex = /^\s*\/\/\s*\^\?$/gm;
                let match;
                const results = [];
                const worker = yield sandbox.getWorkerProcess();
                if (model.isDisposed()) {
                    return {
                        hints: [],
                        dispose: () => { },
                    };
                }
                while ((match = queryRegex.exec(text)) !== null) {
                    const end = match.index + match[0].length - 1;
                    const endPos = model.getPositionAt(end);
                    const inspectionPos = new sandbox.monaco.Position(endPos.lineNumber - 1, endPos.column);
                    const inspectionOff = model.getOffsetAt(inspectionPos);
                    if (cancel.isCancellationRequested) {
                        return {
                            hints: [],
                            dispose: () => { },
                        };
                    }
                    const hint = yield worker.getQuickInfoAtPosition("file://" + model.uri.path, inspectionOff);
                    if (!hint || !hint.displayParts)
                        continue;
                    // Make a one-liner
                    let text = hint.displayParts.map(d => d.text).join("").replace(/\r?\n\s*/g, " ");
                    if (text.length > 120)
                        text = text.slice(0, 119) + "...";
                    const inlay = {
                        // @ts-ignore
                        kind: 0,
                        position: new sandbox.monaco.Position(endPos.lineNumber, endPos.column + 1),
                        label: text,
                        paddingLeft: true,
                    };
                    results.push(inlay);
                }
                return {
                    hints: results,
                    dispose: () => { },
                };
            }),
        };
        return provider;
    };
    exports.createTwoslashInlayProvider = createTwoslashInlayProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHdvc2xhc2hJbmxheXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy90d29zbGFzaElubGF5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0lBRU8sTUFBTSwyQkFBMkIsR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtRQUM5RCxNQUFNLFFBQVEsR0FBeUQ7WUFDckUsaUJBQWlCLEVBQUUsQ0FBTyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUM1QyxNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7Z0JBQzdCLE1BQU0sVUFBVSxHQUFHLG9CQUFvQixDQUFBO2dCQUN2QyxJQUFJLEtBQUssQ0FBQTtnQkFDVCxNQUFNLE9BQU8sR0FBa0QsRUFBRSxDQUFBO2dCQUNqRSxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO2dCQUMvQyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUN2QixPQUFPO3dCQUNMLEtBQUssRUFBRSxFQUFFO3dCQUNULE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO3FCQUNsQixDQUFBO2dCQUNILENBQUM7Z0JBRUQsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ2hELE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7b0JBQzdDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUE7b0JBQ3ZDLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO29CQUN2RixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFBO29CQUV0RCxJQUFJLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO3dCQUNuQyxPQUFPOzRCQUNMLEtBQUssRUFBRSxFQUFFOzRCQUNULE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDO3lCQUNsQixDQUFBO29CQUNILENBQUM7b0JBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsc0JBQXNCLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFBO29CQUMzRixJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVk7d0JBQUUsU0FBUTtvQkFFekMsbUJBQW1CO29CQUNuQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQTtvQkFDaEYsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUc7d0JBQUUsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtvQkFFeEQsTUFBTSxLQUFLLEdBQWdEO3dCQUN6RCxhQUFhO3dCQUNiLElBQUksRUFBRSxDQUFDO3dCQUNQLFFBQVEsRUFBRSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7d0JBQzNFLEtBQUssRUFBRSxJQUFJO3dCQUNYLFdBQVcsRUFBRSxJQUFJO3FCQUNsQixDQUFBO29CQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQ3JCLENBQUM7Z0JBQ0QsT0FBTztvQkFDTCxLQUFLLEVBQUUsT0FBTztvQkFDZCxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUUsQ0FBQztpQkFDbEIsQ0FBQTtZQUNILENBQUMsQ0FBQTtTQUNGLENBQUE7UUFDRCxPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDLENBQUE7SUFuRFksUUFBQSwyQkFBMkIsK0JBbUR2QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNhbmRib3ggfSBmcm9tIFwiQHR5cGVzY3JpcHQvc2FuZGJveFwiXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVUd29zbGFzaElubGF5UHJvdmlkZXIgPSAoc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBjb25zdCBwcm92aWRlcjogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5sYW5ndWFnZXMuSW5sYXlIaW50c1Byb3ZpZGVyID0ge1xuICAgIHByb3ZpZGVJbmxheUhpbnRzOiBhc3luYyAobW9kZWwsIF8sIGNhbmNlbCkgPT4ge1xuICAgICAgY29uc3QgdGV4dCA9IG1vZGVsLmdldFZhbHVlKClcbiAgICAgIGNvbnN0IHF1ZXJ5UmVnZXggPSAvXlxccypcXC9cXC9cXHMqXFxeXFw/JC9nbVxuICAgICAgbGV0IG1hdGNoXG4gICAgICBjb25zdCByZXN1bHRzOiBpbXBvcnQoXCJtb25hY28tZWRpdG9yXCIpLmxhbmd1YWdlcy5JbmxheUhpbnRbXSA9IFtdXG4gICAgICBjb25zdCB3b3JrZXIgPSBhd2FpdCBzYW5kYm94LmdldFdvcmtlclByb2Nlc3MoKVxuICAgICAgaWYgKG1vZGVsLmlzRGlzcG9zZWQoKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGhpbnRzOiBbXSxcbiAgICAgICAgICBkaXNwb3NlOiAoKSA9PiB7fSxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB3aGlsZSAoKG1hdGNoID0gcXVlcnlSZWdleC5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgICAgICBjb25zdCBlbmQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCAtIDFcbiAgICAgICAgY29uc3QgZW5kUG9zID0gbW9kZWwuZ2V0UG9zaXRpb25BdChlbmQpXG4gICAgICAgIGNvbnN0IGluc3BlY3Rpb25Qb3MgPSBuZXcgc2FuZGJveC5tb25hY28uUG9zaXRpb24oZW5kUG9zLmxpbmVOdW1iZXIgLSAxLCBlbmRQb3MuY29sdW1uKVxuICAgICAgICBjb25zdCBpbnNwZWN0aW9uT2ZmID0gbW9kZWwuZ2V0T2Zmc2V0QXQoaW5zcGVjdGlvblBvcylcblxuICAgICAgICBpZiAoY2FuY2VsLmlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGhpbnRzOiBbXSxcbiAgICAgICAgICAgIGRpc3Bvc2U6ICgpID0+IHt9LFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhpbnQgPSBhd2FpdCB3b3JrZXIuZ2V0UXVpY2tJbmZvQXRQb3NpdGlvbihcImZpbGU6Ly9cIiArIG1vZGVsLnVyaS5wYXRoLCBpbnNwZWN0aW9uT2ZmKVxuICAgICAgICBpZiAoIWhpbnQgfHwgIWhpbnQuZGlzcGxheVBhcnRzKSBjb250aW51ZVxuXG4gICAgICAgIC8vIE1ha2UgYSBvbmUtbGluZXJcbiAgICAgICAgbGV0IHRleHQgPSBoaW50LmRpc3BsYXlQYXJ0cy5tYXAoZCA9PiBkLnRleHQpLmpvaW4oXCJcIikucmVwbGFjZSgvXFxyP1xcblxccyovZywgXCIgXCIpXG4gICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDEyMCkgdGV4dCA9IHRleHQuc2xpY2UoMCwgMTE5KSArIFwiLi4uXCJcblxuICAgICAgICBjb25zdCBpbmxheTogaW1wb3J0KFwibW9uYWNvLWVkaXRvclwiKS5sYW5ndWFnZXMuSW5sYXlIaW50ID0ge1xuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBraW5kOiAwLFxuICAgICAgICAgIHBvc2l0aW9uOiBuZXcgc2FuZGJveC5tb25hY28uUG9zaXRpb24oZW5kUG9zLmxpbmVOdW1iZXIsIGVuZFBvcy5jb2x1bW4gKyAxKSxcbiAgICAgICAgICBsYWJlbDogdGV4dCxcbiAgICAgICAgICBwYWRkaW5nTGVmdDogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgICByZXN1bHRzLnB1c2goaW5sYXkpXG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBoaW50czogcmVzdWx0cyxcbiAgICAgICAgZGlzcG9zZTogKCkgPT4ge30sXG4gICAgICB9XG4gICAgfSxcbiAgfVxuICByZXR1cm4gcHJvdmlkZXJcbn1cbiJdfQ==