import { ReactNode, useEffect } from 'react'

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  size?: Size
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  footer?: ReactNode
  children: ReactNode
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[95vw]',
}

function Modal({
  open,
  onClose,
  title,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeOnEscape, onClose])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${SIZE_CLASSES[size]} max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Fechar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
