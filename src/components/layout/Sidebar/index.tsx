import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

export interface NavItem {
  key: string
  label: string
  path: string
  icon: ReactNode
  children?: NavItem[]
}

interface SidebarProps {
  navItems: NavItem[]
  currentUser?: {
    username: string
    role?: string
  }
  onLogout?: () => void
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ navItems, currentUser, onLogout, isOpen = true, onClose }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isGroupExpanded = (key: string) => expandedGroups[key] ?? true

  const handleNavClick = () => {
    onClose?.()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[260px] bg-[#F5F5F7]/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col transition-transform duration-500',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        <div className="px-8 pt-10 pb-6">
          <NavLink to="/" className="flex items-center gap-3 mb-2" onClick={handleNavClick}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">CLI Proxy API</span>
          </NavLink>
          <p className="text-xs font-medium text-gray-400 pl-11">Management Center</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <div key={item.key}>
              {item.children?.length ? (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.key)}
                    className={cn(
                      'relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left',
                      'text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <span className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                      {item.icon}
                    </span>
                    <span className="flex-1 font-medium text-[15px]">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 text-gray-400 transition-transform duration-300',
                        isGroupExpanded(item.key) && 'rotate-90'
                      )}
                    />
                  </button>

                  {isGroupExpanded(item.key) && (
                    <div className="pl-6 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.key}
                          to={child.path}
                          onClick={handleNavClick}
                          className={({ isActive }) =>
                            cn(
                              'relative group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300',
                              isActive
                                ? 'bg-white dark:bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                            )
                          }
                        >
                          <span className="w-5 h-5">{child.icon}</span>
                          <span className="font-medium text-[14px]">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    cn(
                      'relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-white dark:bg-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 hover:bg-white/60 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn('w-5 h-5 transition-colors duration-300', isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300')}>
                        {item.icon}
                      </span>
                      <span className="font-medium text-[15px]">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 m-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-semibold text-lg">
              {(currentUser?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {currentUser?.username || 'Administrator'}
              </p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.role || '管理员'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-500/10 h-9 px-2 font-medium"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>
    </>
  )
}
