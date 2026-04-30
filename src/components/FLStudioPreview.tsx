import type { ThemeMapping } from "@/mapper";
import { adjustHex, hexToRgb, readableTextColor, relativeLuminance, rgbToHsl } from "@/color";

const BROWSER_ITEMS = [
  { label: "Plugin database", depth: 1, active: true },
  { label: "Effects", depth: 2 },
  { label: "Generators", depth: 2 },
  { label: "Installed", depth: 1, active: true },
  { label: "Effects", depth: 2 },
  { label: "CLAP", depth: 3 },
  { label: "Fruity", depth: 3 },
  { label: "New", depth: 3 },
  { label: "VST", depth: 3 },
  { label: "VST3", depth: 3 },
  { label: "Generators", depth: 2, selected: true },
  { label: "CLAP", depth: 3 },
  { label: "Fruity", depth: 3 },
  { label: "New", depth: 3 },
  { label: "VST", depth: 3 },
  { label: "VST3", depth: 3 },
];

const PLAYLIST_TRACKS = Array.from({ length: 12 }, (_, index) => `Track ${index + 1}`);
const DEMO_PROJECT_NAME = "Palette Preview Arrangement";
const DEMO_AUDIO_CLIP = "Theme Color Audio";
const DEMO_PATTERN = "Pattern 1";

type FLStudioPreviewProps = {
  mapping: ThemeMapping;
};

function alpha(hex: string, opacity: string): string {
  return `${hex}${opacity}`;
}

function flChromeColor(base: string, lightness: number, saturationScale: number): string {
  const hsl = rgbToHsl(hexToRgb(base));
  return adjustHex(base, {
    s: Math.min(0.28, Math.max(0.04, hsl.s * saturationScale)),
    l: lightness,
  });
}

function deriveFlChrome(preview: ThemeMapping["preview"]) {
  const base = relativeLuminance(preview.selected) > 0.45
    ? preview.selected
    : preview.plGrid;

  return {
    browser: flChromeColor(base, 0.66, 0.48),
    browserAlt: flChromeColor(base, 0.73, 0.42),
    playlist: flChromeColor(base, 0.86, 0.22),
    trackHeader: flChromeColor(base, 0.80, 0.38),
    audioClip: flChromeColor(base, 0.90, 0.20),
  };
}

export function FLStudioPreview({ mapping }: FLStudioPreviewProps) {
  const { preview } = mapping;
  const chrome = deriveFlChrome(preview);
  const browser = chrome.browser;
  const browserAlt = chrome.browserAlt;
  const playlist = chrome.playlist;
  const trackHeader = chrome.trackHeader;
  const audioClip = chrome.audioClip;
  const patternClip = flChromeColor(preview.stepEven, 0.74, 0.32);
  const selected = preview.selected;
  const browserText = readableTextColor(browser);
  const browserAltText = readableTextColor(browserAlt);
  const playlistText = readableTextColor(playlist);
  const patternClipText = readableTextColor(patternClip);
  const gridLine = alpha(browserText, "24");
  const softLine = alpha(browserText, "14");
  const browserMutedText = alpha(browserText, "99");
  const playlistMutedText = alpha(playlistText, "99");

  return (
    <div
      className="overflow-hidden rounded-lg border font-mono text-[11px] shadow-2xl"
      style={{ backgroundColor: browser, color: browserText }}
      aria-label="FL Studio theme preview"
    >
      <div className="grid h-[548px] grid-cols-[264px_194px_minmax(0,1fr)]">
        <aside className="flex min-w-0 flex-col border-r" style={{ borderColor: gridLine, backgroundColor: browser }}>
          <div className="border-b px-2 py-1.5 text-[10px]" style={{ borderColor: gridLine, backgroundColor: browserAlt, color: browserAltText }}>
            [Preview]
            <span className="ml-2">05:03:03</span>
          </div>
          <div className="flex items-center gap-2 border-b px-2 py-1.5" style={{ borderColor: gridLine, backgroundColor: browser, color: browserText }}>
            <span className="text-[10px]">Browser</span>
            <span className="ml-auto h-4 w-4 rounded-sm" style={{ backgroundColor: preview.highlight }} />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="w-4 border-r" style={{ borderColor: softLine, backgroundColor: alpha(browserText, "10") }} />
            <div className="min-w-0 flex-1 overflow-hidden py-1">
              {BROWSER_ITEMS.map((item) => (
                <div
                  key={`${item.depth}-${item.label}`}
                  className="flex h-[28px] items-center truncate px-1 py-0.5 text-[12px]"
                  style={{
                    paddingLeft: `${item.depth * 16}px`,
                    backgroundColor: item.selected
                      ? alpha(selected, "66")
                      : item.active
                        ? alpha(browserText, "12")
                        : "transparent",
                    color: item.selected ? browserText : browserMutedText,
                  }}
                >
                  <span className="mr-1 text-[11px]">{item.depth > 1 ? "◖" : "▸"}</span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[124px] border-t p-2" style={{ borderColor: gridLine, backgroundColor: browserAlt, color: browserAltText }}>
            <div className="mb-1 grid grid-cols-[44px_minmax(0,1fr)] gap-x-2 text-[10px] leading-tight">
              <span>Title</span><span>Preview plugin</span>
              <span>Date</span><span>2026-04-28 05:03 PM</span>
              <span>Size</span><span>23.28 KB</span>
              <span>Path</span><span className="truncate">FL Studio\Presets\Plugin database\Installed</span>
            </div>
            <div className="mt-auto h-6 rounded-sm" style={{ backgroundColor: alpha(browserAltText, "22") }} />
          </div>
        </aside>

        <aside className="border-r" style={{ borderColor: gridLine, backgroundColor: browser }}>
          <div className="flex h-[76px] items-center justify-center gap-4 border-b text-lg" style={{ borderColor: gridLine, backgroundColor: browserAlt, color: browserAltText }}>
            <span>↯</span>
            <span>⌁</span>
            <span>▰</span>
          </div>
          <div className="grid h-[30px] grid-cols-3 border-b text-center text-[8px]" style={{ borderColor: gridLine, backgroundColor: browserAlt, color: browserAltText }}>
            {["NOTE", "CHAN", "PAT"].map((label, index) => (
              <span key={label} className="border-r pt-1.5" style={{ borderColor: softLine, backgroundColor: index === 2 ? alpha(browserText, "12") : "transparent" }}>
                {label}
              </span>
            ))}
          </div>
          <div className="border-b px-4 py-2" style={{ borderColor: gridLine, backgroundColor: alpha(browser, "DD"), color: browserText }}>
            <span className="mr-2" style={{ color: preview.highlight }}>▶</span>
            {DEMO_PATTERN}
          </div>
        </aside>

        <main className="min-w-0" style={{ backgroundColor: playlist }}>
          <div className="flex h-9 items-center border-b px-2" style={{ borderColor: gridLine, backgroundColor: browser, color: browserText }}>
            <span className="mr-3 text-sm font-semibold">Playlist - Arrangement</span>
            <span className="truncate text-[11px]" style={{ color: browserMutedText }}>
              {DEMO_PROJECT_NAME}
            </span>
          </div>
          <div className="grid grid-cols-[136px_minmax(0,1fr)]">
            <div className="border-r" style={{ borderColor: gridLine, backgroundColor: browser }}>
              <div className="h-7 border-b" style={{ borderColor: gridLine }} />
              {PLAYLIST_TRACKS.map((track, index) => (
                <div
                  key={track}
                  className="flex h-[52px] items-start justify-between border-b px-2 py-2"
                  style={{
                    borderColor: softLine,
                    backgroundColor: alpha(trackHeader, "EE"),
                    color: browserMutedText,
                  }}
                >
                  <span>{track}</span>
                  <span className="mt-2 h-3 w-3 rounded-full border" style={{ borderColor: gridLine }} />
                </div>
              ))}
            </div>

            <div className="min-w-[620px] overflow-hidden">
              <div
                className="grid h-7 grid-cols-[repeat(16,minmax(0,1fr))] border-b text-center text-[10px]"
                style={{ borderColor: gridLine, backgroundColor: browserAlt, color: browserAltText }}
              >
                {Array.from({ length: 16 }, (_, index) => (
                  <span key={index} className="border-r pt-1" style={{ borderColor: softLine }}>
                    {index + 1}
                  </span>
                ))}
              </div>
              <div
                className="relative h-[624px]"
                style={{
                  backgroundColor: playlist,
                  backgroundImage: `
                    linear-gradient(to right, ${gridLine} 1px, transparent 1px),
                    linear-gradient(to right, ${softLine} 1px, transparent 1px),
                    linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
                  `,
                  backgroundSize: "96px 100%, 24px 100%, 100% 52px",
                }}
              >
                <div
                  className="absolute left-0 top-0 h-[52px] w-[42%] overflow-hidden border-b border-r px-2 py-1"
                  style={{ borderColor: gridLine, backgroundColor: alpha(audioClip, "EE"), color: playlistText }}
                  title="Audio clip preview"
                >
                  <div className="mb-1 truncate text-[10px]" style={{ color: playlistMutedText }}>
                    {DEMO_AUDIO_CLIP}
                  </div>
                  <div
                    className="h-[32px] opacity-60"
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, ${playlistText} 0 2px, transparent 2px 9px)`,
                      clipPath: "polygon(0 35%, 8% 20%, 14% 70%, 21% 26%, 29% 60%, 36% 18%, 45% 64%, 55% 28%, 68% 74%, 76% 30%, 88% 62%, 100% 40%, 100% 100%, 0 100%)",
                    }}
                  />
                </div>
                <div
                  className="absolute left-0 top-[52px] h-[52px] w-[44%] overflow-hidden border-b border-r px-2 py-1"
                  style={{ borderColor: gridLine, backgroundColor: alpha(patternClip, "EE"), color: patternClipText }}
                  title="Pattern clip preview"
                >
                  <div className="mb-1 truncate text-[10px]" style={{ color: alpha(patternClipText, "99") }}>
                    {DEMO_PATTERN}
                  </div>
                  <div className="grid grid-cols-[14px_1fr] gap-y-1">
                    {[0, 1].map((row) => (
                      <div key={row} className="contents">
                        <span className="h-2 w-2" style={{ backgroundColor: patternClipText }} />
                        <span className="h-2 w-4" style={{ backgroundColor: alpha(patternClipText, "88") }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
