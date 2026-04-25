import { describe, expect, it } from "vitest";
import { contrastRatio, flColorToHex, hexToFlColor, normalizeHex, readableTextColor } from "./color";

describe("color utilities", () => {
  it("converts HEX to FL Studio signed 24-bit color", () => {
    expect(hexToFlColor("#9A8CE5")).toBe(-6648603);
    expect(hexToFlColor("#000000")).toBe(0);
    expect(hexToFlColor("#FFFFFF")).toBe(-1);
  });

  it("converts FL Studio signed 24-bit color to HEX", () => {
    expect(flColorToHex(-6648603)).toBe("#9A8CE5");
    expect(flColorToHex(-16777216)).toBe("#000000");
  });

  it("validates HEX input", () => {
    expect(normalizeHex("9a8ce5")).toBe("#9A8CE5");
    expect(() => normalizeHex("#XYZXYZ")).toThrow("Invalid HEX color");
  });

  it("chooses readable text colors", () => {
    expect(readableTextColor("#08090B")).toBe("#F8FAFC");
    expect(readableTextColor("#F8FAFC")).toBe("#111827");
    expect(contrastRatio("#08090B", readableTextColor("#08090B"))).toBeGreaterThanOrEqual(4.5);
  });
});
