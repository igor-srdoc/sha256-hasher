import { Button } from "@ui/button";
import { useHashWidgetStore, useHashWidgetActions } from "../hash-widget.context";
import { CHUNK_SIZE, MESSAGES } from "../../hash-computation.const";

export function ComputeButton() {
  const file = useHashWidgetStore((state) => state.file);
  const status = useHashWidgetStore((state) => state.status);
  const { setStatus, setError, initWorker } = useHashWidgetActions();

  // Only show when file is selected and in idle or error state
  if (!file || status === "computing" || status === "completed") {
    return null;
  }

  const handleCompute = () => {
    if (!file) {
      setError(MESSAGES.ERRORS.NO_FILE_SELECTED);
      return;
    }

    setStatus("computing");

    // Get or create worker for this widget instance
    const worker = initWorker!();
    
    // Send message to worker
    worker.postMessage({
      type: "COMPUTE_HASH",
      file,
      chunkSize: CHUNK_SIZE,
    });
  };

  return (
    <Button onClick={handleCompute} className="w-full">
      Compute SHA256 Hash
    </Button>
  );
}

