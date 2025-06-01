import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: error.message || 'An unexpected error occurred'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      errorInfo: `${error.message}\n\n${errorInfo.componentStack}`
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm p-8">
          <div className="bg-surface rounded-lg p-8 max-w-lg w-full shadow-xl border-2 border-error/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-error">Something went wrong</h2>
                <p className="text-text-secondary">The application encountered an error</p>
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 mb-6 font-mono text-sm overflow-auto max-h-48">
              <p className="text-error whitespace-pre-wrap">
              {this.state.errorInfo}
            </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: '' })}
                className="flex-1 bg-surface-hover hover:bg-surface text-text-primary px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Try to Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}