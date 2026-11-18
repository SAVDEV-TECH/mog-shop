'use client';

import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl m-4 border border-gray-200 dark:border-gray-800">
          <AlertCircle className="text-red-500 mb-4" size={44} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            An unexpected error occurred while rendering this section. Please try refreshing or reloading the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 px-6 py-3 bg-mog text-white rounded-2xl font-bold text-sm hover:opacity-90 transition shadow-lg shadow-mog/20"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
