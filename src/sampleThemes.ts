import { generatePaletteFromColor } from "./color";
import { DEFAULT_ADJUSTMENT_PRESET_ID, INPUT_COLOR_ADJUSTMENTS, type AdjustmentPresetId, type Adjustments } from "./adjustments";
import { presetPaletteById, type Palette } from "./mapper";

export type SampleThemeDefinition = {
  filename: string;
  palette: string[];
  adjustmentPresetId?: AdjustmentPresetId;
  adjustments?: Adjustments;
  preferredSelection?: string;
};

function presetColors(id: string): string[] {
  return presetPaletteById(id).colors;
}

export const SAMPLE_THEMES: SampleThemeDefinition[] = [
  {
    filename: "Grape.flstheme",
    palette: presetColors("grape-night"),
  },
  {
    filename: "sky-fresh.flstheme",
    palette: generatePaletteFromColor("#89CFF0"),
    preferredSelection: "#89CFF0",
    adjustments: INPUT_COLOR_ADJUSTMENTS,
  },
  {
    filename: "bb.flstheme",
    palette: generatePaletteFromColor("#FFB7CE"),
    preferredSelection: "#FFB7CE",
    adjustments: INPUT_COLOR_ADJUSTMENTS,
  },
];

export function sampleThemePalette(filename: string): Palette["colors"] {
  const sample = SAMPLE_THEMES.find((theme) => theme.filename === filename);
  if (!sample) {
    throw new Error(`Unknown sample theme: ${filename}`);
  }

  return sample.palette;
}

export function sampleThemeAdjustmentPresetId(filename: string): AdjustmentPresetId {
  const sample = SAMPLE_THEMES.find((theme) => theme.filename === filename);
  if (!sample) {
    throw new Error(`Unknown sample theme: ${filename}`);
  }

  return sample.adjustmentPresetId ?? DEFAULT_ADJUSTMENT_PRESET_ID;
}
