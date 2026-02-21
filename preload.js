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

window.addEventListener("DOMContentLoaded", () => {
  const isGame = location.hostname === "survev.io";
  if (!isGame) {
    return;
  }
  const script2 = document.createElement('script');
  script2.src = 'http://127.0.0.1:31337/mods/pageHook.js';
  script2.onload = () => {
    console.log("[preload] pageHook.js injected successfully.");
  };
  script2.onerror = (error) => {
    console.error("[preload] Error loading pageHook.js:", error);
  };
  document.body.appendChild(script2);
  
  const script = document.createElement('script');
  script.src = 'http://127.0.0.1:31337/mods/content.js';
  script.onload = () => {
    console.log("[preload] content.js injected successfully.");
  };
  script.onerror = (error) => {
    console.error("[preload] Error loading content.js:", error);
  };
  document.body.appendChild(script);
  console.log('setting up ad blocker');
  setupAdBlocker();  
});
