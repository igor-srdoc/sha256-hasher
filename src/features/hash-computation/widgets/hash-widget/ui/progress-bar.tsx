import { Progress } from "@ui/progress";
import { useHashWidgetStore } from "../hash-widget.context";
import { useEffect, useState } from "react";

export function ProgressBar() {
  const status = useHashWidgetStore((state) => state.status);
  const progress = useHashWidgetStore((state) => state.progress);
  const file = useHashWidgetStore((state) => state.file);
  const [lastProgressTime, setLastProgressTime] = useState(Date.now());
  const [stuckWarning, setStuckWarning] = useState(false);

  // Track progress updates and detect stuck state
  useEffect(() => {
    if (status === "computing") {
      setLastProgressTime(Date.now());
      setStuckWarning(false);

      // Check if progress is stuck every second
      const checkInterval = setInterval(() => {
        const timeSinceLastUpdate = Date.now() - lastProgressTime;
        if (timeSinceLastUpdate > 3000) {
          setStuckWarning(true);
        }
      }, 1000);

      return () => clearInterval(checkInterval);
    }
  }, [progress, status]);

  // Reset when status changes
  useEffect(() => {
    if (status !== "computing") {
      setStuckWarning(false);
    }
  }, [status]);

  // Only show during computation
  if (status !== "computing") return null;

  const fileSizeInMB = file ? (file.size / (1024 * 1024)).toFixed(2) : "0";
  const estimatedChunks = Math.ceil((file?.size || 0) / (64 * 1024 * 1024));
  const currentChunk = Math.ceil((progress / 100) * estimatedChunks);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Computing hash...</span>
        <span className="font-medium text-gray-900">{progress}%</span>
      </div>
      <Progress value={progress} />

      {/* Verbose status */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>Processing chunk {currentChunk} of {estimatedChunks} (64MB chunks)</p>
        <p>File size: {fileSizeInMB}MB</p>
        {stuckWarning && (
          <p className="text-yellow-600 font-medium" data-testid="stuck-warning">
            ⚠️ Progress hasn't updated in 3+ seconds - Large chunk processing may take time
          </p>
        )}
      </div>
    </div>
  );
}

