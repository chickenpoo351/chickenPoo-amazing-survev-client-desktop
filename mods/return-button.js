(() => {
    let testButton = document.createElement('a');
    testButton.textContent = 'Return to Launcher'
    testButton.id = 'return-to-launcher';
    testButton.className = 'footer-after';
    testButton.style.cursor = 'pointer';
    document.getElementById('start-bottom-middle').appendChild(testButton);
    testButton.addEventListener('click', () => {
        window.launcherStuff.returnLauncher();
    })
})()