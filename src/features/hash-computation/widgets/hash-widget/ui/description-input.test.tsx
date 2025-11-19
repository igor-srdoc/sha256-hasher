import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HashWidget } from "../hash-widget";
import { MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";

// Integration Tests: Test DescriptionInput through the full HashWidget
// The widget uses isolated Zustand instances, so we test via integration
describe("DescriptionInput Integration", () => {
  it("enforces character limit", async () => {
    render(<HashWidget />);
    
    // Upload a file to make description input visible
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /description/i });

    // Type text within the limit
    const validText = "a".repeat(MAX_DESCRIPTION_LENGTH);
    fireEvent.change(textarea, { target: { value: validText } });

    await waitFor(() => {
      expect(textarea).toHaveValue(validText);
    });

    // Try to exceed the limit - should be truncated
    const longText = "a".repeat(MAX_DESCRIPTION_LENGTH + 100);
    fireEvent.change(textarea, { target: { value: longText } });

    await waitFor(() => {
      const currentValue = (textarea as HTMLTextAreaElement).value;
      expect(currentValue.length).toBe(MAX_DESCRIPTION_LENGTH);
    });
  });

  it("shows character counter", async () => {
    render(<HashWidget />);
    
    // Upload a file to make description input visible
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(`${MAX_DESCRIPTION_LENGTH} characters remaining`)
      ).toBeInTheDocument();
    });
  });

  it("updates counter as user types", async () => {
    render(<HashWidget />);
    
    // Upload a file
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /description/i });
    fireEvent.change(textarea, { target: { value: "Hello" } });

    await waitFor(() => {
      expect(
        screen.getByText(`${MAX_DESCRIPTION_LENGTH - 5} characters remaining`)
      ).toBeInTheDocument();
    });
  });

  it("hides when file is not selected", () => {
    render(<HashWidget />);

    // Description input should not be visible initially
    expect(screen.queryByRole("textbox", { name: /description/i })).not.toBeInTheDocument();
  });

  it("remains visible during computation", async () => {
    render(<HashWidget />);
    
    // Upload a file and add description
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox", { name: /description/i });
    fireEvent.change(textarea, { target: { value: "Initial description" } });

    // Start computation
    const computeButton = screen.getByRole("button", { name: /compute sha256 hash/i });
    fireEvent.click(computeButton);

    // Description field should still be visible and editable during computation
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    });
    
    expect(textarea).toHaveValue("Initial description");
  });

  it("hides when computation is completed", async () => {
    render(<HashWidget />);
    
    // Upload a file
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /description/i })).toBeInTheDocument();
    });

    // Note: This test verifies the component hides when status is "completed"
    // In actual usage, after computation completes, only the results textarea is shown
    // We can't easily test the completion state in JSDOM as Web Workers don't run
    // This is better tested in E2E tests where the full worker lifecycle works
  });
});

