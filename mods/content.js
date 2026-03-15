import { customPaths, catalog } from "./skin-defs.js";

(() => {
  console.log("content.js should be loaded...");

  function applyCustomSkin(id) {
    if (!id || id === "none") return restoreOriginal();

    const skin = customPaths[id];
    if (!skin) {
      console.warn(`Unknown skin ID: ${id}`);
      return;
    }

    try {
      localStorage.setItem('selectedCustomSkin', id);
      localStorage.setItem('customSkinData', JSON.stringify(customPaths));
    } catch (err) {
      console.warn('[custom-skin] localStorage write failed', err);
    }

    window.survevCustomSkinMessenger.sendMessage('apply-skin', { id, customPaths });

    console.log(`[custom-skin] Requested skin apply: ${id}`);
  }

  const rarityColors = {
    Stock: "#c5c5c5",
    Common: "#c5c5c5",
    Uncommon: "#12ff00",
    Rare: "#00deff",
    Epic: "#f600ff",
    Mythic: "#d96100",
  };

  function clearSelection(list) {
    list.querySelectorAll(".custom-skin")
      .forEach(el => el.classList.remove("customize-list-item-selected-blue"));
  }

  function updateSkinInfo(data) {
    const nameElem = document.getElementById("modal-customize-item-name");
    const rarityElem = document.getElementById("modal-customize-item-rarity");
    const loreElem = document.getElementById("modal-customize-item-lore");
    const sourceElem = document.getElementById("modal-customize-item-source");

    if (nameElem) nameElem.textContent = data.name;
    if (rarityElem) {
      rarityElem.textContent = data.rarity;
      rarityElem.style.color = rarityColors[data.rarity] || "#c5c5c5";
    }
    if (loreElem) loreElem.textContent = data.desc;
    if (sourceElem) sourceElem.textContent = "Acquired: Chicken's client";
  }

  function createSkinBox(id, data, list) {
    const item = document.createElement("div");
    item.className = "customize-list-item customize-list-item-unlocked custom-skin";
    item.dataset.customId = id;
    item.style.cursor = "pointer";

    const imgDiv = document.createElement("div");
    imgDiv.className = "customize-item-image";
    imgDiv.style.backgroundImage = `url(${data.img})`;
    item.appendChild(imgDiv);

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();

      clearSelection(list);
      item.classList.add("customize-list-item-selected-blue");

      localStorage.setItem("selectedCustomSkin", id);
      applyCustomSkin(id);

      updateSkinInfo(data);
    });
    return item;
  }

  function createNoneBox(list) {
    const none = document.createElement("div");

    none.className = "customize-list-item customize-list-item-unlocked custom-skin";
    none.textContent = "None";
    none.style.display = "flex";
    none.style.alignItems = "center";
    none.style.justifyContent = "center";
    none.style.cursor = "pointer";

    none.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      clearSelection(list);
      localStorage.removeItem("selectedCustomSkin");
      restoreOriginal();
    });
    return none;
  }

  function restoreOriginal() {
    window.survevCustomSkinMessenger.sendMessage('restore-skin');
    console.log("[custom-skin] Requested skin restore");
  }

  function injectCustomSkinBoxes() {
    const list = document.querySelector("#modal-customize-list");

    if (!list || list.querySelector(".custom-skin")) return;

    for (const [id, data] of Object.entries(catalog)) {
      const item = createSkinBox(id, data, list);
      list.appendChild(item);
    }

    list.appendChild(createNoneBox(list));

    console.log('ui injected');
  }

  function autoApply() {
    const selected = localStorage.getItem("selectedCustomSkin");
    if (!selected || selected === "none") return;

    console.log("queued apply for:", selected);

    const tryApply = setInterval(() => {
      if (window.CustomSkinAPI) {
        window.CustomSkinAPI.pendingSkinId = selected;
        window.CustomSkinAPI.enabled = true;
        applyCustomSkin(selected);
        console.log("applied custom skin:", selected);
        clearInterval(tryApply);
      } else {
        console.log("Waiting for CustomSkinAPI...");
      }
    }, 250);

    setTimeout(() => clearInterval(tryApply), 20000);
  }

  const observer = new MutationObserver(() => {
    const modal = document.getElementById("modal-customize");
    const outfitOrigin = document.querySelector('[data-img="url(img/loot/loot-shirt-outfitBase.svg)"]');
    if (!modal) return;
    const visible = window.getComputedStyle(modal).display !== "none";
    if (visible && outfitOrigin) injectCustomSkinBoxes();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const style = document.createElement("style");
  style.textContent = `
    .customize-list-item-selected-blue {
      opacity: 1 !important;
      border: 5px solid #3399ff !important;
      box-sizing: border-box !important;
    }`;
  document.head.appendChild(style);

  window.addEventListener("load", autoApply);

























  // fps and ping stuff :o
  let lastFrame = performance.now();
  let smoothedFrameTime = 16.67;
  const smoothing = 0.1;

  const fpsUI = document.createElement("div");
  fpsUI.style.cssText = `
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 10;
    background: rgba(0,0,0,0.7);
    color: white;
    font: 12px monospace;
    padding: 4px 8px;
  `;
  document.body.appendChild(fpsUI);

  function frameLoop(now) {
    const delta = now - lastFrame;
    lastFrame = now;

    smoothedFrameTime += (delta - smoothedFrameTime) * smoothing;

    const fps = 1000 / smoothedFrameTime;

    fpsUI.textContent = `${fps.toFixed(1)} FPS`;

    requestAnimationFrame(frameLoop);
  }

  requestAnimationFrame(frameLoop);


  let pingInterval = null;
  let urlInterval = null;


  const pingUI = document.createElement("div");
  pingUI.style.cssText = `
    position: fixed;
    top: 32px;
    left: 8px;
    z-index: 10;
    background: rgba(0,0,0,0.7);
    color: white;
    font: 12px monospace;
    padding: 4px 8px;
  `;
  document.body.appendChild(pingUI);

  function detectServerChange() {
    const currentUrl = location.href;
    const isSpecialUrl = /\/#\w+/.test(currentUrl);

    const teamSelectElement = document.getElementById("team-server-select");
    const mainSelectElement = document.getElementById("server-select-main");

    const region =
      isSpecialUrl && teamSelectElement
        ? teamSelectElement.value
        : mainSelectElement
          ? mainSelectElement.value
          : null;

    if (region) {
      window.pingGarbage.setServer(region);
    }
  }

  function waitForServerSelect() {
    const observer = new MutationObserver(() => {
      const teamSelectElement =
        document.getElementById("team-server-select");
      const mainSelectElement =
        document.getElementById("server-select-main");

      if (teamSelectElement || mainSelectElement) {
        observer.disconnect();
        detectServerChange();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  waitForServerSelect();


  async function updatePingUI() {
    try {
      const result = await window.pingGarbage.getPing();

      if (!result || result.ping == null) {
        pingUI.textContent = "Ping: --";
        return;
      }

      pingUI.textContent =
        `Ping (${result.region}): ${result.ping} ms`;
    } catch (err) {
      console.error("Ping IPC failed:", err);
      pingUI.textContent = "Ping: --";
    }
  }

  pingInterval = setInterval(updatePingUI, 300);

  document.addEventListener("change", (e) => {
    if (
      e.target.id === "team-server-select" ||
      e.target.id === "server-select-main"
    ) {
      detectServerChange();
    }
  });

  let lastUrl = location.href;
  urlInterval = setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      detectServerChange();
    }
  }, 500);

  // kill counter
  const killUI = document.createElement("div");
  killUI.style.cssText = `
    position: fixed;
    top: 56px;
    left: 8px;
    z-index: 10;
    background: rgba(0,0,0,0.7);
    color: white;
    font: 12px monospace;
    padding: 4px 8px;
  `;
  document.body.appendChild(killUI);


  const inGameKillCounter =
    document.querySelector('.ui-player-kills.js-ui-player-kills');

  if (!inGameKillCounter) {
    console.warn('Kill counter not found');
    return;
  }

  function getKillAmount() {
    return inGameKillCounter.textContent.trim();
  }

  let lastKillCount = getKillAmount();
  killUI.textContent = `Kills: ${lastKillCount}`;

  const killObserver = new MutationObserver(() => {
    const currentKillCount = getKillAmount();

    if (currentKillCount !== lastKillCount) {
      lastKillCount = currentKillCount;
      killUI.textContent = `Kills: ${currentKillCount}`;
    }
  });

  killObserver.observe(inGameKillCounter, {
    characterData: true,
    childList: true,
    subtree: true
  });

  // UI stuff
  const modalSettingsBody = document.querySelector('#modal-settings-body');

  modalSettingsBody.style.cssText = `
    max-height: 80vh;
    overflow-y: auto;
  `

  function createSectionHeader(text) {
    const p = document.createElement('p');
    p.className = 'modal-settings-checkbox-text';
    p.textContent = text;
    return p;
  }

  function createUIToggle(checkBoxId, textContent) {
    if (document.getElementById(checkBoxId)) return null;

    let tempUIToggleCreation = document.createElement('div');
    tempUIToggleCreation.className = 'modal-settings-item';

    let tempCheckBox = document.createElement('input');
    tempCheckBox.type = 'checkbox';
    tempCheckBox.id = checkBoxId;

    const tempText = document.createElement('p');
    tempText.className = 'modal-settings-checkbox-text';
    tempText.textContent = textContent;

    tempUIToggleCreation.appendChild(tempCheckBox);
    tempUIToggleCreation.appendChild(tempText);

    return { tempCheckBox, tempUIToggleCreation }
  }

  let settingUINodes = [];

  const checkBoxModHeader = createSectionHeader('Chicken\'s Client Options');
  settingUINodes.push(checkBoxModHeader);

  const fpsToggle = createUIToggle('fps-checkbox', 'FPS Counter');
  const fpsToggleDiv = fpsToggle.tempUIToggleCreation;
  const fpsCheckBox = fpsToggle.tempCheckBox;
  settingUINodes.push(fpsToggleDiv);

  const pingToggle = createUIToggle('ping-checkbox', 'Ping Counter');
  const pingToggleDiv = pingToggle.tempUIToggleCreation;
  const pingCheckBox = pingToggle.tempCheckBox;
  settingUINodes.push(pingToggleDiv);

  const killToggle = createUIToggle('kill-checkbox', 'Kill Counter');
  const killToggleDiv = killToggle.tempUIToggleCreation;
  const killCheckBox = killToggle.tempCheckBox;
  settingUINodes.push(killToggleDiv);

  function injectModSettingsUI({ containerSelector, findAnchor, nodes }) {
    const container = document.querySelector(containerSelector);
    if (!container) return false;

    const anchor = findAnchor(container);
    if (!anchor) return false;

    anchor.after(...nodes);
    return true;
  }

  injectModSettingsUI({ containerSelector: '#modal-settings-body', findAnchor: (container) => [...container.children].find(div => div.querySelector('input#anonPlayerNames')), nodes: settingUINodes });

  function updateFPSVisibility() {
    fpsUI.style.display = fpsCheckBox.checked ? '' : 'none';
  }
  function updatePingVisibility() {
    pingUI.style.display = pingCheckBox.checked ? '' : 'none';
  }
  function updateKillVisibility() {
    killUI.style.display = killCheckBox.checked ? '' : 'none';
  }

  updateFPSVisibility();
  updatePingVisibility();
  updateKillVisibility();

  fpsCheckBox.addEventListener('change', updateFPSVisibility);
  pingCheckBox.addEventListener('change', updatePingVisibility);
  killCheckBox.addEventListener('change', updateKillVisibility);

  let testButton = document.createElement('a');
  testButton.textContent = 'Return to Launcher'
  testButton.id = 'return-to-launcher';
  testButton.className = 'footer-after';
  testButton.style.cursor = 'pointer';
  document.getElementById('start-bottom-middle').appendChild(testButton);
  testButton.addEventListener('click', () => {
    window.launcherStuff.returnLauncher();
  })
})();
