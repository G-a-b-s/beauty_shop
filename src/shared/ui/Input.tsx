import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export function Input({ label, id, className = '', ...props }: Props) {
  const generatedId = useId()
  const finalId = id ?? generatedId

  return (
    <div className="grid gap-1.5 text-left">
      <label htmlFor={finalId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={finalId}
        className={
          'rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 ' +
          'placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none ' +
          'focus:ring-2 focus:ring-primary-200 ' +
          className
        }
        {...props}
      />
    </div>
  )
}
