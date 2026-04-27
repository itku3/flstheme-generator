import { hexToNcpColor, normalizeHex } from "./color";

export const NCP_NOTE_COLOR_COUNT = 16;

export function serializeNoteColorPreset(noteColors: string[]): string {
  if (noteColors.length !== NCP_NOTE_COLOR_COUNT) {
    throw new Error(`Expected ${NCP_NOTE_COLOR_COUNT} note colors, received ${noteColors.length}.`);
  }

  return `${noteColors
    .map((hex, index) => `Color${index}=${hexToNcpColor(normalizeHex(hex))}`)
    .join("\r\n")}\r\n`;
}
