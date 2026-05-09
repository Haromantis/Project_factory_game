/* ===== PROCEDURAL TEXTURES — GORE / CARNAGE THEME ===== */

const textureCache = new Map();

function initTextures() {
    textureCache.set("gore_bg", generateGoreBackground(800, 600));
    textureCache.set("gore_blood", generateBloodPool(200, 200));
    textureCache.set("gore_overlay", generateGoreOverlay(800, 600));

    // Stage backgrounds
    for (let i = 0; i < STAGES.length; i++) {
        textureCache.set(`stage_bg_${i}`, generateStageBackground(i, 800, 600));
    }

    for (const [type, def] of Object.entries(BUILDING_DEFS)) {
        const [w, h] = def.size;
        textureCache.set(`building_${type}`, generateBuildingSprite(type, w * 40, h * 40));
    }

    // Angel guide character
    textureCache.set("angel_guide", generateAngelPortrait(200, 200));
}

function refreshStageTextures() {
    for (let i = 0; i < STAGES.length; i++) {
        textureCache.set(`stage_bg_${i}`, generateStageBackground(i, 800, 600));
    }
}

function generateGoreBackground(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Base: dark blood-red
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    grad.addColorStop(0, "#2a0a0a");
    grad.addColorStop(0.5, "#1a0505");
    grad.addColorStop(1, "#0a0202");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Blood splatter
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * width, y = Math.random() * height;
        const r = 1 + Math.random() * 8;
        ctx.fillStyle = `rgba(${120 + Math.random() * 80}, ${10 + Math.random() * 20}, ${10 + Math.random() * 20}, ${0.1 + Math.random() * 0.3})`;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // Dripping blood streaks
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const startY = Math.random() * height * 0.4;
        const length = 20 + Math.random() * 100;
        ctx.strokeStyle = `rgb(${140 + Math.random() * 60}, ${5 + Math.random() * 15}, ${5 + Math.random() * 15})`;
        ctx.lineWidth = 1 + Math.random() * 3;
        ctx.beginPath(); ctx.moveTo(x, startY);
        let cx = x, cy = startY;
        while (cy < startY + length) {
            cx += (Math.random() - 0.5) * 3;
            cy += 2 + Math.random() * 4;
            ctx.lineTo(cx, cy);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Raw meat texture noise
    for (let i = 0; i < width * height * 0.08; i++) {
        const x = Math.random() * width, y = Math.random() * height, b = Math.random();
        ctx.fillStyle = `rgba(${80 + b * 80}, ${15 + b * 20}, ${10 + b * 15}, 0.3)`;
        ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }

    // Vein patterns
    ctx.strokeStyle = "rgba(100, 20, 20, 0.15)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        let cx = Math.random() * width, cy = Math.random() * height;
        ctx.moveTo(cx, cy);
        for (let j = 0; j < 8; j++) {
            cx += (Math.random() - 0.5) * 40;
            cy += (Math.random() - 0.5) * 40;
            ctx.quadraticCurveTo(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, cx, cy);
        }
        ctx.stroke();
    }

    return canvas;
}

function generateBloodPool(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Irregular blood pools
    for (let i = 0; i < 5; i++) {
        const cx = Math.random() * width, cy = Math.random() * height;
        ctx.beginPath();
        const pts = 8 + Math.floor(Math.random() * 6);
        for (let j = 0; j <= pts; j++) {
            const angle = (j / pts) * Math.PI * 2;
            const radius = 10 + Math.random() * 35;
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${100 + Math.random() * 60}, ${5 + Math.random() * 15}, ${5 + Math.random() * 10}, ${0.2 + Math.random() * 0.2})`;
        ctx.fill();
    }

    // Glossy blood sheen
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 3; i++) {
        const g = ctx.createRadialGradient(width * 0.3 + i * 30, height * 0.4, 0, width * 0.3 + i * 30, height * 0.4, 35);
        g.addColorStop(0, "#aa0000");
        g.addColorStop(0.5, "#660000");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    }
    ctx.globalAlpha = 1;

    return canvas;
}

function generateGoreOverlay(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Meat fibers
    for (let i = 0; i < width * height * 0.02; i++) {
        ctx.strokeStyle = `rgba(${60 + Math.random() * 40}, ${10 + Math.random() * 15}, ${8 + Math.random() * 10}, ${Math.random() * 0.3})`;
        ctx.lineWidth = 0.5;
        const x = Math.random() * width, y = Math.random() * height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8);
        ctx.stroke();
    }

    return canvas;
}

function generateBuildingSprite(type, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    const def = BUILDING_DEFS[type];

    // Base: raw meat gradient
    const baseGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.6);
    baseGrad.addColorStop(0, def.color);
    baseGrad.addColorStop(1, darkenColor(def.color, 40));
    ctx.fillStyle = baseGrad;
    ctx.fillRect(2, 2, width - 4, height - 4);

    // Bloody border
    ctx.strokeStyle = "rgba(180, 20, 20, 0.7)";
    ctx.lineWidth = 3;
    roundRect(ctx, 2, 2, width - 4, height - 4, 4);
    ctx.stroke();

    // Bone/teeth rivets
    ctx.fillStyle = "#d4c4a4";
    for (const [rx, ry] of [[4, 4], [width - 6, 4], [4, height - 6], [width - 6, height - 6]]) {
        ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Raw flesh texture on surface
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(${100 + Math.random() * 60}, ${15 + Math.random() * 25}, ${10 + Math.random() * 20}, 0.2)`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Type-specific gore details
    switch (type) {
        case "miner":
            // Bloody saw blade
            ctx.fillStyle = "#8a8a8a";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.6, Math.min(width, height) * 0.25, 0, Math.PI * 2); ctx.fill();
            // Teeth
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.fillStyle = "#aaa";
                ctx.beginPath();
                ctx.moveTo(width * 0.5 + Math.cos(a) * 12, height * 0.6 + Math.sin(a) * 12);
                ctx.lineTo(width * 0.5 + Math.cos(a + 0.2) * 20, height * 0.6 + Math.sin(a + 0.2) * 20);
                ctx.lineTo(width * 0.5 + Math.cos(a - 0.2) * 20, height * 0.6 + Math.sin(a - 0.2) * 20);
                ctx.closePath(); ctx.fill();
            }
            // Blood on blade
            ctx.fillStyle = "rgba(180, 20, 20, 0.4)";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.6, Math.min(width, height) * 0.15, 0, Math.PI * 2); ctx.fill();
            break;

        case "coal_drill":
            // Drill bit with blood
            ctx.fillStyle = "#6a6a6a";
            ctx.fillRect(width * 0.35, height * 0.2, width * 0.3, height * 0.6);
            // Spiral grooves
            ctx.strokeStyle = "#888"; ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(width * 0.35, height * 0.25 + i * (height * 0.08));
                ctx.lineTo(width * 0.65, height * 0.25 + i * (height * 0.08) + 4);
                ctx.stroke();
            }
            // Blood drip
            ctx.fillStyle = "rgba(180, 20, 20, 0.5)";
            ctx.beginPath(); ctx.ellipse(width * 0.5, height * 0.85, width * 0.1, height * 0.08, 0, 0, Math.PI * 2); ctx.fill();
            break;

        case "copper_miner":
            // Flesh hooks
            ctx.strokeStyle = "#aaa"; ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                const hx = width * 0.25 + i * width * 0.25;
                ctx.beginPath();
                ctx.moveTo(hx, height * 0.2);
                ctx.lineTo(hx, height * 0.7);
                ctx.quadraticCurveTo(hx + 8, height * 0.8, hx + 12, height * 0.7);
                ctx.stroke();
            }
            // Blood pools below
            ctx.fillStyle = "rgba(160, 15, 15, 0.3)";
            ctx.beginPath(); ctx.ellipse(width * 0.5, height * 0.9, width * 0.4, height * 0.08, 0, 0, Math.PI * 2); ctx.fill();
            break;

        case "smelter":
            // Blood boiler tanks
            ctx.fillStyle = "#5a1a1a";
            roundRect(ctx, width * 0.15, height * 0.15, width * 0.25, height * 0.7, 4); ctx.fill();
            roundRect(ctx, width * 0.6, height * 0.15, width * 0.25, height * 0.7, 4); ctx.fill();
            // Boiling blood
            ctx.fillStyle = "#aa1010";
            roundRect(ctx, width * 0.17, height * 0.45, width * 0.21, height * 0.38, 3); ctx.fill();
            roundRect(ctx, width * 0.62, height * 0.35, width * 0.21, height * 0.48, 3); ctx.fill();
            // Bubbles
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = `rgba(200, 30, 30, ${0.3 + Math.random() * 0.3})`;
                ctx.beginPath(); ctx.arc(width * 0.28 + Math.random() * 10, height * 0.4 + Math.random() * 20, 3 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(width * 0.73 + Math.random() * 10, height * 0.3 + Math.random() * 20, 3 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
            }
            break;

        case "tissue_cultivator":
            // Tissue cultivator — petri dish with growing tissue
            ctx.fillStyle = "#6a2040";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.4, 0, Math.PI * 2); ctx.fill();
            // Cell clusters
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = `rgba(180, 40, 80, ${0.4 + Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(width * 0.35 + Math.random() * width * 0.3, height * 0.35 + Math.random() * height * 0.3, 3 + Math.random() * 4, 0, Math.PI * 2);
                ctx.fill();
            }
            // Glass rim
            ctx.strokeStyle = "rgba(200, 150, 180, 0.4)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.4, 0, Math.PI * 2); ctx.stroke();
            break;

        case "gland_extractor":
            // Gland extractor — gland press
            ctx.fillStyle = "#6a4020";
            roundRect(ctx, width * 0.2, height * 0.2, width * 0.6, height * 0.6, 3); ctx.fill();
            // Press mechanism
            ctx.fillStyle = "#8a6030";
            ctx.fillRect(width * 0.35, height * 0.1, width * 0.3, height * 0.3);
            // Gland drops
            ctx.fillStyle = "rgba(200, 120, 40, 0.5)";
            ctx.beginPath(); ctx.ellipse(width * 0.5, height * 0.85, width * 0.15, height * 0.08, 0, 0, Math.PI * 2); ctx.fill();
            break;

        case "furnace":
            // Corpse furnace chamber
            ctx.fillStyle = "#3a0a0a";
            roundRect(ctx, width * 0.1, height * 0.25, width * 0.8, height * 0.6, 3); ctx.fill();
            // Fire glow
            ctx.fillStyle = "rgba(255, 80, 0, 0.3)";
            roundRect(ctx, width * 0.15, height * 0.4, width * 0.7, height * 0.4, 3); ctx.fill();
            // Chimney
            ctx.fillStyle = "#2a0a0a";
            ctx.fillRect(width * 0.7, 0, width * 0.15, height * 0.25);
            // Smoke from chimney
            ctx.fillStyle = "rgba(80, 20, 20, 0.4)";
            ctx.beginPath(); ctx.arc(width * 0.77, height * 0.0, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(width * 0.77 + 5, height * 0.05, 4, 0, Math.PI * 2); ctx.fill();
            break;

        case "copper_smelter":
            // Muscle grinder
            ctx.fillStyle = "#5a2020";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.35, 0, Math.PI * 2); ctx.fill();
            // Grinding teeth
            ctx.fillStyle = "#8a8a8a";
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(width * 0.5 + Math.cos(a) * 10, height * 0.5 + Math.sin(a) * 10);
                ctx.lineTo(width * 0.5 + Math.cos(a) * 25, height * 0.5 + Math.sin(a) * 25);
                ctx.lineTo(width * 0.5 + Math.cos(a + 0.5) * 25, height * 0.5 + Math.sin(a + 0.5) * 25);
                ctx.closePath(); ctx.fill();
            }
            // Blood center
            ctx.fillStyle = "rgba(180, 20, 20, 0.5)";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, 8, 0, Math.PI * 2); ctx.fill();
            break;

        case "assembler":
            // Stitching machine
            ctx.fillStyle = "#4a1a1a";
            roundRect(ctx, width * 0.05, height * 0.15, width * 0.4, height * 0.7, 3); ctx.fill();
            roundRect(ctx, width * 0.55, height * 0.15, width * 0.4, height * 0.7, 3); ctx.fill();
            // Needle
            ctx.strokeStyle = "#ccc"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width * 0.45, height * 0.5);
            ctx.lineTo(width * 0.55, height * 0.5);
            ctx.stroke();
            // Thread
            ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"; ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                const y = height * 0.35 + i * (height * 0.06);
                ctx.moveTo(width * 0.45, y);
                ctx.quadraticCurveTo(width * 0.5, y - 3, width * 0.55, y);
                ctx.stroke();
            }
            break;

        case "engine_factory":
            // Heart pulsing chamber
            ctx.fillStyle = "#4a0a0a";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.4, 0, Math.PI * 2); ctx.fill();
            // Heart shape
            ctx.fillStyle = "#8a1a1a";
            ctx.beginPath();
            ctx.arc(width * 0.42, height * 0.45, Math.min(width, height) * 0.18, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(width * 0.58, height * 0.45, Math.min(width, height) * 0.18, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(width * 0.25, height * 0.5);
            ctx.lineTo(width * 0.5, height * 0.8);
            ctx.lineTo(width * 0.75, height * 0.5);
            ctx.closePath(); ctx.fill();
            // Artery tubes
            ctx.strokeStyle = "#6a1010"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(width * 0.5, height * 0.8); ctx.lineTo(width * 0.5, height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(width * 0.35, height * 0.2); ctx.quadraticCurveTo(width * 0.2, 0, width * 0.1, height * 0.1); ctx.stroke();
            break;

        case "conveyor":
            // Blood tube
            ctx.fillStyle = "#3a0a0a";
            roundRect(ctx, width * 0.3, 2, width * 0.4, height - 4, width * 0.15); ctx.fill();
            // Flowing blood
            for (let i = 0; i < 4; i++) {
                const y = 8 + i * (height / 4);
                ctx.fillStyle = `rgba(${140 + Math.random() * 60}, ${10 + Math.random() * 15}, ${10 + Math.random() * 10}, 0.6)`;
                ctx.beginPath(); ctx.arc(width * 0.5, y, 3, 0, Math.PI * 2); ctx.fill();
            }
            break;

        case "storage":
            // Blood sac
            ctx.fillStyle = "#4a1515";
            ctx.beginPath(); ctx.ellipse(width * 0.5, height * 0.5, width * 0.4, height * 0.42, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "rgba(160, 20, 20, 0.4)"; ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath(); ctx.ellipse(width * 0.5, height * 0.5, width * 0.15 * (i + 1), height * 0.12 * (i + 1), 0, 0, Math.PI * 2); ctx.stroke();
            }
            // Pulsing vein
            ctx.strokeStyle = "rgba(120, 15, 15, 0.3)"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width * 0.1, height * 0.5);
            ctx.quadraticCurveTo(width * 0.3, height * 0.4, width * 0.5, height * 0.5);
            ctx.quadraticCurveTo(width * 0.7, height * 0.6, width * 0.9, height * 0.5);
            ctx.stroke();
            break;

        case "splitter":
            ctx.fillStyle = "#4a1a1a";
            ctx.beginPath();
            ctx.moveTo(width * 0.2, height * 0.5);
            ctx.lineTo(width * 0.5, height * 0.25);
            ctx.lineTo(width * 0.8, height * 0.5);
            ctx.lineTo(width * 0.5, height * 0.75);
            ctx.closePath(); ctx.fill();
            // Blood flow lines
            ctx.strokeStyle = "rgba(180, 20, 20, 0.5)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(width * 0.5, height * 0.25); ctx.lineTo(width * 0.5, height * 0.75); ctx.stroke();
            break;

        case "smart_conveyor":
            // Smart conveyor: tube with gear/selector icon
            ctx.fillStyle = "#3a3a1a";
            roundRect(ctx, width * 0.3, 2, width * 0.4, height - 4, width * 0.15); ctx.fill();
            // Gear symbol in center
            ctx.fillStyle = "#aa9030";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.18, 0, Math.PI * 2); ctx.fill();
            // Gear teeth
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                ctx.fillRect(width * 0.5 + Math.cos(a) * 8 - 2, height * 0.5 + Math.sin(a) * 8 - 2, 4, 4);
            }
            // Inner circle
            ctx.fillStyle = "#2a2a1a";
            ctx.beginPath(); ctx.arc(width * 0.5, height * 0.5, Math.min(width, height) * 0.1, 0, Math.PI * 2); ctx.fill();
            break;
    }

    // Blood splatter on everything
    for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(${140 + Math.random() * 60}, ${10 + Math.random() * 20}, ${10 + Math.random() * 15}, ${0.15 + Math.random() * 0.2})`;
        ctx.beginPath(); ctx.arc(Math.random() * width, Math.random() * height, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
    }

    return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
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

function darkenColor(hex, amount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount); g = Math.max(0, g - amount); b = Math.max(0, b - amount);
    return `rgb(${r}, ${g}, ${b})`;
}

/* ===== STAGE BACKGROUNDS ===== */

function generateStageBackground(stage, width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    switch (stage) {
        case 0: // เซลล์แรก — single cell blob
            ctx.fillStyle = "#2a0a0a";
            ctx.fillRect(0, 0, width, height);
            // Central cell blob
            const cx = width / 2, cy = height / 2;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.15);
            grad.addColorStop(0, "rgba(180, 60, 60, 0.6)");
            grad.addColorStop(0.5, "rgba(140, 40, 40, 0.3)");
            grad.addColorStop(1, "rgba(80, 20, 20, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, Math.min(width, height) * 0.15, 0, Math.PI * 2); ctx.fill();
            // Nucleus
            ctx.fillStyle = "rgba(200, 80, 80, 0.4)";
            ctx.beginPath(); ctx.arc(cx, cy, Math.min(width, height) * 0.04, 0, Math.PI * 2); ctx.fill();
            // Small dots around
            for (let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(160, 40, 40, ${0.05 + Math.random() * 0.1})`;
                ctx.beginPath();
                ctx.arc(cx + (Math.random() - 0.5) * 300, cy + (Math.random() - 0.5) * 300, 2 + Math.random() * 5, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 1: // ตัวอ่อน — embryo with segments
            ctx.fillStyle = "#1a0808";
            ctx.fillRect(0, 0, width, height);
            // Embryo shape — elongated blob
            const ex = width / 2, ey = height / 2;
            ctx.fillStyle = "rgba(160, 50, 50, 0.4)";
            ctx.beginPath();
            ctx.ellipse(ex, ey, Math.min(width, height) * 0.12, Math.min(width, height) * 0.2, 0.1, 0, Math.PI * 2);
            ctx.fill();
            // Segmentation lines
            ctx.strokeStyle = "rgba(200, 80, 80, 0.2)";
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                const sy = ey - 40 + i * 16;
                ctx.beginPath();
                ctx.moveTo(ex - 20, sy);
                ctx.lineTo(ex + 20, sy);
                ctx.stroke();
            }
            // Tissue dots
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(140, 30, 30, ${0.1 + Math.random() * 0.15})`;
                ctx.beginPath();
                ctx.arc(ex + (Math.random() - 0.5) * 100, ey + (Math.random() - 0.5) * 150, 2 + Math.random() * 4, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 2: // ระบบประสาท — neural tube with glowing lines
            ctx.fillStyle = "#1a0a05";
            ctx.fillRect(0, 0, width, height);
            // Neural tube — vertical glowing line
            const nx = width / 2, ny = height / 2;
            ctx.strokeStyle = "rgba(255, 160, 50, 0.3)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(nx, ny - 120);
            ctx.quadraticCurveTo(nx + 10, ny, nx, ny + 120);
            ctx.stroke();
            // Branching nerves
            ctx.strokeStyle = "rgba(255, 140, 30, 0.15)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const by = ny - 80 + i * 22;
                const dir = i % 2 === 0 ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(nx, by);
                ctx.quadraticCurveTo(nx + dir * 40, by - 10, nx + dir * 60, by + 5);
                ctx.stroke();
            }
            // Glow particles
            for (let i = 0; i < 15; i++) {
                ctx.fillStyle = `rgba(255, 180, 60, ${0.05 + Math.random() * 0.1})`;
                ctx.beginPath();
                ctx.arc(nx + (Math.random() - 0.5) * 150, ny + (Math.random() - 0.5) * 200, 1 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;

        case 3: // ระบบหัวใจ — pulsing heart center
            ctx.fillStyle = "#1a0505";
            ctx.fillRect(0, 0, width, height);
            // Heart shape
            const hx = width / 2, hy = height / 2;
            ctx.fillStyle = "rgba(200, 30, 30, 0.3)";
            ctx.beginPath();
            ctx.arc(hx - 20, hy - 15, 30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + 20, hy - 15, 30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx - 50, hy);
            ctx.lineTo(hx, hy + 50);
            ctx.lineTo(hx + 50, hy);
            ctx.closePath(); ctx.fill();
            // Blood vessels radiating
            ctx.strokeStyle = "rgba(180, 20, 20, 0.15)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(hx + Math.cos(angle) * 50, hy + Math.sin(angle) * 50);
                ctx.lineTo(hx + Math.cos(angle) * 120, hy + Math.sin(angle) * 120);
                ctx.stroke();
            }
            break;

        case 4: // ระบบอวัยวะ — fetus silhouette with organs
            ctx.fillStyle = "#1a0808";
            ctx.fillRect(0, 0, width, height);
            // Fetus silhouette
            const fx = width / 2, fy = height / 2;
            // Head
            ctx.fillStyle = "rgba(160, 40, 40, 0.25)";
            ctx.beginPath(); ctx.arc(fx, fy - 60, 35, 0, Math.PI * 2); ctx.fill();
            // Body
            ctx.beginPath();
            ctx.ellipse(fx, fy + 20, 30, 60, 0, 0, Math.PI * 2); ctx.fill();
            // Limbs
            ctx.beginPath(); ctx.ellipse(fx - 40, fy + 10, 12, 30, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(fx + 40, fy + 10, 12, 30, 0.3, 0, Math.PI * 2); ctx.fill();
            // Organ highlights
            ctx.fillStyle = "rgba(200, 60, 60, 0.2)";
            ctx.beginPath(); ctx.arc(fx, fy - 10, 12, 0, Math.PI * 2); ctx.fill(); // heart
            ctx.beginPath(); ctx.arc(fx - 10, fy + 10, 8, 0, Math.PI * 2); ctx.fill(); // liver
            ctx.beginPath(); ctx.arc(fx + 10, fy + 15, 8, 0, Math.PI * 2); ctx.fill(); // stomach
            break;

        case 5: // ทารกพร้อมเกิด — victory golden light
            ctx.fillStyle = "#0a0505";
            ctx.fillRect(0, 0, width, height);
            // Golden radial glow
            const vGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.5);
            vGrad.addColorStop(0, "rgba(255, 200, 100, 0.15)");
            vGrad.addColorStop(0.3, "rgba(200, 150, 80, 0.08)");
            vGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = vGrad;
            ctx.fillRect(0, 0, width, height);
            // Sparkle particles
            for (let i = 0; i < 40; i++) {
                ctx.fillStyle = `rgba(255, 220, 150, ${0.1 + Math.random() * 0.2})`;
                ctx.beginPath();
                ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
    }

    return canvas;
}

function generateVictoryOverlay(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Semi-transparent dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    // Golden glow center
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 200);
    grad.addColorStop(0, "rgba(255, 200, 100, 0.2)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    return canvas;
}

/* ===== ANGEL GUIDE CHARACTER — ANIME GIRL ===== */

function generateAngelPortrait(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");

    const cx = width / 2;
    const cy = height / 2 + 10;

    // Glow background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.6);
    bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    bgGrad.addColorStop(0.5, "rgba(200, 180, 255, 0.05)");
    bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Wings
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 15);
    ctx.quadraticCurveTo(cx - 80, cy - 60, cx - 90, cy - 20);
    ctx.quadraticCurveTo(cx - 85, cy, cx - 75, cy + 10);
    ctx.quadraticCurveTo(cx - 60, cy + 5, cx - 55, cy + 15);
    ctx.quadraticCurveTo(cx - 45, cy + 20, cx - 40, cy + 10);
    ctx.quadraticCurveTo(cx - 30, cy + 10, cx - 25, cy - 5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 25, cy - 15);
    ctx.quadraticCurveTo(cx + 80, cy - 60, cx + 90, cy - 20);
    ctx.quadraticCurveTo(cx + 85, cy, cx + 75, cy + 10);
    ctx.quadraticCurveTo(cx + 60, cy + 5, cx + 55, cy + 15);
    ctx.quadraticCurveTo(cx + 45, cy + 20, cx + 40, cy + 10);
    ctx.quadraticCurveTo(cx + 30, cy + 10, cx + 25, cy - 5);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Wing feather lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(cx - 28 - i * 4, cy - 10 + i * 4);
        ctx.lineTo(cx - 50 - i * 8, cy - 25 + i * 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 28 + i * 4, cy - 10 + i * 4);
        ctx.lineTo(cx + 50 + i * 8, cy - 25 + i * 10); ctx.stroke();
    }

    // Dress
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy + 15);
    ctx.quadraticCurveTo(cx - 30, cy + 40, cx - 35, cy + 65);
    ctx.lineTo(cx + 35, cy + 65);
    ctx.quadraticCurveTo(cx + 30, cy + 40, cx + 20, cy + 15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(200, 180, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 15, cy + 20);
    ctx.lineTo(cx, cy + 35); ctx.lineTo(cx + 15, cy + 20); ctx.stroke();

    // Neck
    ctx.fillStyle = "rgba(255, 240, 230, 0.9)";
    ctx.fillRect(cx - 6, cy - 5, 12, 20);

    // Hair back (base volume)
    ctx.fillStyle = "rgba(220, 210, 230, 0.85)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 28, 30, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Long flowing hair — left side
    ctx.fillStyle = "rgba(215, 205, 225, 0.75)";
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 15);
    ctx.quadraticCurveTo(cx - 40, cy + 10, cx - 38, cy + 50);
    ctx.quadraticCurveTo(cx - 36, cy + 75, cx - 28, cy + 90);
    ctx.lineTo(cx - 14, cy + 90);
    ctx.quadraticCurveTo(cx - 16, cy + 60, cx - 18, cy + 30);
    ctx.quadraticCurveTo(cx - 16, cy + 10, cx - 12, cy - 8);
    ctx.closePath(); ctx.fill();

    // Long flowing hair — right side
    ctx.beginPath();
    ctx.moveTo(cx + 28, cy - 15);
    ctx.quadraticCurveTo(cx + 40, cy + 10, cx + 38, cy + 50);
    ctx.quadraticCurveTo(cx + 36, cy + 75, cx + 28, cy + 90);
    ctx.lineTo(cx + 14, cy + 90);
    ctx.quadraticCurveTo(cx + 16, cy + 60, cx + 18, cy + 30);
    ctx.quadraticCurveTo(cx + 16, cy + 10, cx + 12, cy - 8);
    ctx.closePath(); ctx.fill();

    // Back hair flowing down center
    ctx.fillStyle = "rgba(200, 190, 215, 0.6)";
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 5);
    ctx.quadraticCurveTo(cx - 20, cy + 40, cx - 15, cy + 80);
    ctx.quadraticCurveTo(cx - 10, cy + 100, cx, cy + 105);
    ctx.quadraticCurveTo(cx + 10, cy + 100, cx + 15, cy + 80);
    ctx.quadraticCurveTo(cx + 20, cy + 40, cx + 15, cy - 5);
    ctx.closePath(); ctx.fill();

    // Hair shine highlight
    ctx.fillStyle = "rgba(255, 250, 255, 0.15)";
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 35, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = "rgba(255, 242, 232, 0.95)";
    ctx.beginPath(); ctx.arc(cx, cy - 25, 24, 0, Math.PI * 2); ctx.fill();

    // Eyes
    const eyeY = cy - 27;
    const eyeSpacing = 10;
    for (let side = -1; side <= 1; side += 2) {
        const ex = cx + side * eyeSpacing;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath(); ctx.ellipse(ex, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(150,120,220,0.9)";
        ctx.beginPath(); ctx.ellipse(ex, eyeY + 1, 5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(80,50,150,0.9)";
        ctx.beginPath(); ctx.arc(ex, eyeY + 2, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(ex + 2, eyeY - 1, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex - 1, eyeY + 3, 1, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(80,60,100,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(ex, eyeY, 6, 7, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(60,40,80,0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ex - 6, eyeY - 1);
        ctx.quadraticCurveTo(ex, eyeY - 8, ex + 6, eyeY - 1); ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = "rgba(200,100,120,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy - 15, 4, 0.1, Math.PI - 0.1); ctx.stroke();

    // Nose
    ctx.fillStyle = "rgba(200,170,160,0.4)";
    ctx.beginPath(); ctx.arc(cx, cy - 19, 1, 0, Math.PI * 2); ctx.fill();

    // Blush
    ctx.fillStyle = "rgba(255,150,170,0.2)";
    ctx.beginPath(); ctx.ellipse(cx - 15, cy - 20, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 15, cy - 20, 6, 3, 0, 0, Math.PI * 2); ctx.fill();

    // Bangs
    ctx.fillStyle = "rgba(220,210,230,0.9)";
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 30);
    ctx.quadraticCurveTo(cx - 18, cy - 15, cx - 10, cy - 30);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 32);
    ctx.quadraticCurveTo(cx, cy - 12, cx + 10, cy - 32);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 30);
    ctx.quadraticCurveTo(cx + 18, cy - 15, cx + 24, cy - 30);
    ctx.closePath(); ctx.fill();

    // Halo
    ctx.strokeStyle = "rgba(255,230,100,0.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(cx, cy - 55, 22, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,230,100,0.2)";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(cx, cy - 55, 22, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,200,0.5)";
    ctx.beginPath(); ctx.arc(cx - 15, cy - 56, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 18, cy - 54, 1, 0, Math.PI * 2); ctx.fill();

    // Sparkles
    ctx.fillStyle = "rgba(255,255,200,0.3)";
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(cx + (Math.random() - 0.5) * 80, cy - 30 + (Math.random() - 0.5) * 70, 1 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}
