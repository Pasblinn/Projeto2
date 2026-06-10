import { ReactNode } from 'react'
import { formatDate } from '@/utils/format'

interface ReportShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * A4 report frame: header with company name and emission date, body and
 * signature footer. Uses the print-* classes plus Tailwind so the same
 * markup works as on-screen preview and printed page.
 */
function ReportShell({ title, subtitle, children }: ReportShellProps) {
  const hoje = new Date().toISOString()

  return (
    <div className="print-page bg-white p-6 text-gray-900">
      <header className="print-header mb-6 border-b-2 border-gray-900 pb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          RJ Usinagem - Sistema de Gestao
        </p>
        <h1 className="print-title mt-1 text-xl font-bold">{title}</h1>
        {subtitle && <p className="print-subtitle text-sm text-gray-600">{subtitle}</p>}
        <p className="mt-1 text-xs text-gray-500">Emitido em {formatDate(hoje)}</p>
      </header>

      <div>{children}</div>

      <div className="print-signature mt-12 flex justify-around">
        <div className="print-signature-line w-2/5 border-t border-gray-900 pt-1 text-center text-xs">
          Responsavel
        </div>
        <div className="print-signature-line w-2/5 border-t border-gray-900 pt-1 text-center text-xs">
          Conferido por
        </div>
      </div>
    </div>
  )
}

export default ReportShell
