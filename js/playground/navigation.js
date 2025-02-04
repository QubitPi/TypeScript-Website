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
    exports.hideNavForHandbook = exports.showNavForHandbook = void 0;
    /** Use the handbook TOC which is injected into the globals to create a sidebar  */
    const showNavForHandbook = (sandbox, escapeFunction) => {
        // @ts-ignore
        const content = window.playgroundHandbookTOC.docs;
        const button = document.createElement("button");
        button.ariaLabel = "Close handbook";
        button.className = "examples-close";
        button.innerText = "Close";
        button.onclick = escapeFunction;
        const story = document.getElementById("editor-container");
        story === null || story === void 0 ? void 0 : story.appendChild(button);
        updateNavWithStoryContent("Handbook", content, "#handbook", sandbox);
        const nav = document.getElementById("navigation-container");
        if (nav)
            nav.classList.add("handbook");
    };
    exports.showNavForHandbook = showNavForHandbook;
    /**
     * Hides the nav and the close button, specifically only when we have
     * the handbook open and not when a gist is open
     */
    const hideNavForHandbook = (sandbox) => {
        const nav = document.getElementById("navigation-container");
        if (!nav)
            return;
        if (!nav.classList.contains("handbook"))
            return;
        nav.style.display = "none";
        const leftDrag = document.querySelector(".playground-dragbar.left");
        if (leftDrag)
            leftDrag.style.display = "none";
        const story = document.getElementById("editor-container");
        const possibleButtonToRemove = story === null || story === void 0 ? void 0 : story.querySelector("button");
        if (story && possibleButtonToRemove)
            story.removeChild(possibleButtonToRemove);
        showCode(sandbox);
    };
    exports.hideNavForHandbook = hideNavForHandbook;
    /**
     * Assumes a nav has been set up already, and then fills out the content of the nav bar
     * with clickable links for each potential story.
     */
    const updateNavWithStoryContent = (title, storyContent, prefix, sandbox) => {
        const nav = document.getElementById("navigation-container");
        if (!nav)
            return;
        while (nav.firstChild) {
            nav.removeChild(nav.firstChild);
        }
        const titleh4 = document.createElement("h4");
        titleh4.textContent = title;
        nav.appendChild(titleh4);
        // Make all the sidebar elements
        const ul = document.createElement("ul");
        storyContent.forEach((element, i) => {
            const li = document.createElement("li");
            switch (element.type) {
                case "html":
                case "href":
                case "code": {
                    li.classList.add("selectable");
                    const a = document.createElement("a");
                    let logo;
                    if (element.type === "code") {
                        logo = `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="7" height="7" fill="#187ABF"/></svg>`;
                    }
                    else if (element.type === "html") {
                        logo = `<svg width="9" height="11" viewBox="0 0 9 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5.5V3.25L6 1H4M8 5.5V10H1V1H4M8 5.5H4V1" stroke="#C4C4C4"/></svg>`;
                    }
                    else {
                        logo = "";
                    }
                    a.innerHTML = `${logo}${element.title}`;
                    a.href = `/play#${prefix}-${i}`;
                    a.onclick = e => {
                        e.preventDefault();
                        // Note: I'm not sure why this is needed?
                        const ed = sandbox.editor.getDomNode();
                        if (!ed)
                            return;
                        sandbox.editor.updateOptions({ readOnly: false });
                        const alreadySelected = ul.querySelector(".selected");
                        if (alreadySelected)
                            alreadySelected.classList.remove("selected");
                        li.classList.add("selected");
                        switch (element.type) {
                            case "code":
                                setCode(element.code, sandbox);
                                break;
                            case "html":
                                setStory(element.html, sandbox);
                                break;
                            case "href":
                                setStoryViaHref(element.href, sandbox);
                                break;
                        }
                        // Set the URL after selecting
                        const alwaysUpdateURL = !localStorage.getItem("disable-save-on-type");
                        if (alwaysUpdateURL) {
                            location.hash = `${prefix}-${i}`;
                        }
                        return false;
                    };
                    li.appendChild(a);
                    break;
                }
                case "hr": {
                    const hr = document.createElement("hr");
                    li.appendChild(hr);
                }
            }
            ul.appendChild(li);
        });
        nav.appendChild(ul);
        const pageID = location.hash.split("-")[1] || "";
        const index = Number(pageID) || 0;
        const targetedLi = ul.children.item(index) || ul.children.item(0);
        if (targetedLi) {
            const a = targetedLi.getElementsByTagName("a").item(0);
            // @ts-ignore
            if (a)
                a.click();
        }
    };
    // Use fetch to grab the HTML from a URL, with a special case
    // when that is a gatsby URL where we pull out the important
    // HTML from inside the __gatsby id.
    const setStoryViaHref = (href, sandbox) => {
        fetch(href).then((req) => __awaiter(void 0, void 0, void 0, function* () {
            if (req.ok) {
                const text = yield req.text();
                if (text.includes("___gatsby")) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/html");
                    const gatsby = doc.getElementById('___gatsby');
                    if (gatsby) {
                        gatsby.id = "___inner_g";
                        if (gatsby.firstChild && gatsby.firstChild.id === "gatsby-focus-wrapper") {
                            gatsby.firstChild.id = "gatsby-playground-handbook-inner";
                        }
                        setStory(gatsby, sandbox);
                    }
                    return;
                }
                if (document.location.host === "localhost:8000") {
                    setStory("<p>Because the gatsby dev server uses JS to build your pages, and not statically, the page will not load during dev. It does work in prod though - use <code>pnpm build-site</code> to test locally with a static build.</p>", sandbox);
                }
                else {
                    setStory(text, sandbox);
                }
            }
            else {
                setStory(`<p>Failed to load the content at ${href}. Reason: ${req.status} ${req.statusText}</p>`, sandbox);
            }
        }));
    };
    /**
     * Passing in either a root HTML element or the HTML for the story, present a
     * markdown doc as a 'story' inside the playground.
     */
    const setStory = (html, sandbox) => {
        const toolbar = document.getElementById("editor-toolbar");
        if (toolbar)
            toolbar.style.display = "none";
        const monaco = document.getElementById("monaco-editor-embed");
        if (monaco)
            monaco.style.display = "none";
        const story = document.getElementById("story-container");
        if (!story)
            return;
        story.style.display = "block";
        if (typeof html === "string") {
            story.innerHTML = html;
        }
        else {
            while (story.firstChild) {
                story.removeChild(story.firstChild);
            }
            story.appendChild(html);
        }
        // We need to hijack internal links
        for (const a of Array.from(story.getElementsByTagName("a"))) {
            if (!a.pathname.startsWith("/play"))
                continue;
            // Note the header generated links also count in here
            // overwrite playground links
            if (a.hash.includes("#code/")) {
                a.onclick = e => {
                    const code = a.hash.replace("#code/", "").trim();
                    let userCode = sandbox.lzstring.decompressFromEncodedURIComponent(code);
                    // Fallback incase there is an extra level of decoding:
                    // https://gitter.im/Microsoft/TypeScript?at=5dc478ab9c39821509ff189a
                    if (!userCode)
                        userCode = sandbox.lzstring.decompressFromEncodedURIComponent(decodeURIComponent(code));
                    if (userCode)
                        setCode(userCode, sandbox);
                    e.preventDefault();
                    const alreadySelected = document.getElementById("navigation-container").querySelector("li.selected");
                    if (alreadySelected)
                        alreadySelected.classList.remove("selected");
                    return false;
                };
            }
            // overwrite gist/handbook links
            else if (a.hash.includes("#handbook")) {
                a.onclick = e => {
                    const index = Number(a.hash.split("-")[1]);
                    const nav = document.getElementById("navigation-container");
                    if (!nav)
                        return;
                    const ul = nav.getElementsByTagName("ul").item(0);
                    const targetedLi = ul.children.item(Number(index) || 0) || ul.children.item(0);
                    if (targetedLi) {
                        const a = targetedLi.getElementsByTagName("a").item(0);
                        // @ts-ignore
                        if (a)
                            a.click();
                    }
                    e.preventDefault();
                    return false;
                };
            }
            else {
                a.setAttribute("target", "_blank");
            }
        }
    };
    const showCode = (sandbox) => {
        const story = document.getElementById("story-container");
        if (story)
            story.style.display = "none";
        const toolbar = document.getElementById("editor-toolbar");
        if (toolbar)
            toolbar.style.display = "block";
        const monaco = document.getElementById("monaco-editor-embed");
        if (monaco)
            monaco.style.display = "block";
        sandbox.editor.layout();
    };
    const setCode = (code, sandbox) => {
        sandbox.setText(code);
        showCode(sandbox);
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF2aWdhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL25hdmlnYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQVFBLG1GQUFtRjtJQUM1RSxNQUFNLGtCQUFrQixHQUFHLENBQUMsT0FBZ0IsRUFBRSxjQUEwQixFQUFFLEVBQUU7UUFDakYsYUFBYTtRQUNiLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUE7UUFFakQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUMvQyxNQUFNLENBQUMsU0FBUyxHQUFHLGdCQUFnQixDQUFBO1FBQ25DLE1BQU0sQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUE7UUFDbkMsTUFBTSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUE7UUFDMUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUE7UUFFL0IsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBQ3pELEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDMUIseUJBQXlCLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFFcEUsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQzNELElBQUksR0FBRztZQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO0lBQ3hDLENBQUMsQ0FBQTtJQWhCWSxRQUFBLGtCQUFrQixzQkFnQjlCO0lBRUQ7OztPQUdHO0lBQ0ksTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE9BQWdCLEVBQUUsRUFBRTtRQUNyRCxNQUFNLEdBQUcsR0FB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TztZQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUU1QyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFDN0QsSUFBSSxNQUFNO1lBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBRTFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDekIsQ0FBQyxDQUFBO0lBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxJQUFZLEVBQUUsT0FBZ0IsRUFBRSxFQUFFO1FBQ2pELE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDckIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ25CLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbInR5cGUgU3RvcnlDb250ZW50ID1cbiAgfCB7IHR5cGU6IFwiaHRtbFwiOyBodG1sOiBzdHJpbmc7IHRpdGxlOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogXCJocmVmXCI7IGhyZWY6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcImNvZGVcIjsgY29kZTogc3RyaW5nOyBwYXJhbXM6IHN0cmluZzsgdGl0bGU6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiBcImhyXCIgfVxuXG5pbXBvcnQgdHlwZSB7IFNhbmRib3ggfSBmcm9tIFwiQHR5cGVzY3JpcHQvc2FuZGJveFwiXG5cbi8qKiBVc2UgdGhlIGhhbmRib29rIFRPQyB3aGljaCBpcyBpbmplY3RlZCBpbnRvIHRoZSBnbG9iYWxzIHRvIGNyZWF0ZSBhIHNpZGViYXIgICovXG5leHBvcnQgY29uc3Qgc2hvd05hdkZvckhhbmRib29rID0gKHNhbmRib3g6IFNhbmRib3gsIGVzY2FwZUZ1bmN0aW9uOiAoKSA9PiB2b2lkKSA9PiB7XG4gIC8vIEB0cy1pZ25vcmVcbiAgY29uc3QgY29udGVudCA9IHdpbmRvdy5wbGF5Z3JvdW5kSGFuZGJvb2tUT0MuZG9jc1xuXG4gIGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIilcbiAgYnV0dG9uLmFyaWFMYWJlbCA9IFwiQ2xvc2UgaGFuZGJvb2tcIlxuICBidXR0b24uY2xhc3NOYW1lID0gXCJleGFtcGxlcy1jbG9zZVwiXG4gIGJ1dHRvbi5pbm5lclRleHQgPSBcIkNsb3NlXCJcbiAgYnV0dG9uLm9uY2xpY2sgPSBlc2NhcGVGdW5jdGlvblxuXG4gIGNvbnN0IHN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItY29udGFpbmVyXCIpXG4gIHN0b3J5Py5hcHBlbmRDaGlsZChidXR0b24pXG4gIHVwZGF0ZU5hdldpdGhTdG9yeUNvbnRlbnQoXCJIYW5kYm9va1wiLCBjb250ZW50LCBcIiNoYW5kYm9va1wiLCBzYW5kYm94KVxuXG4gIGNvbnN0IG5hdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvbi1jb250YWluZXJcIilcbiAgaWYgKG5hdikgbmF2LmNsYXNzTGlzdC5hZGQoXCJoYW5kYm9va1wiKVxufVxuXG4vKipcbiAqIEhpZGVzIHRoZSBuYXYgYW5kIHRoZSBjbG9zZSBidXR0b24sIHNwZWNpZmljYWxseSBvbmx5IHdoZW4gd2UgaGF2ZVxuICogdGhlIGhhbmRib29rIG9wZW4gYW5kIG5vdCB3aGVuIGEgZ2lzdCBpcyBvcGVuXG4gKi9cbmV4cG9ydCBjb25zdCBoaWRlTmF2Rm9ySGFuZGJvb2sgPSAoc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBjb25zdCBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmlnYXRpb24tY29udGFpbmVyXCIpXG4gIGlmICghbmF2KSByZXR1cm5cbiAgaWYgKCFuYXYuY2xhc3NMaXN0LmNvbnRhaW5zKFwiaGFuZGJvb2tcIikpIHJldHVyblxuXG4gIG5hdi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCBsZWZ0RHJhZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucGxheWdyb3VuZC1kcmFnYmFyLmxlZnRcIikgYXMgSFRNTEVsZW1lbnRcbiAgaWYgKGxlZnREcmFnKSBsZWZ0RHJhZy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCBzdG9yeSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZWRpdG9yLWNvbnRhaW5lclwiKVxuICBjb25zdCBwb3NzaWJsZUJ1dHRvblRvUmVtb3ZlID0gc3Rvcnk/LnF1ZXJ5U2VsZWN0b3IoXCJidXR0b25cIilcbiAgaWYgKHN0b3J5ICYmIHBvc3NpYmxlQnV0dG9uVG9SZW1vdmUpIHN0b3J5LnJlbW92ZUNoaWxkKHBvc3NpYmxlQnV0dG9uVG9SZW1vdmUpXG5cbiAgc2hvd0NvZGUoc2FuZGJveClcbn1cblxuLyoqXG4gKiBBc3N1bWVzIGEgbmF2IGhhcyBiZWVuIHNldCB1cCBhbHJlYWR5LCBhbmQgdGhlbiBmaWxscyBvdXQgdGhlIGNvbnRlbnQgb2YgdGhlIG5hdiBiYXJcbiAqIHdpdGggY2xpY2thYmxlIGxpbmtzIGZvciBlYWNoIHBvdGVudGlhbCBzdG9yeS5cbiAqL1xuY29uc3QgdXBkYXRlTmF2V2l0aFN0b3J5Q29udGVudCA9ICh0aXRsZTogc3RyaW5nLCBzdG9yeUNvbnRlbnQ6IFN0b3J5Q29udGVudFtdLCBwcmVmaXg6IHN0cmluZywgc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBjb25zdCBuYXYgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmlnYXRpb24tY29udGFpbmVyXCIpXG4gIGlmICghbmF2KSByZXR1cm5cblxuICB3aGlsZSAobmF2LmZpcnN0Q2hpbGQpIHtcbiAgICBuYXYucmVtb3ZlQ2hpbGQobmF2LmZpcnN0Q2hpbGQpXG4gIH1cblxuICBjb25zdCB0aXRsZWg0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImg0XCIpXG4gIHRpdGxlaDQudGV4dENvbnRlbnQgPSB0aXRsZVxuICBuYXYuYXBwZW5kQ2hpbGQodGl0bGVoNClcblxuICAvLyBNYWtlIGFsbCB0aGUgc2lkZWJhciBlbGVtZW50c1xuICBjb25zdCB1bCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKVxuICBzdG9yeUNvbnRlbnQuZm9yRWFjaCgoZWxlbWVudDogU3RvcnlDb250ZW50LCBpOiBudW1iZXIpID0+IHtcbiAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgY2FzZSBcImhyZWZcIjpcbiAgICAgIGNhc2UgXCJjb2RlXCI6IHtcbiAgICAgICAgbGkuY2xhc3NMaXN0LmFkZChcInNlbGVjdGFibGVcIilcbiAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpXG5cbiAgICAgICAgbGV0IGxvZ286IHN0cmluZ1xuICAgICAgICBpZiAoZWxlbWVudC50eXBlID09PSBcImNvZGVcIikge1xuICAgICAgICAgIGxvZ28gPSBgPHN2ZyB3aWR0aD1cIjdcIiBoZWlnaHQ9XCI3XCIgdmlld0JveD1cIjAgMCA3IDdcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cmVjdCB3aWR0aD1cIjdcIiBoZWlnaHQ9XCI3XCIgZmlsbD1cIiMxODdBQkZcIi8+PC9zdmc+YFxuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQudHlwZSA9PT0gXCJodG1sXCIpIHtcbiAgICAgICAgICBsb2dvID0gYDxzdmcgd2lkdGg9XCI5XCIgaGVpZ2h0PVwiMTFcIiB2aWV3Qm94PVwiMCAwIDkgMTFcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTggNS41VjMuMjVMNiAxSDRNOCA1LjVWMTBIMVYxSDRNOCA1LjVINFYxXCIgc3Ryb2tlPVwiI0M0QzRDNFwiLz48L3N2Zz5gXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nbyA9IFwiXCJcbiAgICAgICAgfVxuXG4gICAgICAgIGEuaW5uZXJIVE1MID0gYCR7bG9nb30ke2VsZW1lbnQudGl0bGV9YFxuICAgICAgICBhLmhyZWYgPSBgL3BsYXkjJHtwcmVmaXh9LSR7aX1gXG5cbiAgICAgICAgYS5vbmNsaWNrID0gZSA9PiB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICAgICAgICAvLyBOb3RlOiBJJ20gbm90IHN1cmUgd2h5IHRoaXMgaXMgbmVlZGVkP1xuICAgICAgICAgIGNvbnN0IGVkID0gc2FuZGJveC5lZGl0b3IuZ2V0RG9tTm9kZSgpXG4gICAgICAgICAgaWYgKCFlZCkgcmV0dXJuXG4gICAgICAgICAgc2FuZGJveC5lZGl0b3IudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KVxuXG4gICAgICAgICAgY29uc3QgYWxyZWFkeVNlbGVjdGVkID0gdWwucXVlcnlTZWxlY3RvcihcIi5zZWxlY3RlZFwiKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICAgIGlmIChhbHJlYWR5U2VsZWN0ZWQpIGFscmVhZHlTZWxlY3RlZC5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIilcblxuICAgICAgICAgIGxpLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RlZFwiKVxuICAgICAgICAgIHN3aXRjaCAoZWxlbWVudC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiY29kZVwiOlxuICAgICAgICAgICAgICBzZXRDb2RlKGVsZW1lbnQuY29kZSwgc2FuZGJveClcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaHRtbFwiOlxuICAgICAgICAgICAgICBzZXRTdG9yeShlbGVtZW50Lmh0bWwsIHNhbmRib3gpXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImhyZWZcIjpcbiAgICAgICAgICAgICAgc2V0U3RvcnlWaWFIcmVmKGVsZW1lbnQuaHJlZiwgc2FuZGJveClcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU2V0IHRoZSBVUkwgYWZ0ZXIgc2VsZWN0aW5nXG4gICAgICAgICAgY29uc3QgYWx3YXlzVXBkYXRlVVJMID0gIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiZGlzYWJsZS1zYXZlLW9uLXR5cGVcIilcbiAgICAgICAgICBpZiAoYWx3YXlzVXBkYXRlVVJMKSB7XG4gICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gYCR7cHJlZml4fS0ke2l9YFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBsaS5hcHBlbmRDaGlsZChhKVxuXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgICBjYXNlIFwiaHJcIjoge1xuICAgICAgICBjb25zdCBociA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoclwiKVxuICAgICAgICBsaS5hcHBlbmRDaGlsZChocilcbiAgICAgIH1cbiAgICB9XG4gICAgdWwuYXBwZW5kQ2hpbGQobGkpXG4gIH0pXG4gIG5hdi5hcHBlbmRDaGlsZCh1bClcblxuICBjb25zdCBwYWdlSUQgPSBsb2NhdGlvbi5oYXNoLnNwbGl0KFwiLVwiKVsxXSB8fCBcIlwiXG4gIGNvbnN0IGluZGV4ID0gTnVtYmVyKHBhZ2VJRCkgfHwgMFxuXG4gIGNvbnN0IHRhcmdldGVkTGkgPSB1bC5jaGlsZHJlbi5pdGVtKGluZGV4KSB8fCB1bC5jaGlsZHJlbi5pdGVtKDApXG4gIGlmICh0YXJnZXRlZExpKSB7XG4gICAgY29uc3QgYSA9IHRhcmdldGVkTGkuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJhXCIpLml0ZW0oMClcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKGEpIGEuY2xpY2soKVxuICB9XG59XG5cbi8vIFVzZSBmZXRjaCB0byBncmFiIHRoZSBIVE1MIGZyb20gYSBVUkwsIHdpdGggYSBzcGVjaWFsIGNhc2Vcbi8vIHdoZW4gdGhhdCBpcyBhIGdhdHNieSBVUkwgd2hlcmUgd2UgcHVsbCBvdXQgdGhlIGltcG9ydGFudFxuLy8gSFRNTCBmcm9tIGluc2lkZSB0aGUgX19nYXRzYnkgaWQuXG5jb25zdCBzZXRTdG9yeVZpYUhyZWYgPSAoaHJlZjogc3RyaW5nLCBzYW5kYm94OiBTYW5kYm94KSA9PiB7XG4gIGZldGNoKGhyZWYpLnRoZW4oYXN5bmMgcmVxID0+IHtcbiAgICBpZiAocmVxLm9rKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVxLnRleHQoKVxuXG4gICAgICBpZiAodGV4dC5pbmNsdWRlcyhcIl9fX2dhdHNieVwiKSkge1xuICAgICAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gICAgICAgIGNvbnN0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcodGV4dCwgXCJ0ZXh0L2h0bWxcIik7XG5cbiAgICAgICAgY29uc3QgZ2F0c2J5ID0gZG9jLmdldEVsZW1lbnRCeUlkKCdfX19nYXRzYnknKVxuICAgICAgICBpZiAoZ2F0c2J5KSB7XG4gICAgICAgICAgZ2F0c2J5LmlkID0gXCJfX19pbm5lcl9nXCJcbiAgICAgICAgICBpZiAoZ2F0c2J5LmZpcnN0Q2hpbGQgJiYgKGdhdHNieS5maXJzdENoaWxkIGFzIEhUTUxFbGVtZW50KS5pZCA9PT0gXCJnYXRzYnktZm9jdXMtd3JhcHBlclwiKSB7XG4gICAgICAgICAgICAoZ2F0c2J5LmZpcnN0Q2hpbGQgYXMgSFRNTEVsZW1lbnQpLmlkID0gXCJnYXRzYnktcGxheWdyb3VuZC1oYW5kYm9vay1pbm5lclwiXG4gICAgICAgICAgfVxuICAgICAgICAgIHNldFN0b3J5KGdhdHNieSwgc2FuZGJveClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKGRvY3VtZW50LmxvY2F0aW9uLmhvc3QgPT09IFwibG9jYWxob3N0OjgwMDBcIikge1xuICAgICAgICBzZXRTdG9yeShcIjxwPkJlY2F1c2UgdGhlIGdhdHNieSBkZXYgc2VydmVyIHVzZXMgSlMgdG8gYnVpbGQgeW91ciBwYWdlcywgYW5kIG5vdCBzdGF0aWNhbGx5LCB0aGUgcGFnZSB3aWxsIG5vdCBsb2FkIGR1cmluZyBkZXYuIEl0IGRvZXMgd29yayBpbiBwcm9kIHRob3VnaCAtIHVzZSA8Y29kZT5wbnBtIGJ1aWxkLXNpdGU8L2NvZGU+IHRvIHRlc3QgbG9jYWxseSB3aXRoIGEgc3RhdGljIGJ1aWxkLjwvcD5cIiwgc2FuZGJveClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNldFN0b3J5KHRleHQsIHNhbmRib3gpXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFN0b3J5KGA8cD5GYWlsZWQgdG8gbG9hZCB0aGUgY29udGVudCBhdCAke2hyZWZ9LiBSZWFzb246ICR7cmVxLnN0YXR1c30gJHtyZXEuc3RhdHVzVGV4dH08L3A+YCwgc2FuZGJveClcbiAgICB9XG4gIH0pXG59XG5cbi8qKlxuICogUGFzc2luZyBpbiBlaXRoZXIgYSByb290IEhUTUwgZWxlbWVudCBvciB0aGUgSFRNTCBmb3IgdGhlIHN0b3J5LCBwcmVzZW50IGFcbiAqIG1hcmtkb3duIGRvYyBhcyBhICdzdG9yeScgaW5zaWRlIHRoZSBwbGF5Z3JvdW5kLlxuICovXG5jb25zdCBzZXRTdG9yeSA9IChodG1sOiBzdHJpbmcgfCBIVE1MRWxlbWVudCwgc2FuZGJveDogU2FuZGJveCkgPT4ge1xuICBjb25zdCB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItdG9vbGJhclwiKVxuICBpZiAodG9vbGJhcikgdG9vbGJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCBtb25hY28gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1vbmFjby1lZGl0b3ItZW1iZWRcIilcbiAgaWYgKG1vbmFjbykgbW9uYWNvLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIlxuXG4gIGNvbnN0IHN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdG9yeS1jb250YWluZXJcIilcbiAgaWYgKCFzdG9yeSkgcmV0dXJuXG5cbiAgc3Rvcnkuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIlxuICBpZiAodHlwZW9mIGh0bWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICBzdG9yeS5pbm5lckhUTUwgPSBodG1sXG4gIH0gZWxzZSB7XG4gICAgd2hpbGUgKHN0b3J5LmZpcnN0Q2hpbGQpIHtcbiAgICAgIHN0b3J5LnJlbW92ZUNoaWxkKHN0b3J5LmZpcnN0Q2hpbGQpXG4gICAgfVxuICAgIHN0b3J5LmFwcGVuZENoaWxkKGh0bWwpXG4gIH1cblxuICAvLyBXZSBuZWVkIHRvIGhpamFjayBpbnRlcm5hbCBsaW5rc1xuICBmb3IgKGNvbnN0IGEgb2YgQXJyYXkuZnJvbShzdG9yeS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIikpKSB7XG4gICAgaWYgKCFhLnBhdGhuYW1lLnN0YXJ0c1dpdGgoXCIvcGxheVwiKSkgY29udGludWVcbiAgICAvLyBOb3RlIHRoZSBoZWFkZXIgZ2VuZXJhdGVkIGxpbmtzIGFsc28gY291bnQgaW4gaGVyZVxuXG4gICAgLy8gb3ZlcndyaXRlIHBsYXlncm91bmQgbGlua3NcbiAgICBpZiAoYS5oYXNoLmluY2x1ZGVzKFwiI2NvZGUvXCIpKSB7XG4gICAgICBhLm9uY2xpY2sgPSBlID0+IHtcbiAgICAgICAgY29uc3QgY29kZSA9IGEuaGFzaC5yZXBsYWNlKFwiI2NvZGUvXCIsIFwiXCIpLnRyaW0oKVxuICAgICAgICBsZXQgdXNlckNvZGUgPSBzYW5kYm94Lmx6c3RyaW5nLmRlY29tcHJlc3NGcm9tRW5jb2RlZFVSSUNvbXBvbmVudChjb2RlKVxuICAgICAgICAvLyBGYWxsYmFjayBpbmNhc2UgdGhlcmUgaXMgYW4gZXh0cmEgbGV2ZWwgb2YgZGVjb2Rpbmc6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0dGVyLmltL01pY3Jvc29mdC9UeXBlU2NyaXB0P2F0PTVkYzQ3OGFiOWMzOTgyMTUwOWZmMTg5YVxuICAgICAgICBpZiAoIXVzZXJDb2RlKSB1c2VyQ29kZSA9IHNhbmRib3gubHpzdHJpbmcuZGVjb21wcmVzc0Zyb21FbmNvZGVkVVJJQ29tcG9uZW50KGRlY29kZVVSSUNvbXBvbmVudChjb2RlKSlcbiAgICAgICAgaWYgKHVzZXJDb2RlKSBzZXRDb2RlKHVzZXJDb2RlLCBzYW5kYm94KVxuXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgICAgIGNvbnN0IGFscmVhZHlTZWxlY3RlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2aWdhdGlvbi1jb250YWluZXJcIikhLnF1ZXJ5U2VsZWN0b3IoXCJsaS5zZWxlY3RlZFwiKSBhcyBIVE1MRWxlbWVudFxuICAgICAgICBpZiAoYWxyZWFkeVNlbGVjdGVkKSBhbHJlYWR5U2VsZWN0ZWQuY2xhc3NMaXN0LnJlbW92ZShcInNlbGVjdGVkXCIpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG92ZXJ3cml0ZSBnaXN0L2hhbmRib29rIGxpbmtzXG4gICAgZWxzZSBpZiAoYS5oYXNoLmluY2x1ZGVzKFwiI2hhbmRib29rXCIpKSB7XG4gICAgICBhLm9uY2xpY2sgPSBlID0+IHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBOdW1iZXIoYS5oYXNoLnNwbGl0KFwiLVwiKVsxXSlcbiAgICAgICAgY29uc3QgbmF2ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKVxuICAgICAgICBpZiAoIW5hdikgcmV0dXJuXG4gICAgICAgIGNvbnN0IHVsID0gbmF2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidWxcIikuaXRlbSgwKSFcblxuICAgICAgICBjb25zdCB0YXJnZXRlZExpID0gdWwuY2hpbGRyZW4uaXRlbShOdW1iZXIoaW5kZXgpIHx8IDApIHx8IHVsLmNoaWxkcmVuLml0ZW0oMClcbiAgICAgICAgaWYgKHRhcmdldGVkTGkpIHtcbiAgICAgICAgICBjb25zdCBhID0gdGFyZ2V0ZWRMaS5nZXRFbGVtZW50c0J5VGFnTmFtZShcImFcIikuaXRlbSgwKVxuICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICBpZiAoYSkgYS5jbGljaygpXG4gICAgICAgIH1cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBhLnNldEF0dHJpYnV0ZShcInRhcmdldFwiLCBcIl9ibGFua1wiKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCBzaG93Q29kZSA9IChzYW5kYm94OiBTYW5kYm94KSA9PiB7XG4gIGNvbnN0IHN0b3J5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdG9yeS1jb250YWluZXJcIilcbiAgaWYgKHN0b3J5KSBzdG9yeS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblxuICBjb25zdCB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJlZGl0b3ItdG9vbGJhclwiKVxuICBpZiAodG9vbGJhcikgdG9vbGJhci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cbiAgY29uc3QgbW9uYWNvID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtb25hY28tZWRpdG9yLWVtYmVkXCIpXG4gIGlmIChtb25hY28pIG1vbmFjby5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG5cbiAgc2FuZGJveC5lZGl0b3IubGF5b3V0KClcbn1cblxuY29uc3Qgc2V0Q29kZSA9IChjb2RlOiBzdHJpbmcsIHNhbmRib3g6IFNhbmRib3gpID0+IHtcbiAgc2FuZGJveC5zZXRUZXh0KGNvZGUpXG4gIHNob3dDb2RlKHNhbmRib3gpXG59XG4iXX0=