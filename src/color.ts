export type Rgb = {
  r: number;
  g: number;
  b: number;
};

export type Hsl = {
  h: number;
  s: number;
  l: number;
};

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  if (!HEX_RE.test(trimmed)) {
    throw new Error(`Invalid HEX color: ${hex}`);
  }

  return `#${trimmed.replace("#", "").toUpperCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const normalized = normalizeHex(hex).slice(1);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex(rgb: Rgb): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hexToFlColor(hex: string): number {
  const n = Number.parseInt(normalizeHex(hex).slice(1), 16);
  return n >= 0x800000 ? n - 0x1000000 : n;
}

export function flColorToHex(value: number): string {
  return `#${(value & 0xffffff).toString(16).padStart(6, "0").toUpperCase()}`;
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }

  return { h: h * 60, s, l };
}

export function hslToRgb(hsl: Hsl): Rgb {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = clamp01(hsl.s);
  const l = clamp01(hsl.l);

  if (s === 0) {
    const value = l * 255;
    return { r: value, g: value, b: value };
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255,
  };
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableTextColor(backgroundHex: string, minimumRatio = 4.5): string {
  const dark = "#111827";
  const light = "#F8FAFC";
  const darkRatio = contrastRatio(backgroundHex, dark);
  const lightRatio = contrastRatio(backgroundHex, light);

  if (darkRatio >= minimumRatio || darkRatio >= lightRatio) {
    return dark;
  }

  return light;
}

export function adjustHex(hex: string, adjustments: Partial<Hsl>): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(
    hslToRgb({
      h: adjustments.h ?? hsl.h,
      s: adjustments.s ?? hsl.s,
      l: adjustments.l ?? hsl.l,
    }),
  );
}

export function generatePaletteFromColor(baseHex: string): string[] {
  const hsl = rgbToHsl(hexToRgb(normalizeHex(baseHex)));

  const background = adjustHex(baseHex, {
    s: Math.min(hsl.s * 0.3, 0.25),
    l: 0.07,
  });

  const accent = adjustHex(baseHex, {
    s: Math.max(hsl.s, 0.5),
    l: Math.min(Math.max(hsl.l, 0.50), 0.65),
  });

  const secondary = adjustHex(baseHex, {
    h: (hsl.h + 30) % 360,
    s: Math.min(hsl.s * 0.9, 0.75),
    l: 0.55,
  });

  const complementary = adjustHex(baseHex, {
    h: (hsl.h + 160) % 360,
    s: Math.min(hsl.s * 0.8, 0.70),
    l: 0.58,
  });

  const text = adjustHex(baseHex, {
    s: Math.min(hsl.s * 0.12, 0.08),
    l: 0.93,
  });

  return [background, accent, secondary, complementary, text];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
