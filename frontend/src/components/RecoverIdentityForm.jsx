import { useState } from 'react';
import { useAnon } from '../context/AnonContext';
import { Loader2 } from 'lucide-react';

export default function RecoverIdentityForm() {
  const { recoverIdentity } = useAnon();
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passphrase.trim() || loading) return;
    setLoading(true);
    setMessage({ type: null, text: '' });
    const ok = await recoverIdentity(passphrase.trim());
    setLoading(false);
    if (ok) {
      setMessage({ type: 'success', text: 'Identity restored! Refreshing…' });
      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } else {
      setMessage({
        type: 'error',
        text: 'Passphrase not found. Double-check and try again.',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '0.5rem',
        marginBottom: '1.5rem',
        padding: '16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <label
        htmlFor="recover-passphrase"
        style={{
          display: 'block',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '8px',
        }}
      >
        recovery code
      </label>
      <input
        id="recover-passphrase"
        type="text"
        autoComplete="off"
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        placeholder="word-word-NN"
        disabled={loading}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 14px',
          marginBottom: '12px',
          fontSize: '0.95rem',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          color: 'var(--text-primary)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          outline: 'none',
        }}
      />
      <button
        type="submit"
        disabled={loading || !passphrase.trim()}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          background: 'var(--accent)',
          color: 'var(--text-primary)',
          fontSize: '0.88rem',
          fontWeight: 600,
          fontFamily: "'Space Grotesk', sans-serif",
          cursor: loading || !passphrase.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !passphrase.trim() ? 0.55 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 0.9s linear infinite' }} />
            Recovering…
          </>
        ) : (
          'Recover my identity'
        )}
      </button>
      {message.text && (
        <p
          style={{
            margin: '12px 0 0',
            fontSize: '0.8rem',
            color: message.type === 'error' ? 'var(--danger)' : '#22c55e',
            lineHeight: 1.45,
          }}
        >
          {message.text}
        </p>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
