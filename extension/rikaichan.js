class RcxMain {
  constructor(dict, config) {
    this.haveNames = true;
    this.dictCount = 3;
    this.altView = 0;
    this.enabled = 0;
    this.miniHelp = '<span style="font-weight:bold">Rikaikun enabled!</span><br><br><table cellspacing=5><tr><td>A</td><td>Alternate popup location</td></tr><tr><td>Y</td><td>Move popup location down</td></tr><tr><td>C</td><td>Copy to clipboard</td></tr><tr><td>D</td><td>Hide/show definitions</td></tr><tr><td>Shift/Enter&nbsp;&nbsp;</td><td>Switch dictionaries</td></tr><tr><td>B</td><td>Previous character</td></tr><tr><td>M</td><td>Next character</td></tr><tr><td>N</td><td>Next word</td></tr><tr><td>J</td><td>Scroll back definitions</td></tr><tr><td>K</td><td>Scroll forward definitions</td></tr></table>';
    this.kanjiN = 1;
    this.namesN = 2;
    this.showMode = 0;
    this.sameDict = "0";
    this.forceKanji = "1";
    this.defaultDict = "2";
    this.nextDict = "3";
    this.dict = dict;
    this.config = config;
  }
  static create(dict, config) {
    if (!RcxMain.instance) {
      RcxMain.instance = new RcxMain(dict, config);
    }
    return RcxMain.instance;
  }
  onTabSelect(tabId) {
    if (tabId === void 0) {
      return;
    }
    this._onTabSelect(tabId);
  }
  _onTabSelect(tabId) {
    if (this.enabled === 1) {
      chrome.tabs.sendMessage(tabId, {
        type: "enable",
        config: this.config
      });
    }
  }
  savePrep(forClipping, entries) {
    let maxEntries = this.config.maxDictEntries;
    let text;
    let i;
    let e;
    const f = entries;
    if (!f || f.length === 0) {
      return null;
    }
    if (forClipping) {
      maxEntries = this.config.maxClipCopyEntries;
    }
    text = "";
    for (i = 0; i < f.length; ++i) {
      e = f[i];
      if (e.kanji) {
        text += this.dict.makeText(e, 1);
      } else {
        if (maxEntries <= 0) {
          continue;
        }
        text += this.dict.makeText(e, maxEntries);
        maxEntries -= e.data.length;
      }
    }
    if (this.config.lineEnding === "rn") {
      text = text.replace(/\n/g, "\r\n");
    } else if (this.config.lineEnding === "r") {
      text = text.replace(/\n/g, "\r");
    }
    if (this.config.copySeparator !== "tab") {
      if (this.config.copySeparator === "comma") {
        return text.replace(/\t/g, ",");
      }
      if (this.config.copySeparator === "space") {
        return text.replace(/\t/g, " ");
      }
    }
    return text;
  }
  copyToClip(tab, entries) {
    if ((tab == null ? void 0 : tab.id) === void 0) {
      return;
    }
    const text = this.savePrep(true, entries);
    if (text === null) {
      return;
    }
    const copyFunction = function(event) {
      event.clipboardData.setData("Text", text);
      event.preventDefault();
    };
    document.addEventListener("copy", copyFunction);
    document.execCommand("Copy");
    document.removeEventListener("copy", copyFunction);
    this.showPopupInTab(tab.id, "Copied to clipboard.");
  }
  inlineEnable(tabId, mode) {
    chrome.tabs.sendMessage(tabId, {
      type: "enable",
      config: this.config
    });
    this.enabled = 1;
    if (mode === 1) {
      if (this.config.minihelp) {
        this.showPopupInTab(tabId, this.miniHelp);
      } else {
        this.showPopupInTab(tabId, "Rikaikun enabled!");
      }
    }
    /*
    void chrome.browserAction.setBadgeBackgroundColor({
      color: [255, 0, 0, 255]
    });
    void chrome.browserAction.setBadgeText({ text: "On" });
    */
  }
  showPopupInTab(tabId, text) {
    chrome.tabs.sendMessage(tabId, {
      type: "showPopup",
      text
    }, {
      frameId: 0
    });
  }
  inlineDisable() {
    this.enabled = 0;
    /*
    void chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 0] });
    void chrome.browserAction.setBadgeText({ text: "" });
    */
    chrome.windows.getAll({ populate: true }, (windows) => {
      for (let i = 0; i < windows.length; ++i) {
        const tabs = windows[i].tabs;
        if (tabs === void 0) {
          continue;
        }
        for (let j = 0; j < tabs.length; ++j) {
          if (tabs[j].id === void 0) {
            continue;
          }
          chrome.tabs.sendMessage(tabs[j].id, { type: "disable" });
        }
      }
    });
  }
  inlineToggle(tab) {
    if ((tab == null ? void 0 : tab.id) === void 0) {
      return;
    }
    if (this.enabled) {
      this.inlineDisable();
    } else {
      this.inlineEnable(tab.id, 1);
    }
  }
  resetDict() {
    this.showMode = 0;
  }
  search(text, dictOption) {
    switch (dictOption) {
      case this.forceKanji:
        return this.dict.kanjiSearch(text.charAt(0));
      case this.defaultDict:
        this.showMode = 0;
        break;
      case this.nextDict:
        this.showMode = (this.showMode + 1) % this.dictCount;
        break;
    }
    const m = this.showMode;
    let e = null;
    do {
      switch (this.showMode) {
        case 0:
          e = this.dict.wordSearch(text, false);
          break;
        case this.kanjiN:
          e = this.dict.kanjiSearch(text.charAt(0));
          break;
        case this.namesN:
          e = this.dict.wordSearch(text, true);
          break;
      }
      if (e) {
        break;
      }
      this.showMode = (this.showMode + 1) % this.dictCount;
    } while (this.showMode !== m);
    return e;
  }
}
export { RcxMain };
//module.exports = RcxMain;