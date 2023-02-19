const injectedCode = `(function() {window['_docs_annotate_canvas_by_ext'] = '${chrome.runtime.id}';})();`;
const script = document.createElement("script");
script.textContent = injectedCode;
(document.head || document.documentElement).appendChild(script);
script.remove();
