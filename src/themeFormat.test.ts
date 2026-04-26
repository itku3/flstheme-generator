import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapPaletteToTheme, PRESET_PALETTES } from "./mapper";
import {
  PATCHABLE_THEME_KEYS,
  type ThemePatch,
  generateTheme,
  parseThemeLines,
  patchThemeTokens,
  serializeThemeLines,
} from "./themeFormat";

const fixture = readFileSync("src/fixtures/templates/Grape.flstheme", "utf8");

describe("theme format", () => {
  it("parses and serializes the fixture without changing bytes", () => {
    const parsed = parseThemeLines(fixture);

    expect(parsed.newline).toBe("\r\n");
    expect(parsed.tokens).toHaveLength(49);
    expect(serializeThemeLines(parsed)).toBe(fixture);
  });

  it("patches only exact whitelisted keys", () => {
    const generated = generateTheme(fixture, {
      Selected: -1,
      BackColor: 0,
    });
    const originalLines = fixture.split("\r\n");
    const generatedLines = generated.split("\r\n");

    expect(generated).toContain("\r\n");
    expect(generatedLines).toHaveLength(originalLines.length);

    const changedKeys = originalLines.flatMap((line, index) => {
      if (line === generatedLines[index]) {
        return [];
      }

      return [line.split("=")[0]];
    });

    expect(changedKeys.sort()).toEqual(["BackColor", "Selected"]);
  });

  it("rejects non-whitelisted patch requests", () => {
    const parsed = parseThemeLines(fixture);
    const invalidPatch = { OverrideClips: 0 } as unknown as ThemePatch;
    expect(() => patchThemeTokens(parsed, invalidPatch)).toThrow("Cannot patch non-whitelisted key");
  });

  it("rejects missing and duplicate requested keys", () => {
    const parsedMissing = parseThemeLines(fixture.replace(/^Selected=.*\r\n/m, ""));
    expect(() => patchThemeTokens(parsedMissing, { Selected: -1 })).toThrow(
      "Expected exactly one Selected line, found 0",
    );

    const parsedDuplicate = parseThemeLines(`${fixture}Selected=-1\r\n`);
    expect(() => patchThemeTokens(parsedDuplicate, { Selected: -1 })).toThrow(
      "Expected exactly one Selected line, found 2",
    );
  });

  it("keeps generated file diff shape inside the whitelist", () => {
    const mapping = mapPaletteToTheme(PRESET_PALETTES[2].colors);
    const generated = generateTheme(fixture, mapping.patch);
    const originalLines = fixture.split("\r\n");
    const generatedLines = generated.split("\r\n");
    const whitelist = new Set<string>(PATCHABLE_THEME_KEYS);

    expect(generatedLines).toHaveLength(originalLines.length);
    expect(generated).toMatch(/\r\n/);

    originalLines.forEach((line, index) => {
      const key = line.split("=")[0];
      if (line !== generatedLines[index]) {
        expect(whitelist.has(key)).toBe(true);
      }
    });

    expect(generated).toContain("Hue=0\r\n");
    expect(generated).toContain("Lightmode=1\r\n");
    expect(generated).toContain("OverrideClips=1\r\n");
    expect(generated).toContain("PRGridCustom=1\r\n");
    expect(generated).toContain("PLGridCustom=1\r\n");
    expect(generated).toContain("EEGridCustom=1\r\n");
    expect(generated).toContain("EEGridContrast=100\r\n");
  });
});
