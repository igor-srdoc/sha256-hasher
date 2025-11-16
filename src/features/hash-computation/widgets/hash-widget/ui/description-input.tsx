import { Textarea } from "@ui/textarea";
import { Label } from "@ui/label";
import {
  useHashWidgetStore,
  useHashWidgetActions,
} from "../state/hash-widget.context";
import { MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";

export function DescriptionInput() {
  const file = useHashWidgetStore((state) => state.file);
  const status = useHashWidgetStore((state) => state.status);
  const description = useHashWidgetStore((state) => state.description);
  const { setDescription, setDescriptionFocused } = useHashWidgetActions();

  // Only show when file is selected (but allow editing during computation!)
  // Hide only when completed to show results
  if (!file || status === "completed") return null;

  const remaining = MAX_DESCRIPTION_LENGTH - description.length;

  const handleChange = (value: string) => {
    // Enforce character limit
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  const handleFocus = () => {
    setDescriptionFocused(true);
  };

  const handleBlur = () => {
    setDescriptionFocused(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="description">File Description (Optional)</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Add a description for this file..."
        rows={3}
        className="resize-none"
      />
      <p className="text-sm text-gray-500 text-right">
        {remaining} characters remaining
      </p>
    </div>
  );
}
