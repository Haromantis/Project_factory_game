/* ===== GAME STATE MODEL ===== */

const SAVE_KEY = "rustyFactory_save";
const WORLD_SAVE_KEY = "rustyFactory_worlds";
const AUTOSAVE_FILE = "_autosave.json";

/* Detect Electron (file-based save) vs browser (localStorage) */
const isElectron = () => typeof window !== 'undefined' && window.electronFS;

function createGameState() {
    return {
        currentFactoryId: null,
        factories: {},
        settings: {
            gridSize: 40,
            gridWidth: 50,
            gridHeight: 40,
            cameraX: 0,
            cameraY: 0,
            zoom: 1,
            cameraSpeed: 8,
            zoomSpeed: 5,
            showGrid: true,
            showParticles: true,
            energySystem: true,
        },
        ui: {
            selectedBuilding: null,
            toolMode: "build",       // "build", "delete", "inspect"
            activePaletteTab: "extraction",
            showMainMenu: true,
        },
        particles: [],
        energy: {
            total: 100,
            max: 200,
            generated: 0,
            consumed: 0,
        },
        developmentStage: 0,
        stageCycles: 0,
        stageTime: 0,
        paused: false,
        keybinds: {
            moveUp: "w",
            moveLeft: "a",
            moveDown: "s",
            moveRight: "d",
            rotate: "r",
            toggle: "e",
        },
    };
}

function generateId() {
    return "factory-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
}

function generateBuildingId() {
    return "b-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
}

function createFactory(name) {
    const id = generateId();
    const factory = {
        id: id,
        name: name || "New Factory",
        buildings: {},
        resources: {},
        productionLog: [],
        energyBuffer: 0,
        createdAt: Date.now(),
    };

    const gs = gameState.settings;
    factory.grid = [];
    for (let y = 0; y < gs.gridHeight; y++) {
        factory.grid[y] = [];
        for (let x = 0; x < gs.gridWidth; x++) {
            factory.grid[y][x] = null;
        }
    }

    gameState.factories[id] = factory;
    gameState.currentFactoryId = id;
    return factory;
}

function deleteFactory(id) {
    if (gameState.factories[id]) {
        delete gameState.factories[id];
        if (gameState.currentFactoryId === id) {
            const remaining = Object.keys(gameState.factories);
            gameState.currentFactoryId = remaining.length > 0 ? remaining[0] : null;
        }
    }
}

function switchFactory(id) {
    if (gameState.factories[id]) {
        gameState.currentFactoryId = id;
    }
}

function getCurrentFactory() {
    return gameState.factories[gameState.currentFactoryId] || null;
}

function placeBuilding(type, gridX, gridY) {
    placeBuildingWithRotation(type, gridX, gridY, 0);
}

function placeBuildingWithRotation(type, gridX, gridY, rotation) {
    const factory = getCurrentFactory();
    if (!factory) return false;

    const def = BUILDING_DEFS[type];
    if (!def) return false;

    const [w, h] = def.size;

    if (gridX < 0 || gridY < 0 || gridX + w > gameState.settings.gridWidth || gridY + h > gameState.settings.gridHeight) {
        return false;
    }

    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            if (factory.grid[gridY + dy][gridX + dx] !== null) {
                return false;
            }
        }
    }

    const id = generateBuildingId();
    const building = {
        id: id,
        type: type,
        gridX: gridX,
        gridY: gridY,
        rotation: rotation,
        inputBuffer: {},
        outputBuffer: {},
        processingProgress: 0,
        isActive: false,
        connectedInputs: [],
        connectedOutputs: [],
        hasEnergyConnection: false,
        userActive: true,
        storageFilter: [], // Blood Sac: list of resources to push to output
        conveyorFilter: [], // Smart Conveyor: empty = all, otherwise only selected resources
    };

    factory.buildings[id] = building;

    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            factory.grid[gridY + dy][gridX + dx] = id;
        }
    }

    return true;
}

function removeBuilding(buildingId) {
    const factory = getCurrentFactory();
    if (!factory || !factory.buildings[buildingId]) return false;

    const building = factory.buildings[buildingId];
    const def = BUILDING_DEFS[building.type];
    const [w, h] = def.size;

    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            factory.grid[building.gridY + dy][building.gridX + dx] = null;
        }
    }

    for (const b of Object.values(factory.buildings)) {
        b.connectedInputs = b.connectedInputs.filter(id => id !== buildingId);
        b.connectedOutputs = b.connectedOutputs.filter(id => id !== buildingId);
    }

    delete factory.buildings[buildingId];
    return true;
}

/* ===== SAVE / LOAD ===== */

async function saveGame() {
    try {
        const data = {
            version: 3,
            currentFactoryId: gameState.currentFactoryId,
            factories: gameState.factories,
            settings: gameState.settings,
            energy: gameState.energy,
            developmentStage: gameState.developmentStage,
            stageCycles: gameState.stageCycles,
            stageTime: gameState.stageTime,
            keybinds: gameState.keybinds,
        };
        if (isElectron()) {
            await window.electronFS.saveWorld(AUTOSAVE_FILE, data);
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to save game:", e);
    }
}

async function saveWorld(name) {
    try {
        const factory = getCurrentFactory();
        const buildingCount = factory ? Object.keys(factory.buildings).length : 0;

        const worldData = {
            name: name,
            savedAt: Date.now(),
            stage: gameState.developmentStage,
            stageName: STAGES[gameState.developmentStage]?.name || "Unknown",
            factoryCount: Object.keys(gameState.factories).length,
            buildingCount: buildingCount,
            data: {
                currentFactoryId: gameState.currentFactoryId,
                factories: gameState.factories,
                settings: gameState.settings,
                energy: gameState.energy,
                developmentStage: gameState.developmentStage,
                stageCycles: gameState.stageCycles,
                stageTime: gameState.stageTime,
            }
        };

        if (isElectron()) {
            await window.electronFS.saveWorld(name, worldData);
        }

        // Also keep localStorage in sync
        const worlds = await getSavedWorlds();
        worlds[name] = worldData;
        localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(worlds));
    } catch (e) {
        console.warn("Failed to save world:", e);
    }
}

async function loadWorldByName(name) {
    try {
        let world = null;
        if (isElectron()) {
            const result = await window.electronFS.loadWorld(name);
            if (result.success) world = result.data;
        }
        if (!world) {
            const worlds = await getSavedWorlds();
            world = worlds[name];
        }
        if (!world) return false;

        gameState.currentFactoryId = world.data.currentFactoryId;
        gameState.factories = world.data.factories || {};
        if (world.data.settings) Object.assign(gameState.settings, world.data.settings);
        if (world.data.energy) Object.assign(gameState.energy, world.data.energy);
        if (world.data.developmentStage !== undefined) gameState.developmentStage = world.data.developmentStage;
        if (world.data.stageCycles !== undefined) gameState.stageCycles = world.data.stageCycles;
        if (world.data.stageTime !== undefined) gameState.stageTime = world.data.stageTime;
        return true;
    } catch (e) {
        console.warn("Failed to load world:", e);
        return false;
    }
}

async function getSavedWorlds() {
    if (isElectron()) {
        try {
            const files = await window.electronFS.listWorlds();
            const worlds = {};
            for (const f of files) {
                if (f.name !== AUTOSAVE_FILE && f.data && f.data.savedAt) {
                    worlds[f.name] = f.data;
                }
            }
            // Merge localStorage worlds as fallback
            try {
                const raw = localStorage.getItem(WORLD_SAVE_KEY);
                if (raw) {
                    const local = JSON.parse(raw);
                    for (const [k, v] of Object.entries(local)) {
                        if (!worlds[k]) worlds[k] = v;
                    }
                }
            } catch {}
            return worlds;
        } catch {
            return _getLocalWorlds();
        }
    }
    return _getLocalWorlds();
}

function _getLocalWorlds() {
    try {
        const raw = localStorage.getItem(WORLD_SAVE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

async function deleteWorld(name) {
    if (isElectron()) {
        await window.electronFS.deleteWorld(name);
    }
    const worlds = await getSavedWorlds();
    delete worlds[name];
    localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(worlds));
}

/**
 * Export all worlds as a downloadable JSON blob
 */
async function exportWorlds() {
    const worlds = await getSavedWorlds();
    const blob = new Blob([JSON.stringify(worlds, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blood_factory_worlds_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import worlds from a JSON file
 */
async function importWorlds(jsonString) {
    try {
        const imported = JSON.parse(jsonString);
        if (typeof imported !== "object" || imported === null || Array.isArray(imported)) {
            return { error: "Invalid file format" };
        }

        const existing = await getSavedWorlds();
        let count = 0;

        for (const [name, world] of Object.entries(imported)) {
            if (world && world.data && world.savedAt) {
                existing[name] = world;
                count++;
                if (isElectron()) {
                    await window.electronFS.saveWorld(name, world);
                }
            }
        }

        localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(existing));
        return { count };
    } catch (e) {
        return { error: "Failed to parse file: " + e.message };
    }
}

/**
 * Export a single world
 */
async function exportWorld(name) {
    const worlds = await getSavedWorlds();
    const world = worlds[name];
    if (!world) return false;

    const blob = new Blob([JSON.stringify({ [name]: world }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `world_${name.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
}

async function loadGame() {
    let data = null;

    // Try file-based autosave first (Electron)
    if (isElectron()) {
        try {
            const result = await window.electronFS.loadWorld(AUTOSAVE_FILE);
            if (result.success && result.data && result.data.version) {
                data = result.data;
            }
        } catch {}
    }

    // Fallback to localStorage
    if (!data) {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) data = JSON.parse(raw);
        } catch {}
    }

    if (!data) return false;

    // Version check
    if (!data.version || data.version < 3) {
        console.log("Old save format, ignoring");
        localStorage.removeItem(SAVE_KEY);
        return false;
    }

    try {
        gameState.currentFactoryId = data.currentFactoryId;
        gameState.factories = data.factories || {};

        if (data.settings) {
            const defaults = createGameState().settings;
            for (const key of Object.keys(defaults)) {
                if (data.settings[key] !== undefined) {
                    gameState.settings[key] = data.settings[key];
                }
            }
        }

        if (data.energy) {
            const eDefaults = createGameState().energy;
            for (const key of Object.keys(eDefaults)) {
                if (data.energy[key] !== undefined) {
                    gameState.energy[key] = data.energy[key];
                }
            }
        }

        if (data.developmentStage !== undefined) gameState.developmentStage = data.developmentStage;
        if (data.stageCycles !== undefined) gameState.stageCycles = data.stageCycles;
        if (data.stageTime !== undefined) gameState.stageTime = data.stageTime;

        if (data.keybinds) {
            const kDefaults = createGameState().keybinds;
            for (const key of Object.keys(kDefaults)) {
                if (data.keybinds[key] !== undefined) {
                    gameState.keybinds[key] = data.keybinds[key];
                }
            }
        }

        // Validate factories & migrate old buildings
        for (const factory of Object.values(gameState.factories)) {
            for (const building of Object.values(factory.buildings)) {
                const def = BUILDING_DEFS[building.type];
                if (def && def.isStorage && building.storageFilter === undefined) {
                    building.storageFilter = [];
                }
                if (def && def.isTransport && building.conveyorFilter === undefined) {
                    building.conveyorFilter = [];
                }
            }
            if (!factory.grid) {
                const gs = gameState.settings;
                factory.grid = [];
                for (let y = 0; y < gs.gridHeight; y++) {
                    factory.grid[y] = [];
                    for (let x = 0; x < gs.gridWidth; x++) {
                        factory.grid[y][x] = null;
                    }
                }
                for (const building of Object.values(factory.buildings)) {
                    const bDef = BUILDING_DEFS[building.type];
                    const [w, h] = bDef.size;
                    for (let dy = 0; dy < h; dy++) {
                        for (let dx = 0; dx < w; dx++) {
                            factory.grid[building.gridY + dy][building.gridX + dx] = building.id;
                        }
                    }
                }
            }
        }

        if (gameState.currentFactoryId && !gameState.factories[gameState.currentFactoryId]) {
            gameState.currentFactoryId = null;
        }

        return true;
    } catch (e) {
        console.warn("Failed to load game:", e);
        localStorage.removeItem(SAVE_KEY);
        return false;
    }
}

function autoSave() {
    saveGame();
    setTimeout(autoSave, 30000);
}

/* ===== DEVELOPMENT STAGE ===== */

function isStageUnlocked(type) {
    const def = BUILDING_DEFS[type];
    if (!def) return false;
    return def.unlockStage <= gameState.developmentStage;
}

function advanceStage() {
    const current = gameState.developmentStage;
    if (current >= STAGES.length - 1) return false; // Already at max

    const next = STAGES[current + 1];
    if (!next) return false;

    // Check production requirements — count ONLY resources in Blood Sac storage
    if (next.requiredProduction && Object.keys(next.requiredProduction).length > 0) {
        const factory = getCurrentFactory();
        if (!factory) return false;

        // Count resources stored in Blood Sac buildings only
        const totals = {};
        for (const building of Object.values(factory.buildings)) {
            const def = BUILDING_DEFS[building.type];
            if (def && def.isStorage) {
                for (const [res, amt] of Object.entries(building.inputBuffer)) {
                    totals[res] = (totals[res] || 0) + (amt || 0);
                }
                for (const [res, amt] of Object.entries(building.outputBuffer)) {
                    totals[res] = (totals[res] || 0) + (amt || 0);
                }
            }
        }

        // Check if all requirements are met
        for (const [res, needed] of Object.entries(next.requiredProduction)) {
            if ((totals[res] || 0) < needed) {
                return false; // Not enough of this resource in storage
            }
        }
    }

    // Also require cycle/time thresholds
    if (gameState.stageCycles >= next.cycleThreshold && gameState.stageTime >= next.timeThreshold) {
        gameState.developmentStage = current + 1;

        // Celebration particles
        const gs = gameState.settings;
        for (let i = 0; i < 30; i++) {
            gameState.particles.push({
                type: "spark",
                x: gs.gridWidth * gs.gridSize / 2 + (Math.random() - 0.5) * 200,
                y: gs.gridHeight * gs.gridSize / 2 + (Math.random() - 0.5) * 200,
                vx: (Math.random() - 0.5) * 6,
                vy: -2 - Math.random() * 4,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.01,
                size: 2 + Math.random() * 4,
                color: ["#ff6060", "#ffaa00", "#ff3030", "#ffcc00"][Math.floor(Math.random() * 4)],
            });
        }

        // Show stage cinematic
        if (typeof showStageCinematic === "function") {
            showStageCinematic(gameState.developmentStage);
        }
        sfxStageAdvance();

        // Show all unlocked buildings in one combined modal
        if (typeof showStageUnlockModal === "function") {
            const unlocked = [];
            for (const [type, def] of Object.entries(BUILDING_DEFS)) {
                if (def.unlockStage === gameState.developmentStage) {
                    unlocked.push(type);
                }
            }
            if (unlocked.length > 0) {
                setTimeout(() => showStageUnlockModal(unlocked), 500);
            }
        }

        return true;
    }
    return false;
}

function checkStageAdvance() {
    while (advanceStage()) {
        // Keep advancing if multiple thresholds met
    }
}

function getStageProgress() {
    const current = gameState.developmentStage;
    if (current >= STAGES.length - 1) return 1.0;

    const next = STAGES[current + 1];
    const cycleProgress = Math.min(1, gameState.stageCycles / next.cycleThreshold);
    const timeProgress = Math.min(1, gameState.stageTime / next.timeThreshold);

    // Production requirement progress
    let prodProgress = 1.0;
    if (next.requiredProduction && Object.keys(next.requiredProduction).length > 0) {
        const factory = getCurrentFactory();
        if (factory) {
            // Count resources stored in Blood Sac buildings only
            const totals = {};
            for (const building of Object.values(factory.buildings)) {
                const def = BUILDING_DEFS[building.type];
                if (def && def.isStorage) {
                    for (const [res, amt] of Object.entries(building.inputBuffer)) {
                        totals[res] = (totals[res] || 0) + (amt || 0);
                    }
                    for (const [res, amt] of Object.entries(building.outputBuffer)) {
                        totals[res] = (totals[res] || 0) + (amt || 0);
                    }
                }
            }
            const reqValues = Object.values(next.requiredProduction);
            const reqKeys = Object.keys(next.requiredProduction);
            let totalPct = 0;
            for (let i = 0; i < reqKeys.length; i++) {
                const res = reqKeys[i];
                const needed = reqValues[i];
                totalPct += Math.min(1, (totals[res] || 0) / needed);
            }
            prodProgress = totalPct / reqKeys.length;
        }
    }

    return (cycleProgress + timeProgress + prodProgress) / 3;
}

/* ===== PRODUCTION LOGIC ===== */

const PRODUCTION_TICK = 0.1;
let productionAccumulator = 0;

function updateProduction(dt) {
    productionAccumulator += dt;
    if (productionAccumulator < PRODUCTION_TICK) return;
    productionAccumulator -= PRODUCTION_TICK;

    // Track stage time
    gameState.stageTime += PRODUCTION_TICK;

    const factory = getCurrentFactory();
    if (!factory) return;

    // Update storage first: receive from inputs, filter, push to outputBuffer
    for (const building of Object.values(factory.buildings)) {
        const def = BUILDING_DEFS[building.type];
        if (def.isStorage) updateStorage(building, factory);
    }

    // Then update conveyors: pull from sources (including storage outputBuffer)
    for (const building of Object.values(factory.buildings)) {
        const def = BUILDING_DEFS[building.type];
        if (def.isTransport) updateConveyor(building, factory);
    }

    // Process buildings
    for (const building of Object.values(factory.buildings)) {
        const def = BUILDING_DEFS[building.type];
        if (def.isTransport || def.isStorage) continue;

        // Energy check
        if (gameState.settings.energySystem && def.energyCost > 0) {
            if (!hasEnoughEnergy(factory, def.energyCost)) {
                building.isActive = false;
                continue;
            }
        }

        // User toggle check
        if (!building.userActive) {
            building.isActive = false;
            continue;
        }

        // Miner/auto-producer auto-produces (no input needed)
        if (!def.consumes || Object.keys(def.consumes).length === 0) {
            building.processingProgress += PRODUCTION_TICK / def.producesInterval;
            building.isActive = true;

            if (building.processingProgress >= 1.0) {
                for (const [resource, amount] of Object.entries(def.produces)) {
                    building.outputBuffer[resource] = (building.outputBuffer[resource] || 0) + amount;
                    logProduction(factory, resource, amount, building.type);
                }
                gameState.stageCycles++;
                sfxProductionComplete();
                building.processingProgress = 0;

                // Consume energy
                if (gameState.settings.energySystem && def.energyCost > 0) {
                    consumeEnergy(factory, def.energyCost);
                }

                spawnSmoke(building);
                spawnSparks(building);
            }
            continue;
        }

        // Check inputs
        if (!hasEnoughInputs(building, def)) {
            building.isActive = false;
            building.processingProgress = Math.max(0, building.processingProgress - 0.01);
            continue;
        }

        building.isActive = true;
        building.processingProgress += PRODUCTION_TICK / def.producesInterval;

        if (building.processingProgress >= 1.0) {
            // Consume inputs
            for (const [resource, amount] of Object.entries(def.consumes || {})) {
                building.inputBuffer[resource] = Math.max(0, (building.inputBuffer[resource] || 0) - amount);
            }

            // Consume energy
            if (gameState.settings.energySystem && def.energyCost > 0) {
                consumeEnergy(factory, def.energyCost);
            }

            // Produce outputs
            for (const [resource, amount] of Object.entries(def.produces)) {
                building.outputBuffer[resource] = (building.outputBuffer[resource] || 0) + amount;
                logProduction(factory, resource, amount, building.type);
            }
            gameState.stageCycles++;

            // Generate energy if furnace
            if (def.generatesEnergy) {
                gameState.energy.total = Math.min(gameState.energy.max, gameState.energy.total + def.energyGenerated);
                gameState.energy.generated += def.energyGenerated;
            }

            building.processingProgress = 0;

            if (building.type === "smelter" || building.type === "furnace" || building.type === "copper_smelter") {
                spawnSmoke(building);
                spawnSparks(building);
            }
        }
    }

    // Check if we've advanced to the next development stage
    checkStageAdvance();
}

function hasEnoughEnergy(factory, cost) {
    return gameState.energy.total >= cost;
}

function consumeEnergy(factory, cost) {
    gameState.energy.total = Math.max(0, gameState.energy.total - cost);
    gameState.energy.consumed += cost;
}

function hasEnoughInputs(building, def) {
    if (!def.consumes) return true;
    for (const [resource, amount] of Object.entries(def.consumes)) {
        if ((building.inputBuffer[resource] || 0) < amount) return false;
    }
    return true;
}

function updateConveyor(building, factory) {
    const def = BUILDING_DEFS[building.type];

    // Pull resources from connected inputs' outputBuffer
    for (const sourceId of building.connectedInputs) {
        const source = factory.buildings[sourceId];
        if (!source) continue;

        for (const resource of Object.keys(source.outputBuffer)) {
            if ((source.outputBuffer[resource] || 0) <= 0) continue;

            // Smart Conveyor: check filter
            if (def.isSmartConveyor) {
                const filter = building.conveyorFilter || [];
                if (filter.length > 0 && !filter.includes(resource)) continue; // Skip filtered-out resources
            }

            // Capacity check for storage buildings
            if (def.isStorage && getTotalStorageAmount(building) >= def.capacity) continue;

            source.outputBuffer[resource] -= 1;
            building.inputBuffer[resource] = (building.inputBuffer[resource] || 0) + 1;

            // Count storage cycles for stage progression
            if (def.isStorage) {
                gameState.stageCycles++;
            }
        }
    }

    // Push resources from inputBuffer to connected outputs
    for (const resource of Object.keys(building.inputBuffer)) {
        let remaining = building.inputBuffer[resource];
        if (remaining <= 0) continue;

        // Collect destinations
        const destinations = [];
        for (const destId of building.connectedOutputs) {
            const dest = factory.buildings[destId];
            if (!dest) continue;
            // Storage conveyors don't push to other conveyors (they pull themselves)
            // Regular conveyors push to everything
            if (def.isStorage) {
                const destDef = BUILDING_DEFS[dest.type];
                if (destDef && destDef.isTransport) continue;
            }
            destinations.push(dest);
        }

        if (destinations.length === 0) continue;

        // Round-robin distribute
        const perDest = Math.ceil(remaining / destinations.length);
        for (const dest of destinations) {
            if (remaining <= 0) break;
            const amount = Math.min(perDest, remaining);
            dest.inputBuffer[resource] = (dest.inputBuffer[resource] || 0) + amount;
            building.inputBuffer[resource] -= amount;
            remaining -= amount;
        }
    }
}

function updateStorage(building, factory) {
    const def = BUILDING_DEFS[building.type];
    if (!def.isStorage) return;

    // Step 1: Receive resources from connected inputs (like conveyor)
    for (const sourceId of building.connectedInputs) {
        const source = factory.buildings[sourceId];
        if (!source) continue;

        for (const resource of Object.keys(source.outputBuffer)) {
            if ((source.outputBuffer[resource] || 0) <= 0) continue;

            // Check storage capacity
            const totalInStorage = getTotalStorageAmount(building);
            if (totalInStorage >= def.capacity) continue;

            source.outputBuffer[resource] -= 1;
            building.inputBuffer[resource] = (building.inputBuffer[resource] || 0) + 1;
        }
    }

    // Step 2: Move resources from inputBuffer to outputBuffer based on filter
    const filter = building.storageFilter || [];
    for (const resource of Object.keys(building.inputBuffer)) {
        if ((building.inputBuffer[resource] || 0) <= 0) continue;
        // If no filter set (empty array), push everything; otherwise only push filtered resources
        if (filter.length === 0 || filter.includes(resource)) {
            building.outputBuffer[resource] = (building.outputBuffer[resource] || 0) + building.inputBuffer[resource];
            building.inputBuffer[resource] = 0;
        }
    }

    // Step 3: Push resources from outputBuffer to connected outputs
    // Only push to NON-conveyor buildings. Conveyors pull from sac's outputBuffer themselves.
    for (const resource of Object.keys(building.outputBuffer)) {
        let remaining = building.outputBuffer[resource];
        if (remaining <= 0) continue;

        // Collect valid non-conveyor destinations
        const destinations = [];
        for (const destId of building.connectedOutputs) {
            const dest = factory.buildings[destId];
            if (!dest) continue;
            const destDef = BUILDING_DEFS[dest.type];
            if (destDef && !destDef.isTransport) {
                destinations.push(dest);
            }
        }

        // If only conveyors are connected, leave resources in outputBuffer for them to pull
        if (destinations.length === 0) continue;

        // Round-robin distribute
        const perDest = Math.ceil(remaining / destinations.length);
        for (const dest of destinations) {
            if (remaining <= 0) break;
            const amount = Math.min(perDest, remaining);
            dest.inputBuffer[resource] = (dest.inputBuffer[resource] || 0) + amount;
            building.outputBuffer[resource] -= amount;
            remaining -= amount;
        }
    }
}

function getTotalStorageAmount(building) {
    let total = 0;
    for (const amt of Object.values(building.inputBuffer)) {
        total += amt || 0;
    }
    for (const amt of Object.values(building.outputBuffer)) {
        total += amt || 0;
    }
    return total;
}

function logProduction(factory, resource, amount, buildingType) {
    factory.productionLog.push({ timestamp: Date.now(), resource, amount, building: buildingType });
    if (factory.productionLog.length > 500) factory.productionLog = factory.productionLog.slice(-200);
}

/* ===== PARTICLES ===== */

function spawnSmoke(building) {
    if (Math.random() > 0.4 || !gameState.settings.showParticles) return;

    const gs = gameState.settings;
    const def = BUILDING_DEFS[building.type];
    gameState.particles.push({
        type: "spore",
        x: building.gridX * gs.gridSize + def.size[0] * gs.gridSize * 0.6,
        y: building.gridY * gs.gridSize,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.5,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.008,
        size: 2 + Math.random() * 3,
    });
}

function spawnSparks(building) {
    if (Math.random() > 0.3 || !gameState.settings.showParticles) return;

    const gs = gameState.settings;
    const def = BUILDING_DEFS[building.type];
    for (let i = 0; i < 2; i++) {
        gameState.particles.push({
            type: "spark",
            x: building.gridX * gs.gridSize + Math.random() * def.size[0] * gs.gridSize,
            y: building.gridY * gs.gridSize + Math.random() * def.size[1] * gs.gridSize,
            vx: (Math.random() - 0.3) * 3,
            vy: -1 - Math.random() * 2,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.02,
            size: 1 + Math.random() * 2,
            color: Math.random() > 0.5 ? "#ffaa00" : "#ff6600",
        });
    }
}

function updateParticles(dt) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.type === "smoke" || p.type === "spore") { p.size += 0.03; p.vx *= 0.99; }
        if (p.type === "spark") { p.vy += 0.1; }

        if (p.life <= 0) gameState.particles.splice(i, 1);
    }

    if (gameState.particles.length > 500) gameState.particles = gameState.particles.slice(-500);
}
