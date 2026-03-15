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
})();
