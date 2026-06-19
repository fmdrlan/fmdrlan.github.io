import { Home, Search, FlaskConical, TrendingUp, Syringe, Scale, Weight, BookOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV_ITEMS: NavItem[] = [
  { href: '/drugs', label: '藥品給付查詢', icon: Search },
  { href: '/lab', label: '檢驗報告解讀', icon: FlaskConical },
  { href: '/lipid', label: '高血脂風險評估', icon: TrendingUp },
  { href: '/vaccine', label: '疫苗查詢', icon: Syringe },
  { href: '/compare', label: '藥物類別比較', icon: Scale },
  { href: '/obesity', label: '門診問診', icon: Weight },
  { href: '/journals', label: '期刊速覽', icon: BookOpen },
]

function isReactRoute(href: string) {
  return href.startsWith('/') && !href.endsWith('.html')
}

function NavLink({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) {
  if (isReactRoute(href)) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      aria-label="主選單"
      className="sticky top-0 z-50 flex overflow-x-auto border-b border-border bg-bg2 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <NavLink
        href="/"
        className="mr-1 flex items-center gap-[7px] whitespace-nowrap border-r border-border px-4 py-2.5 pr-[18px] text-sm text-text-light no-underline transition-colors hover:text-accent"
      >
        <Home className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.8} />
        DR. LAN
      </NavLink>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === pathname
        const Icon = item.icon
        return (
          <NavLink
            key={item.href}
            href={item.href}
            className={`flex items-center gap-[7px] whitespace-nowrap border-b-2 px-4 pt-3 pb-2.5 text-sm no-underline transition-colors ${
              isActive
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Icon className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.8} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
