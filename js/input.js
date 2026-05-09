/* ===== INPUT HANDLING ===== */

const keysDown = {};
let previewRotation = 0;

function initInput() {
    const canvas = document.getElementById("game-canvas");

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("contextmenu", onRightClick);
    canvas.addEventListener("wheel", onWheel);
    canvas.addEventListener("dblclick", onDblClick);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // Init audio on first user gesture (Web Audio requirement)
    const unlockAudio = () => { initAudio(); startBackgroundHum(); };
    canvas.addEventListener("mousedown", unlockAudio, { once: true });
}

function screenToWorld(sx, sy) {
    const gs = gameState.settings;
    return { x: (sx - gs.cameraX) / gs.zoom, y: (sy - gs.cameraY) / gs.zoom };
}

function screenToGrid(sx, sy) {
    const gs = gameState.settings;
    const world = screenToWorld(sx, sy);
    return { x: Math.floor(world.x / gs.gridSize), y: Math.floor(world.y / gs.gridSize) };
}

let isMiddleDragging = false;

function onMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const gs = gameState.settings;
    mouseWorldX = (sx - gs.cameraX) / gs.zoom;
    mouseWorldY = (sy - gs.cameraY) / gs.zoom;

    if (e.buttons === 4 || isMiddleDragging) {
        gs.cameraX += e.movementX;
        gs.cameraY += e.movementY;
        return;
    }

    const grid = screenToGrid(sx, sy);
    hoverGridX = grid.x;
    hoverGridY = grid.y;

    // Inspect mode: show tooltip on hover
    if (gameState.ui.toolMode === "inspect") {
        updateTooltip(grid.x, grid.y, e.clientX, e.clientY);
    } else {
        document.getElementById("tooltip").style.display = "none";
    }
}

function onMouseDown(e) {
    if (e.button === 1) { isMiddleDragging = true; e.preventDefault(); return; }
    if (e.button !== 0) return;

    const rect = e.target.getBoundingClientRect();
    const grid = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);

    // Shift+click: connect buildings
    if (e.shiftKey) {
        handleConnectClick(grid.x, grid.y);
        return;
    }

    handleGridClick(grid.x, grid.y, false);
}

function onRightClick(e) {
    e.preventDefault();

    const rect = e.target.getBoundingClientRect();
    const grid = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);

    const factory = getCurrentFactory();
    if (!factory) return;

    const bid = factory.grid[grid.y]?.[grid.x];

    // Shift+right-click: connect buildings (output of clicked to input of previous)
    if (e.shiftKey) {
        handleConnectClick(grid.x, grid.y);
        return;
    }

    // Right-click shows inspect info
    if (bid) {
        showInspectModal(grid.x, grid.y);
    }
}

function onWheel(e) {
    e.preventDefault();
    const gs = gameState.settings;
    const zoomFactor = e.deltaY < 0 ? 1 + (gs.zoomSpeed * 0.02) : 1 - (gs.zoomSpeed * 0.02);
    const newZoom = Math.max(0.3, Math.min(3, gs.zoom * zoomFactor));

    const rect = e.target.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    gs.cameraX = mx - (mx - gs.cameraX) * (newZoom / gs.zoom);
    gs.cameraY = my - (my - gs.cameraY) * (newZoom / gs.zoom);
    gs.zoom = newZoom;
}

function onDblClick(e) {
    const rect = e.target.getBoundingClientRect();
    const grid = screenToGrid(e.clientX - rect.left, e.clientY - rect.top);

    const factory = getCurrentFactory();
    if (!factory) return;

    const bid = factory.grid[grid.y]?.[grid.x];
    if (bid) {
        const building = factory.buildings[bid];
        if (building) building.rotation = (building.rotation + 1) % 4;
    }
}

function onMouseUp(e) {
    if (e.button === 1) isMiddleDragging = false;
}

function onMouseLeave() {
    hoverGridX = null; hoverGridY = null;
    isMiddleDragging = false;
    document.getElementById("tooltip").style.display = "none";
}

function onKeyDown(e) {
    keysDown[e.key.toLowerCase()] = true;

    const factory = getCurrentFactory();

    switch (e.key) {
        case "1": setToolMode("build"); break;
        case "2": setToolMode("delete"); break;
        case "3": setToolMode("inspect"); break;
        case "r":
        case "R":
            doRotate();
            break;
        case "Delete":
        case "Backspace":
            if (factory && hoverGridX !== null && hoverGridY !== null) {
                const bid = factory.grid[hoverGridY]?.[hoverGridX];
                if (bid) { removeBuilding(bid); updateUI(); }
            }
            break;
        case "Escape":
            // Toggle pause if game is active
            if (!gameState.ui.showMainMenu) {
                gameState.paused = !gameState.paused;
                const pauseOverlay = document.getElementById("pause-overlay");
                if (gameState.paused) {
                    pauseOverlay.classList.remove("hidden");
                } else {
                    pauseOverlay.classList.add("hidden");
                }
            } else {
                gameState.ui.selectedBuilding = null;
                connectingFrom = null;
                hideInspectModal();
            }
            updateUI();
            break;
    }

    // Toggle machine on/off (E key)
    const toggleKey = gameState.keybinds.toggle;
    if (toggleKey && (e.key === toggleKey || e.key === toggleKey.toUpperCase() || e.key === toggleKey.toLowerCase())) {
        if (factory && hoverGridX !== null && hoverGridY !== null && !gameState.paused) {
            const bid = factory.grid[hoverGridY]?.[hoverGridX];
            if (bid) {
                const building = factory.buildings[bid];
                if (building) {
                    building.userActive = !building.userActive;
                    const state = building.userActive ? "Machine ON" : "Machine OFF";
                    showToast(state);
                }
            }
        }
    }

    // Number keys for buildings within active tab
    if (factory && gameState.ui.toolMode === "build") {
        const tab = gameState.ui.activePaletteTab;
        const buildingsInTab = Object.entries(BUILDING_DEFS).filter(([, d]) => d.category === tab);
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && num <= buildingsInTab.length) {
            gameState.ui.selectedBuilding = buildingsInTab[num - 1][0];
            updateUI();
        }
    }

    if (e.key === "s" && e.ctrlKey) { e.preventDefault(); saveGame(); }

    // Toggle building details overlay (V key)
    if (e.key === "v" || e.key === "V") {
        showBuildingDetails = !showBuildingDetails;
        const cb = document.getElementById("setting-show-details");
        if (cb) cb.checked = showBuildingDetails;
        showToast(showBuildingDetails ? "Building details: ON" : "Building details: OFF");
    }
    if (e.key === "m" || e.key === "M") {
        initAudio();
        const on = toggleSound();
        const cb = document.getElementById("setting-sound-enabled");
        if (cb) cb.checked = on;
        showToast(on ? "Sound: ON" : "Sound: MUTED");
    }
}

function onKeyUp(e) {
    keysDown[e.key.toLowerCase()] = false;
}

function handleGridClick(gridX, gridY, isRightClick) {
    const factory = getCurrentFactory();
    if (!factory) return;

    const mode = gameState.ui.toolMode;

    if (mode === "build") {
        if (gameState.ui.selectedBuilding) {
            if (canPlaceBuilding(gameState.ui.selectedBuilding, gridX, gridY)) {
                placeBuildingWithRotation(gameState.ui.selectedBuilding, gridX, gridY, previewRotation);
                sfxPlaceBuilding();
                previewRotation = 0;
                updateUI();
            }
        }
    } else if (mode === "delete") {
        const bid = factory.grid[gridY]?.[gridX];
        if (bid) {
            removeBuilding(bid);
            sfxDeleteBuilding();
            updateUI();
        }
    } else if (mode === "inspect") {
        showInspectModal(gridX, gridY);
    }
}

/* ===== CONNECTION SYSTEM (Shift+Click) ===== */

function handleConnectClick(gridX, gridY) {
    const factory = getCurrentFactory();
    if (!factory) return;

    const bid = factory.grid[gridY]?.[gridX];
    if (!bid) {
        connectingFrom = null; // Cancel connection
        return;
    }

    if (connectingFrom === bid) {
        connectingFrom = null; // Cancel connection
    } else if (connectingFrom) {
        // Complete connection: from -> to
        const from = factory.buildings[connectingFrom];
        const to = factory.buildings[bid];
        if (from && to && from.id !== to.id) {
            // Avoid duplicate connections
            if (!from.connectedOutputs.includes(bid)) {
                from.connectedOutputs.push(bid);
            }
            if (!to.connectedInputs.includes(connectingFrom)) {
                to.connectedInputs.push(connectingFrom);
            }
            sfxConnect();
        }
        connectingFrom = null;
    } else {
        connectingFrom = bid; // Start connection
    }
}

function setToolMode(mode) {
    gameState.ui.toolMode = mode;
    if (mode !== "build") gameState.ui.selectedBuilding = null;
    connectingFrom = null;
    updateUI();
}

function showInspectModal(gridX, gridY) {
    const factory = getCurrentFactory();
    if (!factory || gridX < 0 || gridY < 0) return;

    const bid = factory.grid[gridY]?.[gridX];
    if (!bid) return;

    const building = factory.buildings[bid];
    if (!building) return;

    const def = BUILDING_DEFS[building.type];
    const modal = document.getElementById("inspect-modal");
    const title = document.getElementById("inspect-title");
    const details = document.getElementById("inspect-details");

    title.textContent = `${def.name} (${def.nameEn})`;

    let html = "";

    // Info section
    html += `<div class="detail-section">`;
    html += `<div><span class="detail-label">Type:</span> ${CATEGORY_INFO[def.category]?.name || def.category}</div>`;
    html += `<div><span class="detail-label">Size:</span> ${def.size[0]}x${def.size[1]}</div>`;
    html += `<div><span class="detail-label">Position:</span> (${building.gridX}, ${building.gridY})</div>`;
    html += `</div>`;

    // Description
    html += `<div class="detail-section">`;
    html += `<div><span class="detail-label">Description:</span> ${def.description}</div>`;
    html += `</div>`;

    // Energy
    if (def.energyCost > 0) {
        html += `<div class="detail-section">`;
        html += `<div><span class="detail-label">Energy Cost:</span> ${def.energyCost} units/cycle</div>`;
        if (def.generatesEnergy) {
            html += `<div><span class="detail-label">Energy Produced:</span> +${def.energyGenerated} units/cycle</div>`;
        }
        html += `<div><span class="detail-label">Enough Energy:</span> ${hasEnoughEnergy(factory, def.energyCost) ? "Yes" : "No"}</div>`;
        html += `</div>`;
    }

    // Inputs
    if (def.consumes && Object.keys(def.consumes).length > 0) {
        html += `<div class="detail-section"><div><span class="detail-label">Required Inputs:</span></div>`;
        for (const [res, amt] of Object.entries(def.consumes)) {
            const inBuf = building.inputBuffer[res] || 0;
            const color = inBuf >= amt ? "#60c060" : "#c06060";
            html += `<div style="color:${color};margin-left:12px;">${RESOURCE_TYPES[res]?.name || res}: needs ${amt} | has ${Math.floor(inBuf)}</div>`;
        }
        html += `</div>`;
    }

    // Outputs
    if (def.produces && Object.keys(def.produces).length > 0) {
        html += `<div class="detail-section"><div><span class="detail-label">Produces:</span></div>`;
        for (const [res, amt] of Object.entries(def.produces)) {
            html += `<div style="margin-left:12px;">${RESOURCE_TYPES[res]?.name || res}: ${amt}/cycle</div>`;
        }
        html += `</div>`;
    }

    // Buffers
    html += `<div class="detail-section">`;
    html += `<div><span class="detail-label">Input Buffer:</span> ${JSON.stringify(building.inputBuffer) || "empty"}</div>`;
    html += `<div><span class="detail-label">Output Buffer:</span> ${JSON.stringify(building.outputBuffer) || "empty"}</div>`;
    html += `</div>`;

    // Status
    html += `<div class="detail-section">`;
    html += `<div><span class="detail-label">Status:</span> ${building.isActive ? "Working" : "Idle"}</div>`;
    html += `<div><span class="detail-label">Progress:</span> ${Math.round(building.processingProgress * 100)}%</div>`;
    if (def.energyCost > 0) {
        const toggleState = building.userActive ? "ON" : "OFF";
        html += `<div><span class="detail-label">Machine:</span> ${toggleState}</div>`;
    }
    html += `</div>`;

    // Connections
    html += `<div class="detail-section">`;
    html += `<div><span class="detail-label">Input connections:</span> ${building.connectedInputs.length > 0 ? building.connectedInputs.join(", ") : "none"}</div>`;
    html += `<div><span class="detail-label">Output connections:</span> ${building.connectedOutputs.length > 0 ? building.connectedOutputs.join(", ") : "none"}</div>`;
    html += `</div>`;

    // Storage filter UI for Blood Sac
    if (def.isStorage) {
        const totalStored = getTotalStorageAmount(building);
        html += `<div class="detail-section">`;
        html += `<div><span class="detail-label">Blood Sac:</span> ${Math.floor(totalStored)} / ${def.capacity}</div>`;
        html += `<div style="margin-top:4px;"><span class="detail-label">Stored:</span></div>`;
        for (const [res, amt] of Object.entries(building.inputBuffer)) {
            if (amt > 0) {
                const color = RESOURCE_TYPES[res]?.color || "#aaa";
                html += `<div style="color:${color};margin-left:12px;">${RESOURCE_TYPES[res]?.name || res}: ${Math.floor(amt)}</div>`;
            }
        }
        if (Object.values(building.inputBuffer).every(a => !a || a <= 0)) {
            html += `<div style="margin-left:12px;color:#6a5a4a;">empty</div>`;
        }
        html += `<div style="margin-top:6px;"><span class="detail-label">Filter:</span> <span style="color:#a08060;font-size:11px;">(click to toggle output)</span></div>`;
        html += `<div style="margin-left:12px; margin-top:4px;">`;
        const allActive = (building.storageFilter || []).length === 0;
        html += `<button class="storage-filter-btn ${allActive ? 'active' : ''}" onclick="toggleStorageFilter('${building.id}', null)">All</button>`;
        const storedResources = new Set([...Object.keys(building.inputBuffer), ...Object.keys(building.outputBuffer)]);
        for (const [res, info] of Object.entries(RESOURCE_TYPES)) {
            if (storedResources.has(res) || allActive) {
                const filter = building.storageFilter || [];
                const isActive = filter.length === 0 || filter.includes(res);
                html += `<button class="storage-filter-btn ${isActive ? 'active' : ''}" onclick="toggleStorageFilter('${building.id}', '${res}')">${info.name}</button>`;
            }
        }
        html += `</div></div>`;
    }

    // Smart Conveyor filter UI
    if (def.isSmartConveyor) {
        html += `<div class="detail-section">`;
        html += `<div><span class="detail-label">Smart Conveyor Filter:</span> <span style="color:#a08060;font-size:11px;">(click to select which resources to transport)</span></div>`;
        html += `<div style="margin-left:12px; margin-top:6px;">`;
        const filter = building.conveyorFilter || [];
        const allActive = filter.length === 0;
        html += `<button class="storage-filter-btn ${allActive ? 'active' : ''}" onclick="toggleConveyorFilter('${building.id}', null)">All</button>`;
        for (const [res, info] of Object.entries(RESOURCE_TYPES)) {
            const isActive = allActive || filter.includes(res);
            html += `<button class="storage-filter-btn ${isActive ? 'active' : ''}" onclick="toggleConveyorFilter('${building.id}', '${res}')">${info.name}</button>`;
        }
        html += `</div></div>`;
    }

    details.innerHTML = html;
    modal.classList.remove("hidden");
}

function hideInspectModal() {
    document.getElementById("inspect-modal").classList.add("hidden");
}

window.toggleStorageFilter = function(buildingId, resource) {
    const factory = getCurrentFactory();
    if (!factory || !factory.buildings[buildingId]) return;
    const building = factory.buildings[buildingId];

    if (resource === null) {
        building.storageFilter = [];
    } else {
        const filter = building.storageFilter || [];
        if (filter.length === 0) {
            building.storageFilter = [resource];
        } else if (filter.includes(resource)) {
            building.storageFilter = filter.filter(r => r !== resource);
            if (building.storageFilter.length === 0) {
                building.storageFilter = [];
            }
        } else {
            building.storageFilter.push(resource);
        }
    }
    if (hoverGridX !== null && hoverGridY !== null) {
        showInspectModal(hoverGridX, hoverGridY);
    }
};

window.toggleConveyorFilter = function(buildingId, resource) {
    const factory = getCurrentFactory();
    if (!factory || !factory.buildings[buildingId]) return;
    const building = factory.buildings[buildingId];

    if (resource === null) {
        building.conveyorFilter = [];
    } else {
        const filter = building.conveyorFilter || [];
        if (filter.length === 0) {
            building.conveyorFilter = [resource];
        } else if (filter.includes(resource)) {
            building.conveyorFilter = filter.filter(r => r !== resource);
            if (building.conveyorFilter.length === 0) {
                building.conveyorFilter = [];
            }
        } else {
            building.conveyorFilter.push(resource);
        }
    }
    if (hoverGridX !== null && hoverGridY !== null) {
        showInspectModal(hoverGridX, hoverGridY);
    }
};

function updateTooltip(gridX, gridY, screenX, screenY) {
    const tooltip = document.getElementById("tooltip");
    const factory = getCurrentFactory();

    if (!factory || gridX < 0 || gridY < 0) { tooltip.style.display = "none"; return; }

    const bid = factory.grid[gridY]?.[gridX];
    if (!bid || !factory.buildings[bid]) { tooltip.style.display = "none"; return; }

    const building = factory.buildings[bid];
    const def = BUILDING_DEFS[building.type];

    let html = `<strong style="color:#a0522d">${def.name}</strong><br>`;
    html += `<span style="color:#8a7a6a">${def.description}</span><br>`;

    if (building.isActive) html += `<br><span style="color:#ff8800">Working (${Math.round(building.processingProgress * 100)}%)</span>`;
    else html += `<br><span style="color:#808080">Idle</span>`;

    if (gameState.settings.energySystem && def.energyCost > 0) {
        const hasEnergy = hasEnoughEnergy(factory, def.energyCost);
        html += `<br><span style="color:${hasEnergy ? '#00cc00' : '#cc0000'}">Energy: ${hasEnergy ? 'Sufficient' : 'Insufficient'}</span>`;
    }

    tooltip.innerHTML = html;
    tooltip.style.display = "block";
    tooltip.style.left = (screenX + 15) + "px";
    tooltip.style.top = (screenY - 10) + "px";
}

/* ===== WASD Camera Update (called from game loop) ===== */

function updateCamera(dt) {
    const gs = gameState.settings;
    const speed = gs.cameraSpeed * gs.gridSize * dt;
    const kb = gameState.keybinds;

    if (keysDown[kb.moveUp] || keysDown["arrowup"]) gs.cameraY += speed;
    if (keysDown[kb.moveDown] || keysDown["arrowdown"]) gs.cameraY -= speed;
    if (keysDown[kb.moveLeft] || keysDown["arrowleft"]) gs.cameraX += speed;
    if (keysDown[kb.moveRight] || keysDown["arrowright"]) gs.cameraX -= speed;
}

function doRotate() {
    const factory = getCurrentFactory();
    // If a building is selected for placement, rotate preview
    if (gameState.ui.selectedBuilding) {
        previewRotation = (previewRotation + 1) % 4;
    } else if (factory && hoverGridX !== null && hoverGridY !== null) {
        const bid = factory.grid[hoverGridY]?.[hoverGridX];
        if (bid) {
            const building = factory.buildings[bid];
            if (building) {
                building.rotation = (building.rotation + 1) % 4;
            }
        }
    }
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toggle-notification";
    toast.textContent = message;
    document.getElementById("game-screen").appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
