# Searchable Hardware Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all eight native hardware selects with an accessible searchable combobox that filters ERP parts by name, specifications, and condition.

**Architecture:** Keep the existing selected hardware IDs and quote API unchanged. Add a pure filter utility for deterministic tests, a controlled `SearchablePartSelect` component for interaction state, and wire it into the existing category map in `PcBuilderSection`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, lucide-react, Node test runner with `tsx`, Vite.

---

## File Structure

- Create `frontend/src/lib/partSearch.ts`: shared searchable part type and normalized multi-field filter.
- Create `frontend/src/lib/partSearch.test.ts`: filter behavior tests.
- Create `frontend/src/components/SearchablePartSelect.tsx`: accessible controlled combobox.
- Create `frontend/src/components/searchablePartSelectRender.test.tsx`: server-rendered accessibility contract.
- Modify `frontend/src/components/PcBuilderSection.tsx`: replace native selects with the reusable component.
- Modify `frontend/src/lib/review-fixes.test.ts`: assert the builder no longer contains native selects.
- Modify `frontend/package.json` and root `package.json`: include new tests in the normal test command.

### Task 1: Multi-field part search

**Files:**
- Create: `frontend/src/lib/partSearch.ts`
- Create: `frontend/src/lib/partSearch.test.ts`
- Modify: `frontend/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write the failing filter test**

Create fixtures for 华硕 CPU and 七彩虹 GPU and assert that `filterParts` matches terms found in `name`, `specs`, and `condition`, ignores case/outer whitespace, returns all rows for an empty query, and returns an empty array for no match.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { filterParts } from "./partSearch";

const parts = [
  { id: "cpu-1", name: "华硕 Intel i9-14900K", specs: "24核 LGA1700", condition: "全新", price: 3999 },
  { id: "gpu-1", name: "七彩虹 RTX 5090", specs: "32GB GDDR7", condition: "靓机95新", price: 19999 },
];

test("filters parts across name, specs and condition", () => {
  assert.deepEqual(filterParts(parts, "  RTX  ").map(part => part.id), ["gpu-1"]);
  assert.deepEqual(filterParts(parts, "lga1700").map(part => part.id), ["cpu-1"]);
  assert.deepEqual(filterParts(parts, "95新").map(part => part.id), ["gpu-1"]);
  assert.equal(filterParts(parts, "").length, 2);
  assert.equal(filterParts(parts, "不存在").length, 0);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx tsx --test frontend/src/lib/partSearch.test.ts`

Expected: FAIL because `partSearch` does not exist.

- [ ] **Step 3: Implement the pure filter**

```ts
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
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npx tsx --test frontend/src/lib/partSearch.test.ts`

Expected: 1 test passes.

### Task 2: Accessible searchable combobox

**Files:**
- Create: `frontend/src/components/SearchablePartSelect.tsx`
- Create: `frontend/src/components/searchablePartSelectRender.test.tsx`

- [ ] **Step 1: Write the failing render contract**

Render the component with `renderToStaticMarkup` and assert it emits a `combobox`, placeholder, collapsed state, and no native `<select>`.

```tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import SearchablePartSelect from "./SearchablePartSelect";

test("renders an accessible searchable hardware combobox", () => {
  const html = renderToStaticMarkup(
    <SearchablePartSelect
      parts={[]}
      value=""
      placeholder="搜索 CPU 品牌、型号或规格"
      onChange={() => undefined}
    />
  );
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /搜索 CPU 品牌、型号或规格/);
  assert.doesNotMatch(html, /<select/);
});
```

- [ ] **Step 2: Run the render test and verify RED**

Run: `npx tsx --test frontend/src/components/searchablePartSelectRender.test.tsx`

Expected: FAIL because `SearchablePartSelect` does not exist.

- [ ] **Step 3: Implement the component**

Implement a controlled component with these exact behaviors:

- `parts`, `value`, `placeholder`, `loading`, and `onChange` props.
- A text input with `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, and active option ID.
- Closed input value is the selected part name; focusing enters search mode with an empty query.
- `filterParts(parts, query)` supplies visible options.
- ArrowDown/ArrowUp changes highlighted index, Enter selects, Escape closes.
- Each option is a button with `role="option"`, name on the first line, and condition/price/stock on the second line.
- A clear icon button calls `onChange("")` without reopening the list.
- A document `pointerdown` listener closes the list when clicking outside.
- Empty inventory and no-match states render distinct messages.

- [ ] **Step 4: Run the render test and verify GREEN**

Run: `npx tsx --test frontend/src/components/searchablePartSelectRender.test.tsx`

Expected: 1 test passes.

### Task 3: Replace all native builder selects

**Files:**
- Modify: `frontend/src/components/PcBuilderSection.tsx`
- Modify: `frontend/src/lib/review-fixes.test.ts`

- [ ] **Step 1: Add the failing integration contract**

Read `PcBuilderSection.tsx` in `review-fixes.test.ts` and assert it imports/renders `SearchablePartSelect` and does not contain `<select` or `<option`.

```ts
const builder = readFileSync(join(root, "src/components/PcBuilderSection.tsx"), "utf8");
assert(builder.includes("SearchablePartSelect"), "builder should use searchable hardware selectors");
assert(!builder.includes("<select"), "builder should not use native hardware selects");
assert(!builder.includes("<option"), "builder should render options through the combobox");
```

- [ ] **Step 2: Run the contract test and verify RED**

Run: `npm run test:review-fixes -w frontend`

Expected: FAIL because the builder still contains native selects.

- [ ] **Step 3: Wire the component into all categories**

Import `SearchablePartSelect` and `PartSearchItem`; extend `PartItem` from `PartSearchItem`; replace the `<select>` block inside `categories.map` with:

```tsx
<SearchablePartSelect
  parts={categoryParts}
  value={cat.state}
  placeholder={`搜索 ${cat.key} 品牌、型号或规格`}
  loading={loading}
  onChange={cat.callback}
/>
```

Leave `selected*Id`, `handleClearAll`, selected-part detail rendering, compatibility calculation, and quote submission unchanged.

- [ ] **Step 4: Run all targeted tests**

Run: `npm test`

Expected: all backend and frontend tests pass.

### Task 4: Browser and production verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run static verification**

Run: `npm run lint && npm run build`

Expected: TypeScript and Vite builds exit 0.

- [ ] **Step 2: Start the local API and web server**

Run the backend with the configured ERP Open API on port 3001 and Vite on port 5173.

- [ ] **Step 3: Verify the browser workflow**

At desktop and mobile widths, navigate to the builder and verify:

- Clicking CPU opens options.
- Typing `14900` filters CPU results.
- Typing a specification term filters by `specs`.
- ArrowDown then Enter selects the highlighted option.
- Clear removes the selected ID and “重置所有” clears every field.
- No dropdown overlaps the next hardware card incoherently.

- [ ] **Step 4: Deploy with rollback backup**

Create a timestamped archive of `/home/ubuntu/cdweb`, sync source while preserving `.env`, install locked dependencies, run tests/lint/build on the server, restart only PM2 process `cdweb`, and verify `https://cdgpu.cn` plus `/api/pc-parts`.
