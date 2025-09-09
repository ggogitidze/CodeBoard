import React, { useRef, useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, MagnifyingGlassPlusIcon, MinusCircleIcon, PencilSquareIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useBoardWebSocket } from '../hooks/useBoardWebSocket';

const TOOL = {
  PEN: 'pen',
  ERASER: 'eraser',
  TEXT: 'text',
};

const TOOLTIP = {
  pen: 'Draw',
  eraser: 'Erase',
  text: 'Add Textbox',
  undo: 'Undo',
  redo: 'Redo',
  zoomin: 'Zoom In',
  zoomout: 'Zoom Out',
  clear: 'Clear Board',
};

export default function Whiteboard({ sessionId, guestName }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState(TOOL.PEN);
  const [drawing, setDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [strokes, setStrokes] = useState([]); // {tool, color, width, points: [{x, y}]}
  const [redoStack, setRedoStack] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [textboxes, setTextboxes] = useState([]); // {id, x, y, w, h, text, selected, editing}
  const [addingTextbox, setAddingTextbox] = useState(false);
  const [draggingTextbox, setDraggingTextbox] = useState(null); // id
  const [resizingTextbox, setResizingTextbox] = useState(null); // id
  const [dragOffset, setDragOffset] = useState({x:0, y:0});
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // WebSocket real-time sync
  const { send } = useBoardWebSocket({
    sessionId,
    guestName,
    onRemoteUpdate: (payload) => {
      if (payload.strokes) setStrokes(payload.strokes);
      if (payload.textboxes) setTextboxes(payload.textboxes);
      if (payload.zoom) setZoom(payload.zoom);
    },
    onConnect: () => setWsConnected(true),
    onError: (err) => setWsError('WebSocket connection failed. Please refresh. (' + err + ')'),
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`board-${sessionId}`);
    if (saved) {
      const { strokes, textboxes, zoom } = JSON.parse(saved);
      setStrokes(strokes || []);
      setTextboxes(textboxes || []);
      setZoom(zoom || 1);
    }
    // Connect to WebSocket (placeholder)
    // ws = new WebSocket(`ws://localhost:8080/ws/board/${sessionId}`)
    // ... handle ws events ...
    return () => {
      // ws.close();
    };
  }, [sessionId]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      `board-${sessionId}`,
      JSON.stringify({ strokes, textboxes, zoom })
    );
  }, [strokes, textboxes, zoom, sessionId]);

  // Send updates to backend on local state change
  useEffect(() => {
    if (guestName && sessionId) {
      send('update', { strokes, textboxes, zoom });
    }
    // eslint-disable-next-line
  }, [strokes, textboxes, zoom]);

  useEffect(() => {
    setWsConnected(false);
    setWsError('');
  }, [sessionId, guestName]);

  // Helper to get mouse/touch position relative to canvas
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) / zoom;
      y = (e.touches[0].clientY - rect.top) / zoom;
    } else {
      x = (e.nativeEvent.offsetX) / zoom;
      y = (e.nativeEvent.offsetY) / zoom;
    }
    return { x, y };
  };

  // Start drawing/erasing
  const handlePointerDown = (e) => {
    if (tool === TOOL.TEXT && addingTextbox) {
      // Place new textbox
      const pos = getPos(e);
      setTextboxes((prev) => [
        ...prev.map(tb => ({ ...tb, selected: false })),
        {
          id: Date.now(),
          x: pos.x,
          y: pos.y,
          w: 120,
          h: 40,
          text: '',
          selected: true,
          editing: true,
        },
      ]);
      setAddingTextbox(false);
      return;
    }
    if (tool === TOOL.PEN || tool === TOOL.ERASER) {
      setDrawing(true);
      setRedoStack([]); // clear redo stack on new stroke
      const pos = getPos(e);
      const stroke = {
        tool,
        color: tool === TOOL.ERASER ? '#18122B' : '#9F91CC',
        width: tool === TOOL.ERASER ? 16 : 2,
        points: [pos],
      };
      setCurrentStroke(stroke);
    }
  };

  // Continue drawing/erasing
  const handlePointerMove = (e) => {
    if (!drawing || !currentStroke) return;
    const pos = getPos(e);
    setCurrentStroke((prev) => ({ ...prev, points: [...prev.points, pos] }));
  };

  // End drawing/erasing
  const handlePointerUp = () => {
    if (drawing && currentStroke) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
    setDrawing(false);
  };

  // Undo/Redo logic
  const handleUndo = () => {
    if (strokes.length === 0) return;
    setRedoStack((prev) => [strokes[strokes.length - 1], ...prev]);
    setStrokes((prev) => prev.slice(0, -1));
  };
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setStrokes((prev) => [...prev, redoStack[0]]);
    setRedoStack((prev) => prev.slice(1));
  };

  // Zoom logic
  const handleZoom = (inOrOut) => {
    setZoom(z => Math.max(0.5, Math.min(2, inOrOut === 'in' ? z * 1.2 : z / 1.2)));
  };

  // Clear logic
  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    setTextboxes([]);
  };

  // Redraw all strokes (grid is always redrawn and never erased)
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw all strokes (eraser only affects strokes, not grid)
    strokes.forEach(stroke => {
      ctx.beginPath();
      stroke.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
    // Draw current stroke
    if (currentStroke) {
      ctx.beginPath();
      currentStroke.points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  // Redraw on strokes/currentStroke/zoom change
  useEffect(() => {
    redraw();
    // eslint-disable-next-line
  }, [strokes, currentStroke, zoom]);

  // Hide placeholder if any strokes or textboxes exist
  const showPlaceholder = strokes.length === 0 && textboxes.length === 0 && !currentStroke;

  // Helper to sanitize input (strip HTML tags)
  function sanitizeInput(str) {
    return str.replace(/<[^>]*>?/gm, '');
  }

  // Textbox logic
  const handleTextboxChange = (id, value) => {
    setTextboxes((prev) => prev.map(tb => tb.id === id ? { ...tb, text: sanitizeInput(value) } : tb));
  };
  // Drag textbox
  const handleTextboxMouseDown = (e, id) => {
    e.stopPropagation();
    const tb = textboxes.find(tb => tb.id === id);
    if (!tb.editing) {
      setTextboxes((prev) => prev.map(t => ({ ...t, selected: t.id === id })));
    }
    setDraggingTextbox(id);
    setDragOffset({
      x: e.clientX - tb.x * zoom,
      y: e.clientY - tb.y * zoom,
    });
  };
  const handleTextboxMouseMove = (e) => {
    if (draggingTextbox) {
      setTextboxes((prev) => prev.map(tb => tb.id === draggingTextbox ? {
        ...tb,
        x: (e.clientX - dragOffset.x) / zoom,
        y: (e.clientY - dragOffset.y) / zoom,
      } : tb));
    }
    if (resizingTextbox) {
      const tb = textboxes.find(tb => tb.id === resizingTextbox);
      setTextboxes((prev) => prev.map(tb => tb.id === resizingTextbox ? {
        ...tb,
        w: Math.max(40, (e.clientX - tb.x * zoom) / zoom),
        h: Math.max(20, (e.clientY - tb.y * zoom) / zoom),
      } : tb));
    }
  };
  const handleTextboxMouseUp = () => {
    setDraggingTextbox(null);
    setResizingTextbox(null);
  };
  // Resize textbox
  const handleTextboxResizeMouseDown = (e, id) => {
    e.stopPropagation();
    setResizingTextbox(id);
  };
  // Make textbox non-editable on blur or Enter, and delete if empty
  const handleTextboxBlur = (id) => {
    setTextboxes((prev) => prev.filter(tb => tb.id !== id || tb.text.trim() !== '').map(tb => tb.id === id ? { ...tb, editing: false, selected: false } : tb));
  };
  const handleTextboxKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTextboxes((prev) => prev.filter(tb => tb.id !== id || tb.text.trim() !== '').map(tb => tb.id === id ? { ...tb, editing: false, selected: false } : tb));
    }
  };
  // Double click to edit
  const handleTextboxDoubleClick = (id) => {
    setTextboxes((prev) => prev.map(tb => tb.id === id ? { ...tb, editing: true, selected: true } : { ...tb, selected: false }));
  };

  useEffect(() => {
    if (draggingTextbox || resizingTextbox) {
      window.addEventListener('mousemove', handleTextboxMouseMove);
      window.addEventListener('mouseup', handleTextboxMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleTextboxMouseMove);
        window.removeEventListener('mouseup', handleTextboxMouseUp);
      };
    }
  });

  // Sidebar button with tooltip
  const SidebarButton = ({ onClick, active, children, tooltip }) => (
    <div className="relative group flex flex-col items-center">
      <button
        className={`p-2 rounded-lg ${active ? 'bg-accentPurple/20' : ''} hover:bg-accentPurple/20 hover:drop-shadow-glow transition`}
        onClick={onClick}
        tabIndex={0}
      >
        {children}
      </button>
      <span className="absolute left-12 top-1/2 -translate-y-1/2 bg-surfacePurple text-xs text-accentPurple px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition whitespace-nowrap z-50 pointer-events-none">
        {tooltip}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-[#18122B] border-r border-[#28204a] flex flex-row items-stretch relative min-w-0 overflow-x-auto h-full">
      {/* Sidebar toggle for mobile */}
      <button className="md:hidden absolute top-2 left-2 z-40 bg-[#28204a] text-[#BFAAFF] rounded p-2 shadow border border-[#393053]" onClick={()=>setSidebarOpen(v=>!v)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      {/* Sidebar */}
      <div className={`flex flex-row md:flex-col items-center py-2 md:py-6 px-2 gap-2 md:gap-4 bg-[#28204a] border-r border-[#393053] z-20 min-w-[48px] md:min-w-[64px] transition-all duration-200 ${sidebarOpen ? 'left-0' : '-left-40'} md:static fixed top-0 h-full md:h-auto`} style={{width: sidebarOpen ? 56 : 0}}>
        <SidebarButton onClick={()=>{setTool(TOOL.PEN); setAddingTextbox(false);}} active={tool===TOOL.PEN} tooltip={TOOLTIP.pen}>
          <PencilIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={()=>{setTool(TOOL.ERASER); setAddingTextbox(false);}} active={tool===TOOL.ERASER} tooltip={TOOLTIP.eraser}>
          <PencilSquareIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={()=>{setTool(TOOL.TEXT); setAddingTextbox(true);}} active={tool===TOOL.TEXT||addingTextbox} tooltip={TOOLTIP.text}>
          <PlusIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={handleUndo} tooltip={TOOLTIP.undo}>
          <ArrowUturnLeftIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={handleRedo} tooltip={TOOLTIP.redo}>
          <ArrowUturnRightIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={()=>handleZoom('in')} tooltip={TOOLTIP.zoomin}>
          <MagnifyingGlassPlusIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={()=>handleZoom('out')} tooltip={TOOLTIP.zoomout}>
          <MinusCircleIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
        <SidebarButton onClick={handleClear} tooltip={TOOLTIP.clear}>
          <TrashIcon className="h-6 w-6 text-accentPurple" />
        </SidebarButton>
      </div>
      {/* Whiteboard grid and canvas */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden min-w-0" style={{background:'#18122B'}} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
        {/* Loading/Error overlays */}
        {!wsConnected && !wsError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <span className="loader border-2 border-t-2 border-t-white border-white/30 rounded-full w-8 h-8 animate-spin mr-3"></span>
            <span className="text-accentPurple text-lg font-bold">Connecting...</span>
          </div>
        )}
        {wsError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-red-900/40 border border-red-700 rounded px-6 py-4 text-red-300 font-mono text-base shadow-xl">{wsError}</div>
          </div>
        )}
        {/* Canvas that fills the entire whiteboard area */}
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${1200 * zoom}px`,
            height: `${800 * zoom}px`,
            zIndex: 10,
            background: 'transparent',
            cursor: tool === TOOL.ERASER ? 'cell' : tool === TOOL.TEXT && addingTextbox ? 'copy' : 'crosshair',
          }}
        />
        {/* Render textboxes */}
        {textboxes.map(tb => (
          <div
            key={tb.id}
            style={{
              position: 'absolute',
              left: tb.x * zoom,
              top: tb.y * zoom,
              width: tb.w * zoom,
              height: tb.h * zoom,
              zIndex: 30,
              border: tb.selected && tb.editing ? '1.5px solid #9F91CC' : 'none',
              background: 'transparent',
              resize: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseDown={e => handleTextboxMouseDown(e, tb.id)}
            onDoubleClick={() => handleTextboxDoubleClick(tb.id)}
          >
            <textarea
              value={sanitizeInput(tb.text)}
              onChange={e => handleTextboxChange(tb.id, e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                color: '#9F91CC',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1rem',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: 4,
                pointerEvents: tb.editing ? 'auto' : 'none',
                userSelect: tb.editing ? 'auto' : 'none',
              }}
              placeholder="Type..."
              readOnly={!tb.editing}
              onBlur={() => handleTextboxBlur(tb.id)}
              onKeyDown={e => handleTextboxKeyDown(e, tb.id)}
              spellCheck={false}
            />
            {/* Resize handle */}
            {tb.editing && (
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: '#9F91CC',
                  borderRadius: 2,
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  cursor: 'nwse-resize',
                  zIndex: 40,
                }}
                onMouseDown={e => handleTextboxResizeMouseDown(e, tb.id)}
              />
            )}
          </div>
        ))}
        {/* Placeholder only if board is empty */}
        {showPlaceholder && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-accentPurple text-sm font-mono opacity-70 select-none pointer-events-none">Draw or write here...</span>
        )}
      </div>
      <style>{`.loader { border-right-color: transparent !important; }`}</style>
    </div>
  );
} 