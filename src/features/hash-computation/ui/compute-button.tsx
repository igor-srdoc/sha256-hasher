import { Button } from "@ui/button";
import { useHashState } from "../state/hash.state";
import { useHashWorker } from "../hooks/use-hash-worker";
import { CHUNK_SIZE, MESSAGES } from "../hash-computation.const";

export function ComputeButton() {
  const { file, status, setStatus, setError } = useHashState();
  const workerRef = useHashWorker();

  // Only show when file is selected and not computing/completed
  if (!file || status === "computing" || status === "completed") {
    return null;
  }

  const handleCompute = () => {
    if (!file) {
      setError(MESSAGES.ERRORS.NO_FILE_SELECTED);
      return;
    }

    setStatus("computing");

    // Send message to worker
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "COMPUTE_HASH",
        file,
        chunkSize: CHUNK_SIZE,
      });
    }
  };

  return (
    <Button
      onClick={handleCompute}
      className="w-full"
      disabled={status === "computing"}
    >
      Compute SHA256 Hash
    </Button>
  );
}

