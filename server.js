const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static('audio')); // serve mp3 files
app.use(require('cors')());

const wss = new WebSocket.Server({ port: 3000 });

const sessions = new Map();

wss.on('connection', (ws) => {
  const sessionId = Date.now().toString();
  sessions.set(sessionId, ws);
  console.log(`New session: ${sessionId}`);

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);
    if (data.type === 'dtmf') {
      console.log(`DTMF received: ${data.digit} from ${sessionId}`);
      // Map digit to audio (1→option1.mp3)
      ws.send(`PLAY:${data.digit}`);
    }
  });

  ws.on('close', () => sessions.delete(sessionId));
});

app.listen(3000, () => console.log('Backend running on port 3000 - FREE on Render'));
