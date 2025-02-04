define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createUI = void 0;
    const createUI = () => {
        const flashInfo = (message, timeout = 1000) => {
            var _a;
            let flashBG = document.getElementById("flash-bg");
            if (flashBG) {
                (_a = flashBG.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(flashBG);
            }
            flashBG = document.createElement("div");
            flashBG.id = "flash-bg";
            const p = document.createElement("p");
            p.textContent = message;
            flashBG.appendChild(p);
            document.body.appendChild(flashBG);
            setTimeout(() => {
                var _a;
                (_a = flashBG === null || flashBG === void 0 ? void 0 : flashBG.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(flashBG);
            }, timeout);
        };
        const createModalOverlay = (postFocalElement, classList) => {
            document.querySelectorAll(".navbar-sub li.open").forEach(i => i.classList.remove("open"));
            const existingPopover = document.getElementById("popover-modal");
            if (existingPopover)
                existingPopover.parentElement.removeChild(existingPopover);
            const modalBG = document.createElement("div");
            modalBG.id = "popover-background";
            document.body.appendChild(modalBG);
            const modal = document.createElement("div");
            modal.id = "popover-modal";
            if (classList)
                modal.className = classList;
            const closeButton = document.createElement("button");
            closeButton.innerText = "Close";
            closeButton.classList.add("close");
            closeButton.tabIndex = 1;
            modal.appendChild(closeButton);
            const oldOnkeyDown = document.onkeydown;
            const close = () => {
                modalBG.parentNode.removeChild(modalBG);
                modal.parentNode.removeChild(modal);
                // @ts-ignore
                document.onkeydown = oldOnkeyDown;
                postFocalElement.focus();
            };
            modalBG.onclick = close;
            closeButton.onclick = close;
            // Support hiding the modal via escape
            document.onkeydown = whenEscape(close);
            document.body.appendChild(modal);
            return modal;
        };
        /** For showing a lot of code */
        const showModal = (code, postFocalElement, subtitle, links, event) => {
            const modal = createModalOverlay(postFocalElement);
            // I've not been able to get this to work in a way which
            // works with every screenreader and browser combination, so
            // instead I'm dropping the feature.
            const isNotMouse = false; //  event && event.screenX === 0 && event.screenY === 0
            if (subtitle) {
                const titleElement = document.createElement("h3");
                titleElement.textContent = subtitle;
                setTimeout(() => {
                    titleElement.setAttribute("role", "alert");
                }, 100);
                modal.appendChild(titleElement);
            }
            const textarea = document.createElement("textarea");
            textarea.readOnly = true;
            textarea.wrap = "off";
            textarea.style.marginBottom = "20px";
            modal.appendChild(textarea);
            textarea.textContent = code;
            textarea.rows = 60;
            const buttonContainer = document.createElement("div");
            const copyButton = document.createElement("button");
            copyButton.innerText = "Copy";
            buttonContainer.appendChild(copyButton);
            const selectAllButton = document.createElement("button");
            selectAllButton.innerText = "Select All";
            buttonContainer.appendChild(selectAllButton);
            modal.appendChild(buttonContainer);
            const close = modal.querySelector(".close");
            close.addEventListener("keydown", e => {
                if (e.key === "Tab") {
                    ;
                    modal.querySelector("textarea").focus();
                    e.preventDefault();
                }
            });
            if (links) {
                Object.keys(links).forEach(name => {
                    const href = links[name];
                    const extraButton = document.createElement("button");
                    extraButton.innerText = name;
                    extraButton.onclick = () => (document.location = href);
                    buttonContainer.appendChild(extraButton);
                });
            }
            const selectAll = () => {
                textarea.select();
            };
            const shouldAutoSelect = !isNotMouse;
            if (shouldAutoSelect) {
                selectAll();
            }
            else {
                textarea.focus();
            }
            const buttons = modal.querySelectorAll("button");
            const lastButton = buttons.item(buttons.length - 1);
            lastButton.addEventListener("keydown", e => {
                if (e.key === "Tab") {
                    ;
                    document.querySelector(".close").focus();
                    e.preventDefault();
                }
            });
            selectAllButton.onclick = selectAll;
            copyButton.onclick = () => {
                navigator.clipboard.writeText(code);
            };
        };
        return {
            createModalOverlay,
            showModal,
            flashInfo,
        };
    };
    exports.createUI = createUI;
    /**
     * Runs the closure when escape is tapped
     * @param func closure to run on escape being pressed
     */
    const whenEscape = (func) => (event) => {
        const evt = event || window.event;
        let isEscape = false;
        if ("key" in evt) {
            isEscape = evt.key === "Escape" || evt.key === "Esc";
        }
        else {
            // @ts-ignore - this used to be the case
            isEscape = evt.keyCode === 27;
        }
        if (isEscape) {
            func();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlVUkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9jcmVhdGVVSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBZU8sTUFBTSxRQUFRLEdBQUcsR0FBTyxFQUFFO1FBQy9CLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBZSxFQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUUsRUFBRTs7WUFDcEQsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQTtZQUNqRCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNaLE1BQUEsT0FBTyxDQUFDLGFBQWEsMENBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQzdDLENBQUM7WUFFRCxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUN2QyxPQUFPLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQTtZQUV2QixNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3JDLENBQUMsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFBO1lBQ3ZCLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdEIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFbEMsVUFBVSxDQUFDLEdBQUcsRUFBRTs7Z0JBQ2QsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsYUFBYSwwQ0FBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDOUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ2IsQ0FBQyxDQUFBO1FBRUQsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLGdCQUE2QixFQUFFLFNBQWtCLEVBQUUsRUFBRTtZQUMvRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxPQUFPLENB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QUFBO2dCQUNwQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUE7WUFFRixlQUFlLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQTtZQUNuQyxVQUFVLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRTtnQkFDeEIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDckMsQ0FBQyxDQUFBO1FBQ0gsQ0FBQyxDQUFBO1FBRUQsT0FBTztZQUNMLGtCQUFrQjtZQUNsQixTQUFTO1lBQ1QsU0FBUztTQUNWLENBQUE7SUFDSCxDQUFDLENBQUE7SUF6SlksUUFBQSxRQUFRLFlBeUpwQjtJQUVEOzs7T0FHRztJQUNILE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBZ0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFvQixFQUFFLEVBQUU7UUFDaEUsTUFBTSxHQUFHLEdBQUcsS0FBSyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUE7UUFDakMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLElBQUksS0FBSyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2pCLFFBQVEsR0FBRyxHQUFHLENBQUMsR0FBRyxLQUFLLFFBQVEsSUFBSSxHQUFHLENBQUMsR0FBRyxLQUFLLEtBQUssQ0FBQTtRQUN0RCxDQUFDO2FBQU0sQ0FBQztZQUNOLHdDQUF3QztZQUN4QyxRQUFRLEdBQUcsR0FBRyxDQUFDLE9BQU8sS0FBSyxFQUFFLENBQUE7UUFDL0IsQ0FBQztRQUNELElBQUksUUFBUSxFQUFFLENBQUM7WUFDYixJQUFJLEVBQUUsQ0FBQTtRQUNSLENBQUM7SUFDSCxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIFVJIHtcbiAgLyoqIFNob3cgYSB0ZXh0IG1vZGFsLCB3aXRoIHNvbWUgYnV0dG9ucyAqL1xuICBzaG93TW9kYWw6IChcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgcG9zdEZvY2FsRWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgc3VidGl0bGU/OiBzdHJpbmcsXG4gICAgYnV0dG9ucz86IHsgW3RleHQ6IHN0cmluZ106IHN0cmluZyB9LFxuICAgIGV2ZW50PzogUmVhY3QuTW91c2VFdmVudFxuICApID0+IHZvaWRcbiAgLyoqIEEgcXVpY2sgZmxhc2ggb2Ygc29tZSB0ZXh0ICovXG4gIGZsYXNoSW5mbzogKG1lc3NhZ2U6IHN0cmluZywgdGltZT86IG51bWJlcikgPT4gdm9pZFxuICAvKiogQ3JlYXRlcyBhIG1vZGFsIGNvbnRhaW5lciB3aGljaCB5b3UgY2FuIHB1dCB5b3VyIG93biBET00gZWxlbWVudHMgaW5zaWRlICovXG4gIGNyZWF0ZU1vZGFsT3ZlcmxheTogKHBvc3RGb2NhbEVsZW1lbnQ6IEhUTUxFbGVtZW50LCBjbGFzc2VzPzogc3RyaW5nKSA9PiBIVE1MRGl2RWxlbWVudFxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlVUkgPSAoKTogVUkgPT4ge1xuICBjb25zdCBmbGFzaEluZm8gPSAobWVzc2FnZTogc3RyaW5nLCB0aW1lb3V0ID0gMTAwMCkgPT4ge1xuICAgIGxldCBmbGFzaEJHID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmbGFzaC1iZ1wiKVxuICAgIGlmIChmbGFzaEJHKSB7XG4gICAgICBmbGFzaEJHLnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGZsYXNoQkcpXG4gICAgfVxuXG4gICAgZmxhc2hCRyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICBmbGFzaEJHLmlkID0gXCJmbGFzaC1iZ1wiXG5cbiAgICBjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIilcbiAgICBwLnRleHRDb250ZW50ID0gbWVzc2FnZVxuICAgIGZsYXNoQkcuYXBwZW5kQ2hpbGQocClcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGZsYXNoQkcpXG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGZsYXNoQkc/LnBhcmVudEVsZW1lbnQ/LnJlbW92ZUNoaWxkKGZsYXNoQkcpXG4gICAgfSwgdGltZW91dClcbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZU1vZGFsT3ZlcmxheSA9IChwb3N0Rm9jYWxFbGVtZW50OiBIVE1MRWxlbWVudCwgY2xhc3NMaXN0Pzogc3RyaW5nKSA9PiB7XG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5uYXZiYXItc3ViIGxpLm9wZW5cIikuZm9yRWFjaChpID0+IGkuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5cIikpXG5cbiAgICBjb25zdCBleGlzdGluZ1BvcG92ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvcG92ZXItbW9kYWxcIilcbiAgICBpZiAoZXhpc3RpbmdQb3BvdmVyKSBleGlzdGluZ1BvcG92ZXIucGFyZW50RWxlbWVudCEucmVtb3ZlQ2hpbGQoZXhpc3RpbmdQb3BvdmVyKVxuXG4gICAgY29uc3QgbW9kYWxCRyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgICBtb2RhbEJHLmlkID0gXCJwb3BvdmVyLWJhY2tncm91bmRcIlxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobW9kYWxCRylcblxuICAgIGNvbnN0IG1vZGFsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICAgIG1vZGFsLmlkID0gXCJwb3BvdmVyLW1vZGFsXCJcbiAgICBpZiAoY2xhc3NMaXN0KSBtb2RhbC5jbGFzc05hbWUgPSBjbGFzc0xpc3RcblxuICAgIGNvbnN0IGNsb3NlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKVxuICAgIGNsb3NlQnV0dG9uLmlubmVyVGV4dCA9IFwiQ2xvc2VcIlxuICAgIGNsb3NlQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJjbG9zZVwiKVxuICAgIGNsb3NlQnV0dG9uLnRhYkluZGV4ID0gMVxuICAgIG1vZGFsLmFwcGVuZENoaWxkKGNsb3NlQnV0dG9uKVxuXG4gICAgY29uc3Qgb2xkT25rZXlEb3duID0gZG9jdW1lbnQub25rZXlkb3duXG5cbiAgICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICAgIG1vZGFsQkcucGFyZW50Tm9kZSEucmVtb3ZlQ2hpbGQobW9kYWxCRylcbiAgICAgIG1vZGFsLnBhcmVudE5vZGUhLnJlbW92ZUNoaWxkKG1vZGFsKVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgZG9jdW1lbnQub25rZXlkb3duID0gb2xkT25rZXlEb3duXG4gICAgICBwb3N0Rm9jYWxFbGVtZW50LmZvY3VzKClcbiAgICB9XG5cbiAgICBtb2RhbEJHLm9uY2xpY2sgPSBjbG9zZVxuICAgIGNsb3NlQnV0dG9uLm9uY2xpY2sgPSBjbG9zZVxuXG4gICAgLy8gU3VwcG9ydCBoaWRpbmcgdGhlIG1vZGFsIHZpYSBlc2NhcGVcbiAgICBkb2N1bWVudC5vbmtleWRvd24gPSB3aGVuRXNjYXBlKGNsb3NlKVxuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChtb2RhbClcblxuICAgIHJldHVybiBtb2RhbFxuICB9XG5cbiAgLyoqIEZvciBzaG93aW5nIGEgbG90IG9mIGNvZGUgKi9cbiAgY29uc3Qgc2hvd01vZGFsID0gKFxuICAgIGNvZGU6IHN0cmluZyxcbiAgICBwb3N0Rm9jYWxFbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBzdWJ0aXRsZT86IHN0cmluZyxcbiAgICBsaW5rcz86IHsgW3RleHQ6IHN0cmluZ106IHN0cmluZyB9LFxuICAgIGV2ZW50PzogUmVhY3QuTW91c2VFdmVudFxuICApID0+IHtcbiAgICBjb25zdCBtb2RhbCA9IGNyZWF0ZU1vZGFsT3ZlcmxheShwb3N0Rm9jYWxFbGVtZW50KVxuICAgIC8vIEkndmUgbm90IGJlZW4gYWJsZSB0byBnZXQgdGhpcyB0byB3b3JrIGluIGEgd2F5IHdoaWNoXG4gICAgLy8gd29ya3Mgd2l0aCBldmVyeSBzY3JlZW5yZWFkZXIgYW5kIGJyb3dzZXIgY29tYmluYXRpb24sIHNvXG4gICAgLy8gaW5zdGVhZCBJJ20gZHJvcHBpbmcgdGhlIGZlYXR1cmUuXG5cbiAgICBjb25zdCBpc05vdE1vdXNlID0gZmFsc2UgLy8gIGV2ZW50ICYmIGV2ZW50LnNjcmVlblggPT09IDAgJiYgZXZlbnQuc2NyZWVuWSA9PT0gMFxuXG4gICAgaWYgKHN1YnRpdGxlKSB7XG4gICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDNcIilcbiAgICAgIHRpdGxlRWxlbWVudC50ZXh0Q29udGVudCA9IHN1YnRpdGxlXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGl0bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJhbGVydFwiKVxuICAgICAgfSwgMTAwKVxuICAgICAgbW9kYWwuYXBwZW5kQ2hpbGQodGl0bGVFbGVtZW50KVxuICAgIH1cblxuICAgIGNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpXG4gICAgdGV4dGFyZWEucmVhZE9ubHkgPSB0cnVlXG4gICAgdGV4dGFyZWEud3JhcCA9IFwib2ZmXCJcbiAgICB0ZXh0YXJlYS5zdHlsZS5tYXJnaW5Cb3R0b20gPSBcIjIwcHhcIlxuICAgIG1vZGFsLmFwcGVuZENoaWxkKHRleHRhcmVhKVxuICAgIHRleHRhcmVhLnRleHRDb250ZW50ID0gY29kZVxuICAgIHRleHRhcmVhLnJvd3MgPSA2MFxuXG4gICAgY29uc3QgYnV0dG9uQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXG4gICAgY29uc3QgY29weUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIilcbiAgICBjb3B5QnV0dG9uLmlubmVyVGV4dCA9IFwiQ29weVwiXG4gICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKGNvcHlCdXR0b24pXG5cbiAgICBjb25zdCBzZWxlY3RBbGxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpXG4gICAgc2VsZWN0QWxsQnV0dG9uLmlubmVyVGV4dCA9IFwiU2VsZWN0IEFsbFwiXG4gICAgYnV0dG9uQ29udGFpbmVyLmFwcGVuZENoaWxkKHNlbGVjdEFsbEJ1dHRvbilcblxuICAgIG1vZGFsLmFwcGVuZENoaWxkKGJ1dHRvbkNvbnRhaW5lcilcbiAgICBjb25zdCBjbG9zZSA9IG1vZGFsLnF1ZXJ5U2VsZWN0b3IoXCIuY2xvc2VcIikgYXMgSFRNTEVsZW1lbnRcbiAgICBjbG9zZS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBlID0+IHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJUYWJcIikge1xuICAgICAgICA7IChtb2RhbC5xdWVyeVNlbGVjdG9yKFwidGV4dGFyZWFcIikgYXMgYW55KS5mb2N1cygpXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiAobGlua3MpIHtcbiAgICAgIE9iamVjdC5rZXlzKGxpbmtzKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBocmVmID0gbGlua3NbbmFtZV1cbiAgICAgICAgY29uc3QgZXh0cmFCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpXG4gICAgICAgIGV4dHJhQnV0dG9uLmlubmVyVGV4dCA9IG5hbWVcbiAgICAgICAgZXh0cmFCdXR0b24ub25jbGljayA9ICgpID0+IChkb2N1bWVudC5sb2NhdGlvbiA9IGhyZWYgYXMgYW55KVxuICAgICAgICBidXR0b25Db250YWluZXIuYXBwZW5kQ2hpbGQoZXh0cmFCdXR0b24pXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IHNlbGVjdEFsbCA9ICgpID0+IHtcbiAgICAgIHRleHRhcmVhLnNlbGVjdCgpXG4gICAgfVxuXG4gICAgY29uc3Qgc2hvdWxkQXV0b1NlbGVjdCA9ICFpc05vdE1vdXNlXG4gICAgaWYgKHNob3VsZEF1dG9TZWxlY3QpIHtcbiAgICAgIHNlbGVjdEFsbCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRleHRhcmVhLmZvY3VzKClcbiAgICB9XG5cbiAgICBjb25zdCBidXR0b25zID0gbW9kYWwucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKVxuICAgIGNvbnN0IGxhc3RCdXR0b24gPSBidXR0b25zLml0ZW0oYnV0dG9ucy5sZW5ndGggLSAxKSBhcyBIVE1MRWxlbWVudFxuICAgIGxhc3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiVGFiXCIpIHtcbiAgICAgICAgOyAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5jbG9zZVwiKSBhcyBhbnkpLmZvY3VzKClcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICB9XG4gICAgfSlcblxuICAgIHNlbGVjdEFsbEJ1dHRvbi5vbmNsaWNrID0gc2VsZWN0QWxsXG4gICAgY29weUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY29kZSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNyZWF0ZU1vZGFsT3ZlcmxheSxcbiAgICBzaG93TW9kYWwsXG4gICAgZmxhc2hJbmZvLFxuICB9XG59XG5cbi8qKlxuICogUnVucyB0aGUgY2xvc3VyZSB3aGVuIGVzY2FwZSBpcyB0YXBwZWRcbiAqIEBwYXJhbSBmdW5jIGNsb3N1cmUgdG8gcnVuIG9uIGVzY2FwZSBiZWluZyBwcmVzc2VkXG4gKi9cbmNvbnN0IHdoZW5Fc2NhcGUgPSAoZnVuYzogKCkgPT4gdm9pZCkgPT4gKGV2ZW50OiBLZXlib2FyZEV2ZW50KSA9PiB7XG4gIGNvbnN0IGV2dCA9IGV2ZW50IHx8IHdpbmRvdy5ldmVudFxuICBsZXQgaXNFc2NhcGUgPSBmYWxzZVxuICBpZiAoXCJrZXlcIiBpbiBldnQpIHtcbiAgICBpc0VzY2FwZSA9IGV2dC5rZXkgPT09IFwiRXNjYXBlXCIgfHwgZXZ0LmtleSA9PT0gXCJFc2NcIlxuICB9IGVsc2Uge1xuICAgIC8vIEB0cy1pZ25vcmUgLSB0aGlzIHVzZWQgdG8gYmUgdGhlIGNhc2VcbiAgICBpc0VzY2FwZSA9IGV2dC5rZXlDb2RlID09PSAyN1xuICB9XG4gIGlmIChpc0VzY2FwZSkge1xuICAgIGZ1bmMoKVxuICB9XG59XG4iXX0=