import { describe, expect, it } from "vitest";
import { contrastRatio, flColorToHex, generatePaletteFromColor, hexToFlColor, hexToFlRgbColor, normalizeHex, readableTextColor, relativeLuminance } from "./color";

describe("color utilities", () => {
  it("converts HEX to FL Studio signed 24-bit color", () => {
    expect(hexToFlColor("#9A8CE5")).toBe(-1733478);
    expect(hexToFlColor("#00588F")).toBe(-7383040);
    expect(hexToFlColor("#000000")).toBe(0);
    expect(hexToFlColor("#FFFFFF")).toBe(-1);
  });

  it("converts HEX to raw RGB signed 24-bit color for Selected", () => {
    expect(hexToFlRgbColor("#9A8CE5")).toBe(-6648603);
    expect(hexToFlRgbColor("#9ACDDF")).toBe(-6631969);
    expect(hexToFlRgbColor("#000000")).toBe(0);
    expect(hexToFlRgbColor("#FFFFFF")).toBe(-1);
  });

  it("converts FL Studio signed 24-bit color to HEX", () => {
    expect(flColorToHex(-1733478)).toBe("#9A8CE5");
    expect(flColorToHex(-7383040)).toBe("#00588F");
    expect(flColorToHex(0)).toBe("#000000");
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

  it("generates a 6-color palette from a single hex color and preserves the requested color", () => {
    const palette = generatePaletteFromColor("#89CFF0");
    expect(palette).toHaveLength(6);
    expect(palette).toContain("#89CFF0");
    palette.forEach((c) => expect(() => normalizeHex(c)).not.toThrow());
    expect(relativeLuminance(palette[0])).toBeLessThan(relativeLuminance(palette[1]));
  });
});
