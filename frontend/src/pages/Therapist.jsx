import { useState, useRef, useEffect } from 'react'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const WELCOME = {
  role: 'assistant',
  content: "oh, you actually showed up. brave. or desperate. probably both. what's going on?",
}

export default function Therapist() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/v1/therapist/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "something broke. ironic, right." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "lost connection. the universe is ignoring you too, apparently." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0d0a0a 0%, #120a0f 50%, #0d0a0a 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem 0.75rem',
        borderBottom: '1px solid #2a1a1a',
        background: 'rgba(13,10,10,0.95)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #c2410c, #9f1239)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0,
        }}>
          🛋️
        </div>
        <div>
          <div style={{ color: '#f5c4a1', fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em' }}>
            your therapist
          </div>
          <div style={{ color: '#6b3030', fontSize: '11px', marginTop: '1px' }}>
            definitely not a licensed professional
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#f97316',
            boxShadow: '0 0 6px #f97316',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.25rem 1rem',
        paddingBottom: '9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxWidth: '640px',
        width: '100%',
        margin: '0 auto',
      }}>
        {messages.map((m, i) => (
          <Message key={i} message={m} />
        ))}

        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed',
        bottom: '60px',
        left: 0,
        right: 0,
        padding: '0.75rem 1rem',
        background: 'rgba(13,10,10,0.97)',
        borderTop: '1px solid #2a1a1a',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="dump it here..."
            rows={1}
            style={{
              flex: 1,
              background: '#1a0f0f',
              border: '1px solid #3d1a1a',
              borderRadius: '12px',
              padding: '0.7rem 1rem',
              color: '#f5e6d8',
              fontSize: '14px',
              fontFamily: "'Space Grotesk', sans-serif",
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflowY: 'auto',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#c2410c'}
            onBlur={e => e.target.style.borderColor = '#3d1a1a'}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #c2410c, #9f1239)'
                : '#2a1a1a',
              color: input.trim() && !loading ? '#fff' : '#4a2a2a',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s',
              marginBottom: '2px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div style={{ textAlign: 'center', color: '#3d2020', fontSize: '10px', marginTop: '6px', maxWidth: '640px', margin: '6px auto 0' }}>
          ephemeral — this conversation disappears when you leave
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a1a1a; border-radius: 4px; }
      `}</style>
    </div>
  )
}

function Message({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeSlideIn 0.25s ease-out',
    }}>
      <div style={{
        maxWidth: '78%',
        padding: '0.65rem 1rem',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #c2410c, #9f1239)'
          : '#1a0f0f',
        border: isUser ? 'none' : '1px solid #2a1a1a',
        color: isUser ? '#fff' : '#f5c4a1',
        fontSize: '14px',
        lineHeight: '1.55',
        letterSpacing: '0.01em',
      }}>
        {message.content}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeSlideIn 0.2s ease-out' }}>
      <div style={{
        background: '#1a0f0f',
        border: '1px solid #2a1a1a',
        borderRadius: '16px 16px 16px 4px',
        padding: '0.65rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#7a4040',
        fontSize: '12px',
        fontStyle: 'italic',
      }}>
        <span>your therapist is judging you</span>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'inline-block',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#c2410c',
            animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}