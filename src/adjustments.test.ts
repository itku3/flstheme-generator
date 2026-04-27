import { describe, expect, it } from "vitest";
import {
  applyAdjustmentsToPreview,
  DEFAULT_ADJUSTMENTS,
  INPUT_COLOR_ADJUSTMENTS,
  outputNoteColors,
  withAdjustments,
} from "./adjustments";
import { flColorToHex, generatePaletteFromColor } from "./color";
import { mapPaletteToTheme, themeColorCodec } from "./mapper";

describe("theme adjustments", () => {
  it("stores output note colors from the adjusted piano roll preview selection color", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"), {
      preferredSelection: "#FFB7CE",
    });
    const patch = withAdjustments(mapping, DEFAULT_ADJUSTMENTS);

    expect(outputNoteColors(mapping, DEFAULT_ADJUSTMENTS)[0]).toBe("#FFBFD3");
    expect(themeColorCodec.decode("NoteColor0", patch.NoteColor0!)).toBe("#FFBFD3");
  });

  it("stores adjustment swatch colors from the adjusted frontend preview", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#FFB7CE"), {
      preferredSelection: "#FFB7CE",
    });
    const preview = applyAdjustmentsToPreview(mapping.preview, DEFAULT_ADJUSTMENTS);
    const patch = withAdjustments(mapping, DEFAULT_ADJUSTMENTS);

    expect(themeColorCodec.decode("Selected", patch.Selected!)).toBe(preview.selected);
    expect(flColorToHex(patch.Highlight!)).toBe(preview.highlight);
    expect(flColorToHex(patch.Mute!)).toBe(preview.mute);
    expect(flColorToHex(patch.Option!)).toBe(preview.option);
    expect(flColorToHex(patch.StepEven!)).toBe(preview.stepEven);
    expect(flColorToHex(patch.StepOdd!)).toBe(preview.stepOdd);
    expect(flColorToHex(patch.Meter0!)).toBe(preview.meters[0]);
    expect(themeColorCodec.decode("TextColor", patch.TextColor!)).toBe(preview.text);
  });

  it("keeps preferred single-color selection exact with input color adjustments", () => {
    const mapping = mapPaletteToTheme(generatePaletteFromColor("#E8E5FF"), {
      preferredSelection: "#E8E5FF",
    });
    const patch = withAdjustments(mapping, INPUT_COLOR_ADJUSTMENTS);

    expect(patch.Saturation).toBe(256);
    expect(patch.Lightness).toBe(128);
    expect(themeColorCodec.decode("Selected", patch.Selected!)).toBe("#E8E5FF");
    expect(themeColorCodec.decode("NoteColor0", patch.NoteColor0!)).toBe("#E8E5FF");
  });
});
