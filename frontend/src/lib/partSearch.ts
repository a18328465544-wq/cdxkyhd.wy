export interface PartSearchItem {
  id: string;
  name: string;
  specs: string;
  condition: string;
  price: number;
  quantity?: number;
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

export function filterParts<T extends PartSearchItem>(parts: T[], query: string): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return parts;

  return parts.filter(part =>
    normalizeSearchText([part.name, part.specs, part.condition].join(" ")).includes(normalizedQuery)
  );
}
