import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostById, getReplysuggestions } from '../services/postService'
import { getRepliesByPost, createReply } from '../services/replyService'
import { sendChatRequest } from '../services/chatService'
import { useAnon } from '../context/AnonContext'
import { useSocketContext } from '../context/SocketContext'
import Navbar from '../components/Navbar'
import { ArrowLeft, MessageCircle, Clock, MessageSquare, Send, Loader2, Sparkles, AlertCircle, MessagesSquare } from 'lucide-react'

const MAX_REPLY_CHARS = 500

const MOOD_META = {
  sad:         { emoji: '🩶', label: 'sad' },
  angry:       { emoji: '🔥', label: 'angry' },
  anxious:     { emoji: '🌀', label: 'anxious' },
  numb:        { emoji: '🫥', label: 'numb' },
  overwhelmed: { emoji: '🌊', label: 'overwhelmed' },
  hopeful:     { emoji: '🌱', label: 'hopeful' },
  confused:    { emoji: '🌫️', label: 'confused' },
}

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { anonId } = useAnon()
  const { socket } = useSocketContext()
  const [post, setPost] = useState(null)
  const [replies, setReplies] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [replyLoading, setReplyLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([getPostById(id), getRepliesByPost(id)])
      .then(([postRes, repliesRes]) => {
        setPost(postRes.data?.post ?? null)
        setReplies(repliesRes.data?.replies ?? [])
      })
      .catch((err) => setError(err.response?.data?.error ?? err.message ?? 'Failed to load post'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!post || post.anonymousId === anonId) return
    setSuggestionsLoading(true)
    getReplysuggestions(post._id)
      .then((res) => setSuggestions(res.data?.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false))
  }, [post])

  const handleChatRequest = async () => {
    if (post.anonymousId === anonId) return
    try {
      const res = await sendChatRequest(post._id, anonId, post.anonymousId)
      socket.current.emit('send_request', { requestId: res.data.request._id, authorId: post.anonymousId })
      setRequestSent(true)
    } catch (err) {
      setRequestError(err.response?.data?.error ?? 'Failed to send request')
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || replyLoading || !id) return
    setReplyLoading(true)
    setError('')
    try {
      await createReply(id, content.trim(), anonId)
      setContent('')
      const repliesRes = await getRepliesByPost(id)
      setReplies(repliesRes.data?.replies ?? [])
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to add reply')
    } finally {
      setReplyLoading(false)
    }
  }

  if (loading) return (
    <>
      <Navbar />
      <main className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>loading...</p>
      </main>
    </>
  )

  if (error && !post) return (
    <>
      <Navbar />
      <main className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
        <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </main>
    </>
  )

  if (!post) return null

  const isOwn = post.anonymousId === anonId
  const mood = MOOD_META[post.mood] ?? null

  return (
    <>
      <Navbar />
      <main className="page-wrap fade-up">

        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.85rem', marginBottom: '1rem',
            padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <ArrowLeft size={15} /> back
        </button>

        {/* Post card */}
        <section className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: 1.72, marginBottom: '0.75rem' }}>
            {post.content}
          </p>
          {post.imageUrl && (
            <img src={post.imageUrl} alt="drawing" style={{ width: '100%', borderRadius: '10px', marginBottom: '0.75rem', display: 'block', maxHeight: '300px', objectFit: 'contain', border: '1px solid var(--border)' }} />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {timeAgo(post.createdAt)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MessageSquare size={11} />
                {post.replyCount === 1 ? '1 reply' : `${post.replyCount} replies`}
              </span>
            </div>
            {mood && (
              <span className="info-chip" style={{ fontSize: '0.76rem' }}>
                {mood.emoji} {mood.label}
              </span>
            )}
          </div>
        </section>

        {/* Chat request */}
        {!isOwn && (
          <div style={{ marginBottom: '1rem' }}>
            {requestSent ? (
              <p style={{ color: 'var(--accent-light)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={14} /> chat request sent — waiting for response
              </p>
            ) : (
              <button type="button" onClick={handleChatRequest} className="ghost-btn" style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={15} /> talk privately
              </button>
            )}
            {requestError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertCircle size={12} /> {requestError}
              </p>
            )}
          </div>
        )}

        {/* Replies header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 className="section-kicker" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MessagesSquare size={13} /> replies
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{replies.length}</span>
        </div>

        {/* Empty replies */}
        {replies.length === 0 && (
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>no replies yet. be the first.</p>
          </div>
        )}

        {replies.map((reply) => (
          <div key={reply._id} className="glass-card" style={{ padding: '1rem', marginBottom: '0.6rem', borderLeft: '2px solid var(--border)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '0.35rem' }}>
              {reply.content}
            </p>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={10} /> {timeAgo(reply.createdAt)}
            </span>
          </div>
        ))}

        {/* Reply form */}
        <form onSubmit={handleReplySubmit} className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p className="section-kicker" style={{ marginBottom: '8px' }}>leave a reply</p>

          {!isOwn && (
            <div style={{ marginBottom: '0.75rem', minHeight: '32px' }}>
              {suggestionsLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={12} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} /> fetching suggestions...
                </p>
              ) : suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setContent(s)}
                      style={{
                        background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                        color: 'var(--accent-light)', borderRadius: '999px',
                        padding: '5px 12px', fontSize: '0.78rem', cursor: 'pointer',
                        transition: 'background 0.15s', display: 'flex', alignItems: 'center', gap: '5px',
                      }}
                    >
                      <Sparkles size={11} /> {s}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_REPLY_CHARS))}
            maxLength={MAX_REPLY_CHARS}
            placeholder="Write something kind..."
            style={{
              background: '#111119', color: 'var(--text-primary)',
              border: '1px solid var(--border)', padding: '14px',
              minHeight: '100px', width: '100%', fontSize: '15px',
              resize: 'vertical', outline: 'none', borderRadius: '10px', lineHeight: 1.6,
            }}
          />
          <div style={{ color: content.length > 450 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'right', marginTop: '0.3rem', marginBottom: '0.75rem' }}>
            {content.length} / {MAX_REPLY_CHARS}
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}
          <button
            type="submit"
            className="primary-btn"
            disabled={!content.trim() || replyLoading}
            style={{
              width: '100%', opacity: !content.trim() || replyLoading ? 0.6 : 1,
              cursor: !content.trim() || replyLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            {replyLoading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> posting...</>
              : <><Send size={15} /> post reply</>
            }
          </button>
        </form>

      </main>
    </>
  )
}