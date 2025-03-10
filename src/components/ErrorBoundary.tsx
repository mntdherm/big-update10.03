import React, { Component, ErrorInfo, ReactNode } from 'react';
import { trackError } from '../lib/analytics';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log the error to the analytics system
    trackError(
      error.message,
      error.stack || '',
      this.props.componentName || 'Unknown',
      'React Error'
    );
    
    // You can also log to an error reporting service like Sentry here
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRefresh = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Jokin meni pieleen
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Pahoittelemme, tämän toiminnon lataaminen epäonnistui.</p>
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="text-xs font-medium cursor-pointer">Virheen tiedot</summary>
                    <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 rounded">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={this.handleRefresh}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Kokeile uudelleen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
