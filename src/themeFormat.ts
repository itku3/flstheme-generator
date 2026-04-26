export const PATCHABLE_THEME_KEYS = [
  "Hue",
  "Saturation",
  "Lightness",
  "Contrast",
  "Text",
  "Lightmode",
  "Selected",
  "Highlight",
  "Mute",
  "Option",
  "StepEven",
  "StepOdd",
  "TextColor",
  "Meter0",
  "Meter1",
  "Meter2",
  "Meter3",
  "Meter4",
  "Meter5",
  "NoteColor0",
  "NoteColor1",
  "NoteColor2",
  "NoteColor3",
  "NoteColor4",
  "NoteColor5",
  "NoteColor6",
  "NoteColor7",
  "NoteColor8",
  "NoteColor9",
  "NoteColor10",
  "NoteColor11",
  "NoteColor12",
  "NoteColor13",
  "NoteColor14",
  "NoteColor15",
  "PRGridback",
  "PRGridCustom",
  "PLGridback",
  "PLGridCustom",
  "EEGridback",
  "EEGridCustom",
  "BackColor",
] as const;

export const PROTECTED_THEME_KEYS = [
  "OverrideClips",
  "PRGridContrast",
  "PLGridContrast",
  "EEGridContrast",
  "BackMode",
  "BackPicFilename",
  "BackHTMLFileName",
] as const;

export type PatchableThemeKey = (typeof PATCHABLE_THEME_KEYS)[number];
export type ThemePatch = Partial<Record<PatchableThemeKey, number>>;

export type Newline = "\r\n" | "\n";

export type ThemeLineToken = {
  raw: string;
  key?: string;
  value?: string;
  lineIndex: number;
};

export type ParsedTheme = {
  tokens: ThemeLineToken[];
  newline: Newline;
  hasTrailingNewline: boolean;
};

const PATCHABLE_SET = new Set<string>(PATCHABLE_THEME_KEYS);

export function isPatchableThemeKey(key: string): key is PatchableThemeKey {
  return PATCHABLE_SET.has(key);
}

export function parseThemeLines(templateText: string): ParsedTheme {
  const newline: Newline = templateText.includes("\r\n") ? "\r\n" : "\n";
  const hasTrailingNewline = templateText.endsWith("\r\n") || templateText.endsWith("\n");
  const withoutTrailing = hasTrailingNewline
    ? templateText.slice(0, templateText.endsWith("\r\n") ? -2 : -1)
    : templateText;

  const rawLines = withoutTrailing.length > 0 ? withoutTrailing.split(newline) : [];
  const tokens = rawLines.map((raw, lineIndex) => {
    const match = /^([^=\r\n]+)=([^\r\n]*)$/.exec(raw);
    if (!match) {
      return { raw, lineIndex };
    }

    return {
      raw,
      key: match[1],
      value: match[2],
      lineIndex,
    };
  });

  return { tokens, newline, hasTrailingNewline };
}

export function serializeThemeLines(parsed: ParsedTheme): string {
  const body = parsed.tokens.map((token) => token.raw).join(parsed.newline);
  return parsed.hasTrailingNewline ? `${body}${parsed.newline}` : body;
}

export function patchThemeTokens(parsed: ParsedTheme, patch: ThemePatch): ParsedTheme {
  const requestedKeys = Object.keys(patch);
  for (const key of requestedKeys) {
    if (!isPatchableThemeKey(key)) {
      throw new Error(`Cannot patch non-whitelisted key: ${key}`);
    }
  }

  const keyCounts = new Map<string, number>();
  for (const token of parsed.tokens) {
    if (token.key && isPatchableThemeKey(token.key)) {
      keyCounts.set(token.key, (keyCounts.get(token.key) ?? 0) + 1);
    }
  }

  for (const key of requestedKeys) {
    const count = keyCounts.get(key) ?? 0;
    if (count !== 1) {
      throw new Error(`Expected exactly one ${key} line, found ${count}`);
    }
  }

  const patchedTokens = parsed.tokens.map((token) => {
    if (!token.key || !isPatchableThemeKey(token.key) || patch[token.key] === undefined) {
      return token;
    }

    return {
      ...token,
      value: String(patch[token.key]),
      raw: `${token.key}=${patch[token.key]}`,
    };
  });

  return {
    ...parsed,
    tokens: patchedTokens,
  };
}

export function generateTheme(templateText: string, patch: ThemePatch): string {
  const parsed = parseThemeLines(templateText);
  return serializeThemeLines(patchThemeTokens(parsed, patch));
}
