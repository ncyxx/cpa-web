import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, ChevronRight } from 'lucide-react'
import { Sidebar, type NavItem } from '../Sidebar'

interface MainLayoutProps {
  navItems: NavItem[]
  currentUser?: {
    username: string
    role?: string
  }
  onLogout?: () => void
}

export function MainLayout({ navItems, currentUser, onLogout }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const getCurrentPageLabel = (): string => {
    const findLabel = (items: NavItem[]): string | null => {
      for (const item of items) {
        if (item.path === location.pathname) return item.label
        if (item.children) {
          const childLabel = findLabel(item.children)
          if (childLabel) return childLabel
        }
      }
      return null
    }
    return findLabel(navItems) || 'Dashboard'
  }

  const currentPageLabel = getCurrentPageLabel()

  return (
    <div className="relative h-screen overflow-hidden bg-[#F5F5F7] dark:bg-[#1C1C1E]">
      <Sidebar
        navItems={navItems}
        currentUser={currentUser}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col h-screen lg:pl-[260px] transition-all duration-500" style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <header className="flex-none h-16 px-6 flex items-center justify-between lg:hidden bg-[#F5F5F7]/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md z-20 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              onClick={() => setSidebarOpen(prev => !prev)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold text-gray-900 dark:text-white">{currentPageLabel}</span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div className="hidden lg:block">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {currentPageLabel}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 font-medium">
                  <span>Console</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{currentPageLabel}</span>
                </div>
              </div>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
