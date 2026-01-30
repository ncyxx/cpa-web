/**
 * 操作按钮组件
 */

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'primary'
}

export function ActionButton({ icon, label, onClick, disabled, variant = 'default' }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-9 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
        variant === 'primary'
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
