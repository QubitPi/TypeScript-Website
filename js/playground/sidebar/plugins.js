define(["require", "exports", "./fixtures/npmPlugins"], function (require, exports, npmPlugins_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.optionsPlugin = exports.addCustomPlugin = exports.activePlugins = exports.allowConnectingToLocalhost = void 0;
    const pluginRegistry = ["typescript-playground-presentation-mode", "playground-transformer-timeline"];
    /** Whether the playground should actively reach out to an existing plugin */
    const allowConnectingToLocalhost = () => {
        return !!localStorage.getItem("compiler-setting-connect-dev-plugin");
    };
    exports.allowConnectingToLocalhost = allowConnectingToLocalhost;
    const activePlugins = () => {
        const existing = customPlugins().map(module => ({ id: module }));
        return existing.concat(npmPlugins_1.allNPMPlugins.filter(p => !!localStorage.getItem("plugin-" + p.id)));
    };
    exports.activePlugins = activePlugins;
    const removeCustomPlugins = (mod) => {
        const newPlugins = customPlugins().filter(p => p !== mod);
        localStorage.setItem("custom-plugins-playground", JSON.stringify(newPlugins));
    };
    const addCustomPlugin = (mod) => {
        const newPlugins = customPlugins();
        newPlugins.push(mod);
        localStorage.setItem("custom-plugins-playground", JSON.stringify(newPlugins));
    };
    exports.addCustomPlugin = addCustomPlugin;
    const customPlugins = () => {
        return JSON.parse(localStorage.getItem("custom-plugins-playground") || "[]");
    };
    const optionsPlugin = (i, utils) => {
        const plugin = {
            id: "plugins",
            displayName: i("play_sidebar_plugins"),
            // shouldBeSelected: () => true, // uncomment to make this the first tab on reloads
            willMount: (_sandbox, container) => {
                const ds = utils.createDesignSystem(container);
                const featured = npmPlugins_1.allNPMPlugins.filter(p => pluginRegistry.includes(p.id));
                const rest = npmPlugins_1.allNPMPlugins.filter(p => !pluginRegistry.includes(p.id));
                ds.subtitle(i("play_sidebar_featured_plugins"));
                const featuredPluginsOL = document.createElement("ol");
                featuredPluginsOL.className = "playground-plugins featured";
                featured.forEach(plugin => {
                    const settingButton = createPlugin(plugin);
                    featuredPluginsOL.appendChild(settingButton);
                });
                container.appendChild(featuredPluginsOL);
                ds.subtitle(i("play_sidebar_plugins_options_external"));
                const pluginsOL = document.createElement("ol");
                pluginsOL.className = "playground-plugins";
                rest.forEach(plugin => {
                    const settingButton = createPlugin(plugin);
                    pluginsOL.appendChild(settingButton);
                });
                container.appendChild(pluginsOL);
                const warning = document.createElement("p");
                warning.className = "warning";
                warning.textContent = i("play_sidebar_plugins_options_external_warning");
                container.appendChild(warning);
                const subheading = ds.subtitle(i("play_sidebar_plugins_options_modules"));
                subheading.id = "custom-modules-header";
                const customModulesOL = document.createElement("ol");
                customModulesOL.className = "custom-modules";
                const updateCustomModules = () => {
                    while (customModulesOL.firstChild) {
                        customModulesOL.removeChild(customModulesOL.firstChild);
                    }
                    customPlugins().forEach(module => {
                        const li = document.createElement("li");
                        li.textContent = module;
                        const a = document.createElement("a");
                        a.href = "#";
                        a.textContent = "X";
                        a.onclick = () => {
                            removeCustomPlugins(module);
                            updateCustomModules();
                            ds.declareRestartRequired(i);
                            return false;
                        };
                        li.appendChild(a);
                        customModulesOL.appendChild(li);
                    });
                };
                updateCustomModules();
                container.appendChild(customModulesOL);
                const inputForm = createNewModuleInputForm(updateCustomModules, i);
                container.appendChild(inputForm);
                ds.subtitle(i("play_sidebar_plugins_plugin_dev"));
                const pluginsDevOL = document.createElement("ol");
                pluginsDevOL.className = "playground-options";
                const connectToDev = ds.localStorageOption({
                    display: i("play_sidebar_plugins_plugin_dev_option"),
                    blurb: i("play_sidebar_plugins_plugin_dev_copy"),
                    flag: "compiler-setting-connect-dev-plugin",
                    onchange: () => {
                        ds.declareRestartRequired(i);
                    },
                });
                pluginsDevOL.appendChild(connectToDev);
                container.appendChild(pluginsDevOL);
            },
        };
        const createPlugin = (plugin) => {
            const li = document.createElement("li");
            const div = document.createElement("div");
            const label = document.createElement("label");
            // Avoid XSS by someone injecting JS via the description, which is the only free text someone can use
            var p = document.createElement("p");
            p.appendChild(document.createTextNode(plugin.description));
            const escapedDescription = p.innerHTML;
            const top = `<span>${plugin.name}</span> by <a href='https://www.npmjs.com/~${plugin.author}'>${plugin.author}</a><br/>${escapedDescription}`;
            const repo = plugin.href.includes("github") ? `| <a href="${plugin.href}">repo</a>` : "";
            const bottom = `<a href='https://www.npmjs.com/package/${plugin.id}'>npm</a> ${repo}`;
            label.innerHTML = `${top}<br/>${bottom}`;
            const key = "plugin-" + plugin.id;
            const input = document.createElement("input");
            input.type = "checkbox";
            input.id = key;
            input.checked = !!localStorage.getItem(key);
            input.onchange = () => {
                const ds = utils.createDesignSystem(div);
                ds.declareRestartRequired(i);
                if (input.checked) {
                    localStorage.setItem(key, "true");
                }
                else {
                    localStorage.removeItem(key);
                }
            };
            label.htmlFor = input.id;
            div.appendChild(input);
            div.appendChild(label);
            li.appendChild(div);
            return li;
        };
        const createNewModuleInputForm = (updateOL, i) => {
            const form = document.createElement("form");
            const newModuleInput = document.createElement("input");
            newModuleInput.type = "text";
            newModuleInput.placeholder = i("play_sidebar_plugins_options_modules_placeholder");
            newModuleInput.setAttribute("aria-labelledby", "custom-modules-header");
            form.appendChild(newModuleInput);
            form.onsubmit = e => {
                const ds = utils.createDesignSystem(form);
                ds.declareRestartRequired(i);
                (0, exports.addCustomPlugin)(newModuleInput.value);
                e.stopPropagation();
                updateOL();
                return false;
            };
            return form;
        };
        return plugin;
    };
    exports.optionsPlugin = optionsPlugin;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGx1Z2lucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL3NpZGViYXIvcGx1Z2lucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBSUEsTUFBTSxjQUFjLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFBO0lBRXJHLDZFQUE2RTtJQUN0RSxNQUFNLDBCQUEwQixHQUFHLEdBQUcsRUFBRTtRQUM3QyxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7SUFDdEUsQ0FBQyxDQUFBO0lBRlksUUFBQSwwQkFBMEIsOEJBRXRDO0lBRU0sTUFBTSxhQUFhLEdBQUcsR0FBRyxFQUFFO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFBO1FBQ2hFLE9BQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQywwQkFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBQzdGLENBQUMsQ0FBQTtJQUhZLFFBQUEsYUFBYSxpQkFHekI7SUFFRCxNQUFNLG1CQUFtQixHQUFHLENBQUMsR0FBVyxFQUFFLEVBQUU7UUFDMUMsTUFBTSxVQUFVLEdBQUcsYUFBYSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFBO1FBQ3pELFlBQVksQ0FBQyxPQUFPLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0lBQy9FLENBQUMsQ0FBQTtJQUVNLE1BQU0s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QUE7Z0JBQ25CLFFBQVEsRUFBRSxDQUFBO2dCQUNWLE9BQU8sS0FBSyxDQUFBO1lBQ2QsQ0FBQyxDQUFBO1lBRUQsT0FBTyxJQUFJLENBQUE7UUFDYixDQUFDLENBQUE7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUMsQ0FBQTtJQXZKWSxRQUFBLGFBQWEsaUJBdUp6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBsYXlncm91bmRQbHVnaW4sIFBsdWdpbkZhY3RvcnkgfSBmcm9tIFwiLi5cIlxuXG5pbXBvcnQgeyBhbGxOUE1QbHVnaW5zIH0gZnJvbSBcIi4vZml4dHVyZXMvbnBtUGx1Z2luc1wiXG5cbmNvbnN0IHBsdWdpblJlZ2lzdHJ5ID0gW1widHlwZXNjcmlwdC1wbGF5Z3JvdW5kLXByZXNlbnRhdGlvbi1tb2RlXCIsIFwicGxheWdyb3VuZC10cmFuc2Zvcm1lci10aW1lbGluZVwiXVxuXG4vKiogV2hldGhlciB0aGUgcGxheWdyb3VuZCBzaG91bGQgYWN0aXZlbHkgcmVhY2ggb3V0IHRvIGFuIGV4aXN0aW5nIHBsdWdpbiAqL1xuZXhwb3J0IGNvbnN0IGFsbG93Q29ubmVjdGluZ1RvTG9jYWxob3N0ID0gKCkgPT4ge1xuICByZXR1cm4gISFsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImNvbXBpbGVyLXNldHRpbmctY29ubmVjdC1kZXYtcGx1Z2luXCIpXG59XG5cbmV4cG9ydCBjb25zdCBhY3RpdmVQbHVnaW5zID0gKCkgPT4ge1xuICBjb25zdCBleGlzdGluZyA9IGN1c3RvbVBsdWdpbnMoKS5tYXAobW9kdWxlID0+ICh7IGlkOiBtb2R1bGUgfSkpXG4gIHJldHVybiBleGlzdGluZy5jb25jYXQoYWxsTlBNUGx1Z2lucy5maWx0ZXIocCA9PiAhIWxvY2FsU3RvcmFnZS5nZXRJdGVtKFwicGx1Z2luLVwiICsgcC5pZCkpKVxufVxuXG5jb25zdCByZW1vdmVDdXN0b21QbHVnaW5zID0gKG1vZDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IG5ld1BsdWdpbnMgPSBjdXN0b21QbHVnaW5zKCkuZmlsdGVyKHAgPT4gcCAhPT0gbW9kKVxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImN1c3RvbS1wbHVnaW5zLXBsYXlncm91bmRcIiwgSlNPTi5zdHJpbmdpZnkobmV3UGx1Z2lucykpXG59XG5cbmV4cG9ydCBjb25zdCBhZGRDdXN0b21QbHVnaW4gPSAobW9kOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgbmV3UGx1Z2lucyA9IGN1c3RvbVBsdWdpbnMoKVxuICBuZXdQbHVnaW5zLnB1c2gobW9kKVxuICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImN1c3RvbS1wbHVnaW5zLXBsYXlncm91bmRcIiwgSlNPTi5zdHJpbmdpZnkobmV3UGx1Z2lucykpXG59XG5cbmNvbnN0IGN1c3RvbVBsdWdpbnMgPSAoKTogc3RyaW5nW10gPT4ge1xuICByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImN1c3RvbS1wbHVnaW5zLXBsYXlncm91bmRcIikgfHwgXCJbXVwiKVxufVxuXG5leHBvcnQgY29uc3Qgb3B0aW9uc1BsdWdpbjogUGx1Z2luRmFjdG9yeSA9IChpLCB1dGlscykgPT4ge1xuICBjb25zdCBwbHVnaW46IFBsYXlncm91bmRQbHVnaW4gPSB7XG4gICAgaWQ6IFwicGx1Z2luc1wiLFxuICAgIGRpc3BsYXlOYW1lOiBpKFwicGxheV9zaWRlYmFyX3BsdWdpbnNcIiksXG4gICAgLy8gc2hvdWxkQmVTZWxlY3RlZDogKCkgPT4gdHJ1ZSwgLy8gdW5jb21tZW50IHRvIG1ha2UgdGhpcyB0aGUgZmlyc3QgdGFiIG9uIHJlbG9hZHNcbiAgICB3aWxsTW91bnQ6IChfc2FuZGJveCwgY29udGFpbmVyKSA9PiB7XG4gICAgICBjb25zdCBkcyA9IHV0aWxzLmNyZWF0ZURlc2lnblN5c3RlbShjb250YWluZXIpXG5cbiAgICAgIGNvbnN0IGZlYXR1cmVkID0gYWxsTlBNUGx1Z2lucy5maWx0ZXIocCA9PiBwbHVnaW5SZWdpc3RyeS5pbmNsdWRlcyhwLmlkKSlcbiAgICAgIGNvbnN0IHJlc3QgPSBhbGxOUE1QbHVnaW5zLmZpbHRlcihwID0+ICFwbHVnaW5SZWdpc3RyeS5pbmNsdWRlcyhwLmlkKSlcblxuICAgICAgZHMuc3VidGl0bGUoaShcInBsYXlfc2lkZWJhcl9mZWF0dXJlZF9wbHVnaW5zXCIpKVxuXG4gICAgICBjb25zdCBmZWF0dXJlZFBsdWdpbnNPTCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvbFwiKVxuICAgICAgZmVhdHVyZWRQbHVnaW5zT0wuY2xhc3NOYW1lID0gXCJwbGF5Z3JvdW5kLXBsdWdpbnMgZmVhdHVyZWRcIlxuICAgICAgZmVhdHVyZWQuZm9yRWFjaChwbHVnaW4gPT4ge1xuICAgICAgICBjb25zdCBzZXR0aW5nQnV0dG9uID0gY3JlYXRlUGx1Z2luKHBsdWdpbilcbiAgICAgICAgZmVhdHVyZWRQbHVnaW5zT0wuYXBwZW5kQ2hpbGQoc2V0dGluZ0J1dHRvbilcbiAgICAgIH0pXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZmVhdHVyZWRQbHVnaW5zT0wpXG5cbiAgICAgIGRzLnN1YnRpdGxlKGkoXCJwbGF5X3NpZGViYXJfcGx1Z2luc19vcHRpb25zX2V4dGVybmFsXCIpKVxuXG4gICAgICBjb25zdCBwbHVnaW5zT0wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib2xcIilcbiAgICAgIHBsdWdpbnNPTC5jbGFzc05hbWUgPSBcInBsYXlncm91bmQtcGx1Z2luc1wiXG4gICAgICByZXN0LmZvckVhY2gocGx1Z2luID0+IHtcbiAgICAgICAgY29uc3Qgc2V0dGluZ0J1dHRvbiA9IGNyZWF0ZVBsdWdpbihwbHVnaW4pXG4gICAgICAgIHBsdWdpbnNPTC5hcHBlbmRDaGlsZChzZXR0aW5nQnV0dG9uKVxuICAgICAgfSlcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwbHVnaW5zT0wpXG5cbiAgICAgIGNvbnN0IHdhcm5pbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKVxuICAgICAgd2FybmluZy5jbGFzc05hbWUgPSBcIndhcm5pbmdcIlxuICAgICAgd2FybmluZy50ZXh0Q29udGVudCA9IGkoXCJwbGF5X3NpZGViYXJfcGx1Z2luc19vcHRpb25zX2V4dGVybmFsX3dhcm5pbmdcIilcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh3YXJuaW5nKVxuXG4gICAgICBjb25zdCBzdWJoZWFkaW5nID0gZHMuc3VidGl0bGUoaShcInBsYXlfc2lkZWJhcl9wbHVnaW5zX29wdGlvbnNfbW9kdWxlc1wiKSlcbiAgICAgIHN1YmhlYWRpbmcuaWQgPSBcImN1c3RvbS1tb2R1bGVzLWhlYWRlclwiXG5cbiAgICAgIGNvbnN0IGN1c3RvbU1vZHVsZXNPTCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvbFwiKVxuICAgICAgY3VzdG9tTW9kdWxlc09MLmNsYXNzTmFtZSA9IFwiY3VzdG9tLW1vZHVsZXNcIlxuXG4gICAgICBjb25zdCB1cGRhdGVDdXN0b21Nb2R1bGVzID0gKCkgPT4ge1xuICAgICAgICB3aGlsZSAoY3VzdG9tTW9kdWxlc09MLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICBjdXN0b21Nb2R1bGVzT0wucmVtb3ZlQ2hpbGQoY3VzdG9tTW9kdWxlc09MLmZpcnN0Q2hpbGQpXG4gICAgICAgIH1cbiAgICAgICAgY3VzdG9tUGx1Z2lucygpLmZvckVhY2gobW9kdWxlID0+IHtcbiAgICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKVxuICAgICAgICAgIGxpLnRleHRDb250ZW50ID0gbW9kdWxlXG4gICAgICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpXG4gICAgICAgICAgYS5ocmVmID0gXCIjXCJcbiAgICAgICAgICBhLnRleHRDb250ZW50ID0gXCJYXCJcbiAgICAgICAgICBhLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICByZW1vdmVDdXN0b21QbHVnaW5zKG1vZHVsZSlcbiAgICAgICAgICAgIHVwZGF0ZUN1c3RvbU1vZHVsZXMoKVxuICAgICAgICAgICAgZHMuZGVjbGFyZVJlc3RhcnRSZXF1aXJlZChpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIGxpLmFwcGVuZENoaWxkKGEpXG5cbiAgICAgICAgICBjdXN0b21Nb2R1bGVzT0wuYXBwZW5kQ2hpbGQobGkpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICB1cGRhdGVDdXN0b21Nb2R1bGVzKClcblxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGN1c3RvbU1vZHVsZXNPTClcbiAgICAgIGNvbnN0IGlucHV0Rm9ybSA9IGNyZWF0ZU5ld01vZHVsZUlucHV0Rm9ybSh1cGRhdGVDdXN0b21Nb2R1bGVzLCBpKVxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGlucHV0Rm9ybSlcblxuICAgICAgZHMuc3VidGl0bGUoaShcInBsYXlfc2lkZWJhcl9wbHVnaW5zX3BsdWdpbl9kZXZcIikpXG5cbiAgICAgIGNvbnN0IHBsdWdpbnNEZXZPTCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvbFwiKVxuICAgICAgcGx1Z2luc0Rldk9MLmNsYXNzTmFtZSA9IFwicGxheWdyb3VuZC1vcHRpb25zXCJcblxuICAgICAgY29uc3QgY29ubmVjdFRvRGV2ID0gZHMubG9jYWxTdG9yYWdlT3B0aW9uKHtcbiAgICAgICAgZGlzcGxheTogaShcInBsYXlfc2lkZWJhcl9wbHVnaW5zX3BsdWdpbl9kZXZfb3B0aW9uXCIpLFxuICAgICAgICBibHVyYjogaShcInBsYXlfc2lkZWJhcl9wbHVnaW5zX3BsdWdpbl9kZXZfY29weVwiKSxcbiAgICAgICAgZmxhZzogXCJjb21waWxlci1zZXR0aW5nLWNvbm5lY3QtZGV2LXBsdWdpblwiLFxuICAgICAgICBvbmNoYW5nZTogKCkgPT4ge1xuICAgICAgICAgIGRzLmRlY2xhcmVSZXN0YXJ0UmVxdWlyZWQoaSlcbiAgICAgICAgfSxcbiAgICAgIH0pXG5cbiAgICAgIHBsdWdpbnNEZXZPTC5hcHBlbmRDaGlsZChjb25uZWN0VG9EZXYpXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocGx1Z2luc0Rldk9MKVxuICAgIH0sXG4gIH1cblxuICBjb25zdCBjcmVhdGVQbHVnaW4gPSAocGx1Z2luOiB0eXBlb2YgYWxsTlBNUGx1Z2luc1swXSkgPT4ge1xuICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpXG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGFiZWxcIilcblxuICAgIC8vIEF2b2lkIFhTUyBieSBzb21lb25lIGluamVjdGluZyBKUyB2aWEgdGhlIGRlc2NyaXB0aW9uLCB3aGljaCBpcyB0aGUgb25seSBmcmVlIHRleHQgc29tZW9uZSBjYW4gdXNlXG4gICAgdmFyIHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKVxuICAgIHAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUocGx1Z2luLmRlc2NyaXB0aW9uKSlcbiAgICBjb25zdCBlc2NhcGVkRGVzY3JpcHRpb24gPSBwLmlubmVySFRNTFxuXG4gICAgY29uc3QgdG9wID0gYDxzcGFuPiR7cGx1Z2luLm5hbWV9PC9zcGFuPiBieSA8YSBocmVmPSdodHRwczovL3d3dy5ucG1qcy5jb20vfiR7cGx1Z2luLmF1dGhvcn0nPiR7cGx1Z2luLmF1dGhvcn08L2E+PGJyLz4ke2VzY2FwZWREZXNjcmlwdGlvbn1gXG4gICAgY29uc3QgcmVwbyA9IHBsdWdpbi5ocmVmLmluY2x1ZGVzKFwiZ2l0aHViXCIpID8gYHwgPGEgaHJlZj1cIiR7cGx1Z2luLmhyZWZ9XCI+cmVwbzwvYT5gIDogXCJcIlxuICAgIGNvbnN0IGJvdHRvbSA9IGA8YSBocmVmPSdodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS8ke3BsdWdpbi5pZH0nPm5wbTwvYT4gJHtyZXBvfWBcbiAgICBsYWJlbC5pbm5lckhUTUwgPSBgJHt0b3B9PGJyLz4ke2JvdHRvbX1gXG5cbiAgICBjb25zdCBrZXkgPSBcInBsdWdpbi1cIiArIHBsdWdpbi5pZFxuICAgIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpXG4gICAgaW5wdXQudHlwZSA9IFwiY2hlY2tib3hcIlxuICAgIGlucHV0LmlkID0ga2V5XG4gICAgaW5wdXQuY2hlY2tlZCA9ICEhbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KVxuXG4gICAgaW5wdXQub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICBjb25zdCBkcyA9IHV0aWxzLmNyZWF0ZURlc2lnblN5c3RlbShkaXYpXG4gICAgICBkcy5kZWNsYXJlUmVzdGFydFJlcXVpcmVkKGkpXG4gICAgICBpZiAoaW5wdXQuY2hlY2tlZCkge1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIFwidHJ1ZVwiKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KVxuICAgICAgfVxuICAgIH1cblxuICAgIGxhYmVsLmh0bWxGb3IgPSBpbnB1dC5pZFxuXG4gICAgZGl2LmFwcGVuZENoaWxkKGlucHV0KVxuICAgIGRpdi5hcHBlbmRDaGlsZChsYWJlbClcbiAgICBsaS5hcHBlbmRDaGlsZChkaXYpXG4gICAgcmV0dXJuIGxpXG4gIH1cblxuICBjb25zdCBjcmVhdGVOZXdNb2R1bGVJbnB1dEZvcm0gPSAodXBkYXRlT0w6IEZ1bmN0aW9uLCBpOiBhbnkpID0+IHtcbiAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImZvcm1cIilcblxuICAgIGNvbnN0IG5ld01vZHVsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpXG4gICAgbmV3TW9kdWxlSW5wdXQudHlwZSA9IFwidGV4dFwiXG4gICAgbmV3TW9kdWxlSW5wdXQucGxhY2Vob2xkZXIgPSBpKFwicGxheV9zaWRlYmFyX3BsdWdpbnNfb3B0aW9uc19tb2R1bGVzX3BsYWNlaG9sZGVyXCIpXG4gICAgbmV3TW9kdWxlSW5wdXQuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbGxlZGJ5XCIsIFwiY3VzdG9tLW1vZHVsZXMtaGVhZGVyXCIpXG4gICAgZm9ybS5hcHBlbmRDaGlsZChuZXdNb2R1bGVJbnB1dClcblxuICAgIGZvcm0ub25zdWJtaXQgPSBlID0+IHtcbiAgICAgIGNvbnN0IGRzID0gdXRpbHMuY3JlYXRlRGVzaWduU3lzdGVtKGZvcm0pXG4gICAgICBkcy5kZWNsYXJlUmVzdGFydFJlcXVpcmVkKGkpXG5cbiAgICAgIGFkZEN1c3RvbVBsdWdpbihuZXdNb2R1bGVJbnB1dC52YWx1ZSlcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIHVwZGF0ZU9MKClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICByZXR1cm4gcGx1Z2luXG59XG4iXX0=