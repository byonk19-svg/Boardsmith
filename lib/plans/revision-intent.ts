export const revisionIntentCategories = [
  "prose_only",
  "dimensions",
  "layout",
  "materials",
  "support_mounting",
  "safety_sensitive",
  "cut_list_parts",
  "ambiguous",
] as const;

export type RevisionIntentCategory = (typeof revisionIntentCategories)[number];
export type RevisionIntentDecision = "allow_direct_revision" | "requires_structured_update" | "block_revision";
export type RevisionIntentMessageKey = "structured_change_required" | "safety_sensitive_change" | "ambiguous_revision";

export type RevisionIntent = {
  normalizedInstruction: string;
  categories: RevisionIntentCategory[];
  decision: RevisionIntentDecision;
  messageKey: RevisionIntentMessageKey | null;
};

const categoryLabels: Record<Exclude<RevisionIntentCategory, "prose_only">, string> = {
  dimensions: "dimensions",
  layout: "shelf layout",
  materials: "materials or finish",
  support_mounting: "support or mounting",
  safety_sensitive: "safety-sensitive assumptions",
  cut_list_parts: "cut list or parts",
  ambiguous: "ambiguous structural change",
};

function normalizeForMatching(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function addCategory(categories: Set<RevisionIntentCategory>, condition: boolean, category: RevisionIntentCategory): void {
  if (condition) categories.add(category);
}

export function classifyRevisionIntent(revisionInstruction: string): RevisionIntent {
  const normalizedInstruction = revisionInstruction.trim();
  const text = normalizeForMatching(normalizedInstruction);
  const categories = new Set<RevisionIntentCategory>();

  addCategory(
    categories,
    /\b(width|height|depth|length|thickness|dimension|dimensions|size|sizing|inches?|inch|resize|wider|taller|deeper|narrower|thicker)\b/.test(text),
    "dimensions",
  );
  addCategory(
    categories,
    /\b(shelf count|shelves|spacing|layout|single shelf|separate shelves|connected shelf|shelf unit|rearrange|openings?)\b/.test(text),
    "layout",
  );
  addCategory(
    categories,
    /\b(material|materials|wood|lumber|board|boards|plywood|mdf|oak|pine|cedar|maple|hardwood|softwood|board stock|finish|paint|stain|sealant)\b/.test(text),
    "materials",
  );
  addCategory(
    categories,
    /\b(brackets?|cleats?|anchors?|studs?|fasteners?|wall type|mount|mounting|frame|uprights?|side supports?|support method|french cleat)\b/.test(text),
    "support_mounting",
  );
  addCategory(
    categories,
    /\b(cut list|cuts?|fewer cuts|more cuts|part count|pieces?|merge parts?|remove parts?|add parts?)\b/.test(text),
    "cut_list_parts",
  );
  addCategory(
    categories,
    /\b(child|children|kid|kids|baby|toddler|crib|heavy|heavier|load|weight|load-bearing|outdoor|outside|bathroom|humid|wet|electrical|lighted|overhead|ceiling|suspended|safe|safer)\b/.test(text),
    "safety_sensitive",
  );
  addCategory(categories, /\b(sturdier|stronger|more stable|less wobbly|beefier|reinforce|reinforced)\b/.test(text), "ambiguous");

  if (categories.size === 0) {
    categories.add("prose_only");
  }

  const categoryList = Array.from(categories);
  if (categoryList.includes("safety_sensitive")) {
    return {
      normalizedInstruction,
      categories: categoryList,
      decision: "block_revision",
      messageKey: "safety_sensitive_change",
    };
  }

  if (categoryList.includes("ambiguous") && categoryList.length === 1) {
    return {
      normalizedInstruction,
      categories: categoryList,
      decision: "block_revision",
      messageKey: "ambiguous_revision",
    };
  }

  if (categoryList.some((category) => category !== "prose_only" && category !== "ambiguous")) {
    return {
      normalizedInstruction,
      categories: categoryList.filter((category) => category !== "prose_only"),
      decision: "requires_structured_update",
      messageKey: "structured_change_required",
    };
  }

  return {
    normalizedInstruction,
    categories: ["prose_only"],
    decision: "allow_direct_revision",
    messageKey: null,
  };
}

export function revisionIntentCategoryLabels(categories: RevisionIntentCategory[]): string[] {
  return categories
    .filter((category): category is Exclude<RevisionIntentCategory, "prose_only"> => category !== "prose_only")
    .map((category) => categoryLabels[category]);
}
