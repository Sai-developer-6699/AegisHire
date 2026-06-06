/**
 * components/shared/GlobalErrorBoundary.jsx
 *
 * Class-based error boundary that catches render errors anywhere in the
 * component tree. Prevents one broken component from crashing the entire ATS.
 *
 * Wrap the route tree in main.jsx:
 *   <GlobalErrorBoundary>
 *     <App />
 *   </GlobalErrorBoundary>
 */
import { Component } from 'react';

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to error tracking service (e.g. Sentry)
    console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a1727 0%, #0d1f35 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          color: '#e2e8f0',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '48px',
            maxWidth: '520px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '28px',
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#f1f5f9',
              marginBottom: '8px',
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: '1.6',
              marginBottom: '32px',
            }}
          >
            An unexpected error occurred in the application. Your data is safe.
            Click below to return to the home screen.
          </p>

          {/* Dev-only error details */}
          {isDev && this.state.error && (
            <details
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#f87171',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                Error Details (dev only)
              </summary>
              <pre
                style={{
                  fontSize: '11px',
                  color: '#fca5a5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            id="error-boundary-reset"
            onClick={this.handleReset}
            style={{
              background: 'linear-gradient(135deg, #3B82F6, #17a34a)',
              color: '#0a1727',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
