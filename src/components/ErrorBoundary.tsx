import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      
      try {
        // Check if it's a Firestore permission error JSON
        const errorData = JSON.parse(this.state.error?.message || "");
        if (errorData.error && errorData.error.includes("insufficient permissions")) {
          errorMessage = "You don't have permission to perform this action. Please check your account status or subscription.";
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-red-100 max-w-md text-center">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! An error occurred</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all flex items-center justify-center mx-auto shadow-md"
            >
              <RefreshCcw className="w-5 h-5 mr-2" /> Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
