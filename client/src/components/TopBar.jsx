import { useState, useEffect } from 'react';
import { UserCircleIcon, PlusIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TopBar({ guestName, sessionId }) {
  const [showInvite, setShowInvite] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [boardName, setBoardName] = useState('Unnamed');
  const [editing, setEditing] = useState(false);
  const url = window.location.href;

  // Load board name from localStorage (per session)
  useEffect(() => {
    if (!sessionId) return;
    const saved = localStorage.getItem(`instructor-board-name-${sessionId}`);
    if (saved) setBoardName(saved);
  }, [sessionId]);

  // Save board name to localStorage (per session)
  useEffect(() => {
    if (!sessionId) return;
    localStorage.setItem(`instructor-board-name-${sessionId}`, boardName);
  }, [boardName, sessionId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Helper to sanitize input (strip HTML tags)
  function sanitizeInput(str) {
    return str.replace(/<[^>]*>?/gm, '');
  }

  const handleNameChange = (e) => {
    setBoardName(sanitizeInput(e.target.value));
  };

  const handleNameBlur = () => {
    setEditing(false);
    if (!boardName.trim()) setBoardName('Unnamed');
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      setEditing(false);
      if (!boardName.trim()) setBoardName('Unnamed');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between px-2 sm:px-4 md:px-6 py-3 md:py-4 bg-[#18122B] border-b border-[#28204a] relative">
        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0 w-full sm:w-auto">
          <span className="text-lg sm:text-xl font-bold text-[#BFAAFF]">INSTRUCTOR BOARD:</span>
          {editing ? (
            <input
              className="bg-[#28204a] text-xs px-2 py-1 rounded-lg ml-2 text-[#BFAAFF] border border-[#393053] focus:outline-none focus:border-[#BFAAFF] transition w-24 sm:w-32 font-semibold"
              value={boardName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              autoFocus
              maxLength={32}
            />
          ) : (
            <span
              className="bg-[#28204a] text-xs px-2 py-1 rounded-lg ml-2 text-[#BFAAFF] font-semibold cursor-pointer hover:border-[#BFAAFF] border border-transparent transition w-24 sm:w-32 truncate"
              title="Click to edit board name"
              onClick={() => setEditing(true)}
            >
              {sanitizeInput(boardName)}
            </span>
          )}
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none">
          <div className="bg-[#28204a] px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl shadow border border-[#393053] flex items-center">
            <span className="text-lg sm:text-2xl font-extrabold text-[#BFAAFF] tracking-wide select-none" style={{letterSpacing:'0.08em'}}>CodeBoard</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
          <button className="flex items-center gap-2 bg-[#BFAAFF] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#9F91CC] transition" onClick={() => setShowInvite(true)}>
            <PlusIcon className="h-5 w-5" />
            INVITE
          </button>
          <GlobeAltIcon className="h-6 w-6 text-[#BFAAFF] hover:drop-shadow-glow cursor-pointer" />
          <UserCircleIcon className="h-8 w-8 text-white hover:text-[#BFAAFF] hover:drop-shadow-glow cursor-pointer" onClick={() => setShowProfile(true)} />
        </div>
      </div>
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#28204a] rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[340px] relative border border-[#393053]">
            <button className="absolute top-3 right-3 text-[#BFAAFF] hover:text-white" onClick={() => setShowInvite(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
            <div className="mb-4">
              {/* QRCode component removed */}
            </div>
            <label className="text-[#BFAAFF] text-xs mb-1 font-semibold">Copy Link</label>
            <div className="flex w-full gap-2 items-center">
              <textarea
                className="flex-1 bg-[#18122B] text-[#BFAAFF] font-mono rounded p-2 resize-none focus:outline-none border border-[#393053]"
                value={url}
                readOnly
                rows={2}
                style={{ minWidth: 0 }}
              />
              <button
                className="bg-[#BFAAFF] text-white px-3 py-2 rounded-lg shadow hover:bg-[#9F91CC] transition text-xs font-bold"
                onClick={handleCopy}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#28204a] rounded-2xl shadow-2xl p-8 flex flex-col items-center min-w-[300px] relative border border-[#393053]">
            <button className="absolute top-3 right-3 text-[#BFAAFF] hover:text-white" onClick={() => setShowProfile(false)}>
              <XMarkIcon className="h-6 w-6" />
            </button>
            <UserCircleIcon className="h-16 w-16 text-[#BFAAFF] mb-4" />
            <div className="text-[#BFAAFF] text-lg font-bold mb-2">Username</div>
            <div className="text-white text-base font-mono bg-[#18122B] px-4 py-2 rounded-lg border border-[#393053]">{guestName || 'Unknown'}</div>
          </div>
        </div>
      )}
    </>
  );
} 