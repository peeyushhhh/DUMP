import { useState, useRef, useEffect, useCallback } from 'react';

const COLORS = [
  // whites / neutrals
  { value: '#ffffff', label: 'white' },
  { value: '#94a3b8', label: 'slate' },
  { value: '#1e1e2e', label: 'near-black' },
  // purples
  { value: '#a78bfa', label: 'violet' },
  { value: '#c084fc', label: 'pink-purple' },
  // neons
  { value: '#f0abfc', label: 'neon-pink' },
  { value: '#67e8f9', label: 'neon-cyan' },
  { value: '#86efac', label: 'neon-green' },
  { value: '#fde047', label: 'neon-yellow' },
  // pastels
  { value: '#fca5a5', label: 'pastel-red' },
  { value: '#fdba74', label: 'pastel-orange' },
  { value: '#6ee7b7', label: 'pastel-mint' },
  // darks
  { value: '#f87171', label: 'red' },
  { value: '#fb923c', label: 'orange' },
];

const BRUSH_TYPES = [
  { value: 'pen',         label: 'pen' },
  { value: 'marker',      label: 'marker' },
  { value: 'highlighter', label: 'hi-lite' },
  { value: 'eraser',      label: 'eraser' },
];

const MAX_UNDO = 20;

export default function DrawingCanvas({ onDrawingChange }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const lastPosRef  = useRef(null);
  const undoStack   = useRef([]);

  const [isDrawing,   setIsDrawing]   = useState(false);
  const [brushColor,  setBrushColor]  = useState('#ffffff');
  const [brushSize,   setBrushSize]   = useState(6);
  const [brushType,   setBrushType]   = useState('pen');
  const [opacity,     setOpacity]     = useState(100);
  const [isEmpty,     setIsEmpty]     = useState(true);

  // ── helpers ──────────────────────────────────────────────────────────────

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const applyBrushStyle = useCallback((ctx) => {
    const a = opacity / 100;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    switch (brushType) {
      case 'pen':
        ctx.globalAlpha         = a;
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth           = brushSize;
        ctx.strokeStyle         = brushColor;
        break;
      case 'marker':
        ctx.globalAlpha         = Math.min(a, 0.55);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth           = brushSize * 2.5;
        ctx.strokeStyle         = brushColor;
        break;
      case 'highlighter':
        ctx.globalAlpha         = Math.min(a, 0.25);
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth           = brushSize * 4;
        ctx.strokeStyle         = brushColor;
        ctx.lineCap             = 'square';
        break;
      case 'eraser':
        ctx.globalAlpha         = 1;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth           = brushSize * 2;
        ctx.strokeStyle         = 'rgba(0,0,0,1)';
        break;
    }
  }, [brushColor, brushSize, brushType, opacity]);

  const resetCtx = (ctx) => {
    ctx.globalAlpha              = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top)  * scaleY,
    };
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }, []);

  const saveUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stack = undoStack.current;
    if (stack.length >= MAX_UNDO) stack.shift();
    stack.push(canvas.toDataURL());
  }, []);

  const exportDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onDrawingChange) return;
    canvas.toBlob((blob) => onDrawingChange(blob), 'image/webp', 0.8);
  }, [onDrawingChange]);

  // ── init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const w = container.offsetWidth;
    const h = Math.round(w / 2);
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);
  }, []);

  // ── draw events ───────────────────────────────────────────────────────────

  const handleStart = (e) => {
    if (e.touches) e.preventDefault();
    saveUndo();
    const { x, y } = getCoords(e);
    setIsDrawing(true);
    lastPosRef.current = { x, y };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    applyBrushStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    resetCtx(ctx);
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const { x, y } = getCoords(e);
    const last = lastPosRef.current;
    if (!last) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    applyBrushStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    resetCtx(ctx);
    lastPosRef.current = { x, y };
  };

  const handleEnd = (e) => {
    if (e.touches) e.preventDefault();
    lastPosRef.current = null;
    setIsDrawing(false);
    setIsEmpty(false);
    exportDrawing();
  };

  // ── actions ───────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !undoStack.current.length) return;
    const dataUrl = undoStack.current.pop();
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      exportDrawing();
    };
    img.src = dataUrl;
  }, [exportDrawing]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    saveUndo();
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onDrawingChange?.(null);
  }, [onDrawingChange, saveUndo]);

  // ── styles ────────────────────────────────────────────────────────────────

  const panel = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(139,92,246,0.18)',
    borderRadius: '10px',
    backdropFilter: 'blur(8px)',
    padding: '0.75rem 1rem',
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const label = { color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase' };

  const row = { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' };

  const sliderStyle = {
    WebkitAppearance: 'none',
    appearance: 'none',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(139,92,246,0.35)',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#8b5cf6',
  };

  return (
    <div style={{ width: '100%' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        add a drawing (optional)
      </p>

      {/* canvas */}
      <div ref={containerRef} style={{ width: '100%', maxWidth: '600px', aspectRatio: '2 / 1' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart} onMouseMove={handleMove}
          onMouseUp={handleEnd}    onMouseLeave={handleEnd}
          onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
          style={{
            width: '100%', height: '100%', display: 'block',
            border: '1px solid var(--border)', borderRadius: '8px',
            background: '#111111', touchAction: 'none',
            cursor: brushType === 'eraser' ? 'cell' : 'crosshair',
          }}
        />
      </div>

      {/* controls panel */}
      <div style={panel}>

        {/* row 1 — brush type */}
        <div style={row}>
          <span style={{ ...label, minWidth: '3rem' }}>brush</span>
          {BRUSH_TYPES.map((b) => (
            <button key={b.value} type="button" onClick={() => setBrushType(b.value)} style={{
              padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '5px', cursor: 'pointer',
              background: brushType === b.value ? '#8b5cf6' : 'rgba(255,255,255,0.06)',
              color: brushType === b.value ? '#fff' : 'var(--text-muted)',
              border: brushType === b.value ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s',
            }}>
              {b.label}
            </button>
          ))}
        </div>

        {/* row 2 — color palette */}
        <div style={row}>
          <span style={{ ...label, minWidth: '3rem' }}>color</span>
          {COLORS.map((c) => (
            <button key={c.value} type="button" onClick={() => setBrushColor(c.value)} aria-label={c.label} style={{
              width: '18px', height: '18px', borderRadius: '50%', background: c.value, padding: 0,
              cursor: 'pointer', flexShrink: 0,
              border: brushColor === c.value ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.12)',
              boxShadow: brushColor === c.value ? '0 0 0 2px rgba(139,92,246,0.4)' : 'none',
              transition: 'all 0.12s',
            }} />
          ))}
        </div>

        {/* row 3 — size + opacity sliders */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '140px' }}>
            <span style={label}>size</span>
            <input type="range" min={1} max={40} value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ ...sliderStyle, flex: 1 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: '1.5rem' }}>{brushSize}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '140px' }}>
            <span style={label}>opacity</span>
            <input type="range" min={10} max={100} value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ ...sliderStyle, flex: 1 }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', minWidth: '2rem' }}>{opacity}%</span>
          </div>
        </div>

        {/* row 4 — undo / clear */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={undo} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-muted)', fontSize: '0.75rem', borderRadius: '5px',
            padding: '0.2rem 0.65rem', cursor: 'pointer',
          }}>↩ undo</button>
          <button type="button" onClick={clear} style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer',
          }}>clear</button>
        </div>

      </div>
    </div>
  );
}