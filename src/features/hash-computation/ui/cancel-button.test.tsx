import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { CancelButton } from "./cancel-button";
import { useHashState } from "../state/hash.state";

// Mock Worker
vi.stubGlobal("Worker", class Worker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
});

describe("CancelButton", () => {
  beforeEach(() => {
    useHashState.getState().reset();
  });

  it("does not render when status is idle", () => {
    useHashState.setState({ status: "idle" });
    const { container } = render(<CancelButton />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when status is computing", () => {
    useHashState.setState({ status: "computing", progress: 50 });
    render(<CancelButton />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("does not render when status is completed", () => {
    useHashState.setState({ status: "completed" });
    const { container } = render(<CancelButton />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when status is error", () => {
    useHashState.setState({ status: "error", error: "Test error" });
    const { container } = render(<CancelButton />);
    expect(container.firstChild).toBeNull();
  });

  it("calls cancel when clicked", async () => {
    const user = userEvent.setup();
    useHashState.setState({ status: "computing", progress: 50 });

    render(<CancelButton />);
    const button = screen.getByRole("button", { name: /cancel/i });

    await user.click(button);

    // After cancel, status should be idle
    const state = useHashState.getState();
    expect(state.status).toBe("idle");
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
  });
});

