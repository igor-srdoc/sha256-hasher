import { Copy, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@ui/button";
import { Textarea } from "@ui/textarea";
import { Label } from "@ui/label";
import { useHashWidgetStore, useHashWidgetActions } from "../state/hash-widget.context";
import { formatBytes } from "../utils/format-bytes";
import { MESSAGES, MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";

export function ResultsDisplay() {
  const result = useHashWidgetStore((state) => state.result);
  const status = useHashWidgetStore((state) => state.status);
  const description = useHashWidgetStore((state) => state.description);
  const descriptionWasFocused = useHashWidgetStore((state) => state.descriptionWasFocused);
  const { reset, setDescription } = useHashWidgetActions();
  const [copied, setCopied] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Only show when completed
  if (status !== "completed" || !result) return null;

  // Auto-focus description field if user was typing when computation completed
  useEffect(() => {
    if (descriptionWasFocused && descriptionRef.current) {
      descriptionRef.current.focus();
      // Move cursor to end of text
      const length = descriptionRef.current.value.length;
      descriptionRef.current.setSelectionRange(length, length);
    }
  }, [descriptionWasFocused]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDescriptionChange = (value: string) => {
    // Enforce character limit
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  const remaining = MAX_DESCRIPTION_LENGTH - description.length;

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            {MESSAGES.SUCCESS.HASH_COMPUTED}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">SHA256 Hash:</p>
            <div className="bg-white rounded p-3 border border-green-200">
              <code className="text-sm font-mono text-green-700 break-all">
                {result.hash}
              </code>
            </div>
            <Button
              onClick={handleCopy}
              className="mt-2"
              size="sm"
              variant="outline"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Hash
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">File Name:</p>
              <p className="font-medium text-gray-900">{result.fileName}</p>
            </div>
            <div>
              <p className="text-gray-600">File Size:</p>
              <p className="font-medium text-gray-900">
                {formatBytes(result.fileSize)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="result-description">
              Description (Optional)
            </Label>
            <Textarea
              id="result-description"
              ref={descriptionRef}
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Add a description for this file..."
              rows={3}
              className="resize-none bg-white"
            />
            <p className="text-sm text-gray-500 text-right">
              {remaining} characters remaining
            </p>
          </div>

          <div className="text-xs text-gray-500">
            Computed at: {result.computedAt.toLocaleString()}
          </div>
        </div>
      </div>

      <Button onClick={reset} className="w-full" variant="outline">
        Compute Another Hash
      </Button>
    </div>
  );
}

