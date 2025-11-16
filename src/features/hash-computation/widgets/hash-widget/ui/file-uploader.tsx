import { useRef } from "react";
import { Upload } from "lucide-react";
import { useHashWidgetStore, useHashWidgetActions } from "../state/hash-widget.context";
import { validateFile } from "../utils/validate-file";
import { formatBytes } from "../utils/format-bytes";

export function FileUploader() {
  const file = useHashWidgetStore((state) => state.file);
  const status = useHashWidgetStore((state) => state.status);
  const { setFile, setError } = useHashWidgetActions();
  const inputRef = useRef<HTMLInputElement>(null);

  // Only show when no file is selected or in idle state
  if (file && (status === "computing" || status === "completed")) {
    return null;
  }

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const error = validateFile(selectedFile);
    if (error) {
      setError(error);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
        data-testid="file-upload-zone"
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drop file here or click to select
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Supports files up to 10GB
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          aria-label="Drop file here or click to select"
        />
      </div>

      {file && status === "idle" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

