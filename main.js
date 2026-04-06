const { app, BrowserWindow, session, ipcMain, nativeTheme, shell } = require("electron");
const path = require("path");
const express = require("express");
const { autoUpdater } = require("electron-updater");
let store
(async () => {
  const { default: Store } = await import('electron-store');
  store = new Store();
})(); // im not migrating to ESM >:) but on a serious note hopefully this doesnt cause problems... I dont even know why I chose commonJS for this project... what was I thinking lmao

const appLock = app.requestSingleInstanceLock();

if (!appLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

ipcMain.handle('get-setting', (e, key) => store.get(key));
ipcMain.handle('set-setting', (e, key, value) => {
  store.set(key, value);
});

function isOAuthUrl(url) {
  try {
    const u = new URL(url);

    return (
      u.hostname.endsWith("google.com") ||
      u.hostname.endsWith("googleusercontent.com") ||
      u.hostname.includes("oauth") ||
      u.pathname.includes("oauth")
    );
  } catch {
    return false;
  }
}

let oauthInProgress = false;

function openOAuth(url) {
  if (oauthInProgress) return;
  oauthInProgress = true;

  shell.openExternal(url);

  setTimeout(() => {
    oauthInProgress = false;
  }, 3000);
}

app.setPath(
  "userData",
  path.join(app.getPath("appData"), "SurvevClient")
);

function startModServer(port = 31337) {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    next();
  });

  app.use("/mods", express.static(path.join(__dirname, "mods")));
  app.use("/skins", express.static(path.join(__dirname, "skins")));

  return new Promise(resolve => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log("Mod server running on port", port);
      resolve(server);
    });
  });
}

async function createWindow() {
  const MOD_PORT = 31337;
  await startModServer(MOD_PORT);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    useContentSize: true,
    frame: true,
    fullscreen: false,
    maximizable: true,
    resizable: true,
    backgroundColor: '#121212',
    autoHideMenuBar: true,
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#ffffff',
      height: 32,
    },
    vibrancy: 'acrylic',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.on('close', (e) => {
    e.preventDefault();
    win.destroy();
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (isOAuthUrl(url)) {
      event.preventDefault();
      openOAuth(url)
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isOAuthUrl(url)) {
      openOAuth(url)
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  win.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      if (errorCode === -3) return;
      if (validatedURL.startsWith("https://survev.io")) {
        win.loadFile(path.join(__dirname, "html-pages/offline.html"));
      }
    }
  );

  win.webContents.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );

  // Block unwanted requests / patch scripts
  win.webContents.session.webRequest.onBeforeRequest(
    { urls: ["*://*/*"] },
    (details, callback) => {
      const url = details.url;
      if (
        url.includes("fuseplatform.net") ||
        url.includes("cloudflareinsights.com") ||
        url.includes("doubleclick.net")
      ) {
        console.log('[main.js ad block] blocking a ad site')
        return callback({ cancel: true });
      }
      if (!store.get('in-game-skins')) {
        if (url === "https://survev.io/js/C1GZU2Jc.js") {
          return callback({
            redirectURL: "http://127.0.0.1:31337/mods/C1GZU2Jc.patched.js"
          });
        }
        if (url === "https://survev.io/js/JmvVcZjL.js") {
          return callback({
            redirectURL: "http://127.0.0.1:31337/mods/JmvVcZjL.patched.js"
          });
        }
      }
      if (details.url.includes("/auth/google")) {
        openOAuth(details.url);

        setImmediate(() => {
          if (!win.isDestroyed()) {
            win.loadURL("https://survev.io");
          }
        });

        return callback({ cancel: true });
      }


      callback({});
    }
  );

  if (app.isPackaged) {
    win.webContents.on('before-input-event', (e, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        e.preventDefault();
      }
    });
  }
  const launchType = store.get('game-launch-type');

  if (launchType) {
    win.loadURL('https://survev.io')
  } else if (!launchType) {
    win.loadFile(path.join(__dirname, "html-pages/launcher.html"));
  }
}

nativeTheme.themeSource = 'dark';

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on('apply-skin', (event, { id, customPaths }) => {
  console.log(`Applying skin: ${id}`);
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.webContents.send('apply-skin', { id, customPaths });
  event.sender.send('skin-applied', { id, customPaths });
});

ipcMain.on('restore-skin', (event) => {
  console.log('Restoring original skin');
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.webContents.send('restore-skin');
  event.sender.send('skin-restored');
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

const SERVERS = {
  NA: "wss://usr.mathsiscoolfun.com:8001/ptc",
  EU: "wss://eur.mathsiscoolfun.com:8001/ptc",
  ASIA: "wss://asr.mathsiscoolfun.com:8001/ptc",
  SA: "wss://sa.mathsiscoolfun.com:8001/ptc"
};

let currentRegion = null;
let latestPing = null;
let sessionStop = null;

function startSession(region) {
  const url = SERVERS[region];
  if (!url) return;

  let ws = null;
  let lastSend = 0;
  let active = true;
  const payload = new Uint8Array([0]).buffer;

  function stop() {
    active = false;
    try { ws?.close(); } catch { }
  }

  function connect() {
    ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    ws.onmessage = () => {
      if (!lastSend) return;
      latestPing = Math.round(performance.now() - lastSend);
    };

    ws.onclose = () => {
      if (active) {
        latestPing = null;
        setTimeout(connect, 1000);
      }
    };

  }

  connect();

  const ticker = setInterval(() => {
    if (!active) {
      clearInterval(ticker);
      return;
    }

    if (ws?.readyState === WebSocket.OPEN) {
      lastSend = performance.now();
      ws.send(payload);
    }
  }, 200);

  return stop;
}

ipcMain.on('SET_SERVER', (event, region) => {
  const upperRegion = region?.toUpperCase();
  if (!SERVERS[upperRegion]) return;

  currentRegion = upperRegion;
  latestPing = null;

  sessionStop?.();
  sessionStop = startSession(upperRegion);
});

ipcMain.handle('GET_PING', () => {
  return currentRegion
    ? { region: currentRegion, ping: latestPing }
    : null;
});

ipcMain.on("retry-load", () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.loadURL("https://survev.io");
  }
});

ipcMain.on('go-to-game', (event) => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.once('did-stop-loading', () => {
      win.webContents.send('game-loaded');
    });
    win.loadURL("https://survev.io");
  }
});

ipcMain.on('go-to-launcher', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.loadFile(path.join(__dirname, "html-pages/launcher.html"))
  }
})

ipcMain.on('go-to-github', () => {
  shell.openExternal('https://github.com/chickenpoo351/chickenPoo-amazing-survev-client-desktop')
})

ipcMain.on('go-to-youtube', () => {
  shell.openExternal('https://youtube.com')
})

ipcMain.on('go-to-reddit', () => {
  shell.openExternal('https://reddit.com')
})

ipcMain.on('go-to-discord', () => {
  shell.openExternal('https://discord.com')
})