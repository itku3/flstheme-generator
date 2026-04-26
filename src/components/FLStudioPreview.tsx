import type { ThemeMapping } from "@/mapper";
import { Badge } from "@/components/ui/badge";

// C C# D D# E F F# G G# A A# B — false=흰건반, true=검은건반
const BLACK_KEY = [false, true, false, true, false, false, true, false, true, false, true, false] as const;

const PLAYLIST_TRACKS = [
  { name: "Kick",   active: new Set([0,1,2,3,4,5,6,7]),    noteIdx: 0  },
  { name: "Bass",   active: new Set([0,2,4,6,8,10,12,14]), noteIdx: 4  },
  { name: "Lead",   active: new Set([4,5,6,7,12,13,14,15]),noteIdx: 8  },
  { name: "Pad",    active: new Set([0,1,2,3,8,9,10,11]),  noteIdx: 12 },
];

type FLStudioPreviewProps = {
  mapping: ThemeMapping;
};

export function FLStudioPreview({ mapping }: FLStudioPreviewProps) {
  const { preview } = mapping;

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ backgroundColor: preview.background, color: preview.text }}
      aria-label="FL Studio theme preview"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full" style={{ backgroundColor: preview.highlight }} />
          <div className="text-sm font-semibold">FL Studio Theme Preview</div>
        </div>
        <Badge variant="secondary">Contrast {mapping.contrast.toFixed(1)}:1</Badge>
      </div>

      <div className="grid grid-cols-[180px_1fr] gap-3 p-4">
        <aside className="flex flex-col gap-2 rounded-md p-3" style={{ backgroundColor: preview.panel }}>
          {["Browser", "Current project", "Plugin database", "Packs"].map((label, index) => (
            <div
              key={label}
              className="rounded px-2 py-1 text-xs"
              style={{ backgroundColor: index === 1 ? preview.selected : "transparent" }}
            >
              {label}
            </div>
          ))}
        </aside>

        <main className="flex flex-col gap-3">
          <section className="rounded-md p-3" style={{ backgroundColor: preview.panel }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase">Channel rack</span>
              <span className="rounded px-2 py-1 text-xs" style={{ backgroundColor: preview.highlight }}>
                Pattern 1
              </span>
            </div>
            <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1">
              {preview.notes.map((note, index) => (
                <div
                  key={`${note}-${index}`}
                  className="h-7 rounded-sm"
                  style={{ backgroundColor: note }}
                  title={`Note ${index}`}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-[1fr_120px] gap-3">
            <div className="rounded-md p-3" style={{ backgroundColor: preview.plGrid }}>
              <div className="mb-2 text-xs font-semibold uppercase">Piano roll</div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 24 }, (_, index) => (
                  <div
                    key={index}
                    className="h-5 rounded-sm border border-white/10"
                    style={{
                      backgroundColor: BLACK_KEY[index % 12] ? preview.selected : "rgba(255,255,255,0.06)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-end gap-1 rounded-md p-3" style={{ backgroundColor: preview.panel }}>
              {preview.meters.map((meter, index) => (
                <div
                  key={meter}
                  className="w-full rounded-sm"
                  style={{ backgroundColor: meter, height: `${24 + index * 12}px` }}
                  title={`Meter ${index}`}
                />
              ))}
            </div>
          </section>

          <section className="rounded-md p-3" style={{ backgroundColor: preview.plGrid }}>
            <div className="mb-2 text-xs font-semibold uppercase">Playlist</div>
            <div className="flex flex-col gap-1">
              {PLAYLIST_TRACKS.map((track) => (
                <div key={track.name} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-[10px] opacity-60">{track.name}</span>
                  <div className="flex-1 grid grid-cols-[repeat(16,minmax(0,1fr))] gap-px h-4">
                    {Array.from({ length: 16 }, (_, col) => (
                      <div
                        key={col}
                        className="rounded-sm"
                        style={{
                          backgroundColor: track.active.has(col)
                            ? preview.notes[track.noteIdx]
                            : "rgba(255,255,255,0.04)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
