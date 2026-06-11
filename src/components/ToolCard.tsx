import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function ToolCard({
  href,
  icon: Icon,
  name,
  desc,
  badge,
}: {
  href: string
  icon: LucideIcon
  name: string
  desc: string
  badge?: ReactNode
}) {
  const isExternal = href.startsWith('http')
  const targetProps = isExternal ? { target: '_blank', rel: 'noopener' } : {}

  return (
    <a
      href={href}
      {...targetProps}
      className="group flex items-center gap-4 rounded-[10px] border border-border bg-bg2 p-4 no-underline transition-[border-color,background] duration-150 hover:border-accent/50 hover:bg-accent/[0.04]"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-accent/[0.08] text-accent">
        <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] flex flex-wrap items-center text-[15px] font-medium text-text">
          {name}
          {badge}
        </div>
        <div className="text-[13px] leading-snug text-text-muted">{desc}</div>
      </div>
      <span className="flex flex-shrink-0 items-center text-text-dim transition-colors group-hover:text-accent">
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </span>
    </a>
  )
}
