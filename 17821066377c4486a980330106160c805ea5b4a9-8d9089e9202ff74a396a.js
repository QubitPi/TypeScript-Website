(self.webpackChunktypescriptlang_org=self.webpackChunktypescriptlang_org||[]).push([[414],{1176:function(t,e,n){var r=n(5052);t.exports=function(t){if(!r(t))throw TypeError(String(t)+" is not an object");return t}},9540:function(t,e,n){var r=n(905),i=n(4237),o=n(3231),s=function(t){return function(e,n,s){var a,u=r(e),c=i(u.length),l=o(s,c);if(t&&n!=n){for(;c>l;)if((a=u[l++])!=a)return!0}else for(;c>l;l++)if((t||l in u)&&u[l]===n)return t||l||0;return!t&&-1}};t.exports={includes:s(!0),indexOf:s(!1)}},7079:function(t){var e={}.toString;t.exports=function(t){return e.call(t).slice(8,-1)}},7081:function(t,e,n){var r=n(816),i=n(4826),o=n(7933),s=n(1787);t.exports=function(t,e){for(var n=i(e),a=s.f,u=o.f,c=0;c<n.length;c++){var l=n[c];r(t,l)||a(t,l,u(e,l))}}},5762:function(t,e,n){var r=n(7400),i=n(1787),o=n(5358);t.exports=r?function(t,e,n){return i.f(t,e,o(1,n))}:function(t,e,n){return t[e]=n,t}},5358:function(t){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},7400:function(t,e,n){var r=n(4229);t.exports=!r((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]}))},2635:function(t,e,n){var r=n(9859),i=n(5052),o=r.document,s=i(o)&&i(o.createElement);t.exports=function(t){return s?o.createElement(t):{}}},3837:function(t){t.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},2990:function(t,e,n){var r=n(9859),i=n(7933).f,o=n(5762),s=n(7487),a=n(2079),u=n(7081),c=n(6541);t.exports=function(t,e){var n,l,f,p,d,h=t.target,v=t.global,g=t.stat;if(n=v?r:g?r[h]||a(h,{}):(r[h]||{}).prototype)for(l in e){if(p=e[l],f=t.noTargetGet?(d=i(n,l))&&d.value:n[l],!c(v?l:h+(g?".":"#")+l,t.forced)&&void 0!==f){if(typeof p==typeof f)continue;u(p,f)}(t.sham||f&&f.sham)&&o(p,"sham",!0),s(n,l,p,t)}}},4229:function(t){t.exports=function(t){try{return!!t()}catch(e){return!0}}},1333:function(t,e,n){var r=n(9276),i=n(9859),o=function(t){return"function"==typeof t?t:void 0};t.exports=function(t,e){return arguments.length<2?o(r[t])||o(i[t]):r[t]&&r[t][e]||i[t]&&i[t][e]}},9859:function(t,e,n){var r=function(t){return t&&t.Math==Math&&t};t.exports=r("object"==typeof globalThis&&globalThis)||r("object"==typeof window&&window)||r("object"==typeof self&&self)||r("object"==typeof n.g&&n.g)||function(){return this}()||Function("return this")()},816:function(t){var e={}.hasOwnProperty;t.exports=function(t,n){return e.call(t,n)}},5977:function(t){t.exports={}},4394:function(t,e,n){var r=n(7400),i=n(4229),o=n(2635);t.exports=!r&&!i((function(){return 7!=Object.defineProperty(o("div"),"a",{get:function(){return 7}}).a}))},9337:function(t,e,n){var r=n(4229),i=n(7079),o="".split;t.exports=r((function(){return!Object("z").propertyIsEnumerable(0)}))?function(t){return"String"==i(t)?o.call(t,""):Object(t)}:Object},8511:function(t,e,n){var r=n(5353),i=Function.toString;"function"!=typeof r.inspectSource&&(r.inspectSource=function(t){return i.call(t)}),t.exports=r.inspectSource},6407:function(t,e,n){var r,i,o,s=n(8694),a=n(9859),u=n(5052),c=n(5762),l=n(816),f=n(5353),p=n(4399),d=n(5977),h=a.WeakMap;if(s){var v=f.state||(f.state=new h),g=v.get,m=v.has,y=v.set;r=function(t,e){return e.facade=t,y.call(v,t,e),e},i=function(t){return g.call(v,t)||{}},o=function(t){return m.call(v,t)}}else{var b=p("state");d[b]=!0,r=function(t,e){return e.facade=t,c(t,b,e),e},i=function(t){return l(t,b)?t[b]:{}},o=function(t){return l(t,b)}}t.exports={set:r,get:i,has:o,enforce:function(t){return o(t)?i(t):r(t,{})},getterFor:function(t){return function(e){var n;if(!u(e)||(n=i(e)).type!==t)throw TypeError("Incompatible receiver, "+t+" required");return n}}}},6541:function(t,e,n){var r=n(4229),i=/#|\.prototype\./,o=function(t,e){var n=a[s(t)];return n==c||n!=u&&("function"==typeof e?r(e):!!e)},s=o.normalize=function(t){return String(t).replace(i,".").toLowerCase()},a=o.data={},u=o.NATIVE="N",c=o.POLYFILL="P";t.exports=o},5052:function(t){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},4231:function(t){t.exports=!1},8694:function(t,e,n){var r=n(9859),i=n(8511),o=r.WeakMap;t.exports="function"==typeof o&&/native code/.test(i(o))},1787:function(t,e,n){var r=n(7400),i=n(4394),o=n(1176),s=n(2066),a=Object.defineProperty;e.f=r?a:function(t,e,n){if(o(t),e=s(e,!0),o(n),i)try{return a(t,e,n)}catch(r){}if("get"in n||"set"in n)throw TypeError("Accessors not supported");return"value"in n&&(t[e]=n.value),t}},7933:function(t,e,n){var r=n(7400),i=n(9195),o=n(5358),s=n(905),a=n(2066),u=n(816),c=n(4394),l=Object.getOwnPropertyDescriptor;e.f=r?l:function(t,e){if(t=s(t),e=a(e,!0),c)try{return l(t,e)}catch(n){}if(u(t,e))return o(!i.f.call(t,e),t[e])}},8151:function(t,e,n){var r=n(140),i=n(3837).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return r(t,i)}},894:function(t,e){e.f=Object.getOwnPropertySymbols},140:function(t,e,n){var r=n(816),i=n(905),o=n(9540).indexOf,s=n(5977);t.exports=function(t,e){var n,a=i(t),u=0,c=[];for(n in a)!r(s,n)&&r(a,n)&&c.push(n);for(;e.length>u;)r(a,n=e[u++])&&(~o(c,n)||c.push(n));return c}},9195:function(t,e){"use strict";var n={}.propertyIsEnumerable,r=Object.getOwnPropertyDescriptor,i=r&&!n.call({1:2},1);e.f=i?function(t){var e=r(this,t);return!!e&&e.enumerable}:n},4826:function(t,e,n){var r=n(1333),i=n(8151),o=n(894),s=n(1176);t.exports=r("Reflect","ownKeys")||function(t){var e=i.f(s(t)),n=o.f;return n?e.concat(n(t)):e}},9276:function(t,e,n){var r=n(9859);t.exports=r},7487:function(t,e,n){var r=n(9859),i=n(5762),o=n(816),s=n(2079),a=n(8511),u=n(6407),c=u.get,l=u.enforce,f=String(String).split("String");(t.exports=function(t,e,n,a){var u,c=!!a&&!!a.unsafe,p=!!a&&!!a.enumerable,d=!!a&&!!a.noTargetGet;"function"==typeof n&&("string"!=typeof e||o(n,"name")||i(n,"name",e),(u=l(n)).source||(u.source=f.join("string"==typeof e?e:""))),t!==r?(c?!d&&t[e]&&(p=!0):delete t[e],p?t[e]=n:i(t,e,n)):p?t[e]=n:s(e,n)})(Function.prototype,"toString",(function(){return"function"==typeof this&&c(this).source||a(this)}))},8885:function(t){t.exports=function(t){if(null==t)throw TypeError("Can't call method on "+t);return t}},2079:function(t,e,n){var r=n(9859),i=n(5762);t.exports=function(t,e){try{i(r,t,e)}catch(n){r[t]=e}return e}},4399:function(t,e,n){var r=n(3036),i=n(1441),o=r("keys");t.exports=function(t){return o[t]||(o[t]=i(t))}},5353:function(t,e,n){var r=n(9859),i=n(2079),o="__core-js_shared__",s=r[o]||i(o,{});t.exports=s},3036:function(t,e,n){var r=n(4231),i=n(5353);(t.exports=function(t,e){return i[t]||(i[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.10.1",mode:r?"pure":"global",copyright:"© 2021 Denis Pushkarev (zloirock.ru)"})},9445:function(t,e,n){var r=n(4229),i=n(1647);t.exports=function(t){return r((function(){return!!i[t]()||"​᠎"!="​᠎"[t]()||i[t].name!==t}))}},1017:function(t,e,n){var r=n(8885),i="["+n(1647)+"]",o=RegExp("^"+i+i+"*"),s=RegExp(i+i+"*$"),a=function(t){return function(e){var n=String(r(e));return 1&t&&(n=n.replace(o,"")),2&t&&(n=n.replace(s,"")),n}};t.exports={start:a(1),end:a(2),trim:a(3)}},3231:function(t,e,n){var r=n(6051),i=Math.max,o=Math.min;t.exports=function(t,e){var n=r(t);return n<0?i(n+e,0):o(n,e)}},905:function(t,e,n){var r=n(9337),i=n(8885);t.exports=function(t){return r(i(t))}},6051:function(t){var e=Math.ceil,n=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?n:e)(t)}},4237:function(t,e,n){var r=n(6051),i=Math.min;t.exports=function(t){return t>0?i(r(t),9007199254740991):0}},2066:function(t,e,n){var r=n(5052);t.exports=function(t,e){if(!r(t))return t;var n,i;if(e&&"function"==typeof(n=t.toString)&&!r(i=n.call(t)))return i;if("function"==typeof(n=t.valueOf)&&!r(i=n.call(t)))return i;if(!e&&"function"==typeof(n=t.toString)&&!r(i=n.call(t)))return i;throw TypeError("Can't convert object to primitive value")}},1441:function(t){var e=0,n=Math.random();t.exports=function(t){return"Symbol("+String(void 0===t?"":t)+")_"+(++e+n).toString(36)}},1647:function(t){t.exports="\t\n\v\f\r                　\u2028\u2029\ufeff"},8827:function(t,e,n){"use strict";var r=n(2990),i=n(1017).end,o=n(9445)("trimEnd"),s=o?function(){return i(this)}:"".trimEnd;r({target:"String",proto:!0,forced:o},{trimEnd:s,trimRight:s})},8639:function(t,e,n){"use strict";n.d(e,{o:function(){return i}});var r=n(8447),i=function(){return{sandboxRoot:(0,r.withPrefix)("/js/sandbox"),playgroundRoot:(0,r.withPrefix)("/js/playground"),playgroundWorker:(0,r.withPrefix)("/js/playground-worker/index.js")}}},2057:function(t,e,n){"use strict";n.d(e,{k:function(){return F}});n(8827);var r=n(3415),i=n(5143),o=n(3712);function s(){return(s=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t}).apply(this,arguments)}function a(t){return(a=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}function u(t,e){return(u=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function c(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function l(t,e,n){return(l=c()?Reflect.construct:function(t,e,n){var r=[null];r.push.apply(r,e);var i=new(Function.bind.apply(t,r));return n&&u(i,n.prototype),i}).apply(null,arguments)}function f(t){var e="function"==typeof Map?new Map:void 0;return(f=function(t){if(null===t||(n=t,-1===Function.toString.call(n).indexOf("[native code]")))return t;var n;if("function"!=typeof t)throw new TypeError("Super expression must either be null or a function");if(void 0!==e){if(e.has(t))return e.get(t);e.set(t,r)}function r(){return l(t,arguments,a(this).constructor)}return r.prototype=Object.create(t.prototype,{constructor:{value:r,enumerable:!1,writable:!0,configurable:!0}}),u(r,t)})(t)}function p(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function d(t,e){var n;if("undefined"==typeof Symbol||null==t[Symbol.iterator]){if(Array.isArray(t)||(n=function(t,e){if(t){if("string"==typeof t)return p(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?p(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0;return function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}return(n=t[Symbol.iterator]()).next.bind(n)}function h(t,e){switch(e){case"number":return+t;case"string":return t;case"boolean":return"true"===t.toLowerCase()||0===t.length}throw new y("Unknown primitive value in compiler flag","The only recognized primitives are number, string and boolean. Got "+e+" with "+t+".","This is likely a typo.")}var v=!1;try{v="undefined"!=typeof localStorage}catch(k){}var g=void 0!==i,m=v&&localStorage.getItem("DEBUG")||g&&{}.DEBUG?o.log:function(t){return""},y=function(t){var e,n;function r(e,n,r,i){var o,s="\n## "+e+"\n\n"+n+"\n";return r&&(s+="\n"+r),i&&(s+="\n"+i),(o=t.call(this,s)||this).title=void 0,o.description=void 0,o.recommendation=void 0,o.code=void 0,o.title=e,o.description=n,o.recommendation=r,o.code=i,o}return n=t,(e=r).prototype=Object.create(n.prototype),e.prototype.constructor=e,u(e,n),r}(f(Error));function b(t){for(var e=[],n=[],r=0,i=0,o=0,s=function(s){var u=t[s],c=function(){i=r,r+=u.length+1},l=function(e){m("Removing line "+s+" for "+e),o++,t.splice(s,1),s--};if(u.includes("//")){var f=/^\s*\/\/\s*\^+( .+)?$/.exec(u),p=/^\s*\/\/\s*\^\?\s*$/.exec(u),d=/^\s*\/\/ prettier-ignore$/.exec(u),h=/^\s*\/\/\s*\^\|$/.exec(u);if(null!==p){var v=u.indexOf("^");n.push({kind:"query",offset:v,text:void 0,docs:void 0,line:s+o-1}),l("having a query")}else if(null!==f){var g=u.indexOf("^"),y=u.lastIndexOf("^")-g+1,b=f[1]?f[1].trim():"";e.push({kind:"highlight",offset:g+i,length:y,text:b,line:s+o-1,start:g}),l("having a highlight")}else if(null!==d)l("being a prettier ignore");else if(null!==h){var x=u.indexOf("^");n.push({kind:"completion",offset:x,text:void 0,docs:void 0,line:s+o-1}),l("having a completion query")}else c()}else c();a=s},a=0;a<t.length;a++)s(a);return{highlights:e,queries:n}}function x(t,e,n){var r=n.get(e.toLowerCase());if(m("Get "+t+" mapped option: "+e+" => "+r),void 0===r){var i=Array.from(n.keys());throw new y("Invalid inline compiler value","Got "+e+" for "+t+" but it is not a supported value by the TS compiler.","Allowed values: "+i.join(","))}return r}function w(t,e,n,r){m("Setting "+t+" to "+e);for(var i,o=function(){var r=i.value;if(r.name.toLowerCase()===t.toLowerCase()){switch(r.type){case"number":case"string":case"boolean":n[r.name]=h(e,r.type);break;case"list":var o=r.element.type,s=e.split(",");n[r.name]="string"==typeof o?s.map((function(t){return h(t,o)})):s.map((function(t){return x(r.name,t,o)}));break;default:var a=r.type;n[r.name]=x(r.name,e,a)}return{v:void 0}}},s=d(r.optionDeclarations);!(i=s()).done;){var a=o();if("object"==typeof a)return a.v}throw new y("Invalid inline compiler flag","There isn't a TypeScript compiler flag called '"+t+"'.","This is likely a typo, you can check all the compiler flags in the TSConfig reference, or check the additional Twoslash flags in the npm page for @typescript/twoslash.")}var S=/^\/\/\s?@(\w+)$/,E=/^\/\/\s?@(\w+):\s?(.+)$/;var j={errors:[],noErrors:!1,showEmit:!1,showEmittedFile:void 0,noStaticSemanticInfo:!1,emit:!1,noErrorValidation:!1};function F(t,e,o){var a,u,c;void 0===o&&(o={});var l=null!=(a=o.tsModule)?a:n(9809),f=null!=(u=o.lzstringModule)?u:n(5472),p=t,h=function(t){var e={js:"js",javascript:"js",ts:"ts",typescript:"ts",tsx:"tsx",jsx:"jsx",json:"json",jsn:"json"};if(e[t])return e[t];throw new y("Unknown TypeScript extension given to Twoslash","Received "+t+" but Twoslash only accepts: "+Object.keys(e)+" ","")}(e),v="index."+h;m("\n\nLooking at code: \n```"+h+"\n"+t+"\n```\n");var g=s({strict:!0,target:l.ScriptTarget.ES2016,allowJs:!0},null!=(c=o.defaultCompilerOptions)?c:{});!function(t){if(t.includes("// @errors "))throw new y("You have '// @errors ' (with a space)","You want '// @errors: ' (with a colon)","This is a pretty common typo");if(t.includes("// @filename "))throw new y("You have '// @filename ' (with a space)","You want '// @filename: ' (with a colon)","This is a pretty common typo")}(t);var x=(t=function(t){return(t=t.replace(/¨D/g,"$")).replace(/¨T/g,"~")}(t)).split(/\r\n?|\n/g),F=o.customTags?function(t,e){for(var n=[],r=0;r<t.length;){var i;(i=E.exec(t[r]))&&e.includes(i[1])&&(n.push({name:i[1],line:r,annotation:t[r].split("@"+i[1]+": ")[1]}),t.splice(r,1)),r++}return n}(x,o.customTags):[],k=s({},function(t){for(var e=s({},j),n=0;n<t.length;n++){var r=void 0;(r=S.exec(t[n]))?r[1]in e&&(e[r[1]]=!0,m("Setting options."+r[1]+" to true"),t.splice(n,1),n--):(r=E.exec(t[n]))&&r[1]in e&&(e[r[1]]=r[2],m("Setting options."+r[1]+" to "+r[2]),t.splice(n,1),n--)}return"errors"in e&&"string"==typeof e.errors&&(e.errors=e.errors.split(" ").map(Number),m("Setting options.error to ",e.errors)),e}(x),o.defaultOptions),T=function(t,e,n){for(var r=s({},e),i=0;i<t.length;){var o=void 0;if(o=S.exec(t[i]))r[o[1]]=!0,w(o[1],"true",r,n);else{if(!(o=E.exec(t[i]))){i++;continue}if("filename"===o[1]){i++;continue}w(o[1],o[2],r,n)}t.splice(i,1)}return r}(x,g,l);k.showEmittedFile||(k.showEmittedFile=T.jsx&&T.jsx===l.JsxEmit.Preserve?"index.jsx":"index.js");var P=function(){var t=n(3768)("path");return(o.vfsRoot||i.cwd()).split(t.sep).join(t.posix.sep)},C=!!o.fsMap,D=C&&o.fsMap?o.fsMap:new Map,L=C?(0,r.FI)(D):(0,r.Lk)(D,P(),l,o.tsLibDirectory),N=C?"/":P()+"/",M=(0,r.sE)(L,[],l,T,o.customTransformers),I=M.languageService;t=x.join("\n");for(var A,_=[],R=[],q=[],U=O(t,v,N),W=["js","jsx","ts","tsx"],$=U.map((function(t){return t[0]})),G=function(){var t=A.value,e=t[0],n=t[1],r=e.split(".").pop()||"",i=T.resolveJsonModule&&"json"===r;if(!W.includes(r)&&!i)return"continue";var o=n.join("\n");M.createFile(e,o);var s=b(n);q=q.concat(s.highlights);var a=s.queries.map((function(t,n){var r=M.getSourceFile(e),i=l.getPositionOfLineAndCharacter(r,t.line,t.offset);switch(t.kind){case"query":var o=I.getQuickInfoAtPosition(e,i);if(!o||!o.displayParts)throw new y("Invalid QuickInfo query","The request on line "+t.line+" in "+e+" for quickinfo via ^? returned no from the compiler.","This is likely that the x positioning is off.");return{kind:"query",text:o.displayParts.map((function(t){return t.text})).join(""),docs:o.documentation?o.documentation.map((function(t){return t.text})).join("<br/>"):void 0,line:t.line-n,offset:t.offset,file:e};case"completion":var s=I.getCompletionsAtPosition(e,i-1,{});if(!s&&!k.noErrorValidation)throw new y("Invalid completion query","The request on line "+t.line+" in "+e+" for completions via ^| returned no completions from the compiler.","This is likely that the positioning is off.");var a=function(t,e){t=String(t),e=Number(e)>>>0;var n=t.slice(0,e+1).search(/\S+$/),r=t.slice(e).search(/\s/);return r<0?{word:t.slice(n),startPos:n}:{word:t.slice(n,r+e),startPos:n}}(r.text,i-1),u=r.text.slice(a.startPos,i).split(".").pop()||"";return{kind:"completions",completions:(null==s?void 0:s.entries)||[],completionPrefix:u,line:t.line-n,offset:t.offset,file:e}}}));_=_.concat(a);var u=n.join("\n");M.updateFile(e,u)},V=d(U);!(A=V()).done;)G();var z=t.split(/\r\n?|\n/g);b(z),t=z.join("\n"),k.emit&&$.forEach((function(t){var e=t.split(".").pop()||"";W.includes(e)&&I.getEmitOutput(t).outputFiles.forEach((function(t){L.writeFile(t.name,t.text)}))}));var B=[],Y=[];$.forEach((function(e){var n=e.split(".").pop()||"";if(W.includes(n)){k.noErrors||(B=B.concat(I.getSemanticDiagnostics(e),I.getSyntacticDiagnostics(e)));var r=M.sys.readFile(e),i=M.getSourceFile(e);if(!i)throw new y("Could not find a  TypeScript sourcefile for '"+e+"' in the Twoslash vfs","It's a little hard to provide useful advice on this error. Maybe you imported something which the compiler doesn't think is a source file?","");if(!k.showEmit){for(var o,s=-1==t.indexOf(r)?0:t.indexOf(r),a=t.slice(0,s).split("\n").length-1,u=d(k.noStaticSemanticInfo?[]:function(t,e){var n=[];return function r(i){t.forEachChild(i,(function(i){if(t.isIdentifier(i)){var o=i.getStart(e,!1);n.push({span:t.createTextSpan(o,i.end-o),text:i.getText(e)})}r(i)}))}(e),n}(l,i));!(o=u()).done;){var c=o.value,f=c.span,p=I.getQuickInfoAtPosition(e,f.start);if(p&&p.displayParts){var h=p.displayParts.map((function(t){return t.text})).join(""),v=c.text,g=p.documentation?p.documentation.map((function(t){return t.text})).join("\n"):void 0,m=f.start+s,b=l.createSourceFile("_.ts",t,l.ScriptTarget.ES2015),x=l.getLineAndCharacterOfPosition(b,m),w=x.line,S=x.character;Y.push({text:h,docs:g,start:m,length:f.length,line:w,character:S,targetString:v})}}_.filter((function(t){return t.file===e})).forEach((function(t){var e=l.getPositionOfLineAndCharacter(i,t.line,t.offset)+s;switch(t.kind){case"query":R.push({docs:t.docs,kind:"query",start:e+s,length:t.text.length,text:t.text,offset:t.offset,line:t.line+a+1});break;case"completions":R.push({completions:t.completions,kind:"completions",start:e+s,completionsPrefix:t.completionPrefix,length:1,offset:t.offset,line:t.line+a+1})}}))}}}));var H=B.filter((function(t){return t.file&&$.includes(t.file.fileName)}));!k.noErrorValidation&&H.length&&function(t,e,n,r,i){var o=t.filter((function(t){return!e.errors.includes(t.code)})),s=Array.from(new Set(o.map((function(t){return t.code})))).join(" ");if(o.length){var a=new Set(t.map((function(t){return t.code}))),u="// @errors: "+Array.from(a).join(" "),c=e.errors.length?"\nThe existing annotation specified "+e.errors.join(" "):"\nExpected: "+u,l={},f=[];o.forEach((function(t){var e,n=(null==(e=t.file)?void 0:e.fileName)&&t.file.fileName.replace(i,"");if(n){var r=l[n];r?r.push(t):l[n]=[t]}else f.push(t)}));var p=function(t,e){return t+"\n  "+e.map((function(t){var e="string"==typeof t.messageText?t.messageText:t.messageText.messageText;return"["+t.code+"] "+t.start+" - "+e})).join("\n  ")},d=[];f.length&&d.push(p("Ambient Errors",f)),Object.keys(l).forEach((function(t){d.push(p(t,l[t]))}));var h=d.join("\n\n"),v=new y("Errors were thrown in the sample, but not included in an errors tag","These errors were not marked as being expected: "+s+". "+c,"Compiler Errors:\n\n"+h);throw v.code="## Code\n\n'''"+n+"\n"+r+"\n'''",v}}(H,k,e,p,N);for(var J,Q=[],K=d(H);!(J=K()).done;){var X=J.value,Z=M.sys.readFile(X.file.fileName),tt=t.indexOf(Z),et=l.flattenDiagnosticMessageText(X.messageText,"\n"),nt="err-"+X.code+"-"+X.start+"-"+X.length,rt=l.getLineAndCharacterOfPosition(X.file,X.start),it=rt.line,ot=rt.character;Q.push({category:X.category,code:X.code,length:X.length,start:X.start?X.start+tt:void 0,line:it,character:ot,renderedMessage:et,id:nt})}if(k.showEmit){var st=k.showEmittedFile||v,at=N+st.replace(".jsx","").replace(".js","").replace(".d.ts","").replace(".map",""),ut=$.find((function(t){return t===at+".ts"||t===at+".tsx"}));if(!ut&&!T.outFile){var ct=$.join(", ");throw new y("Could not find source file to show the emit for","Cannot find the corresponding **source** file  "+st+" for completions via ^| returned no quickinfo from the compiler.","Looked for: "+at+" in the vfs - which contains: "+ct)}T.outFile&&(ut=$[0]);var lt=I.getEmitOutput(ut),ft=lt.outputFiles.find((function(t){return t.name===N+k.showEmittedFile||t.name===k.showEmittedFile}));if(!ft){var pt=lt.outputFiles.map((function(t){return t.name})).join(", ");throw new y("Cannot find the output file in the Twoslash VFS","Looking for "+k.showEmittedFile+" in the Twoslash vfs after compiling",'Looked for" '+(N+k.showEmittedFile)+" in the vfs - which contains "+pt+".")}t=ft.text,e=ft.name.split(".").pop(),q=[],_=[],Y=[]}var dt="https://www.typescriptlang.org/play/#code/"+f.compressToEncodedURIComponent(p),ht="// ---cut---\n";if(t.includes(ht)){var vt=t.indexOf(ht)+ht.length,gt=t.substr(0,vt).split("\n").length-1;t=t.split(ht).pop(),Y.forEach((function(t){t.start-=vt,t.line-=gt})),Y=Y.filter((function(t){return t.start>-1})),Q.forEach((function(t){t.start&&(t.start-=vt),t.line&&(t.line-=gt)})),Q=Q.filter((function(t){return t.start&&t.start>-1})),q.forEach((function(t){t.start-=vt,t.line-=gt})),q=q.filter((function(t){return t.start>-1})),R.forEach((function(t){return t.line-=gt})),R=R.filter((function(t){return t.line>-1})),F.forEach((function(t){return t.line-=gt})),F=F.filter((function(t){return t.line>-1}))}var mt="// ---cut-after---\n";if(t.includes(mt)){var yt=t.indexOf(mt)+mt.length,bt=t.substr(0,yt).split("\n").length-1;t=t.split(mt).shift().trimEnd(),Y=Y.filter((function(t){return t.line<bt})),Q=Q.filter((function(t){return t.line&&t.line<bt})),q=q.filter((function(t){return t.line<bt})),R=R.filter((function(t){return t.line<bt})),F=F.filter((function(t){return t.line<bt}))}return{code:t,extension:e,highlights:q,queries:R,staticQuickInfos:Y,errors:Q,playgroundURL:dt,tags:F}}var O=function(t,e,n){for(var r,i=t.split(/\r\n?|\n/g),o=t.includes("@filename: "+e)?"global.ts":e,s=[],a=[],u=d(i);!(r=u()).done;){var c=r.value;c.includes("// @filename: ")?(a.push([n+o,s]),o=c.split("// @filename: ")[1].trim(),s=[]):s.push(c)}return a.push([n+o,s]),a.filter((function(t){return t[1].length>0&&(t[1].length>1||""!==t[1][0])}))}},3415:function(t,e,n){"use strict";n.d(e,{yp:function(){return f},Lk:function(){return m},FI:function(){return g},sE:function(){return c}});var r=n(5143),i=n(3712);function o(){return(o=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t}).apply(this,arguments)}var s=!1;try{s="undefined"!=typeof localStorage}catch(x){}var a=void 0!==r,u=s&&localStorage.getItem("DEBUG")||a&&{}.DEBUG?i.log:function(t){return""};function c(t,e,n,r,i){void 0===r&&(r={});var s=o({},h(n),r),a=function(t,e,n,r,i){var s=[].concat(e),a=y(t,n,r),u=a.compilerHost,c=a.updateFile,l=new Map,f=0;return{languageServiceHost:o({},u,{getProjectVersion:function(){return f.toString()},getCompilationSettings:function(){return n},getCustomTransformers:function(){return i},getScriptFileNames:function(){return s.slice()},getScriptSnapshot:function(e){var n=t.readFile(e);if(n)return r.ScriptSnapshot.fromString(n)},getScriptVersion:function(t){return l.get(t)||"0"},writeFile:t.writeFile}),updateFile:function(t){f++,l.set(t.fileName,f.toString()),s.includes(t.fileName)||s.push(t.fileName),c(t)}}}(t,e,s,n,i),u=a.languageServiceHost,c=a.updateFile,l=n.createLanguageService(u),f=l.getCompilerOptionsDiagnostics();if(f.length){var p=y(t,r,n);throw new Error(n.formatDiagnostics(f,p.compilerHost))}return{name:"vfs",sys:t,languageService:l,getSourceFile:function(t){var e;return null==(e=l.getProgram())?void 0:e.getSourceFile(t)},createFile:function(t,e){c(n.createSourceFile(t,e,s.target,!1))},updateFile:function(t,e,r){var i=l.getProgram().getSourceFile(t);if(!i)throw new Error("Did not find a source file for "+t);var o=i.text,s=null!=r?r:n.createTextSpan(0,o.length),a=o.slice(0,s.start)+e+o.slice(s.start+s.length),u=n.updateSourceFile(i,a,{span:s,newLength:e.length});c(u)}}}var l=function(t,e){var n,r=t.target||e.ScriptTarget.ES5,i=t.lib||[],o=["lib.d.ts","lib.dom.d.ts","lib.dom.iterable.d.ts","lib.webworker.d.ts","lib.webworker.importscripts.d.ts","lib.scripthost.d.ts","lib.es5.d.ts","lib.es6.d.ts","lib.es2015.collection.d.ts","lib.es2015.core.d.ts","lib.es2015.d.ts","lib.es2015.generator.d.ts","lib.es2015.iterable.d.ts","lib.es2015.promise.d.ts","lib.es2015.proxy.d.ts","lib.es2015.reflect.d.ts","lib.es2015.symbol.d.ts","lib.es2015.symbol.wellknown.d.ts","lib.es2016.array.include.d.ts","lib.es2016.d.ts","lib.es2016.full.d.ts","lib.es2017.d.ts","lib.es2017.full.d.ts","lib.es2017.intl.d.ts","lib.es2017.object.d.ts","lib.es2017.sharedmemory.d.ts","lib.es2017.string.d.ts","lib.es2017.typedarrays.d.ts","lib.es2018.asyncgenerator.d.ts","lib.es2018.asynciterable.d.ts","lib.es2018.d.ts","lib.es2018.full.d.ts","lib.es2018.intl.d.ts","lib.es2018.promise.d.ts","lib.es2018.regexp.d.ts","lib.es2019.array.d.ts","lib.es2019.d.ts","lib.es2019.full.d.ts","lib.es2019.object.d.ts","lib.es2019.string.d.ts","lib.es2019.symbol.d.ts","lib.es2020.d.ts","lib.es2020.full.d.ts","lib.es2020.string.d.ts","lib.es2020.symbol.wellknown.d.ts","lib.es2020.bigint.d.ts","lib.es2020.promise.d.ts","lib.es2020.sharedmemory.d.ts","lib.es2020.intl.d.ts","lib.es2021.d.ts","lib.es2021.full.d.ts","lib.es2021.promise.d.ts","lib.es2021.string.d.ts","lib.es2021.weakref.d.ts","lib.esnext.d.ts","lib.esnext.full.d.ts","lib.esnext.intl.d.ts","lib.esnext.promise.d.ts","lib.esnext.string.d.ts","lib.esnext.weakref.d.ts"],s=e.ScriptTarget[r],a=o.filter((function(t){return t.startsWith("lib."+s.toLowerCase())})),u=o.indexOf(a.pop()),c=i.map((function(t){var e=o.filter((function(e){return e.startsWith("lib."+t.toLowerCase())}));return 0===e.length?0:o.indexOf(e.pop())})),l=((n=c)&&n.length?n.reduce((function(t,e){return e>t?e:t})):void 0)||0,f=Math.max(u,l);return o.slice(0,f+1)},f=function(t,e,n,r,i,o,s){var a=o||fetch,u=new Map,c=l(t,r),f="https://typescript.azureedge.net/cdn/"+e+"/typescript/lib/";return(n?function(){var t=s||localStorage;return Object.keys(localStorage).forEach((function(n){n.startsWith("ts-lib-")&&!n.startsWith("ts-lib-"+e)&&t.removeItem(n)})),Promise.all(c.map((function(n){var r,o="ts-lib-"+e+"-"+n,s=t.getItem(o);return s?Promise.resolve((r=s,i?i.decompressFromUTF16(r):r)):a(f+n).then((function(t){return t.text()})).then((function(e){var n;return t.setItem(o,(n=e,i?i.compressToUTF16(n):n)),e}))}))).then((function(t){t.forEach((function(t,e){var n="/"+c[e];u.set(n,t)}))}))}:function(){return Promise.all(c.map((function(t){return a(f+t).then((function(t){return t.text()}))}))).then((function(t){t.forEach((function(t,e){return u.set("/"+c[e],t)}))}))})().then((function(){return u}))};function p(t){throw new Error("Method '"+t+"' is not implemented.")}function d(t,e){return function(){for(var n=arguments.length,r=new Array(n),i=0;i<n;i++)r[i]=arguments[i];var o=e.apply(void 0,r),s="string"==typeof o?o.slice(0,80)+"...":o;return u.apply(void 0,["> "+t].concat(r)),u("< "+s),o}}var h=function(t){return o({},t.getDefaultCompilerOptions(),{jsx:t.JsxEmit.React,strict:!0,esModuleInterop:!0,module:t.ModuleKind.ESNext,suppressOutputPathCheck:!0,skipLibCheck:!0,skipDefaultLibCheck:!0,moduleResolution:t.ModuleResolutionKind.NodeJs})},v=function(t){return t.replace("/","/lib.").toLowerCase()};function g(t){return{args:[],createDirectory:function(){return p("createDirectory")},directoryExists:d("directoryExists",(function(e){return Array.from(t.keys()).some((function(t){return t.startsWith(e)}))})),exit:function(){return p("exit")},fileExists:d("fileExists",(function(e){return t.has(e)||t.has(v(e))})),getCurrentDirectory:function(){return"/"},getDirectories:function(){return[]},getExecutingFilePath:function(){return p("getExecutingFilePath")},readDirectory:d("readDirectory",(function(e){return"/"===e?Array.from(t.keys()):[]})),readFile:d("readFile",(function(e){return t.get(e)||t.get(v(e))})),resolvePath:function(t){return t},newLine:"\n",useCaseSensitiveFileNames:!0,write:function(){return p("write")},writeFile:function(e,n){t.set(e,n)}}}function m(t,e,n,r){var i=e+"/vfs",o=b(),s=n.sys,a=null!=r?r:o.dirname(4026);return{name:"fs-vfs",root:i,args:[],createDirectory:function(){return p("createDirectory")},directoryExists:d("directoryExists",(function(e){return Array.from(t.keys()).some((function(t){return t.startsWith(e)}))||s.directoryExists(e)})),exit:s.exit,fileExists:d("fileExists",(function(e){if(t.has(e))return!0;if(e.includes("tsconfig.json")||e.includes("tsconfig.json"))return!1;if(e.startsWith("/lib")){var n=a+"/"+e.replace("/","");return s.fileExists(n)}return s.fileExists(e)})),getCurrentDirectory:function(){return i},getDirectories:s.getDirectories,getExecutingFilePath:function(){return p("getExecutingFilePath")},readDirectory:d("readDirectory",(function(){return"/"===(arguments.length<=0?void 0:arguments[0])?Array.from(t.keys()):s.readDirectory.apply(s,arguments)})),readFile:d("readFile",(function(e){if(t.has(e))return t.get(e);if(e.startsWith("/lib")){var n=a+"/"+e.replace("/",""),r=s.readFile(n);if(!r){var i=s.readDirectory(a);throw new Error("TSVFS: A request was made for "+n+" but there wasn't a file found in the file map. You likely have a mismatch in the compiler options for the CDN download vs the compiler program. Existing Libs: "+i+".")}return r}return s.readFile(e)})),resolvePath:function(e){return t.has(e)?e:s.resolvePath(e)},newLine:"\n",useCaseSensitiveFileNames:!0,write:function(){return p("write")},writeFile:function(e,n){t.set(e,n)}}}function y(t,e,n){var r=new Map;return{compilerHost:o({},t,{getCanonicalFileName:function(t){return t},getDefaultLibFileName:function(){return"/"+n.getDefaultLibFileName(e)},getDirectories:function(){return[]},getNewLine:function(){return t.newLine},getSourceFile:function(i){return r.get(i)||(o=n.createSourceFile(i,t.readFile(i),e.target||h(n).target,!1),r.set(o.fileName,o),o);var o},useCaseSensitiveFileNames:function(){return t.useCaseSensitiveFileNames}}),updateFile:function(e){var n=r.has(e.fileName);return t.writeFile(e.fileName,e.text),r.set(e.fileName,e),n}}}var b=function(){return n(3204)(String.fromCharCode(112,97,116,104))}},3319:function(t,e){e.D=function(t,e,n){var r,i;void 0===e&&(e=50),void 0===n&&(n={});var o=null!=(r=n.isImmediate)&&r,s=n.maxWait,a=Date.now();function u(){if(void 0!==s){var t=Date.now()-a;if(t+e>=s)return s-t}return e}var c=function(){var e=[].slice.call(arguments),n=this,r=function(){i=void 0,a=Date.now(),o||t.apply(n,e)},s=o&&void 0===i;void 0!==i&&clearTimeout(i),i=setTimeout(r,u()),s&&t.apply(n,e)};return c.cancel=function(){void 0!==i&&clearTimeout(i)},c}},3768:function(t){function e(t){var e=new Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}e.keys=function(){return[]},e.resolve=e,e.id=3768,t.exports=e},3204:function(t){function e(t){var e=new Error("Cannot find module '"+t+"'");throw e.code="MODULE_NOT_FOUND",e}e.keys=function(){return[]},e.resolve=e,e.id=3204,t.exports=e},5472:function(){},9809:function(){},4026:function(){}}]);
//# sourceMappingURL=17821066377c4486a980330106160c805ea5b4a9-8d9089e9202ff74a396a.js.map