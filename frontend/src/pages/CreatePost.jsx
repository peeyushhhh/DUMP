import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnon } from '../context/AnonContext';
import { createPost } from '../services/postService';
import Navbar from '../components/Navbar';

const MAX_CHARS = 800;

export default function CreatePost() {
  const { anonId } = useAnon();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const charCount = content.length;
  const isOverWarning = charCount > 750;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError('');
    try {
      await createPost(content.trim(), anonId);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '2rem',
          paddingTop: '80px',
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
          what's on your mind?
        </h1>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          anonymous. unfiltered. safe.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
            placeholder="Let it all out..."
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: 'none',
              borderBottom: '2px solid var(--accent)',
              padding: '16px',
              minHeight: '180px',
              width: '100%',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '16px',
              resize: 'none',
              outline: 'none',
              borderRadius: '4px 4px 0 0',
            }}
          />
          <div
            style={{
              color: isOverWarning ? 'var(--danger)' : 'var(--text-muted)',
              fontSize: '0.875rem',
              textAlign: 'right',
              marginTop: '0.25rem',
              marginBottom: '1rem',
            }}
          >
            {charCount} / {MAX_CHARS}
          </div>

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

          <button
            type="submit"
            disabled={!content.trim() || loading}
            style={{
              background: !content.trim() || loading ? 'var(--text-muted)' : 'var(--accent)',
              color: 'var(--text-primary)',
              width: '100%',
              padding: '14px',
              borderRadius: '6px',
              border: 'none',
              cursor: !content.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !content.trim() || loading ? 0.6 : 1,
              fontSize: '1rem',
              fontWeight: 500,
            }}
          >
            dump it
          </button>
        </form>
      </div>
    </>
  );
}
