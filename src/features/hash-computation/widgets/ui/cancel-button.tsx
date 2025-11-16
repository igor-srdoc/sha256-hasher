import { Button } from "@ui/button";
import { useHashWidgetStore, useHashWidgetActions } from "../hash-widget.context";

export function CancelButton() {
  const status = useHashWidgetStore((state) => state.status);
  const { cancel } = useHashWidgetActions();

  // Only show when computing
  if (status !== "computing") {
    return null;
  }

  const handleCancel = () => {
    // Cancel action now handles worker termination internally
    cancel();
  };

  return (
    <Button onClick={handleCancel} variant="outline" className="w-full">
      Cancel
    </Button>
  );
}

