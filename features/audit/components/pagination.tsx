"use client"

import { Button } from "@/shared/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface PaginationProps {
  currentPage: number
  totalPages: number
  setPage: (page: number) => void
  totalItems: number
  itemsPerPage: number
}

export function Pagination({ currentPage, totalPages, setPage, totalItems, itemsPerPage }: PaginationProps) {
  const t = useTranslations("pages.audit.pagination")
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push("...")
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push("...")
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push("...")
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push("...")
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-muted-foreground">
        {t("showing", { start: startItem, end: endItem, total: totalItems })}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
          <ChevronLeft className="h-4 w-4" />
          {t("prev")}
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) =>
            typeof page === "number" ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(page)}
                className="min-w-[36px]"
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">
                {page}
              </span>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t("next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
