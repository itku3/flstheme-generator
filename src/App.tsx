import { useMemo, useState } from "react";
import { AlertCircle, Download, FileText } from "lucide-react";
import grapeTemplate from "./fixtures/templates/Grape.flstheme?raw";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FLStudioPreview } from "@/components/FLStudioPreview";
import { downloadTextFile, safeThemeFilename } from "@/download";
import { normalizeHex } from "@/color";
import { mapPaletteToTheme, PRESET_PALETTES } from "@/mapper";
import type { ThemeMapping } from "@/mapper";
import { generateTheme } from "@/themeFormat";

const EMPTY_COLOR = "";

type PaletteResult =
  | {
      status: "ready";
      mapping: ThemeMapping;
      themeText: string;
    }
  | {
      status: "error";
      error: string;
    };

export function App() {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PALETTES[0].id);
  const [colors, setColors] = useState(() => padPalette(PRESET_PALETTES[0].colors));

  const paletteResult = useMemo<PaletteResult>(() => {
    const active = colors.map((color) => color.trim()).filter(Boolean);
    try {
      const normalized = active.map(normalizeHex);
      if (normalized.length < 4 || normalized.length > 6) {
        return { status: "error", error: "팔레트는 4-6개의 HEX 색상이 필요합니다." };
      }

      const mapping = mapPaletteToTheme(normalized);
      const themeText = generateTheme(grapeTemplate, mapping.patch);
      return { status: "ready", mapping, themeText };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "팔레트를 해석할 수 없습니다.",
      };
    }
  }, [colors]);
  const isReady = paletteResult.status === "ready";

  const handlePresetChange = (presetId: string) => {
    if (!presetId) {
      return;
    }

    const preset = PRESET_PALETTES.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setSelectedPreset(presetId);
    setColors(padPalette(preset.colors));
  };

  const updateColor = (index: number, value: string) => {
    setSelectedPreset("custom");
    setColors((current) => current.map((color, colorIndex) => (colorIndex === index ? value : color)));
  };

  const downloadTheme = () => {
    if (!isReady) {
      return;
    }

    const presetName = PRESET_PALETTES.find((item) => item.id === selectedPreset)?.name ?? "custom-palette";
    downloadTextFile(safeThemeFilename(presetName), paletteResult.themeText);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Badge variant="outline">FL Studio .flstheme</Badge>
              <h1 className="text-3xl font-semibold tracking-normal">Palette Theme Generator</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                팔레트를 선택하면 주요 색상 필드를 자동 매핑하고, CRLF 템플릿 구조를 보존한
                `.flstheme` 파일을 생성합니다.
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                  onClick={downloadTheme}
                  disabled={!isReady}
                  aria-label="Download flstheme file"
                >
                  <Download data-icon="inline-start" />
                  Download
                </Button>
              </TooltipTrigger>
              <TooltipContent>현재 팔레트로 .flstheme 파일을 다운로드합니다.</TooltipContent>
            </Tooltip>
          </header>

          <div className="grid grid-cols-[380px_1fr] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Palette</CardTitle>
                <CardDescription>프리셋을 고르거나 4-6개 HEX 색상을 직접 입력합니다.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ToggleGroup
                  type="single"
                  value={selectedPreset}
                  onValueChange={handlePresetChange}
                  className="grid grid-cols-1 gap-2"
                  variant="outline"
                >
                  {PRESET_PALETTES.map((preset) => (
                    <ToggleGroupItem
                      key={preset.id}
                      value={preset.id}
                      className="h-auto justify-start px-3 py-2"
                      aria-label={preset.name}
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex">
                          {preset.colors.slice(0, 5).map((color) => (
                            <span
                              key={color}
                              className="-ml-1 size-5 first:ml-0 rounded-full border border-background"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span>{preset.name}</span>
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>

                <Separator />

                <div className="flex flex-col gap-3">
                  {colors.map((color, index) => (
                    <div key={index} className="flex items-end gap-3">
                      <div className="flex flex-1 flex-col gap-2">
                        <Label htmlFor={`palette-${index}`}>Color {index + 1}</Label>
                        <Input
                          id={`palette-${index}`}
                          value={color}
                          onChange={(event) => updateColor(index, event.target.value)}
                          placeholder="#9A8CE5"
                          aria-invalid={Boolean(color && !/^#?[0-9a-fA-F]{6}$/.test(color.trim()))}
                        />
                      </div>
                      <div
                        className="mb-px size-10 rounded-md border"
                        style={{ backgroundColor: safeSwatch(color) }}
                        aria-hidden="true"
                      />
                    </div>
                  ))}
                </div>

                {paletteResult.status === "error" ? (
                  <Alert variant="destructive">
                    <AlertCircle data-icon="inline-start" />
                    <AlertTitle>입력 확인 필요</AlertTitle>
                    <AlertDescription>{paletteResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <FileText data-icon="inline-start" />
                    <AlertTitle>생성 준비 완료</AlertTitle>
                    <AlertDescription>
                      {Object.keys(paletteResult.mapping.patch).length}개 색상 필드를 안전한 whitelist
                      안에서 변경합니다.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="justify-between gap-3">
                <div className="text-xs text-muted-foreground">Template: Grape.flstheme</div>
                <Button
                  variant="secondary"
                  onClick={downloadTheme}
                  disabled={!isReady}
                >
                  <Download data-icon="inline-start" />
                  Export
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>전체 분위기, 강조색, 텍스트 가독성을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                {paletteResult.status === "ready" ? (
                  <FLStudioPreview mapping={paletteResult.mapping} />
                ) : (
                  <div className="flex h-[420px] items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
                    유효한 팔레트를 입력하면 미리보기가 표시됩니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

function padPalette(colors: string[]): string[] {
  return [...colors, ...Array.from({ length: 6 - colors.length }, () => EMPTY_COLOR)].slice(0, 6);
}

function safeSwatch(color: string): string {
  try {
    return color.trim() ? normalizeHex(color) : "transparent";
  } catch {
    return "transparent";
  }
}
