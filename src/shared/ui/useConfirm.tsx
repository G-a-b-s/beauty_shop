import { useCallback, useRef, useState } from 'react'
import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog'

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = useCallback((next: ConfirmOptions) => {
    resolverRef.current?.(false)
    setOptions(next)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  function resolve(confirmed: boolean) {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setOptions(null)
  }

  const dialog = options ? <ConfirmDialog {...options} onResolve={resolve} /> : null

  return { confirm, dialog }
}
