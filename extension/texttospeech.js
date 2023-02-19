class TTS {
  constructor() {
    this.lastTime = new Date().valueOf();
    this.previousText = null;
  }
  static create() {
    if (!TTS.instance) {
      TTS.instance = new TTS();
    }
    return TTS.instance;
  }
  play(text) {
    const now = new Date().valueOf();
    const limit = this.lastTime + 1e3;
    if (text !== this.previousText || now > limit) {
      console.log("tts.speak(" + text + ")");
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance();
      u.text = text;
      u.lang = "ja-JP";
      window.speechSynthesis.speak(u);
      this.previousText = text;
      this.lastTime = now;
    } else {
      console.log("Ignoring " + text);
    }
  }
}
const tts = TTS.create();
export { tts };
