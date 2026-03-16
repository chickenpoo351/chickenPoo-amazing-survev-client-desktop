const goToGameButton = document.getElementById('go-to-game');
const startGameFromLauncher = document.getElementById('game-start-location');
const turnOnInGameCounters = document.getElementById('in-game-counters');
const turnOnInGameSkins = document.getElementById('game-skins');
const spinner = document.getElementById('spinner');
const buttonText = document.getElementById('button-text');

goToGameButton.addEventListener('click', () => {
    goToGameButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = "Loading...";
    window.launcherStuff.loadSurvev();
});

startGameFromLauncher.addEventListener('change', async () => {
    await window.launcherStuff.set(
        'game-launch-type',
        startGameFromLauncher.checked
    );
});

turnOnInGameCounters.addEventListener('change', async () => {
    await window.launcherStuff.set(
        'in-game-counters',
        turnOnInGameCounters.checked
    );
});

turnOnInGameSkins.addEventListener('change', async () => {
    await window.launcherStuff.set(
        'in-game-skins',
        turnOnInGameSkins.checked
    );
});

async function loadCheckboxState() {
    const savedValueLaunch = await window.launcherStuff.get('game-launch-type');
    const savedValueCounter = await window.launcherStuff.get('in-game-counters');
    const savedValueSkin = await window.launcherStuff.get('in-game-skins');
    startGameFromLauncher.checked = savedValueLaunch ?? false;
    turnOnInGameCounters.checked = savedValueCounter ?? false;
    turnOnInGameSkins.checked = savedValueSkin ?? false;
}

loadCheckboxState();

document.querySelectorAll(".version-title").forEach(title => {
    title.addEventListener("click", () => {

        const details = title.nextElementSibling;

        if (details.classList.contains("hidden")) {
            details.classList.remove("hidden");
        } else {
            details.classList.add("hidden");
        }

    });
});

document.getElementById("github-star").addEventListener("click", () => {
    window.launcherStuff.openGithub();
});

document.getElementById('github-button').addEventListener("click", () => {
    window.launcherStuff.openGithub();
})

document.getElementById('youtube-button').addEventListener('click', () => {
    window.launcherStuff.openYoutube();
})

document.getElementById("reddit-button").addEventListener("click", () => {
    window.launcherStuff.openReddit();
})

document.getElementById("discord-button").addEventListener("click", () => {
    window.launcherStuff.openDiscord();
})