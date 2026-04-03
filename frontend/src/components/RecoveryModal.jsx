import { useState, useCallback } from 'react';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useAnon } from '../context/AnonContext';

export default function RecoveryModal() {
  const {
    generatedPassphrase,
    confirmSavePassphrase,
    setShowRecoveryModal,
  } = useAnon();

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedPassphrase);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setSaveError('Could not copy — select and copy manually.');
      window.setTimeout(() => setSaveError(''), 3000);
    }
  }, [generatedPassphrase]);

  const handleSaved = useCallback(async () => {
    setSaveError('');
    setSaving(true);
    try {
      await confirmSavePassphrase();
    } catch (err) {
      setSaveError(
        err?.response?.data?.error ?? err?.message ?? 'Could not save. Try again.'
      );
    } finally {
      setSaving(false);
    }
  }, [confirmSavePassphrase]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(8, 8, 12, 0.85)',
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        }}
      >
        <h2
          id="recovery-modal-title"
          style={{
            margin: '0 0 12px',
            fontSize: '1.35rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
          }}
        >
          Save your recovery code 🔑
        </h2>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: '0.875rem',
            lineHeight: 1.55,
            color: 'var(--text-muted)',
          }}
        >
          If you lose access, paste this code to get your posts and chats back. Write it down
          somewhere safe.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'stretch',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 16px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--accent)',
              letterSpacing: '0.02em',
              wordBreak: 'break-all',
              lineHeight: 1.35,
            }}
          >
            {generatedPassphrase}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            style={{
              flexShrink: 0,
              width: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: copied ? '#22c55e' : 'var(--accent)',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={22} strokeWidth={2} /> : <Copy size={22} strokeWidth={2} />}
          </button>
        </div>

        {copied && (
          <p
            style={{
              margin: '-12px 0 16px',
              fontSize: '0.78rem',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} /> Copied to clipboard
          </p>
        )}

        {saveError && (
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '0.8rem',
              color: 'var(--danger)',
            }}
          >
            {saveError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSaved}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px 18px',
            marginBottom: '12px',
            border: 'none',
            borderRadius: '10px',
            background: 'var(--accent)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif",
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {saving ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 0.9s linear infinite' }} />
              Saving…
            </>
          ) : (
            "I've saved it"
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowRecoveryModal(false)}
          style={{
            display: 'block',
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            fontFamily: "'Space Grotesk', sans-serif",
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Skip for now
        </button>

        <p
          style={{
            margin: 0,
            fontSize: '0.72rem',
            lineHeight: 1.45,
            color: 'var(--text-muted)',
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          You won&apos;t be able to recover your identity without this.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
