import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { adjustmentPresetById, outputNoteColors, withAdjustments } from "../src/adjustments";
import { mapPaletteToTheme } from "../src/mapper";
import { serializeNoteColorPreset } from "../src/ncp";
import { SAMPLE_THEMES } from "../src/sampleThemes";
import { generateTheme } from "../src/themeFormat";

export async function generateSamples(): Promise<void> {
  const template = await readFile("src/fixtures/templates/Grape.flstheme", "utf8");

  await Promise.all(
    SAMPLE_THEMES.map(async ({ filename, palette, adjustmentPresetId = "grape", adjustments: explicitAdjustments, preferredSelection }) => {
      const mapping = mapPaletteToTheme(palette, { preferredSelection });
      const adjustments = explicitAdjustments ?? adjustmentPresetById(adjustmentPresetId).values;
      const patch = withAdjustments(mapping, adjustments);
      const themeText = generateTheme(template, patch);
      await writeFile(join("sample", filename), themeText);
      await writeFile(
        join("sample", filename.replace(/\.flstheme$/i, ".ncp")),
        serializeNoteColorPreset(outputNoteColors(mapping, adjustments)),
      );
    }),
  );
}

await generateSamples();
