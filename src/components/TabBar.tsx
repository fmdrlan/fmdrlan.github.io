import type { LucideIcon } from 'lucide-react'
import { Home } from 'lucide-react'

export type TabItem = {
  href: string
  label: string
  icon: LucideIcon
}

export function TabBar({
  items,
  activeHref,
}: {
  items: TabItem[]
  activeHref?: string
}) {
  return (
    <nav className="sticky top-0 z-50 flex overflow-x-auto border-b border-border bg-bg2 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <a
        href="/"
        className="flex items-center gap-[7px] whitespace-nowrap border-r border-border px-4 py-2.5 pr-[18px] mr-1 text-sm text-[#566880] no-underline transition-colors hover:text-accent"
      >
        <Home className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.8} />
        首頁
      </a>
      {items.map((item) => {
        const isActive = activeHref === item.href
        const Icon = item.icon
        return (
          <a
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[7px] whitespace-nowrap border-b-2 px-4 py-2.5 text-sm no-underline transition-colors ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.8} />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
