import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

const baseStyles =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

const stylesByVariant: Record<Variant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
  secondary: 'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-300',
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button className={`${baseStyles} ${stylesByVariant[variant]} ${className}`} {...props} />
  )
}
