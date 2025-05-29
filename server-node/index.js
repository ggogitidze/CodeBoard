const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory session state
const sessions = {};

// --- Get Session State Endpoint ---
app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session.state);
});

// --- WebSocket Real-time Sync ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Parse sessionId from URL: /ws/board/:sessionId
  let sessionId = null;
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const match = url.pathname.match(/\/ws\/board\/(.+)$/);
    if (match) sessionId = match[1];
  } catch (e) {
    console.error('Failed to parse sessionId from URL:', req.url);
    ws.close();
    return;
  }
  if (!sessionId) {
    console.error('No sessionId found in URL:', req.url);
    ws.close();
    return;
  }
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      clients: new Set(),
      state: { strokes: [], textboxes: [], zoom: 1, code: '', language: '', guests: {} },
    };
  }
  const session = sessions[sessionId];
  session.clients.add(ws);

  ws.on('message', (msg) => {
    let m;
    try { m = JSON.parse(msg); } catch { return; }
    if (m.type === 'join') {
      if (m.guestName) session.state.guests[m.guestName] = true;
      ws.send(JSON.stringify({ type: 'update', payload: session.state }));
    } else if (m.type === 'update') {
      if (m.payload.strokes) session.state.strokes = m.payload.strokes;
      if (m.payload.textboxes) session.state.textboxes = m.payload.textboxes;
      if (m.payload.zoom) session.state.zoom = m.payload.zoom;
      if (m.payload.code !== undefined) session.state.code = m.payload.code;
      if (m.payload.language !== undefined) session.state.language = m.payload.language;
      // Broadcast to all except sender
      session.clients.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ type: 'update', payload: m.payload }));
        }
      });
    }
  });

  ws.on('close', () => {
    session.clients.delete(ws);
    // Optionally remove guest from session.state.guests
  });
});

// --- Piston Code Execution Proxy Endpoint ---
app.post('/api/execute', async (req, res) => {
  const { language, version, files, stdin, args, compile_timeout, run_timeout, compile_memory_limit, run_memory_limit } = req.body;
  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language,
      version,
      files,
      stdin,
      args,
      compile_timeout,
      run_timeout,
      compile_memory_limit,
      run_memory_limit
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Node.js server started on :${PORT}`);
}); 