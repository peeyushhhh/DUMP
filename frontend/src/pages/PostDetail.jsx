import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostById } from '../services/postService';
import { getRepliesByPost, createReply } from '../services/replyService';
import { sendChatRequest } from '../services/chatService';
import { useAnon } from '../context/AnonContext';
import { useSocketContext } from '../context/SocketContext';
import Navbar from '../components/Navbar';

const MAX_REPLY_CHARS = 500;

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

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { anonId } = useAnon();
  const { socket } = useSocketContext();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyLoading, setReplyLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([getPostById(id), getRepliesByPost(id)])
      .then(([postRes, repliesRes]) => {
        setPost(postRes.data?.post ?? null);
        setReplies(repliesRes.data?.replies ?? []);
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? err.message ?? 'Failed to load post');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleChatRequest = async () => {
    if (post.anonymousId === anonId) return;
    try {
      const res = await sendChatRequest(post._id, anonId, post.anonymousId);
      socket.current.emit('send_request', {
        requestId: res.data.request._id,
        authorId: post.anonymousId
      });
      setRequestSent(true);
    } catch (err) {
      setRequestError(err.response?.data?.error ?? 'Failed to send request');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || replyLoading || !id) return;
    setReplyLoading(true);
    setError('');
    try {
      await createReply(id, content.trim(), anonId);
      setContent('');
      const repliesRes = await getRepliesByPost(id);
      setReplies(repliesRes.data?.replies ?? []);
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to add reply');
    } finally {
      setReplyLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)', paddingTop: '100px' }}>
          loading...
        </div>
      </>
    );
  }

  if (error && !post) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--danger)', paddingTop: '100px' }}>
          {error}
        </div>
      </>
    );
  }

  if (!post) return null;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem', paddingTop: '100px', maxWidth: '640px', margin: '0 auto' }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '1.5rem', padding: 0 }}>
          ← back
        </button>

        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '8px', borderLeft: '3px solid var(--accent)', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: 1.7, marginBottom: '0.5rem' }}>
            {post.content}
          </p>
          {post.imageUrl && (
            <img src={post.imageUrl} alt="drawing" style={{ width: '100%', borderRadius: '6px', marginTop: '12px', marginBottom: '4px', display: 'block', maxHeight: '300px', objectFit: 'contain' }} />
          )}
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', gap: '1rem' }}>
            <span>{timeAgo(post.createdAt)}</span>
            <span>{post.replyCount === 1 ? '1 reply' : `${post.replyCount} replies`}</span>
          </div>
        </div>

        {post.anonymousId !== anonId && (
          <div style={{ marginBottom: '1.5rem' }}>
            {requestSent ? (
              <p style={{ color: 'var(--accent-light)', fontSize: '14px' }}>
                chat request sent — waiting for response
              </p>
            ) : (
              <button onClick={handleChatRequest} style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent-light)', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                talk privately
              </button>
            )}
            {requestError && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{requestError}</p>
            )}
          </div>
        )}

        <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
          replies
        </h2>

        {replies.map((reply) => (
          <div key={reply._id} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', marginBottom: '0.75rem', borderLeft: '2px solid var(--border)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '0.25rem' }}>
              {reply.content}
            </p>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {timeAgo(reply.createdAt)}
            </span>
          </div>
        ))}

        <form onSubmit={handleReplySubmit} style={{ marginTop: '1.5rem' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_REPLY_CHARS))}
            maxLength={MAX_REPLY_CHARS}
            placeholder="Write a reply..."
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: 'none', borderBottom: '2px solid var(--accent)', padding: '16px', minHeight: '100px', width: '100%', fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', resize: 'none', outline: 'none', borderRadius: '4px 4px 0 0' }}
          />
          <div style={{ color: content.length > 450 ? 'var(--danger)' : 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'right', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
            {content.length} / {MAX_REPLY_CHARS}
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button type="submit" disabled={!content.trim() || replyLoading} style={{ background: !content.trim() || replyLoading ? 'var(--text-muted)' : 'var(--accent)', color: 'var(--text-primary)', padding: '12px 24px', borderRadius: '6px', border: 'none', cursor: !content.trim() || replyLoading ? 'not-allowed' : 'pointer', opacity: !content.trim() || replyLoading ? 0.6 : 1, fontSize: '0.95rem', fontWeight: 500 }}>
            reply
          </button>
        </form>
      </div>
    </>
  );
}