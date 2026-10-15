import { buildSessionPrompt } from "@/lib/prompts/build-session-prompt";

export const PROMPT_PLACEHOLDERS = [
  { key: "{{SESSION}}", desc: "بلوک کامل جلسه (فصل + مباحث + تأکید)" },
  { key: "{{TOPIC}}", desc: "عنوان موضوع / کتاب" },
  { key: "{{CHAPTER}}", desc: "شماره و عنوان سرفصل" },
  { key: "{{SECTIONS}}", desc: "لیست مباحث انتخاب‌شده" },
  { key: "{{EMPHASIS}}", desc: "خط تأکید ویژه (در صورت خالی بودن حذف می‌شود)" },
  { key: "[لیست زیرعنوان‌های انتخاب‌شده]", desc: "همان {{SECTIONS}}" },
  { key: "[شماره و عنوان فصل]", desc: "همان {{CHAPTER}}" },
] as const;

export const BUILTIN_MASTER_PROMPT_ID = "builtin:fsa";

export type CombinePromptInput = {
  masterTemplate: string;
  topicTitle: string;
  chapterNumber?: string | null;
  chapterTitleEn: string;
  chapterTitleFa?: string | null;
  sectionLines: string[];
  emphasis?: string | null;
};

function chapterLabel(input: CombinePromptInput) {
  return [input.chapterNumber?.trim(), input.chapterTitleFa?.trim() || input.chapterTitleEn]
    .filter(Boolean)
    .join(" — ");
}

function sectionsText(lines: string[]) {
  return lines
    .map((l) => (l.startsWith("-") ? l : `- ${l.replace(/^-+\s*/, "")}`))
    .join("\n");
}

function emphasisLine(emphasis?: string | null) {
  const t = emphasis?.trim();
  return t ? `💡 تأکید ویژه: ${t}` : "";
}

/** Replace known placeholders; append session block if template has no session slot. */
export function combineMasterPrompt(input: CombinePromptInput): {
  combined: string;
  sessionBlock: string;
} {
  const sessionBlock = buildSessionPrompt({
    chapterNumber: input.chapterNumber,
    chapterTitleEn: input.chapterTitleEn,
    chapterTitleFa: input.chapterTitleFa,
    sectionLines: input.sectionLines,
    emphasis: input.emphasis,
  });

  const vars: Record<string, string> = {
    "{{SESSION}}": sessionBlock,
    "{{TOPIC}}": input.topicTitle.trim(),
    "{{CHAPTER}}": chapterLabel(input),
    "{{SECTIONS}}": sectionsText(input.sectionLines),
    "{{EMPHASIS}}": emphasisLine(input.emphasis),
    "[SESSION]": sessionBlock,
    "{SESSION}": sessionBlock,
    "[لیست زیرعنوان‌های انتخاب‌شده]": sectionsText(input.sectionLines),
    "{لیست زیرعنوان‌های انتخاب‌شده}": sectionsText(input.sectionLines),
    "[شماره و عنوان فصل]": chapterLabel(input),
    "{شماره و عنوان فصل}": chapterLabel(input),
    "[عنوان موضوع]": input.topicTitle.trim(),
    "{عنوان موضوع}": input.topicTitle.trim(),
  };

  let combined = input.masterTemplate;
  for (const [token, value] of Object.entries(vars)) {
    if (combined.includes(token)) {
      combined = combined.split(token).join(value);
    }
  }

  // Generic {{name}} / {name} — optional simple keys
  combined = combined.replace(/\{\{([A-Za-z_]+)\}\}/g, (_, key: string) => {
    const upper = key.toUpperCase();
    if (upper === "SESSION") return sessionBlock;
    if (upper === "TOPIC") return input.topicTitle.trim();
    if (upper === "CHAPTER") return chapterLabel(input);
    if (upper === "SECTIONS") return sectionsText(input.sectionLines);
    if (upper === "EMPHASIS") return emphasisLine(input.emphasis);
    return `{{${key}}}`;
  });

  const hasSessionSlot =
    input.masterTemplate.includes("{{SESSION}}") ||
    input.masterTemplate.includes("[SESSION]") ||
    input.masterTemplate.includes("[لیست زیرعنوان‌های انتخاب‌شده]") ||
    input.masterTemplate.includes("━━━━━━━━━━━━━━━━━━━━━");

  if (!hasSessionSlot && sessionBlock.trim()) {
    combined = `${combined.trim()}\n\n${sessionBlock}`;
  }

  const emph = emphasisLine(input.emphasis);
  if (emph && !combined.includes(emph) && !input.masterTemplate.includes("{{EMPHASIS}}")) {
    combined = `${combined.trim()}\n\n${emph}`;
  }

  return { combined: combined.trim(), sessionBlock };
}
