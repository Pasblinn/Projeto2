import { Toast as ToastData, ToastType, useToast } from '@/contexts/ToastContext'

const TYPE_CLASSES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-500 text-green-800',
  error: 'bg-red-50 border-red-500 text-red-800',
  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
  info: 'bg-blue-50 border-blue-500 text-blue-800',
}

const TYPE_ICON: Record<ToastType, string> = {
  success: 'V',
  error: 'X',
  warning: '!',
  info: 'i',
}

function ToastItem({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-md border-l-4 px-4 py-3 shadow-md min-w-[280px] max-w-[420px] ${
        TYPE_CLASSES[toast.type]
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white font-bold">
        {TYPE_ICON[toast.type]}
      </span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-current opacity-60 hover:opacity-100"
        aria-label="Fechar notificacao"
      >
        X
      </button>
    </div>
  )
}

function ToastContainer() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

export default ToastContainer
