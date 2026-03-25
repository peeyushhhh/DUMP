import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAnon } from '../context/AnonContext'
import { getPosts, deletePost } from '../services/postService'
import Navbar from '../components/Navbar'

function timeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const s = Math.floor((now - date) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

const MOOD_MAP = {
  sad:         { emoji: '😢', label: 'sad',         color: '#6366f1' },
  angry:       { emoji: '😤', label: 'angry',       color: '#ef4444' },
  anxious:     { emoji: '😰', label: 'anxious',     color: '#f59e0b' },
  numb:        { emoji: '😶', label: 'numb',        color: '#6b7280' },
  overwhelmed: { emoji: '🌊', label: 'overwhelmed', color: '#06b6d4' },
  hopeful:     { emoji: '🌱', label: 'hopeful',     color: '#22c55e' },
  confused:    { emoji: '😵‍💫', label: 'confused',   color: '#a855f7' },
}

function groupByDate(posts) {
  const groups = {}
  posts.forEach((p) => {
    const key = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  })
  return Object.entries(groups)
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

function StatsBar({ posts }) {
  const counts = {}
  posts.forEach((p) => { if (p.mood) counts[p.mood] = (counts[p.mood] || 0) + 1 })
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (!entries.length) return null

  return (
    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {entries.map(([mood, count]) => {
        const m = MOOD_MAP[mood]
        if (!m) return null
        return (
          <span key={mood} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1rem' }}>{m.emoji}</span>
            <span style={{
              fontSize: '0.7rem',
              color: m.color,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}>
              {count}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function PostCard({ post, onDelete, deletingId, index }) {
  const navigate = useNavigate()
  const mood = MOOD_MAP[post.mood] || null

  return (
    <article
      onClick={() => navigate(`/post/${post._id}`)}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '0.9rem 1rem 0.9rem 1.1rem',
        borderLeft: `2px solid ${mood?.color ?? '#8b5cf6'}`,
        cursor: 'pointer',
        position: 'relative',
        animation: `slideInLeft 320ms cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${index * 55}ms`,
        transition: 'opacity 140ms ease',
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.72'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <div style={{
        fontSize: '32px',
        lineHeight: 1,
        flexShrink: 0,
        marginTop: '2px',
        userSelect: 'none',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
      }}>
        {mood?.emoji ?? '◦'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          lineHeight: 1.55,
          marginBottom: '0.3rem',
          paddingRight: '28px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {post.content}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.71rem', color: 'var(--text-muted)', alignItems: 'center' }}>
          <span>{timeAgo(post.createdAt)}</span>
          {post.replyCount > 0 && (
            <span style={{ opacity: 0.6 }}>
              {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(post._id) }}
        disabled={deletingId === post._id}
        style={{
          position: 'absolute',
          top: '10px',
          right: '0px',
          background: 'none',
          border: 'none',
          color: deletingId === post._id ? 'var(--text-muted)' : 'var(--danger)',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.35,
          transition: 'opacity 120ms ease',
          lineHeight: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.35'}
        aria-label="delete"
      >
        {deletingId === post._id
          ? <span style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>…</span>
          : <TrashIcon />}
      </button>
    </article>
  )
}

const EMPTY_LINES = [
  "the void is empty. good or bad, idk.",
  "nothing here. must be nice.",
  "no dumps yet. are you okay? (don't answer that)",
  "clean slate. enjoy it while it lasts.",
]

export default function MyPosts() {
  const { anonId } = useAnon()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const emptyLine = useRef(EMPTY_LINES[Math.floor(Math.random() * EMPTY_LINES.length)])

  useEffect(() => {
    getPosts(1, 50)
      .then((res) => {
        const all = res.data?.posts ?? []
        setPosts(all.filter((p) => p.anonymousId === anonId))
      })
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false))
  }, [anonId])

  const handleDelete = async (postId) => {
    setDeletingId(postId)
    try {
      await deletePost(postId, anonId)
      setPosts((prev) => prev.filter((p) => p._id !== postId))
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const grouped = groupByDate(posts)
  let cardIndex = 0

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <Navbar />

      <main className="page-wrap" style={{ maxWidth: '640px' }}>

        {/* ── Header ── */}
        <div style={{
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#8b5cf6',
            marginBottom: '0.6rem',
            opacity: 0.7,
          }}>
            private · anonymous · yours
          </p>

          <h1 style={{
            fontSize: 'clamp(2.6rem, 8vw, 3.6rem)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            lineHeight: 0.9,
            margin: '0 0 0.8rem',
            letterSpacing: '-0.05em',
          }}>
            the dump<br />
            <span style={{
              color: 'transparent',
              WebkitTextStroke: '1.5px #8b5cf6',
              opacity: 0.6,
            }}>archive.</span>
          </h1>

          {!loading && posts.length > 0 && (
            <p style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              letterSpacing: '0.01em',
            }}>
              {posts.length} {posts.length === 1 ? 'moment' : 'moments'} you actually felt something
            </p>
          )}

          {!loading && posts.length > 0 && <StatsBar posts={posts} />}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            fontStyle: 'italic',
            animation: 'flicker 1.4s ease-in-out infinite',
          }}>
            pulling your demons…
          </p>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <p style={{
            color: 'var(--danger)',
            fontSize: '0.82rem',
            borderLeft: '2px solid var(--danger)',
            paddingLeft: '0.75rem',
            marginBottom: '1rem',
          }}>
            {error}
          </p>
        )}

        {/* ── Empty ── */}
        {!loading && !error && posts.length === 0 && (
          <div style={{ paddingTop: '2rem' }}>
            <p style={{
              fontSize: 'clamp(1.1rem, 4vw, 1.35rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}>
              {emptyLine.current}
            </p>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              marginBottom: '1.75rem',
            }}>
              when you're ready, we're here.
            </p>
            <Link to="/create">
              <button type="button" className="ghost-btn" style={{
                fontSize: '0.8rem',
                borderColor: '#8b5cf6',
                color: '#8b5cf6',
              }}>
                start dumping →
              </button>
            </Link>
          </div>
        )}

        {/* ── Timeline ── */}
        {!loading && !error && grouped.map(([date, dayPosts]) => (
          <div key={date} style={{ marginBottom: '2rem' }}>
            <p style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.65rem',
              opacity: 0.38,
              paddingLeft: '1.1rem',
            }}>
              — {date}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {dayPosts.map((post) => {
                const idx = cardIndex++
                return (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                    index={idx}
                  />
                )
              })}
            </div>
          </div>
        ))}

      </main>
    </>
  )
}