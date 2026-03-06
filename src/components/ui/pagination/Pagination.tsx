import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants, type ButtonProps } from '../button'

interface PaginationProps extends React.ComponentProps<'nav'> {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  siblingCount?: number
}

function Pagination({
  className,
  totalPages,
  currentPage,
  onPageChange,
  siblingCount = 1,
  ...props
}: PaginationProps) {
  const range = React.useMemo(() => {
    const totalNumbers = siblingCount * 2 + 3
    const totalBlocks = totalNumbers + 2

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, 'ellipsis', totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      return [1, 'ellipsis', ...rightRange]
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    )
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages]
  }, [totalPages, currentPage, siblingCount])

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    >
      <PaginationContent>
        <PaginationPrevious
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        {range.map((page, index) =>
          page === 'ellipsis' ? (
            <PaginationEllipsis key={`ellipsis-${index}`} />
          ) : (
            <PaginationItem
              key={page}
              page={page as number}
              isActive={page === currentPage}
              onClick={() => onPageChange(page as number)}
            />
          )
        )}
        <PaginationNext
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
      </PaginationContent>
    </nav>
  )
}

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  )
)
PaginationContent.displayName = 'PaginationContent'

interface PaginationItemProps extends React.ComponentProps<'button'> {
  page: number
  isActive?: boolean
}

const PaginationItem = React.forwardRef<HTMLButtonElement, PaginationItemProps>(
  ({ className, page, isActive, ...props }, ref) => (
    <li>
      <button
        ref={ref}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          buttonVariants({
            variant: isActive ? 'outline' : 'ghost',
            size: 'icon',
          }),
          className
        )}
        {...props}
      >
        {page}
      </button>
    </li>
  )
)
PaginationItem.displayName = 'PaginationItem'

interface PaginationNavButtonProps extends React.ComponentProps<'button'>, Pick<ButtonProps, 'size'> {
  disabled?: boolean
}

const PaginationPrevious = React.forwardRef<HTMLButtonElement, PaginationNavButtonProps>(
  ({ className, size = 'default', disabled, ...props }, ref) => (
    <li>
      <button
        ref={ref}
        aria-label="Go to previous page"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: 'ghost', size }),
          'gap-1 px-2.5',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:block">上一页</span>
      </button>
    </li>
  )
)
PaginationPrevious.displayName = 'PaginationPrevious'

const PaginationNext = React.forwardRef<HTMLButtonElement, PaginationNavButtonProps>(
  ({ className, size = 'default', disabled, ...props }, ref) => (
    <li>
      <button
        ref={ref}
        aria-label="Go to next page"
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: 'ghost', size }),
          'gap-1 px-2.5',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        <span className="hidden sm:block">下一页</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </li>
  )
)
PaginationNext.displayName = 'PaginationNext'

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <li>
    <span
      aria-hidden
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  </li>
)
PaginationEllipsis.displayName = 'PaginationEllipsis'

export { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis }
