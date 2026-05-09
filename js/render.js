/* ===== CANVAS RENDERING — GORE THEME WITH ANIMATIONS ===== */

let canvas, ctx;
let bloodPools = [];
let goreVeins = [];

const DIR_NAMES = ["Up", "Right", "Down", "Left"];
const DIR_ARROWS = ["↑", "→", "↓", "←"];
const DIR_VECTORS = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
];

function initRender() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");

    const gs = gameState.settings;
    for (let i = 0; i < 12; i++) {
        bloodPools.push({ x: Math.random() * gs.gridWidth * gs.gridSize, y: Math.random() * gs.gridHeight * gs.gridSize, s: 0.5 + Math.random() * 1.5 });
    }
    for (let i = 0; i < 10; i++) {
        const startX = Math.random() * gs.gridWidth * gs.gridSize;
        const startY = Math.random() * gs.gridHeight * gs.gridSize;
        const points = [{ x: startX, y: startY }];
        let cx = startX, cy = startY;
        for (let j = 0; j < 12; j++) {
            cx += (Math.random() - 0.5) * 50;
            cy += (Math.random() - 0.5) * 50;
            points.push({ x: cx, y: cy });
        }
        goreVeins.push(points);
    }
}

function resizeCanvas() {
    if (!canvas || !canvas.clientWidth) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

window.addEventListener("resize", resizeCanvas);

function render(time) {
    if (!ctx) return;

    const gs = gameState.settings;
    const baseCell = gs.gridSize;
    const cellSize = baseCell * gs.zoom;
    const worldW = gs.gridWidth * cellSize;
    const worldH = gs.gridHeight * cellSize;

    ctx.fillStyle = "#0a0202";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(gs.cameraX, gs.cameraY);
    ctx.scale(gs.zoom, gs.zoom);

    // Stage-specific background
    const stageBg = textureCache.get(`stage_bg_${gameState.developmentStage}`);
    if (stageBg) {
        for (let ty = -1; ty < Math.ceil(gs.gridHeight * baseCell / stageBg.height) + 1; ty++) {
            for (let tx = -1; tx < Math.ceil(gs.gridWidth * baseCell / stageBg.width) + 1; tx++) {
                ctx.drawImage(stageBg, tx * stageBg.width, ty * stageBg.height);
            }
        }
    }

    // Gore veins (only for stages 0-2)
    if (gameState.developmentStage <= 2) {
    ctx.globalAlpha = 0.2;
    for (const vein of goreVeins) {
        ctx.strokeStyle = `rgb(${100 + Math.random() * 40}, ${10 + Math.random() * 15}, ${10 + Math.random() * 10})`;
        ctx.lineWidth = 2 + Math.random() * 3;
        ctx.beginPath();
        ctx.moveTo(vein[0].x, vein[0].y);
        for (let i = 1; i < vein.length; i++) {
            ctx.quadraticCurveTo(vein[i - 1].x + (Math.random() - 0.5) * 15, vein[i - 1].y + (Math.random() - 0.5) * 15, vein[i].x, vein[i].y);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    }

    // Blood pools (only for stages 0-2)
    if (gameState.developmentStage <= 2) {
        const blood = textureCache.get("gore_blood");
        if (blood) {
            for (const s of bloodPools) {
                ctx.drawImage(blood, s.x, s.y, blood.width * s.s, blood.height * s.s);
            }
        }
    }

    // Heartbeat pulse effect for stage >= 3
    if (gameState.developmentStage >= 3 && gameState.developmentStage < 5) {
        const heartbeat = Math.sin(time * 0.008) * 0.5 + 0.5; // 0 to 1 pulse
        const hbx = gs.gridWidth * baseCell / 2;
        const hby = gs.gridHeight * baseCell / 2;
        const hbRadius = 80 + heartbeat * 30;
        const hbGrad = ctx.createRadialGradient(hbx, hby, 0, hbx, hby, hbRadius);
        hbGrad.addColorStop(0, `rgba(200, 30, 30, ${0.15 * heartbeat})`);
        hbGrad.addColorStop(1, "rgba(200, 30, 30, 0)");
        ctx.fillStyle = hbGrad;
        ctx.beginPath(); ctx.arc(hbx, hby, hbRadius, 0, Math.PI * 2); ctx.fill();
    }

    // Grid
    if (gs.showGrid) {
        ctx.strokeStyle = "rgba(80, 15, 15, 0.3)";
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= gs.gridWidth; x++) {
            ctx.beginPath(); ctx.moveTo(x * baseCell, 0); ctx.lineTo(x * baseCell, gs.gridHeight * baseCell); ctx.stroke();
        }
        for (let y = 0; y <= gs.gridHeight; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * baseCell); ctx.lineTo(gs.gridWidth * baseCell, y * baseCell); ctx.stroke();
        }
    }

    ctx.strokeStyle = "rgba(120, 20, 20, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, gs.gridWidth * baseCell, gs.gridHeight * baseCell);

    // Hover
    if (hoverGridX !== null && hoverGridY !== null) {
        const factory = getCurrentFactory();
        if (factory) {
            if (gameState.ui.toolMode === "build" && gameState.ui.selectedBuilding) {
                const def = BUILDING_DEFS[gameState.ui.selectedBuilding];
                const canPlace = canPlaceBuilding(gameState.ui.selectedBuilding, hoverGridX, hoverGridY);
                // Calculate rotated dimensions for the preview
                // When rotation is 90 or 270 degrees, width and height swap
                const isRotatedSideways = previewRotation === 1 || previewRotation === 3;
                const previewW = isRotatedSideways ? def.size[1] * baseCell : def.size[0] * baseCell;
                const previewH = isRotatedSideways ? def.size[0] * baseCell : def.size[1] * baseCell;
                // Draw the ghost at the hover position with rotated footprint
                const px = hoverGridX * baseCell;
                const py = hoverGridY * baseCell;
                ctx.fillStyle = canPlace ? "rgba(0, 180, 0, 0.15)" : "rgba(200, 0, 0, 0.2)";
                ctx.fillRect(px, py, previewW, previewH);
                ctx.strokeStyle = canPlace ? "rgba(0, 180, 0, 0.6)" : "rgba(200, 0, 0, 0.8)";
                ctx.lineWidth = 2;
                ctx.strokeRect(px, py, previewW, previewH);
                // Draw rotation indicator arrow
                const cx = px + previewW / 2;
                const cy = py + previewH / 2;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(previewRotation * Math.PI / 2);
                ctx.fillStyle = "rgba(255, 200, 50, 0.7)";
                ctx.font = "bold 10px 'Courier New'";
                ctx.textAlign = "center";
                ctx.fillText("↻", 0, -Math.max(previewW, previewH) / 2 - 8);
                ctx.restore();
            } else if (gameState.ui.toolMode === "delete") {
                const bid = factory.grid[hoverGridY]?.[hoverGridX];
                if (bid) {
                    const b = factory.buildings[bid];
                    ctx.fillStyle = "rgba(200, 0, 0, 0.2)";
                    const def = BUILDING_DEFS[b.type];
                    ctx.fillRect(b.gridX * baseCell, b.gridY * baseCell, def.size[0] * baseCell, def.size[1] * baseCell);
                }
            } else if (gameState.ui.toolMode === "inspect") {
                const bid = factory.grid[hoverGridY]?.[hoverGridX];
                if (bid) {
                    const b = factory.buildings[bid];
                    ctx.fillStyle = "rgba(200, 80, 80, 0.1)";
                    const def = BUILDING_DEFS[b.type];
                    ctx.fillRect(b.gridX * baseCell, b.gridY * baseCell, def.size[0] * baseCell, def.size[1] * baseCell);
                }
            }
        }
    }

    // Buildings with ANIMATIONS
    const factory = getCurrentFactory();
    if (factory) {
        // Pass 1: Draw all building sprites and animations
        for (const building of Object.values(factory.buildings)) {
            const sprite = textureCache.get(`building_${building.type}`);
            const def = BUILDING_DEFS[building.type];
            const bx = building.gridX * baseCell;
            const by = building.gridY * baseCell;
            const bw = def.size[0] * baseCell;
            const bh = def.size[1] * baseCell;

            // Machine working animation: pulse, vibrate, glow
            let animOffsetX = 0, animOffsetY = 0;
            if (building.isActive) {
                const pulse = Math.sin(time * 0.005) * 1.5;
                animOffsetX = pulse * 0.5;
                animOffsetY = pulse * 0.3;
            }

            ctx.save();
            ctx.translate(animOffsetX, animOffsetY);

            if (sprite) ctx.drawImage(sprite, bx, by, bw, bh);
            else { ctx.fillStyle = def.color; ctx.fillRect(bx, by, bw, bh); }

            // Active machine: blood drip effect
            if (building.isActive) {
                const dripCount = 3;
                for (let i = 0; i < dripCount; i++) {
                    const dripX = bx + (bw / (dripCount + 1)) * (i + 1);
                    const dripPhase = (time * 0.002 + building.gridX + building.gridY * 0.7 + i * 2.1) % 1;
                    const dripY = by + bh * (0.2 + dripPhase * 0.6);
                    const dripSize = 2 + dripPhase * 2;
                    ctx.fillStyle = `rgba(180, 15, 15, ${0.6 - dripPhase * 0.5})`;
                    ctx.beginPath(); ctx.arc(dripX, dripY, dripSize, 0, Math.PI * 2); ctx.fill();
                }

                // Pulsing glow
                const glowAlpha = 0.05 + Math.sin(time * 0.003) * 0.03;
                ctx.fillStyle = `rgba(200, 20, 20, ${glowAlpha})`;
                ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);

                // Spinning indicator for active machines
                if (def.energyCost > 0) {
                    const cx = bx + bw / 2;
                    const cy = by + bh / 2;
                    ctx.strokeStyle = "rgba(255, 100, 50, 0.3)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(cx, cy, Math.min(bw, bh) * 0.35, time * 0.002, time * 0.002 + Math.PI * 1.5);
                    ctx.stroke();
                }
            }

            ctx.restore();
        }

        // Pass 2: Draw all overlays on top (no clipping by neighbors)
        for (const building of Object.values(factory.buildings)) {
            const def = BUILDING_DEFS[building.type];
            const bx = building.gridX * baseCell;
            const by = building.gridY * baseCell;
            const bw = def.size[0] * baseCell;
            const bh = def.size[1] * baseCell;

            // Direction arrow
            renderDirectionArrow(building, def, bx, by, bw, bh, baseCell);

            // Progress bar
            if (building.isActive && building.processingProgress > 0) {
                const barW = bw - 4, barH = 3;
                const barY = by + bh - 4;
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(bx + 2, barY, barW, barH);
                const progressColor = building.processingProgress >= 1 ? "#ff2020" : "#aa3030";
                ctx.fillStyle = progressColor;
                ctx.fillRect(bx + 2, barY, barW * building.processingProgress, barH);
            }

            // Energy indicator
            if (gs.energySystem && def.energyCost > 0) {
                ctx.fillStyle = hasEnoughEnergy(factory, def.energyCost) ? "rgba(0, 200, 0, 0.7)" : "rgba(200, 0, 0, 0.7)";
                ctx.fillRect(bx + bw - 8, by + 2, 6, 6);
            }

            // Input/Output indicators (toggle with V)
            renderBuildingBuffers(building, def, bx, by, bw, bh, baseCell);

            // I/O dots
            renderIOBadges(building, def, bx, by, bw, bh, baseCell);

            // Storage filter indicator dots
            if (def.isStorage) {
                renderStorageFilterIndicator(building, def, bx, by, bw, bh, baseCell);
            }

            // Smart conveyor filter indicator dots
            if (def.isSmartConveyor) {
                renderSmartConveyorFilterIndicator(building, def, bx, by, bw, bh, baseCell);
            }
        }

        // Connection lines with blood vessel style
        renderConnectionLines(factory, baseCell);

        // Connection drag line
        if (connectingFrom) {
            const b = factory.buildings[connectingFrom];
            if (b) {
                const def = BUILDING_DEFS[b.type];
                const bx = b.gridX * baseCell + (def.size[0] * baseCell / 2);
                const by = b.gridY * baseCell + (def.size[1] * baseCell / 2);
                ctx.strokeStyle = "rgba(180, 30, 30, 0.6)";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 3]);
                ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(mouseWorldX, mouseWorldY); ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    ctx.restore();

    // Particles in screen space
    if (gs.showParticles) {
        for (const p of gameState.particles) {
            const sx = p.x * gs.zoom + gs.cameraX;
            const sy = p.y * gs.zoom + gs.cameraY;
            ctx.globalAlpha = p.life * 0.7;
            if (p.type === "spore" || p.type === "smoke") {
                const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * gs.zoom);
                grad.addColorStop(0, "rgba(180, 30, 30, 0.4)");
                grad.addColorStop(1, "rgba(60, 10, 10, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(sx, sy, p.size * gs.zoom, 0, Math.PI * 2); ctx.fill();
            } else if (p.type === "spark") {
                ctx.fillStyle = p.color;
                const ss = p.size * gs.zoom;
                ctx.fillRect(sx - ss / 2, sy - ss / 2, ss, ss);
            } else if (p.type === "blood") {
                ctx.fillStyle = `rgba(200, 20, 20, ${p.life * 0.6})`;
                ctx.beginPath(); ctx.arc(sx, sy, p.size * gs.zoom, 0, Math.PI * 2); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    // Gore overlay (screen-scale)
    const overlay = textureCache.get("gore_overlay");
    if (overlay && gameState.developmentStage <= 2) {
        ctx.globalAlpha = 0.1;
        for (let ty = 0; ty < Math.ceil(canvas.height / overlay.height) + 1; ty++) {
            for (let tx = 0; tx < Math.ceil(canvas.width / overlay.width) + 1; tx++) {
                ctx.drawImage(overlay, tx * overlay.width, ty * overlay.height);
            }
        }
        ctx.globalAlpha = 1;
    }

    // Victory overlay for stage 5
    if (gameState.developmentStage >= 5) {
        const victory = generateVictoryOverlay(canvas.width, canvas.height);
        ctx.drawImage(victory, 0, 0);
    }

    // ===== TOP CENTER STAGE PROGRESS BAR =====
    renderStageProgressBar(factory, baseCell, time);

    // ===== ANGEL GUIDE — bottom-left of canvas =====
    renderAngelGuide(time);
}

function roundRectCanvas(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/* ===== TOP CENTER STAGE PROGRESS BAR ===== */

function renderStageProgressBar(factory, baseCell, time) {
    if (!factory) return;

    const barW = 380;
    const barH = 36;
    const barX = (canvas.width - barW) / 2;
    const barY = 8;

    const stage = STAGES[gameState.developmentStage];
    const progress = getStageProgress();
    const isMaxStage = gameState.developmentStage >= STAGES.length - 1;
    const nextStage = !isMaxStage ? STAGES[gameState.developmentStage + 1] : null;

    // Background
    ctx.fillStyle = "rgba(15, 3, 3, 0.88)";
    roundRectCanvas(ctx, barX, barY, barW, barH, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 20, 20, 0.6)";
    ctx.lineWidth = 1.5;
    roundRectCanvas(ctx, barX, barY, barW, barH, 4);
    ctx.stroke();

    // Stage name
    ctx.fillStyle = "#e04040";
    ctx.font = "bold 10px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(`${stage.name}`, barX + barW / 2, barY + 12);

    // Progress bar
    if (!isMaxStage) {
        const progBarX = barX + 8;
        const progBarY = barY + 18;
        const progBarW = barW - 16;
        const progBarH = 5;

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(progBarX, progBarY, progBarW, progBarH);

        const gradient = ctx.createLinearGradient(progBarX, 0, progBarX + progBarW, 0);
        gradient.addColorStop(0, "#aa0000");
        gradient.addColorStop(1, "#dd2020");
        ctx.fillStyle = gradient;
        ctx.fillRect(progBarX, progBarY, progBarW * progress, progBarH);

        ctx.fillStyle = "#a08060";
        ctx.font = "8px 'Courier New'";
        ctx.fillText(`${nextStage.name} (${Math.round(progress * 100)}%)`, barX + barW / 2, barY + 34);
    } else {
        ctx.fillStyle = "#ffaa00";
        ctx.font = "9px 'Courier New'";
        ctx.fillText("Life is complete!", barX + barW / 2, barY + 34);
    }
}

/* ===== ANGEL GUIDE — BOTTOM LEFT OF CANVAS ===== */

function renderAngelGuide(time) {
    const angelSprite = textureCache.get("angel_guide");
    if (!angelSprite) return;

    const size = 120;
    const sidebarW = 220;
    const floatY = Math.sin(time * 0.002) * 6;

    // Position: just right of sidebar, anchored to bottom of canvas
    const x = sidebarW + 8;
    const y = canvas.height - size + floatY;

    // Soft glow behind angel
    const glowGrad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size * 0.7);
    glowGrad.addColorStop(0, "rgba(255, 255, 255, 0.06)");
    glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Draw angel sprite
    ctx.drawImage(angelSprite, x, y, size, size);

    // Sparkle particles around angel
    for (let i = 0; i < 3; i++) {
        const phase = (time * 0.003 + i * 2.1) % (Math.PI * 2);
        const sparkleX = x + size / 2 + Math.cos(phase + i) * (size * 0.5 + Math.sin(phase * 1.3) * 8);
        const sparkleY = y + size / 2 + Math.sin(phase * 1.5 + i) * (size * 0.4 + Math.cos(phase * 0.7) * 6);
        const sparkleAlpha = 0.3 + Math.sin(phase * 2) * 0.25;
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1.5 + Math.sin(phase) * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* ===== DIRECTION ARROW ===== */

function renderDirectionArrow(building, def, bx, by, bw, bh, baseCell) {
    const dir = building.rotation;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const arrowSize = Math.min(bw, bh) * 0.15;

    ctx.save();
    ctx.translate(cx, by + arrowSize + 2);

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath(); ctx.arc(0, 0, arrowSize + 2, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.rotate(dir * Math.PI / 2);
    ctx.fillStyle = "rgba(200, 50, 50, 0.8)";
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize);
    ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.3);
    ctx.lineTo(arrowSize * 0.5, arrowSize * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();

    const fontSize = Math.max(9, Math.min(11, baseCell * 0.3));
    ctx.fillStyle = "rgba(230, 100, 100, 0.85)";
    ctx.font = `bold ${fontSize}px 'Courier New'`;
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 2;
    const dirText = DIR_NAMES[dir] + " " + DIR_ARROWS[dir];
    ctx.strokeText(dirText, cx, by + bh - 10);
    ctx.fillText(dirText, cx, by + bh - 10);
}

/* ===== INPUT/OUTPUT BUFFERS ===== */

function renderBuildingBuffers(building, def, bx, by, bw, bh, baseCell) {
    if (baseCell < 16) return;
    if (!showBuildingDetails) return;

    const hasInput = building.inputBuffer && Object.keys(building.inputBuffer).length > 0;
    const hasOutput = building.outputBuffer && Object.keys(building.outputBuffer).length > 0;
    if (!hasInput && !hasOutput) return;

    const fontSize = Math.max(8, Math.min(10, baseCell * 0.25));
    ctx.font = `bold ${fontSize}px 'Courier New'`;
    ctx.textAlign = "left";
    const lineH = fontSize + 2;

    // Gather non-empty entries
    const inEntries = Object.entries(building.inputBuffer).filter(([, amt]) => amt > 0);
    const outEntries = Object.entries(building.outputBuffer).filter(([, amt]) => amt > 0);

    if (inEntries.length === 0 && outEntries.length === 0) return;

    // Count max lines needed (limit to 3 per column)
    const inCount = Math.min(inEntries.length, 3);
    const outCount = Math.min(outEntries.length, 3);
    const maxLines = Math.max(inCount, outCount);
    const totalH = maxLines * lineH + fontSize + 4; // + header

    // Position at bottom of building, above progress bar
    const startY = by + bh - totalH - 6;
    const colW = bw * 0.48;

    // Background
    ctx.fillStyle = "rgba(10, 2, 2, 0.85)";
    ctx.fillRect(bx + 2, startY - fontSize, colW, fontSize + inCount * lineH + 2);
    if (hasOutput && outEntries.length > 0) {
        ctx.fillRect(bx + 2 + colW + 2, startY - fontSize, colW - 2, fontSize + outCount * lineH + 2);
    }

    // IN column (left)
    if (inEntries.length > 0) {
        const startX = bx + 5;
        let y = startY;
        ctx.fillStyle = "#ff7060";
        ctx.fillText("IN", startX, y);
        y += lineH;

        for (let i = 0; i < Math.min(inEntries.length, 3); i++) {
            const [res, amt] = inEntries[i];
            const color = RESOURCE_TYPES[res]?.color || "#aaa";
            const shortName = (RESOURCE_TYPES[res]?.name || res).substring(0, 7);
            const txt = `${shortName}:${Math.floor(amt)}`;
            ctx.fillStyle = color;
            ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.lineWidth = 2;
            ctx.strokeText(txt, startX, y);
            ctx.fillText(txt, startX, y);
            y += lineH;
        }
        if (inEntries.length > 3) {
            ctx.fillStyle = "#8a7a6a";
            ctx.fillText(`+${inEntries.length - 3} more`, startX, y);
        }
    }

    // OUT column (right)
    if (outEntries.length > 0) {
        const startX = bx + 5 + colW;
        let y = startY;
        ctx.fillStyle = "#ffb840";
        ctx.fillText("OUT", startX, y);
        y += lineH;

        for (let i = 0; i < Math.min(outEntries.length, 3); i++) {
            const [res, amt] = outEntries[i];
            const color = RESOURCE_TYPES[res]?.color || "#aaa";
            const shortName = (RESOURCE_TYPES[res]?.name || res).substring(0, 7);
            const txt = `${shortName}:${Math.floor(amt)}`;
            ctx.fillStyle = color;
            ctx.strokeStyle = "rgba(0,0,0,0.9)";
            ctx.lineWidth = 2;
            ctx.strokeText(txt, startX, y);
            ctx.fillText(txt, startX, y);
            y += lineH;
        }
        if (outEntries.length > 3) {
            ctx.fillStyle = "#8a7a6a";
            ctx.fillText(`+${outEntries.length - 3} more`, startX, y);
        }
    }
}

/* ===== I/O INDICATORS ===== */

function renderIOBadges(building, def, bx, by, bw, bh, baseCell) {
    if (baseCell < 24) return;
    if (!showBuildingDetails) return;

    const dir = building.rotation;
    const vec = DIR_VECTORS[dir];
    const hasInputs = def.inputs && def.inputs.length > 0;
    const hasOutputs = def.produces && Object.keys(def.produces).length > 0;
    const hasInputConn = building.connectedInputs.length > 0;
    const hasOutputConn = building.connectedOutputs.length > 0;
    const isStorage = def.isStorage;

    const dotR = Math.max(3, baseCell * 0.1);
    const edgeDist = Math.min(bw, bh) * 0.08;

    // Green dot on input side (opposite facing direction)
    if (hasInputs || (isStorage && hasInputConn)) {
        const x = bx + bw / 2 - vec.dx * (Math.max(bw, bh) * 0.4 + edgeDist);
        const y = by + bh / 2 - vec.dy * (Math.max(bw, bh) * 0.4 + edgeDist);

        ctx.fillStyle = "rgba(10, 2, 2, 0.8)";
        ctx.beginPath(); ctx.arc(x, y, dotR + 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = hasInputConn ? "#00dd44" : "#00aa33";
        ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fill();
    }

    // Orange dot on output side (facing direction)
    if (hasOutputs || (isStorage && hasOutputConn)) {
        const x = bx + bw / 2 + vec.dx * (Math.max(bw, bh) * 0.4 + edgeDist);
        const y = by + bh / 2 + vec.dy * (Math.max(bw, bh) * 0.4 + edgeDist);

        ctx.fillStyle = "rgba(10, 2, 2, 0.8)";
        ctx.beginPath(); ctx.arc(x, y, dotR + 1.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = hasOutputConn ? "#ff9900" : "#cc7700";
        ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fill();
    }

    // Storage capacity bar at bottom
    if (isStorage) {
        const total = getTotalStorageAmount(building);
        const capacity = def.capacity;
        const fillPct = Math.min(1, total / capacity);

        const barX = bx + 2;
        const barY = by + bh - 4;
        const barW = bw - 4;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, 3);

        const barColor = fillPct > 0.8 ? "#cc2020" : fillPct > 0.4 ? "#aa6030" : "#00aa44";
        ctx.fillStyle = barColor;
        ctx.fillRect(barX, barY, barW * fillPct, 3);
    }
}

/* ===== STORAGE FILTER INDICATOR DOTS ===== */

function renderStorageFilterIndicator(building, def, bx, by, bw, bh, baseCell) {
    if (baseCell < 25) return;

    const filter = building.storageFilter || [];
    const isAll = filter.length === 0; // Empty = all resources pass

    // Show dots for each resource that will be output
    const centerX = bx + bw / 2;
    const topY = by + 4;
    const dotRadius = Math.max(2, baseCell * 0.08);
    const dotSpacing = dotRadius * 3 + 2;

    // Determine which resources to show dots for
    const resourcesToShow = isAll
        ? Object.keys(RESOURCE_TYPES)
        : filter.filter(r => RESOURCE_TYPES[r]);

    if (resourcesToShow.length === 0) return;

    const totalWidth = resourcesToShow.length * dotSpacing;
    let startX = centerX - totalWidth / 2 + dotSpacing / 2;

    for (let i = 0; i < resourcesToShow.length; i++) {
        const res = resourcesToShow[i];
        const info = RESOURCE_TYPES[res];
        if (!info) continue;

        const dotX = startX + i * dotSpacing;
        const dotY = topY;

        // Draw colored dot
        ctx.fillStyle = info.color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Outline
        ctx.strokeStyle = isAll ? "rgba(255,255,255,0.3)" : "rgba(255,200,0,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Show stored amount count
    const total = getTotalStorageAmount(building);
    if (total > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = `bold ${Math.max(7, baseCell * 0.22)}px 'Courier New'`;
        ctx.textAlign = "center";
        ctx.fillText(Math.floor(total), centerX, by + bh - 6);
    }
}

/* ===== SMART CONVEYOR FILTER INDICATOR ===== */

function renderSmartConveyorFilterIndicator(building, def, bx, by, bw, bh, baseCell) {
    if (baseCell < 20) return;

    const filter = building.conveyorFilter || [];
    const isAll = filter.length === 0;

    const centerX = bx + bw / 2;
    const topY = by + 4;
    const dotRadius = Math.max(2, baseCell * 0.08);
    const dotSpacing = dotRadius * 3 + 2;

    const resourcesToShow = isAll ? Object.keys(RESOURCE_TYPES) : filter.filter(r => RESOURCE_TYPES[r]);
    if (resourcesToShow.length === 0) return;

    const totalWidth = resourcesToShow.length * dotSpacing;
    let startX = centerX - totalWidth / 2 + dotSpacing / 2;

    for (let i = 0; i < resourcesToShow.length; i++) {
        const res = resourcesToShow[i];
        const info = RESOURCE_TYPES[res];
        if (!info) continue;

        const dotX = startX + i * dotSpacing;

        ctx.fillStyle = info.color;
        ctx.beginPath();
        ctx.arc(dotX, topY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isAll ? "rgba(255,255,255,0.3)" : "rgba(255,200,0,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

/* ===== CONNECTION LINES — BLOOD VESSEL STYLE ===== */

function renderConnectionLines(factory, baseCell) {
    ctx.strokeStyle = "rgba(140, 20, 20, 0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    for (const building of Object.values(factory.buildings)) {
        const def = BUILDING_DEFS[building.type];
        const bx = building.gridX * baseCell + (def.size[0] * baseCell / 2);
        const by = building.gridY * baseCell + (def.size[1] * baseCell / 2);

        for (const connId of building.connectedOutputs) {
            const conn = factory.buildings[connId];
            if (!conn) continue;
            const connDef = BUILDING_DEFS[conn.type];
            const cx = conn.gridX * baseCell + (connDef.size[0] * baseCell / 2);
            const cy = conn.gridY * baseCell + (connDef.size[1] * baseCell / 2);

            // Blood vessel wavy line
            ctx.beginPath();
            ctx.moveTo(bx, by);
            const mx = (bx + cx) / 2;
            const my = (by + cy) / 2;
            ctx.quadraticCurveTo(mx + 8, my - 8, cx, cy);
            ctx.stroke();

            // Arrow at midpoint
            const angle = Math.atan2(cy - by, cx - bx);
            const arrowSize = 5;
            ctx.fillStyle = "rgba(200, 30, 30, 0.7)";
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(angle) * arrowSize, my + Math.sin(angle) * arrowSize);
            ctx.lineTo(mx + Math.cos(angle + 2.5) * arrowSize, my + Math.sin(angle + 2.5) * arrowSize);
            ctx.lineTo(mx + Math.cos(angle - 2.5) * arrowSize, my + Math.sin(angle - 2.5) * arrowSize);
            ctx.closePath();
            ctx.fill();
        }
    }
}

/* ===== HOVER ===== */

let hoverGridX = null, hoverGridY = null;
let mouseWorldX = 0, mouseWorldY = 0;
let connectingFrom = null;
let showBuildingDetails = false; // Toggle with V key, default OFF

function canPlaceBuilding(type, gridX, gridY) {
    const factory = getCurrentFactory();
    if (!factory) return false;
    const def = BUILDING_DEFS[type];
    if (!def) return false;
    const [w, h] = def.size;
    if (gridX < 0 || gridY < 0 || gridX + w > gameState.settings.gridWidth || gridY + h > gameState.settings.gridHeight) return false;
    for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++)
            if (factory.grid[gridY + dy][gridX + dx] !== null) return false;
    return true;
}
