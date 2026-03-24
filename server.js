const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Dynamic PORT for Render / Railway / Fly.io
const PORT = process.env.PORT || 3000;

const AUDIO_FOLDER = path.join(__dirname, 'audio');

// Serve all audio files statically
app.use('/audio', express.static(AUDIO_FOLDER));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'GSM IVR Backend Running ✅', 
    port: PORT,
    message: 'Ready for Android GSM IVR'
  });
});

// DTMF Handler - Main endpoint from Android
app.post('/dtmf', (req, res) => {
  const { digit, sessionId = 'unknown' } = req.body;

  if (!digit) {
    return res.status(400).json({ error: 'Digit is required' });
  }

  console.log(`[${new Date().toISOString()}] DTMF: ${digit} | Session: ${sessionId}`);

  // Full mapping from your Python IVR logic
  const audioMap = {
    'welcome': '01_Welcome_Intro.wav',
    '1': '03_Opt1_Automation_Intro.wav',
    '2': '04_Opt2_AppDev_Intro.wav',
    '3': '05_Opt3_Web_Intro.wav',
    '4': '06_Opt4_CustomSoft_Intro.wav',
    '5': '07_Opt5_IoT_Intro.wav',
    '9': '08_Opt9_Direct_Connect.wav',
    'invalid': '10_Invalid_Input.wav',
    'end': '11_Call_End.wav',
    // Direct digit mapping for menu
    '01': '01_Welcome_Intro.wav',
    '02': '02_Main_Menu.wav'
  };

  let fileName = audioMap[digit];

  // If direct digit pressed in main menu
  if (!fileName && ['1','2','3','4','5','9'].includes(digit)) {
    fileName = audioMap[digit];
  }

  // Fallbacks
  if (!fileName) {
    fileName = '10_Invalid_Input.wav';
    console.log(`⚠️ Unknown digit ${digit} → fallback to invalid`);
  }

  const filePath = path.join(AUDIO_FOLDER, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Audio file missing: ${fileName}`);
    return res.status(404).json({ 
      error: 'Audio file not found', 
      requested: fileName 
    });
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const audioUrl = `${protocol}://${host}/audio/${encodeURIComponent(fileName)}`;

  console.log(`🎵 Streaming: ${fileName} → ${audioUrl}`);

  res.json({
    status: 'success',
    digit: digit,
    audioUrl: audioUrl,
    fileName: fileName,
    message: `Playing ${fileName}`
  });
});

// Bonus: Get all available audio files
app.get('/audio-list', (req, res) => {
  try {
    const files = fs.readdirSync(AUDIO_FOLDER)
      .filter(f => f.endsWith('.wav') || f.endsWith('.mp3'))
      .sort();
    res.json({ 
      total: files.length,
      audioFiles: files 
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list audio files' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GSM IVR Backend started on port ${PORT}`);
  console.log(`📢 Audio base URL: http://localhost:${PORT}/audio/`);
  console.log(`📡 Test DTMF: POST /dtmf with { "digit": "2" }`);
});
