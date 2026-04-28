import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hexToNcpColor } from "./color";
import { serializeNoteColorPreset } from "./ncp";

describe("note color preset format", () => {
  it("serializes 16 note colors as FL Studio .ncp AARRGGBB values with CRLF", () => {
    const text = serializeNoteColorPreset([
      "#009BD9",
      "#1396CA",
      "#1F8BB5",
      "#3090B5",
      "#2C31FF",
      "#3E42F6",
      "#575BF0",
      "#7475D1",
      "#9B7F0A",
      "#7B6A27",
      "#9C7B34",
      "#927E54",
      "#00A850",
      "#138448",
      "#1C8E52",
      "#1B653E",
    ]);

    const midnightPreset = readFileSync("src/fixtures/midnight-pro.ncp", "utf8");

    expect(text).toBe(midnightPreset);
    expect(text).toContain("\r\n");
  });

  it("rejects presets that are not exactly 16 colors", () => {
    expect(() => serializeNoteColorPreset(["#FFB7CE"])).toThrow("Expected 16 note colors");
  });

  it("packs colors as opaque AARRGGBB text", () => {
    expect(hexToNcpColor("#FFB7CE")).toBe("FFFFB7CE");
  });
});
