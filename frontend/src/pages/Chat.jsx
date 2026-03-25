import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import { getMessages, getRoom } from '../services/chatService';
import Navbar from '../components/Navbar';

const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

function timeLeft(createdAt) {
  if (!createdAt) return null;
  const remaining = ROOM_TTL_MS - (Date.now() - createdAt);
  if (remaining <= 0) return 'expired';
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function Chat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { anonId } = useAnon();
  const { socket, registerRoom, updateRoomLastMessage, markRoomRead, activeRooms } = useSocketContext();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const roomMeta = activeRooms.find((r) => r.roomId === roomId);
  const tl = roomMeta ? timeLeft(roomMeta.createdAt) : null;
  const isExpired = tl === 'expired';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch room metadata + messages in parallel, register with REAL DB createdAt
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);

    Promise.all([
      getRoom(roomId).catch(() => null),
      getMessages(roomId).catch(() => ({ messages: [] })),
    ]).then(([roomData, msgData]) => {
      // Use DB createdAt so the 24h timer is accurate across page reloads + incognito
      const dbCreatedAt = roomData?.room?.createdAt
        ? new Date(roomData.room.createdAt).getTime()
        : Date.now();

      registerRoom(roomId, { createdAt: dbCreatedAt });
      markRoomRead(roomId);
      setMessages(msgData?.messages ?? []);
    }).finally(() => {
      setLoading(false);
    });
  }, [roomId]);

  // Socket: join + listen
  useEffect(() => {
    const sock = socket?.current;
    if (!sock || !roomId) return;
    sock.emit('join_room', { roomId });

    const handleReceiveMessage = (message) => {
      if (message.roomId && message.roomId.toString() !== roomId) return;
      setMessages((prev) => [...prev, message]);
      updateRoomLastMessage(roomId, message.text);
    };

    sock.on('receive_message', handleReceiveMessage);
    return () => sock.off('receive_message', handleReceiveMessage);
  }, [socket, roomId]);

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { markRoomRead(roomId); }, [roomId, messages.length]);

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300 || isExpired) return;
    const sock = socket?.current;
    if (sock) {
      sock.emit('send_message', { roomId, senderId: anonId, text: trimmed });
      updateRoomLastMessage(roomId, trimmed);
    }
    setText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '32px', height: '32px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>loading chat...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="page-wrap fade-up" style={{ paddingBottom: '80px' }}>

        {/* Sticky header */}
        <section style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(8,8,12,0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 0', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: '1.1rem', padding: '4px 8px 4px 0',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >←</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: 'var(--text-primary)', fontSize: '0.92rem',
              fontWeight: 600, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              anon · {roomId.slice(-6)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '2px 0 0' }}>
              private · end-to-end anonymous
            </p>
          </div>

          {tl && (
            <span style={{
              fontSize: '0.68rem',
              color: isExpired ? 'var(--danger)'
                : tl.includes('m left') && !tl.includes('h') ? '#f59e0b'
                : 'var(--text-muted)',
              border: `1px solid ${isExpired ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
              borderRadius: '999px', padding: '3px 9px',
              whiteSpace: 'nowrap', flexShrink: 0,
              fontWeight: isExpired ? 600 : 400,
            }}>
              {isExpired ? '⛔ expired' : `⏱ ${tl}`}
            </span>
          )}
        </section>

        {/* Expired banner */}
        {isExpired && (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px', padding: '10px 14px',
            marginBottom: '1rem', fontSize: '0.82rem',
            color: '#f87171', textAlign: 'center',
          }}>
            this conversation has expired and is now read-only
          </div>
        )}

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {messages.length === 0 && !isExpired && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👋</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                no messages yet. say something.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isYou = msg.senderId === anonId;
            const prevMsg = messages[i - 1];
            const showLabel = !prevMsg || prevMsg.senderId !== msg.senderId;
            return (
              <div
                key={msg._id || i}
                style={{
                  alignSelf: isYou ? 'flex-end' : 'flex-start',
                  maxWidth: '76%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: isYou ? 'flex-end' : 'flex-start',
                  gap: '3px',
                  marginTop: showLabel && i > 0 ? '8px' : '0',
                }}
              >
                {showLabel && (
                  <span style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    letterSpacing: '0.04em',
                    paddingLeft: isYou ? 0 : '4px',
                    paddingRight: isYou ? '4px' : 0,
                  }}>
                    {isYou ? 'you' : 'them'}
                  </span>
                )}
                <div style={{
                  background: isYou
                    ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                    : 'var(--bg-elevated, #0f0f14)',
                  color: isYou ? '#fff' : 'var(--text-primary)',
                  padding: '10px 14px',
                  borderRadius: isYou ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: '0.9rem', lineHeight: 1.55,
                  border: isYou ? 'none' : '1px solid var(--border)',
                  boxShadow: isYou ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input bar */}
      {!isExpired && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '10px 16px',
          background: 'rgba(8,8,12,0.96)',
          borderTop: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          display: 'flex', gap: '8px',
          maxWidth: '760px', margin: '0 auto',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, 300));
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="say something... (enter to send)"
              maxLength={300}
              rows={1}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.9rem', outline: 'none',
                resize: 'none', lineHeight: 1.5,
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 150ms ease',
                display: 'block',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
            {text.length > 240 && (
              <span style={{
                position: 'absolute', bottom: '8px', right: '10px',
                fontSize: '0.65rem',
                color: text.length > 280 ? 'var(--danger)' : 'var(--text-muted)',
                pointerEvents: 'none',
              }}>
                {300 - text.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim()}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: text.trim()
                ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)'
                : 'var(--bg-card)',
              border: text.trim() ? 'none' : '1px solid var(--border)',
              color: text.trim() ? '#fff' : 'var(--text-muted)',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', flexShrink: 0,
              transition: 'background 150ms ease, transform 100ms ease',
              boxShadow: text.trim() ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
            }}
            onMouseEnter={(e) => { if (text.trim()) e.currentTarget.style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >↑</button>
        </div>
      )}
    </>
  );
}