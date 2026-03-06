/**
 * 通用弹窗组件
 */

import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  panelClassName?: string
  bodyClassName?: string
  variant?: 'center' | 'drawer-left' | 'drawer-right'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  panelClassName,
  bodyClassName = 'p-5',
  variant = 'center'
}: ModalProps) {
  if (!open) return null

  const isDrawerLeft = variant === 'drawer-left'
  const isDrawerRight = variant === 'drawer-right'

  const shellClassName = isDrawerLeft
    ? 'items-stretch justify-start p-0'
    : isDrawerRight
      ? 'items-stretch justify-end p-0'
      : 'items-center justify-center p-4'

  const defaultPanelClassName = isDrawerLeft || isDrawerRight
    ? 'h-full w-full max-w-[min(900px,94vw)] rounded-none bg-white shadow-2xl'
    : 'w-full max-w-lg rounded-[28px] bg-white shadow-2xl'

  const headerClassName = isDrawerLeft
    ? 'border-b border-slate-100 px-6 py-5'
    : isDrawerRight
      ? 'border-b border-slate-100 px-6 py-5'
      : 'border-b border-slate-100 px-5 py-4'

  return (
    <div className={`fixed inset-0 z-50 flex ${shellClassName}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex flex-col overflow-hidden ${defaultPanelClassName} ${
          isDrawerLeft ? 'border-r border-slate-200 rounded-r-[32px]' : ''
        } ${isDrawerRight ? 'border-l border-slate-200 rounded-l-[32px]' : ''} ${panelClassName || ''}`}
      >
        <div className={`flex items-center justify-between ${headerClassName}`}>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className={`flex-1 overflow-auto ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  )
}
