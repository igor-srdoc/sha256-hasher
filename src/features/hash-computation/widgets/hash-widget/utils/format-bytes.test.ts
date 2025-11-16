import { describe, it, expect } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("formats 0 bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
    expect(formatBytes(1023)).toBe("1023 Bytes");
  });

  it("formats kilobytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
    expect(formatBytes(10 * 1024 * 1024 * 1024)).toBe("10 GB");
  });

  it("formats terabytes correctly", () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatBytes(1234567)).toBe("1.18 MB");
  });

  it("handles large numbers", () => {
    const tenGB = 10 * 1024 * 1024 * 1024;
    expect(formatBytes(tenGB)).toBe("10 GB");
  });
});

