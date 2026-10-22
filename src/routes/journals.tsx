import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, ExternalLink, ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/Footer'

// 這些資料檔由排程更新，且 GitHub Pages 只給 10 分鐘 max-age。
// 用 no-cache 強制向伺服器驗證 ETag：內容沒變回 304，不會多下載。
const NO_CACHE: RequestInit = { cache: 'no-cache' }

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

type CdcItem = {
  title: string
  date: string
  sortDate: string
  url: string
  excerpt: string
  body: string
}
type CdcFeed = {
  generatedAt: string
  windowDays: number
  source: string
  sourceUrl: string
  count: number
  items: CdcItem[]
}

const CATEGORIES = ['全部', '四大綜合', '家醫科', '疾管署'] as const

function JournalsPage() {
  const [feed, setFeed] = useState<Feed | null>(null)
  const [cdc, setCdc] = useState<CdcFeed | null>(null)
  const [error, setError] = useState(false)
  const [cat, setCat] = useState<string>('全部')

  useEffect(() => {
    let cancelled = false
    fetch('/data/journals.json', NO_CACHE)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Feed) => !cancelled && setFeed(d))
      .catch(() => !cancelled && setError(true))
    // 疾管署為獨立來源，抓取失敗不影響期刊顯示
    fetch('/data/cdc_news.json', NO_CACHE)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: CdcFeed) => !cancelled && setCdc(d))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // 「全部」把兩個來源依日期混排，否則疾管署會被壓在 50 餘篇期刊之後看不到
  type Row =
    | { kind: 'article'; sortDate: string; article: Article }
    | { kind: 'cdc'; sortDate: string; item: CdcItem }

  const shown = useMemo<Row[]>(() => {
    const arts: Row[] = (feed?.articles ?? [])
      .filter((a) => cat === '全部' || a.category === cat)
      .map((a) => ({ kind: 'article', sortDate: a.sortDate, article: a }))
    const news: Row[] =
      cat === '全部' || cat === '疾管署'
        ? (cdc?.items ?? []).map((n) => ({ kind: 'cdc', sortDate: n.sortDate, item: n }))
        : []
    return [...arts, ...news].sort((x, y) => (x.sortDate < y.sortDate ? 1 : -1))
  }, [feed, cdc, cat])

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
            僅顯示標題與摘要，點擊可連至 PubMed 原文。期刊中文為機器翻譯，僅供參考，請以原文為準。
            另收錄疾管署新聞稿近 {cdc?.windowDays ?? 60} 天內容。每週一自動更新。
            {feed && (
              <span className="text-text-dim">
                {' '}· 更新於 {feed.generatedAt} · 期刊 {feed.count} 篇
                {cdc && ` · 疾管署 ${cdc.count} 則`}
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
          {shown.map((r) =>
            r.kind === 'article' ? (
              <ArticleCard key={r.article.pmid} article={r.article} />
            ) : (
              <CdcCard key={r.item.url} item={r.item} />
            ),
          )}
        </div>

        {cat === '疾管署' && !cdc && (
          <p className="px-1 py-6 text-sm text-text-muted">目前無法載入疾管署新聞稿。</p>
        )}
        {feed && shown.length === 0 && !(cat === '疾管署' && !cdc) && (
          <p className="px-1 py-6 text-sm text-text-muted">此分類近期沒有內容。</p>
        )}

        <div className="mt-12">
          <Footer />
        </div>
      </div>
    </>
  )
}

function CdcCard({ item: n }: { item: CdcItem }) {
  const [open, setOpen] = useState(false)
  const hasMore = !!n.body && n.body.length > n.excerpt.length

  return (
    <article className="rounded-[10px] border border-border bg-surface px-5 py-4 max-md:px-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="rounded-md border border-green/30 bg-green/[0.12] px-2 py-0.5 font-medium text-green">
          疾管署
        </span>
        <span className="text-text-dim">新聞稿</span>
        <span className="ml-auto text-text-dim">{n.date}</span>
      </div>

      <a
        href={n.url}
        target="_blank"
        rel="noopener"
        className="group block text-[15px] font-semibold leading-snug text-text no-underline transition-colors hover:text-accent"
      >
        <span className="inline-flex items-start gap-1">
          {n.title}
          <ExternalLink
            className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-text-dim transition-colors group-hover:text-accent"
            strokeWidth={1.8}
          />
        </span>
      </a>

      {n.excerpt && !open && (
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">{n.excerpt}</p>
      )}

      {open && (
        <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-text-muted">{n.body}</p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-accent/80 transition-colors hover:text-accent"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            strokeWidth={2}
          />
          {open ? '收合全文' : '展開全文'}
        </button>
      )}
    </article>
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
