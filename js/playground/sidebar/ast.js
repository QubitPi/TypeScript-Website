define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showASTPlugin = void 0;
    const showASTPlugin = (i, utils) => {
        let container;
        let ast;
        let disposable;
        const plugin = {
            id: "ast",
            displayName: "AST",
            willMount: (_, _container) => {
                container = _container;
            },
            didMount: (sandbox, container) => {
                // While this plugin is forefront, keep cursor changes in sync with the AST selection
                disposable = sandbox.editor.onDidChangeCursorPosition(e => {
                    var _a;
                    const cursorPos = sandbox.getModel().getOffsetAt(e.position);
                    const allTreeStarts = container.querySelectorAll("div.ast-tree-start");
                    let deepestElement = null;
                    allTreeStarts.forEach(e => {
                        // Close them all first, because we're about to open them up after
                        e.classList.remove("open");
                        // Find the deepest element in the set and open it up
                        const { pos, end, depth } = e.dataset;
                        const nPos = Number(pos);
                        const nEnd = Number(end);
                        if (cursorPos > nPos && cursorPos <= nEnd) {
                            if (deepestElement) {
                                const currentDepth = Number(deepestElement.dataset.depth);
                                if (currentDepth < Number(depth)) {
                                    deepestElement = e;
                                }
                            }
                            else {
                                deepestElement = e;
                            }
                        }
                    });
                    // Take that element, open it up, then go through its ancestors till they are all opened
                    let openUpElement = deepestElement;
                    while (openUpElement) {
                        openUpElement.classList.add("open");
                        openUpElement = (_a = openUpElement.parentElement) === null || _a === void 0 ? void 0 : _a.closest(".ast-tree-start");
                    }
                    // Scroll and flash to let folks see what's happening
                    deepestElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
                    utils.flashHTMLElement(deepestElement);
                });
            },
            modelChangedDebounce: sandbox => {
                const ds = utils.createDesignSystem(container);
                ds.clear();
                ds.title("AST");
                sandbox.getAST().then(tree => {
                    ast = ds.createASTTree(tree);
                });
            },
            didUnmount: () => {
                disposable && disposable.dispose();
            },
        };
        return plugin;
    };
    exports.showASTPlugin = showASTPlugin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcGxheWdyb3VuZC9zcmMvc2lkZWJhci9hc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztJQUdPLE1BQU0sYUFBYSxHQUFrQixDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUN2RCxJQUFJLFNBQXNCLENBQUE7UUFDMUIsSUFBSSxHQUFnQixDQUFBO1FBQ3BCLElBQUksVUFBbUMsQ0FBQTtRQUV2QyxNQUFNLE1BQU0sR0FBcUI7WUFDL0IsRUFBRSxFQUFFLEtBQUs7WUFDVCxXQUFXLEVBQUUsS0FBSztZQUNsQixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUU7Z0JBQzNCLFNBQVMsR0FBRyxVQUFVLENBQUE7WUFDeEIsQ0FBQztZQUNELFFBQVEsRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDL0IscUZBQXFGO2dCQUVyRixVQUFVLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsRUFBRTs7b0JBQ3hELE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFBO29CQUM1RCxNQUFNLGFBQWEsR0FBSSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQTZCLENBQUE7b0JBRW5HLElBQUksY0FBYyxHQUFtQixJQUFXLENBQUE7b0JBRWhELGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7d0JBQ3hCLGtFQUFrRTt3QkFDbEUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7d0JBRTFCLHFEQUFxRDt3QkFDckQsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQXNELENBQUE7d0JBQ3BGLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTt3QkFDeEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO3dCQUV4QixJQUFJLFNBQVMsR0FBRyxJQUFJLElBQUksU0FBUyxJQUFJLElBQUksRUFBRSxDQUFDOzRCQUMxQyxJQUFJLGNBQWMsRUFBRSxDQUFDO2dDQUNuQixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsY0FBZSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQ0FDMUQsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0NBQ2pDLGNBQWMsR0FBRyxDQUFDLENBQUE7Z0NBQ3BCLENBQUM7NEJBQ0gsQ0FBQztpQ0FBTSxDQUFDO2dDQUNOLGNBQWMsR0FBRyxDQUFDLENBQUE7NEJBQ3BCLENBQUM7d0JBQ0gsQ0FBQztvQkFDSCxDQUFDLENBQUMsQ0FBQTtvQkFFRix3RkFBd0Y7b0JBQ3hGLElBQUksYUFBYSxHQUFzQyxjQUFjLENBQUE7b0JBQ3JFLE9BQU8sYUFBYSxFQUFFLENBQUM7d0JBQ3JCLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO3dCQUNuQyxhQUFhLEdBQUcsTUFBQSxhQUFhLENBQUMsYUFBYSwwQ0FBRSxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtvQkFDekUsQ0FBQztvQkFFRCxxREFBcUQ7b0JBQ3JELGNBQWMsQ0FBQyxjQUFjLENBQUMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFBO29CQUN2RSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUE7Z0JBQ3hDLENBQUMsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUNELG9CQUFvQixFQUFFLE9BQU8sQ0FBQyxFQUFFO2dCQUM5QixNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUE7Z0JBQzlDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtnQkFDVixFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUVmLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzNCLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUM5QixDQUFDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFDRCxVQUFVLEVBQUUsR0FBRyxFQUFFO2dCQUNmLFVBQVUsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUE7WUFDcEMsQ0FBQztTQUNGLENBQUE7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUMsQ0FBQTtJQXBFWSxRQUFBLGFBQWEsaUJBb0V6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBsYXlncm91bmRQbHVnaW4sIFBsdWdpbkZhY3RvcnkgfSBmcm9tIFwiLi5cIlxuaW1wb3J0IHR5cGUgeyBJRGlzcG9zYWJsZSB9IGZyb20gXCJtb25hY28tZWRpdG9yXCJcblxuZXhwb3J0IGNvbnN0IHNob3dBU1RQbHVnaW46IFBsdWdpbkZhY3RvcnkgPSAoaSwgdXRpbHMpID0+IHtcbiAgbGV0IGNvbnRhaW5lcjogSFRNTEVsZW1lbnRcbiAgbGV0IGFzdDogSFRNTEVsZW1lbnRcbiAgbGV0IGRpc3Bvc2FibGU6IElEaXNwb3NhYmxlIHwgdW5kZWZpbmVkXG5cbiAgY29uc3QgcGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luID0ge1xuICAgIGlkOiBcImFzdFwiLFxuICAgIGRpc3BsYXlOYW1lOiBcIkFTVFwiLFxuICAgIHdpbGxNb3VudDogKF8sIF9jb250YWluZXIpID0+IHtcbiAgICAgIGNvbnRhaW5lciA9IF9jb250YWluZXJcbiAgICB9LFxuICAgIGRpZE1vdW50OiAoc2FuZGJveCwgY29udGFpbmVyKSA9PiB7XG4gICAgICAvLyBXaGlsZSB0aGlzIHBsdWdpbiBpcyBmb3JlZnJvbnQsIGtlZXAgY3Vyc29yIGNoYW5nZXMgaW4gc3luYyB3aXRoIHRoZSBBU1Qgc2VsZWN0aW9uXG5cbiAgICAgIGRpc3Bvc2FibGUgPSBzYW5kYm94LmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGUgPT4ge1xuICAgICAgICBjb25zdCBjdXJzb3JQb3MgPSBzYW5kYm94LmdldE1vZGVsKCkuZ2V0T2Zmc2V0QXQoZS5wb3NpdGlvbilcbiAgICAgICAgY29uc3QgYWxsVHJlZVN0YXJ0cyA9IChjb250YWluZXIucXVlcnlTZWxlY3RvckFsbChcImRpdi5hc3QtdHJlZS1zdGFydFwiKSBhcyBhbnkpIGFzIEhUTUxEaXZFbGVtZW50W11cblxuICAgICAgICBsZXQgZGVlcGVzdEVsZW1lbnQ6IEhUTUxEaXZFbGVtZW50ID0gbnVsbCBhcyBhbnlcblxuICAgICAgICBhbGxUcmVlU3RhcnRzLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgLy8gQ2xvc2UgdGhlbSBhbGwgZmlyc3QsIGJlY2F1c2Ugd2UncmUgYWJvdXQgdG8gb3BlbiB0aGVtIHVwIGFmdGVyXG4gICAgICAgICAgZS5jbGFzc0xpc3QucmVtb3ZlKFwib3BlblwiKVxuXG4gICAgICAgICAgLy8gRmluZCB0aGUgZGVlcGVzdCBlbGVtZW50IGluIHRoZSBzZXQgYW5kIG9wZW4gaXQgdXBcbiAgICAgICAgICBjb25zdCB7IHBvcywgZW5kLCBkZXB0aCB9ID0gZS5kYXRhc2V0IGFzIHsgcG9zOiBzdHJpbmc7IGVuZDogc3RyaW5nOyBkZXB0aDogc3RyaW5nIH1cbiAgICAgICAgICBjb25zdCBuUG9zID0gTnVtYmVyKHBvcylcbiAgICAgICAgICBjb25zdCBuRW5kID0gTnVtYmVyKGVuZClcblxuICAgICAgICAgIGlmIChjdXJzb3JQb3MgPiBuUG9zICYmIGN1cnNvclBvcyA8PSBuRW5kKSB7XG4gICAgICAgICAgICBpZiAoZGVlcGVzdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgY29uc3QgY3VycmVudERlcHRoID0gTnVtYmVyKGRlZXBlc3RFbGVtZW50IS5kYXRhc2V0LmRlcHRoKVxuICAgICAgICAgICAgICBpZiAoY3VycmVudERlcHRoIDwgTnVtYmVyKGRlcHRoKSkge1xuICAgICAgICAgICAgICAgIGRlZXBlc3RFbGVtZW50ID0gZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBkZWVwZXN0RWxlbWVudCA9IGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gVGFrZSB0aGF0IGVsZW1lbnQsIG9wZW4gaXQgdXAsIHRoZW4gZ28gdGhyb3VnaCBpdHMgYW5jZXN0b3JzIHRpbGwgdGhleSBhcmUgYWxsIG9wZW5lZFxuICAgICAgICBsZXQgb3BlblVwRWxlbWVudDogSFRNTERpdkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkID0gZGVlcGVzdEVsZW1lbnRcbiAgICAgICAgd2hpbGUgKG9wZW5VcEVsZW1lbnQpIHtcbiAgICAgICAgICBvcGVuVXBFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJvcGVuXCIpXG4gICAgICAgICAgb3BlblVwRWxlbWVudCA9IG9wZW5VcEVsZW1lbnQucGFyZW50RWxlbWVudD8uY2xvc2VzdChcIi5hc3QtdHJlZS1zdGFydFwiKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2Nyb2xsIGFuZCBmbGFzaCB0byBsZXQgZm9sa3Mgc2VlIHdoYXQncyBoYXBwZW5pbmdcbiAgICAgICAgZGVlcGVzdEVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoeyBibG9jazogXCJuZWFyZXN0XCIsIGJlaGF2aW9yOiBcInNtb290aFwiIH0pXG4gICAgICAgIHV0aWxzLmZsYXNoSFRNTEVsZW1lbnQoZGVlcGVzdEVsZW1lbnQpXG4gICAgICB9KVxuICAgIH0sXG4gICAgbW9kZWxDaGFuZ2VkRGVib3VuY2U6IHNhbmRib3ggPT4ge1xuICAgICAgY29uc3QgZHMgPSB1dGlscy5jcmVhdGVEZXNpZ25TeXN0ZW0oY29udGFpbmVyKVxuICAgICAgZHMuY2xlYXIoKVxuICAgICAgZHMudGl0bGUoXCJBU1RcIilcblxuICAgICAgc2FuZGJveC5nZXRBU1QoKS50aGVuKHRyZWUgPT4ge1xuICAgICAgICBhc3QgPSBkcy5jcmVhdGVBU1RUcmVlKHRyZWUpXG4gICAgICB9KVxuICAgIH0sXG4gICAgZGlkVW5tb3VudDogKCkgPT4ge1xuICAgICAgZGlzcG9zYWJsZSAmJiBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIH0sXG4gIH1cblxuICByZXR1cm4gcGx1Z2luXG59XG4iXX0=