import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { getPosts, deletePost } from '../services/postService';
import Navbar from '../components/Navbar';

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

export default function MyPosts() {
  const { anonId } = useAnon();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPosts(1, 50)
      .then((res) => {
        const all = res.data?.posts ?? [];
        setPosts(all.filter((p) => p.anonymousId === anonId));
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? err.message ?? 'Failed to load posts');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [anonId]);

  const handleDelete = async (e, postId) => {
    e.stopPropagation();
    setError('');
    try {
      await deletePost(postId, anonId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to delete post');
    }
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
            paddingTop: '80px',
          }}
        >
          loading...
        </div>
      </>
    );
  }

  if (error) {
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
            color: 'var(--danger)',
            paddingTop: '100px',
          }}
        >
          {error}
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
        }}
      >
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: '1.75rem',
            fontWeight: 600,
            marginBottom: '0.25rem',
          }}
        >
          your dumps
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          only you can see and delete these
        </p>

        {posts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              color: 'var(--text-muted)',
            }}
          >
            you haven't dumped anything yet
          </div>
        ) : (
          <>
            {error && (
              <p
                style={{
                  color: 'var(--danger)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                }}
              >
                {error}
              </p>
            )}
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--accent)',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  position: 'relative',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, post._id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: 0,
                  }}
                >
                  delete
                </button>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    lineHeight: 1.7,
                    marginBottom: '0.5rem',
                    paddingRight: '50px',
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
                  <span>{post.replyCount === 1 ? '1 reply' : `${post.replyCount} replies`}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
