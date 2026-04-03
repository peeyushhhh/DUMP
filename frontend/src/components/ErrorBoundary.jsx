import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Optional: log to an error reporting service
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleHardReload = () => {
    window.location.reload();
  };

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background:
              'radial-gradient(circle at 0 0, rgba(139,92,246,0.18), transparent 55%), #050509',
            boxShadow: '0 18px 60px rgba(0,0,0,0.65)',
            padding: '1.5rem 1.75rem 1.25rem',
          }}
        >
          <p
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.7rem',
            }}
          >
            something broke
          </p>
          <h1
            style={{
              fontSize: '1.6rem',
              lineHeight: 1.2,
              marginBottom: '0.4rem',
            }}
          >
            the void is having a moment.
          </h1>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-muted)',
              marginBottom: '1.2rem',
            }}
          >
            either you did something cursed or we did. try again or nuke the
            page.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '0.6rem',
              marginBottom: '0.9rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={this.handleHardReload}
              className="primary-btn"
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 1.1rem',
              }}
            >
              reload page
            </button>
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="ghost-btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.5rem 1rem',
              }}
            >
              try again
            </button>
          </div>

          {this.state.error && (
            <pre
              style={{
                margin: 0,
                marginTop: '0.35rem',
                paddingTop: '0.4rem',
                borderTop: '1px dashed rgba(148,163,184,0.18)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                opacity: 0.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '96px',
                overflow: 'auto',
              }}
            >
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

