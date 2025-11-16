import { Textarea } from "@ui/textarea";
import { Label } from "@ui/label";
import { useHashState } from "../state/hash.state";
import { MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";

export function DescriptionInput() {
  const { file, status, description, setDescription } = useHashState();

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

  return (
    <div className="space-y-2">
      <Label htmlFor="description">File Description (Optional)</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => handleChange(e.target.value)}
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

