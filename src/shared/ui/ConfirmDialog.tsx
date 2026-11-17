import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

export type ConfirmOptions = {
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
}

type DialogProps = ConfirmOptions & {
  onResolve: (confirmed: boolean) => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Voltar',
  tone = 'primary',
  onResolve,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onResolve(false)
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onResolve(false)
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-neutral-100 bg-white p-0 shadow-xl backdrop:bg-neutral-900/40"
    >
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-neutral-900">
          {title}
        </h2>
        {description && <div className="mt-2 text-sm text-neutral-600">{description}</div>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" autoFocus onClick={() => onResolve(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => onResolve(true)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
