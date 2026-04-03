import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const isMobile = useIsMobile()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2100,
      height: isMobile ? '52px' : '56px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 24px',
    }}>
      <Link to="/" style={{
        color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 700,
        fontSize: isMobile ? '16px' : '18px',
        letterSpacing: isMobile ? '3px' : '4px',
      }}>
        DUMP
      </Link>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: isMobile ? '12px' : '20px',
      }}>
        <NotificationBell />
        <Link to="/settings" aria-label="Settings" style={{
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'flex', alignItems: 'center',
          gap: '5px', fontSize: '13px',
        }}>
          <Settings size={isMobile ? 18 : 15} />
          {!isMobile && 'settings'}
        </Link>
      </div>
    </nav>
  )
}