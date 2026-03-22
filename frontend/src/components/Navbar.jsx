import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 100,
      }}
    >
      <Link
        to="/"
        style={{
          color: 'var(--text-primary)',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textDecoration: 'none',
          fontSize: '1.25rem',
        }}
      >
        DUMP
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link
          to="/create"
          style={{
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          dump it
        </Link>
        <Link
          to="/my-posts"
          style={{
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontSize: '0.95rem',
          }}
        >
          my dumps
        </Link>
      </div>
    </nav>
  );
}
