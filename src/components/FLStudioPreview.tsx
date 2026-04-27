import type { ThemeMapping } from "@/mapper";

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
      className="overflow-hidden rounded-lg border shadow-2xl"
      style={{ backgroundColor: preview.surface, color: preview.text }}
      aria-label="FL Studio theme preview"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex gap-1">
            {[preview.highlight, preview.selected, preview.muted].map((color) => (
              <span
                key={color}
                className="block h-3 w-3 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">FL Studio Theme Preview</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
              Browser / Rack / Piano Roll / Playlist
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4 xl:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-2 rounded-md border border-white/10 p-3" style={{ backgroundColor: preview.surface }}>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-60">Browser</span>
            <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: preview.highlight }} />
          </div>
          {["Browser", "Current project", "Plugin database", "Packs"].map((label, index) => (
            <div
              key={label}
              className="rounded px-2 py-1.5 text-xs"
              style={{ backgroundColor: index === 1 ? preview.selected : "transparent" }}
            >
              {label}
            </div>
          ))}
        </aside>

        <main className="grid min-w-0 gap-3">
          <section className="rounded-md border border-white/10 p-3" style={{ backgroundColor: preview.surface }}>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                Channel rack
              </span>
              <span className="rounded px-2 py-1 text-xs font-medium" style={{ backgroundColor: preview.highlight }}>
                Pattern 1
              </span>
            </div>
            <div className="grid grid-cols-[repeat(16,minmax(12px,1fr))] gap-1">
              {preview.notes.map((note, index) => (
                <div
                  key={`${note}-${index}`}
                  className="h-8 rounded-sm border border-white/10 shadow-inner"
                  style={{ backgroundColor: note }}
                  title={`Note ${index}`}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_128px]">
            <div className="rounded-md border border-white/10 p-3" style={{ backgroundColor: preview.plGrid }}>
              <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                Piano roll
              </div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 24 }, (_, index) => (
                  <div
                    key={index}
                    className="h-6 rounded-sm border border-white/10"
                    style={{
                      backgroundColor: BLACK_KEY[index % 12] ? preview.selected : "rgba(255,255,255,0.06)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex min-h-[120px] items-end gap-1 rounded-md border border-white/10 p-3" style={{ backgroundColor: preview.surfaceAlt }}>
              {preview.meters.map((meter, index) => (
                <div
                  key={meter}
                  className="w-full rounded-sm border border-white/10"
                  style={{ backgroundColor: meter, height: `${24 + index * 12}px` }}
                  title={`Meter ${index}`}
                />
              ))}
            </div>
          </section>

          <section className="rounded-md border border-white/10 p-3" style={{ backgroundColor: preview.plGrid }}>
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
              Playlist
            </div>
            <div className="flex flex-col gap-1">
              {PLAYLIST_TRACKS.map((track) => (
                <div key={track.name} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-[10px] opacity-60">{track.name}</span>
                  <div className="grid h-5 flex-1 grid-cols-[repeat(16,minmax(8px,1fr))] gap-px">
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
