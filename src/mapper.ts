import {
  adjustHex,
  contrastRatio,
  flColorToHex,
  hexToFlColor,
  hexToFlRgbColor,
  normalizeHex,
  readableTextColor,
  relativeLuminance,
  rgbToHsl,
  hexToRgb,
} from "./color";
import type { PatchableThemeKey, ThemePatch } from "./themeFormat";

export type Palette = {
  id: string;
  name: string;
  colors: string[];
};

export type ThemeMapping = {
  patch: ThemePatch;
  preview: {
    background: string;
    surface: string;
    surfaceAlt: string;
    panel: string;
    plGrid: string;
    selected: string;
    highlight: string;
    mute: string;
    option: string;
    stepEven: string;
    stepOdd: string;
    text: string;
    muted: string;
    notes: string[];
    meters: string[];
  };
  contrast: number;
};

export type ThemeMappingOptions = {
  preferredSelection?: string;
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

export const PRESET_PALETTE_BY_ID = new Map(PRESET_PALETTES.map((palette) => [palette.id, palette]));

export function presetPaletteById(id: string): Palette {
  const preset = PRESET_PALETTE_BY_ID.get(id);
  if (!preset) {
    throw new Error(`Unknown preset palette: ${id}`);
  }

  return preset;
}

// -(bgHsl.h - 125) * FL_HUE_SCALE maps the palette background hue to a FL Studio
// Hue file value that counteracts the lime base (125°). Calibrated against
// knob = 0.5 + fileHue/360 so that:
//   bgHsl.h=340° (warm pink)  → fileHue=-126  (knob=0.15)
//   bgHsl.h=216° (blue-gray, with dampening) → fileHue≈-11 (knob≈0.47)
const FL_HUE_SCALE = 126 / 215;
// For low-saturation inputs the dampening interpolates toward this base so that
// near-neutral palettes land near knob-center rather than a large negative.
const FL_HUE_DAMPENING_BASE = 18;

const RGB_THEME_KEYS = new Set<PatchableThemeKey>([
  "Selected",
  "TextColor",
]);

function encodeThemeColor(key: PatchableThemeKey, hex: string): number {
  return RGB_THEME_KEYS.has(key) ? hexToFlRgbColor(hex) : hexToFlColor(hex);
}

function decodeThemeColor(key: PatchableThemeKey, value: number): string {
  if (RGB_THEME_KEYS.has(key)) {
    return `#${(value & 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`;
  }

  return flColorToHex(value);
}

export const themeColorCodec = {
  encode: encodeThemeColor,
  decode: decodeThemeColor,
};

export function mapPaletteToTheme(rawPalette: string[], options: ThemeMappingOptions = {}): ThemeMapping {
  const palette = normalizePalette(rawPalette);
  const preferredSelection = options.preferredSelection
    ? normalizeHex(options.preferredSelection)
    : undefined;
  const sortedByLight = [...palette].sort((a, b) => relativeLuminance(a) - relativeLuminance(b));
  const background = sortedByLight[0];
  const bgHsl = rgbToHsl(hexToRgb(background));
  const panel = adjustHex(background, { l: Math.min(0.28, bgHsl.l + 0.08) });
  const accentCandidates = palette
    .map((color) => ({ color, score: scoreAccent(color, background) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.color);
  const selected = preferredSelection && palette.includes(preferredSelection)
    ? preferredSelection
    : accentCandidates[0] ?? palette[0];
  const remainingAccentCandidates = accentCandidates.filter((color) => color !== selected);
  const highlight = remainingAccentCandidates[0] ?? selected;
  const mute = remainingAccentCandidates[1] ?? highlight;
  const option = remainingAccentCandidates[2] ?? selected;
  const stepEven = adjustHex(panel, { l: 0.28 });
  const stepOdd = adjustHex(panel, { l: 0.20 });
  const meters = buildMeterColors(background, highlight);
  const notes = buildNoteColors(palette);
  const selectedHsl = rgbToHsl(hexToRgb(selected));
  const plGrid = adjustHex(selected, {
    s: Math.min(selectedHsl.s * 0.25, 0.20),
    l: 0.88,
  });
  const surface = adjustHex(plGrid, { s: Math.min(selectedHsl.s * 0.18, 0.22), l: 0.82 });
  const surfaceAlt = adjustHex(plGrid, { s: Math.min(selectedHsl.s * 0.14, 0.18), l: 0.88 });
  const text = readableTextColor(surface);
  // FL Studio Lightmode=1 base hue ≈ 125° (lime). Rotating toward the palette's
  // background hue prevents the lime base from bleeding through as olive/brown.
  const rawAutoHue = Math.round(-(bgHsl.h - 125) * FL_HUE_SCALE);
  const autoHue = preferredSelection
    ? dampenHueForLowSaturation(rawAutoHue, preferredSelection)
    : rawAutoHue;

  const patch: ThemePatch = {
    Hue: autoHue,
    OverrideClips: 1,
    BackMode: 0,
    BackColor: encodeThemeColor("BackColor", background),
    PRGridback: encodeThemeColor("PRGridback", plGrid),
    PRGridCustom: 1,
    PLGridback: encodeThemeColor("PLGridback", plGrid),
    PLGridCustom: 1,
    EEGridback: encodeThemeColor("EEGridback", stepOdd),
    EEGridCustom: 1,
    Selected: encodeThemeColor("Selected", selected),
    Highlight: encodeThemeColor("Highlight", highlight),
    Mute: encodeThemeColor("Mute", mute),
    Option: encodeThemeColor("Option", option),
    StepEven: encodeThemeColor("StepEven", stepEven),
    StepOdd: encodeThemeColor("StepOdd", stepOdd),
    TextColor: encodeThemeColor("TextColor", text),
    Meter0: encodeThemeColor("Meter0", meters[0]),
    Meter1: encodeThemeColor("Meter1", meters[1]),
    Meter2: encodeThemeColor("Meter2", meters[2]),
    Meter3: encodeThemeColor("Meter3", meters[3]),
    Meter4: encodeThemeColor("Meter4", meters[4]),
    Meter5: encodeThemeColor("Meter5", meters[5]),
  };

  notes.forEach((note, index) => {
    const key = `NoteColor${index}` as PatchableThemeKey;
    patch[key] = encodeThemeColor(key, note);
  });

  return {
    patch,
    preview: {
      background,
      surface,
      surfaceAlt,
      panel,
      plGrid,
      selected,
      highlight,
      mute,
      option,
      stepEven,
      stepOdd,
      text,
      muted: stepEven,
      notes,
      meters,
    },
    contrast: contrastRatio(surface, text),
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
  if (hsl.s < 0.15) return 0;
  // Near-white or near-black colors make poor accents unless explicitly
  // supplied as a preferred Selection by single-color generation.
  if (hsl.l > 0.85 || hsl.l < 0.15) return 0;
  return hsl.s * 4 + Math.min(contrastRatio(hex, background), 8) + hsl.l;
}

function dampenHueForLowSaturation(hue: number, preferredSelection: string): number {
  const hsl = rgbToHsl(hexToRgb(preferredSelection));
  if (hsl.s >= 0.75) return hue;

  // Warm hues (pink/red/orange, h ≥ 300° or h ≤ 50°) need the full correction
  // to stay warm against FL's lime base — don't reduce it.
  if (hsl.h >= 300 || hsl.h <= 50) return hue;

  // Cool/neutral hues (blue-gray range) get a partial correction interpolated
  // toward FL_HUE_DAMPENING_BASE to avoid a jarring pink shift.
  const scale = Math.max(0.2, hsl.s / 0.75);
  return Math.max(-255, Math.min(255, Math.round(hue * scale + (1 - scale) * FL_HUE_DAMPENING_BASE)));
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
