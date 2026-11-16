import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

const reportErrorToTelemetry = (error, errorInfo, boundaryName) => {
  const telemetryPayload = {
    timestamp: new Date().toISOString(),
    service: "ErrorBoundary",
    boundaryName,
    message: error?.message || "Unknown render exception",
    name: error?.name || "Error",
    stack: error?.stack || null,
    componentStack: errorInfo?.componentStack || null,
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  if (import.meta.env.DEV) {
    console.error(
      `[Observability:ErrorBoundary:${boundaryName}]`,
      telemetryPayload,
    );
  }

  // Hook for production observability tools (e.g., Sentry.captureException)
  if (typeof window !== "undefined" && window.__TELEMETRY_DISPATCHER__) {
    try {
      window.__TELEMETRY_DISPATCHER__({
        level: "error",
        ...telemetryPayload,
      });
    } catch {
      // Fail-safe: telemetry reporting must never throw secondary errors
    }
  }
};

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Updates state so the next render will show the fallback UI.
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle hook to log error details to observability infrastructure.
   */
  componentDidCatch(error, errorInfo) {
    const boundaryName = this.props.name || "GlobalErrorBoundary";
    reportErrorToTelemetry(error, errorInfo, boundaryName);

    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, errorInfo);
      } catch {
        // Prevent callback exceptions from bubbling
      }
    }
  }

  /**
   * Resets the boundary state to allow component re-mounting.
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback supplied via props
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback({
            error: this.state.error,
            resetErrorBoundary: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      // Default accessible fallback view
      const isCompact = this.props.variant === "compact";

      if (isCompact) {
        return (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200/80 text-red-800 flex items-center justify-between gap-3 text-xs"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertCircle
                className="w-4 h-4 text-red-600 shrink-0"
                aria-hidden="true"
              />
              <span>Unable to render this section. Please try refreshing.</span>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-red-300 rounded-lg font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        );
      }

      return (
        <main
          className="min-h-[50vh] flex items-center justify-center p-6 bg-[#faf8f5]"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center space-y-4">
            <div
              className="w-12 h-12 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto"
              aria-hidden="true"
            >
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                An unexpected technical issue interrupted this section. The rest
                of the temple services remain operational.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[10px] text-left text-red-600 font-mono overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#900000] text-amber-300 hover:bg-[#7a0000] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#900000]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") window.location.href = "/";
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <Home className="w-3.5 h-3.5" /> Return Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
