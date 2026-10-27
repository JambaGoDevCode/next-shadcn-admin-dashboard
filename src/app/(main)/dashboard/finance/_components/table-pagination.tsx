"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  /** Página atual, base 1. */
  page: number;
  pageCount: number;
  /** Total de registos (para o texto "x–y de z"). */
  total: number;
  pageSize: number;
  unit?: string;
  onPageChange: (page: number) => void;
}

function pageNumbers(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - 1, pageCount - 2));
  const end = Math.min(pageCount, start + 2);
  const numbers: number[] = [];
  for (let value = start; value <= end; value += 1) numbers.push(value);
  return numbers;
}

/** Paginação partilhada pelas listagens financeiras. */
export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  unit = "registos",
  onPageChange,
}: TablePaginationProps) {
  const safeCount = Math.max(1, pageCount);
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const numbers = pageNumbers(page, safeCount);

  const goto = (event: React.MouseEvent<HTMLAnchorElement>, target: number) => {
    event.preventDefault();
    if (target < 1 || target > safeCount || target === page) return;
    onPageChange(target);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-muted-foreground text-sm">
        {first}–{last} de {total} {unit}
      </p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Anterior"
              aria-disabled={page <= 1}
              className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => goto(event, page - 1)}
            />
          </PaginationItem>
          {numbers[0] > 1 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {numbers.map((value) => (
            <PaginationItem key={value}>
              <PaginationLink href="#" isActive={value === page} onClick={(event) => goto(event, value)}>
                {value}
              </PaginationLink>
            </PaginationItem>
          ))}
          {numbers[numbers.length - 1] < safeCount && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              text="Seguinte"
              aria-disabled={page >= safeCount}
              className={page >= safeCount ? "pointer-events-none opacity-50" : undefined}
              onClick={(event) => goto(event, page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
