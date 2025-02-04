define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setEditorTheme = void 0;
    const setEditorTheme = (theme, editor) => {
        const newTheme = theme ? theme : localStorage ? localStorage.getItem('editor-theme') || 'light' : 'light';
        editor.setTheme(newTheme);
        document
            .querySelectorAll('a[id^=theme-]')
            .forEach(anchor => anchor.id === `theme-${newTheme}`
            ? anchor.classList.add('current-theme')
            : anchor.classList.remove('current-theme'));
        localStorage.setItem('editor-theme', newTheme);
        // Sets the theme on the body so CSS can change between themes
        document.body.classList.remove('light', 'dark', 'hc');
        // So dark and dark-hc can share CSS
        if (newTheme === 'dark-hc') {
            document.body.classList.add('dark');
            document.body.classList.add('hc');
        }
        else {
            document.body.classList.add(newTheme);
        }
    };
    exports.setEditorTheme = setEditorTheme;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wbGF5Z3JvdW5kL3NyYy90aGVtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBQU8sTUFBTSxjQUFjLEdBQUcsQ0FBQyxLQUE4QixFQUFFLE1BQTZDLEVBQUUsRUFBRTtRQUM5RyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO1FBRXpHLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFekIsUUFBUTthQUNMLGdCQUFnQixDQUFDLGVBQWUsQ0FBQzthQUNqQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FDaEIsTUFBTSxDQUFDLEVBQUUsS0FBSyxTQUFTLFFBQVEsRUFBRTtZQUMvQixDQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FDN0MsQ0FBQTtRQUVILFlBQVksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBRTlDLDhEQUE4RDtRQUM5RCxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUVyRCxvQ0FBb0M7UUFDcEMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDM0IsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ25DLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNuQyxDQUFDO2FBQU0sQ0FBQztZQUNOLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUN2QyxDQUFDO0lBQ0gsQ0FBQyxDQUFBO0lBekJZLFFBQUEsY0FBYyxrQkF5QjFCIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IHNldEVkaXRvclRoZW1lID0gKHRoZW1lOiAnbGlnaHQnIHwgJ2RhcmsnIHwgJ2hjJywgZWRpdG9yOiB0eXBlb2YgaW1wb3J0KCdtb25hY28tZWRpdG9yJykuZWRpdG9yKSA9PiB7XG4gIGNvbnN0IG5ld1RoZW1lID0gdGhlbWUgPyB0aGVtZSA6IGxvY2FsU3RvcmFnZSA/IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdlZGl0b3ItdGhlbWUnKSB8fCAnbGlnaHQnIDogJ2xpZ2h0J1xuXG4gIGVkaXRvci5zZXRUaGVtZShuZXdUaGVtZSlcblxuICBkb2N1bWVudFxuICAgIC5xdWVyeVNlbGVjdG9yQWxsKCdhW2lkXj10aGVtZS1dJylcbiAgICAuZm9yRWFjaChhbmNob3IgPT5cbiAgICAgIGFuY2hvci5pZCA9PT0gYHRoZW1lLSR7bmV3VGhlbWV9YFxuICAgICAgICA/IGFuY2hvci5jbGFzc0xpc3QuYWRkKCdjdXJyZW50LXRoZW1lJylcbiAgICAgICAgOiBhbmNob3IuY2xhc3NMaXN0LnJlbW92ZSgnY3VycmVudC10aGVtZScpXG4gICAgKVxuXG4gIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdlZGl0b3ItdGhlbWUnLCBuZXdUaGVtZSlcblxuICAvLyBTZXRzIHRoZSB0aGVtZSBvbiB0aGUgYm9keSBzbyBDU1MgY2FuIGNoYW5nZSBiZXR3ZWVuIHRoZW1lc1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xpZ2h0JywgJ2RhcmsnLCAnaGMnKVxuXG4gIC8vIFNvIGRhcmsgYW5kIGRhcmstaGMgY2FuIHNoYXJlIENTU1xuICBpZiAobmV3VGhlbWUgPT09ICdkYXJrLWhjJykge1xuICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnZGFyaycpXG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdoYycpXG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKG5ld1RoZW1lKVxuICB9XG59XG4iXX0=