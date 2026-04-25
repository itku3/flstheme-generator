import { describe, expect, it } from "vitest";
import { PRESET_PALETTES, mapPaletteToTheme } from "./mapper";
import { PATCHABLE_THEME_KEYS, PROTECTED_THEME_KEYS } from "./themeFormat";

describe("palette mapper", () => {
  it("creates deterministic patches inside the exact whitelist", () => {
    const first = mapPaletteToTheme(PRESET_PALETTES[0].colors);
    const second = mapPaletteToTheme(PRESET_PALETTES[0].colors);

    expect(first.patch).toEqual(second.patch);
    expect(Object.keys(first.patch).sort()).toEqual([...PATCHABLE_THEME_KEYS].sort());
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
});
