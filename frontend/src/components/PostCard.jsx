import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
}

export default function PostCard({ post }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/post/${post._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-card)',
        padding: '20px',
        borderRadius: '8px',
        borderLeft: '3px solid var(--accent)',
        cursor: 'pointer',
        marginBottom: '1rem',
      }}
    >
      <p
        style={{
          color: 'var(--text-primary)',
          fontSize: '16px',
          lineHeight: 1.7,
          marginBottom: '0.5rem',
        }}
      >
        {post.content}
      </p>
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          display: 'flex',
          gap: '1rem',
        }}
      >
        <span>{timeAgo(post.createdAt)}</span>
        <span>{post.replyCount} replies</span>
      </div>
    </div>
  );
}
