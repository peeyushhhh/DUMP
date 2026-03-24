import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const { pathname } = useLocation()

  const items = [
    {
      label: 'home',
      path: '/',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c3aed' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      )
    },
    {
      label: 'dump it',
      path: '/create',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c3aed' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      )
    },
    {
      label: 'my dumps',
      path: '/my-posts',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7c3aed' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      )
    }
  ]

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: '#0a0a0a',
      borderTop: '1px solid #222',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
    }}>
      {items.map((item) => {
        const active = pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              color: active ? '#7c3aed' : '#555',
              fontSize: '10px',
              fontFamily: "'Space Grotesk', sans-serif",
              minWidth: '60px',
            }}
          >
            {item.icon(active)}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}