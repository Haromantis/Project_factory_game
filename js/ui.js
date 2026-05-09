/* ===== DOM UI COMPONENTS ===== */

function initUI() {
    // Main menu buttons
    document.getElementById("btn-new-world").addEventListener("click", onNewWorld);
    document.getElementById("btn-load-world").addEventListener("click", onShowWorlds);
    document.getElementById("btn-settings").addEventListener("click", onShowSettings);
    document.getElementById("btn-quit-game").addEventListener("click", onQuitToDesktop);

    // World management
    document.getElementById("btn-world-back").addEventListener("click", onHideWorlds);
    document.getElementById("btn-create-world").addEventListener("click", onCreateWorld);
    document.getElementById("new-world-name").addEventListener("keydown", (e) => {
        if (e.key === "Enter") onCreateWorld();
    });
    document.getElementById("btn-import-world").addEventListener("click", onImportWorld);
    document.getElementById("btn-export-all").addEventListener("click", onExportAllWorlds);
    document.getElementById("import-file-input").addEventListener("change", onImportFile);

    // Settings
    document.getElementById("btn-settings-back").addEventListener("click", onHideSettings);
    document.getElementById("btn-back-menu").addEventListener("click", onBackToMenu);
    document.getElementById("btn-close-inspect").addEventListener("click", hideInspectModal);

    // Cinematic
    document.getElementById("btn-cinematic-skip").addEventListener("click", skipCinematic);

    // Unlock modal
    document.getElementById("btn-unlock-close").addEventListener("click", hideUnlockModal);

    // Pause menu buttons
    document.getElementById("btn-resume").addEventListener("click", onResumeGame);
    document.getElementById("btn-save-world").addEventListener("click", onSaveWorldFromGame);
    document.getElementById("btn-pause-settings").addEventListener("click", onPauseSettings);
    document.getElementById("btn-quit-menu").addEventListener("click", onQuitToMenu);

    // Tutorial
    document.getElementById("tutorial-next").addEventListener("click", tutorialNext);
    document.getElementById("tutorial-prev").addEventListener("click", tutorialPrev);
    document.getElementById("tutorial-skip").addEventListener("click", tutorialSkip);

    // Game buttons
    document.getElementById("new-factory-btn").addEventListener("click", onNewFactory);
    document.getElementById("delete-factory-btn").addEventListener("click", onDeleteFactory);

    // Bottom toolbar tool modes
    document.querySelectorAll("#right-toolbar .tool-btn").forEach(el => {
        el.addEventListener("click", () => setToolMode(el.dataset.mode));
    });

    // Collapsible bar toggles
    document.getElementById("toolbar-toggle").addEventListener("click", () => {
        const bar = document.getElementById("right-toolbar");
        bar.classList.toggle("collapsed");
        bar.querySelector(".bar-toggle").textContent = bar.classList.contains("collapsed") ? "«" : "»";
    });
    document.getElementById("resources-toggle").addEventListener("click", () => {
        const bar = document.getElementById("resource-bar");
        bar.classList.toggle("collapsed");
        bar.querySelector(".bar-toggle").textContent = bar.classList.contains("collapsed") ? "«" : "»";
    });
    document.getElementById("sidebar-toggle").addEventListener("click", () => {
        const sidebar = document.getElementById("sidebar");
        sidebar.classList.toggle("collapsed");
        const toggle = document.getElementById("sidebar-toggle");
        toggle.textContent = sidebar.classList.contains("collapsed") ? "»" : "«";
    });
    // Default sidebar is expanded, toggle shows «
    const sidebarDefault = document.getElementById("sidebar-toggle");
    if (sidebarDefault) sidebarDefault.textContent = "«";
    // Palette tabs
    document.querySelectorAll(".palette-tab").forEach(el => {
        el.addEventListener("click", () => {
            gameState.ui.activePaletteTab = el.dataset.tab;
            gameState.ui.selectedBuilding = null;
            previewRotation = 0;
            renderPalette();
            updateBuildingInfo();
        });
    });

    // Settings sliders
    const camSlider = document.getElementById("setting-cam-speed");
    const zoomSlider = document.getElementById("setting-zoom-speed");
    const gridSlider = document.getElementById("setting-grid-size");

    if (camSlider) camSlider.addEventListener("input", () => {
        gameState.settings.cameraSpeed = parseInt(camSlider.value);
        document.getElementById("setting-cam-speed-val").textContent = camSlider.value;
    });
    if (zoomSlider) zoomSlider.addEventListener("input", () => {
        gameState.settings.zoomSpeed = parseInt(zoomSlider.value);
        document.getElementById("setting-zoom-speed-val").textContent = zoomSlider.value;
    });
    if (gridSlider) gridSlider.addEventListener("input", () => {
        gameState.settings.gridSize = parseInt(gridSlider.value);
        document.getElementById("setting-grid-size-val").textContent = gridSlider.value;
    });

    const showGridCheck = document.getElementById("setting-show-grid");
    if (showGridCheck) showGridCheck.addEventListener("change", (e) => {
        gameState.settings.showGrid = e.target.checked;
    });
    const showParticlesCheck = document.getElementById("setting-show-particles");
    if (showParticlesCheck) showParticlesCheck.addEventListener("change", (e) => {
        gameState.settings.showParticles = e.target.checked;
    });
    const energyCheck = document.getElementById("setting-energy-system");
    if (energyCheck) energyCheck.addEventListener("change", (e) => {
        gameState.settings.energySystem = e.target.checked;
    });
    const detailsCheck = document.getElementById("setting-show-details");
    if (detailsCheck) detailsCheck.addEventListener("change", (e) => {
        showBuildingDetails = e.target.checked;
    });
    if (detailsCheck) detailsCheck.checked = (typeof showBuildingDetails !== "undefined" ? showBuildingDetails : false);

    // Sound settings
    const soundCheck = document.getElementById("setting-sound-enabled");
    if (soundCheck) {
        soundCheck.addEventListener("change", (e) => {
            initAudio();
            toggleSound();
        });
        soundCheck.checked = soundEnabled;
    }
    const bgVolSlider = document.getElementById("setting-bg-volume");
    const bgVolVal = document.getElementById("setting-bg-volume-val");
    if (bgVolSlider) {
        bgVolSlider.addEventListener("input", (e) => {
            const v = parseInt(e.target.value) / 10;
            bgVolume = v;
            if (bgVolVal) bgVolVal.textContent = e.target.value;
            if (masterGain) {
                masterGain.gain.value = soundEnabled ? (v * 0.3 + 0.15) : 0;
            }
        });
    }

    // Keybind buttons
    let listeningBtn = null;
    document.querySelectorAll(".keybind-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (listeningBtn) {
                listeningBtn.classList.remove("listening");
                listeningBtn.textContent = gameState.keybinds[listeningBtn.dataset.key];
                listeningBtn = null;
            }
            btn.classList.add("listening");
            btn.textContent = "Press key...";
            listeningBtn = btn;
        });
    });

    const keybindHandler = (e) => {
        if (!listeningBtn) return;
        e.preventDefault();
        const key = e.key.toLowerCase();
        const bindKey = listeningBtn.dataset.key;

        // Prevent assigning same key to two actions
        for (const [k, v] of Object.entries(gameState.keybinds)) {
            if (v === key && k !== bindKey) {
                // Remove old binding
                const oldBtn = document.querySelector(`.keybind-btn[data-key="${k}"]`);
                if (oldBtn) oldBtn.textContent = "?";
                gameState.keybinds[k] = null;
            }
        }

        gameState.keybinds[bindKey] = key;
        listeningBtn.textContent = key.toUpperCase();
        listeningBtn.classList.remove("listening");
        listeningBtn = null;
        saveGame();
    };

    document.addEventListener("keydown", keybindHandler);

    // Apply settings to sliders
    document.getElementById("setting-cam-speed").value = gameState.settings.cameraSpeed;
    document.getElementById("setting-cam-speed-val").textContent = gameState.settings.cameraSpeed;
    document.getElementById("setting-zoom-speed").value = gameState.settings.zoomSpeed;
    document.getElementById("setting-zoom-speed-val").textContent = gameState.settings.zoomSpeed;
    document.getElementById("setting-grid-size").value = gameState.settings.gridSize;
    document.getElementById("setting-grid-size-val").textContent = gameState.settings.gridSize;

    // Apply keybinds to buttons
    for (const [key, value] of Object.entries(gameState.keybinds)) {
        const btn = document.getElementById(`keybind-${key}`);
        if (btn && value) {
            btn.textContent = value.toUpperCase();
        }
    }
}

/* ===== MAIN MENU ===== */

async function showMainMenu() {
    gameState.ui.showMainMenu = true;
    document.getElementById("main-menu").classList.remove("hidden");
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("settings-panel").classList.add("hidden");

    // Disable "Load World" button if no saved worlds exist yet
    const worlds = await getSavedWorlds();
    const loadBtn = document.getElementById("btn-load-world");
    if (loadBtn) {
        const hasSaves = Object.keys(worlds).length > 0;
        loadBtn.disabled = !hasSaves;
        loadBtn.title = hasSaves ? "Load saved world" : "No saved worlds yet";
    }
}

function showGameScreen() {
    gameState.ui.showMainMenu = false;
    const menuEl = document.getElementById("main-menu");
    const gameEl = document.getElementById("game-screen");
    const settingsEl = document.getElementById("settings-panel");
    if (menuEl) menuEl.classList.add("hidden");
    if (gameEl) gameEl.classList.remove("hidden");
    if (settingsEl) settingsEl.classList.add("hidden");
    requestAnimationFrame(resizeCanvas);
}

function onNewWorld() {
    gameState.factories = {};
    gameState.currentFactoryId = null;
    gameState.energy = { total: 100, max: 200, generated: 0, consumed: 0 };
    gameState.developmentStage = 0;
    gameState.stageCycles = 0;
    gameState.stageTime = 0;
    createFactory("First Cell #1");
    showGameScreen();
    renderFactoryList();
    renderPalette();
    renderStageProgress();
    updateUI();
    saveGame();
    showCinematic();
}

/* ===== WORLD MANAGEMENT ===== */

function onShowWorlds() {
    renderWorldList();
    document.getElementById("world-modal").classList.remove("hidden");
    document.getElementById("main-menu").classList.add("hidden");
}

function onHideWorlds() {
    document.getElementById("world-modal").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("hidden");
}

async function renderWorldList() {
    const worlds = await getSavedWorlds();
    const names = Object.keys(worlds);
    const container = document.getElementById("world-list");
    const title = document.getElementById("world-modal-title");

    title.textContent = `Saved Worlds (${names.length})`;

    if (names.length === 0) {
        container.innerHTML = '<div class="world-empty">No saved worlds yet. Create a new world to get started!</div>';
        return;
    }

    // Sort by most recently saved first
    names.sort((a, b) => worlds[b].savedAt - worlds[a].savedAt);

    let html = "";
    for (const name of names) {
        const world = worlds[name];
        const date = new Date(world.savedAt).toLocaleString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
        const stageName = world.stageName || STAGES[world.stage]?.name || "Unknown";
        const stageColor = STAGES[world.stage]?.color || "#8a7a6a";
        const progress = getWorldStageProgress(world);

        html += `<div class="world-item">`;
        html += `<div class="world-info" onclick="loadWorld('${name.replace(/'/g, "\\'")}')">`;
        html += `<div class="world-name">${escapeHtml(name)}</div>`;
        html += `<div class="world-meta">`;
        html += `<span class="world-stage" style="color:${stageColor}">${stageName}</span>`;
        html += ` &middot; ${date}`;
        if (world.factoryCount) html += ` &middot; ${world.factoryCount} factory`;
        if (world.buildingCount) html += ` &middot; ${world.buildingCount} buildings`;
        html += `</div></div>`;
        html += `<div class="world-progress" title="Stage progress: ${Math.round(progress * 100)}%">`;
        html += `<div class="world-progress-fill" style="width:${Math.round(progress * 100)}%"></div></div>`;
        html += `<div class="world-actions-btns">`;
        html += `<button class="world-btn load-btn" onclick="loadWorld('${name.replace(/'/g, "\\'")}')">Load</button>`;
        html += `<button class="world-btn export-btn" onclick="exportSingleWorld('${name.replace(/'/g, "\\'")}')">Export</button>`;
        html += `<button class="world-btn delete-btn" onclick="deleteSingleWorld('${name.replace(/'/g, "\\'")}')">Delete</button>`;
        html += `</div></div>`;
    }

    container.innerHTML = html;
}

async function onCreateWorld() {
    const input = document.getElementById("new-world-name");
    let name = input.value.trim();

    if (!name) {
        const names = [
            "Blood Works", "Flesh Mill", "Bone Forge",
            "Muscle Refinery", "Stitch Shop", "Heart Forge",
            "Vein Factory", "Sinew Plant", "Organ Works"
        ];
        const baseName = names[Math.floor(Math.random() * names.length)];
        const existingNames = Object.keys(await getSavedWorlds());
        let num = 1;
        while (existingNames.includes(`${baseName} #${num}`)) num++;
        name = `${baseName} #${num}`;
    }

    // Check for duplicate
    const worlds = await getSavedWorlds();
    if (worlds[name]) {
        showToast(`World "${name}" already exists!`);
        return;
    }

    // Create fresh world
    gameState.factories = {};
    gameState.currentFactoryId = null;
    gameState.energy = { total: 100, max: 200, generated: 0, consumed: 0 };
    gameState.developmentStage = 0;
    gameState.stageCycles = 0;
    gameState.stageTime = 0;
    createFactory("First Cell #1");
    await saveWorld(name);

    input.value = "";
    await renderWorldList();
    showToast(`World "${name}" created!`);
}

async function loadWorld(name) {
    const success = await loadWorldByName(name);
    if (!success) {
        showToast(`Failed to load world "${name}"`);
        return;
    }

    gameState.developmentStage = gameState.developmentStage || 0;
    gameState.stageCycles = gameState.stageCycles || 0;
    gameState.stageTime = gameState.stageTime || 0;
    shownUnlocks.clear();

    document.getElementById("world-modal").classList.add("hidden");
    showGameScreen();
    renderFactoryList();
    renderPalette();
    renderStageProgress();
    updateUI();

    showToast(`Loaded "${name}"`);
}

async function deleteSingleWorld(name) {
    if (confirm(`Delete world "${name}"? This cannot be undone.`)) {
        await deleteWorld(name);
        await renderWorldList();
        showToast(`World "${name}" deleted`);
    }
}

async function exportSingleWorld(name) {
    if (await exportWorld(name)) {
        showToast(`Exported "${name}"`);
    }
}

async function onSaveWorldFromGame() {
    // Show world modal from pause menu
    document.getElementById("pause-overlay").classList.add("hidden");
    await renderWorldList();
    document.getElementById("world-modal").classList.remove("hidden");

    // Pre-fill name with current world name if exists
    const worlds = await getSavedWorlds();
    const currentName = Object.keys(worlds).find(n => {
        const w = worlds[n];
        return w.data && w.data.currentFactoryId === gameState.currentFactoryId;
    });
    if (currentName) {
        document.getElementById("new-world-name").value = currentName + " (update)";
    }
}

// Save current game state to an existing world name (quick save)
async function quickSaveWorld(name) {
    await saveWorld(name);
    showToast(`World "${name}" saved!`);
}

function onImportWorld() {
    document.getElementById("import-file-input").click();
}

function onImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
        const result = await importWorlds(ev.target.result);
        if (result.error) {
            showToast(`Import failed: ${result.error}`);
        } else {
            showToast(`Imported ${result.count} world(s)!`);
            await renderWorldList();
        }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
}

async function onExportAllWorlds() {
    const worlds = await getSavedWorlds();
    if (Object.keys(worlds).length === 0) {
        showToast("No worlds to export!");
        return;
    }
    await exportWorlds();
    showToast("Exporting all worlds...");
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getWorldStageProgress(world) {
    const stage = world.stage || 0;
    if (stage >= STAGES.length - 1) return 1.0;

    const next = STAGES[stage + 1];
    if (!next) return 1.0;

    const cycleProgress = Math.min(1, (world.data?.stageCycles || 0) / next.cycleThreshold);
    const timeProgress = Math.min(1, (world.data?.stageTime || 0) / next.timeThreshold);

    // Simplified: use stage and factory count as proxy for production progress
    const factoryCount = world.factoryCount || 0;
    const buildingCount = world.buildingCount || 0;
    const prodProgress = Math.min(1, (factoryCount * 5 + buildingCount) / 20);

    return (cycleProgress + timeProgress + prodProgress) / 3;
}

/* ===== OLD LOAD (kept for compatibility) ===== */
function onLoadWorld() {
    onShowWorlds();
}

function onShowSettings() {
    document.getElementById("settings-panel").classList.remove("hidden");
}

function onHideSettings() {
    document.getElementById("settings-panel").classList.add("hidden");
    // If paused and came from pause settings, show pause overlay again
    if (gameState.paused && !gameState.ui.showMainMenu) {
        document.getElementById("pause-overlay").classList.remove("hidden");
    }
}

function onBackToMenu() {
    saveGame();
    showMainMenu();
}

function onResumeGame() {
    gameState.paused = false;
    document.getElementById("pause-overlay").classList.add("hidden");
}

function onPauseSettings() {
    document.getElementById("pause-overlay").classList.add("hidden");
    document.getElementById("settings-panel").classList.remove("hidden");
}

async function onQuitToMenu() {
    saveGame();
    gameState.paused = false;
    document.getElementById("pause-overlay").classList.add("hidden");
    await showMainMenu();
}

function onQuitToDesktop() {
    saveGame();
    if (window.electronFS) {
        // Electron: close the window
        window.close();
    }
    // Browser fallback: show a message
    document.body.innerHTML = '<div style="color:#fff;text-align:center;margin-top:40vh;font-size:24px;">Game saved. You can close this tab.</div>';
}

/* ===== FACTORY MANAGEMENT ===== */

function onNewFactory() {
    const names = [
        "Blood Works", "Flesh Mill", "Bone Forge",
        "Muscle Refinery", "Stitch Shop", "Heart Forge",
        "Vein Factory", "Sinew Plant", "Organ Works"
    ];
    const name = names[Math.floor(Math.random() * names.length)] + " #" + (Object.keys(gameState.factories).length + 1);
    createFactory(name);
    renderFactoryList();
    renderResources();
    renderStats();
    saveGame();
}

function onDeleteFactory() {
    if (!gameState.currentFactoryId) return;
    if (confirm("Delete this factory? This cannot be undone.")) {
        deleteFactory(gameState.currentFactoryId);
        renderFactoryList();
        renderResources();
        renderStats();
        saveGame();
    }
}

function renderFactoryList() {
    const list = document.getElementById("factory-list");
    list.innerHTML = "";

    for (const [id, factory] of Object.entries(gameState.factories)) {
        const item = document.createElement("div");
        item.className = "factory-item" + (id === gameState.currentFactoryId ? " active" : "");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = factory.name;
        item.appendChild(nameSpan);

        item.addEventListener("click", (e) => {
            if (e.target.tagName !== "INPUT") {
                switchFactory(id);
                renderFactoryList();
                renderResources();
                renderStats();
                renderEnergy();
                saveGame();
            }
        });

        item.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            const input = document.createElement("input");
            input.type = "text";
            input.value = factory.name;
            input.className = "factory-rename-input";
            nameSpan.replaceWith(input);
            input.focus();
            input.select();

            const finishRename = () => {
                factory.name = input.value || factory.name;
                renderFactoryList(); saveGame();
            };
            input.addEventListener("blur", finishRename);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") finishRename();
                if (e.key === "Escape") { input.value = factory.name; finishRename(); }
            });
        });

        list.appendChild(item);
    }
}

/* ===== PALETTE ===== */

function renderPalette() {
    const container = document.getElementById("palette-items");
    container.innerHTML = "";

    const tab = gameState.ui.activePaletteTab;
    const buildingsInTab = Object.entries(BUILDING_DEFS).filter(([, d]) => d.category === tab);

    for (const [type, def] of buildingsInTab) {
        const isUnlocked = isStageUnlocked(type);
        const item = document.createElement("div");
        item.className = "palette-item" + (gameState.ui.selectedBuilding === type ? " selected" : "") + (!isUnlocked ? " locked" : "");

        const icon = document.createElement("div");
        icon.className = "palette-icon";
        icon.style.backgroundColor = isUnlocked ? def.color : "#3a3a3a";
        item.appendChild(icon);

        const label = document.createElement("div");
        label.textContent = isUnlocked ? def.name : `🔒 ${def.name}`;
        item.appendChild(label);

        if (isUnlocked) {
            item.addEventListener("click", () => {
                gameState.ui.selectedBuilding = gameState.ui.selectedBuilding === type ? null : type;
                connectingFrom = null;
                updateUI();
            });
        } else {
            item.addEventListener("click", () => {
                const nextStage = STAGES[def.unlockStage];
                if (nextStage) alert(`Unlock at stage: "${nextStage.name}"`);
            });
        }

        container.appendChild(item);
    }
}

function updateUI() {
    renderPalette();
    renderToolMode();
    renderResources();
    renderStats();
    renderEnergy();
    renderStageProgress();
    updateBuildingInfo();
}

function renderToolMode() {
    document.querySelectorAll("#right-toolbar .tool-btn").forEach(el => {
        el.classList.toggle("active", el.dataset.mode === gameState.ui.toolMode);
    });
}

function updateBuildingInfo() {
    const nameEl = document.getElementById("building-name");
    const descEl = document.getElementById("building-desc");
    const energyEl = document.getElementById("building-energy");

    const type = gameState.ui.selectedBuilding;
    if (!type || !BUILDING_DEFS[type]) {
        nameEl.textContent = "Select a building";
        descEl.textContent = "";
        energyEl.textContent = "";
        return;
    }

    const def = BUILDING_DEFS[type];
    nameEl.textContent = `${def.name} (${def.size[0]}x${def.size[1]})`;
    descEl.textContent = def.description;

    let energyText = "";
    if (def.energyCost > 0) energyText = `Energy: ${def.energyCost} units/cycle`;
    if (def.generatesEnergy) energyText += ` | Produces +${def.energyGenerated} units`;
    if (!energyText) energyText = "No energy required";
    energyEl.textContent = energyText;
}

/* ===== ENERGY ===== */

function renderEnergy() {
    const container = document.getElementById("energy-display");
    const energy = gameState.energy;

    const pct = Math.round((energy.total / energy.max) * 100);

    // Energy warning: show when below 30%, hide when above 40%
    const warningEl = document.getElementById("energy-warning");
    if (warningEl) {
        if (pct < 30) {
            warningEl.classList.remove("hidden");
        } else if (pct > 40) {
            warningEl.classList.add("hidden");
        }
    }

    let html = `<div class="energy-bar-container">`;
    html += `<div class="energy-text">Energy: ${Math.floor(energy.total)} / ${energy.max} (${pct}%)</div>`;
    html += `<div class="energy-bar-bg"><div class="energy-bar-fill" style="width: ${pct}%"></div></div>`;
    html += `<div class="energy-gen-info">Produced: +${energy.generated.toFixed(1)} | Used: -${energy.consumed.toFixed(1)}</div>`;

    const factory = getCurrentFactory();
    if (factory) {
        const furnaces = Object.values(factory.buildings).filter(b => BUILDING_DEFS[b.type]?.generatesEnergy);
        if (furnaces.length > 0) {
            html += `<div class="energy-gen-info">Furnaces connected: ${furnaces.length}</div>`;
        }
    }
    html += `</div>`;

    container.innerHTML = html;
}

/* ===== RESOURCES ===== */

function renderResources() {
    const factory = getCurrentFactory();

    // Sidebar resources
    const sidebarContainer = document.getElementById("resources-list");
    if (sidebarContainer) {
        if (!factory) { sidebarContainer.innerHTML = '<p style="padding: 8px; color: #6a5a4a; font-size: 12px;">No factory</p>'; }
        else {
            const totals = {};
            for (const building of Object.values(factory.buildings)) {
                for (const [res, amt] of Object.entries(building.outputBuffer)) {
                    totals[res] = (totals[res] || 0) + amt;
                }
            }
            let html = "";
            for (const [type, info] of Object.entries(RESOURCE_TYPES)) {
                const amount = totals[type] || 0;
                html += `<div class="resource-row">
                    <span class="resource-name" style="border-left: 3px solid ${info.color}; padding-left: 6px;">${info.name}</span>
                    <span class="resource-amount">${Math.floor(amount)}</span>
                </div>`;
            }
            sidebarContainer.innerHTML = html;
        }
    }
}

function renderBottomResources() {
    const factory = getCurrentFactory();
    const container = document.getElementById("resources-content");
    if (!container) return;
    if (!factory) { container.innerHTML = ""; return; }

    // Calculate totals
    const totals = {};
    for (const building of Object.values(factory.buildings)) {
        for (const [res, amt] of Object.entries(building.outputBuffer)) {
            totals[res] = (totals[res] || 0) + amt;
        }
    }

    // Calculate total demand (what consumers need)
    const demand = {};
    for (const building of Object.values(factory.buildings)) {
        const def = BUILDING_DEFS[building.type];
        if (def.consumes) {
            for (const [res, amt] of Object.entries(def.consumes)) {
                demand[res] = (demand[res] || 0) + amt;
            }
        }
    }

    let html = "";
    for (const [type, info] of Object.entries(RESOURCE_TYPES)) {
        const amount = totals[type] || 0;
        const target = demand[type] || 0;
        const color = info.color;
        html += `<div class="res-chip">
            <span class="res-dot" style="background:${color}"></span>
            <span class="res-name">${info.name}</span>
            <span class="res-amount">${Math.floor(amount)}</span>
            ${target > 0 ? `<span class="res-target">/ ${Math.ceil(target)}</span>` : `<span class="res-target">—</span>`}
        </div>`;
    }
    container.innerHTML = html;
}

/* ===== STATS / PRODUCTION (Right Bar) ===== */

function renderStats() {
    const container = document.getElementById("production-content");
    const factory = getCurrentFactory();

    if (!factory) { container.innerHTML = ''; return; }

    const buildingCount = Object.keys(factory.buildings).length;
    const activeCount = Object.values(factory.buildings).filter(b => b.isActive).length;

    const totals = {};
    for (const entry of factory.productionLog) {
        totals[entry.resource] = (totals[entry.resource] || 0) + entry.amount;
    }

    let html = `<div style="font-size: 10px; color: #8a6a4a; margin-bottom: 4px; font-weight: bold;">PRODUCTION</div>`;
    html += `<div class="prod-chip">Buildings: <span class="prod-val">${buildingCount}</span> / Active: <span class="prod-val">${activeCount}</span></div>`;

    if (Object.keys(totals).length > 0) {
        html += `<div style="margin-top: 4px;">`;
        for (const [res, amt] of Object.entries(totals)) {
            const color = RESOURCE_TYPES[res]?.color || "#aaa";
            html += `<div class="prod-chip" style="color:${color}">${RESOURCE_TYPES[res]?.name || res}: <span class="prod-val">${Math.floor(amt)}</span></div>`;
        }
        html += `</div>`;
    }

    container.innerHTML = html;
}

/* ===== STAGE PROGRESS (Sidebar) ===== */

function renderStageProgress() {
    const container = document.getElementById("stage-display");
    if (!container) return;

    const stage = STAGES[gameState.developmentStage];
    const progress = getStageProgress();
    const nextStage = gameState.developmentStage < STAGES.length - 1 ? STAGES[gameState.developmentStage + 1] : null;

    let html = `<div class="stage-indicator">`;
    html += `<div class="stage-name" style="color: ${stage.color};">${stage.name}</div>`;

    if (nextStage) {
        html += `<div class="stage-progress-bg"><div class="stage-progress-fill" style="width: ${Math.round(progress * 100)}%"></div></div>`;
        html += `<div style="font-size: 9px; color: #5a4a3a;">→ ${nextStage.name} (${Math.round(progress * 100)}%)</div>`;
        if (nextStage.requirements) {
            html += `<div style="font-size: 8px; color: #8a7a6a; margin-top: 2px;">${nextStage.requirements}</div>`;
        }
    } else {
        html += `<div style="font-size: 10px; color: #ffaa00; margin-top: 4px;">Life is complete!</div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
}

/* ===== STORY CINEMATIC (35 seconds) ===== */

let cinematicIndex = 0;
let cinematicTimer = null;
let cinematicTimeout = null;
let currentCinematicStage = 0;

function showCinematic() {
    showStageCinematic(0);
}

function showStageCinematic(stageIndex) {
    // Pause all machines during cinematic
    gameState.paused = true;
    currentCinematicStage = stageIndex;
    cinematicIndex = 0;
    const scenes = STAGES[stageIndex]?.cinematic;
    if (!scenes) { hideCinematic(); return; }
    const modal = document.getElementById("story-cinematic");
    modal.classList.remove("hidden");
    playCinematicScene(scenes);
}

function playCinematicScene(scenes) {
    if (!scenes) {
        // Use current stage's cinematic
        scenes = STAGES[currentCinematicStage]?.cinematic;
        if (!scenes) { hideCinematic(); return; }
    }
    if (cinematicIndex >= scenes.length) {
        hideCinematic();
        return;
    }

    const scene = scenes[cinematicIndex];
    const sceneEl = document.getElementById("cinematic-scene");
    const textEl = document.getElementById("cinematic-text");

    // Reset animation
    sceneEl.style.animation = "none";
    textEl.style.animation = "none";
    void sceneEl.offsetHeight; // Force reflow
    sceneEl.style.animation = `cinematicFade ${scene.duration}ms ease-in-out forwards`;
    textEl.style.animation = "textFadeIn 1.5s ease-out 0.5s forwards";
    textEl.textContent = scene.text;

    cinematicIndex++;
    cinematicTimeout = setTimeout(() => playCinematicScene(scenes), scene.duration);
}

function skipCinematic() {
    clearTimeout(cinematicTimeout);
    gameState.paused = false;
    hideCinematic();
}

function hideCinematic() {
    clearTimeout(cinematicTimeout);
    document.getElementById("story-cinematic").classList.add("hidden");
    // Resume game after cinematic
    gameState.paused = false;
    if (currentCinematicStage === 0) {
        showTutorial();
    }
}

/* ===== UNLOCK MODAL ===== */

const shownUnlocks = new Set();

function showUnlockModal(buildingType) {
    if (shownUnlocks.has(buildingType)) return;
    shownUnlocks.add(buildingType);

    // Pause machines while modal is open
    gameState.paused = true;

    const def = BUILDING_DEFS[buildingType];
    if (!def) return;

    const modal = document.getElementById("unlock-modal");
    const title = document.getElementById("unlock-title");
    const details = document.getElementById("unlock-details");
    const canvas = document.getElementById("unlock-canvas");

    title.textContent = `Unlocked: ${def.name}`;

    // Draw building sprite on canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#1a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sprite = textureCache.get(`building_${buildingType}`);
    if (sprite) {
        const sx = (canvas.width - def.size[0] * 40) / 2;
        const sy = (canvas.height - def.size[1] * 40) / 2;
        ctx.drawImage(sprite, sx, sy, def.size[0] * 40, def.size[1] * 40);
    }

    // Build details
    let html = `<div class="unlock-section">`;
    html += `<p>${def.description}</p>`;
    html += `</div>`;

    if (def.consumes && Object.keys(def.consumes).length > 0) {
        html += `<div class="unlock-section"><span class="unlock-label">Needs:</span> `;
        for (const [res, amt] of Object.entries(def.consumes)) {
            const rt = RESOURCE_TYPES[res];
            html += `<span class="unlock-resource" style="background:${rt?.color || "#666"};color:#fff">${rt?.name || res}: ${amt}/cycle</span> `;
        }
        html += `</div>`;
    }

    if (def.produces && Object.keys(def.produces).length > 0) {
        html += `<div class="unlock-section"><span class="unlock-label">Produces:</span> `;
        for (const [res, amt] of Object.entries(def.produces)) {
            const rt = RESOURCE_TYPES[res];
            html += `<span class="unlock-resource" style="background:${rt?.color || "#666"};color:#fff">${rt?.name || res}: ${amt}/cycle</span> `;
        }
        html += `</div>`;
    }

    if (def.energyCost > 0) {
        html += `<div class="unlock-section"><span class="unlock-label">Energy:</span> ${def.energyCost} units/cycle`;
        if (def.generatesEnergy) html += ` | Produces +${def.energyGenerated} units`;
        html += `</div>`;
    }

    // How to use / connection guide — detailed per building
    html += `<div class="unlock-section"><span class="unlock-label">Connection Guide:</span></div>`;
    html += `<div class="unlock-section" style="color:#a09080;font-size:10px;line-height:1.7;">`;

    if (def.isTransport) {
        html += `<strong>Input (← IN):</strong> Shift+Click the producing machine → Shift+Click conveyor<br>`;
        html += `<strong>Output (OUT →):</strong> Shift+Click conveyor → Shift+Click the consumer machine<br>`;
        html += `<em>The conveyor passes resources from input side to output side automatically.</em>`;
    } else if (def.isStorage) {
        html += `<strong>Input (← IN):</strong> Shift+Click producer → Shift+Click Blood Sac to fill<br>`;
        html += `<strong>Output (OUT →):</strong> Shift+Click Blood Sac → Shift+Click consumer machine<br>`;
        html += `<em>Stores up to ${def.capacity} units. Connect input to fill, output to drain.</em>`;
    } else if (!def.consumes || Object.keys(def.consumes).length === 0) {
        // Extractor / producer
        const outputNames = Object.keys(def.produces).map(r => RESOURCE_TYPES[r]?.name || r).join(", ");
        html += `<strong>Output (OUT →):</strong> Produces <em>${outputNames}</em> automatically<br>`;
        html += `<strong>Connection:</strong> Shift+Click this machine → Shift+Click conveyor → Shift+Click consumer<br>`;
        html += `<em>Resources flow from OUTPUT → Conveyor → Consumer's INPUT</em>`;
    } else {
        // Consumer/processor
        const inputNames = Object.keys(def.consumes).map(r => RESOURCE_TYPES[r]?.name || r).join(" + ");
        const outputNames = Object.keys(def.produces).map(r => RESOURCE_TYPES[r]?.name || r).join(", ");
        html += `<strong>Input (← IN):</strong> Needs <em>${inputNames}</em> to operate<br>`;
        html += `<strong>Connection:</strong> Shift+Click producer → Shift+Click conveyor → Shift+Click this machine<br>`;
        html += `<strong>Output (OUT →):</strong> Produces <em>${outputNames}</em><br>`;
        html += `<strong>Connection:</strong> Shift+Click this → Shift+Click conveyor → Next consumer<br>`;
        html += `<em>Full chain: Extractor → Conveyor → This → Conveyor → Next machine</em>`;
    }
    html += `</div>`;

    html += `<div class="unlock-section" style="color:#8a7a6a;font-size:10px;">`;
    html += `Press <span class="tutorial-key">R</span> while hovering to rotate. Press <span class="tutorial-key">E</span> to toggle machine on/off.`;
    html += `</div>`;

    details.innerHTML = html;
    modal.classList.remove("hidden");
}

function hideUnlockModal() {
    document.getElementById("unlock-modal").classList.add("hidden");
    gameState.paused = false;
}

// Show ALL newly unlocked buildings in one combined modal
function showStageUnlockModal(buildingTypes) {
    // Pause machines while modal is open
    gameState.paused = true;

    const modal = document.getElementById("unlock-modal");
    const title = document.getElementById("unlock-title");
    const details = document.getElementById("unlock-details");
    const canvas = document.getElementById("unlock-canvas");

    title.textContent = `New Machines Unlocked — ${buildingTypes.length} available`;

    // Hide canvas for multi-unlock, show all items in details
    canvas.style.display = buildingTypes.length === 1 ? "block" : "none";

    let html = "";

    for (const buildingType of buildingTypes) {
        const def = BUILDING_DEFS[buildingType];
        if (!def) continue;
        shownUnlocks.add(buildingType);

        html += `<div class="unlock-section" style="border-bottom:1px solid #3a2a1a;padding-bottom:8px;margin-bottom:8px;">`;
        html += `<h3 style="color:#e04040;margin:0 0 4px;">${def.name}</h3>`;
        html += `<p style="margin:0 0 6px;font-size:11px;color:#a09080;">${def.description}</p>`;

        if (def.consumes && Object.keys(def.consumes).length > 0) {
            html += `<span class="unlock-label" style="font-size:10px;">Needs:</span> `;
            for (const [res, amt] of Object.entries(def.consumes)) {
                const rt = RESOURCE_TYPES[res];
                html += `<span class="unlock-resource" style="background:${rt?.color || "#666"};color:#fff;font-size:9px;">${rt?.name || res}: ${amt}/cycle</span> `;
            }
            html += `<br>`;
        }

        if (def.produces && Object.keys(def.produces).length > 0) {
            html += `<span class="unlock-label" style="font-size:10px;">Produces:</span> `;
            for (const [res, amt] of Object.entries(def.produces)) {
                const rt = RESOURCE_TYPES[res];
                html += `<span class="unlock-resource" style="background:${rt?.color || "#666"};color:#fff;font-size:9px;">${rt?.name || res}: ${amt}/cycle</span> `;
            }
            html += `<br>`;
        }

        if (def.energyCost > 0) {
            html += `<span class="unlock-label" style="font-size:10px;">Energy:</span> <span style="font-size:10px;color:#a09080;">${def.energyCost} units/cycle</span>`;
            if (def.generatesEnergy) html += ` <span style="font-size:10px;color:#60c060;">| +${def.energyGenerated} energy</span>`;
            html += `<br>`;
        }

        // Connection guide
        html += `<div style="margin-top:4px;font-size:10px;color:#a09080;line-height:1.5;">`;
        if (def.isTransport) {
            html += `<strong>Conveyor:</strong> Shift+Click source → conveyor → consumer`;
        } else if (def.isStorage) {
            html += `<strong>Storage:</strong> Shift+Click producer → sac → consumer (capacity: ${def.capacity})`;
        } else if (!def.consumes || Object.keys(def.consumes).length === 0) {
            const outNames = Object.keys(def.produces).map(r => RESOURCE_TYPES[r]?.name || r).join(", ");
            html += `<strong>Extractor:</strong> Produces ${outNames}. Shift+Click this → conveyor → consumer`;
        } else {
            const inNames = Object.keys(def.consumes).map(r => RESOURCE_TYPES[r]?.name || r).join(" + ");
            const outNames = Object.keys(def.produces).map(r => RESOURCE_TYPES[r]?.name || r).join(", ");
            html += `Needs <em>${inNames}</em>. Shift+Click producer → conveyor → this. Produces <em>${outNames}</em>.`;
        }
        html += `</div></div>`;
    }

    details.innerHTML = html;
    modal.classList.remove("hidden");
}

/* ===== TUTORIAL ===== */

const TUTORIAL_PAGES = [
    {
        title: "Welcome, Creator",
        body: `<div class="tutorial-step">
            Welcome, Creator~ I'll guide you through this sacred journey.
            <br>You are a <span class="tutorial-key">Worker in Heaven</span> — chosen to create a human life from a single cell.
            <br>Every life starts small and grows through resource production and system connections.
        </div>
        <div class="tutorial-step">
            <strong>Tool Modes:</strong> Press <span class="tutorial-key">1</span> Build | <span class="tutorial-key">2</span> Delete | <span class="tutorial-key">3</span> Inspect
        </div>
        <div class="tutorial-step">
            <strong>Navigation:</strong> <span class="tutorial-key">W</span><span class="tutorial-key">A</span><span class="tutorial-key">S</span><span class="tutorial-key">D</span> move camera | Scroll to zoom
        </div>`,
    },
    {
        title: "Stages of Life",
        body: `<div class="tutorial-step">
            Life develops through <strong>6 beautiful stages</strong>, following real biology:
            <br>1. <span class="tutorial-key">First Cell</span> → The beginning of everything
            <br>2. <span class="tutorial-key">Embryo</span> → Cells divide and grow
            <br>3. <span class="tutorial-key">Neural Tube</span> → The brain begins to form
            <br>4. <span class="tutorial-key">Heartbeat</span> → The heart starts beating
            <br>5. <span class="tutorial-key">Organogenesis</span> → All organs are ready
            <br>6. <span class="tutorial-key">Birth</span> → Life is complete!
        </div>
        <div class="tutorial-step">
            Each stage requires production cycles AND time — <strong>new machines unlock at each stage</strong>
        </div>`,
    },
    {
        title: "Energy Flow",
        body: `<div class="tutorial-step">
            Every machine needs energy to work~ The bigger the machine, the more it hungers.
            <br>Tier 1 machines use <span class="tutorial-key">1.25</span> energy per cycle — the little ones are easy.
            <br>Tier 2 needs <span class="tutorial-key">2.5</span>, and Tier 3 machines drink <span class="tutorial-key">4.25</span> each...
        </div>
        <div class="tutorial-step">
            That's why the <strong>Corpse Furnace</strong> is so important — it generates <span class="tutorial-key">+5</span> energy per cycle!
            <br>Build one first, and everything else will have the power to live~
        </div>`,
    },
    {
        title: "Making Connections",
        body: `<div class="tutorial-step">
            To make resources flow, you need to connect machines together~
            <br>Here's the trick: <strong>Shift+Click</strong> one machine, then <strong>Shift+Click</strong> another. A bond forms between them!
        </div>
        <div class="tutorial-step">
            The <strong>Blood Conveyor</strong> carries resources from one machine to the next.
            <br>And the <strong>Blood Splitter</strong> can send flow in two directions at once — it's generous like that~
        </div>`,
    },
    {
        title: "The Chain of Life",
        body: `<div class="tutorial-step">
            Here's how you create a life, step by step~
            <br>1. <strong>Blood Harvester</strong> — it produces Biomass and Blood Algae from nothing
            <br>2. <strong>Corpse Furnace</strong> — burns Biomass into Biofuel, and gives you energy too!
            <br>3. <strong>Blood Boiler</strong> — refines Polymer for the next stage
            <br>4. <strong>Corpse Stitcher</strong> — assembles Bio Components piece by piece
            <br>5. <strong>Heart Factory</strong> — creates Bio Organs... and life is complete!
        </div>
        <div class="tutorial-step">
            Oh, and if machines face the wrong way, just double-click them or press <span class="tutorial-key">R</span> to rotate~
            <br>Now go create something beautiful, Creator! ✦
        </div>`,
    },
];

let tutorialPageIndex = 0;

function showTutorial() {
    tutorialPageIndex = 0;
    initAudio();
    sfxTutorialOpen();
    renderTutorial();
    document.getElementById("tutorial-modal").classList.remove("hidden");
}

function hideTutorial() {
    document.getElementById("tutorial-modal").classList.add("hidden");
}

function renderTutorial() {
    const page = TUTORIAL_PAGES[tutorialPageIndex];

    // Draw angel portrait
    const angelCanvas = document.getElementById("tutorial-angel");
    const angelSprite = textureCache.get("angel_guide");
    if (angelCanvas && angelSprite) {
        const ctx = angelCanvas.getContext("2d");
        ctx.clearRect(0, 0, angelCanvas.width, angelCanvas.height);
        ctx.drawImage(angelSprite, 0, 0, angelCanvas.width, angelCanvas.height);
    }

    // Convert title to speech-style
    document.getElementById("tutorial-title").textContent = "✦ " + page.title;
    document.getElementById("tutorial-body").innerHTML = page.body;
    document.getElementById("tutorial-page-num").textContent = `${tutorialPageIndex + 1} / ${TUTORIAL_PAGES.length}`;

    document.getElementById("tutorial-prev").style.visibility = tutorialPageIndex === 0 ? "hidden" : "visible";
    document.getElementById("tutorial-next").textContent = tutorialPageIndex === TUTORIAL_PAGES.length - 1 ? "Done" : "Next";
}

function tutorialNext() {
    if (tutorialPageIndex < TUTORIAL_PAGES.length - 1) {
        tutorialPageIndex++;
        renderTutorial();
    } else {
        hideTutorial();
    }
}

function tutorialPrev() {
    if (tutorialPageIndex > 0) {
        tutorialPageIndex--;
        renderTutorial();
    }
}

function tutorialSkip() {
    hideTutorial();
}
