import { ReactNode } from 'react'

interface ReportSectionProps {
  title: string
  children: ReactNode
}

function ReportSection({ title, children }: ReportSectionProps) {
  return (
    <section className="print-section mb-6">
      <h2 className="print-section-title mb-2 border-b border-gray-400 pb-1 text-base font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default ReportSection
