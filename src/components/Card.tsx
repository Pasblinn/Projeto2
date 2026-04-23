import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  footer?: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
}

function Card({
  title,
  subtitle,
  actions,
  footer,
  padding = 'md',
  className = '',
  children,
  ...rest
}: CardProps) {
  const hasHeader = title || subtitle || actions

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
      {...rest}
    >
      {hasHeader && (
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={PADDING[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-sm text-gray-600">
          {footer}
        </div>
      )}
    </div>
  )
}

export default Card
