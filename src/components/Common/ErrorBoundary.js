import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you would send this to your error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This would typically send to your error reporting service
    // For now, we'll just log to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId()
      };

      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only the last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.splice(0, existingLogs.length - 10);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      return user?.id || 'anonymous';
    } catch (e) {
      return 'anonymous';
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.hash = '#/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
          <div className="card shadow-lg p-4 text-center" style={{maxWidth: 400, width: '100%'}}>
            <div className="mb-4">
              <AlertTriangle className="text-danger mb-3" size={56} />
              <h1 className="h5 fw-bold text-dark mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-muted small mb-0">
                We encountered an unexpected error. Our team has been notified and we're working to fix it.
              </p>
            </div>
            {/* Error ID for support */}
            <div className="mb-4 p-2 bg-light rounded text-xs text-muted border">
              <div className="fw-medium mb-1">Error ID:</div>
              <div className="font-monospace">{this.state.errorId}</div>
            </div>
            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <button
                onClick={this.handleReset}
                className="btn btn-primary d-flex align-items-center justify-content-center mb-2"
              >
                <RefreshCw className="me-2" size={16} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center mb-2"
              >
                <Home className="me-2" size={16} />
                Go to Dashboard
              </button>
              <button
                onClick={this.handleReload}
                className="btn btn-link text-muted text-decoration-none"
              >
                Reload Page
              </button>
            </div>
            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-start">
                <summary className="cursor-pointer small fw-medium text-secondary mb-2">
                  Technical Details (Development Only)
                </summary>
                <div className="alert alert-danger p-2 text-xs">
                  <div className="font-monospace text-danger mb-2">
                    {this.state.error.toString()}
                  </div>
                  <div className="text-danger" style={{whiteSpace: 'pre-wrap'}}>
                    {this.state.errorInfo?.componentStack}
                  </div>
                </div>
              </details>
            )}
            {/* Support Information */}
            <div className="mt-4 pt-3 border-top text-xs text-muted">
              If this problem persists, please contact support with the Error ID above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;