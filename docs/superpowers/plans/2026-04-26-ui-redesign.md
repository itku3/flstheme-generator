# UI 전면 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 2열 고정 레이아웃을 B+C 혼합 레이아웃(팔레트 상단 컴팩트 가로 배치 + 미리보기 하단 전체폭 + 스텝 인디케이터)으로 전면 재설계하고, 라이트/다크 모드 토글을 추가한다.

**Architecture:** App.tsx를 전면 재작성한다. index.css에 `.dark` 블록 CSS 변수를 추가해 실제 다크 모드를 구현한다. FLStudioPreview.tsx의 피아노 롤 패턴을 12음계 기반으로 교정하고, download.ts의 Firefox anchor 버그를 수정한다. 핵심 로직(color.ts, mapper.ts, themeFormat.ts)은 변경하지 않는다.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3 (darkMode: class), shadcn/ui (Radix UI), lucide-react, Vitest + Testing Library

---

## 파일 구조

| 파일 | 변경 유형 | 책임 |
|------|---------|------|
| `src/index.css` | 수정 | `.dark` 블록 CSS 변수 추가 |
| `src/download.ts` | 수정 | Firefox anchor 버그 수정 |
| `src/components/FLStudioPreview.tsx` | 수정 | 12음계 피아노 롤 패턴 |
| `src/App.test.tsx` | 수정 | 새 UI 동작 반영 |
| `src/App.tsx` | 전면 재작성 | B+C 레이아웃, 다크 모드 토글, 스텝 인디케이터, 팔레트 UX |

---

## Task 1: 다크 모드 CSS 변수 추가

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: `.dark` 블록을 index.css에 추가**

`src/index.css`의 `@layer base` 블록 안에 `.dark` 규칙을 추가한다. 기존 `:root` 아래에 삽입:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 20% 97%;
    --foreground: 220 18% 12%;
    --card: 0 0% 100%;
    --card-foreground: 220 18% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 220 18% 12%;
    --primary: 251 54% 58%;
    --primary-foreground: 0 0% 100%;
    --secondary: 210 18% 92%;
    --secondary-foreground: 220 18% 12%;
    --muted: 210 18% 92%;
    --muted-foreground: 220 9% 42%;
    --accent: 343 62% 62%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 72% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 215 16% 84%;
    --input: 215 16% 84%;
    --ring: 251 54% 58%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 20% 8%;
    --foreground: 210 18% 94%;
    --card: 222 20% 11%;
    --card-foreground: 210 18% 94%;
    --popover: 222 20% 11%;
    --popover-foreground: 210 18% 94%;
    --primary: 251 60% 68%;
    --primary-foreground: 0 0% 100%;
    --secondary: 222 16% 18%;
    --secondary-foreground: 210 18% 94%;
    --muted: 222 16% 16%;
    --muted-foreground: 215 12% 50%;
    --accent: 343 62% 62%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 62% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 222 16% 20%;
    --input: 222 16% 20%;
    --ring: 251 60% 68%;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

- [ ] **Step 2: 타입 체크**

```bash
npm run lint
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/index.css
git commit -m "feat: add dark mode CSS variables"
```

---

## Task 2: download.ts Firefox 버그 수정

**Files:**
- Modify: `src/download.ts`

- [ ] **Step 1: anchor를 DOM에 추가한 후 클릭**

`src/download.ts` 전체를 다음으로 교체한다:

```ts
export function downloadTextFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function safeThemeFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "palette-theme"}.flstheme`;
}
```

- [ ] **Step 2: 타입 체크**

```bash
npm run lint
```

Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/download.ts
git commit -m "fix: append anchor to DOM before click for Firefox compatibility"
```

---

## Task 3: FLStudioPreview 피아노 롤 12음계 패턴 수정

**Files:**
- Modify: `src/components/FLStudioPreview.tsx`

- [ ] **Step 1: 컴포넌트 상단에 12음계 배열 상수 추가**

`src/components/FLStudioPreview.tsx` import 블록 바로 아래(컴포넌트 함수 외부)에 추가한다:

```ts
// C D# D D# E F F# G G# A A# B — false=흰건반, true=검은건반
const BLACK_KEY = [false, true, false, true, false, false, true, false, true, false, true, false] as const;
```

- [ ] **Step 2: 피아노 롤 그리드 조건 교체**

`FLStudioPreview.tsx`의 피아노 롤 그리드 섹션을 찾아 수정한다.

기존 코드:
```tsx
{Array.from({ length: 24 }, (_, index) => (
  <div
    key={index}
    className="h-5 rounded-sm border border-white/10"
    style={{
      backgroundColor: index % 5 === 0 ? preview.selected : "rgba(255,255,255,0.06)",
    }}
  />
))}
```

변경 후:
```tsx
{Array.from({ length: 24 }, (_, index) => (
  <div
    key={index}
    className="h-5 rounded-sm border border-white/10"
    style={{
      backgroundColor: BLACK_KEY[index % 12] ? preview.selected : "rgba(255,255,255,0.06)",
    }}
  />
))}
```

- [ ] **Step 3: 테스트 및 타입 체크**

```bash
npm run lint && npm test
```

Expected: 기존 14개 테스트 전체 통과, 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add src/components/FLStudioPreview.tsx
git commit -m "fix: use correct 12-tone chromatic piano roll key pattern"
```

---

## Task 4: App.test.tsx 업데이트 (테스트 먼저)

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: App.test.tsx 전체 교체**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders title, step indicator, and preview area", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Palette Theme Generator" })).toBeInTheDocument();
    expect(screen.getByLabelText("FL Studio theme preview")).toBeInTheDocument();
    expect(screen.getByText("팔레트 선택")).toBeInTheDocument();
    expect(screen.getByText("미리보기")).toBeInTheDocument();
    expect(screen.getByText("내보내기")).toBeInTheDocument();
  });

  it("renders all preset palette buttons", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Grape Night" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oxide Lime" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cold Signal" })).toBeInTheDocument();
  });

  it("download button is enabled when preset palette is active", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeEnabled();
  });

  it("disables download and shows validation error for invalid HEX input", async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText("Color 1");
    await user.clear(input);
    await user.type(input, "#XYZXYZ");
    expect(screen.getByRole("button", { name: "Download flstheme file" })).toBeDisabled();
    expect(screen.getByText("입력 확인 필요")).toBeInTheDocument();
  });

  it("renders dark mode toggle button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test
```

Expected: 새 테스트 중 일부("팔레트 선택" 텍스트, "Toggle theme" 버튼 등) FAIL. 기존 동작 테스트는 통과.

---

## Task 5: App.tsx 전면 재작성

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: App.tsx 전체 교체**

`src/App.tsx`를 다음으로 교체한다:

```tsx
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileText, Moon, Sun } from "lucide-react";
import grapeTemplate from "./fixtures/templates/Grape.flstheme?raw";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

const STEPS = ["팔레트 선택", "미리보기", "내보내기"] as const;

export function App() {
  const [isDark, setIsDark] = useState(getSystemDark);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PALETTES[0].id);
  const [colors, setColors] = useState(() => padPalette(PRESET_PALETTES[0].colors));

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
      const themeText = generateTheme(grapeTemplate, mapping.patch);
      return { status: "ready", mapping, themeText };
    } catch (error) {
      return {
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "팔레트를 해석할 수 없습니다.",
      };
    }
  }, [colors]);

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
                    {/* Hidden label for accessibility */}
                    <label
                      className="sr-only"
                      htmlFor={`color-input-${index}`}
                    >
                      Color {index + 1}
                    </label>

                    {/* Swatch — clicks native color picker */}
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

                    {/* HEX text input */}
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
```

- [ ] **Step 2: 테스트 실행**

```bash
npm test
```

Expected: 19개 테스트 전체 통과 (기존 로직 테스트 14개 + 새 App 테스트 5개)

- [ ] **Step 3: 타입 체크**

```bash
npm run lint
```

Expected: 오류 없음

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: redesign UI — B+C layout, dark mode, step indicator, inline palette UX"
```

---

## 완료 체크리스트

- [ ] `npm test` — 전체 통과
- [ ] `npm run lint` — 오류 없음
- [ ] 브라우저에서 라이트/다크 토글 버튼 클릭 시 테마 전환 확인
- [ ] 팔레트 스와치(■) 클릭 시 네이티브 컬러피커 열림 확인
- [ ] HEX 텍스트 직접 입력 시 스와치 색상 실시간 반영 확인
- [ ] 3개 프리셋 전환 시 팔레트와 미리보기 동기화 확인
- [ ] 피아노 롤에서 검은건반/흰건반 패턴 시각 확인
- [ ] Download 버튼 클릭 시 `.flstheme` 파일 다운로드 확인 (Chrome + Firefox)
