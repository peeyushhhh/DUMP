import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function timeLeft(createdAt) {
  const remaining = ROOM_TTL_MS - (Date.now() - createdAt);
  if (remaining <= 0) return 'expired';
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h left`;
  return `${m}m left`;
}

export default function DMInbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRooms, removeRoom, notifications } = useSocketContext();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  // Don't render on chat page itself — already visible
  const onChatPage = location.pathname.startsWith('/chat/');

  // Auto-close when navigating
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click and Escape
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event) => {
      const panelEl = panelRef.current;
      const toggleEl = toggleRef.current;
      if (!panelEl || !toggleEl) return;

      const target = event.target;
      if (panelEl.contains(target) || toggleEl.contains(target)) return;

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (activeRooms.length === 0) return null;

  // Total unread across all rooms
  const totalUnread = activeRooms.reduce((sum, r) => sum + (r.unread || 0), 0);

  return (
    <>
      {/* Floating bubble */}
      {!onChatPage && (
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            position: 'fixed',
            bottom: '88px', // above bottom nav
            right: '16px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: '2px solid rgba(139,92,246,0.5)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            zIndex: 200,
            transition: 'transform 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.45)';
          }}
        >
          💬
          {totalUnread > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg)',
            }}>
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Drawer */}
      {open && !onChatPage && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 198,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              bottom: '152px',
              right: '16px',
              width: '300px',
              zIndex: 199,
              background: 'var(--bg-elevated, #0f0f14)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              animation: 'dmSlideUp 180ms ease both',
            }}
          >
            <style>{`
              @keyframes dmSlideUp {
                from { opacity: 0; transform: translateY(12px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>

            {/* Header */}
            <div style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  active dms
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {activeRooms.length} conversation{activeRooms.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Room list */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {activeRooms.map((room, i) => {
                const tl = timeLeft(room.createdAt);
                const isExpired = tl === 'expired';
                const shortId = room.roomId.slice(-6);

                return (
                  <div
                    key={room.roomId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '11px 14px',
                      borderBottom: i < activeRooms.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: isExpired ? 0.45 : 1,
                      cursor: isExpired ? 'default' : 'pointer',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpired) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => {
                      if (isExpired) {
                        removeRoom(room.roomId);
                        return;
                      }
                      setOpen(false);
                      navigate(`/chat/${room.roomId}`);
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c3aed44, #8b5cf622)',
                      border: '1px solid rgba(139,92,246,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      #{shortId}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          anon · {shortId}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          color: isExpired ? 'var(--danger)' : 'var(--text-muted)',
                          flexShrink: 0,
                          marginLeft: '6px',
                        }}>
                          {tl}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {isExpired
                          ? 'this chat has expired'
                          : room.lastMessage
                            ? room.lastMessage
                            : 'tap to open chat'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {(room.unread || 0) > 0 && (
                      <span style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {room.unread > 9 ? '9+' : room.unread}
                      </span>
                    )}

                    {/* Remove expired */}
                    {isExpired && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeRoom(room.roomId); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          padding: '4px',
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}