thisAddon = this;

var RcxDict = require("www/addons/transRikaikun/data.js");
var RcxMain = require("www/addons/transRikaikun/rikaichan.js");
var configPromise = require("www/addons/transRikaikun/configuration.js");
var tts = require("www/addons/transRikaikun/texttospeech.js");



async function createRcxMainPromise() {
  const config = await configPromise;
  const dict = await RcxDict.create(config);
  return RcxMain.create(dict, config);
}
const rcxMainPromise = createRcxMainPromise();



chrome.browserAction.onClicked.addListener(async (tab) => {
  const rcxMain = await rcxMainPromise;
  rcxMain.inlineToggle(tab);
});
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const rcxMain = await rcxMainPromise;
  rcxMain.onTabSelect(activeInfo.tabId);
});

chrome.runtime.onMessage.addListener(async (request, sender, response) => {
  const rcxMain = await rcxMainPromise;
  switch (request.type) {
    case "enable?":
      console.log("enable?");
      if (sender.tab === void 0) {
        throw TypeError("sender.tab is always defined here.");
      }
      rcxMain.onTabSelect(sender.tab.id);
      break;
    case "xsearch":
      console.log("xsearch");
      response(rcxMain.search(request.text, request.dictOption));
      break;
    case "resetDict":
      console.log("resetDict");
      rcxMain.resetDict();
      break;
    case "translate":
      console.log("translate");
      response(rcxMain.dict.translate(request.title));
      break;
    case "makehtml":
      console.log("makehtml");
      response(rcxMain.dict.makeHtml(request.entry));
      break;
    case "switchOnlyReading":
      console.log("switchOnlyReading");
      void chrome.storage.sync.set({
        onlyreading: !rcxMain.config.onlyreading
      });
      break;
    case "copyToClip":
      console.log("copyToClip");
      rcxMain.copyToClip(sender.tab, request.entry);
      break;
    case "playTTS":
      console.log("playTTS");
      tts.play(request.text);
      break;
    default:
      console.log(request);
  }
});
//void chrome.browserAction.setBadgeText({ text: "" });
