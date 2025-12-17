import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-8">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Something went wrong</h1>
          <p className="text-gray-600 text-center max-w-md mb-6">
            {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2 bg-[#0f5c82] text-white rounded-lg hover:bg-[#0d4d6e] transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
