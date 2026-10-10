export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  pageItems: T[];
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): PaginationResult<T> {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * safePageSize;

  return {
    currentPage,
    totalPages,
    pageItems: items.slice(startIndex, startIndex + safePageSize),
  };
}
