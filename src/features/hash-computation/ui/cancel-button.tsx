import { Button } from "@ui/button";
import { useHashState } from "../state/hash.state";
import { useHashWorker } from "../hooks/use-hash-worker";

export function CancelButton() {
  const { status, cancel } = useHashState();
  const workerRef = useHashWorker();

  // Only show when computing
  if (status !== "computing") {
    return null;
  }

  const handleCancel = () => {
    // Terminate the worker to stop computation
    if (workerRef.current) {
      workerRef.current.terminate();
      // Create a new worker for next computation
      workerRef.current = new Worker(
        new URL("../workers/hash.worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    
    // Reset state to idle
    cancel();
  };

  return (
    <Button
      onClick={handleCancel}
      variant="outline"
      className="w-full"
    >
      Cancel
    </Button>
  );
}

