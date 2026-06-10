import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders children into #print-root, which is hidden on screen and is the
 * only visible element during printing (see print rules in index.css).
 */
function PrintArea({ children }: { children: ReactNode }) {
  const target = document.getElementById('print-root')
  if (!target) return null
  return createPortal(children, target)
}

export default PrintArea
