var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const defaultConfig = {
  copySeparator: "tab",
  disablekeys: false,
  highlight: true,
  kanjicomponents: true,
  lineEnding: "n",
  maxClipCopyEntries: 7,
  maxDictEntries: 7,
  minihelp: true,
  onlyreading: false,
  popupcolor: "blue",
  popupDelay: 150,
  popupLocation: 0,
  showOnKey: "",
  textboxhl: false,
  ttsEnabled: false,
  kanjiInfo: [
    { code: "H", name: "Halpern", shouldDisplay: true },
    { code: "L", name: "Heisig 5th Edition", shouldDisplay: true },
    { code: "DN", name: "Heisig 6th Edition", shouldDisplay: true },
    { code: "E", name: "Henshall", shouldDisplay: true },
    { code: "DK", name: "Kanji Learners Dictionary", shouldDisplay: true },
    { code: "N", name: "Nelson", shouldDisplay: true },
    { code: "V", name: "New Nelson", shouldDisplay: true },
    { code: "Y", name: "PinYin", shouldDisplay: true },
    { code: "P", name: "Skip Pattern", shouldDisplay: true },
    { code: "IN", name: "Tuttle Kanji &amp; Kana", shouldDisplay: true },
    { code: "I", name: "Tuttle Kanji Dictionary", shouldDisplay: true },
    { code: "U", name: "Unicode", shouldDisplay: true }
  ]
};
async function getStorage() {
  const config = await new Promise((resolve) => {
    chrome.storage.sync.get(defaultConfig, (cloudStorage) => {
      resolve(cloudStorage);
    });
  });
  return config;
}
function isLegacyKanjiInfo(kanjiInfo) {
  return !(kanjiInfo instanceof Array);
}
async function applyMigrations(storageConfig) {
  if (isLegacyKanjiInfo(storageConfig.kanjiInfo)) {
    const newKanjiInfo = [];
    for (const info of defaultConfig.kanjiInfo) {
      newKanjiInfo.push(__spreadProps(__spreadValues({}, info), {
        shouldDisplay: storageConfig.kanjiInfo[info.code]
      }));
    }
    storageConfig.kanjiInfo = newKanjiInfo;
    await new Promise((resolve) => {
      chrome.storage.sync.set(storageConfig, resolve);
    });
  }
}
async function createNormalizedConfiguration() {
  const storageConfig = await getStorage();
  await applyMigrations(storageConfig);
  return storageConfig;
}
const configPromise = createNormalizedConfiguration();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return;
  }
  void (async () => {
    const config = await configPromise;
    Object.entries(changes).map((change) => {
      config[change[0]] = change[1].newValue;
    });
  })();
});
const immutableConfigPromise = configPromise;
export { immutableConfigPromise as configPromise };
//module.exports = configPromise;