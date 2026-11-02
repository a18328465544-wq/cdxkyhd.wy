import { readFileSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const root = process.cwd();
const app = readFileSync(join(root, "src/App.tsx"), "utf8");
const homePage = readFileSync(join(root, "src/components/HomePage.tsx"), "utf8");
const data = readFileSync(join(root, "src/data.ts"), "utf8");
const gallery = readFileSync(join(root, "src/components/GallerySection.tsx"), "utf8");
const inventory = readFileSync(join(root, "src/components/InventorySection.tsx"), "utf8");
const ranking = readFileSync(join(root, "src/components/GpuRankingPage.tsx"), "utf8");
const builder = readFileSync(join(root, "src/components/PcBuilderSection.tsx"), "utf8");
const anchorIds = ["pricing", "inventory", "pc-builder", "process", "advantages", "workstation", "cases", "gallery", "faq", "contact"];

assert(!app.includes("rootMargin: '900px 0px'"), "lazy sections should not preload 900px ahead");
assert(homePage.includes("SectionFallback") && !homePage.includes("shouldRender ? undefined : minHeight"), "lazy placeholders should render visible fallback content");
assert(app.includes("ContactModalFallback"), "contact modal should show a loading fallback on first open");
assert(!data.includes("images.unsplash.com"), "gallery assets should not depend on Unsplash");
assert(!gallery.includes("真实店面实拍"), "gallery should not claim real photos when using staged/local assets");
assert(inventory.includes("item.categoryLabel || item.category"), "inventory cards should show the ERP category label");
assert(inventory.includes("{item.status}"), "inventory cards should show the ERP inventory status");
assert(inventory.includes("item.warehouseLocation"), "inventory cards should show the ERP warehouse location");
assert(!inventory.includes("库存紧急"), "inventory cards should not invent a low-stock marker for a single SN item");
assert(!inventory.includes("门店现货"), "inventory cards should not replace the ERP status with a generic marker");
assert(!inventory.includes("item.price"), "inventory cards and details should not render inventory prices");
assert(inventory.includes("微信询价") && inventory.includes("咨询商品"), "inventory should retain its inquiry entry");
assert(!ranking.includes("row.price") && !ranking.includes("item.price"), "ranking should not display or derive inventory prices");
assert(builder.includes("SearchablePartSelect"), "builder should use searchable hardware selectors");
assert(!builder.includes("<select"), "builder should not use native hardware selects");
assert(!builder.includes("<option"), "builder should render options through the combobox");

for (const id of anchorIds) {
  const childSectionFiles = [
    "src/components/PriceSection.tsx",
    "src/components/InventorySection.tsx",
    "src/components/PcBuilderSection.tsx",
    "src/components/ProcessSection.tsx",
    "src/components/AdvantageSection.tsx",
    "src/components/AiWorkstationSection.tsx",
    "src/components/CaseSection.tsx",
    "src/components/GallerySection.tsx",
    "src/components/FAQSection.tsx",
    "src/components/ContactSection.tsx",
  ];

  for (const file of childSectionFiles) {
    const source = readFileSync(join(root, file), "utf8");
    assert(!source.includes(`id="${id}"`), `anchor id ${id} should only exist on LazySection wrapper`);
  }
}
