/**
 * 号池状态卡片组件
 * 按照原有风格：左右分栏布局
 * 左边：账户状态 | 右边：状态与负载率（进度条格子）
 */

import { ChevronRight, CheckCircle, AlertTriangle, XCircle, Crown } from 'lucide-react'

export interface AccountStatus {
  id: string
  name?: string
  status: 'healthy' | 'exhausted' | 'unhealthy' | 'disabled'
  loadRate: number
  successRate: number
  requests: number
}

export interface PoolStatusData {
  accounts: AccountStatus[]
  totalRequests: number
  totalTokens: number
  totalUsage?: number
  totalLimit?: number
  proCount?: number
}

interface PoolStatusCardProps {
  title: string
  sub: string
  icon: React.ReactNode
  bg: string
  color: string
  headerBg: string
  link?: string
  data: PoolStatusData
  loading?: boolean
  onManageClick?: () => void
}

export function PoolStatusCard({ 
  title, 
  sub, 
  icon, 
  bg, 
  color, 
  headerBg, 
  data,
  loading,
  onManageClick
}: PoolStatusCardProps) {
  const { accounts, totalUsage = 0, totalLimit = 0, proCount = 0 } = data
  
  // 统计
  const healthyCount = accounts.filter(a => a.status === 'healthy').length
  const exhaustedCount = accounts.filter(a => a.status === 'exhausted').length
  const unhealthyCount = accounts.filter(a => a.status === 'unhealthy').length
  const totalCount = accounts.length
  
  // 整体状态
  const overallStatus = healthyCount > 0 ? 'healthy' : (exhaustedCount > 0 ? 'exhausted' : (totalCount > 0 ? 'unhealthy' : 'empty'))
  
  // 配额百分比
  const quotaPct = totalLimit > 0 ? Math.round((totalUsage / totalLimit) * 100) : 0
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-200 rounded mt-1.5 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="grid grid-cols-2 gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div>
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 头部 */}
      <div className={`px-4 py-3 bg-gradient-to-r ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color.replace('text-', 'text-white')}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
          <button 
            onClick={onManageClick}
            className={`flex items-center text-xs font-medium ${color} hover:opacity-80 cursor-pointer`}
          >
            管理 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* 左右分栏 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 左边：账户状态 */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">账户状态</p>
            <div className="grid grid-cols-2 gap-1.5">
              <MiniStat label="总数" value={totalCount} />
              <MiniStat label="健康" value={healthyCount} color="text-green-600" icon={<CheckCircle className="w-3.5 h-3.5" />} />
              <MiniStat label="耗尽" value={exhaustedCount} color="text-amber-500" icon={<AlertTriangle className="w-3.5 h-3.5" />} />
              <MiniStat label="异常" value={unhealthyCount} color="text-red-500" icon={<XCircle className="w-3.5 h-3.5" />} />
            </div>
          </div>

          {/* 右边：状态与负载率 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">状态与负载率</p>
              <OverallStatusBadge status={overallStatus} />
            </div>
            <AccountStatusGrid accounts={accounts} />
          </div>
        </div>

        {/* 底部：配额进度条 */}
        {(totalLimit > 0 || proCount > 0) && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            {totalLimit > 0 ? (
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">配额 {totalUsage.toFixed(0)}/{totalLimit}</span>
                  <span className={`font-medium ${quotaPct >= 90 ? 'text-red-500' : quotaPct >= 70 ? 'text-amber-500' : 'text-gray-600'}`}>
                    {quotaPct}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      quotaPct >= 90 ? 'bg-red-500' : quotaPct >= 70 ? 'bg-amber-500' : color.replace('text-', 'bg-')
                    }`}
                    style={{ width: `${Math.min(quotaPct, 100)}%` }} 
                  />
                </div>
              </div>
            ) : <div />}
            
            {proCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Crown className="w-3.5 h-3.5" />
                <span className="font-medium">{proCount} PRO</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 整体状态徽章
 */
function OverallStatusBadge({ status }: { status: 'healthy' | 'exhausted' | 'unhealthy' | 'empty' }) {
  const config = {
    healthy: { label: '有效', className: 'text-green-600 bg-green-50' },
    exhausted: { label: '部分耗尽', className: 'text-amber-600 bg-amber-50' },
    unhealthy: { label: '异常', className: 'text-red-500 bg-red-50' },
    empty: { label: '无账号', className: 'text-gray-500 bg-gray-100' }
  }
  
  const { label, className } = config[status]
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

/**
 * 账号状态网格 - 每个格子代表一个账号
 */
function AccountStatusGrid({ accounts }: { accounts: AccountStatus[] }) {
  if (accounts.length === 0) {
    return (
      <div className="h-[88px] bg-gray-50 rounded-lg flex items-center justify-center">
        <span className="text-xs text-gray-400">暂无账号</span>
      </div>
    )
  }
  
  // 计算网格布局：根据账号数量自动调整
  const cols = Math.min(Math.ceil(Math.sqrt(accounts.length)), 10)
  const rows = Math.ceil(accounts.length / cols)
  
  return (
    <div 
      className="bg-gray-50 rounded-lg p-2 h-[88px] overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: '3px'
      }}
    >
      {accounts.map((account, index) => (
        <AccountBlock key={account.id || index} account={account} />
      ))}
    </div>
  )
}

/**
 * 单个账号格子
 */
function AccountBlock({ account }: { account: AccountStatus }) {
  const getColor = () => {
    if (account.status === 'disabled') return '#d1d5db' // gray-300
    if (account.status === 'unhealthy') return '#ef4444' // red-500
    if (account.status === 'exhausted') return '#f59e0b' // amber-500
    
    // 正常状态根据负载率显示颜色渐变
    // 高负载 → 红色，低负载 → 绿色
    if (account.loadRate >= 80) return '#ef4444' // red-500
    if (account.loadRate >= 60) return '#f97316' // orange-500
    if (account.loadRate >= 40) return '#eab308' // yellow-500
    if (account.loadRate >= 20) return '#84cc16' // lime-500
    return '#22c55e' // green-500
  }
  
  const statusText = {
    healthy: '正常',
    exhausted: '耗尽',
    unhealthy: '异常',
    disabled: '禁用'
  }
  
  return (
    <div
      className="rounded-sm min-w-[8px] min-h-[8px] transition-opacity hover:opacity-80 cursor-default"
      style={{ backgroundColor: getColor() }}
      title={[
        account.name || account.id,
        `状态: ${statusText[account.status]}`,
        `负载: ${account.loadRate.toFixed(1)}%`,
        `成功率: ${account.successRate.toFixed(1)}%`,
        `请求: ${account.requests}`
      ].join('\n')}
    />
  )
}

/**
 * 小统计格子
 */
function MiniStat({ label, value, color = 'text-gray-900', icon }: { 
  label: string; value: number; color?: string; icon?: React.ReactNode 
}) {
  return (
    <div className="text-center py-2 px-1 rounded-lg bg-gray-50/80">
      <p className={`text-base font-semibold ${color} flex items-center justify-center gap-0.5`}>
        {icon}{value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
