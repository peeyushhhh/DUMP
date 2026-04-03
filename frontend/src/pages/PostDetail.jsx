import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostById, getCommentSuggestions } from '../services/postService'
import { getCommentsByPost, createComment } from '../services/replyService'
import { sendChatRequest } from '../services/chatService'
import { useAnon } from '../context/AnonContext'
import { useSocketContext } from '../context/SocketContext'
import Navbar from '../components/Navbar'
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  Send,
  Loader2,
  Sparkles,
  AlertCircle,
  MessagesSquare,
} from 'lucide-react'

const MAX_COMMENT_CHARS = 500

const NESTED_BORDER = '2px solid color-mix(in srgb, var(--accent) 20%, transparent)'

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

function totalCommentCount(comments) {
  if (!Array.isArray(comments)) return 0
  return comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)
}

function applyNewCommentFromSocket(prevComments, comment) {
  const cid = comment?._id != null ? String(comment._id) : ''
  if (!cid) return { next: prevComments, applied: false }

  const alreadyHave = (list) => {
    for (const c of list) {
      if (String(c._id) === cid) return true
      for (const r of c.replies || []) {
        if (String(r._id) === cid) return true
      }
    }
    return false
  }
  if (alreadyHave(prevComments)) return { next: prevComments, applied: false }

  const parentId = comment.parentId != null && comment.parentId !== ''
    ? String(comment.parentId)
    : null

  if (!parentId) {
    const node = { ...comment, replies: comment.replies || [] }
    return { next: [node, ...prevComments], applied: true }
  }

  let applied = false
  const next = prevComments.map((c) => {
    if (String(c._id) !== parentId) return c
    const replies = [...(c.replies || [])]
    if (replies.some((r) => String(r._id) === cid)) return c
    replies.push({ ...comment })
    replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    applied = true
    return { ...c, replies }
  })
  return { next, applied }
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { anonId } = useAnon()
  const { socket } = useSocketContext()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [error, setError] = useState('')
  const [requestSent, setRequestSent] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [replyToId, setReplyToId] = useState(null)
  const [nestedContent, setNestedContent] = useState('')
  const [nestedLoading, setNestedLoading] = useState(false)

  const loadComments = useCallback(async () => {
    if (!id) return
    const res = await getCommentsByPost(id)
    setComments(res?.data?.comments ?? [])
  }, [id])

  const loadPost = useCallback(async () => {
    if (!id) return
    const res = await getPostById(id)
    setPost(res?.data?.post ?? null)
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getPostById(id), getCommentsByPost(id)])
      .then(([postRes, commentsRes]) => {
        setPost(postRes?.data?.post ?? null)
        setComments(commentsRes?.data?.comments ?? [])
      })
      .catch((err) => setError(err.response?.data?.error ?? err.message ?? 'Failed to load post'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!post || post.anonymousId === anonId) return
    setSuggestionsLoading(true)
    getCommentSuggestions(post._id)
      .then((res) => setSuggestions(res?.data?.data?.suggestions ?? res?.data?.suggestions ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestionsLoading(false))
  }, [post, anonId])

  useEffect(() => {
    if (!id) return
    const s = socket?.current
    if (!s) return
    const onNewComment = (payload) => {
      const comment = payload?.comment
      const eventPostId = payload?.postId
      if (!comment || eventPostId == null || String(eventPostId) !== String(id)) return
      setComments((prev) => {
        const { next, applied } = applyNewCommentFromSocket(prev, comment)
        if (applied) {
          setPost((p) =>
            p && String(p._id) === String(id)
              ? { ...p, replyCount: (p.replyCount || 0) + 1 }
              : p
          )
        }
        return next
      })
    }
    s.on('new_comment', onNewComment)
    return () => s.off('new_comment', onNewComment)
  }, [socket, id])

  useEffect(() => {
    if (!id) return
    const onVis = () => {
      if (document.visibilityState === 'visible') loadComments()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [id, loadComments])

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

  const handleTopCommentSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || commentLoading || !id) return
    setCommentLoading(true)
    setError('')
    try {
      await createComment(id, content.trim(), anonId)
      setContent('')
      await Promise.all([loadComments(), loadPost()])
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleNestedSubmit = async (e) => {
    e.preventDefault()
    if (!nestedContent.trim() || nestedLoading || !id || !replyToId) return
    setNestedLoading(true)
    setError('')
    try {
      await createComment(id, nestedContent.trim(), anonId, replyToId)
      setNestedContent('')
      setReplyToId(null)
      await Promise.all([loadComments(), loadPost()])
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to add comment')
    } finally {
      setNestedLoading(false)
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
  const topCount = comments.length
  const totalShown = totalCommentCount(comments)

  return (
    <>
      <Navbar />
      <main className="page-wrap fade-up">

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
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={11} style={{ color: 'var(--text-muted)' }} />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {post.replyCount === 1 ? '1 comment' : `${post.replyCount} comments`}
                </span>
              </span>
            </div>
            {mood && (
              <span className="info-chip" style={{ fontSize: '0.76rem' }}>
                {mood.emoji} {mood.label}
              </span>
            )}
          </div>
        </section>

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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 className="section-kicker" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MessagesSquare size={13} /> comments
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
            {topCount} thread{topCount === 1 ? '' : 's'} · {totalShown} total
          </span>
        </div>

        {comments.length === 0 && (
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>no comments yet. be the first.</p>
          </div>
        )}

        {comments.map((comment) => {
          const cm = MOOD_META[comment.mood] ?? null
          const nested = comment.replies || []
          const showInlineReply = replyToId === comment._id

          return (
            <div key={comment._id} className="glass-card" style={{ padding: '1rem', marginBottom: '0.6rem', borderLeft: '2px solid var(--border)' }}>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '0.35rem' }}>
                {comment.content}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} /> {timeAgo(comment.createdAt)}
                </span>
                {cm && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {cm.emoji} {cm.label}
                  </span>
                )}
              </div>
              {nested.length > 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: '0 0 8px' }}>
                  {nested.length} {nested.length === 1 ? 'comment' : 'comments'}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setReplyToId(showInlineReply ? null : comment._id)
                  setNestedContent('')
                  setError('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: 'var(--text-muted)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  marginBottom: showInlineReply ? '10px' : 0,
                }}
              >
                reply
              </button>

              {showInlineReply && (
                <form onSubmit={handleNestedSubmit} style={{ marginTop: '4px', marginBottom: nested.length ? '12px' : 0 }}>
                  <textarea
                    value={nestedContent}
                    onChange={(e) => setNestedContent(e.target.value.slice(0, MAX_COMMENT_CHARS))}
                    maxLength={MAX_COMMENT_CHARS}
                    placeholder="Write a comment…"
                    style={{
                      background: '#111119',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      padding: '10px 12px',
                      minHeight: '72px',
                      width: '100%',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      borderRadius: '10px',
                      lineHeight: 1.5,
                      marginBottom: '8px',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={!nestedContent.trim() || nestedLoading}
                      style={{
                        fontSize: '0.82rem',
                        padding: '8px 14px',
                        opacity: !nestedContent.trim() || nestedLoading ? 0.6 : 1,
                        cursor: !nestedContent.trim() || nestedLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {nestedLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                      post
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReplyToId(null); setNestedContent(''); setError('') }}
                      style={{
                        background: 'var(--bg-hover)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      cancel
                    </button>
                  </div>
                </form>
              )}

              {nested.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  {nested.map((r) => {
                    const rm = MOOD_META[r.mood] ?? null
                    return (
                      <div
                        key={r._id}
                        style={{
                          paddingLeft: '16px',
                          marginTop: '10px',
                          borderLeft: NESTED_BORDER,
                        }}
                      >
                        <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.55, marginBottom: '0.25rem' }}>
                          {r.content}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={9} /> {timeAgo(r.createdAt)}
                          </span>
                          {rm && (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {rm.emoji} {rm.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        <form onSubmit={handleTopCommentSubmit} className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p className="section-kicker" style={{ marginBottom: '8px' }}>leave a comment</p>

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
            onChange={(e) => setContent(e.target.value.slice(0, MAX_COMMENT_CHARS))}
            maxLength={MAX_COMMENT_CHARS}
            placeholder="Write something kind..."
            style={{
              background: '#111119', color: 'var(--text-primary)',
              border: '1px solid var(--border)', padding: '14px',
              minHeight: '100px', width: '100%', fontSize: '15px',
              resize: 'vertical', outline: 'none', borderRadius: '10px', lineHeight: 1.6,
            }}
          />
          <div style={{ color: content.length > 450 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'right', marginTop: '0.3rem', marginBottom: '0.75rem' }}>
            {content.length} / {MAX_COMMENT_CHARS}
          </div>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}
          <button
            type="submit"
            className="primary-btn"
            disabled={!content.trim() || commentLoading}
            style={{
              width: '100%', opacity: !content.trim() || commentLoading ? 0.6 : 1,
              cursor: !content.trim() || commentLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            {commentLoading
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> posting...</>
              : <><Send size={15} /> post comment</>
            }
          </button>
        </form>

      </main>
    </>
  )
}
