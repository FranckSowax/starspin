'use client';

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  paginatedData: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

/**
 * Hook for client-side pagination of data arrays
 */
export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { initialPage = 1, pageSize: initialPageSize = 10 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Reset to page 1 if current page is out of bounds
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  if (safePage !== currentPage && totalPages > 0) {
    setCurrentPage(safePage);
  }

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, safePage, pageSize]);

  const setPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const prevPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    totalItems,
    paginatedData,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    isFirstPage: safePage === 1,
    isLastPage: safePage === totalPages,
  };
}

/**
 * Hook for server-side pagination (cursor-based or offset-based)
 */
interface UseServerPaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems: number;
}

export function useServerPagination(options: UseServerPaginationOptions) {
  const { initialPage = 1, pageSize = 10, totalItems } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / pageSize);
  const offset = (currentPage - 1) * pageSize;

  const setPage = useCallback(
    (page: number) => {
      const newPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
      setCurrentPage(newPage);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const prevPage = useCallback(() => {
    setPage(currentPage - 1);
  }, [currentPage, setPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    offset,
    limit: pageSize,
    setPage,
    nextPage,
    prevPage,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages || totalPages === 0,
  };
}
