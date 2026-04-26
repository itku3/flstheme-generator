import { describe, expect, it } from "vitest";
import { flColorToHex, generatePaletteFromColor } from "./color";
import { PRESET_PALETTES, mapPaletteToTheme } from "./mapper";
import { PATCHABLE_THEME_KEYS, PROTECTED_THEME_KEYS } from "./themeFormat";

describe("palette mapper", () => {
  it("creates deterministic patches inside the exact whitelist", () => {
    const first = mapPaletteToTheme(PRESET_PALETTES[0].colors);
    const second = mapPaletteToTheme(PRESET_PALETTES[0].colors);

    expect(first.patch).toEqual(second.patch);
    const patchableSet = new Set<string>(PATCHABLE_THEME_KEYS);
    for (const key of Object.keys(first.patch)) {
      expect(patchableSet.has(key)).toBe(true);
    }
    for (const key of PROTECTED_THEME_KEYS) {
      expect(first.patch).not.toHaveProperty(key);
    }
  });

  it("creates meter and note colors as signed 24-bit values", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[1].colors);

    for (let index = 0; index <= 5; index += 1) {
      expect(mapping.patch[`Meter${index}` as keyof typeof mapping.patch]).toEqual(expect.any(Number));
    }

    for (let index = 0; index <= 15; index += 1) {
      expect(mapping.patch[`NoteColor${index}` as keyof typeof mapping.patch]).toEqual(expect.any(Number));
    }
  });

  it("rejects palettes outside the MVP size bounds", () => {
    expect(() => mapPaletteToTheme(["#000000", "#111111", "#222222"])).toThrow(
      "Palette must contain 4 to 6 HEX colors.",
    );
  });

  it("keeps sky-blue generated colors blue after FL color packing", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#89CFF0"));

    expect(mapping.patch.Selected).toBe(-6631969);
    expect(flColorToHex(mapping.patch.Highlight!)).toBe("#429BC0");
    expect(flColorToHex(mapping.patch.StepEven!)).toBe("#00588F");
    expect(flColorToHex(mapping.patch.Meter0!)).toBe("#24566B");
  });

  it("uses the playlist grid color for the piano roll grid background", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#89CFF0"));

    expect(mapping.patch.PRGridback).toBe(mapping.patch.PLGridback);
  });
});
