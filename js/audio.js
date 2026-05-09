/* ===== PROCEDURAL AUDIO SYSTEM ===== */

let audioCtx = null;
let masterGain = null;
let bgOscillators = [];
let soundEnabled = true;
let bgVolume = 0;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
    } catch (e) {
        console.warn("Web Audio not available:", e);
        soundEnabled = false;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    if (masterGain) {
        masterGain.gain.value = soundEnabled ? 0.3 : 0;
    }
    if (!soundEnabled) {
        stopBackgroundHum();
    }
    return soundEnabled;
}

/* --- Utility: create and play a short tone --- */
function playTone(freq, duration, type = "sine", volume = 0.2, delay = 0) {
    if (!audioCtx || !soundEnabled) return;
    const t = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + duration);
}

function playNoise(duration, volume = 0.1, delay = 0) {
    if (!audioCtx || !soundEnabled) return;
    const t = audioCtx.currentTime + delay;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    // Low-pass filter to make it less harsh
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(t);
    source.stop(t + duration);
}

/* --- SOUND EFFECTS --- */

// Building placed
function sfxPlaceBuilding() {
    playTone(400, 0.1, "sine", 0.15);
    playTone(600, 0.08, "sine", 0.1, 0.05);
    playTone(800, 0.06, "sine", 0.08, 0.1);
}

// Building deleted
function sfxDeleteBuilding() {
    playTone(400, 0.15, "sawtooth", 0.1);
    playTone(200, 0.2, "sawtooth", 0.08, 0.05);
    playNoise(0.15, 0.05, 0.05);
}

// Connection made
function sfxConnect() {
    playTone(500, 0.1, "triangle", 0.15);
    playTone(700, 0.1, "triangle", 0.12, 0.08);
}

// Production complete
function sfxProductionComplete() {
    playTone(600, 0.06, "sine", 0.08);
    playTone(800, 0.05, "sine", 0.06, 0.04);
}

// Stage advance / big event
function sfxStageAdvance() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
        playTone(freq, 0.3, "sine", 0.15, i * 0.12);
    });
}

// Low energy warning
function sfxLowEnergy() {
    playTone(300, 0.15, "square", 0.1);
    playTone(250, 0.15, "square", 0.08, 0.2);
}

// Click / UI
function sfxClick() {
    playTone(1000, 0.03, "sine", 0.1);
}

// Angel / tutorial chime
function sfxTutorialOpen() {
    const notes = [784, 988, 1175, 1568];
    notes.forEach((freq, i) => {
        playTone(freq, 0.4, "sine", 0.12, i * 0.15);
    });
}

// Background ambient hum — deep drone
function startBackgroundHum() {
    if (!audioCtx || !soundEnabled) return;
    if (bgOscillators.length > 0) return;

    // Deep drone
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 60;
    gain1.gain.value = 0.04;
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start();
    bgOscillators.push({ osc: osc1, gain: gain1 });

    // Subtle higher tone
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 90;
    gain2.gain.value = 0.02;
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start();
    bgOscillators.push({ osc: osc2, gain: gain2 });
}

function stopBackgroundHum() {
    for (const { osc, gain } of bgOscillators) {
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.stop(audioCtx.currentTime + 0.6);
    }
    bgOscillators = [];
}
