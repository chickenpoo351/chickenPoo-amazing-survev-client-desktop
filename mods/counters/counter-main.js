(() => {
    function createOverlay(topOffset) {
        const el = document.createElement("div");
        el.style.cssText = `
        position: fixed;
        top: ${topOffset}px;
        left: 8px;
        z-index: 10;
        background: rgba(0,0,0,0.7);
        color: white;
        font: 12px monospace;
        padding: 4px 8px;
        `;
        document.body.appendChild(el);
        return el;
    }

    const fpsUI = createOverlay(8);
    const pingUI = createOverlay(32);
    const killUI = createOverlay(56);

    // fps and ping stuff :o
    let lastFrame = performance.now();
    let smoothedFrameTime = 16.67;
    const smoothing = 0.1;

    function frameLoop(now) {
        const delta = now - lastFrame;
        lastFrame = now;

        smoothedFrameTime += (delta - smoothedFrameTime) * smoothing;

        const fps = 1000 / smoothedFrameTime;

        fpsUI.textContent = `${fps.toFixed(1)} FPS`;

        requestAnimationFrame(frameLoop);
    }

    requestAnimationFrame(frameLoop);

    // ping stuff
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
    `;

    function createSectionHeader(text) {
        const p = document.createElement('p');
        p.className = 'modal-settings-checkbox-text';
        p.textContent = text;
        return p;
    }

    function createToggle(id, label) {
        if (document.getElementById(id)) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'modal-settings-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;

        const text = document.createElement('p');
        text.className = 'modal-settings-checkbox-text';
        text.textContent = label;

        wrapper.append(checkbox, text);

        return { wrapper, checkbox };
    }

    const settingUINodes = [
        createSectionHeader("Chicken's Client Options")
    ];

    const toggles = {
        fps: createToggle('fps-checkbox', 'FPS Counter'),
        ping: createToggle('ping-checkbox', 'Ping Counter'),
        kill: createToggle('kill-checkbox', 'Kill Counter')
    };

    Object.values(toggles).forEach(toggle => {
        if (toggle) settingUINodes.push(toggle.wrapper);
    });

    const anchor = [...modalSettingsBody.children]
        .find(div => div.querySelector('#anonPlayerNames'));

    anchor?.after(...settingUINodes);

    function bindVisibility(checkbox, element) {
        function update() {
            element.style.display = checkbox.checked ? '' : 'none';
        }

        checkbox.addEventListener('change', update);
        update();
    }

    bindVisibility(toggles.fps.checkbox, fpsUI);
    bindVisibility(toggles.ping.checkbox, pingUI);
    bindVisibility(toggles.kill.checkbox, killUI);
})();