import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { AlertCircle, Download, FileText, Moon, RotateCcw, Sun, Wand2 } from "lucide-react";
import grapeTemplate from "./fixtures/templates/Grape.flstheme?raw";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FLStudioPreview } from "@/components/FLStudioPreview";
import { downloadTextFile, safeOutputFilename, safeThemeFilename } from "@/download";
import {
  applyAdjustmentsToPreview,
  DEFAULT_ADJUSTMENTS,
  INPUT_COLOR_ADJUSTMENTS,
  outputNoteColors,
  type Adjustments,
  withAdjustments,
} from "@/adjustments";
import {
  adjustHex,
  generatePaletteFromColor,
  hexToRgb,
  normalizeHex,
  readableTextColor,
  rgbToHsl,
} from "@/color";
import { mapPaletteToTheme, PRESET_PALETTES, PRESET_PALETTE_BY_ID } from "@/mapper";
import type { ThemeMapping } from "@/mapper";
import { serializeNoteColorPreset } from "@/ncp";
import { generateTheme } from "@/themeFormat";

const EMPTY_COLOR = "";
const PALETTE_HISTORY_KEY = "flstheme-generator.palette-history.v1";
const APPEARANCE_KEY = "flstheme-generator.appearance.v1";
const MAX_HISTORY_ITEMS = 8;
const HEX_INPUT_RE = /^#?[0-9a-fA-F]{6}$/;

const ADJUSTMENT_CONFIGS = [
  { key: "hue",        label: "Hue offset",  min: -127, max: 127, step: 1 },
  { key: "saturation", label: "Saturation",  min: 0,    max: 512, step: 1 },
  { key: "lightness",  label: "Brightness",  min: 0,    max: 255, step: 1 },
  { key: "contrast",   label: "Contrast",    min: 0,    max: 127, step: 1 },
  { key: "text",       label: "Text",        min: -255, max: 255, step: 1 },
] as const;

type PaletteResult =
  | { status: "ready"; mapping: ThemeMapping; themeText: string; ncpText: string }
  | { status: "error"; error: string };

type PaletteHistoryItem = {
  baseHex: string;
  colors: string[];
  createdAt: number;
};

function loadDarkPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(APPEARANCE_KEY) === "dark";
}

function padPalette(colors: string[]): string[] {
  return [
    ...colors,
    ...Array.from({ length: 6 - colors.length }, () => EMPTY_COLOR),
  ].slice(0, 6);
}

function safeSwatch(color: string): string {
  try {
    return color.trim() ? normalizeHex(color) : "transparent";
  } catch {
    return "transparent";
  }
}

function isValidHex(value: string): boolean {
  return HEX_INPUT_RE.test(value.trim());
}

function isPaletteHistoryItem(value: unknown): value is PaletteHistoryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as PaletteHistoryItem;
  return (
    typeof item.baseHex === "string" &&
    typeof item.createdAt === "number" &&
    Array.isArray(item.colors) &&
    item.colors.every((color) => typeof color === "string" && isValidHex(color))
  );
}

function loadPaletteHistory(): PaletteHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PALETTE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPaletteHistoryItem).slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function savePaletteHistory(history: PaletteHistoryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PALETTE_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage failures; palette generation should still work.
  }
}

function upsertPaletteHistory(
  history: PaletteHistoryItem[],
  item: PaletteHistoryItem,
): PaletteHistoryItem[] {
  return [
    item,
    ...history.filter((entry) => entry.baseHex !== item.baseHex),
  ].slice(0, MAX_HISTORY_ITEMS);
}

function hexToHslToken(hex: string): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return `${Math.round(hsl.h)} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%`;
}

function deriveWorkbenchColor(hex: string, lightness: number, saturationScale = 0.42): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return adjustHex(hex, {
    s: Math.min(1, Math.max(0, hsl.s * saturationScale)),
    l: lightness,
  });
}

export function App() {
  const [isDark, setIsDark] = useState(loadDarkPreference);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PALETTES[0].id);
  const [colors, setColors] = useState(() => padPalette(PRESET_PALETTES[0].colors));
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [baseColor, setBaseColor] = useState("");
  const [paletteHistory, setPaletteHistory] = useState(loadPaletteHistory);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(APPEARANCE_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  const paletteResult = useMemo<PaletteResult>(() => {
    const active = colors.map((c) => c.trim()).filter(Boolean);
    try {
      const normalized = active.map(normalizeHex);
      if (normalized.length < 4 || normalized.length > 6) {
        return {
          status: "error",
          error: "팔레트는 4-6개의 HEX 색상이 필요합니다.",
        };
      }
      const preferredSelection =
        isValidHex(baseColor) && normalized.includes(normalizeHex(baseColor))
          ? normalizeHex(baseColor)
          : undefined;
      const mapping = mapPaletteToTheme(normalized, { preferredSelection });
      const finalPatch = withAdjustments(mapping, adjustments);
      const themeText = generateTheme(grapeTemplate, finalPatch);
      const adjustedPreview = applyAdjustmentsToPreview(mapping.preview, adjustments);
      const ncpText = serializeNoteColorPreset(outputNoteColors(mapping, adjustments));
      const adjustedMapping = {
        ...mapping,
        preview: adjustedPreview,
      };
      return { status: "ready", mapping: adjustedMapping, themeText, ncpText };
    } catch (error) {
      return {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "팔레트를 해석할 수 없습니다.",
      };
    }
  }, [colors, adjustments]);

  const isReady = paletteResult.status === "ready";
  const validColorCount = useMemo(() => colors.filter((color) => color.trim()).length, [colors]);
  const selectedPresetName = PRESET_PALETTE_BY_ID.get(selectedPreset)?.name ?? "custom-palette";
  const themeAccentStyle = (
    isReady
      ? (() => {
          const workbenchBackground = isDark
            ? deriveWorkbenchColor(paletteResult.mapping.preview.selected, 0.08, 0.48)
            : deriveWorkbenchColor(paletteResult.mapping.preview.plGrid, 0.96, 0.30);
          const workbenchPanel = isDark
            ? deriveWorkbenchColor(paletteResult.mapping.preview.selected, 0.12, 0.44)
            : deriveWorkbenchColor(paletteResult.mapping.preview.plGrid, 0.99, 0.18);
          const workbenchMuted = isDark
            ? deriveWorkbenchColor(paletteResult.mapping.preview.selected, 0.18, 0.36)
            : deriveWorkbenchColor(paletteResult.mapping.preview.plGrid, 0.91, 0.24);
          const workbenchBorder = isDark
            ? deriveWorkbenchColor(paletteResult.mapping.preview.highlight, 0.42, 0.55)
            : deriveWorkbenchColor(paletteResult.mapping.preview.highlight, 0.72, 0.35);
          const foreground = readableTextColor(workbenchBackground);

          return {
            "--theme-accent": paletteResult.mapping.preview.highlight,
            "--theme-selected": paletteResult.mapping.preview.selected,
            "--background": hexToHslToken(workbenchBackground),
            "--foreground": hexToHslToken(foreground),
            "--card": hexToHslToken(workbenchPanel),
            "--card-foreground": hexToHslToken(readableTextColor(workbenchPanel)),
            "--popover": hexToHslToken(workbenchPanel),
            "--popover-foreground": hexToHslToken(readableTextColor(workbenchPanel)),
            "--primary": hexToHslToken(paletteResult.mapping.preview.highlight),
            "--primary-foreground": hexToHslToken(readableTextColor(paletteResult.mapping.preview.highlight)),
            "--secondary": hexToHslToken(workbenchMuted),
            "--secondary-foreground": hexToHslToken(readableTextColor(workbenchMuted)),
            "--muted": hexToHslToken(workbenchMuted),
            "--muted-foreground": hexToHslToken(foreground),
            "--accent": hexToHslToken(paletteResult.mapping.preview.selected),
            "--accent-foreground": hexToHslToken(readableTextColor(paletteResult.mapping.preview.selected)),
            "--border": hexToHslToken(workbenchBorder),
            "--input": hexToHslToken(workbenchBorder),
            "--ring": hexToHslToken(paletteResult.mapping.preview.highlight),
          };
        })()
      : undefined
  ) as CSSProperties | undefined;

  const handlePresetChange = (presetId: string) => {
    const preset = PRESET_PALETTE_BY_ID.get(presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setColors(padPalette(preset.colors));
    setAdjustments(DEFAULT_ADJUSTMENTS);
  };

  const updateColor = (index: number, value: string) => {
    setSelectedPreset("custom");
    setColors((current) =>
      current.map((c, i) => (i === index ? value : c)),
    );
  };

  const handleGenerateFromColor = () => {
    if (!isValidHex(baseColor)) return;
    const normalizedBase = normalizeHex(baseColor);
    const generated = generatePaletteFromColor(normalizedBase);
    const nextHistory = upsertPaletteHistory(paletteHistory, {
      baseHex: normalizedBase,
      colors: generated,
      createdAt: Date.now(),
    });
    setSelectedPreset("custom");
    setColors(padPalette(generated));
    setBaseColor(normalizedBase);
    setAdjustments(INPUT_COLOR_ADJUSTMENTS);
    setPaletteHistory(nextHistory);
    savePaletteHistory(nextHistory);
  };

  const restoreHistoryItem = (item: PaletteHistoryItem) => {
    setSelectedPreset("custom");
    setBaseColor(item.baseHex);
    setColors(padPalette(item.colors));
  };

  const downloadTheme = () => {
    if (!isReady) return;
    downloadTextFile(safeThemeFilename(selectedPresetName), paletteResult.themeText);
  };

  const downloadNcp = () => {
    if (!isReady) return;
    downloadTextFile(safeOutputFilename(selectedPresetName, "ncp"), paletteResult.ncpText);
  };

  const updateAdjustment = (key: keyof Adjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <TooltipProvider>
      <div className="theme-lab min-h-screen bg-background text-foreground" style={themeAccentStyle}>
        <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <header className="transport-bar flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <div className="theme-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background font-mono text-xs font-bold text-primary">
                FL
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                    Palette Theme Generator
                  </h1>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.18em]">
                    .flstheme
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Palette in, FL Studio-ready theme out.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDark((d) => !d)}
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={downloadTheme}
                    disabled={!isReady}
                    aria-label="Download flstheme file"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  현재 팔레트로 .flstheme 파일을 다운로드합니다.
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <main className="grid flex-1 gap-4 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="control-surface flex flex-col gap-4 rounded-lg border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur">
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="theme-eyebrow font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      Source
                    </p>
                    <h2 className="text-sm font-semibold">Palette input</h2>
                  </div>
                  <Badge variant="secondary">{validColorCount}/6</Badge>
                </div>

                <div className="rounded-md border bg-background/75 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">
                      단색으로 자동 생성
                    </span>
                    <div
                      className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-border shadow-inner"
                      style={{ backgroundColor: safeSwatch(baseColor) }}
                      onClick={() => document.getElementById("base-color-picker")?.click()}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="base-color-picker"
                      type="color"
                      className="sr-only"
                      value={isValidHex(baseColor) ? normalizeHex(baseColor) : "#000000"}
                      onChange={(e) => setBaseColor(e.target.value)}
                      tabIndex={-1}
                    />
                    <input
                      type="text"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      placeholder="#89CFF0"
                      aria-label="기준 색상"
                      className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleGenerateFromColor}
                      disabled={!isValidHex(baseColor)}
                    >
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                      생성
                    </Button>
                  </div>
                </div>

                {paletteHistory.length > 0 && (
                  <div className="rounded-md border bg-background/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        최근 생성
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        local
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {paletteHistory.map((item) => (
                        <button
                          key={`${item.baseHex}-${item.createdAt}`}
                          type="button"
                          aria-label={`생성 히스토리 ${item.baseHex}`}
                          onClick={() => restoreHistoryItem(item)}
                          className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/70 px-2 py-2 text-left transition-colors hover:border-primary/60"
                        >
                          <span className="font-mono text-xs">{item.baseHex}</span>
                          <span className="flex">
                            {item.colors.map((color, ci) => (
                              <span
                                key={`${item.baseHex}-${color}-${ci}`}
                                className={`block h-5 w-5 rounded-sm border border-background ${ci > 0 ? "-ml-1" : ""}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  {PRESET_PALETTES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-label={preset.name}
                      aria-pressed={selectedPreset === preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors ${
                        selectedPreset === preset.id
                          ? "border-primary/70 bg-primary/10 text-foreground"
                          : "border-border bg-background/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      <span>{preset.name}</span>
                      <span className="flex">
                        {preset.colors.slice(0, 5).map((color, ci) => (
                          <span
                            key={ci}
                            className={`block h-5 w-5 rounded-sm border border-background ${ci > 0 ? "-ml-1" : ""}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {colors.map((color, index) => (
                    <div
                      key={index}
                      className={`rounded-md border p-2 ${
                        color.trim()
                          ? "border-border bg-background/70"
                          : "border-dashed border-border/60 bg-muted/30"
                      }`}
                    >
                      <label
                        className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                        htmlFor={`color-input-${index}`}
                      >
                        Color {index + 1}
                      </label>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 shrink-0 cursor-pointer rounded-sm border border-border"
                          style={{ backgroundColor: safeSwatch(color) }}
                          onClick={() =>
                            document.getElementById(`color-picker-${index}`)?.click()
                          }
                          aria-hidden="true"
                        />
                        <input
                          id={`color-picker-${index}`}
                          type="color"
                          className="sr-only"
                          value={
                            safeSwatch(color) === "transparent"
                              ? "#000000"
                              : safeSwatch(color)
                          }
                          onChange={(e) => updateColor(index, e.target.value)}
                          tabIndex={-1}
                        />
                        <input
                          id={`color-input-${index}`}
                          type="text"
                          value={color}
                          onChange={(e) => updateColor(index, e.target.value)}
                          placeholder="#000000"
                          className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/40"
                          aria-invalid={Boolean(
                            color && !isValidHex(color),
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="theme-eyebrow font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      Global
                    </p>
                    <h2 className="text-sm font-semibold">Adjustments</h2>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                    aria-label="Reset adjustments to defaults"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>

                <div className="grid gap-3">
                  {ADJUSTMENT_CONFIGS.map(({ key, label, min, max, step }) => (
                    <div key={key} className="rounded-md border bg-background/70 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                          {label}
                        </label>
                        <span className="font-mono text-xs tabular-nums">
                          {adjustments[key]}
                        </span>
                      </div>
                      <Slider
                        min={min}
                        max={max}
                        step={step}
                        value={[adjustments[key]]}
                        onValueChange={([v]) =>
                          updateAdjustment(key, v)
                        }
                        aria-label={label}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </aside>

            <section className="preview-stage min-w-0 rounded-lg border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="theme-eyebrow font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    Monitor
                  </p>
                  <h2 className="text-lg font-semibold">FL Studio Preview</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {paletteResult.status === "ready" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={downloadNcp}
                      aria-label="Download ncp file"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      .ncp
                    </Button>
                  ) : (
                    <div className="col-span-2 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{paletteResult.error}</span>
                    </div>
                  )}
                </div>
              </div>

              {paletteResult.status === "ready" ? (
                <FLStudioPreview mapping={paletteResult.mapping} />
              ) : (
                <div className="flex min-h-[420px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    유효한 팔레트를 입력하면 미리보기가 표시됩니다.
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
