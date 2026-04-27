import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { flColorToHex, generatePaletteFromColor, hexToFlColor, hexToFlRgbColor } from "./color";
import { parseThemeLines } from "./themeFormat";
import { PRESET_PALETTES, mapPaletteToTheme, themeColorCodec } from "./mapper";
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

  it("creates meter and note colors as FL-compatible numeric values", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[1].colors);

    for (let index = 0; index <= 5; index += 1) {
      expect(mapping.patch[`Meter${index}` as keyof typeof mapping.patch]).toEqual(expect.any(Number));
    }

    for (let index = 0; index <= 15; index += 1) {
      expect(mapping.patch[`NoteColor${index}` as keyof typeof mapping.patch]).toEqual(expect.any(Number));
    }
  });

  it("stores piano roll note colors as BGR/COLORREF values matching the preview notes", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[0].colors);

    expect(mapping.patch.NoteColor0).toBe(hexToFlColor(mapping.preview.notes[0]));
    expect(themeColorCodec.decode("NoteColor0", mapping.patch.NoteColor0!)).toBe(mapping.preview.notes[0]);
  });

  it("generates pink piano roll notes for warm pink palettes", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"));

    expect(mapping.patch.NoteColor0).toBe(hexToFlColor("#B82D5C"));
    expect(mapping.preview.notes[0]).toBe("#B82D5C");
  });

  it("uses FL theme BGR note values from an exported default theme sample", () => {
    const notePink = readFileSync("sample/note pink.flstheme", "utf8");
    const noteColor0 = Number(
      parseThemeLines(notePink).tokens.find((token) => token.key === "NoteColor0")?.value,
    );

    expect(noteColor0).toBe(13547519);
    expect(flColorToHex(noteColor0)).toBe("#FFB7CE");
  });

  it("does not store note colors as raw RGB values when the BGR value would differ", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[0].colors);

    expect(mapping.preview.notes[0]).toBe("#5C45A1");
    expect(hexToFlRgbColor(mapping.preview.notes[0])).toBe(6047137);
    expect(mapping.patch.NoteColor0).toBe(hexToFlColor(mapping.preview.notes[0]));
    expect(mapping.patch.NoteColor0).not.toBe(hexToFlRgbColor(mapping.preview.notes[0]));
  });

  it("rejects palettes outside the MVP size bounds", () => {
    expect(() => mapPaletteToTheme(["#000000", "#111111", "#222222"])).toThrow(
      "Palette must contain 4 to 6 HEX colors.",
    );
  });

  it("keeps sky-blue generated colors blue after FL color packing", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#89CFF0"), {
      preferredSelection: "#89CFF0",
    });

    expect(themeColorCodec.decode("Selected", mapping.patch.Selected!)).toBe("#89CFF0");
    expect(flColorToHex(mapping.patch.Highlight!)).toBe("#9ACDDF");
    expect(flColorToHex(mapping.patch.StepEven!)).toBe("#00588F");
    expect(flColorToHex(mapping.patch.Meter0!)).toBe("#22596C");
  });

  it("keeps Cold Signal browser selection in the cool palette range", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[2].colors);

    expect(mapping.preview.selected).toBe("#38BDF8");
    expect(themeColorCodec.decode("Selected", mapping.patch.Selected!)).toBe("#38BDF8");
  });

  it("stores selection as raw RGB to avoid swapping warm pink into purple", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"), {
      preferredSelection: "#FFB7CE",
    });

    expect(mapping.preview.selected).toBe("#FFB7CE");
    expect(mapping.patch.Selected).toBe(hexToFlRgbColor("#FFB7CE"));
    expect(themeColorCodec.decode("Selected", mapping.patch.Selected!)).toBe("#FFB7CE");
  });

  it("keeps bright pastel generated palettes close to the requested selection color", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#E8E5FF"), {
      preferredSelection: "#E8E5FF",
    });

    expect(mapping.preview.selected).toBe("#E8E5FF");
    expect(themeColorCodec.decode("Selected", mapping.patch.Selected!)).toBe("#E8E5FF");
  });

  it("dampens hue rotation for low-saturation blue gray input colors", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#D0DAE6"), {
      preferredSelection: "#D0DAE6",
    });

    expect(mapping.preview.selected).toBe("#D0DAE6");
    expect(mapping.patch.Hue).toBe(-11);
  });

  it("uses the playlist grid color for the piano roll grid background", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#89CFF0"));

    expect(mapping.patch.PRGridback).toBe(mapping.patch.PLGridback);
  });

  it("calibrates warm pink generated palettes toward the lower FL hue range", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"));

    expect(mapping.patch.Hue).toBe(-126);
  });

  it("calibrates mint green generated palettes into the green zone with positive FL hue", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#A9D9C2"), {
      preferredSelection: "#A9D9C2",
    });

    expect(mapping.patch.Hue).toBe(44);
  });

  it("stores browser text color as raw RGB against the light FL surface", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"));

    expect(mapping.preview.text).toBe("#111827");
    expect(mapping.patch.TextColor).toBe(hexToFlRgbColor("#111827"));
    expect(themeColorCodec.decode("TextColor", mapping.patch.TextColor!)).toBe("#111827");
  });
});
