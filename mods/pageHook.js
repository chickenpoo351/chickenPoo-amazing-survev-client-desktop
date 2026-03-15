(() => {
  console.log("pagehook should be active");

  window.CustomSkinAPI = window.CustomSkinAPI || {};
  window.CustomSkinAPI.enabled = true;

  try {
    const saved = localStorage.getItem("selectedCustomSkin");
    if (saved && saved !== "none") {
      window.CustomSkinAPI.pendingSkinId = saved;
    }
  } catch (err) {
    console.warn("[pageHook] localStorage unavailable:", err);
  }

  function getPixiCache() {
    return window.PIXI?.TextureCache || window.PIXI?.BaseTextureCache || null;
  }

  function cacheTextures(skin) {
    const cache = getPixiCache();
    if (!cache) {
      console.warn('[pageHook] PIXI cache not ready');
      return;
    }

    const parts = {
      base: skin.base,
      hands: skin.hands,
      feet: skin.feet,
      backpack: skin.backpack,
    };

    Object.entries(parts).forEach(([key, url]) => {
      if (!url) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        try {
          const base = new window.PIXIBaseTexture(img);
          const tex = new window.PIXITexture(base);
          cache[`player-${key}.custom`] = tex;
        } catch (err) {
          console.warn(`[pageHook] Failed to cache ${key}:`, err);
        }
      };
      img.onerror = () => {
        console.warn(`[pageHook] Failed to load image for ${key}:`, url);
      };
    });
  }

  function applySkinById(selected, skins) {
    if (!selected) {
      console.warn('[pageHook] applySkin called without selected id');
      return;
    }

    const skin = skins?.[selected] || (window.CustomSkinAPI.pendingSkinId && skins?.[window.CustomSkinAPI.pendingSkinId]);
    if (!skin) {
      console.warn('[pageHook] No skin data available for:', selected);
      return;
    }

    window.CustomSkinAPI.pendingSkinId = selected;
    window.CustomSkinAPI.enabled = true;

    try {
      localStorage.setItem('selectedCustomSkin', selected);
      localStorage.setItem('customSkinData', JSON.stringify(skins));
    } catch (e) {}

    window.CustomSkinAPI.currentSkin = skin;
    console.log(`[pageHook] Set active custom skin: ${selected}`);

    cacheTextures(skin);
  }

  function restoreSkin() {
    window.CustomSkinAPI.enabled = false;
    window.CustomSkinAPI.currentSkin = null;
    window.CustomSkinAPI.pendingSkinId = null;
    console.log('[pageHook] Restored default visuals');
  }

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'ext-skin-replace') return;
    const { type, selected, skins } = e.data.payload || {};

    if (type === 'replace' && selected) applySkinById(selected, skins);
    if (type === 'restore') restoreSkin();
  });

  if (window.survevCustomSkinMessenger?.receiveMessage) {
    try {
      window.survevCustomSkinMessenger.receiveMessage('apply-skin', ({ id, customPaths }) => {
        let skins = customPaths;
        if (skins && typeof skins.base === 'string') {
          skins = { [id]: skins };
        }
        applySkinById(id, skins);
      });

      window.survevCustomSkinMessenger.receiveMessage('restore-skin', () => restoreSkin());

      console.log('[pageHook] IPC listeners registered');
    } catch (err) {
      console.warn('[pageHook] Failed to register IPC listeners:', err);
    }
  }

  setInterval(() => {
    const api = window.CustomSkinAPI;
    if (!api || api.currentSkin) return;

    let pendingId = api.pendingSkinId;
    try {
      if (!pendingId) pendingId = localStorage.getItem('selectedCustomSkin');
    } catch (err) {}
    if (!pendingId) return;

    let skin = null;
    try {
      const raw = localStorage.getItem('customSkinData');
      if (raw) {
        const map = JSON.parse(raw);
        skin = map?.[pendingId] || (map && typeof map.base === 'string' ? map : null);
      }
    } catch (err) {
      console.warn('[pageHook] Could not read customSkinData from localStorage', err);
    }
    if (!skin) return;

    const cache = getPixiCache();
    if (!cache || !window.PIXIBaseTexture || !window.PIXITexture) return;

    api.currentSkin = skin;
    api.pendingSkinId = pendingId;
    api.enabled = true;
    console.log('[pageHook] Re-applying persisted skin:', pendingId);

    cacheTextures(skin);
  }, 750);

})();