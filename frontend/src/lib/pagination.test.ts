import { paginateItems } from "./pagination";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const items = Array.from({ length: 27 }, (_, index) => index + 1);

const first = paginateItems(items, 1, 9);
assert(first.totalPages === 3, "27 items at 9 per page should produce 3 pages");
assert(first.pageItems.length === 9, "first page should contain 9 items");
assert(first.pageItems[0] === 1, "first page should start at item 1");

const last = paginateItems(items, 99, 9);
assert(last.currentPage === 3, "page should be clamped to the last page");
assert(last.pageItems[0] === 19, "last page should start at item 19");

const empty = paginateItems([], 1, 9);
assert(empty.totalPages === 1, "empty lists should still expose one page");
assert(empty.pageItems.length === 0, "empty page should contain no items");
