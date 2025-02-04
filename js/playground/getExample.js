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
            // @ts-ignore
            window.appInsights &&
                // @ts-ignore
                window.appInsights.trackEvent({ name: "Read Playground Example", properties: { id: exampleID, lang } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0RXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3BsYXlncm91bmQvc3JjL2dldEV4YW1wbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFPLE1BQU0sb0JBQW9CLEdBQUcsQ0FBTyxNQUFjLEVBQUUsSUFBWSxFQUFFLFNBQWlCLEVBQUUsRUFBRTtRQUM1RixJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sRUFBRSxDQUFBO1lBQ2hGLE1BQU0sZUFBZSxHQUFHLEdBQUcsSUFBSSxnQkFBZ0IsSUFBSSxPQUFPLENBQUE7WUFDMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUE7WUFDeEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDWixPQUFPLENBQUMsS0FBSyxDQUFDLHdDQUF3QyxHQUFHLElBQUksQ0FBQyxDQUFBO2dCQUM5RCxPQUFPLEVBQUUsQ0FBQTtZQUNYLENBQUM7WUFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUM1QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQTtZQUNqRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2Isa0JBQWtCO2dCQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxTQUFTLFdBQVcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsZUFBZSxFQUFFLENBQUMsQ0FBQTtnQkFDL0ksT0FBTyxFQUFFLENBQUE7WUFDWCxDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsR0FBRyxJQUFJLGdCQUFnQixPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUN2RyxNQUFNLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQTtZQUM1QyxJQUFJLElBQUksR0FBRyxNQUFNLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUUvQiw4Q0FBOEM7WUFDOUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7WUFDcEQsQ0FBQztZQUVELGFBQWE7WUFDYixNQUFNLENBQUMsV0FBVztnQkFDbEIsYUFBYTtnQkFDYixNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSx5QkFBeUIsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUV2RyxPQUFPO2dCQUNMLE9BQU87Z0JBQ1AsSUFBSTthQUNMLENBQUE7UUFDSCxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDZCxPQUFPLEVBQUUsQ0FBQTtRQUNYLENBQUM7SUFDSCxDQUFDLENBQUEsQ0FBQTtJQXhDWSxRQUFBLG9CQUFvQix3QkF3Q2hDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IGdldEV4YW1wbGVTb3VyY2VDb2RlID0gYXN5bmMgKHByZWZpeDogc3RyaW5nLCBsYW5nOiBzdHJpbmcsIGV4YW1wbGVJRDogc3RyaW5nKSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2l0ZSA9IGAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7cHJlZml4fWBcbiAgICBjb25zdCBleGFtcGxlc1RPQ0hyZWYgPSBgJHtzaXRlfS9qcy9leGFtcGxlcy8ke2xhbmd9Lmpzb25gXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goZXhhbXBsZXNUT0NIcmVmKVxuICAgIGlmICghcmVzLm9rKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiQ291bGQgbm90IGZldGNoIGV4YW1wbGUgVE9DIGZvciBsYW5nOiBcIiArIGxhbmcpXG4gICAgICByZXR1cm4ge31cbiAgICB9XG5cbiAgICBjb25zdCB0b2MgPSBhd2FpdCByZXMuanNvbigpXG4gICAgY29uc3QgZXhhbXBsZSA9IHRvYy5leGFtcGxlcy5maW5kKChlOiBhbnkpID0+IGUuaWQgPT09IGV4YW1wbGVJRClcbiAgICBpZiAoIWV4YW1wbGUpIHtcbiAgICAgIC8vIHByZXR0aWVyLWlnbm9yZVxuICAgICAgY29uc29sZS5lcnJvcihgQ291bGQgbm90IGZpbmQgZXhhbXBsZSB3aXRoIGlkOiAke2V4YW1wbGVJRH0gaW5cXG4vLyAke2RvY3VtZW50LmxvY2F0aW9uLnByb3RvY29sfS8vJHtkb2N1bWVudC5sb2NhdGlvbi5ob3N0fSR7ZXhhbXBsZXNUT0NIcmVmfWApXG4gICAgICByZXR1cm4ge31cbiAgICB9XG5cbiAgICBjb25zdCBleGFtcGxlQ29kZVBhdGggPSBgJHtzaXRlfS9qcy9leGFtcGxlcy8ke2V4YW1wbGUubGFuZ30vJHtleGFtcGxlLnBhdGguam9pbihcIi9cIil9LyR7ZXhhbXBsZS5uYW1lfWBcbiAgICBjb25zdCBjb2RlUmVzID0gYXdhaXQgZmV0Y2goZXhhbXBsZUNvZGVQYXRoKVxuICAgIGxldCBjb2RlID0gYXdhaXQgY29kZVJlcy50ZXh0KClcblxuICAgIC8vIEhhbmRsZSByZW1vdmluZyB0aGUgY29tcGlsZXIgc2V0dGluZ3Mgc3R1ZmZcbiAgICBpZiAoY29kZS5zdGFydHNXaXRoKFwiLy8vLyB7XCIpKSB7XG4gICAgICBjb2RlID0gY29kZS5zcGxpdChcIlxcblwiKS5zbGljZSgxKS5qb2luKFwiXFxuXCIpLnRyaW0oKVxuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICB3aW5kb3cuYXBwSW5zaWdodHMgJiZcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgd2luZG93LmFwcEluc2lnaHRzLnRyYWNrRXZlbnQoeyBuYW1lOiBcIlJlYWQgUGxheWdyb3VuZCBFeGFtcGxlXCIsIHByb3BlcnRpZXM6IHsgaWQ6IGV4YW1wbGVJRCwgbGFuZyB9IH0pXG5cbiAgICByZXR1cm4ge1xuICAgICAgZXhhbXBsZSxcbiAgICAgIGNvZGUsXG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coZSlcbiAgICByZXR1cm4ge31cbiAgfVxufVxuIl19