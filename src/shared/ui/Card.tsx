import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-neutral-100 bg-white p-8 shadow-sm ${className}`}
      {...props}
    />
  )
}
