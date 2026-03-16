const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('survevCustomSkinMessenger', {
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveMessage: (channel, callback) => {
    ipcRenderer.on(channel, (event, data) => callback(data));
  }
});

contextBridge.exposeInMainWorld('pingGarbage', {
  setServer: (region) => ipcRenderer.send('SET_SERVER', region),
  getPing: () => ipcRenderer.invoke('GET_PING'),
  retry: () => ipcRenderer.send("retry-load") // not related to ping but I dont want to make another channel just for this :p
})

contextBridge.exposeInMainWorld('launcherStuff', {
  loadSurvev: () => ipcRenderer.send("go-to-game"),
  get: (key) => ipcRenderer.invoke('get-setting', key),
  set: (key, value) => ipcRenderer.invoke('set-setting', key, value),
  returnLauncher: () => ipcRenderer.send("go-to-launcher"),
  onGameLoaded: (callback) => ipcRenderer.on("game-loaded", callback),
  openGithub: () => ipcRenderer.send("go-to-github"),
  openYoutube: () => ipcRenderer.send("go-to-youtube"),
  openReddit: () => ipcRenderer.send('go-to-reddit'),
  openDiscord: () => ipcRenderer.send("go-to-discord")
})

function setupAdBlocker() {
  const removeAds = () => {
    document
      .querySelectorAll(".ad-block-header, iframe.ad-frame")
      .forEach(el => el.remove());
  };
  removeAds();

  if (document.body) {
    const observer = new MutationObserver(removeAds);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10_000);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  const isGame = location.hostname === "survev.io";
  if (!isGame) {
    return;
  }

  function injectScript(src, consName, type = "text/javascript") {
    const s = document.createElement('script');
    s.src = src;
    if (type === "module") s.type = "module";
    s.onload = () => {
      console.log(`${consName}.js injected`)
    }
    s.onerror = (error) => {
      console.error(`error loading ${consName}`, error)
    }
    document.body.appendChild(s)
  }

  const [skinsEnabled, countersEnabled] = await Promise.all([
    ipcRenderer.invoke('get-setting', 'in-game-skins'),
    ipcRenderer.invoke('get-setting', "in-game-counters")
  ]);

  injectScript("http://127.0.0.1:31337/mods/return-button.js", "return-button");
  if (!skinsEnabled) {
    injectScript("http://127.0.0.1:31337/mods/pageHook.js", "pagehook");
    injectScript('http://127.0.0.1:31337/mods/content.js', "content", "module");
  }
  if (!countersEnabled) {
    injectScript('http://127.0.0.1:31337/mods/counters/counter-main.js', "counter-main");
  }
  console.log('setting up ad blocker');
  setupAdBlocker();
});
