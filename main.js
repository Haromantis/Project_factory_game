const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function getUserDataPath() {
    const userDataDir = path.join(app.getPath('userData'), 'worlds');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });
    return userDataDir;
}

function saveWorldToFile(name, data) {
    try {
        const dir = getUserDataPath();
        const safeName = name.replace(/[^a-zA-Z0-9_\-\s]/g, '_');
        const filePath = path.join(dir, `${safeName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

function loadWorldFromFile(name) {
    try {
        const dir = getUserDataPath();
        const safeName = name.replace(/[^a-zA-Z0-9_\-\s]/g, '_');
        const filePath = path.join(dir, `${safeName}.json`);
        if (!fs.existsSync(filePath)) return { error: 'File not found' };
        const raw = fs.readFileSync(filePath, 'utf8');
        return { success: true, data: JSON.parse(raw) };
    } catch (e) {
        return { error: e.message };
    }
}

function listSavedWorlds() {
    try {
        const dir = getUserDataPath();
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        const worlds = [];
        for (const f of files) {
            try {
                const raw = fs.readFileSync(path.join(dir, f), 'utf8');
                const data = JSON.parse(raw);
                worlds.push({ name: f.replace('.json', ''), data });
            } catch {}
        }
        return worlds;
    } catch {
        return [];
    }
}

function deleteWorldFile(name) {
    try {
        const dir = getUserDataPath();
        const safeName = name.replace(/[^a-zA-Z0-9_\-\s]/g, '_');
        const filePath = path.join(dir, `${safeName}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}

function exportAllWorldsToFile() {
    try {
        const worlds = listSavedWorlds();
        const result = {};
        for (const w of worlds) result[w.name] = w.data;
        return { success: true, data: result };
    } catch (e) {
        return { error: e.message };
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Blood Factory — From Cell to Soul',
        backgroundColor: '#0a0202',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile(path.join(__dirname, 'index.html'));

    Menu.setApplicationMenu(null);

    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11') {
            win.setFullScreen(!win.isFullScreen());
        }
    });
}

app.whenReady().then(() => {
    ipcMain.handle('fs-save-world', (event, name, data) => saveWorldToFile(name, data));
    ipcMain.handle('fs-load-world', (event, name) => loadWorldFromFile(name));
    ipcMain.handle('fs-list-worlds', () => listSavedWorlds());
    ipcMain.handle('fs-delete-world', (event, name) => deleteWorldFile(name));
    ipcMain.handle('fs-export-all', () => exportAllWorldsToFile());
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
