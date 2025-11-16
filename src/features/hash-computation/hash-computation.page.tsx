import { FileUploader } from "./ui/file-uploader";
import { DescriptionInput } from "./ui/description-input";
import { ComputeButton } from "./ui/compute-button";
import { ProgressBar } from "./ui/progress-bar";
import { ResultsDisplay } from "./ui/results-display";
import { ErrorDisplay } from "./ui/error-display";

/**
 * Hash Computation Page - Layout Component
 *
 * This is a pure layout component using the widget pattern.
 * Each child component (widget) manages its own state via Zustand.
 * No props are passed - widgets read/write to global state directly.
 */
export default function HashComputationPage() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
      <FileUploader />
      <DescriptionInput />
      <ComputeButton />
      <ProgressBar />
      <ResultsDisplay />
      <ErrorDisplay />
    </div>
  );
}
