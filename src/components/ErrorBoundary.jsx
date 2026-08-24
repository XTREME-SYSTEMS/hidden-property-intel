import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold mb-4 text-black">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-2">{this.state.error?.message || "An unexpected error occurred."}</p>
            {this.state.errorInfo?.componentStack && (
              <pre className="text-xs text-gray-400 mt-4 mb-6 text-left overflow-auto max-h-48 bg-gray-50 p-3 rounded">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}