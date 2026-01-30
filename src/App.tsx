import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout, type NavItem } from '@/components/layout'
import { ToastProvider } from '@/components/ui'
import { useAuthStore, useConfigStore } from '@/stores'
import { preloadDashboardData } from '@/pages/dashboard/hooks/useDashboardData'
import { preloadAIPoolData } from '@/pages/ai-pool/hooks'
import { preloadAIProvidersData } from '@/pages/ai-providers/hooks'
import { preloadAuthFilesData } from '@/pages/auth-files/hooks'
import { preloadApiKeysData } from '@/pages/api-keys/hooks'
import { 
  Settings, 
  LayoutDashboard,
  Key, 
  Bot,
  FileText,
  Shield,
  ScrollText,
  Database
} from 'lucide-react'

// 页面组件
import { LoginPage, DashboardPage, ConfigPage, AIProvidersPage, ApiKeysPage, AIPoolPage, AuthFilesPage, OAuthPage, LogsPage } from '@/pages'
import { SystemPage } from '@/pages/system'

// 导航配置 - CLI Proxy 管理
const navItems: NavItem[] = [
  { key: 'dashboard', label: '仪表盘', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { key: 'api-keys', label: 'API 密钥', path: '/admin/api-keys', icon: <Key size={18} /> },
  { key: 'ai-pool', label: 'AI 号池', path: '/admin/ai-pool', icon: <Database size={18} /> },
  { key: 'ai-providers', label: 'AI 提供商', path: '/admin/ai-providers', icon: <Bot size={18} /> },
  { key: 'auth-files', label: '认证文件', path: '/admin/auth-files', icon: <FileText size={18} /> },
  { key: 'oauth', label: 'OAuth', path: '/admin/oauth', icon: <Shield size={18} /> },
  { key: 'config', label: '配置管理', path: '/admin/config', icon: <Settings size={18} /> },
  { key: 'logs', label: '日志', path: '/admin/logs', icon: <ScrollText size={18} /> },
  { key: 'system', label: '系统配置', path: '/admin/system', icon: <Settings size={18} /> },
]

// 路由守卫 - 恢复会话并预加载数据后再渲染
function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const restoreSession = useAuthStore((s) => s.restoreSession)
  const connectionStatus = useAuthStore((s) => s.connectionStatus)
  const fetchConfig = useConfigStore((s) => s.fetchConfig)
  
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let mounted = true
    
    const init = async () => {
      // 恢复会话
      if (isAuthenticated && connectionStatus !== 'connected') {
        await restoreSession()
      }
      
      // 会话恢复后，预加载所有页面数据
      if (connectionStatus === 'connected' || useAuthStore.getState().connectionStatus === 'connected') {
        await Promise.all([
          preloadDashboardData(fetchConfig),
          preloadAIPoolData(),
          preloadAIProvidersData(fetchConfig),
          preloadAuthFilesData(),
          preloadApiKeysData()
        ])
      }
      
      if (mounted) setIsReady(true)
    }
    
    init()
    return () => { mounted = false }
  }, [isAuthenticated, connectionStatus, restoreSession, fetchConfig])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // 等待数据加载完成
  if (!isReady) {
    return null
  }
  
  return <Outlet />
}

function AdminLayout() {
  const { logout, apiBase } = useAuthStore()
  const currentUser = {
    username: 'Admin',
    role: apiBase ? new URL(apiBase).hostname : 'CLI Proxy'
  }

  return (
    <MainLayout
      navItems={navItems}
      currentUser={currentUser}
      onLogout={logout}
    />
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* 登录页面 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 受保护的管理后台路由 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="ai-pool" element={<AIPoolPage />} />
              <Route path="ai-providers" element={<AIProvidersPage />} />
              <Route path="auth-files" element={<AuthFilesPage />} />
              <Route path="oauth" element={<OAuthPage />} />
              <Route path="config" element={<ConfigPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="system" element={<SystemPage />} />
            </Route>
          </Route>

          {/* 默认重定向 */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
