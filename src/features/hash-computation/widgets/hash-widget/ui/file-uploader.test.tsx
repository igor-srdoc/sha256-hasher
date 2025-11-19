import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HashWidget } from "../hash-widget";
import { MAX_FILE_SIZE_BYTES } from "../hash-computation.const";

// Integration Tests: Test FileUploader through the full HashWidget
// The widget uses isolated Zustand instances, so we test via integration
describe("FileUploader Integration", () => {
  it("renders file upload zone", () => {
    render(<HashWidget />);
    expect(
      screen.getByText(/Drop file here or click to select/i)
    ).toBeInTheDocument();
  });

  it("shows file info after selection", async () => {
    render(<HashWidget />);
    
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
      expect(screen.getByText(/7 Bytes/i)).toBeInTheDocument();
    });
  });

  it("validates file size", async () => {
    render(<HashWidget />);
    
    const largeFile = new File(["content"], "large.txt", {
      type: "text/plain",
    });
    Object.defineProperty(largeFile, "size", {
      value: MAX_FILE_SIZE_BYTES + 1,
      writable: false,
    });

    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/file size exceeds the maximum/i)).toBeInTheDocument();
    });
    
    // File should not be displayed
    expect(screen.queryByText("large.txt")).not.toBeInTheDocument();
  });

  it("allows removing selected file", async () => {
    render(<HashWidget />);
    
    const fileInput = screen.getByLabelText(/drop file here or click to select/i);
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });

    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
      expect(screen.getByText(/Drop file here or click to select/i)).toBeInTheDocument();
    });
  });
});
