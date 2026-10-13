import type { PrismaClient, Topic, TopicScope } from "@prisma/client";

/** Normalized tree used for DB insert (supports seed JSON + app template). */
export type NormalizedSection = {
  titleEn: string;
  titleFa: string | null;
  children: { titleEn: string; titleFa: string | null }[];
};

export type NormalizedChapter = {
  number: string | null;
  titleEn: string;
  titleFa: string | null;
  sections: NormalizedSection[];
};

export type NormalizedPart = {
  partLabel: string | null;
  chapters: NormalizedChapter[];
};

export type ImportTopicMeta = {
  titleEn: string;
  titleFa: string | null;
  description: string | null;
};

export type ParsedTopicImport = {
  meta: ImportTopicMeta;
  parts: NormalizedPart[];
  stats: { parts: number; chapters: number; sections: number; leaves: number };
};

const MAX_CHAPTERS = 500;
const MAX_SECTIONS_PER_CHAPTER = 800;

function str(v: unknown): string {
  return v?.toString().trim() ?? "";
}

function optStr(v: unknown): string | null {
  const s = str(v);
  return s || null;
}

function normalizeSection(raw: Record<string, unknown>): NormalizedSection {
  const titleEn = str(raw.titleEn ?? raw.title_en);
  if (!titleEn) {
    throw new ImportValidationError("هر مبحث باید titleEn یا title_en داشته باشد.");
  }
  const titleFa = optStr(raw.titleFa ?? raw.title_fa);

  const children: { titleEn: string; titleFa: string | null }[] = [];
  const subs = raw.subsections ?? raw.children;
  if (Array.isArray(subs)) {
    for (const item of subs) {
      if (typeof item === "string") {
        const t = item.trim();
        if (t) children.push({ titleEn: t, titleFa: null });
      } else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const en = str(o.titleEn ?? o.title_en);
        if (!en) continue;
        children.push({ titleEn: en, titleFa: optStr(o.titleFa ?? o.title_fa) });
      }
    }
  }

  return { titleEn, titleFa, children };
}

function normalizeChapter(raw: Record<string, unknown>): NormalizedChapter {
  const titleEn = str(raw.titleEn ?? raw.title_en);
  if (!titleEn) {
    throw new ImportValidationError("هر سرفصل باید titleEn یا title_en داشته باشد.");
  }
  const sectionsRaw = raw.sections;
  if (!Array.isArray(sectionsRaw) || sectionsRaw.length === 0) {
    throw new ImportValidationError(
      `سرفصل «${titleEn}» باید حداقل یک مبحث در آرایه sections داشته باشد.`,
    );
  }
  if (sectionsRaw.length > MAX_SECTIONS_PER_CHAPTER) {
    throw new ImportValidationError("تعداد مباحث یک سرفصل از حد مجاز بیشتر است.");
  }

  return {
    number: optStr(raw.number),
    titleEn,
    titleFa: optStr(raw.titleFa ?? raw.title_fa),
    sections: sectionsRaw.map((s) => normalizeSection(s as Record<string, unknown>)),
  };
}

function normalizePart(raw: Record<string, unknown>): NormalizedPart {
  const partLabel = optStr(raw.partLabel ?? raw.part);
  const chaptersRaw = raw.chapters;
  if (!Array.isArray(chaptersRaw) || chaptersRaw.length === 0) {
    throw new ImportValidationError("هر بخش (part) باید آرایه chapters داشته باشد.");
  }
  return {
    partLabel,
    chapters: chaptersRaw.map((c) => normalizeChapter(c as Record<string, unknown>)),
  };
}

function countStats(parts: NormalizedPart[]) {
  let chapters = 0;
  let sections = 0;
  let leaves = 0;
  for (const p of parts) {
    chapters += p.chapters.length;
    for (const ch of p.chapters) {
      sections += ch.sections.length;
      for (const sec of ch.sections) {
        if (sec.children.length) {
          sections += sec.children.length;
          leaves += sec.children.length;
        } else {
          leaves += 1;
        }
      }
    }
  }
  return { parts: parts.length, chapters, sections, leaves };
}

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

/**
 * Accepts:
 * 1) Canonical: `{ topic: { titleEn, ... }, parts: [...] }`
 * 2) Legacy seed: `[{ part, chapters: [...] }, ...]` (meta from fallbackMeta)
 */
export function parseTopicImport(
  raw: unknown,
  fallbackMeta?: Partial<ImportTopicMeta>,
): ParsedTopicImport {
  if (raw === null || raw === undefined) {
    throw new ImportValidationError("فایل JSON خالی است.");
  }

  let parts: NormalizedPart[];
  let meta: ImportTopicMeta;

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      throw new ImportValidationError("آرایه بخش‌ها خالی است.");
    }
    parts = raw.map((p) => normalizePart(p as Record<string, unknown>));
    const titleEn = str(fallbackMeta?.titleEn);
    if (!titleEn) {
      throw new ImportValidationError(
        "در قالب آرایه‌ای (مثل seed کتاب)، عنوان انگلیسی موضوع را در فرم وارد کنید.",
      );
    }
    meta = {
      titleEn,
      titleFa: optStr(fallbackMeta?.titleFa),
      description: optStr(fallbackMeta?.description),
    };
  } else if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const topicBlock = (obj.topic ?? obj.meta) as Record<string, unknown> | undefined;
    const titleEn = str(topicBlock?.titleEn ?? topicBlock?.title_en ?? fallbackMeta?.titleEn);
    if (!titleEn) {
      throw new ImportValidationError("فیلد topic.titleEn الزامی است.");
    }
    meta = {
      titleEn,
      titleFa: optStr(topicBlock?.titleFa ?? topicBlock?.title_fa ?? fallbackMeta?.titleFa),
      description: optStr(
        topicBlock?.description ?? fallbackMeta?.description,
      ),
    };

    const partsRaw = obj.parts ?? obj.content;
    if (!Array.isArray(partsRaw) || partsRaw.length === 0) {
      throw new ImportValidationError("فیلد parts باید آرایه‌ای غیرخالی باشد.");
    }
    parts = partsRaw.map((p) => normalizePart(p as Record<string, unknown>));
  } else {
    throw new ImportValidationError("فرمت JSON نامعتبر است.");
  }

  const chapterCount = parts.reduce((n, p) => n + p.chapters.length, 0);
  if (chapterCount > MAX_CHAPTERS) {
    throw new ImportValidationError(`بیش از ${MAX_CHAPTERS} سرفصل مجاز نیست.`);
  }
  if (chapterCount === 0) {
    throw new ImportValidationError("حداقل یک سرفصل لازم است.");
  }

  const stats = countStats(parts);
  return { meta, parts, stats };
}

export async function persistImportedTopic(
  prisma: PrismaClient,
  input: {
    ownerId: string;
    scope: TopicScope;
    teamId: string | null;
    meta: ImportTopicMeta;
    parts: NormalizedPart[];
  },
): Promise<Topic> {
  return prisma.$transaction(async (tx) => {
    const topic = await tx.topic.create({
      data: {
        scope: input.scope,
        ownerId: input.ownerId,
        teamId: input.scope === "TEAM" ? input.teamId : null,
        titleEn: input.meta.titleEn,
        titleFa: input.meta.titleFa,
        description: input.meta.description,
      },
    });

    let chapterOrder = 0;
    for (const part of input.parts) {
      for (const ch of part.chapters) {
        const chapter = await tx.chapter.create({
          data: {
            topicId: topic.id,
            number: ch.number,
            titleEn: ch.titleEn,
            titleFa: ch.titleFa,
            partLabel: part.partLabel,
            sortOrder: chapterOrder++,
          },
        });

        let sectionOrder = 0;
        for (const sec of ch.sections) {
          const parent = await tx.section.create({
            data: {
              chapterId: chapter.id,
              titleEn: sec.titleEn,
              titleFa: sec.titleFa,
              sortOrder: sectionOrder++,
            },
          });

          let childOrder = 0;
          for (const child of sec.children) {
            await tx.section.create({
              data: {
                chapterId: chapter.id,
                parentId: parent.id,
                titleEn: child.titleEn,
                titleFa: child.titleFa,
                sortOrder: childOrder++,
              },
            });
          }
        }
      }
    }

    return topic;
  });
}
