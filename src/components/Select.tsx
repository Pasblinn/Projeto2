import { forwardRef, SelectHTMLAttributes } from 'react'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  disabled?: boolean
}

interface SelectProps<T extends string = string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption<T>[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className = '', id, required, ...rest },
  ref,
) {
  const inputId = id ?? `select-${rest.name ?? Math.random().toString(36).slice(2)}`
  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        required={required}
        className={`block w-full rounded-md border bg-white px-3 py-2 text-gray-900 shadow-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-500 ${borderClass} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export default Select
