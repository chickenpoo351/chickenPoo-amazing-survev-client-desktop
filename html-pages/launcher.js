const goToGameButton = document.getElementById('go-to-game');
const startGameFromLauncher = document.getElementById('game-start-location');
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

async function loadCheckboxState() {
    const savedValue = await window.launcherStuff.get('game-launch-type');
    startGameFromLauncher.checked = savedValue ?? false;
}

loadCheckboxState();

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