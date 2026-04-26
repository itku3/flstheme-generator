import { converter, formatHex, wcagContrast, wcagLuminance } from "culori";

const toOklch = converter("oklch");
const toHsl = converter("hsl");
const toRgb = converter("rgb");

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  if (!HEX_RE.test(trimmed)) throw new Error(`Invalid HEX color: ${hex}`);
  return `#${trimmed.replace("#", "").toUpperCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const rgb = toRgb(normalizeHex(hex))!;
  return {
    r: Math.round((rgb.r ?? 0) * 255),
    g: Math.round((rgb.g ?? 0) * 255),
    b: Math.round((rgb.b ?? 0) * 255),
  };
}

export function rgbToHex(rgb: Rgb): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
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
  const hsl = toHsl({ mode: "rgb", r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 })!;
  return { h: hsl.h ?? 0, s: hsl.s ?? 0, l: hsl.l ?? 0 };
}

export function hslToRgb(hsl: Hsl): Rgb {
  const rgb = toRgb({ mode: "hsl", h: hsl.h, s: hsl.s, l: hsl.l })!;
  return {
    r: (rgb.r ?? 0) * 255,
    g: (rgb.g ?? 0) * 255,
    b: (rgb.b ?? 0) * 255,
  };
}

export function relativeLuminance(hex: string): number {
  return wcagLuminance(normalizeHex(hex)) ?? 0;
}

export function contrastRatio(a: string, b: string): number {
  return wcagContrast(normalizeHex(a), normalizeHex(b));
}

export function readableTextColor(backgroundHex: string, minimumRatio = 4.5): string {
  const dark = "#111827";
  const light = "#F8FAFC";
  const darkRatio = contrastRatio(backgroundHex, dark);
  const lightRatio = contrastRatio(backgroundHex, light);
  return darkRatio >= minimumRatio || darkRatio >= lightRatio ? dark : light;
}

export function adjustHex(hex: string, adjustments: Partial<Hsl>): string {
  const hsl = toHsl(normalizeHex(hex))!;
  const result = formatHex({
    mode: "hsl",
    h: adjustments.h ?? hsl.h ?? 0,
    s: adjustments.s ?? hsl.s ?? 0,
    l: adjustments.l ?? hsl.l ?? 0,
  });
  return (result ?? hex).toUpperCase();
}

export function generatePaletteFromColor(baseHex: string): string[] {
  const oklch = toOklch(normalizeHex(baseHex))!;
  const h = oklch.h ?? 0;
  const c = oklch.c ?? 0;

  const make = (dh: number, l: number, chromaScale: number, minC = 0): string => {
    const result = formatHex({
      mode: "oklch",
      l,
      c: Math.min(Math.max(c * chromaScale, minC), 0.35),
      h: (h + dh + 360) % 360,
    });
    return (result ?? baseHex).toUpperCase();
  };

  return [
    make(0,   0.15, 0.35),        // background: very dark, same hue family
    make(0,   0.65, 1.20, 0.08),  // accent: vivid, matches input hue
    make(12,  0.60, 1.00, 0.07),  // secondary: slight warm shift
    make(-8,  0.82, 0.70),        // bright: lighter variant
    make(0,   0.95, 0.12),        // text: near-white with subtle tint
  ];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
