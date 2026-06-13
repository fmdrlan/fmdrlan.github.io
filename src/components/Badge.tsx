import type { ReactNode } from 'react'

type BadgeVariant = 'new' | 'wip'

export function Badge({
  variant,
  children,
}: {
  variant: BadgeVariant
  children: ReactNode
}) {
  const color =
    variant === 'new'
      ? 'bg-green/10 text-green border-green/25'
      : 'bg-orange/10 text-orange border-orange/35'

  return (
    <span
      className={`ml-1.5 inline-block rounded-sm border px-1.5 py-[2px] font-mono text-[9px] font-semibold tracking-wider ${color}`}
    >
      {children}
    </span>
  )
}
