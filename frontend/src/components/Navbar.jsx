import { Link } from 'react-router-dom'

export default function Navbar({ chatNotifications = 0 }) {
  return (
    <nav style={{
      height: '56px',
      background: '#0a0a0a',
      borderBottom: '1px solid #222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <Link to="/" style={{ textDecoration: 'none', color: 'var(--accent, #7c3aed)', fontWeight: 700, fontSize: '20px', letterSpacing: '-0.5px' }}>
        DUMP
      </Link>

      <Link to="/chat-requests" style={{
        textDecoration: 'none',
        color: '#888',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        chats
        {chatNotifications > 0 && (
          <span style={{
            background: '#7c3aed',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '10px',
            padding: '1px 6px',
            fontWeight: 600,
          }}>
            {chatNotifications}
          </span>
        )}
      </Link>
    </nav>
  )
}