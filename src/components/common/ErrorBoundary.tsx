import React, { Component, ErrorInfo, ReactNode } from 'react';
import { deviceStateLogger } from '@/lib/deviceStateLogger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    deviceStateLogger.logError('ERROR_BOUNDARY', 'Component error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong with this component. The error has been logged.
            {this.state.error && (
              <details className="mt-2 text-xs">
                <summary>Error details</summary>
                <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}