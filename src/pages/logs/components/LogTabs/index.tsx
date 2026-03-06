/**
 * 日志 Tab 导航组件
 */

import { FileText, AlertCircle } from 'lucide-react'
import { LOG_TABS } from '../../constants'
import type { LogTab } from '../../constants'

interface LogTabsProps {
  activeTab: LogTab
  onTabChange: (tab: LogTab) => void
}

const ICONS = {
  FileText,
  AlertCircle
}

export function LogTabs({ activeTab, onTabChange }: LogTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {LOG_TABS.map(tab => {
        const Icon = ICONS[tab.icon as keyof typeof ICONS]
        const isActive = activeTab === tab.key
        
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
              ${isActive 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
