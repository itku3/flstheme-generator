import type { ThemeMapping } from "@/mapper";
import { Badge } from "@/components/ui/badge";

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
            <div className="rounded-md p-3" style={{ backgroundColor: preview.muted }}>
              <div className="mb-2 text-xs font-semibold uppercase">Piano roll</div>
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 24 }, (_, index) => (
                  <div
                    key={index}
                    className="h-5 rounded-sm border border-white/10"
                    style={{
                      backgroundColor: index % 5 === 0 ? preview.selected : "rgba(255,255,255,0.06)",
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
        </main>
      </div>
    </div>
  );
}
