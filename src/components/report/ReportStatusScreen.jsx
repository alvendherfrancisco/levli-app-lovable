import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

/** Loading and couldn't-load screens, so the report never sits blank. */
export default function ReportStatusScreen({ failed, onRetry }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen w-full flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        {failed ? (
          <>
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Couldn't load your report</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your data is safe. This is usually a slow connection.
            </p>
            <button onClick={onRetry} className="mt-5 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold">
              Retry
            </button>
          </>
        ) : (
          <>
            <Loader2 size={30} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading your report…</p>
          </>
        )}
      </div>
    </div>
  );
}