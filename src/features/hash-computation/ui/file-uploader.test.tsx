import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { FileUploader } from "./file-uploader";
import { useHashState } from "../state/hash.state";
import { MAX_FILE_SIZE_BYTES } from "../hash-computation.const";

describe("FileUploader", () => {
  beforeEach(() => {
    useHashState.setState({
      file: null,
      status: "idle",
      description: "",
      progress: 0,
      error: null,
      result: null,
    });
  });

  it("renders file upload zone", () => {
    render(<FileUploader />);
    expect(
      screen.getByText(/Drop file here or click to select/i)
    ).toBeInTheDocument();
  });

  it("shows file info after selection", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    
    render(<FileUploader />);
    const input = screen.getByLabelText(/drop file here/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const state = useHashState.getState();
    expect(state.file).toBeTruthy();
    expect(state.file?.name).toBe("test.txt");
  });

  it("validates file size", () => {
    const largeFile = new File(["content"], "large.txt", {
      type: "text/plain",
    });
    Object.defineProperty(largeFile, "size", {
      value: MAX_FILE_SIZE_BYTES + 1,
    });
    
    render(<FileUploader />);
    const input = screen.getByLabelText(/drop file here/i);
    
    fireEvent.change(input, { target: { files: [largeFile] } });

    const state = useHashState.getState();
    expect(state.error).toBeTruthy();
    expect(state.file).toBeNull();
  });

  it("allows removing selected file", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });

    useHashState.setState({
      file,
      status: "idle",
    });

    render(<FileUploader />);
    const removeButton = screen.getByText(/remove/i);
    fireEvent.click(removeButton);

    const state = useHashState.getState();
    expect(state.file).toBeNull();
  });
});

