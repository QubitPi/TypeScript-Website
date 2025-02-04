define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createNavigationSection = exports.activatePlugin = exports.createTabForPlugin = exports.createPluginContainer = exports.createTabBar = exports.setupSidebarToggle = exports.createSidebar = exports.sidebarHidden = exports.createDragBar = void 0;
    const createDragBar = (side) => {
        const sidebar = document.createElement("div");
        sidebar.className = "playground-dragbar";
        if (side === "left")
            sidebar.classList.add("left");
        let leftSize = 0, rightSize = 0;
        let left, middle, right;
        const drag = (e) => {
            rightSize = right === null || right === void 0 ? void 0 : right.clientWidth;
            leftSize = left === null || left === void 0 ? void 0 : left.clientWidth;
            if (side === "right" && middle && right) {
                // Get how far right the mouse is from the right
                const rightX = right.getBoundingClientRect().right;
                const offset = rightX - e.pageX;
                const screenClampRight = window.innerWidth - 320;
                rightSize = Math.min(Math.max(offset, 280), screenClampRight);
                // console.log({ leftSize, rightSize })
                // Set the widths
                middle.style.width = `calc(100% - ${rightSize + leftSize}px)`;
                right.style.width = `${rightSize}px`;
                right.style.flexBasis = `${rightSize}px`;
                right.style.maxWidth = `${rightSize}px`;
            }
            if (side === "left" && left && middle) {
                // Get how far right the mouse is from the right
                const leftX = e.pageX; //left.getBoundingClientRect().left
                const screenClampLeft = window.innerWidth - 320;
                leftSize = Math.min(Math.max(leftX, 180), screenClampLeft);
                // Set the widths
                middle.style.width = `calc(100% - ${rightSize + leftSize}px)`;
                left.style.width = `${leftSize}px`;
                left.style.flexBasis = `${leftSize}px`;
                left.style.maxWidth = `${leftSize}px`;
            }
            // Save the x coordinate of the
            if (window.localStorage) {
                window.localStorage.setItem("dragbar-left", "" + leftSize);
                window.localStorage.setItem("dragbar-right", "" + rightSize);
                window.localStorage.setItem("dragbar-window-width", "" + window.innerWidth);
            }
            // @ts-ignore - I know what I'm doing
            window.sandbox.editor.layout();
            // Don't allow selection
            e.stopPropagation();
            e.cancelBubble = true;
        };
        sidebar.addEventListener("mousedown", e => {
            var _a;
            sidebar.classList.add("selected");
            left = document.getElementById("navigation-container");
            middle = document.getElementById("editor-container");
            right = (_a = sidebar.parentElement) === null || _a === void 0 ? void 0 : _a.getElementsByClassName("playground-sidebar").item(0);
            // Handle dragging all over the screen
            document.addEventListener("mousemove", drag);
            // Remove it when you lt go anywhere
            document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", drag);
                document.body.style.userSelect = "auto";
                sidebar.classList.remove("selected");
            });
            // Don't allow the drag to select text accidentally
            document.body.style.userSelect = "none";
            e.stopPropagation();
            e.cancelBubble = true;
        });
        return sidebar;
    };
    exports.createDragBar = createDragBar;
    const sidebarHidden = () => !!window.localStorage.getItem("sidebar-hidden");
    exports.sidebarHidden = sidebarHidden;
    const createSidebar = () => {
        const sidebar = document.createElement("div");
        sidebar.className = "playground-sidebar";
        // Start with the sidebar hidden on small screens
        const isTinyScreen = window.innerWidth < 800;
        // This is independent of the sizing below so that you keep the same sized sidebar
        if (isTinyScreen || (0, exports.sidebarHidden)()) {
            sidebar.style.display = "none";
        }
        if (window.localStorage && window.localStorage.getItem("dragbar-x")) {
            // Don't restore the x pos if the window isn't the same size
            if (window.innerWidth === Number(window.localStorage.getItem("dragbar-window-width"))) {
                // Set the dragger to the previous x pos
                let width = window.localStorage.getItem("dragbar-x");
                if (isTinyScreen) {
                    width = String(Math.min(Number(width), 280));
                }
                sidebar.style.width = `${width}px`;
                sidebar.style.flexBasis = `${width}px`;
                sidebar.style.maxWidth = `${width}px`;
                const left = document.getElementById("editor-container");
                left.style.width = `calc(100% - ${width}px)`;
            }
        }
        return sidebar;
    };
    exports.createSidebar = createSidebar;
    const toggleIconWhenOpen = "&#x21E5;";
    const toggleIconWhenClosed = "&#x21E4;";
    const setupSidebarToggle = () => {
        const toggle = document.getElementById("sidebar-toggle");
        const updateToggle = () => {
            const sidebar = window.document.querySelector(".playground-sidebar");
            const sidebarShowing = sidebar.style.display !== "none";
            toggle.innerHTML = sidebarShowing ? toggleIconWhenOpen : toggleIconWhenClosed;
            toggle.setAttribute("aria-label", sidebarShowing ? "Hide Sidebar" : "Show Sidebar");
        };
        toggle.onclick = () => {
            const sidebar = window.document.querySelector(".playground-sidebar");
            const newState = sidebar.style.display !== "none";
            if (newState) {
                localStorage.setItem("sidebar-hidden", "true");
                sidebar.style.display = "none";
            }
            else {
                localStorage.removeItem("sidebar-hidden");
                sidebar.style.display = "block";
            }
            updateToggle();
            // @ts-ignore - I know what I'm doing
            window.sandbox.editor.layout();
            return false;
        };
        // Ensure its set up at the start
        updateToggle();
    };
    exports.setupSidebarToggle = setupSidebarToggle;
    const createTabBar = () => {
        const tabBar = document.createElement("div");
        tabBar.classList.add("playground-plugin-tabview");
        tabBar.id = "playground-plugin-tabbar";
        tabBar.setAttribute("aria-label", "Tabs for plugins");
        tabBar.setAttribute("role", "tablist");
        /** Support left/right in the tab bar for accessibility */
        let tabFocus = 0;
        tabBar.addEventListener("keydown", e => {
            const tabs = document.querySelectorAll('.playground-plugin-tabview [role="tab"]');
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
        return tabBar;
    };
    exports.createTabBar = createTabBar;
    const createPluginContainer = () => {
        const container = document.createElement("div");
        container.setAttribute("role", "tabpanel");
        container.classList.add("playground-plugin-container");
        return container;
    };
    exports.createPluginContainer = createPluginContainer;
    const createTabForPlugin = (plugin) => {
        const element = document.createElement("button");
        element.setAttribute("role", "tab");
        element.setAttribute("aria-selected", "false");
        element.id = "playground-plugin-tab-" + plugin.id;
        element.textContent = plugin.displayName;
        return element;
    };
    exports.createTabForPlugin = createTabForPlugin;
    const activatePlugin = (plugin, previousPlugin, sandbox, tabBar, container) => {
        let newPluginTab, oldPluginTab;
        // @ts-ignore - This works at runtime
        for (const tab of tabBar.children) {
            if (tab.id === `playground-plugin-tab-${plugin.id}`)
                newPluginTab = tab;
            if (previousPlugin && tab.id === `playground-plugin-tab-${previousPlugin.id}`)
                oldPluginTab = tab;
        }
        // @ts-ignore
        if (!newPluginTab)
            throw new Error("Could not get a tab for the plugin: " + plugin.displayName);
        // Tell the old plugin it's getting the boot
        // @ts-ignore
        if (previousPlugin && oldPluginTab) {
            if (previousPlugin.willUnmount)
                previousPlugin.willUnmount(sandbox, container);
            oldPluginTab.classList.remove("active");
            oldPluginTab.setAttribute("aria-selected", "false");
            oldPluginTab.removeAttribute("tabindex");
        }
        // Wipe the sidebar
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        // Start booting up the new plugin
        newPluginTab.classList.add("active");
        newPluginTab.setAttribute("aria-selected", "true");
        newPluginTab.setAttribute("tabindex", "0");
        // Tell the new plugin to start doing some work
        if (plugin.willMount)
            plugin.willMount(sandbox, container);
        if (plugin.modelChanged)
            plugin.modelChanged(sandbox, sandbox.getModel(), container);
        if (plugin.modelChangedDebounce)
            plugin.modelChangedDebounce(sandbox, sandbox.getModel(), container);
        if (plugin.didMount)
            plugin.didMount(sandbox, container);
        // Let the previous plugin do any slow work after it's all done
        if (previousPlugin && previousPlugin.didUnmount)
            previousPlugin.didUnmount(sandbox, container);
    };
    exports.activatePlugin = activatePlugin;
    const createNavigationSection = () => {
        const container = document.createElement("div");
        container.id = "navigation-container";
        return container;
    };
    exports.createNavigationSection = createNavigationSection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlRWxlbWVudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy9jcmVhdGVFbGVtZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBS08sTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFzQixFQUFFLEVBQUU7UUFDdEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM3QyxPQUFPLENBQUMsU0FBUyxHQUFHLG9CQUFvQixDQUFBO1FBQ3hDLElBQUksSUFBSSxLQUFLLE1BQU07WUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUVsRCxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQ2QsU0FBUyxHQUFHLENBQUMsQ0FBQTtRQUVmLElBQUksSUFBaUIsRUFBRSxNQUFtQixFQUFFLEtBQWtCLENBQUE7UUFDOUQsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFhLEVBQUUsRUFBRTtZQUM3QixTQUFTLEdBQUcsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLFdBQVcsQ0FBQTtZQUM5QixRQUFRLEdBQUcsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLFdBQVcsQ0FBQTtZQUU1QixJQUFJLElBQUksS0FBSyxPQUFPLElBQUksTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUN4QyxnREFBZ0Q7Z0JBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEtBQUssQ0FBQTtnQkFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUE7Z0JBQy9CLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUE7Z0JBQ2hELFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxF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bEQsWUFBWSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFFMUMsK0NBQStDO1FBQy9DLElBQUksTUFBTSxDQUFDLFNBQVM7WUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUMxRCxJQUFJLE1BQU0sQ0FBQyxZQUFZO1lBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ3BGLElBQUksTUFBTSxDQUFDLG9CQUFvQjtZQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ3BHLElBQUksTUFBTSxDQUFDLFFBQVE7WUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV4RCwrREFBK0Q7UUFDL0QsSUFBSSxjQUFjLElBQUksY0FBYyxDQUFDLFVBQVU7WUFBRSxjQUFjLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUNoRyxDQUFDLENBQUE7SUE1Q1ksUUFBQSxjQUFjLGtCQTRDMUI7SUFFTSxNQUFNLHVCQUF1QixHQUFHLEdBQUcsRUFBRTtRQUMxQyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQy9DLFNBQVMsQ0FBQyxFQUFFLEdBQUcsc0JBQXNCLENBQUE7UUFDckMsT0FBTyxTQUFTLENBQUE7SUFDbEIsQ0FBQyxDQUFBO0lBSlksUUFBQSx1QkFBdUIsMkJBSW5DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0RWZmZWN0aXZlQ29uc3RyYWludE9mVHlwZVBhcmFtZXRlciB9IGZyb20gXCJ0eXBlc2NyaXB0XCJcbmltcG9ydCB7IFBsYXlncm91bmRQbHVnaW4gfSBmcm9tIFwiLlwiXG5cbnR5cGUgU2FuZGJveCA9IGltcG9ydChcIkB0eXBlc2NyaXB0L3NhbmRib3hcIikuU2FuZGJveFxuXG5leHBvcnQgY29uc3QgY3JlYXRlRHJhZ0JhciA9IChzaWRlOiBcImxlZnRcIiB8IFwicmlnaHRcIikgPT4ge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICBzaWRlYmFyLmNsYXNzTmFtZSA9IFwicGxheWdyb3VuZC1kcmFnYmFyXCJcbiAgaWYgKHNpZGUgPT09IFwibGVmdFwiKSBzaWRlYmFyLmNsYXNzTGlzdC5hZGQoXCJsZWZ0XCIpXG5cbiAgbGV0IGxlZnRTaXplID0gMCxcbiAgICByaWdodFNpemUgPSAwXG5cbiAgbGV0IGxlZnQ6IEhUTUxFbGVtZW50LCBtaWRkbGU6IEhUTUxFbGVtZW50LCByaWdodDogSFRNTEVsZW1lbnRcbiAgY29uc3QgZHJhZyA9IChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgcmlnaHRTaXplID0gcmlnaHQ/LmNsaWVudFdpZHRoXG4gICAgbGVmdFNpemUgPSBsZWZ0Py5jbGllbnRXaWR0aFxuXG4gICAgaWYgKHNpZGUgPT09IFwicmlnaHRcIiAmJiBtaWRkbGUgJiYgcmlnaHQpIHtcbiAgICAgIC8vIEdldCBob3cgZmFyIHJpZ2h0IHRoZSBtb3VzZSBpcyBmcm9tIHRoZSByaWdodFxuICAgICAgY29uc3QgcmlnaHRYID0gcmlnaHQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHRcbiAgICAgIGNvbnN0IG9mZnNldCA9IHJpZ2h0WCAtIGUucGFnZVhcbiAgICAgIGNvbnN0IHNjcmVlbkNsYW1wUmlnaHQgPSB3aW5kb3cuaW5uZXJXaWR0aCAtIDMyMFxuICAgICAgcmlnaHRTaXplID0gTWF0aC5taW4oTWF0aC5tYXgob2Zmc2V0LCAyODApLCBzY3JlZW5DbGFtcFJpZ2h0KVxuICAgICAgLy8gY29uc29sZS5sb2coeyBsZWZ0U2l6ZSwgcmlnaHRTaXplIH0pXG5cbiAgICAgIC8vIFNldCB0aGUgd2lkdGhzXG4gICAgICBtaWRkbGUuc3R5bGUud2lkdGggPSBgY2FsYygxMDAlIC0gJHtyaWdodFNpemUgKyBsZWZ0U2l6ZX1weClgXG4gICAgICByaWdodC5zdHlsZS53aWR0aCA9IGAke3JpZ2h0U2l6ZX1weGBcbiAgICAgIHJpZ2h0LnN0eWxlLmZsZXhCYXNpcyA9IGAke3JpZ2h0U2l6ZX1weGBcbiAgICAgIHJpZ2h0LnN0eWxlLm1heFdpZHRoID0gYCR7cmlnaHRTaXplfXB4YFxuICAgIH1cblxuICAgIGlmIChzaWRlID09PSBcImxlZnRcIiAmJiBsZWZ0ICYmIG1pZGRsZSkge1xuICAgICAgLy8gR2V0IGhvdyBmYXIgcmlnaHQgdGhlIG1vdXNlIGlzIGZyb20gdGhlIHJpZ2h0XG4gICAgICBjb25zdCBsZWZ0WCA9IGUucGFnZVggLy9sZWZ0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnRcbiAgICAgIGNvbnN0IHNjcmVlbkNsYW1wTGVmdCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gMzIwXG4gICAgICBsZWZ0U2l6ZSA9IE1hdGgubWluKE1hdGgubWF4KGxlZnRYLCAxODApLCBzY3JlZW5DbGFtcExlZnQpXG5cbiAgICAgIC8vIFNldCB0aGUgd2lkdGhzXG4gICAgICBtaWRkbGUuc3R5bGUud2lkdGggPSBgY2FsYygxMDAlIC0gJHtyaWdodFNpemUgKyBsZWZ0U2l6ZX1weClgXG4gICAgICBsZWZ0LnN0eWxlLndpZHRoID0gYCR7bGVmdFNpemV9cHhgXG4gICAgICBsZWZ0LnN0eWxlLmZsZXhCYXNpcyA9IGAke2xlZnRTaXplfXB4YFxuICAgICAgbGVmdC5zdHlsZS5tYXhXaWR0aCA9IGAke2xlZnRTaXplfXB4YFxuICAgIH1cblxuICAgIC8vIFNhdmUgdGhlIHggY29vcmRpbmF0ZSBvZiB0aGVcbiAgICBpZiAod2luZG93LmxvY2FsU3RvcmFnZSkge1xuICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKFwiZHJhZ2Jhci1sZWZ0XCIsIFwiXCIgKyBsZWZ0U2l6ZSlcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRyYWdiYXItcmlnaHRcIiwgXCJcIiArIHJpZ2h0U2l6ZSlcbiAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImRyYWdiYXItd2luZG93LXdpZHRoXCIsIFwiXCIgKyB3aW5kb3cuaW5uZXJXaWR0aClcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlIC0gSSBrbm93IHdoYXQgSSdtIGRvaW5nXG4gICAgd2luZG93LnNhbmRib3guZWRpdG9yLmxheW91dCgpXG5cbiAgICAvLyBEb24ndCBhbGxvdyBzZWxlY3Rpb25cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlXG4gIH1cblxuICBzaWRlYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZSA9PiB7XG4gICAgc2lkZWJhci5jbGFzc0xpc3QuYWRkKFwic2VsZWN0ZWRcIilcbiAgICBsZWZ0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZpZ2F0aW9uLWNvbnRhaW5lclwiKSFcbiAgICBtaWRkbGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRvci1jb250YWluZXJcIikhXG4gICAgcmlnaHQgPSBzaWRlYmFyLnBhcmVudEVsZW1lbnQ/LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJwbGF5Z3JvdW5kLXNpZGViYXJcIikuaXRlbSgwKSEgYXMgYW55XG4gICAgLy8gSGFuZGxlIGRyYWdnaW5nIGFsbCBvdmVyIHRoZSBzY3JlZW5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGRyYWcpXG5cbiAgICAvLyBSZW1vdmUgaXQgd2hlbiB5b3UgbHQgZ28gYW55d2hlcmVcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAoKSA9PiB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGRyYWcpXG4gICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLnVzZXJTZWxlY3QgPSBcImF1dG9cIlxuICAgICAgc2lkZWJhci5jbGFzc0xpc3QucmVtb3ZlKFwic2VsZWN0ZWRcIilcbiAgICB9KVxuXG4gICAgLy8gRG9uJ3QgYWxsb3cgdGhlIGRyYWcgdG8gc2VsZWN0IHRleHQgYWNjaWRlbnRhbGx5XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCJcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgZS5jYW5jZWxCdWJibGUgPSB0cnVlXG4gIH0pXG5cbiAgcmV0dXJuIHNpZGViYXJcbn1cblxuZXhwb3J0IGNvbnN0IHNpZGViYXJIaWRkZW4gPSAoKSA9PiAhIXdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShcInNpZGViYXItaGlkZGVuXCIpXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVTaWRlYmFyID0gKCkgPT4ge1xuICBjb25zdCBzaWRlYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICBzaWRlYmFyLmNsYXNzTmFtZSA9IFwicGxheWdyb3VuZC1zaWRlYmFyXCJcblxuICAvLyBTdGFydCB3aXRoIHRoZSBzaWRlYmFyIGhpZGRlbiBvbiBzbWFsbCBzY3JlZW5zXG4gIGNvbnN0IGlzVGlueVNjcmVlbiA9IHdpbmRvdy5pbm5lcldpZHRoIDwgODAwXG5cbiAgLy8gVGhpcyBpcyBpbmRlcGVuZGVudCBvZiB0aGUgc2l6aW5nIGJlbG93IHNvIHRoYXQgeW91IGtlZXAgdGhlIHNhbWUgc2l6ZWQgc2lkZWJhclxuICBpZiAoaXNUaW55U2NyZWVuIHx8IHNpZGViYXJIaWRkZW4oKSkge1xuICAgIHNpZGViYXIuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiXG4gIH1cblxuICBpZiAod2luZG93LmxvY2FsU3RvcmFnZSAmJiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkcmFnYmFyLXhcIikpIHtcbiAgICAvLyBEb24ndCByZXN0b3JlIHRoZSB4IHBvcyBpZiB0aGUgd2luZG93IGlzbid0IHRoZSBzYW1lIHNpemVcbiAgICBpZiAod2luZG93LmlubmVyV2lkdGggPT09IE51bWJlcih3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oXCJkcmFnYmFyLXdpbmRvdy13aWR0aFwiKSkpIHtcbiAgICAgIC8vIFNldCB0aGUgZHJhZ2dlciB0byB0aGUgcHJldmlvdXMgeCBwb3NcbiAgICAgIGxldCB3aWR0aCA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImRyYWdiYXIteFwiKVxuXG4gICAgICBpZiAoaXNUaW55U2NyZWVuKSB7XG4gICAgICAgIHdpZHRoID0gU3RyaW5nKE1hdGgubWluKE51bWJlcih3aWR0aCksIDI4MCkpXG4gICAgICB9XG5cbiAgICAgIHNpZGViYXIuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGBcbiAgICAgIHNpZGViYXIuc3R5bGUuZmxleEJhc2lzID0gYCR7d2lkdGh9cHhgXG4gICAgICBzaWRlYmFyLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgXG5cbiAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImVkaXRvci1jb250YWluZXJcIikhXG4gICAgICBsZWZ0LnN0eWxlLndpZHRoID0gYGNhbGMoMTAwJSAtICR7d2lkdGh9cHgpYFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzaWRlYmFyXG59XG5cbmNvbnN0IHRvZ2dsZUljb25XaGVuT3BlbiA9IFwiJiN4MjFFNTtcIlxuY29uc3QgdG9nZ2xlSWNvbldoZW5DbG9zZWQgPSBcIiYjeDIxRTQ7XCJcblxuZXhwb3J0IGNvbnN0IHNldHVwU2lkZWJhclRvZ2dsZSA9ICgpID0+IHtcbiAgY29uc3QgdG9nZ2xlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaWRlYmFyLXRvZ2dsZVwiKSFcblxuICBjb25zdCB1cGRhdGVUb2dnbGUgPSAoKSA9PiB7XG4gICAgY29uc3Qgc2lkZWJhciA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtc2lkZWJhclwiKSBhcyBIVE1MRGl2RWxlbWVudFxuICAgIGNvbnN0IHNpZGViYXJTaG93aW5nID0gc2lkZWJhci5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIlxuXG4gICAgdG9nZ2xlLmlubmVySFRNTCA9IHNpZGViYXJTaG93aW5nID8gdG9nZ2xlSWNvbldoZW5PcGVuIDogdG9nZ2xlSWNvbldoZW5DbG9zZWRcbiAgICB0b2dnbGUuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBzaWRlYmFyU2hvd2luZyA/IFwiSGlkZSBTaWRlYmFyXCIgOiBcIlNob3cgU2lkZWJhclwiKVxuICB9XG5cbiAgdG9nZ2xlLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgY29uc3Qgc2lkZWJhciA9IHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLnBsYXlncm91bmQtc2lkZWJhclwiKSBhcyBIVE1MRGl2RWxlbWVudFxuICAgIGNvbnN0IG5ld1N0YXRlID0gc2lkZWJhci5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIlxuXG4gICAgaWYgKG5ld1N0YXRlKSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcInNpZGViYXItaGlkZGVuXCIsIFwidHJ1ZVwiKVxuICAgICAgc2lkZWJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oXCJzaWRlYmFyLWhpZGRlblwiKVxuICAgICAgc2lkZWJhci5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiXG4gICAgfVxuXG4gICAgdXBkYXRlVG9nZ2xlKClcblxuICAgIC8vIEB0cy1pZ25vcmUgLSBJIGtub3cgd2hhdCBJJ20gZG9pbmdcbiAgICB3aW5kb3cuc2FuZGJveC5lZGl0b3IubGF5b3V0KClcblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gRW5zdXJlIGl0cyBzZXQgdXAgYXQgdGhlIHN0YXJ0XG4gIHVwZGF0ZVRvZ2dsZSgpXG59XG5cbmV4cG9ydCBjb25zdCBjcmVhdGVUYWJCYXIgPSAoKSA9PiB7XG4gIGNvbnN0IHRhYkJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcbiAgdGFiQmFyLmNsYXNzTGlzdC5hZGQoXCJwbGF5Z3JvdW5kLXBsdWdpbi10YWJ2aWV3XCIpXG4gIHRhYkJhci5pZCA9IFwicGxheWdyb3VuZC1wbHVnaW4tdGFiYmFyXCJcbiAgdGFiQmFyLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgXCJUYWJzIGZvciBwbHVnaW5zXCIpXG4gIHRhYkJhci5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwidGFibGlzdFwiKVxuXG4gIC8qKiBTdXBwb3J0IGxlZnQvcmlnaHQgaW4gdGhlIHRhYiBiYXIgZm9yIGFjY2Vzc2liaWxpdHkgKi9cbiAgbGV0IHRhYkZvY3VzID0gMFxuICB0YWJCYXIuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZSA9PiB7XG4gICAgY29uc3QgdGFicyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5wbGF5Z3JvdW5kLXBsdWdpbi10YWJ2aWV3IFtyb2xlPVwidGFiXCJdJylcbiAgICAvLyBNb3ZlIHJpZ2h0XG4gICAgaWYgKGUua2V5ID09PSBcIkFycm93UmlnaHRcIiB8fCBlLmtleSA9PT0gXCJBcnJvd0xlZnRcIikge1xuICAgICAgdGFic1t0YWJGb2N1c10uc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCItMVwiKVxuICAgICAgaWYgKGUua2V5ID09PSBcIkFycm93UmlnaHRcIikge1xuICAgICAgICB0YWJGb2N1cysrXG4gICAgICAgIC8vIElmIHdlJ3JlIGF0IHRoZSBlbmQsIGdvIHRvIHRoZSBzdGFydFxuICAgICAgICBpZiAodGFiRm9jdXMgPj0gdGFicy5sZW5ndGgpIHtcbiAgICAgICAgICB0YWJGb2N1cyA9IDBcbiAgICAgICAgfVxuICAgICAgICAvLyBNb3ZlIGxlZnRcbiAgICAgIH0gZWxzZSBpZiAoZS5rZXkgPT09IFwiQXJyb3dMZWZ0XCIpIHtcbiAgICAgICAgdGFiRm9jdXMtLVxuICAgICAgICAvLyBJZiB3ZSdyZSBhdCB0aGUgc3RhcnQsIG1vdmUgdG8gdGhlIGVuZFxuICAgICAgICBpZiAodGFiRm9jdXMgPCAwKSB7XG4gICAgICAgICAgdGFiRm9jdXMgPSB0YWJzLmxlbmd0aCAtIDFcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0YWJzW3RhYkZvY3VzXS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIilcbiAgICAgIDsodGFic1t0YWJGb2N1c10gYXMgYW55KS5mb2N1cygpXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiB0YWJCYXJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVBsdWdpbkNvbnRhaW5lciA9ICgpID0+IHtcbiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuICBjb250YWluZXIuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcInRhYnBhbmVsXCIpXG4gIGNvbnRhaW5lci5jbGFzc0xpc3QuYWRkKFwicGxheWdyb3VuZC1wbHVnaW4tY29udGFpbmVyXCIpXG4gIHJldHVybiBjb250YWluZXJcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVRhYkZvclBsdWdpbiA9IChwbHVnaW46IFBsYXlncm91bmRQbHVnaW4pID0+IHtcbiAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIilcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwidGFiXCIpXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBcImZhbHNlXCIpXG4gIGVsZW1lbnQuaWQgPSBcInBsYXlncm91bmQtcGx1Z2luLXRhYi1cIiArIHBsdWdpbi5pZFxuICBlbGVtZW50LnRleHRDb250ZW50ID0gcGx1Z2luLmRpc3BsYXlOYW1lXG4gIHJldHVybiBlbGVtZW50XG59XG5cbmV4cG9ydCBjb25zdCBhY3RpdmF0ZVBsdWdpbiA9IChcbiAgcGx1Z2luOiBQbGF5Z3JvdW5kUGx1Z2luLFxuICBwcmV2aW91c1BsdWdpbjogUGxheWdyb3VuZFBsdWdpbiB8IHVuZGVmaW5lZCxcbiAgc2FuZGJveDogU2FuZGJveCxcbiAgdGFiQmFyOiBIVE1MRGl2RWxlbWVudCxcbiAgY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudFxuKSA9PiB7XG4gIGxldCBuZXdQbHVnaW5UYWI6IEVsZW1lbnQsIG9sZFBsdWdpblRhYjogRWxlbWVudFxuICAvLyBAdHMtaWdub3JlIC0gVGhpcyB3b3JrcyBhdCBydW50aW1lXG4gIGZvciAoY29uc3QgdGFiIG9mIHRhYkJhci5jaGlsZHJlbikge1xuICAgIGlmICh0YWIuaWQgPT09IGBwbGF5Z3JvdW5kLXBsdWdpbi10YWItJHtwbHVnaW4uaWR9YCkgbmV3UGx1Z2luVGFiID0gdGFiXG4gICAgaWYgKHByZXZpb3VzUGx1Z2luICYmIHRhYi5pZCA9PT0gYHBsYXlncm91bmQtcGx1Z2luLXRhYi0ke3ByZXZpb3VzUGx1Z2luLmlkfWApIG9sZFBsdWdpblRhYiA9IHRhYlxuICB9XG5cbiAgLy8gQHRzLWlnbm9yZVxuICBpZiAoIW5ld1BsdWdpblRhYikgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IGdldCBhIHRhYiBmb3IgdGhlIHBsdWdpbjogXCIgKyBwbHVnaW4uZGlzcGxheU5hbWUpXG5cbiAgLy8gVGVsbCB0aGUgb2xkIHBsdWdpbiBpdCdzIGdldHRpbmcgdGhlIGJvb3RcbiAgLy8gQHRzLWlnbm9yZVxuICBpZiAocHJldmlvdXNQbHVnaW4gJiYgb2xkUGx1Z2luVGFiKSB7XG4gICAgaWYgKHByZXZpb3VzUGx1Z2luLndpbGxVbm1vdW50KSBwcmV2aW91c1BsdWdpbi53aWxsVW5tb3VudChzYW5kYm94LCBjb250YWluZXIpXG4gICAgb2xkUGx1Z2luVGFiLmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIilcbiAgICBvbGRQbHVnaW5UYWIuc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBcImZhbHNlXCIpXG4gICAgb2xkUGx1Z2luVGFiLnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpXG4gIH1cblxuICAvLyBXaXBlIHRoZSBzaWRlYmFyXG4gIHdoaWxlIChjb250YWluZXIuZmlyc3RDaGlsZCkge1xuICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZChjb250YWluZXIuZmlyc3RDaGlsZClcbiAgfVxuXG4gIC8vIFN0YXJ0IGJvb3RpbmcgdXAgdGhlIG5ldyBwbHVnaW5cbiAgbmV3UGx1Z2luVGFiLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIilcbiAgbmV3UGx1Z2luVGFiLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgXCJ0cnVlXCIpXG4gIG5ld1BsdWdpblRhYi5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIilcblxuICAvLyBUZWxsIHRoZSBuZXcgcGx1Z2luIHRvIHN0YXJ0IGRvaW5nIHNvbWUgd29ya1xuICBpZiAocGx1Z2luLndpbGxNb3VudCkgcGx1Z2luLndpbGxNb3VudChzYW5kYm94LCBjb250YWluZXIpXG4gIGlmIChwbHVnaW4ubW9kZWxDaGFuZ2VkKSBwbHVnaW4ubW9kZWxDaGFuZ2VkKHNhbmRib3gsIHNhbmRib3guZ2V0TW9kZWwoKSwgY29udGFpbmVyKVxuICBpZiAocGx1Z2luLm1vZGVsQ2hhbmdlZERlYm91bmNlKSBwbHVnaW4ubW9kZWxDaGFuZ2VkRGVib3VuY2Uoc2FuZGJveCwgc2FuZGJveC5nZXRNb2RlbCgpLCBjb250YWluZXIpXG4gIGlmIChwbHVnaW4uZGlkTW91bnQpIHBsdWdpbi5kaWRNb3VudChzYW5kYm94LCBjb250YWluZXIpXG5cbiAgLy8gTGV0IHRoZSBwcmV2aW91cyBwbHVnaW4gZG8gYW55IHNsb3cgd29yayBhZnRlciBpdCdzIGFsbCBkb25lXG4gIGlmIChwcmV2aW91c1BsdWdpbiAmJiBwcmV2aW91c1BsdWdpbi5kaWRVbm1vdW50KSBwcmV2aW91c1BsdWdpbi5kaWRVbm1vdW50KHNhbmRib3gsIGNvbnRhaW5lcilcbn1cblxuZXhwb3J0IGNvbnN0IGNyZWF0ZU5hdmlnYXRpb25TZWN0aW9uID0gKCkgPT4ge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG4gIGNvbnRhaW5lci5pZCA9IFwibmF2aWdhdGlvbi1jb250YWluZXJcIlxuICByZXR1cm4gY29udGFpbmVyXG59XG4iXX0=