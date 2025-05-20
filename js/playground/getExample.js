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
    exports.getExampleSourceCode = void 0;
    const getExampleSourceCode = (prefix, lang, exampleID) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const site = `${document.location.protocol}//${document.location.host}${prefix}`;
            const examplesTOCHref = `${site}/js/examples/${lang}.json`;
            const res = yield fetch(examplesTOCHref);
            if (!res.ok) {
                console.error("Could not fetch example TOC for lang: " + lang);
                return {};
            }
            const toc = yield res.json();
            const example = toc.examples.find((e) => e.id === exampleID);
            if (!example) {
                // prettier-ignore
                console.error(`Could not find example with id: ${exampleID} in\n// ${document.location.protocol}//${document.location.host}${examplesTOCHref}`);
                return {};
            }
            const exampleCodePath = `${site}/js/examples/${example.lang}/${example.path.join("/")}/${example.name}`;
            const codeRes = yield fetch(exampleCodePath);
            let code = yield codeRes.text();
            // Handle removing the compiler settings stuff
            if (code.startsWith("//// {")) {
                code = code.split("\n").slice(1).join("\n").trim();
            }
            return {
                example,
                code,
            };
        }
        catch (e) {
            console.log(e);
            return {};
        }
    });
    exports.getExampleSourceCode = getExampleSourceCode;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0RXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL2dldEV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFPLE1BQU0sb0JBQW9CLEdBQUcsQ0FBTyxNQUFjLEVBQUUsSUFBWSxFQUFFLFNBQWlCLEVBQUUsRUFBRTtRQUM1RixJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFBO1lBQ2hGLE1BQU0sZUFBZSxHQUFHLEdBQUcsSUFBSSxnQkFBZ0IsSUFBSSxPQUFPLENBQUE7WUFDMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxHQUFHLElBQUksQ0FBQyxDQUFBO2dCQUM5RCxPQUFPLEVBQUUsQ0FBQTtZQUNYLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUM1QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQTtZQUNqRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2Isa0JBQWtCO2dCQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxTQUFTLFdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsZUFBZSxFQUFFLENBQUMsQ0FBQTtnQkFDL0ksT0FBTyxFQUFFLENBQUE7WUFDWCxDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsR0FBRyxJQUFJLGdCQUFnQixPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUN2RyxNQUFNLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUM1QyxJQUFJLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUUvQiw4Q0FBOEM7WUFDOUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDcEQsQ0FBQztZQUVELE9BQU87Z0JBQ0wsT0FBTztnQkFDUCxJQUFJO2FBQ0wsQ0FBQTtRQUNILENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNkLE9BQU8sRUFBRSxDQUFBO1FBQ1gsQ0FBQztJQUNILENBQUMsQ0FBQSxDQUFBO0lBbkNZLFFBQUEsb0JBQW9CLHdCQW1DaEMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgZ2V0RXhhbXBsZVNvdXJjZUNvZGUgPSBhc3luYyAocHJlZml4OiBzdHJpbmcsIGxhbmc6IHN0cmluZywgZXhhbXBsZUlEOiBzdHJpbmcpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzaXRlID0gYCR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtwcmVmaXh9YFxuICAgIGNvbnN0IGV4YW1wbGVzVE9DSHJlZiA9IGAke3NpdGV9L2pzL2V4YW1wbGVzLyR7bGFuZ30uanNvbmBcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChleGFtcGxlc1RPQ0hyZWYpXG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJDb3VsZCBub3QgZmV0Y2ggZXhhbXBsZSBUT0MgZm9yIGxhbmc6IFwiICsgbGFuZylcbiAgICAgIHJldHVybiB7fVxuICAgIH1cblxuICAgIGNvbnN0IHRvYyA9IGF3YWl0IHJlcy5qc29uKClcbiAgICBjb25zdCBleGFtcGxlID0gdG9jLmV4YW1wbGVzLmZpbmQoKGU6IGFueSkgPT4gZS5pZCA9PT0gZXhhbXBsZUlEKVxuICAgIGlmICghZXhhbXBsZSkge1xuICAgICAgLy8gcHJldHRpZXItaWdub3JlXG4gICAgICBjb25zb2xlLmVycm9yKGBDb3VsZCBub3QgZmluZCBleGFtcGxlIHdpdGggaWQ6ICR7ZXhhbXBsZUlEfSBpblxcbi8vICR7ZG9jdW1lbnQubG9jYXRpb24ucHJvdG9jb2x9Ly8ke2RvY3VtZW50LmxvY2F0aW9uLmhvc3R9JHtleGFtcGxlc1RPQ0hyZWZ9YClcbiAgICAgIHJldHVybiB7fVxuICAgIH1cblxuICAgIGNvbnN0IGV4YW1wbGVDb2RlUGF0aCA9IGAke3NpdGV9L2pzL2V4YW1wbGVzLyR7ZXhhbXBsZS5sYW5nfS8ke2V4YW1wbGUucGF0aC5qb2luKFwiL1wiKX0vJHtleGFtcGxlLm5hbWV9YFxuICAgIGNvbnN0IGNvZGVSZXMgPSBhd2FpdCBmZXRjaChleGFtcGxlQ29kZVBhdGgpXG4gICAgbGV0IGNvZGUgPSBhd2FpdCBjb2RlUmVzLnRleHQoKVxuXG4gICAgLy8gSGFuZGxlIHJlbW92aW5nIHRoZSBjb21waWxlciBzZXR0aW5ncyBzdHVmZlxuICAgIGlmIChjb2RlLnN0YXJ0c1dpdGgoXCIvLy8vIHtcIikpIHtcbiAgICAgIGNvZGUgPSBjb2RlLnNwbGl0KFwiXFxuXCIpLnNsaWNlKDEpLmpvaW4oXCJcXG5cIikudHJpbSgpXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4YW1wbGUsXG4gICAgICBjb2RlLFxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUubG9nKGUpXG4gICAgcmV0dXJuIHt9XG4gIH1cbn1cbiJdfQ==