import {
  adjustHex,
  contrastRatio,
  hexToFlColor,
  normalizeHex,
  readableTextColor,
  relativeLuminance,
  rgbToHsl,
  hexToRgb,
} from "./color";
import type { ThemePatch } from "./themeFormat";

export type Palette = {
  id: string;
  name: string;
  colors: string[];
};

export type ThemeMapping = {
  patch: ThemePatch;
  preview: {
    background: string;
    panel: string;
    plGrid: string;
    selected: string;
    highlight: string;
    text: string;
    muted: string;
    notes: string[];
    meters: string[];
  };
  contrast: number;
};

export const PRESET_PALETTES: Palette[] = [
  {
    id: "grape-night",
    name: "Grape Night",
    colors: ["#121018", "#322B58", "#9A8CE5", "#DC778F", "#FF1973", "#F8FAFC"],
  },
  {
    id: "oxide-lime",
    name: "Oxide Lime",
    colors: ["#101612", "#26342A", "#7CC66A", "#E3C84E", "#F5F7E8"],
  },
  {
    id: "cold-signal",
    name: "Cold Signal",
    colors: ["#0F172A", "#1D3557", "#38BDF8", "#A7F3D0", "#F8FAFC"],
  },
];

export function mapPaletteToTheme(rawPalette: string[]): ThemeMapping {
  const palette = normalizePalette(rawPalette);
  const sortedByLight = [...palette].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const background = sortedByLight[0];
  const bgHsl = rgbToHsl(hexToRgb(background));
  const panel = adjustHex(background, { l: Math.min(0.28, bgHsl.l + 0.08) });
  const text = readableTextColor(background);
  const accentCandidates = [...palette].sort((a, b) => scoreAccent(b, background) - scoreAccent(a, background));
  const selected = accentCandidates[0];
  const highlight = accentCandidates[1] ?? selected;
  const mute = accentCandidates[2] ?? highlight;
  const option = accentCandidates[3] ?? selected;
  const stepEven = adjustHex(panel, { l: 0.22 });
  const stepOdd = adjustHex(panel, { l: 0.16 });
  const meters = buildMeterColors(background, highlight);
  const notes = buildNoteColors(palette);
  const selectedHsl = rgbToHsl(hexToRgb(selected));
  const plGrid = adjustHex(selected, {
    s: Math.min(selectedHsl.s * 0.25, 0.20),
    l: 0.88,
  });

  const patch: ThemePatch = {
    Hue: 0,
    OverrideClips: 0,
    BackColor: hexToFlColor(background),
    PRGridback: hexToFlColor(stepOdd),
    PRGridCustom: 1,
    PLGridback: hexToFlColor(plGrid),
    PLGridCustom: 1,
    EEGridback: hexToFlColor(stepOdd),
    EEGridCustom: 1,
    Selected: hexToFlColor(selected),
    Highlight: hexToFlColor(highlight),
    Mute: hexToFlColor(mute),
    Option: hexToFlColor(option),
    StepEven: hexToFlColor(stepEven),
    StepOdd: hexToFlColor(stepOdd),
    TextColor: hexToFlColor(text),
    Meter0: hexToFlColor(meters[0]),
    Meter1: hexToFlColor(meters[1]),
    Meter2: hexToFlColor(meters[2]),
    Meter3: hexToFlColor(meters[3]),
    Meter4: hexToFlColor(meters[4]),
    Meter5: hexToFlColor(meters[5]),
  };

  notes.forEach((note, index) => {
    patch[`NoteColor${index}` as keyof ThemePatch] = hexToFlColor(note);
  });

  return {
    patch,
    preview: {
      background,
      panel,
      plGrid,
      selected,
      highlight,
      text,
      muted: stepEven,
      notes,
      meters,
    },
    contrast: contrastRatio(background, text),
  };
}

export function normalizePalette(rawPalette: string[]): string[] {
  const normalized = rawPalette.map(normalizeHex);
  if (normalized.length < 4 || normalized.length > 6) {
    throw new Error("Palette must contain 4 to 6 HEX colors.");
  }

  return normalized;
}

function scoreAccent(hex: string, background: string): number {
  const hsl = rgbToHsl(hexToRgb(hex));
  // Near-neutral colors (very low saturation) are poor accent choices — score them last
  if (hsl.s < 0.15) return 0;
  // Cap contrast contribution so saturated colors can compete with high-contrast neutrals
  return hsl.s * 4 + Math.min(contrastRatio(hex, background), 8) + hsl.l;
}

function buildMeterColors(background: string, accent: string): string[] {
  const accentHsl = rgbToHsl(hexToRgb(accent));
  return [0.28, 0.38, 0.48, 0.58, 0.68, 0.78].map((lightness, index) =>
    adjustHex(index < 3 ? background : accent, {
      h: accentHsl.h + index * 8,
      s: Math.max(0.45, accentHsl.s),
      l: lightness,
    }),
  );
}

function buildNoteColors(palette: string[]): string[] {
  // Cycle palette colors, vary only lightness to maintain palette coherence
  const LIGHTNESS_STEPS = [0.45, 0.52, 0.59, 0.52];
  return Array.from({ length: 16 }, (_, index) => {
    const base = palette[index % palette.length];
    const hsl = rgbToHsl(hexToRgb(base));
    return adjustHex(base, {
      s: Math.min(0.85, Math.max(0.40, hsl.s + 0.05)),
      l: LIGHTNESS_STEPS[index % LIGHTNESS_STEPS.length],
    });
  });
}
