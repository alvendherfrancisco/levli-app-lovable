import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

function ReportErrorFallback() {
  const navigate = useNavigate();
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={26} className="text-orange-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Something went wrong on this page</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Your data is safe. Try reloading, or head back to your shots.
        </p>
        <div className="mt-5 space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-pill btn-primary w-full"
          >
            Reload this page
          </button>
          <button
            onClick={() => navigate("/shots")}
            className="btn-pill btn-secondary w-full"
          >
            Back to Shots
          </button>
        </div>
      </div>
    </div>
  );
}

/** Catches any error thrown by the report page, so it can never blank the screen. */
export default class ReportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("[report] the report page could not be rendered", error, info);
  }

  render() {
    return this.state.failed ? <ReportErrorFallback /> : this.props.children;
  }
}