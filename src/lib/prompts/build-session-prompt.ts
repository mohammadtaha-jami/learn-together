export function buildSessionPrompt(params: {
  chapterNumber?: string | null;
  chapterTitleEn: string;
  chapterTitleFa?: string | null;
  sectionLines: string[];
  emphasis?: string | null;
}): string {
  const { chapterNumber, chapterTitleEn, chapterTitleFa, sectionLines, emphasis } =
    params;

  if (!chapterTitleEn && sectionLines.length === 0) {
    return "ابتدا فصل و بخش‌ها را مشخص کنید...";
  }

  const chLabel = [
    chapterNumber?.trim(),
    chapterTitleFa?.trim() || chapterTitleEn,
  ]
    .filter(Boolean)
    .join(" — ");

  const lines = sectionLines.map((l) =>
    l.startsWith("-") ? l : `- ${l.replace(/^-+\s*/, "")}`,
  );

  let prompt = `━━━━━━━━━━━━━━━━━━━━━
📌 فصل: ${chLabel}
📂 بخش‌های موردنظر:
${lines.join("\n")}
━━━━━━━━━━━━━━━━━━━━━`;

  if (emphasis?.trim()) {
    prompt += `\n\n💡 تأکید ویژه: ${emphasis.trim()}`;
  }

  return prompt;
}
