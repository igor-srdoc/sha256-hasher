import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DescriptionInput } from "./description-input";
import { useHashState } from "../state/hash.state";
import { MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";

describe("DescriptionInput", () => {
  beforeEach(() => {
    // Reset state before each test
    useHashState.setState({
      file: null,
      status: "idle",
      description: "",
      progress: 0,
      error: null,
      result: null,
    });
  });

  it("enforces character limit", async () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "idle",
      description: "",
    });

    render(<DescriptionInput />);
    const textarea = screen.getByRole("textbox");

    // First add text within the limit
    const validText = "a".repeat(MAX_DESCRIPTION_LENGTH);
    fireEvent.change(textarea, { target: { value: validText } });

    await waitFor(() => {
      const state = useHashState.getState();
      expect(state.description.length).toBe(MAX_DESCRIPTION_LENGTH);
    });

    // Now try to exceed the limit - it should not update
    const longText = "a".repeat(MAX_DESCRIPTION_LENGTH + 100);
    fireEvent.change(textarea, { target: { value: longText } });

    // State should still be at MAX_DESCRIPTION_LENGTH
    const finalState = useHashState.getState();
    expect(finalState.description.length).toBe(MAX_DESCRIPTION_LENGTH);
  });

  it("shows character counter", () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "idle",
      description: "",
    });

    render(<DescriptionInput />);
    expect(
      screen.getByText(`${MAX_DESCRIPTION_LENGTH} characters remaining`)
    ).toBeInTheDocument();
  });

  it("updates counter as user types", () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "idle",
    });

    render(<DescriptionInput />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(
      screen.getByText(`${MAX_DESCRIPTION_LENGTH - 5} characters remaining`)
    ).toBeInTheDocument();
  });

  it("hides when file is not selected", () => {
    useHashState.setState({
      file: null,
      status: "idle",
    });

    const { container } = render(<DescriptionInput />);
    expect(container.firstChild).toBeNull();
  });

  it("remains visible during computation", () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "computing",
      description: "Initial description",
    });

    render(<DescriptionInput />);

    // Should still be visible and editable
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Initial description");
  });

  it("hides when computation is completed", () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "completed",
      description: "Final description",
    });

    const { container } = render(<DescriptionInput />);

    expect(container.firstChild).toBeNull();
  });
});

