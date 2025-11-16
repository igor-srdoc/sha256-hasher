import { HashWidgetProvider } from "./hash-widget.context";
import { FileUploader } from "./ui/file-uploader";
import { DescriptionInput } from "./ui/description-input";
import { ComputeButton } from "./ui/compute-button";
import { CancelButton } from "./ui/cancel-button";
import { ProgressBar } from "./ui/progress-bar";
import { ResultsDisplay } from "./ui/results-display";
import { ErrorDisplay } from "./ui/error-display";

/**
 * HashWidget - A fully self-contained, reusable hash computation component.
 *
 * Features:
 * - Each instance has its own isolated state and Web Worker
 * - Multiple widgets can exist on the same page independently
 * - No global state pollution
 * - No provider wrapping required by consumers
 *
 * Usage:
 * ```tsx
 * import { HashWidget } from "@/features/hash-computation/widgets/hash-widget";
 *
 * function MyPage() {
 *   return (
 *     <div>
 *       <HashWidget /> // Instance 1
 *       <HashWidget /> // Instance 2 (completely independent)
 *     </div>
 *   );
 * }
 * ```
 */
export function HashWidget() {
  return (
    <HashWidgetProvider>
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <FileUploader />
        <DescriptionInput />
        <ComputeButton />
        <CancelButton />
        <ProgressBar />
        <ResultsDisplay />
        <ErrorDisplay />
      </div>
    </HashWidgetProvider>
  );
}
