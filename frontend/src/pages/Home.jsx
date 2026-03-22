import { useEffect, useState } from 'react';
import { getPosts } from '../services/postService';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPosts(1, 10)
      .then((res) => {
        setPosts(res.data?.posts ?? []);
      })
      .catch((err) => {
        setError(err.response?.data?.error ?? err.message ?? 'Failed to load posts');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
            paddingTop: '80px',
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
          paddingTop: '80px',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1.5rem',
          }}
        >
          what's everyone dumping
        </h2>
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
            nothing here yet. be the first to dump.
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </>
        )}
      </div>
    </>
  );
}
