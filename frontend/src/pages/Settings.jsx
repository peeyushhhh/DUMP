import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RecoverIdentityForm from '../components/RecoverIdentityForm'
import { useAnon } from '../context/AnonContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { ChevronRight, CheckCircle } from 'lucide-react'

function sectionHeading(text) {
  return (
    <h2 style={{
      margin: '0 0 12px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--text-primary)',
    }}>
      {text}
    </h2>
  )
}

export default function Settings() {
  const isMobile = useIsMobile()
  const { anonId, recoverySetUp, requestNewRecoveryCode } = useAnon()

  let idTail = ''
  try {
    const raw = localStorage.getItem('anonId') || anonId || ''
    idTail = raw.slice(-8)
  } catch {
    idTail = (anonId || '').slice(-8)
  }

  const shell = {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: isMobile ? '12px' : '2rem',
    paddingTop: isMobile ? '60px' : '80px',
    paddingBottom: isMobile ? '32px' : '48px',
    maxWidth: '520px',
    margin: '0 auto',
    boxSizing: 'border-box',
  }

  const block = { marginBottom: '2rem' }

  return (
    <>
      <Navbar />
      <div style={shell}>
        <h1 style={{
          margin: '0 0 28px',
          fontSize: isMobile ? '1.35rem' : '1.6rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}>
          settings
        </h1>

        {/* Section 1 — your identity */}
        <section style={block}>
          {sectionHeading('your identity')}
          <p style={{
            margin: '0 0 6px',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>
            your anonymous ID
          </p>
          <p style={{
            margin: 0,
            fontSize: '1.05rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.06em',
            wordBreak: 'break-all',
          }}>
            {idTail || '—'}
          </p>
        </section>

        {/* Section 2 — my dumps */}
        <section style={block}>
          {sectionHeading('my dumps')}
          <Link
            to="/my-posts"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span>My dumps</span>
            <ChevronRight size={20} color="var(--text-muted)" strokeWidth={2} />
          </Link>
        </section>

        {/* Section 3 — recovery */}
        <section style={{ marginBottom: 0 }}>
          {sectionHeading('recovery')}
          {recoverySetUp ? (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '16px',
              padding: '14px 16px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
            }}>
              <CheckCircle size={22} color="#22c55e" strokeWidth={2} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                margin: 0,
                fontSize: '0.88rem',
                lineHeight: 1.5,
                color: 'var(--text-muted)',
              }}>
                Recovery code saved
              </p>
            </div>
          ) : (
            <RecoverIdentityForm />
          )}
          <button
            type="button"
            onClick={requestNewRecoveryCode}
            style={{
              width: '100%',
              marginTop: recoverySetUp ? 0 : '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--bg-hover)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Show new recovery code
          </button>
        </section>
      </div>
    </>
  )
}
