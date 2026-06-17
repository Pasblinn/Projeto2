import { ComponentType, ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: ComponentType<{ size?: number | string; className?: string }>
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

/**
 * Friendly placeholder for empty lists/tables: icon in a soft circle,
 * title, optional description and an optional call-to-action.
 */
function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8' : 'py-14'
      }`}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-500 ring-8 ring-primary-50/40">
        <Icon size={26} />
      </div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
