import { AlertCircle } from "lucide-react";
import { Button } from "@ui/button";
import { useHashState } from "../state/hash.state";

export function ErrorDisplay() {
  const { status, error, reset } = useHashState();

  // Only show when there's an error
  if (status !== "error" || !error) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Error</h3>
          <p className="text-sm text-blue-800 mb-4">{error}</p>
          <Button onClick={reset} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

