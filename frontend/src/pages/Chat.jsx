import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import { getMessages } from '../services/chatService';
import Navbar from '../components/Navbar';

export default function Chat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { anonId } = useAnon();
  const { socket } = useSocketContext();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    getMessages(roomId)
      .then((res) => {
        setMessages(res.data?.messages ?? []);
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    const sock = socket?.current;
    if (!sock || !roomId) return;

    sock.emit('join_room', { roomId });

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    sock.on('receive_message', handleReceiveMessage);

    return () => {
      sock.off('receive_message', handleReceiveMessage);
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 300) return;

    const sock = socket?.current;
    if (sock) {
      sock.emit('send_message', {
        roomId,
        senderId: anonId,
        text: trimmed,
      });
    }
    setText('');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--text-muted)',
            paddingTop: '100px',
          }}
        >
          loading...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '2rem',
          paddingTop: '100px',
          maxWidth: '640px',
          margin: '0 auto',
          paddingBottom: '100px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.95rem',
            marginBottom: '1rem',
            padding: 0,
          }}
        >
          ← back
        </button>

        <h2
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '0.25rem',
          }}
        >
          private chat
        </h2>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.7rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          messages disappear after 24 hours
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {messages.map((msg) => {
            const isYou = msg.senderId === anonId;
            return (
              <div
                key={msg._id}
                style={{
                  alignSelf: isYou ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                }}
              >
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {isYou ? 'you' : 'them'}
                </p>
                <div
                  style={{
                    background: isYou ? 'var(--accent)' : '#222',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '12px',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1rem',
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.5rem',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            placeholder="Type a message..."
            maxLength={300}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            style={{
              background: 'var(--accent)',
              color: 'var(--text-primary)',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              opacity: text.trim() ? 1 : 0.5,
            }}
          >
            send
          </button>
        </form>
      </div>
    </>
  );
}
