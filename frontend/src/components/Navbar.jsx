import { Link } from 'react-router-dom'
import { useSocketContext } from '../context/SocketContext'

export default function Navbar() {
  const { notifications } = useSocketContext()

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: '56px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700, fontSize: '18px', letterSpacing: '4px' }}>
        DUMP
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Link to="/create" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
          dump it
        </Link>
        <Link to="/my-posts" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px' }}>
          my dumps
        </Link>
        <Link to="/chat-requests" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', position: 'relative' }}>
          chats
          {notifications > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-12px',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {notifications}
            </span>
          )}
        </Link>
      </div>
    </nav>
  )
}