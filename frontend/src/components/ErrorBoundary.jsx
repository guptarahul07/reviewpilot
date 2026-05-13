// src/components/ErrorBoundary.jsx
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    // Sentry will pick this up automatically if initialised
    if (window.__SENTRY__) {
      window.__SENTRY__.captureException(error, { extra: errorInfo })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0a0c0f', padding: 24,
        }}>
          <div style={{
            maxWidth: 440, width: '100%',
            background: '#111318', border: '1px solid #1e2330',
            borderRadius: 20, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800,
              color: '#f0f2f7', marginBottom: 10, letterSpacing: '-.02em',
            }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: '#8891aa', lineHeight: 1.65, marginBottom: 28 }}>
              An unexpected error occurred. Our team has been notified.
              Please refresh the page to continue.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: '#0a0c0f', border: '1px solid #1e2330',
                borderRadius: 10, padding: '10px 14px', marginBottom: 24,
                fontSize: 12, color: '#4a5068', fontFamily: 'monospace',
                textAlign: 'left', wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#4f7cff', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 24px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back() }}
                style={{
                  background: 'none', color: '#8891aa',
                  border: '1px solid #1e2330', borderRadius: 10, padding: '10px 24px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
