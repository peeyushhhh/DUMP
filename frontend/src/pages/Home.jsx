import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPosts } from '../services/postService'
import { useSocketContext } from '../context/SocketContext'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

const PAGE_LIMIT = 10

function parseFeedResponse(res) {
  const data = res.data?.data ?? res.data ?? {}
  const list = data.posts ?? []
  const pagination = data.pagination ?? res.data?.pagination

  let hasNext
  if (pagination && typeof pagination.hasNextPage === 'boolean') {
    hasNext = pagination.hasNextPage
  } else if (
    typeof data.total === 'number'
    && typeof data.page === 'number'
    && typeof data.limit === 'number'
  ) {
    const skip = (data.page - 1) * data.limit
    hasNext = skip + list.length < data.total
  } else {
    hasNext = list.length >= PAGE_LIMIT
  }

  return { list, hasNext }
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { socket } = useSocketContext()

  const loadFeed = useCallback(async ({ initial = false, showSpinner = false } = {}) => {
    if (showSpinner) setRefreshing(true)
    try {
      const res = await getPosts(1, PAGE_LIMIT)
      const { list, hasNext } = parseFeedResponse(res)
      setPosts(list)
      setPage(1)
      setHasMore(hasNext)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to load posts')
    } finally {
      if (initial) setLoading(false)
      if (showSpinner) setRefreshing(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const res = await getPosts(nextPage, PAGE_LIMIT)
      const { list, hasNext } = parseFeedResponse(res)
      setPosts((prev) => [...prev, ...list])
      setPage(nextPage)
      setHasMore(hasNext)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to load posts')
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore])

  useEffect(() => {
    loadFeed({ initial: true })
  }, [loadFeed])

  useEffect(() => {
    const sock = socket?.current
    if (!sock) return
    const onNewPost = () => {
      loadFeed()
    }
    sock.on('new_post', onNewPost)
    return () => sock.off('new_post', onNewPost)
  }, [socket, loadFeed])

  // Fallback when socket `new_post` is missed (silent — no full-page or refresh spinner)
  useEffect(() => {
    const id = setInterval(() => {
      loadFeed()
    }, 30_000)
    return () => clearInterval(id)
  }, [loadFeed])

  const handleRefresh = () => loadFeed({ showSpinner: true })

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--bg)',
          color: 'var(--text-muted)', paddingTop: '80px', paddingBottom: '80px',
          flexDirection: 'column', gap: '10px',
        }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', fontStyle: 'italic' }}>loading...</span>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'var(--bg)',
          color: 'var(--danger)', paddingTop: '80px', paddingBottom: '80px',
          flexDirection: 'column', gap: '8px',
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @keyframes orbFloat {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(50px,-40px) scale(1.1); }
          66%  { transform: translate(-30px,25px) scale(0.93); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes orbFloat2 {
          0%   { transform: translate(0,0) scale(1); }
          40%  { transform: translate(-40px,30px) scale(1.06); }
          80%  { transform: translate(20px,-20px) scale(0.96); }
          100% { transform: translate(0,0) scale(1); }
        }
        .feed-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
        }
        .feed-divider span {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
          opacity: 0.6;
        }
        .feed-divider hr {
          flex: 1;
          border: none;
          border-top: 1px solid rgba(139,92,246,0.15);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Orb 1 */}
      <div style={{
        position: 'fixed', top: '10%', right: '-12%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, #8b5cf6 0%, #6d28d9 40%, transparent 70%)',
        filter: 'blur(90px)', opacity: 0.1,
        animation: 'orbFloat 10s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Orb 2 */}
      <div style={{
        position: 'fixed', bottom: '5%', left: '-8%',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
        filter: 'blur(100px)', opacity: 0.07,
        animation: 'orbFloat2 13s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Navbar />

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '2rem',
        paddingTop: '80px',
        paddingBottom: '80px',
        maxWidth: '640px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Hero */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            opacity: 0.5,
            marginBottom: '0.75rem',
          }}>
            anonymous · unfiltered · yours
          </p>
          <h1 style={{
            fontSize: 'clamp(1.9rem, 5vw, 2.6rem)',
            fontWeight: 800,
            fontStyle: 'italic',
            lineHeight: 1.2,
            marginBottom: '0.75rem',
            letterSpacing: '-0.03em',
          }}>
            <span style={{ color: 'var(--text-primary)' }}>say it. </span>
            <span style={{ color: '#8b5cf6' }}>no one's watching.</span>
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            maxWidth: '340px',
            opacity: 0.7,
          }}>
            this is your void. scream into it.
          </p>
        </div>

        {/* Feed header */}
        <div className="feed-divider">
          <span>recent dumps</span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh feed"
            title="Refresh feed"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              border: '1px solid rgba(139,92,246,0.25)',
              background: 'rgba(139,92,246,0.08)',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'wait' : 'pointer',
              opacity: refreshing ? 0.7 : 1,
              transition: 'opacity 0.15s, border-color 0.15s',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
          </button>
          <hr />
        </div>

        {posts.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '200px',
            color: 'var(--text-muted)', gap: '10px',
          }}>
            <p style={{ fontStyle: 'italic', fontSize: '0.95rem', opacity: 0.6 }}>
              the void is listening.
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}

        {hasMore && (
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="ghost-btn"
              style={{
                fontSize: '0.85rem',
                minWidth: '140px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: loadingMore ? 'wait' : 'pointer',
                opacity: loadingMore ? 0.85 : 1,
              }}
            >
              {loadingMore && (
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              )}
              load more
            </button>
          </div>
        )}
      </div>

      {/* Therapist FAB */}
      <button
        onClick={() => navigate('/therapist')}
        title="talk to your therapist"
        style={{
          position: 'fixed', bottom: '76px', left: '16px',
          width: '48px', height: '48px', borderRadius: '50%',
          border: '1px solid #3d1a1a',
          background: 'linear-gradient(135deg, #1a0f0f, #2a1010)',
          color: '#f97316', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, boxShadow: '0 0 16px rgba(194,65,12,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 0 28px rgba(194,65,12,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 0 16px rgba(194,65,12,0.25)'
        }}
      >
        🛋️
      </button>
    </>
  )
}