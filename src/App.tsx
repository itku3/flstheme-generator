import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileText, Moon, RotateCcw, Sun, Wand2 } from "lucide-react";
import grapeTemplate from "./fixtures/templates/Grape.flstheme?raw";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { downloadTextFile, safeThemeFilename } from "@/download";
import { adjustHex, generatePaletteFromColor, hexToRgb, normalizeHex, rgbToHsl } from "@/color";
import { mapPaletteToTheme, PRESET_PALETTES } from "@/mapper";
import type { ThemeMapping } from "@/mapper";
import { generateTheme } from "@/themeFormat";

const EMPTY_COLOR = "";

type Adjustments = {
  hue: number;
  saturation: number;
  lightness: number;
  contrast: number;
  text: number;
};

const DEFAULT_ADJUSTMENTS: Adjustments = {
  hue: 0,
  saturation: 256,
  lightness: 118,
  contrast: 64,
  text: -191,
};

const ADJUSTMENT_CONFIGS = [
  { key: "hue",        label: "Hue offset",  min: -127, max: 127, step: 1 },
  { key: "saturation", label: "Saturation",  min: 0,    max: 512, step: 1 },
  { key: "lightness",  label: "Lightness",   min: 0,    max: 255, step: 1 },
  { key: "contrast",   label: "Contrast",    min: 0,    max: 127, step: 1 },
  { key: "text",       label: "Text",        min: -255, max: 255, step: 1 },
] as const;

type PaletteResult =
  | { status: "ready"; mapping: ThemeMapping; themeText: string }
  | { status: "error"; error: string };

function getSystemDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
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

function applyAdjToHex(hex: string, adj: Adjustments): string {
  try {
    const hsl = rgbToHsl(hexToRgb(hex));
    return adjustHex(hex, {
      h: ((hsl.h + adj.hue * (360 / 127)) % 360 + 360) % 360,
      s: Math.min(1, Math.max(0, hsl.s * (adj.saturation / 256))),
      l: Math.min(1, Math.max(0, hsl.l + (adj.lightness - 128) / 255)),
    });
  } catch {
    return hex;
  }
}

function applyAdjToPreview(
  preview: ThemeMapping["preview"],
  adj: Adjustments,
): ThemeMapping["preview"] {
  const a = (c: string) => applyAdjToHex(c, adj);
  return {
    ...preview,
    background: a(preview.background),
    panel:      a(preview.panel),
    selected:   a(preview.selected),
    highlight:  a(preview.highlight),
    text:       a(preview.text),
    muted:      a(preview.muted),
    notes:      preview.notes.map(a),
    meters:     preview.meters.map(a),
  };
}

function isValidHex(value: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(value.trim());
}

const STEPS = ["팔레트 선택", "미리보기", "내보내기"] as const;

export function App() {
  const [isDark, setIsDark] = useState(getSystemDark);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PALETTES[0].id);
  const [colors, setColors] = useState(() => padPalette(PRESET_PALETTES[0].colors));
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [baseColor, setBaseColor] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
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
      const mapping = mapPaletteToTheme(normalized);
      // Hue: mapper computes a palette-appropriate base; slider adds a relative offset
      const baseHue = mapping.patch.Hue ?? 0;
      const totalHue = Math.max(-127, Math.min(127, baseHue + adjustments.hue));
      const finalPatch = {
        ...mapping.patch,
        Hue: totalHue,
        Saturation: adjustments.saturation,
        Lightness: adjustments.lightness,
        Contrast: adjustments.contrast,
        Text: adjustments.text,
      };
      const themeText = generateTheme(grapeTemplate, finalPatch);
      const previewAdj = { ...adjustments, hue: totalHue };
      const adjustedMapping = {
        ...mapping,
        preview: applyAdjToPreview(mapping.preview, previewAdj),
      };
      return { status: "ready", mapping: adjustedMapping, themeText };
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
  const currentStep = isReady ? 2 : 1;

  const handlePresetChange = (presetId: string) => {
    const preset = PRESET_PALETTES.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setColors(padPalette(preset.colors));
  };

  const updateColor = (index: number, value: string) => {
    setSelectedPreset("custom");
    setColors((current) =>
      current.map((c, i) => (i === index ? value : c)),
    );
  };

  const handleGenerateFromColor = () => {
    if (!isValidHex(baseColor)) return;
    const generated = generatePaletteFromColor(baseColor);
    setSelectedPreset("custom");
    setColors(padPalette(generated));
  };

  const downloadTheme = () => {
    if (!isReady) return;
    const presetName =
      PRESET_PALETTES.find((p) => p.id === selectedPreset)?.name ??
      "custom-palette";
    downloadTextFile(safeThemeFilename(presetName), paletteResult.themeText);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-6">

          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="w-fit">FL Studio .flstheme</Badge>
              <h1 className="text-2xl font-bold tracking-tight">
                Palette Theme Generator
              </h1>
            </div>

            {/* Step indicator */}
            <nav aria-label="진행 단계" className="flex items-center gap-2 text-sm">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const isActive = currentStep === n;
                const isDone = currentStep > n;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 ${
                        isActive
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                          isActive
                            ? "bg-foreground text-background"
                            : isDone
                            ? "bg-muted text-muted-foreground"
                            : "border border-muted-foreground/30 text-muted-foreground"
                        }`}
                      >
                        {n}
                      </span>
                      <span>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span className="text-muted-foreground/30 select-none">—</span>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
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

          {/* Palette section */}
          <section className="rounded-xl border bg-card p-4 flex flex-col gap-4">

            {/* Single color auto-generate */}
            <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                단색으로 자동 생성
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="relative h-7 w-7 shrink-0 cursor-pointer rounded-md border border-border"
                  style={{ backgroundColor: safeSwatch(baseColor) }}
                  onClick={() => document.getElementById("base-color-picker")?.click()}
                  aria-hidden="true"
                />
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
                  className="w-24 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleGenerateFromColor}
                disabled={!isValidHex(baseColor)}
              >
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                팔레트 생성
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Preset pills */}
              <div className="flex flex-wrap gap-2">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-label={preset.name}
                    aria-pressed={selectedPreset === preset.id}
                    onClick={() => handlePresetChange(preset.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedPreset === preset.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <span className="flex">
                      {preset.colors.slice(0, 5).map((color, ci) => (
                        <span
                          key={ci}
                          className={`block h-4 w-4 rounded-full border-2 border-background ${ci > 0 ? "-ml-1.5" : ""}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </span>
                    {preset.name}
                  </button>
                ))}
              </div>

              <Separator orientation="vertical" className="hidden h-8 sm:block" />

              {/* Inline color swatches */}
              <div className="flex flex-wrap gap-2">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 ${
                      color.trim()
                        ? "border-border bg-background"
                        : "border-dashed border-border/50 bg-muted/30"
                    }`}
                  >
                    <label
                      className="sr-only"
                      htmlFor={`color-input-${index}`}
                    >
                      Color {index + 1}
                    </label>

                    <div
                      className="relative h-4 w-4 cursor-pointer rounded-sm border border-border"
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
                      className="w-20 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground/40"
                      aria-invalid={Boolean(
                        color && !/^#?[0-9a-fA-F]{6}$/.test(color.trim()),
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Validation feedback */}
            {paletteResult.status === "error" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>입력 확인 필요</AlertTitle>
                <AlertDescription>{paletteResult.error}</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>생성 준비 완료</AlertTitle>
                <AlertDescription>
                  {Object.keys(paletteResult.mapping.patch).length}개 색상
                  필드를 안전한 whitelist 안에서 변경합니다.
                </AlertDescription>
              </Alert>
            )}
          </section>

          {/* Adjustments section */}
          <section className="rounded-xl border bg-card p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Adjustments</span>
                <span className="text-xs text-muted-foreground">
                  FL Studio 전역 색상 조정 — 공식 범위 미공개, 값이 과도하면 UI가 깨질 수 있습니다.
                </span>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {ADJUSTMENT_CONFIGS.map(({ key, label, min, max, step }) => (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
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
                      setAdjustments((prev) => ({ ...prev, [key]: v }))
                    }
                    aria-label={label}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>{min}</span>
                    <span>{max}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Preview section */}
          <section className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">FL Studio Preview</span>
              {paletteResult.status === "ready" && (
                <span className="text-xs text-muted-foreground">
                  Contrast {paletteResult.mapping.contrast.toFixed(1)}:1 ·
                  Template: Grape.flstheme
                </span>
              )}
            </div>
            {paletteResult.status === "ready" ? (
              <FLStudioPreview mapping={paletteResult.mapping} />
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                유효한 팔레트를 입력하면 미리보기가 표시됩니다.
              </div>
            )}
          </section>

        </div>
      </div>
    </TooltipProvider>
  );
}
