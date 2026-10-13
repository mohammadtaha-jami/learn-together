export type SectionNode = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  sortOrder: number;
  parentId: string | null;
  children?: SectionNode[];
};

/** Sections that have no children — used for progress % and checkboxes */
export function getLeafSections(sections: SectionNode[]): SectionNode[] {
  const byParent = new Map<string | null, SectionNode[]>();
  for (const s of sections) {
    const key = s.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(s);
  }

  const roots = sections.filter((s) => s.parentId === null);
  const leaves: SectionNode[] = [];

  function walk(node: SectionNode) {
    const kids = byParent.get(node.id) ?? [];
    if (kids.length === 0) {
      leaves.push(node);
      return;
    }
    kids.sort((a, b) => a.sortOrder - b.sortOrder);
    kids.forEach(walk);
  }

  roots.sort((a, b) => a.sortOrder - b.sortOrder);
  roots.forEach(walk);
  return leaves;
}

export function buildSectionTree(flat: SectionNode[]): SectionNode[] {
  const map = new Map<string, SectionNode>();
  flat.forEach((s) => map.set(s.id, { ...s, children: [] }));

  const roots: SectionNode[] = [];
  for (const s of Array.from(map.values())) {
    if (s.parentId && map.has(s.parentId)) {
      map.get(s.parentId)!.children!.push(s);
    } else if (!s.parentId) {
      roots.push(s);
    }
  }

  const sortRec = (nodes: SectionNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((n) => n.children && sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function formatSectionLines(
  tree: SectionNode[],
  selectedIds: Set<string>,
  depth = 0,
): string[] {
  const lines: string[] = [];
  for (const node of tree) {
    const prefix = "  ".repeat(depth);
    const label = node.titleFa?.trim() || node.titleEn;
    if (selectedIds.has(node.id)) {
      lines.push(`${prefix}- ${label}`);
    }
    if (node.children?.length) {
      lines.push(...formatSectionLines(node.children, selectedIds, depth + 1));
    }
  }
  return lines;
}
