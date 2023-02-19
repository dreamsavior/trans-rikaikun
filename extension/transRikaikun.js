thisAddon = this;
thisAddon.defaultConfig = {
  "copySeparator": "tab",
  "disablekeys": false,
  "highlight": true,
  "kanjiInfo": [
    {
      "code": "H",
      "name": "Halpern",
      "shouldDisplay": true
    },
    {
      "code": "L",
      "name": "Heisig 5th Edition",
      "shouldDisplay": true
    },
    {
      "code": "DN",
      "name": "Heisig 6th Edition",
      "shouldDisplay": true
    },
    {
      "code": "E",
      "name": "Henshall",
      "shouldDisplay": true
    },
    {
      "code": "DK",
      "name": "Kanji Learners Dictionary",
      "shouldDisplay": true
    },
    {
      "code": "N",
      "name": "Nelson",
      "shouldDisplay": true
    },
    {
      "code": "V",
      "name": "New Nelson",
      "shouldDisplay": true
    },
    {
      "code": "Y",
      "name": "PinYin",
      "shouldDisplay": true
    },
    {
      "code": "P",
      "name": "Skip Pattern",
      "shouldDisplay": true
    },
    {
      "code": "IN",
      "name": "Tuttle Kanji &amp; Kana",
      "shouldDisplay": true
    },
    {
      "code": "I",
      "name": "Tuttle Kanji Dictionary",
      "shouldDisplay": true
    },
    {
      "code": "U",
      "name": "Unicode",
      "shouldDisplay": true
    }
  ],
  "kanjicomponents": true,
  "lineEnding": "n",
  "maxClipCopyEntries": 7,
  "maxDictEntries": 7,
  "minihelp": true,
  "onlyreading": false,
  "popupDelay": 150,
  "popupLocation": 0,
  "popupcolor": "blue",
  "showOnKey": "",
  "textboxhl": false,
  "ttsEnabled": false
};
const dataLoc = "www/addons/transRikaikun/";
var rcxContent = require(dataLoc + "rikaicontent.js");
thisAddon.rcxContent = rcxContent;
thisAddon.showHelp = function() {
  rcxContent.showPopup('<span style="font-weight:bold">Rikaikun addon enabled!</span><br><br><table cellspacing=5><tr><td>A</td><td>Alternate popup location</td></tr><tr><td>Y</td><td>Move popup location down</td></tr><tr><td>C</td><td>Copy to clipboard</td></tr><tr><td>D</td><td>Hide/show definitions</td></tr><tr><td>Shift/Enter&nbsp;&nbsp;</td><td>Switch dictionaries</td></tr><tr><td>B</td><td>Previous character</td></tr><tr><td>M</td><td>Next character</td></tr><tr><td>N</td><td>Next word</td></tr><tr><td>J</td><td>Scroll back definitions</td></tr><tr><td>K</td><td>Scroll forward definitions</td></tr></table>');
};
thisAddon.enable = async function(config) {
  config = config || this.defaultConfig;
  await this.loadBackgroundPage(this.getWebLocation() + "/background.html");
  rcxContent.enableTab(config);
};
thisAddon.disable = async function() {
  rcxContent.disableTab();
  if (!thisAddon.getConfig("noUnload")) {
    console.log("unload dictionary");
    await this.unloadBackgroundPage(this.getWebLocation() + "/background.html");
  }
};
var init = async () => {
  var addMenuButton = () => {
    var $btn = $(`<span class="menu-button buttonGroup group-rikai"><button class="button-rikai rikai hasMenuSide" data-tranattr="title" title="Enable/disable Rikaikun (alt+r)" accesskey="r"><img src="${thisAddon.getWebLocation()}/images/icon48.png" alt="Rikaikun"></button><button class="button-rikai-side menuSide"></button></span>`);
    $btn.find(".button-rikai").on("click", async function() {
      if ($(this).is(".checked")) {
        $(this).removeClass("checked");
        thisAddon.disable();
      } else {
        $(this).addClass("checked");
        await thisAddon.enable();
        thisAddon.showHelp();
      }
    });

    thisAddon.menu = new nw.Menu();

	// Add some items with label
    thisAddon.menu.append(new nw.MenuItem({
        label: t('Never unload dictionaries from RAM'),
        type: "checkbox", 
        checked: Boolean(thisAddon.getConfig("noUnload")),
        click: function(){
            this.checked = !thisAddon.getConfig("noUnload");
            thisAddon.setConfig("noUnload", this.checked);	
        }
	}));


    $btn.find(".button-rikai-side").on("click", function(ev) {
		ev.preventDefault();
		// Popup the native context menu at place you click
		console.log(ev.originalEvent);
		var $wrapper = $(this);
		var left = parseInt($wrapper.offset().left);
		var top = parseInt($wrapper.offset().top + $wrapper.outerHeight());
		console.log(left, top)
		//ui.menus.saveAs.popup(parseInt(ev.originalEvent.x), parseInt(ev.originalEvent.y));
		thisAddon.menu.popup(left, top);
		return false;	
    })

    $(".toolbarGroup .toolbar3").append($btn);
  };
  addMenuButton();
};
$(document).ready(function() {
  ui.onReady(() => {
    init();
  });
});
