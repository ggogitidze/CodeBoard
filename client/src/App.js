import React, { useState, useEffect, useRef } from 'react';
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
  const [whiteboardWidth, setWhiteboardWidth] = useState(40); // percentage
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(`guestName-${sessionId}`);
    if (stored) {
      setGuestName(stored);
    } else {
      setShowPrompt(true);
    }
    
    // Load whiteboard width from localStorage
    const savedWidth = localStorage.getItem(`whiteboardWidth-${sessionId}`);
    if (savedWidth) {
      setWhiteboardWidth(parseFloat(savedWidth));
    }
  }, [sessionId]);

  // Save whiteboard width to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem(`whiteboardWidth-${sessionId}`, whiteboardWidth.toString());
    }
  }, [whiteboardWidth, sessionId]);

  // Horizontal drag logic
  useEffect(() => {
    if (!isDraggingHorizontal) return;
    
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.max(20, Math.min(80, newWidth)); // 20% to 80% range
      setWhiteboardWidth(clampedWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal]);

  const startHorizontalDrag = () => {
    setIsDraggingHorizontal(true);
  };

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
        <div ref={containerRef} className="flex flex-1 h-full">
          <div style={{ width: `${whiteboardWidth}%` }} className="flex-shrink-0">
            <Whiteboard sessionId={sessionId} guestName={guestName} />
          </div>
          {/* Horizontal resizer */}
          <div
            onMouseDown={startHorizontalDrag}
            className="w-1 bg-[#28204a] hover:bg-[#393053] cursor-col-resize flex-shrink-0 transition-colors relative group"
            style={{ minWidth: '4px' }}
          >
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className="w-1 h-8 bg-[#BFAAFF] rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex flex-col flex-1 bg-surfacePurple p-4 h-full min-w-0">
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
