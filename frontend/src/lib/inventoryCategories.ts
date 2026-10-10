interface CategoryLike {
  key?: string;
  id?: string;
  value?: string;
  name?: string;
  label?: string;
}

interface InventoryLike {
  category?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GPU: "GPU 显卡",
  CPU: "CPU 处理器",
  Motherboard: "主板",
  RAM: "内存",
  SSD: "固态硬盘",
  PSU: "电源",
  Case: "机箱",
  Cooler: "散热",
  WholeMachine: "整机",
  Monitor: "显示器",
  Assembly: "组装拆卸",
  Accessories: "配件",
};

export interface InventoryCategoryTab {
  key: string;
  label: string;
}

export function buildInventoryCategoryTabs(
  backendCategories: Array<string | CategoryLike> | undefined,
  items: InventoryLike[]
): InventoryCategoryTab[] {
  const source = backendCategories?.length
    ? backendCategories
    : Array.from(new Set(items.map(item => item.category).filter(Boolean))) as string[];

  const tabs = source
    .map(category => {
      if (typeof category === "string") {
        return { key: category, label: CATEGORY_LABELS[category] ?? category };
      }

      const key = category.key ?? category.id ?? category.value ?? category.name;
      if (!key) return null;

      return {
        key,
        label: category.label ?? CATEGORY_LABELS[key] ?? category.name ?? key,
      };
    })
    .filter((tab): tab is InventoryCategoryTab => Boolean(tab?.key));

  return Array.from(new Map(tabs.map(tab => [tab.key, tab])).values())
    .filter(tab => tab.key !== "All");
}
