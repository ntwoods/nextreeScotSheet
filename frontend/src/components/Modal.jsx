import { useEffect, useRef } from 'react'
import clsx from 'clsx'

export default function Modal({ open, onClose, title, children, width = 'max-w-2xl' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (first) first.focus()

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
      if (event.key === 'Tab' && focusable.length > 0) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close modal"
        onClick={onClose}
        type="button"
      />
      <div
        ref={panelRef}
        className={clsx(
          'relative w-full rounded-2xl bg-white p-6 shadow-soft',
          width,
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && <h2 className="text-xl font-semibold text-slate-900">{title}</h2>}
        <div className={clsx(title ? 'mt-4' : '')}>{children}</div>
      </div>
    </div>
  )
}