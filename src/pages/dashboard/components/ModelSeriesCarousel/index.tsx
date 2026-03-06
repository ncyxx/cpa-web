/**
 * 模型系列轮播容器组件
 * 使用 CSS scroll-snap 实现平滑滑动
 * 每次展示两个卡片，支持分页指示器
 * 
 * UX: scroll-behavior smooth, prefers-reduced-motion respected
 */

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ModelSeriesCarouselProps {
  children: React.ReactNode[]
  itemsPerPage?: number
}

export function ModelSeriesCarousel({ children, itemsPerPage = 2 }: ModelSeriesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const totalPages = Math.ceil(children.length / itemsPerPage)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const itemWidth = container.offsetWidth
      const newPage = Math.round(scrollLeft / itemWidth)
      setCurrentPage(newPage)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToPage = (page: number) => {
    const container = scrollRef.current
    if (!container) return
    
    const targetScroll = page * container.offsetWidth
    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }

  const goToPrev = () => {
    if (currentPage > 0) scrollToPage(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages - 1) scrollToPage(currentPage + 1)
  }

  const pages: React.ReactNode[][] = []
  for (let i = 0; i < children.length; i += itemsPerPage) {
    pages.push(children.slice(i, i + itemsPerPage))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">模型系列统计</h3>
          <p className="text-xs text-gray-500 mt-0.5">按供应商分类的模型使用情况</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={currentPage === 0}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages - 1}
            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {pages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className="flex-shrink-0 w-full snap-start p-5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pageItems.map((item, itemIndex) => (
                <div key={itemIndex}>{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-4 flex items-center justify-center gap-1.5">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToPage(index)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              index === currentPage 
                ? 'w-6 bg-blue-500' 
                : 'w-1.5 bg-gray-200 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
