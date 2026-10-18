interface StoreLink {
  id: "xianyu" | "taobao";
  label: string;
  href: string;
}

function validStoreUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function configuredStoreLink(
  id: StoreLink["id"],
  label: string,
  value: string | undefined,
): StoreLink | null {
  const href = validStoreUrl(value);
  return href ? { id, label, href } : null;
}

export const storeLinks = [
  configuredStoreLink("xianyu", "闲鱼店铺", import.meta.env.VITE_XIANYU_URL),
  configuredStoreLink("taobao", "淘宝店铺", import.meta.env.VITE_TAOBAO_URL),
].filter((link): link is StoreLink => link !== null);
