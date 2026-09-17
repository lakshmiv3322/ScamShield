// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ScamShield ErrorBoundary${this.props.name ? ` - ${this.props.name}` : ''}]`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 my-4 rounded-2xl bg-[#121821] border border-amber-500/30 text-white shadow-2xl space-y-4 max-w-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Temporary Display Issue</h3>
              <p className="text-xs text-gray-400">
                {this.props.name
                  ? `An unexpected glitch occurred in ${this.props.name}. Your security data is completely safe.`
                  : 'An unexpected issue occurred rendering this section. Your family circle data is secure.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F14] border border-white/5 font-mono text-[11px] text-gray-400 overflow-x-auto">
            {this.state.error?.message || 'Unknown render exception'}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#5B8FFF] hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Reload App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
