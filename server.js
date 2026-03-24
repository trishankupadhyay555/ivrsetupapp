const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Dynamic PORT for Render (very important)
const PORT = process.env.PORT || 3000;

const AUDIO_FOLDER = path.join(__dirname, 'audio');

// Serve audio files statically
app.use('/audio', express.static(AUDIO_FOLDER));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'GSM IVR Backend Running ✅', port: PORT });
});

// DTMF endpoint - Android will call this
app.post('/dtmf', (req, res) => {
  const { digit, sessionId } = req.body;
  
  if (!digit) {
    return res.status(400).json({ error: 'Digit required' });
  }

  console.log(`[${new Date().toISOString()}] DTMF Received: ${digit} | Session: ${sessionId || 'unknown'}`);

  // Map digit to audio file (easy to extend)
  const audioMap = {
    '1': 'option1.mp3',
    '2': 'option2.mp3',
    '3': 'option3.mp3',
    '4': 'option4.mp3',
    '5': 'option5.mp3',
    '9': 'direct_agent.mp3',   // example
    '*': 'invalid.mp3',
    '#': 'end_call.mp3'
  };

  const fileName = audioMap[digit] || 'invalid.mp3';
  const filePath = path.join(AUDIO_FOLDER, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`Audio file missing: ${fileName}`);
    return res.status(404).json({ error: 'Audio not found' });
  }

  // Return audio URL that Android will play
  const audioUrl = `https://${req.get('host')}/audio/${fileName}`;
  
  res.json({
    status: 'success',
    digit: digit,
    audioUrl: audioUrl,
    fileName: fileName,
    message: `Playing ${fileName}`
  });
});

// Optional: List all available audio files
app.get('/audio-list', (req, res) => {
  try {
    const files = fs.readdirSync(AUDIO_FOLDER).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
    res.json({ audioFiles: files });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list audio' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GSM IVR Backend running on port ${PORT}`);
  console.log(`📢 Audio URL example: https://your-app.onrender.com/audio/option2.mp3`);
});
