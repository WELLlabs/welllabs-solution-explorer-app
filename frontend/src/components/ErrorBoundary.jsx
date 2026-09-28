import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 Uncaught UI Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  handleGoMap = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          padding: '24px',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07)',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '24px'
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 10px 0'
            }}>
              Something went wrong loading this view
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.5',
              margin: '0 0 20px 0'
            }}>
              The application encountered an unexpected render issue. Don't worry — your account data has been saved.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#334155',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleGoMap}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1b1c24',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Go to Map View
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
