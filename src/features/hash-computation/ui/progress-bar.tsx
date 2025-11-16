import { Progress } from "@ui/progress";
import { useHashState } from "../state/hash.state";

export function ProgressBar() {
  const { status, progress } = useHashState();

  // Only show during computation
  if (status !== "computing") return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Computing hash...</span>
        <span className="font-medium text-gray-900">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}

