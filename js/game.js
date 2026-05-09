/* ===== GAME LOOP ===== */

const gameState = createGameState();

async function init() {
    // Initialize all systems first
    initTextures();
    initRender();
    initInput();
    initUI();

    // Load and display version label
    loadVersionLabel();

    // Always show main menu on startup, with Load World button state
    await showMainMenu();

    autoSave();

    // Real-time stage advance check every 0.5s (independent of PRODUCTION_TICK)
    setInterval(() => {
        if (!gameState.paused && !gameState.ui.showMainMenu) {
            checkStageAdvance();
        }
    }, 500);

    requestAnimationFrame(gameLoop);
}

let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // Always update camera (WASD works even if menu is hidden)
    if (!gameState.ui.showMainMenu) {
        updateCamera(dt);
        if (!gameState.paused) {
            update(dt);
        }
        renderBottomResources();
    }
    render(timestamp);

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    try {
        updateProduction(dt);
        updateParticles(dt);
    } catch (e) {
        console.warn("Update error:", e);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

/* ===== VERSION LABEL ===== */

async function loadVersionLabel() {
    const el = document.getElementById("version-label");
    if (!el) return;
    try {
        const res = await fetch("VERSION");
        const version = await res.text();
        el.textContent = `v.${version.trim()} (pre-beta-test)`;
    } catch {
        // Fallback if VERSION file not found (e.g., inside asar)
        el.textContent = "v.0.0.1 (pre-beta-test)";
    }
}
