import { adjustHex, hexToFlColor, hexToFlRgbColor, hexToRgb, rgbToHsl } from "./color";
import type { ThemeMapping } from "./mapper";
import type { PatchableThemeKey, ThemePatch } from "./themeFormat";

export type Adjustments = {
  hue: number;
  saturation: number;
  lightness: number;
  contrast: number;
  text: number;
};

export type AdjustmentPresetId = "grape";

export type AdjustmentPreset = {
  id: AdjustmentPresetId;
  label: string;
  description: string;
  values: Adjustments;
};

export const ADJUSTMENT_PRESETS: AdjustmentPreset[] = [
  {
    id: "grape",
    label: "Grape",
    description: "Template-derived values used by the current Grape base theme.",
    values: {
      hue: 0,
      saturation: 256,
      lightness: 132,
      contrast: 64,
      text: -191,
    },
  },
];

export const DEFAULT_ADJUSTMENT_PRESET_ID: AdjustmentPresetId = "grape";
export const DEFAULT_ADJUSTMENTS = ADJUSTMENT_PRESETS[0].values;
export const INPUT_COLOR_ADJUSTMENTS: Adjustments = {
  ...DEFAULT_ADJUSTMENTS,
  lightness: 128,
};

export function adjustmentPresetById(id: AdjustmentPresetId): AdjustmentPreset {
  const preset = ADJUSTMENT_PRESETS.find((item) => item.id === id);
  if (!preset) {
    throw new Error(`Unknown adjustment preset: ${id}`);
  }

  return preset;
}

export function applyAdjustmentToHex(hex: string, adjustments: Adjustments): string {
  try {
    const hsl = rgbToHsl(hexToRgb(hex));
    return adjustHex(hex, {
      h: ((hsl.h + adjustments.hue * (360 / 127)) % 360 + 360) % 360,
      s: Math.min(1, Math.max(0, hsl.s * (adjustments.saturation / 256))),
      l: Math.min(1, Math.max(0, hsl.l + (adjustments.lightness - 128) / 255)),
    });
  } catch {
    return hex;
  }
}

export function applyAdjustmentsToPreview(
  preview: ThemeMapping["preview"],
  adjustments: Adjustments,
): ThemeMapping["preview"] {
  const adjust = (color: string) => applyAdjustmentToHex(color, adjustments);
  return {
    ...preview,
    background: adjust(preview.background),
    surface: adjust(preview.surface),
    surfaceAlt: adjust(preview.surfaceAlt),
    panel: adjust(preview.panel),
    plGrid: adjust(preview.plGrid),
    selected: adjust(preview.selected),
    highlight: adjust(preview.highlight),
    mute: adjust(preview.mute),
    option: adjust(preview.option),
    stepEven: adjust(preview.stepEven),
    stepOdd: adjust(preview.stepOdd),
    text: adjust(preview.text),
    muted: adjust(preview.stepEven),
    notes: preview.notes.map(adjust),
    meters: preview.meters.map(adjust),
  };
}

export function outputNoteColors(mapping: ThemeMapping, adjustments: Adjustments): string[] {
  const adjustedPreview = applyAdjustmentsToPreview(mapping.preview, adjustments);
  return mapping.preview.notes.map(() => adjustedPreview.selected);
}

export function withAdjustments(mapping: ThemeMapping, adjustments: Adjustments): ThemePatch {
  const autoHue = mapping.patch.Hue ?? 0;
  const adjustedPreview = applyAdjustmentsToPreview(mapping.preview, adjustments);
  const notes = outputNoteColors(mapping, adjustments);
  const notePatch = Object.fromEntries(
    notes.map((note, index) => [
      `NoteColor${index}` as PatchableThemeKey,
      hexToFlColor(note),
    ]),
  ) as ThemePatch;
  const meterPatch = Object.fromEntries(
    adjustedPreview.meters.map((meter, index) => [
      `Meter${index}` as PatchableThemeKey,
      hexToFlColor(meter),
    ]),
  ) as ThemePatch;

  return {
    ...mapping.patch,
    BackColor: hexToFlColor(adjustedPreview.background),
    PRGridback: hexToFlColor(adjustedPreview.plGrid),
    PLGridback: hexToFlColor(adjustedPreview.plGrid),
    EEGridback: hexToFlColor(adjustedPreview.stepOdd),
    Selected: hexToFlRgbColor(adjustedPreview.selected),
    Highlight: hexToFlColor(adjustedPreview.highlight),
    Mute: hexToFlColor(adjustedPreview.mute),
    Option: hexToFlColor(adjustedPreview.option),
    StepEven: hexToFlColor(adjustedPreview.stepEven),
    StepOdd: hexToFlColor(adjustedPreview.stepOdd),
    TextColor: hexToFlRgbColor(adjustedPreview.text),
    ...meterPatch,
    ...notePatch,
    Hue: Math.max(-255, Math.min(255, autoHue + adjustments.hue)),
    Saturation: adjustments.saturation,
    Lightness: adjustments.lightness,
    Contrast: adjustments.contrast,
    Text: adjustments.text,
  };
}
