class RcxContent {
  constructor() {
    this.dictCount = 3;
    this.altView = 0;
    this.sameDict = 0;
    this.forceKanji = 0;
    this.defaultDict = 2;
    this.nextDict = 3;
    this.lastFound = [];
    this.keysDown = [];
    this.lastPos = { x: null, y: null };
    this.lastTarget = null;
    this.onKeyDown = (ev) => {
      this._onKeyDown(ev);
    };
    this.mDown = false;
    this.onMouseDown = (ev) => {
      this._onMouseDown(ev);
    };
    this.onMouseUp = (ev) => {
      this._onMouseUp(ev);
    };
    this.onKeyUp = (ev) => {
      if (this.keysDown[ev.keyCode]) {
        this.keysDown[ev.keyCode] = 0;
      }
    };
    this.namesN = 2;
    this.inlineNames = {
      "#text": true,
      FONT: true,
      TT: true,
      I: true,
      B: true,
      BIG: true,
      SMALL: true,
      STRIKE: true,
      S: true,
      U: true,
      EM: true,
      STRONG: true,
      DFN: true,
      CODE: true,
      SAMP: true,
      KBD: true,
      let: true,
      CITE: true,
      ABBR: true,
      ACRONYM: true,
      A: true,
      Q: true,
      SUB: true,
      SUP: true,
      SPAN: true,
      WBR: true,
      RUBY: true,
      RBC: true,
      RTC: true,
      RB: true,
      RT: true,
      RP: true
    };
    this.textNodeExpr = "descendant-or-self::text()[not(parent::rp) and not(ancestor::rt)]";
    this.startElementExpr = "boolean(parent::rp or ancestor::rt)";
    this.lastSelEnd = [];
    this.lastRo = 0;
    this.processEntry = (e) => {
      const tdata = window.rikaichan;
      const ro = this.lastRo;
      const selEndList = this.lastSelEnd;
      if (!e) {
        this.hidePopup();
        this.clearHi();
        return;
      }
      this.lastFound = [e];
      if (!e.matchLen) {
        e.matchLen = 1;
      }
      tdata.uofsNext = e.matchLen;
      tdata.uofs = ro - tdata.prevRangeOfs;
      const rp = tdata.prevRangeNode;
      if (rp && !this.isGoogleDoc() && (tdata.config.highlight && !this.mDown && !("form" in tdata.prevTarget) || "form" in tdata.prevTarget && tdata.config.textboxhl)) {
        const doc = rp.ownerDocument;
        if (!doc) {
          this.clearHi();
          this.hidePopup();
          return;
        }
        this.highlightMatch(doc, rp, ro, e.matchLen, selEndList, tdata);
        tdata.prevSelView = doc.defaultView;
      }
      chrome.runtime.sendMessage({ type: "makehtml", entry: e }, this.processHtml);
    };
    this.processHtml = (html) => {
      const tdata = window.rikaichan;
      this.showPopup(html, tdata.prevTarget, tdata.popX, tdata.popY, false);
      return 1;
    };
    this.processTitle = (e) => {
      const tdata = window.rikaichan;
      if (!e) {
        this.hidePopup();
        return;
      }
      e.title = tdata.title.substr(0, e.textLen).replace(/[\x00-\xff]/g, (c) => {
        return "&#" + c.charCodeAt(0) + ";";
      });
      if (tdata.title.length > e.textLen) {
        e.title += "...";
      }
      this.lastFound = [e];
      chrome.runtime.sendMessage({ type: "makehtml", entry: e }, this.processHtml);
    };
    this.onMouseMove = (ev) => {
      this.lastPos.x = ev.clientX;
      this.lastPos.y = ev.clientY;
      this.lastTarget = ev.target;
      this.tryUpdatePopup(ev);
    };
  }
  enableTab(config) {
    if (window.rikaichan === void 0) {
      window.rikaichan = { config };
      window.addEventListener("mousemove", this.onMouseMove, false);
      window.addEventListener("keydown", this.onKeyDown, true);
      window.addEventListener("keyup", this.onKeyUp, true);
      window.addEventListener("mousedown", this.onMouseDown, false);
      window.addEventListener("mouseup", this.onMouseUp, false);
    }
    window.rikaichan.config = config;
    this.altView = config.popupLocation;
  }
  disableTab() {
    if (window.rikaichan !== void 0) {
      let e;
      window.removeEventListener("mousemove", this.onMouseMove, false);
      window.removeEventListener("keydown", this.onKeyDown, true);
      window.removeEventListener("keyup", this.onKeyUp, true);
      window.removeEventListener("mousedown", this.onMouseDown, false);
      window.removeEventListener("mouseup", this.onMouseUp, false);
      e = document.getElementById("rikaichan-css");
      if (e == null ? void 0 : e.parentNode) {
        e.parentNode.removeChild(e);
      }
      e = document.getElementById("rikaichan-window");
      if (e == null ? void 0 : e.parentNode) {
        e.parentNode.removeChild(e);
      }
      this.clearHi();
      delete window.rikaichan;
    }
  }
  showPopup(text, elem, x = 0, y = 0, looseWidth) {
    const topdoc = window.document;
    if (isNaN(x) || isNaN(y)) {
      x = y = 0;
    }
    let popup = topdoc.getElementById("rikaichan-window");
    if (!popup) {
      const css = topdoc.createElement("link");
      css.setAttribute("rel", "stylesheet");
      css.setAttribute("href", chrome.extension.getURL("css/popup.css"));
      popup = topdoc.createElementNS("http://www.w3.org/1999/xhtml", "div");
      popup.setAttribute("id", "rikaichan-window");
      popup.setAttribute("lang", "ja");
      popup.style.setProperty("all", "revert", "important");
      popup.attachShadow({ mode: "open" });
      topdoc.body.appendChild(popup);
      popup.addEventListener("dblclick", (ev) => {
        this.hidePopup();
        ev.stopPropagation();
      }, true);
      const shadowcontainer2 = topdoc.createElement("div");
      shadowcontainer2.setAttribute("id", "rikaikun-shadow");
      popup.shadowRoot.appendChild(css);
      popup.shadowRoot.appendChild(shadowcontainer2);
    }
    const shadowcontainer = this.getRikaikunPopup(popup);
    shadowcontainer.setAttribute("data-theme", window.rikaichan.config.popupcolor);
    shadowcontainer.style.width = "auto";
    shadowcontainer.style.height = "auto";
    shadowcontainer.style.maxWidth = looseWidth ? "" : "600px";
    shadowcontainer.innerHTML = text;
    if (elem) {
      shadowcontainer.style.top = "-1000px";
      shadowcontainer.style.left = "0px";
      shadowcontainer.style.display = "";
      let pW = shadowcontainer.offsetWidth;
      let pH = shadowcontainer.offsetHeight;
      if (pW <= 0) {
        pW = 200;
      }
      if (pH <= 0) {
        pH = 0;
        let j = 0;
        while ((j = text.indexOf("<br/>", j)) !== -1) {
          j += 5;
          pH += 22;
        }
        pH += 25;
      }
      if (this.altView === 1) {
        x = window.scrollX;
        y = window.scrollY;
      } else if (this.altView === 2) {
        x = window.innerWidth - (pW + 20) + window.scrollX;
        y = window.innerHeight - (pH + 20) + window.scrollY;
      } else if (elem instanceof window.HTMLOptionElement) {
        x = 0;
        y = 0;
        let p = elem;
        while (p) {
          x += p.offsetLeft;
          y += p.offsetTop;
          p = p.offsetParent;
        }
        if (elem.offsetTop > elem.parentNode.clientHeight) {
          y -= elem.offsetTop;
        }
        if (x + shadowcontainer.offsetWidth > window.innerWidth) {
          x -= shadowcontainer.offsetWidth + 5;
          if (x < 0) {
            x = 0;
          }
        } else {
          x += elem.parentNode.offsetWidth + 5;
        }
      } else {
        if (x + pW > window.innerWidth - 20) {
          x = window.innerWidth - pW - 20;
          if (x < 0) {
            x = 0;
          }
        }
        let v = 25;
        if (elem.title && elem.title !== "") {
          v += 20;
        }
        if (y + v + pH > window.innerHeight) {
          const t = y - pH - 30;
          if (t >= 0) {
            y = t;
          } else {
            y += v;
          }
        } else {
          y += v;
        }
        x += window.scrollX;
        y += window.scrollY;
      }
    } else {
      x += window.scrollX;
      y += window.scrollY;
    }
    shadowcontainer.style.left = x + "px";
    shadowcontainer.style.top = y + "px";
    shadowcontainer.style.display = "";
  }
  hidePopup() {
    const popup = document.getElementById("rikaichan-window");
    if (popup) {
      this.getRikaikunPopup(popup).style.display = "none";
      this.getRikaikunPopup(popup).innerHTML = "";
    }
  }
  getRikaikunPopup(popup) {
    return popup.shadowRoot.querySelector("#rikaikun-shadow");
  }
  isVisible() {
    const popup = document.getElementById("rikaichan-window");
    return popup && this.getRikaikunPopup(popup).style.display !== "none";
  }
  clearHi() {
    const tdata = window.rikaichan;
    if (!tdata || !tdata.prevSelView) {
      return;
    }
    if (tdata.prevSelView.closed) {
      delete tdata.prevSelView;
      return;
    }
    const sel = tdata.prevSelView.getSelection();
    if (!sel.toString() || tdata.selText === sel.toString()) {
      if (!sel.toString()) {
        delete tdata.oldTA;
      }
      sel.removeAllRanges();
      if (tdata.oldTA && tdata.oldCaret >= 0) {
        tdata.oldTA.selectionStart = tdata.oldTA.selectionEnd = tdata.oldCaret;
      }
    }
    delete tdata.prevSelView;
    delete tdata.selText;
  }
  _onKeyDown(ev) {
    if (window.rikaichan.config.showOnKey !== "" && (ev.altKey || ev.ctrlKey || ev.key === "AltGraph")) {
      if (this.lastTarget !== null) {
        const myEv = {
          clientX: this.lastPos.x,
          clientY: this.lastPos.y,
          target: this.lastTarget,
          altKey: ev.altKey || ev.key === "AltGraph",
          ctrlKey: ev.ctrlKey,
          shiftKey: ev.shiftKey,
          noDelay: true
        };
        this.tryUpdatePopup(myEv);
      }
      return;
    }
    if (ev.shiftKey && ev.keyCode !== 16) {
      return;
    }
    if (this.keysDown[ev.keyCode]) {
      return;
    }
    if (!this.isVisible()) {
      return;
    }
    if (window.rikaichan.config.disablekeys && ev.keyCode !== 16) {
      return;
    }
    let i;
    let shouldPreventDefault = true;
    const maxDictEntries = window.rikaichan.config.maxDictEntries;
    let e;
    switch (ev.keyCode) {
      case 16:
      case 13:
        this.show(ev.currentTarget.rikaichan, this.nextDict);
        break;
      case 74:
        e = this.lastFound[0];
        if (e.data.length < maxDictEntries) {
          break;
        }
        if (!e.index) {
          e.index = 0;
        }
        if (e.index > 0) {
          e.index -= 1;
        } else {
          e.index = e.data.length - maxDictEntries;
        }
        chrome.runtime.sendMessage({ type: "makehtml", entry: e }, this.processHtml);
        this.lastFound = [e];
        break;
      case 75:
        e = this.lastFound[0];
        if (e.data.length < maxDictEntries) {
          break;
        }
        if (!e.index) {
          e.index = 0;
        }
        if (e.index >= e.data.length - maxDictEntries) {
          e.index = 0;
        } else {
          e.index += 1;
        }
        chrome.runtime.sendMessage({ type: "makehtml", entry: e }, this.processHtml);
        this.lastFound = [e];
        break;
      case 27:
        this.hidePopup();
        this.clearHi();
        break;
      case 65:
        this.altView = (this.altView + 1) % 3;
        this.show(ev.currentTarget.rikaichan, this.sameDict);
        break;
      case 67:
        if (ev.ctrlKey || ev.metaKey) {
          shouldPreventDefault = false;
        } else {
          chrome.runtime.sendMessage({
            type: "copyToClip",
            entry: this.lastFound
          });
        }
        break;
      case 66: {
        const rikaichan = ev.currentTarget.rikaichan;
        let ofs = rikaichan.uofs;
        for (i = 50; i > 0; --i) {
          rikaichan.uofs = --ofs;
          if (this.show(rikaichan, this.defaultDict) >= 0) {
            if (ofs >= rikaichan.uofs) {
              break;
            }
          }
        }
        break;
      }
      case 68:
        chrome.runtime.sendMessage({ type: "switchOnlyReading" });
        this.show(ev.currentTarget.rikaichan, this.sameDict);
        break;
      case 77:
        ev.currentTarget.rikaichan.uofsNext = 1;
      case 78: {
        const rikaiData = ev.currentTarget.rikaichan;
        for (i = 50; i > 0; --i) {
          rikaiData.uofs += rikaiData.uofsNext;
          if (this.show(rikaiData, this.defaultDict) >= 0) {
            break;
          }
        }
        break;
      }
      case 89:
        this.altView = 0;
        ev.currentTarget.rikaichan.popY += 20;
        this.show(ev.currentTarget.rikaichan, this.sameDict);
        break;
      default:
        return;
    }
    this.keysDown[ev.keyCode] = 1;
    if (shouldPreventDefault) {
      ev.preventDefault();
    }
  }
  _onMouseDown(ev) {
    if (ev.button !== 0) {
      return;
    }
    if (this.isVisible()) {
      this.clearHi();
    }
    this.mDown = true;
    if (ev.target instanceof HTMLTextAreaElement || ev.target instanceof HTMLInputElement) {
      window.rikaichan.oldTA = ev.target;
    } else {
      window.rikaichan.oldCaret = -1;
    }
  }
  _onMouseUp(ev) {
    if (ev.button !== 0) {
      return;
    }
    this.mDown = false;
  }
  unicodeInfo(c) {
    const hex = "0123456789ABCDEF";
    const u = c.charCodeAt(0);
    return c + " U" + hex[u >>> 12 & 15] + hex[u >>> 8 & 15] + hex[u >>> 4 & 15] + hex[u & 15];
  }
  isInline(node) {
    return Object.prototype.hasOwnProperty.call(this.inlineNames, node.nodeName) || document.nodeType === Node.ELEMENT_NODE && (document.defaultView.getComputedStyle(node, null).getPropertyValue("display") === "inline" || document.defaultView.getComputedStyle(node, null).getPropertyValue("display") === "inline-block");
  }
  getInlineText(node, selEndList, maxLength, xpathExpr) {
    let text = "";
    let endIndex;
    if (node.nodeName === "#text") {
      const textNode = node;
      endIndex = Math.min(maxLength, textNode.data.length);
      selEndList.push({ node: textNode, offset: endIndex });
      return textNode.data.substring(0, endIndex);
    }
    const result = xpathExpr.evaluate(node, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    let nextNode;
    while (text.length < maxLength && (nextNode = result.iterateNext())) {
      if (!this.isElementVisible(nextNode.parentElement)) {
        continue;
      }
      endIndex = Math.min(nextNode.data.length, maxLength - text.length);
      text += nextNode.data.substring(0, endIndex);
      selEndList.push({ node: nextNode, offset: endIndex });
    }
    return text;
  }
  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.visibility !== "hidden" && style.display !== "none";
  }
  getNext(node) {
    let nextNode;
    if ((nextNode = node.nextSibling) !== null) {
      return nextNode;
    }
    if ((nextNode = node.parentNode) !== null && this.isInline(nextNode)) {
      return this.getNext(nextNode);
    }
    return null;
  }
  getTextFromRange(rangeParent, offset, selEndList, maxLength) {
    if (rangeParent.nodeName === "rect") {
      return this.getTextFromGDoc(rangeParent, offset, maxLength);
    }
    if (rangeParent.nodeName === "TEXTAREA" || rangeParent.nodeName === "INPUT") {
      const pseudoTextNode = rangeParent;
      const endIndex2 = Math.min(pseudoTextNode.data.length, offset + maxLength);
      return pseudoTextNode.value.substring(offset, endIndex2);
    }
    if (rangeParent.nodeType !== Node.TEXT_NODE) {
      return "";
    }
    const textRange = rangeParent;
    let text = "";
    const xpathExpr = textRange.ownerDocument.createExpression(this.textNodeExpr, null);
    if (textRange.ownerDocument.evaluate(this.startElementExpr, textRange, null, XPathResult.BOOLEAN_TYPE, null).booleanValue) {
      return "";
    }
    const endIndex = Math.min(textRange.data.length, offset + maxLength);
    text += textRange.data.substring(offset, endIndex);
    selEndList.push({ node: textRange, offset: endIndex });
    let nextNode = textRange;
    while (nextNode !== null && (nextNode = this.getNext(nextNode)) !== null && this.isInline(nextNode) && text.length < maxLength) {
      text += this.getInlineText(nextNode, selEndList, maxLength - text.length, xpathExpr);
    }
    return text;
  }
  getTextFromGDoc(initialRect, offset, maxLength) {
    const endIndex = Math.min(initialRect.data.length, offset + maxLength);
    let text = initialRect.data.substring(offset, endIndex);
    const rectWalker = this.createGDocTreeWalker(initialRect);
    let rectNode;
    rectWalker.currentNode = initialRect;
    while ((rectNode = rectWalker.nextNode()) !== null && text.length < maxLength) {
      const rect = rectNode;
      if (rect.ariaLabel === null) {
        continue;
      }
      const rectEndIndex = Math.min(rect.ariaLabel.length, maxLength - text.length);
      text += rect.ariaLabel.substring(0, rectEndIndex);
    }
    return text;
  }
  createGDocTreeWalker(rect) {
    return document.createTreeWalker(rect.parentNode.parentNode, NodeFilter.SHOW_ELEMENT, {
      acceptNode: function(node) {
        if (node.nodeName === "rect") {
          return NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeName === "g") {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_REJECT;
      }
    });
  }
  show(tdata, dictOption) {
    const rp = tdata.prevRangeNode;
    let ro = tdata.prevRangeOfs + tdata.uofs;
    let u;
    tdata.uofsNext = 1;
    if (!rp) {
      this.clearHi();
      this.hidePopup();
      return 0;
    }
    if (ro < 0 || ro >= rp.data.length) {
      this.clearHi();
      this.hidePopup();
      return 0;
    }
    while ((u = rp.data.charCodeAt(ro)) === 32 || u === 9 || u === 10) {
      ++ro;
      if (ro >= rp.data.length) {
        this.clearHi();
        this.hidePopup();
        return 0;
      }
    }
    if (isNaN(u) || u !== 9675 && (u < 12289 || u > 12543) && (u < 13312 || u > 40959) && (u < 63744 || u > 64255) && (u < 65296 || u > 65437)) {
      this.clearHi();
      this.hidePopup();
      return -2;
    }
    const selEndList = [];
    const text = this.getTextFromRange(rp, ro, selEndList, 13);
    this.lastSelEnd = selEndList;
    this.lastRo = ro;
    chrome.runtime.sendMessage({ type: "xsearch", text, dictOption: String(dictOption) }, this.processEntry);
    return 1;
  }
  highlightMatch(doc, rp, ro, matchLen, selEndList, tdata) {
    const sel = doc.defaultView.getSelection();
    if (selEndList.length === 0) {
      try {
        if (rp.nodeName === "TEXTAREA" || rp.nodeName === "INPUT") {
          const textNode = rp;
          if (sel.toString() && tdata.selText !== sel.toString()) {
            return;
          }
          if (!sel.toString() && tdata.oldTA === textNode) {
            tdata.oldCaret = textNode.selectionStart;
            tdata.oldTA = textNode;
          }
          textNode.selectionStart = ro;
          textNode.selectionEnd = matchLen + ro;
          tdata.selText = textNode.value.substring(ro, matchLen + ro);
        }
      } catch (err) {
        delete tdata.oldTA;
        if (err instanceof Error) {
          console.log(err.message);
        }
      }
      return;
    }
    if (tdata.oldTA && !sel.toString() && tdata.oldCaret >= 0) {
      tdata.oldCaret = tdata.oldTA.selectionStart;
    }
    let selEnd;
    let offset = matchLen + ro;
    for (let i = 0, len = selEndList.length; i < len; i++) {
      selEnd = selEndList[i];
      if (offset <= selEnd.offset) {
        break;
      }
      offset -= selEnd.offset;
    }
    const range = doc.createRange();
    range.setStart(rp, ro);
    range.setEnd(selEnd.node, offset);
    if (sel.toString() && tdata.selText !== sel.toString()) {
      return;
    }
    sel.removeAllRanges();
    sel.addRange(range);
    tdata.selText = sel.toString();
    if (window.rikaichan.config.ttsEnabled) {
      const text = sel.toString();
      if (text.length > 0) {
        chrome.runtime.sendMessage({ type: "playTTS", text });
      }
    }
  }
  showTitle(tdata) {
    chrome.runtime.sendMessage({ type: "translate", title: tdata.title }, this.processTitle);
  }
  getFirstTextChild(node) {
    return document.evaluate("descendant::text()[not(parent::rp) and not(ancestor::rt)]", node, null, XPathResult.ANY_TYPE, null).iterateNext();
  }
  makeFake(real) {
    const fake = document.createElement("div");
    const realRect = real.getBoundingClientRect();
    let textValue = "";
    if (real instanceof SVGRectElement) {
      textValue = real.ariaLabel ?? "";
    } else {
      textValue = real.value;
    }
    const realStyles = window.getComputedStyle(real, "");
    fake.innerText = textValue;
    fake.style.whiteSpace = "pre-wrap";
    fake.style.font = realStyles.font;
    fake.style.height = realRect.height + "px";
    fake.style.width = realRect.width + "px";
    fake.style.padding = realStyles.padding;
    fake.style.border = realStyles.border;
    fake.style.boxSizing = realStyles.boxSizing;
    fake.style.overflow = realStyles.overflow;
    fake.style.letterSpacing = realStyles.letterSpacing;
    fake.style.wordSpacing = realStyles.wordSpacing;
    fake.scrollTop = real.scrollTop;
    fake.scrollLeft = real.scrollLeft;
    fake.style.position = "absolute";
    fake.style.zIndex = "7777";
    fake.style.top = realRect.top + "px";
    fake.style.left = realRect.left + "px";
    return fake;
  }
  getTotalOffset(parent, tNode, offset) {
    let fChild = parent.firstChild;
    let realO = offset;
    if (fChild === tNode) {
      return offset;
    }
    do {
      let val = 0;
      if (fChild.nodeName === "BR") {
        val = 1;
      } else {
        const maybeText = fChild;
        val = maybeText.data ? maybeText.data.length : 0;
      }
      realO += val;
    } while ((fChild = fChild.nextSibling) !== tNode);
    return realO;
  }
  tryUpdatePopup(ev) {
    const altGraph = ev.getModifierState && ev.getModifierState("AltGraph");
    if (window.rikaichan.config.showOnKey.includes("Alt") && !ev.altKey && !altGraph || window.rikaichan.config.showOnKey.includes("Ctrl") && !ev.ctrlKey) {
      this.clearHi();
      this.hidePopup();
      return;
    }
    let fake;
    let gdocRect;
    const tdata = window.rikaichan;
    let range;
    let rp;
    let ro;
    const eventTarget = ev.target;
    try {
      if (this.isGoogleDoc()) {
        gdocRect = this.getRectUnderMouse(ev);
        if (gdocRect) {
          fake = this.makeFake(gdocRect);
          fake.style.font = gdocRect.getAttribute("data-font-css");
        }
      }
      if (eventTarget.nodeName === "TEXTAREA" || eventTarget.nodeName === "INPUT") {
        fake = this.makeFake(eventTarget);
      }
      if (fake) {
        document.body.appendChild(fake);
      }
      range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
      if (range === null) {
        if (fake) {
          document.body.removeChild(fake);
        }
        return;
      }
      const startNode = range.startContainer;
      ro = range.startOffset;
      rp = startNode;
      if (fake) {
        if (rp.data && rp.data.length === ro) {
          document.body.removeChild(fake);
          return;
        }
        fake.style.display = "none";
        ro = this.getTotalOffset(rp.parentNode, rp, ro);
      }
      if (rp.data && ro === rp.data.length) {
        if (rp.nextSibling && rp.nextSibling.nodeName === "WBR") {
          rp = rp.nextSibling.nextSibling;
          ro = 0;
        } else if (this.isInline(eventTarget)) {
          if (rp.parentNode === eventTarget) {
          } else if (fake && rp.parentNode.innerText === eventTarget.value) {
          } else {
            rp = eventTarget.firstChild;
            ro = 0;
          }
        } else {
          rp = rp.parentNode.nextSibling;
          ro = 0;
        }
      }
      if (!fake && !("form" in eventTarget) && rp && rp.parentNode !== eventTarget && ro === 1) {
        rp = this.getFirstTextChild(eventTarget);
        ro = 0;
      } else if (!fake && (!rp || rp.parentNode !== eventTarget)) {
        rp = null;
        ro = -1;
      }
      if (fake && !gdocRect) {
        rp = eventTarget;
        rp.data = rp.value;
      }
      if (gdocRect) {
        rp = gdocRect;
        rp.data = rp.ariaLabel;
      }
      if (eventTarget === tdata.prevTarget && this.isVisible()) {
        if (tdata.title) {
          if (fake) {
            document.body.removeChild(fake);
          }
          return;
        }
        if (rp === tdata.prevRangeNode && ro === tdata.prevRangeOfs) {
          if (fake) {
            document.body.removeChild(fake);
          }
          return;
        }
      }
      if (fake) {
        document.body.removeChild(fake);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
      }
      if (fake) {
        document.body.removeChild(fake);
      }
      return;
    }
    tdata.prevTarget = eventTarget;
    tdata.prevRangeNode = rp;
    tdata.prevRangeOfs = ro;
    delete tdata.title;
    tdata.uofs = 0;
    tdata.uofsNext = 1;
    const delay = ev.noDelay ? 1 : window.rikaichan.config.popupDelay;
    if (rp && rp.data && ro < rp.data.length) {
      this.forceKanji = ev.shiftKey ? 1 : 0;
      tdata.popX = ev.clientX;
      tdata.popY = ev.clientY;
      tdata.timer = window.setTimeout((rangeNode, rangeOffset) => {
        if (!window.rikaichan || rangeNode !== window.rikaichan.prevRangeNode || rangeOffset !== window.rikaichan.prevRangeOfs) {
          return;
        }
        this.show(tdata, this.forceKanji ? this.forceKanji : this.defaultDict);
      }, delay, rp, ro);
      return;
    }
    if (typeof eventTarget.title === "string" && eventTarget.title.length) {
      tdata.title = eventTarget.title;
    } else if (typeof eventTarget.alt === "string" && eventTarget.alt.length) {
      tdata.title = eventTarget.alt;
    }
    if (eventTarget.nodeName === "OPTION") {
      tdata.title = eventTarget.text;
    } else if (eventTarget.nodeName === "SELECT") {
      tdata.title = eventTarget.options[eventTarget.selectedIndex].text;
    }
    if (tdata.title) {
      tdata.popX = ev.clientX;
      tdata.popY = ev.clientY;
      tdata.timer = window.setTimeout((tdata2, title) => {
        if (!window.rikaichan || title !== window.rikaichan.title) {
          return;
        }
        this.showTitle(tdata2);
      }, delay, tdata, tdata.title);
    } else {
      const dx = tdata.popX - ev.clientX;
      const dy = tdata.popY - ev.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 4) {
        this.clearHi();
        this.hidePopup();
      }
    }
  }
  getRectUnderMouse(ev) {
    const gElements = document.querySelectorAll("g");
    for (const gElement of gElements) {
      if (this.mouseEventWasInElement(ev, gElement)) {
        const rects = gElement.querySelectorAll("rect");
        for (const rectChild of rects) {
          if (this.mouseEventWasInElement(ev, rectChild)) {
            return rectChild;
          }
        }
      }
    }
    return void 0;
  }
  mouseEventWasInElement(ev, element) {
    const rect = element.getBoundingClientRect();
    return ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
  }
  isGoogleDoc() {
    return document.querySelector(".kix-canvas-tile-content") !== null;
  }
}
var rcxContent = new RcxContent();
chrome.runtime.onMessage.addListener((request) => {
  switch (request.type) {
    case "enable":
      rcxContent.enableTab(request.config);
      break;
    case "disable":
      rcxContent.disableTab();
      break;
    case "showPopup":
      rcxContent.showPopup(request.text);
      break;
    default:
  }
});
chrome.runtime.sendMessage({ type: "enable?" });
module.exports = rcxContent;
