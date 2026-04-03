import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Clock } from 'lucide-react'

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

const MOOD_EMOJI = {
  sad: '😢', angry: '😤', anxious: '😰',
  numb: '😶', overwhelmed: '🌊', hopeful: '🌱', confused: '😵‍💫',
}

const MOOD_COLOR = {
  sad: '#6366f1', angry: '#ef4444', anxious: '#f59e0b',
  numb: '#6b7280', overwhelmed: '#06b6d4', hopeful: '#22c55e', confused: '#a855f7',
}

export default function PostCard({ post }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const moodEmoji = post.mood ? MOOD_EMOJI[post.mood] : null
  const moodColor = post.mood ? MOOD_COLOR[post.mood] : '#8b5cf6'

  return (
    <div
      onClick={() => navigate(`/post/${post._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '18px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        marginBottom: '0.85rem',
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-card)',
        borderLeft: `2.5px solid ${hovered ? moodColor : `${moodColor}66`}`,
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${moodColor}22, inset 0 0 20px ${moodColor}08`
          : '0 2px 8px rgba(0,0,0,0.12)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'background 180ms ease, box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Glow bleed on hover */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 0% 50%, ${moodColor}0d 0%, transparent 60%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 220ms ease',
        pointerEvents: 'none',
      }} />

      <p style={{
        color: 'var(--text-primary)',
        fontSize: '15px',
        lineHeight: 1.7,
        marginBottom: '0.6rem',
        position: 'relative',
      }}>
        {post.content}
      </p>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="drawing"
          style={{
            width: '100%', borderRadius: '6px',
            marginTop: '12px', marginBottom: '4px',
            display: 'block', maxHeight: '300px', objectFit: 'contain',
          }}
        />
      )}

      {moodEmoji && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          marginTop: '8px',
          marginBottom: '8px',
          padding: '3px 9px 3px 7px',
          borderRadius: '999px',
          background: `${moodColor}14`,
          border: `1px solid ${moodColor}30`,
          fontSize: '0.73rem',
          color: moodColor,
          fontWeight: 500,
          userSelect: 'none',
          position: 'relative',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: moodColor, flexShrink: 0,
            boxShadow: `0 0 6px ${moodColor}`,
          }} />
          <span style={{ fontSize: '0.85rem' }}>{moodEmoji}</span>
          <span style={{ opacity: 0.8 }}>{post.mood}</span>
        </div>
      )}

      <div style={{
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        position: 'relative',
        opacity: 0.7,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={10} /> {timeAgo(post.createdAt)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MessageCircle size={10} />
          {post.replyCount === 1 ? '1 comment' : `${post.replyCount} comments`}
        </span>
      </div>
    </div>
  )
}