const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

let mainWindow;

// 1. EMBEDDED LOCAL SERVER FOR PHONES/TABLETS
const serverApp = express();
// Serves your index.html file over local Wi-Fi to mobile PWAs
serverApp.use(express.static(__dirname));

const server = http.createServer(serverApp);
const wss = new WebSocket.Server({ server });

let connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    console.log('[FLEET] Device joined mesh. Total screens:', connectedClients.size);

    ws.on('message', (message) => {
        // Broadcast signals to all connected screens (PC, Phone, Tablet)
        connectedClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        connectedClients.delete(ws);
        console.log('[FLEET] Device disconnected. Total screens:', connectedClients.size);
    });
});

// Run server on Port 3001 on your local network
server.listen(3001, '0.0.0.0', () => {
    console.log('[FLEET] Matrix Master Server active on port 3001');
});

// 2. CREATE DESKTOP WINDOW
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        backgroundColor: '#080808',
        autoHideMenuBar: true,
        title: 'Matrix AI Hub',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
