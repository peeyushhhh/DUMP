import { Link, useLocation } from 'react-router-dom'
import { Home, PlusCircle, Sofa, MessageCircle } from 'lucide-react'

const items = [
  { path: '/', label: 'home', Icon: Home, accent: '#8b5cf6' },
  { path: '/create', label: 'post', Icon: PlusCircle, accent: '#8b5cf6' },
  { path: '/therapist', label: 'therapist', Icon: Sofa, accent: '#c2410c' },
  { path: '/chat-requests', label: 'chats', Icon: MessageCircle, accent: '#8b5cf6' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      minHeight: '64px',
      paddingTop: '6px',
      paddingBottom: '8px',
      boxSizing: 'border-box',
      background: '#0a0a0a',
      borderTop: '1px solid #1a1a1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 1000,
    }}>
      {items.map(({ path, label, Icon, accent }) => {
        const active = pathname === path
        const color  = active ? accent : '#444'

        return (
          <Link
            key={path}
            to={path}
            aria-label={label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              textDecoration: 'none',
              minWidth: '56px',
              height: '100%',
              position: 'relative',
            }}
          >
            {/* pill indicator */}
            <span style={{
              position: 'absolute',
              top: '4px',
              width: active ? '20px' : '0px',
              height: '3px',
              borderRadius: '99px',
              background: accent,
              transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            }} />

            {/* icon */}
            <Icon
              size={22}
              color={color}
              strokeWidth={active ? 2.4 : 1.8}
              style={{
                transition: 'color 0.2s, filter 0.2s',
                filter: active
                  ? `drop-shadow(0 0 6px ${accent}99)`
                  : 'none',
              }}
            />
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'lowercase',
              color,
              lineHeight: 1,
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}