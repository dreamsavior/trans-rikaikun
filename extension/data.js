var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

const dataLoc = "www/addons/transRikaikun/"

const defaultDictEntryData = {
  kanji: "",
  onkun: "",
  nanori: "",
  bushumei: "",
  misc: {},
  eigo: "",
  hasNames: false,
  data: [],
  hasMore: false,
  title: "",
  index: 0,
  matchLen: 0
};
class RcxDict {
  constructor(config) {
    this.wordDict = "";
    this.wordIndex = "";
    this.kanjiData = "";
    this.radData = [];
    this.difReasons = [];
    this.difRules = [];
    this.ch = [
      12434,
      12353,
      12355,
      12357,
      12359,
      12361,
      12419,
      12421,
      12423,
      12387,
      12540,
      12354,
      12356,
      12358,
      12360,
      12362,
      12363,
      12365,
      12367,
      12369,
      12371,
      12373,
      12375,
      12377,
      12379,
      12381,
      12383,
      12385,
      12388,
      12390,
      12392,
      12394,
      12395,
      12396,
      12397,
      12398,
      12399,
      12402,
      12405,
      12408,
      12411,
      12414,
      12415,
      12416,
      12417,
      12418,
      12420,
      12422,
      12424,
      12425,
      12426,
      12427,
      12428,
      12429,
      12431,
      12435
    ];
    this.cv = [
      12532,
      65396,
      65397,
      12364,
      12366,
      12368,
      12370,
      12372,
      12374,
      12376,
      12378,
      12380,
      12382,
      12384,
      12386,
      12389,
      12391,
      12393,
      65413,
      65414,
      65415,
      65416,
      65417,
      12400,
      12403,
      12406,
      12409,
      12412
    ];
    this.cs = [12401, 12404, 12407, 12410, 12413];
    this.kanjiInfoLabelList = [
      "H",
      "Halpern",
      "L",
      "Heisig 5th Edition",
      "DN",
      "Heisig 6th Edition",
      "E",
      "Henshall",
      "DK",
      "Kanji Learners Dictionary",
      "N",
      "Nelson",
      "V",
      "New Nelson",
      "Y",
      "PinYin",
      "P",
      "Skip Pattern",
      "IN",
      "Tuttle Kanji &amp; Kana",
      "I",
      "Tuttle Kanji Dictionary",
      "U",
      "Unicode"
    ];
    this.config = config;
  }
  static async create(config) {
    if (!RcxDict.instance) {
      RcxDict.instance = new RcxDict(config);
      await RcxDict.instance.init();
    }
    return RcxDict.instance;
  }
  static createDefaultDictEntry() {
    return JSON.parse(JSON.stringify(defaultDictEntryData));
  }
  async init() {
    const started = +new Date();
    [, , this.nameDict, this.nameIndex] = await Promise.all([
      this.loadDictionaries(),
      this.loadDeinflectionData(),
      this.fileReadAsync(chrome.extension.getURL(dataLoc+"data/names.dat")),
      this.fileReadAsync(chrome.extension.getURL(dataLoc+"data/names.idx"))
    ]);
    const ended = +new Date();
    console.log("rcxDict main then in " + (ended - started));
  }
  async fileReadAsync(url) {
    const response = await fetch(url);
    if (response.ok) {
      return response.text();
    }
    console.error(`Failed to load ${url} due to status ${response.statusText}`);
    return "";
  }
  async fileReadAsyncAsArray(url) {
    const file = await this.fileReadAsync(url);
    return file.split("\n").filter((o) => {
      return o && o.length > 0;
    });
  }
  fileRead(url) {
    const req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    return req.responseText;
  }
  fileReadArray(name) {
    const a = this.fileRead(name).split("\n");
    while (a.length > 0 && a[a.length - 1].length === 0) {
      a.pop();
    }
    return a;
  }
  loadNames() {
    if (this.nameDict && this.nameIndex) {
      return;
    }
    this.nameDict = this.fileRead(chrome.extension.getURL(dataLoc+"data/names.dat"));
    this.nameIndex = this.fileRead(chrome.extension.getURL(dataLoc+"data/names.idx"));
  }
  async loadDictionaries() {
    [this.wordDict, this.wordIndex, this.kanjiData, this.radData] = await Promise.all([
      this.fileReadAsync(chrome.extension.getURL(dataLoc+"data/dict.dat")),
      this.fileReadAsync(chrome.extension.getURL(dataLoc+"data/dict.idx")),
      this.fileReadAsync(chrome.extension.getURL(dataLoc+"data/kanji.dat")),
      this.fileReadAsyncAsArray(chrome.extension.getURL(dataLoc+"data/radicals.dat"))
    ]);
  }
  async loadDeinflectionData() {
    const buffer = await this.fileReadAsyncAsArray(chrome.extension.getURL(dataLoc+"data/deinflect.dat"));
    let currentLength = -1;
    let group = {
      fromLength: currentLength,
      rules: []
    };
    for (let i = 1; i < buffer.length; ++i) {
      const ruleOrReason = buffer[i].split("	");
      if (ruleOrReason.length === 1) {
        this.difReasons.push(ruleOrReason[0]);
      } else if (ruleOrReason.length === 4) {
        const o = {
          from: ruleOrReason[0],
          to: ruleOrReason[1],
          typeMask: parseInt(ruleOrReason[2]),
          reasonIndex: parseInt(ruleOrReason[3])
        };
        if (currentLength !== o.from.length) {
          currentLength = o.from.length;
          group = { fromLength: currentLength, rules: [] };
          this.difRules.push(group);
        }
        group.rules.push(o);
      }
    }
  }
  find(data, text) {
    const tlen = text.length;
    let beg = 0;
    let end = data.length - 1;
    let i;
    let mi;
    let mis;
    while (beg < end) {
      mi = beg + end >> 1;
      i = data.lastIndexOf("\n", mi) + 1;
      mis = data.substr(i, tlen);
      if (text < mis) {
        end = i - 1;
      } else if (text > mis) {
        beg = data.indexOf("\n", mi + 1) + 1;
      } else {
        return data.substring(i, data.indexOf("\n", mi + 1));
      }
    }
    return null;
  }
  deinflect(word) {
    const r = [];
    const have = {};
    let o;
    o = { word, type: 255, reason: "" };
    r.push(o);
    have[word] = 0;
    let i;
    let j;
    let k;
    i = 0;
    do {
      word = r[i].word;
      const wordLen = word.length;
      const type = r[i].type;
      for (j = 0; j < this.difRules.length; ++j) {
        const g = this.difRules[j];
        if (g.fromLength <= wordLen) {
          const end = word.substr(-g.fromLength);
          for (k = 0; k < g.rules.length; ++k) {
            const rule = g.rules[k];
            if (type & rule.typeMask && end === rule.from) {
              const newWord = word.substr(0, word.length - rule.from.length) + rule.to;
              if (newWord.length <= 0) {
                continue;
              }
              o = { word, type: 255, reason: "" };
              if (have[newWord] !== void 0) {
                o = r[have[newWord]];
                o.type |= rule.typeMask >> 8;
                continue;
              }
              have[newWord] = r.length;
              if (r[i].reason.length) {
                o.reason = this.difReasons[rule.reasonIndex] + " &lt; " + r[i].reason;
              } else {
                o.reason = this.difReasons[rule.reasonIndex];
              }
              o.type = rule.typeMask >> 8;
              o.word = newWord;
              r.push(o);
            }
          }
        }
      }
    } while (++i < r.length);
    return r;
  }
  wordSearch(word, doNames, max) {
    let i;
    let u;
    let v;
    let reason;
    let p;
    const trueLen = [0];
    const entry = RcxDict.createDefaultDictEntry();
    p = 0;
    reason = "";
    for (i = 0; i < word.length; ++i) {
      u = v = word.charCodeAt(i);
      if (u === 8204) {
        p = 0;
        continue;
      }
      if (u <= 12288) {
        break;
      }
      if (u >= 12449 && u <= 12531) {
        u -= 96;
      } else if (u >= 65382 && u <= 65437) {
        u = this.ch[u - 65382];
      } else if (u === 65438) {
        if (p >= 65395 && p <= 65422) {
          reason = reason.substr(0, reason.length - 1);
          u = this.cv[p - 65395];
        }
      } else if (u === 65439) {
        if (p >= 65418 && p <= 65422) {
          reason = reason.substr(0, reason.length - 1);
          u = this.cs[p - 65418];
        }
      } else if (u === 65374) {
        p = 0;
        continue;
      }
      reason += String.fromCharCode(u);
      trueLen[reason.length] = i + 1;
      p = v;
    }
    word = reason;
    let dict;
    let index;
    let maxTrim;
    const cache = {};
    const have = [];
    let count = 0;
    let maxLen = 0;
    if (doNames) {
      this.loadNames();
      dict = this.nameDict;
      index = this.nameIndex;
      maxTrim = 20;
      entry.hasNames = true;
      console.log("doNames");
    } else {
      dict = this.wordDict;
      index = this.wordIndex;
      maxTrim = this.config.maxDictEntries;
    }
    if (max) {
      maxTrim = max;
    }
    entry.data = [];
    while (word.length > 0) {
      const showInf = count !== 0;
      let trys;
      if (doNames) {
        trys = [{ word, type: 255, reason: null }];
      } else {
        trys = this.deinflect(word);
      }
      for (i = 0; i < trys.length; i++) {
        u = trys[i];
        let ix = cache[u.word];
        if (!ix) {
          const result = this.find(index, u.word + ",");
          if (!result) {
            cache[u.word] = [];
            continue;
          }
          ix = result.split(",").slice(1).map((offset) => parseInt(offset));
          cache[u.word] = ix;
        }
        for (let j = 0; j < ix.length; ++j) {
          const ofs = ix[j];
          if (have[ofs]) {
            continue;
          }
          const dentry = dict.substring(ofs, dict.indexOf("\n", ofs));
          let ok = true;
          if (i > 0) {
            let w;
            const x = dentry.split(/[,()]/);
            const y = u.type;
            let z = x.length - 1;
            if (z > 10) {
              z = 10;
            }
            for (; z >= 0; --z) {
              w = x[z];
              if (y & 1 && w === "v1") {
                break;
              }
              if (y & 4 && w === "adj-i") {
                break;
              }
              if (y & 2 && w.substr(0, 2) === "v5") {
                break;
              }
              if (y & 16 && w.substr(0, 3) === "vs-") {
                break;
              }
              if (y & 8 && w === "vk") {
                break;
              }
              if (y & 32 && w === "cop") {
                break;
              }
            }
            ok = z !== -1;
          }
          if (ok) {
            if (count >= maxTrim) {
              entry.hasMore = true;
            }
            have[ofs] = 1;
            ++count;
            if (maxLen === 0) {
              maxLen = trueLen[word.length];
            }
            let reason2;
            if (trys[i].reason) {
              if (showInf) {
                reason2 = "&lt; " + trys[i].reason + " &lt; " + word;
              } else {
                reason2 = "&lt; " + trys[i].reason;
              }
            }
            entry.data.push({ entry: dentry, reason: reason2 });
          }
        }
        if (count >= maxTrim) {
          break;
        }
      }
      if (count >= maxTrim) {
        break;
      }
      word = word.substr(0, word.length - 1);
    }
    if (entry.data.length === 0) {
      return null;
    }
    entry.matchLen = maxLen;
    return entry;
  }
  translate(text) {
    let e;
    const o = __spreadValues({ textLen: text.length }, RcxDict.createDefaultDictEntry());
    let skip;
    while (text.length > 0) {
      e = this.wordSearch(text, false, 1);
      if (e !== null) {
        if (o.data.length >= this.config.maxDictEntries) {
          o.hasMore = true;
          break;
        }
        o.data.push(e.data[0]);
        skip = e.matchLen;
      } else {
        skip = 1;
      }
      text = text.substr(skip, text.length - skip);
    }
    if (o.data.length === 0) {
      return null;
    }
    o.textLen -= text.length;
    return o;
  }
  kanjiSearch(kanji) {
    const hex = "0123456789ABCDEF";
    let i;
    i = kanji.charCodeAt(0);
    if (i < 12288) {
      return null;
    }
    const kde = this.find(this.kanjiData, kanji);
    if (!kde) {
      return null;
    }
    const a = kde.split("|");
    if (a.length !== 6) {
      return null;
    }
    const entry = RcxDict.createDefaultDictEntry();
    entry.kanji = a[0];
    entry.misc = {};
    entry.misc.U = hex[i >>> 12 & 15] + hex[i >>> 8 & 15] + hex[i >>> 4 & 15] + hex[i & 15];
    const b = a[1].split(" ");
    for (i = 0; i < b.length; ++i) {
      if (b[i].match(/^([A-Z]+)(.*)/)) {
        if (!entry.misc[RegExp.$1]) {
          entry.misc[RegExp.$1] = RegExp.$2;
        } else {
          entry.misc[RegExp.$1] += " " + RegExp.$2;
        }
        if (RegExp.$1.startsWith("L") || RegExp.$1.startsWith("DN")) {
          entry.misc[RegExp.$1] = entry.misc[RegExp.$1].replace(/[:]/g, " ");
        }
      }
    }
    entry.onkun = a[2].replace(/\s+/g, "、 ");
    entry.nanori = a[3].replace(/\s+/g, "、 ");
    entry.bushumei = a[4].replace(/\s+/g, "、 ");
    entry.eigo = a[5];
    return entry;
  }
  makeHtml(entry) {
    let e;
    let c;
    let s;
    let t;
    let i;
    let j;
    let n;
    if (entry === null) {
      return "";
    }
    const b = [];
    if (entry.kanji) {
      let yomi;
      let box;
      let k;
      let nums;
      yomi = entry.onkun.replace(/\.([^\u3001]+)/g, '<span class="k-yomi-hi">$1</span>');
      if (entry.nanori.length) {
        yomi += '<br/><span class="k-yomi-ti">名乗り</span> ' + entry.nanori;
      }
      if (entry.bushumei.length) {
        yomi += '<br/><span class="k-yomi-ti">部首名</span> ' + entry.bushumei;
      }
      const bn = parseInt(entry.misc.B) - 1;
      k = parseInt(entry.misc.G);
      switch (k) {
        case 8:
          k = "general<br/>use";
          break;
        case 9:
          k = "name<br/>use";
          break;
        default:
          k = isNaN(k) ? "-" : "grade<br/>" + k;
          break;
      }
      box = '<table class="k-abox-tb"><tr><td class="k-abox-r">radical<br/>' + this.radData[bn].charAt(0) + " " + (bn + 1) + '</td><td class="k-abox-g">' + k + '</td></tr><tr><td class="k-abox-f">freq<br/>' + (entry.misc.F ? entry.misc.F : "-") + '</td><td class="k-abox-s">strokes<br/>' + entry.misc.S + "</td></tr></table>";
      if (this.config.kanjicomponents) {
        k = this.radData[bn].split("	");
        box += '<table class="k-bbox-tb"><tr><td class="k-bbox-1a">' + k[0] + '</td><td class="k-bbox-1b">' + k[2] + '</td><td class="k-bbox-1b">' + k[3] + "</td></tr>";
        j = 1;
        for (i = 0; i < this.radData.length; ++i) {
          s = this.radData[i];
          if (bn !== i && s.indexOf(entry.kanji) !== -1) {
            k = s.split("	");
            c = ' class="k-bbox-' + (j ^= 1);
            box += "<tr><td" + c + 'a">' + k[0] + "</td><td" + c + 'b">' + k[2] + "</td><td" + c + 'b">' + k[3] + "</td></tr>";
          }
        }
        box += "</table>";
      }
      nums = "";
      j = 0;
      const kanjiInfo = this.config.kanjiInfo;
      for (const info of kanjiInfo) {
        if (!info.shouldDisplay) {
          continue;
        }
        c = info.code;
        s = entry.misc[c];
        c = ' class="k-mix-td' + (j ^= 1) + '"';
        nums += "<tr><td" + c + ">" + info.name + "</td><td" + c + ">" + (s || "-") + "</td></tr>";
      }
      if (nums.length) {
        nums = '<table class="k-mix-tb">' + nums + "</table>";
      }
      b.push('<table class="k-main-tb"><tr><td valign="top">');
      b.push(box);
      b.push('<span class="k-kanji">' + entry.kanji + "</span><br/>");
      b.push('<div class="k-eigo">' + entry.eigo + "</div>");
      b.push('<div class="k-yomi">' + yomi + "</div>");
      b.push("</td></tr><tr><td>" + nums + "</td></tr></table>");
      return b.join("");
    }
    s = t = "";
    if (entry.hasNames) {
      c = [];
      b.push('<div class="w-title">Names Dictionary</div><table class="w-na-tb"><tr><td>');
      for (i = 0; i < entry.data.length; ++i) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }
        const e3 = e[3].match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (e3) {
          e = e3;
        }
        if (s !== e[3]) {
          c.push(t);
          t = "";
        }
        if (e[2]) {
          c.push('<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + "</span><br/> ");
        } else {
          c.push('<span class="w-kana">' + e[1] + "</span><br/> ");
        }
        s = e[3];
        console.log("e[1]: " + e[1]);
        console.log("e[2]: " + e[2]);
        console.log("e[3]: " + e[3]);
        t = '<span class="w-def">' + s.replace(/\//g, "; ") + "</span><br/>";
      }
      c.push(t);
      if (c.length > 4) {
        n = (c.length >> 1) + 1;
        b.push(c.slice(0, n + 1).join(""));
        t = c[n];
        c = c.slice(n, c.length);
        for (i = 0; i < c.length; ++i) {
          if (c[i].indexOf("w-def") !== -1) {
            if (t !== c[i]) {
              b.push(c[i]);
            }
            if (i === 0) {
              c.shift();
            }
            break;
          }
        }
        b.push("</td><td>");
        b.push(c.join(""));
      } else {
        b.push(c.join(""));
      }
      if (entry.hasMore) {
        b.push("...<br/>");
      }
      b.push("</td></tr></table>");
    } else {
      if (entry.title) {
        b.push('<div class="w-title">' + entry.title + "</div>");
      }
      let pK = "";
      let k = void 0;
      if (!entry.index) {
        entry.index = 0;
      }
      if (entry.index !== 0) {
        b.push(`<span class="small-info">... ('j' for more)</span><br/>`);
      }
      for (i = entry.index; i < Math.min(this.config.maxDictEntries + entry.index, entry.data.length); ++i) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }
        if (s !== e[3]) {
          b.push(t);
          pK = k = "";
        } else {
          k = t.length ? "<br/>" : "";
        }
        if (e[2]) {
          if (pK === e[1]) {
            k = '、 <span class="w-kana">' + e[2] + "</span>";
          } else {
            k += '<span class="w-kanji">' + e[1] + '</span> &#32; <span class="w-kana">' + e[2] + "</span>";
          }
          pK = e[1];
        } else {
          k += '<span class="w-kana">' + e[1] + "</span>";
          pK = "";
        }
        b.push(k);
        if (entry.data[i].reason) {
          b.push(' <span class="w-conj">(' + entry.data[i].reason + ")</span>");
        }
        s = e[3];
        t = s.replace(/\//g, "; ");
        if (!this.config.onlyreading) {
          t = '<br/><span class="w-def">' + t + "</span><br/>";
        } else {
          t = "<br/>";
        }
      }
      b.push(t);
      if (entry.hasMore && entry.index < entry.data.length - this.config.maxDictEntries) {
        b.push(`<span class="small-info">... ('k' for more)</span><br/>`);
      }
    }
    return b.join("");
  }
  makeHtmlForRuby(entry) {
    let e;
    let s;
    let t;
    let i;
    if (entry === null) {
      return "";
    }
    const b = [];
    s = t = "";
    if (entry.title) {
      b.push('<div class="w-title">' + entry.title + "</div>");
    }
    for (i = 0; i < entry.data.length; ++i) {
      e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
      if (!e) {
        continue;
      }
      s = e[3];
      t = s.replace(/\//g, "; ");
      t = '<span class="w-def">' + t + "</span><br/>\n";
    }
    b.push(t);
    return b.join("");
  }
  makeText(entry, max) {
    let e;
    let i;
    let j;
    let t;
    if (entry === null) {
      return "";
    }
    const b = [];
    if (entry.kanji) {
      b.push(entry.kanji + "\n");
      b.push((entry.eigo.length ? entry.eigo : "-") + "\n");
      b.push(entry.onkun.replace(/\.([^\u3001]+)/g, "（$1）") + "\n");
      if (entry.nanori.length) {
        b.push("名乗り	" + entry.nanori + "\n");
      }
      if (entry.bushumei.length) {
        b.push("部首名	" + entry.bushumei + "\n");
      }
      for (i = 0; i < this.kanjiInfoLabelList.length; i += 2) {
        e = this.kanjiInfoLabelList[i];
        j = entry.misc[e];
        b.push(this.kanjiInfoLabelList[i + 1].replace("&amp;", "&") + "	" + (j || "-") + "\n");
      }
    } else {
      if (max > entry.data.length) {
        max = entry.data.length;
      }
      for (i = 0; i < max; ++i) {
        e = entry.data[i].entry.match(/^(.+?)\s+(?:\[(.*?)\])?\s*\/(.+)\//);
        if (!e) {
          continue;
        }
        if (e[2]) {
          b.push(e[1] + "	" + e[2]);
        } else {
          b.push(e[1]);
        }
        t = e[3].replace(/\//g, "; ");
        b.push("	" + t + "\n");
      }
    }
    return b.join("");
  }
}
export { RcxDict };
//module.exports = RcxDict;