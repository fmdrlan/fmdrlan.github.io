import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, ExternalLink, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/Footer'

export const Route = createFileRoute('/journals')({
  component: JournalsPage,
})

type AbstractSeg = { label?: string; labelZh?: string; text: string; textZh?: string }
type Article = {
  pmid: string
  title: string
  titleZh?: string
  journal: string
  category: string
  date: string
  sortDate: string
  authors: string
  abstract: AbstractSeg[]
  doi: string
  url: string
}
type Feed = {
  generatedAt: string
  windowDays: number
  journals: { category: string; name: string }[]
  count: number
  articles: Article[]
}

const CATEGORIES = ['全部', '四大綜合', '家醫科'] as const

function JournalsPage() {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [error, setError] = useState(false)
  const [cat, setCat] = useState<string>('全部')

  useEffect(() => {
    let cancelled = false
    fetch('/data/journals.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Feed) => !cancelled && setFeed(d))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [])

  const shown = useMemo(() => {
    if (!feed) return []
    return cat === '全部'
      ? feed.articles
      : feed.articles.filter((a) => a.category === cat)
  }, [feed, cat])

  const namesOf = (c: string) =>
    (feed?.journals ?? []).filter((j) => j.category === c).map((j) => j.name).join('、')
  const bigFour = namesOf('四大綜合')
  const famMed = namesOf('家醫科')

  return (
    <>
      {/* 精簡標題列：刻意不連回首頁 / 不掛 SiteNav，期刊頁為導覽死路 */}
      <header className="border-b border-border bg-bg2">
        <div className="mx-auto flex max-w-[860px] items-center gap-2.5 px-6 py-3.5 max-md:px-4">
          <BookOpen className="h-5 w-5 text-accent" strokeWidth={1.8} />
          <span className="text-[15px] font-semibold text-text">頂尖期刊速覽</span>
        </div>
      </header>

      <div className="mx-auto max-w-[860px] px-6 pt-8 pb-10 max-md:px-4 max-md:pt-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">
            近期重要文獻
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-relaxed text-text-muted">
            四大綜合醫學期刊{bigFour && `（${bigFour}）`}與家醫科期刊
            {famMed && `（${famMed}）`}近 {feed?.windowDays ?? 30} 天的研究與回顧文章，
            僅顯示標題與摘要，點擊可連至 PubMed 原文。每週一自動更新。
            中文為機器翻譯，僅供參考，請以原文為準。
            {feed && (
              <span className="text-text-dim">
                {' '}· 更新於 {feed.generatedAt} · 共 {feed.count} 篇
              </span>
            )}
          </p>
        </div>

        <Tabs value={cat} onValueChange={setCat} className="mb-5">
          <TabsList variant="line" className="w-full justify-start border-b border-border">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="flex-none">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {error && (
          <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-sm text-text-muted">
            目前無法載入期刊資料，請稍後再試。
          </p>
        )}

        {!error && !feed && (
          <p className="px-1 py-6 text-sm text-text-muted">載入中…</p>
        )}

        <div className="flex flex-col gap-3">
          {shown.map((a) => (
            <ArticleCard key={a.pmid} article={a} />
          ))}
        </div>

        {feed && shown.length === 0 && (
          <p className="px-1 py-6 text-sm text-text-muted">此分類近期沒有文章。</p>
        )}

        <div className="mt-12">
          <Footer />
        </div>
      </div>
    </>
  )
}

function ArticleCard({ article: a }: { article: Article }) {
  const [open, setOpen] = useState(false)
  const [orig, setOrig] = useState(false) // 摘要顯示原文
  const hasZhTitle = !!a.titleZh && a.titleZh !== a.title
  const hasZhAbstract = a.abstract.some((s) => s.textZh)

  return (
    <article className="rounded-[10px] border border-border bg-surface px-5 py-4 max-md:px-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="rounded-md border border-accent/30 bg-accent/[0.12] px-2 py-0.5 font-medium text-accent">
          {a.journal}
        </span>
        <span className="text-text-dim">{a.category}</span>
        <span className="ml-auto text-text-dim">{a.date}</span>
      </div>

      <a
        href={a.url}
        target="_blank"
        rel="noopener"
        className="group block text-[15px] font-semibold leading-snug text-text no-underline transition-colors hover:text-accent"
      >
        <span className="inline-flex items-start gap-1">
          {hasZhTitle ? a.titleZh : a.title}
          <ExternalLink
            className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-text-dim transition-colors group-hover:text-accent"
            strokeWidth={1.8}
          />
        </span>
        {hasZhTitle && <span className="mt-1 block">{a.title}</span>}
      </a>

      {a.authors && (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">{a.authors}</p>
      )}

      {a.abstract.length > 0 && (
        <>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[12.5px] text-accent/80 transition-colors hover:text-accent"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
              {open ? '收合摘要' : '展開摘要'}
            </button>
            {open && hasZhAbstract && (
              <button
                type="button"
                onClick={() => setOrig((v) => !v)}
                className="text-[12px] text-text-dim underline transition-colors hover:text-accent"
              >
                {orig ? '顯示中文' : '顯示原文'}
              </button>
            )}
          </div>

          {open && (
            <div className="mt-2.5 flex flex-col gap-2 border-t border-border pt-3 text-[13px] leading-relaxed text-text-muted">
              {a.abstract.map((seg, i) => {
                const showOrig = orig || !seg.textZh
                return (
                  <p key={i}>
                    {seg.label && (
                      <span className="mr-1.5 font-semibold text-text-light">
                        {showOrig ? seg.label : seg.labelZh ?? seg.label}
                      </span>
                    )}
                    {showOrig ? seg.text : seg.textZh}
                  </p>
                )
              })}
              {a.doi && (
                <p className="mt-1 text-[12px] text-text-dim">
                  DOI:{' '}
                  <a
                    href={`https://doi.org/${a.doi}`}
                    target="_blank"
                    rel="noopener"
                    className="text-text-dim underline transition-colors hover:text-accent"
                  >
                    {a.doi}
                  </a>
                </p>
              )}
            </div>
          )}
        </>
      )}
    </article>
  )
}
