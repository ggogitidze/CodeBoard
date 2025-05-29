import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import Whiteboard from './components/Whiteboard';
import CodeEditor from './components/CodeEditor';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function BoardWrapper() {
  const { sessionId } = useParams();
  const [guestName, setGuestName] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(`guestName-${sessionId}`);
    if (stored) {
      setGuestName(stored);
    } else {
      setShowPrompt(true);
    }
  }, [sessionId]);

  // Helper to sanitize input (strip HTML tags)
  function sanitizeInput(str) {
    return str.replace(/<[^>]*>?/gm, '');
  }

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const safeName = sanitizeInput(input.trim());
      setGuestName(safeName);
      localStorage.setItem(`guestName-${sessionId}`, safeName);
      setShowPrompt(false);
    }
  };

  return (
    <div className="min-h-screen h-screen bg-deepPurple font-inter text-white flex flex-col">
      <TopBar sessionId={sessionId} guestName={sanitizeInput(guestName)} />
      <div className="flex-1 flex overflow-hidden h-0">
        <div className="flex flex-1 h-full">
          <Whiteboard sessionId={sessionId} guestName={guestName} />
          <div className="flex flex-col flex-1 bg-surfacePurple rounded-tl-3xl p-4 h-full">
            <CodeEditor sessionId={sessionId} />
          </div>
        </div>
      </div>
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleNameSubmit} className="bg-surfacePurple rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[340px]">
            <label className="text-accentPurple text-lg mb-2 font-semibold">Enter your name</label>
            <input
              className="bg-deepPurple text-accentPurple font-mono rounded p-2 mb-4 focus:outline-none border border-accentPurple w-full"
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              maxLength={32}
              placeholder="Guest name"
            />
            <button type="submit" className="bg-accentPurple text-white px-4 py-2 rounded-lg shadow hover:bg-[#BFAAFF] transition text-sm font-bold">Join</button>
          </form>
        </div>
      )}
    </div>
  );
}

function RedirectToBoard() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const newId = uuidv4();
    navigate(`/board/${newId}`, { replace: true });
  }, [navigate]);
  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectToBoard />} />
        <Route path="/board/:sessionId" element={<BoardWrapper />} />
      </Routes>
    </Router>
  );
}

export default App;
