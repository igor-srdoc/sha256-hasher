import { describe, it, expect } from "vitest";
import { validateFile } from "./validate-file";
import { MAX_FILE_SIZE_BYTES, MESSAGES } from "../hash-computation.const";

describe("validateFile", () => {
  it("returns null for valid file under 10GB", () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    Object.defineProperty(file, "size", { value: 1024 * 1024 }); // 1MB
    expect(validateFile(file)).toBeNull();
  });

  it("returns error for file over 10GB", () => {
    const file = new File(["content"], "large.txt", { type: "text/plain" });
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_BYTES + 1 });
    expect(validateFile(file)).toBe(MESSAGES.ERRORS.FILE_TOO_LARGE);
  });

  it("accepts file exactly at 10GB limit", () => {
    const file = new File(["content"], "exactly10gb.txt", {
      type: "text/plain",
    });
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_BYTES });
    expect(validateFile(file)).toBeNull();
  });
});

