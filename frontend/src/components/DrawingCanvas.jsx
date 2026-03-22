import { useState, useRef, useEffect, useCallback } from 'react';

const COLORS = [
  { value: '#ffffff', label: 'white' },
  { value: '#a78bfa', label: 'purple' },
  { value: '#f87171', label: 'red' },
];

const BRUSH_SIZES = [
  { value: 3, label: 'S' },
  { value: 8, label: 'L' },
];

export default function DrawingCanvas({ onDrawingChange }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [isEmpty, setIsEmpty] = useState(true);

  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawLine = useCallback(
    (fromX, fromY, toX, toY) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    },
    [brushColor, brushSize]
  );

  const exportDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onDrawingChange) return;
    canvas.toBlob(
      (blob) => {
        onDrawingChange(blob);
      },
      'image/webp',
      0.8
    );
  }, [onDrawingChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onDrawingChange?.(null);
  }, [onDrawingChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = Math.round(width / 2);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, width, height);
  }, []);

  const lastPosRef = useRef(null);

  const handleStart = (e) => {
    if (e.touches) e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    lastPosRef.current = { x, y };
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const last = lastPosRef.current;
    if (last) {
      drawLine(last.x, last.y, x, y);
      lastPosRef.current = { x, y };
    }
  };
  

  const handleEnd = (e) => {
    if (e.touches) e.preventDefault();
    lastPosRef.current = null;
    setIsDrawing(false);
    setIsEmpty(false);
    exportDrawing();
  };

  return (
    <div style={{ width: '100%' }}>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          marginBottom: '0.5rem',
        }}
      >
        add a drawing (optional)
      </p>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '2 / 1',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: '#111111',
            touchAction: 'none',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setBrushColor(c.value)}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: c.value,
                border: brushColor === c.value ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={c.label}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBrushSize(b.value)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                background: brushSize === b.value ? 'var(--accent-dim)' : 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={clear}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          clear
        </button>
      </div>
    </div>
  );
}
