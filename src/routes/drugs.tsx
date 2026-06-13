import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Fuse from 'fuse.js'
import { Search, X, Copy, Check, Link2, MessageSquare, ChevronDown } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { Input } from '@/components/ui/input'
import { TIPS, type Drug, type DrugItem, type DrugBlock } from '@/data/drugs-data'
import {
  getSearchTerms,
  termMatches,
  highlight,
  esc,
  findRelated,
  getSectionFromTitle,
  stripSection,
  breakSubItems,
} from '@/lib/drugs-search'

const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfNUXEtUPxavNh_ga1khBQr0VOcY0ZYVmkMK3Ux3CNxznPUSg/viewform'

type SearchParams = { q?: string }

export const Route = createFileRoute('/drugs')({
  validateSearch: (search): SearchParams => ({
    q: typeof search.q === 'string' ? search.q : undefined,
  }),
  component: DrugsPage,
})

function DrugsPage() {
  const { q: urlQuery } = Route.useSearch()
  const navigate = useNavigate()

  const [allDrugs, setAllDrugs] = useState<Drug[]>([])
  const [drugItems, setDrugItems] = useState<DrugItem[]>([])
  const [query, setQuery] = useState(urlQuery ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery ?? '')
  const [expanded, setExpanded] = useState<Set<Drug['id']>>(new Set())
  const [version, setVersion] = useState('—')
  const [lastCheck, setLastCheck] = useState('—')
  const [loadError, setLoadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load data ──
  useEffect(() => {
    let cancelled = false

    async function fetchJson<T>(url: string): Promise<T | null> {
      try {
        const r = await fetch(url)
        if (!r.ok) return null
        const ct = r.headers.get('content-type') ?? ''
        if (!ct.includes('json')) return null
        return await r.json()
      } catch {
        return null
      }
    }
    async function fetchText(url: string): Promise<string | null> {
      try {
        const r = await fetch(url)
        if (!r.ok) return null
        return await r.text()
      } catch {
        return null
      }
    }

    ;(async () => {
      // drugs.json is the only required fetch
      try {
        const r = await fetch('/data/drugs.json')
        if (!r.ok) throw new Error(`drugs.json: ${r.status}`)
        const data = await r.json()
        if (!cancelled) setAllDrugs(data)
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? String(e))
        return
      }

      const [items, ver, chk] = await Promise.all([
        fetchJson<DrugItem[]>('/data/drug_items.json'),
        fetchText('/data/last_version.txt'),
        fetchText('/data/last_check.txt'),
      ])
      if (cancelled) return

      if (items) setDrugItems(items)
      if (ver) {
        const v = ver.trim()
        if (v.length === 7) {
          const rocY = parseInt(v.slice(0, 3), 10)
          const m = v.slice(3, 5)
          const d = v.slice(5, 7)
          setVersion(`${rocY + 1911}/${m}/${d}`)
        }
      }
      if (chk) setLastCheck(chk.trim().replace(/-/g, '/'))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // ── Sync query → URL (?q=) so searches are shareable ──
  useEffect(() => {
    navigate({
      to: '/drugs',
      search: debouncedQuery ? { q: debouncedQuery } : {},
      replace: true,
    })
  }, [debouncedQuery, navigate])

  // ── Debounce query ──
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 180)
    return () => clearTimeout(t)
  }, [query])

  // ── Build Fuse indices ──
  const drugFuse = useMemo(() => {
    if (!allDrugs.length) return null
    const searchable = allDrugs.filter((d) => !d.is_appendix)
    return new Fuse(searchable, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'drug_names', weight: 0.4 },
        { name: 'content', weight: 0.1 },
      ],
      threshold: 0.25,
      includeScore: true,
      minMatchCharLength: 3,
      ignoreLocation: true,
    })
  }, [allDrugs])

  const itemFuse = useMemo(() => {
    if (!drugItems.length) return null
    return new Fuse(drugItems, {
      keys: [
        { name: 'name_zh', weight: 0.4 },
        { name: 'name_en', weight: 0.4 },
        { name: 'ingredient', weight: 0.15 },
        { name: 'atc', weight: 0.05 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    })
  }, [drugItems])

  const itemsBySection = useMemo(() => {
    const map = new Map<string, DrugItem[]>()
    for (const it of drugItems) {
      if (!it.section) continue
      const arr = map.get(it.section) ?? []
      arr.push(it)
      map.set(it.section, arr)
    }
    return map
  }, [drugItems])

  // ── Search ──
  const results = useMemo<Drug[]>(() => {
    if (!debouncedQuery || !drugFuse) return []
    const terms = getSearchTerms(debouncedQuery)
    const exactIds = new Set<Drug['id']>()
    for (const d of allDrugs) {
      if (d.is_appendix) continue
      const hay = (d.title + ' ' + (d.content ?? '') + ' ' + (d.drug_names ?? []).join(' ')).toLowerCase()
      if (terms.some((t) => termMatches(t, hay))) exactIds.add(d.id)
    }

    const fuzzy = drugFuse.search(debouncedQuery)
    const seen = new Set<Drug['id']>()
    const merged: Drug[] = []
    for (const d of allDrugs) {
      if (exactIds.has(d.id)) {
        merged.push(d)
        seen.add(d.id)
      }
    }
    for (const r of fuzzy) {
      if (!seen.has(r.item.id) && !r.item.is_appendix) {
        merged.push(r.item)
        seen.add(r.item.id)
      }
    }

    // Section fallback via item search
    if (itemFuse && merged.length < 5) {
      const itemHits = itemFuse.search(debouncedQuery, { limit: 10 })
      for (const r of itemHits) {
        const sec = r.item.section
        if (!sec) continue
        const candidates = [sec]
        const parts = sec.split('.')
        for (let i = parts.length - 1; i >= 2; i--) {
          candidates.push(parts.slice(0, i).join('.'))
        }
        for (const c of candidates) {
          const matched = allDrugs.filter((d) => {
            if (d.is_appendix || seen.has(d.id)) return false
            const m = d.title.match(/^([\d.]+?)\.?(?=\D|$)/)
            if (!m) return false
            return m[1].replace(/\.$/, '') === c
          })
          if (matched.length > 0) {
            for (const d of matched) {
              merged.push(d)
              seen.add(d.id)
            }
            break
          }
        }
      }
    }

    return merged.slice(0, 100)
  }, [debouncedQuery, allDrugs, drugFuse, itemFuse])

  // ── Keyboard shortcuts: / to focus, Esc to blur ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') inputRef.current?.blur()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const toggleExpanded = (id: Drug['id']) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const jumpToDrug = (id: Drug['id']) => {
    const drug = allDrugs.find((d) => d.id === id)
    if (!drug) return
    // Always search to the target's section, expand it, and jump back to the top.
    const section = getSectionFromTitle(drug.title)
    setQuery(section || stripSection(drug.title).slice(0, 20))
    setExpanded((prev) => new Set(prev).add(id))
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[860px] px-6 py-8 max-md:px-3 max-md:py-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">藥品給付規定查詢</h1>
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-relaxed text-text-muted">
            全民健康保險藥品給付規定
          </p>
        </div>

        <SearchBar
          ref={inputRef}
          value={query}
          onChange={setQuery}
        />

        <div className="mb-3 flex items-center">
          <ResultCount allCount={allDrugs.length} query={debouncedQuery} resultCount={results.length} />
        </div>

        {!debouncedQuery && allDrugs.length > 0 && (
          <TipChips onPick={setQuery} />
        )}

        {loadError ? (
          <StateMessage icon="⚠️" title="載入失敗" text={loadError} />
        ) : !allDrugs.length ? (
          <StateMessage icon="⏳" title="載入中..." text="" />
        ) : !debouncedQuery ? (
          <StateMessage
            icon="🔍"
            title="輸入藥名或關鍵字開始查詢"
            text="支援中文、英文學名、商品名、適應症、藥物類別（如 SGLT2、PPI、prazole）"
          />
        ) : !results.length ? (
          <StateMessage
            icon="🤷"
            title={`找不到「${debouncedQuery}」的相關給付規定`}
            text="試試換個關鍵字，或用英文學名搜尋"
          />
        ) : (
          <div className="flex flex-col gap-2">
            {results.map((drug) => (
              <DrugCard
                key={drug.id}
                drug={drug}
                query={debouncedQuery}
                expanded={expanded.has(drug.id)}
                onToggle={() => toggleExpanded(drug.id)}
                allDrugs={allDrugs}
                itemsBySection={itemsBySection}
                onRelatedClick={jumpToDrug}
              />
            ))}
          </div>
        )}
      </main>

      <DrugsFooter version={version} lastCheck={lastCheck} />
    </>
  )
}

// ────────────────────────────────────────────────────────
//  Search bar
// ────────────────────────────────────────────────────────
function SearchBar({
  ref,
  value,
  onChange,
}: {
  ref: React.RefObject<HTMLInputElement | null>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative mb-5">
      <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-text-muted">
        <Search className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="輸入藥名、成分、適應症…（如 Pregabalin、SGLT2、PPI、prazole）"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="!w-full !rounded-[10px] !border-[1.5px] !border-border !bg-surface !px-11 !py-2.5 !text-[15px] !text-text placeholder:!text-text-light focus-visible:!border-accent focus-visible:!ring-accent/15"
      />
      {value && (
        <button
          type="button"
          aria-label="清除"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface2 p-0 text-text-muted transition-colors hover:bg-border-strong hover:text-text"
        >
          <X className="h-[11px] w-[11px]" strokeWidth={2.2} />
        </button>
      )}
    </div>
  )
}

function ResultCount({
  allCount,
  query,
  resultCount,
}: {
  allCount: number
  query: string
  resultCount: number
}) {
  if (!query) {
    return (
      <div className="text-sm text-text-muted">
        共收錄 <strong className="text-accent">{allCount}</strong> 個給付條目
      </div>
    )
  }
  return (
    <div className="text-sm text-text-muted">
      搜尋「<strong className="text-accent">{query}</strong>」，找到{' '}
      <strong className="text-accent">{resultCount}</strong> 筆
    </div>
  )
}

function TipChips({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[13px] text-text-light">常見搜尋</div>
      <div className="flex flex-wrap gap-[7px]">
        {TIPS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onPick(t)}
            className="cursor-pointer rounded-full border border-border bg-surface px-3.5 py-1 text-sm text-text-muted transition-all hover:border-accent/40 hover:bg-accent-dim hover:text-accent"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

function StateMessage({
  icon,
  title,
  text,
}: {
  icon: string
  title: string
  text: string
}) {
  return (
    <div className="px-5 py-12 text-center text-text-muted">
      <div className="mb-3 text-[44px]">{icon}</div>
      <h3 className="mb-2 text-base text-text">{title}</h3>
      {text && <p className="text-sm">{text}</p>}
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  Drug card
// ────────────────────────────────────────────────────────
function DrugCard({
  drug,
  query,
  expanded,
  onToggle,
  allDrugs,
  itemsBySection,
  onRelatedClick,
}: {
  drug: Drug
  query: string
  expanded: boolean
  onToggle: () => void
  allDrugs: Drug[]
  itemsBySection: Map<string, DrugItem[]>
  onRelatedClick: (id: Drug['id']) => void
}) {
  const sec = getSectionFromTitle(drug.title)
  const preview = ((drug.content ?? '').slice(0, 130).replace(/\n/g, ' ') + '…').trim()
  const is261 = sec === '2.6.1'

  return (
    <div
      id={`drug-${drug.id}`}
      className={`overflow-hidden rounded-xl border bg-surface transition-colors ${
        expanded
          ? 'border-accent/40 shadow-[0_0_0_1px_rgba(43,184,201,0.08)]'
          : 'border-border hover:border-border-strong'
      }`}
    >
      <button
        type="button"
        onClick={() => {
          const sel = window.getSelection()
          if (sel && !sel.isCollapsed && sel.toString().length > 0) return
          onToggle()
        }}
        className="flex w-full cursor-pointer select-text items-start gap-3 bg-transparent px-4 py-3.5 text-left transition-colors hover:bg-surface2"
      >
        {sec && (
          <span className="mt-0.5 flex-shrink-0 rounded-md border border-accent/25 bg-accent-dim px-[7px] py-[3px] font-mono text-[10px] font-semibold text-accent">
            {sec}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="text-[15px] font-semibold leading-[1.45] text-text break-words [&_mark]:rounded-sm [&_mark]:bg-[rgba(255,210,60,0.18)] [&_mark]:px-[2px] [&_mark]:text-accent"
            dangerouslySetInnerHTML={{ __html: highlight(esc(drug.title), query) }}
          />
          <div className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-text-muted">{preview}</div>
        </div>
        <ChevronDown
          className={`mt-1 h-[14px] w-[14px] flex-shrink-0 text-text-light transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          strokeWidth={1.8}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {is261 ? (
            <Body261 />
          ) : drug.is_appendix ? (
            <AppendixNotice />
          ) : (
            <Blocks blocks={drug.blocks} fallbackContent={drug.content} query={query} />
          )}
          <CopyButton drug={drug} />
          <SectionItems drug={drug} itemsBySection={itemsBySection} />
          <RelatedDrugs drug={drug} allDrugs={allDrugs} onClick={onRelatedClick} />
        </div>
      )}
    </div>
  )
}

function Blocks({
  blocks,
  fallbackContent,
  query,
}: {
  blocks?: DrugBlock[]
  fallbackContent?: string
  query: string
}) {
  if (!blocks?.length) {
    return (
      <div
        className="whitespace-pre-wrap pt-3.5 text-sm leading-[1.85] text-text break-words [&_mark]:rounded-sm [&_mark]:border-b-2 [&_mark]:border-[rgba(255,210,60,0.6)] [&_mark]:bg-[rgba(255,210,60,0.18)] [&_mark]:px-[1px] [&_mark]:text-[#ffd23c]"
        dangerouslySetInnerHTML={{ __html: highlight(esc(fallbackContent ?? ''), query) }}
      />
    )
  }
  return (
    <div>
      {blocks.map((b, i) => {
        const baseHtml = highlight(esc(b.text), query)
        const html = breakSubItems(baseHtml)
        const indent = b.level * 16
        const levelClass =
          b.level === 0
            ? 'mt-2.5 pt-1 border-t border-border text-sm font-semibold first:border-t-0 first:mt-0.5'
            : b.level === 1
              ? 'mt-0.5 ml-1 border-l-2 border-border pl-5 text-sm'
              : b.level === 2
                ? 'ml-1 border-l-2 border-[#1e2d45] pl-9 text-[13px]'
                : 'ml-1 border-l-2 border-[#182436] pl-[52px] text-[13px] text-[#c8d8ec]'
        return (
          <div
            key={i}
            className={`py-0.5 leading-[1.8] text-text [&_mark]:rounded-sm [&_mark]:border-b-2 [&_mark]:border-[rgba(255,210,60,0.6)] [&_mark]:bg-[rgba(255,210,60,0.18)] [&_mark]:px-[1px] [&_mark]:text-[#ffd23c] ${levelClass}`}
            style={{ paddingLeft: indent }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

function AppendixNotice() {
  return (
    <div className="my-2 rounded-lg border border-accent/20 bg-accent/[0.08] px-3.5 py-2.5 text-[13px] text-text-muted">
      📋 本項含複雜附表，請至{' '}
      <a
        href="https://www.nhi.gov.tw/ch/np-2505-1.html"
        target="_blank"
        rel="noopener"
        className="text-accent no-underline hover:underline"
      >
        健保署官方網站
      </a>
      查閱完整規定。請注意本條目正文說明仍具參考價值。
    </div>
  )
}

function Body261() {
  return (
    <div className="my-2 overflow-x-auto">
      <div className="mb-2 text-sm font-bold text-text">全民健康保險降膽固醇藥物給付規定表</div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text"></th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">非藥物治療</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">起始藥物治療血脂值</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">血脂目標值</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">處方規定</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-accent/[0.07]">
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">1. 有急性冠狀動脈症候群病史<br />2. 曾接受心導管介入治療或外科冠動脈搭橋手術之冠狀動脈粥狀硬化患者</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">與藥物治療可並行</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">LDL-C ≥70 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">LDL-C &lt;70 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">第一年應每 3–6 個月抽血檢查一次，第二年以後應至少每 6–12 個月抽血檢查一次，同時請注意副作用之產生如肝功能異常，橫紋肌溶解症。</td>
          </tr>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">心血管疾病或糖尿病患者</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">與藥物治療可並行</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC ≥160 mg/dL 或 LDL-C ≥100 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC &lt;160 mg/dL 或 LDL-C &lt;100 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text"></td>
          </tr>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">2 個危險因子或以上</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">給藥前應有 3–6 個月非藥物治療</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC ≥200 mg/dL 或 LDL-C ≥130 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC &lt;200 mg/dL 或 LDL-C &lt;130 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text"></td>
          </tr>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">1 個危險因子</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">給藥前應有 3–6 個月非藥物治療</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC ≥240 mg/dL 或 LDL-C ≥160 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TC &lt;240 mg/dL 或 LDL-C &lt;160 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text"></td>
          </tr>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">0 個危險因子</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">給藥前應有 3–6 個月非藥物治療</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">LDL-C ≥190 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">LDL-C &lt;190 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text"></td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1.5 rounded-md bg-surface2 px-2.5 py-1.5 text-xs text-text">
        <strong>心血管疾病定義：</strong>
        （一）冠狀動脈粥狀硬化患者包含：心絞痛病人，有心導管證實或缺氧性心電圖變化或負荷性試驗陽性反應者（附檢查報告）
        （二）缺血型腦血管疾病病人包含：腦梗塞、暫時性腦缺血患者（TIA，診斷須由神經科醫師確立）、有症狀之頸動脈狹窄（診斷須由神經科醫師確立）
        <br />
        <strong>危險因子定義（共5項）：</strong>
        1. 高血壓 &nbsp; 2. 男性≥45歲，女性≥55歲或停經者 &nbsp; 3. 有早發性冠心病家族史（男性≤55歲，女性≤65歲） &nbsp; 4. HDL-C &lt;40 mg/dL &nbsp; 5. 吸菸（因吸菸而符合起步治療準則之個案，若未戒菸而要求藥物治療，應以自費治療）
      </div>
      <div className="mt-4 mb-2 text-sm font-bold text-text">全民健康保險降三酸甘油酯藥物給付規定表</div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">病人族群</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">非藥物治療</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">起始條件</th>
            <th className="border border-border bg-surface2 px-2.5 py-2 text-center font-semibold text-text">目標值</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">心血管疾病或糖尿病病人</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">與藥物治療可並行</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG ≥200 mg/dL 且（TC/HDL-C &gt;5 或 HDL-C &lt;40 mg/dL）</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG &lt;200 mg/dL</td>
          </tr>
          <tr>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">無心血管疾病病人</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">給藥前 3–6 個月非藥物治療</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG ≥200 mg/dL 且（TC/HDL-C &gt;5 或 HDL-C &lt;40 mg/dL）</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG &lt;200 mg/dL</td>
          </tr>
          <tr className="bg-accent/[0.07]">
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">無心血管疾病病人（嚴重）</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">與藥物治療可並行</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG ≥500 mg/dL</td>
            <td className="border border-border px-2.5 py-2 align-top leading-[1.5] text-text">TG &lt;500 mg/dL</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-1.5 rounded-md bg-surface2 px-2.5 py-1.5 text-xs text-text">
        追蹤：第一年每 3–6 個月，第二年後至少每 6–12 個月抽血一次
      </div>
    </div>
  )
}

function CopyButton({ drug }: { drug: Drug }) {
  const [copied, setCopied] = useState(false)
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(drug.title + '\n\n' + (drug.content ?? '')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3.5 inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-sans text-[13px] transition-all ${
        copied
          ? 'border-green/30 bg-green/10 text-green'
          : 'border-border bg-surface2 text-text-muted hover:border-accent/40 hover:bg-accent-dim hover:text-accent'
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" strokeWidth={1.8} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}
      <span>{copied ? '已複製' : '複製條文'}</span>
    </button>
  )
}

function SectionItems({
  drug,
  itemsBySection,
}: {
  drug: Drug
  itemsBySection: Map<string, DrugItem[]>
}) {
  if (!drug.title) return null
  const fullSection = getSectionFromTitle(drug.title)
  if (!fullSection) return null

  const tries = [fullSection]
  const parts = fullSection.split('.')
  for (let i = parts.length - 1; i >= 2; i--) {
    tries.push(parts.slice(0, i).join('.'))
  }
  let items: DrugItem[] = []
  let matchedSection = fullSection
  for (const s of tries) {
    if (itemsBySection.has(s)) {
      items = itemsBySection.get(s)!
      matchedSection = s
      break
    }
  }
  if (items.length === 0) return null

  const MAX = 20
  const shown = items.slice(0, MAX)
  const more = items.length - shown.length
  const isSubsection = matchedSection !== fullSection

  return (
    <div className="mt-4 border-t border-border pt-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        📋 本章適用藥品
        <span className="rounded-full bg-surface2 px-1.5 py-[1px] font-mono text-[11px] text-text-muted">
          {items.length} 筆
        </span>
        {isSubsection && (
          <span className="text-[11px] text-text-light">（對應章節 {matchedSection}，本章 + 子章節）</span>
        )}
      </div>
      <div className="max-h-[280px] overflow-y-auto rounded-md border border-border bg-black/[0.18] px-2 py-1.5">
        {shown.map((it, i) => (
          <div
            key={`${it.code}-${i}`}
            className="flex items-center gap-2 border-b border-white/[0.03] border-dashed px-1 py-1 text-xs last:border-b-0"
          >
            <span className="min-w-[96px] flex-shrink-0 font-mono text-text-light">{it.code}</span>
            <span className="flex flex-1 flex-col gap-px">
              <span className="text-text">{it.name_en}</span>
              {it.name_zh && <span className="text-[11px] text-text-muted">{it.name_zh}</span>}
            </span>
            {it.atc && (
              <span className="flex-shrink-0 rounded border border-accent/30 bg-accent/10 px-1.5 font-mono text-[10.5px] text-accent">
                {it.atc}
              </span>
            )}
            {it.section_link && (
              <a
                href={it.section_link}
                target="_blank"
                rel="noopener"
                title="健保署原始連結"
                className="flex-shrink-0 rounded px-1 py-0.5 text-text-muted no-underline hover:bg-accent-dim hover:text-accent"
              >
                ↗
              </a>
            )}
          </div>
        ))}
        {more > 0 && (
          <div className="py-1.5 text-center text-[11px] text-text-light">…還有 {more} 筆未顯示</div>
        )}
      </div>
    </div>
  )
}

function RelatedDrugs({
  drug,
  allDrugs,
  onClick,
}: {
  drug: Drug
  allDrugs: Drug[]
  onClick: (id: Drug['id']) => void
}) {
  const related = useMemo(() => findRelated(drug, allDrugs), [drug, allDrugs])
  if (related.length === 0) return null
  return (
    <div className="mt-4 border-t border-border pt-3.5">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
        <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>相關條目</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {related.map((d) => {
          const sec = getSectionFromTitle(d.title)
          return (
            <button
              key={d.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onClick(d.id)
              }}
              className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-bg2 px-3 py-2 text-left text-sm text-text-muted transition-all hover:border-accent/40 hover:bg-accent-dim hover:text-text"
            >
              {sec && (
                <span className="flex-shrink-0 rounded-md border border-accent/25 bg-accent-dim px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
                  {sec}
                </span>
              )}
              <span className="flex-1 truncate">{stripSection(d.title)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  Footer
// ────────────────────────────────────────────────────────
function DrugsFooter({
  version,
  lastCheck,
}: {
  version: string
  lastCheck: string
}) {
  return (
    <footer className="mx-auto max-w-[860px] px-6 py-7 text-center text-xs leading-[1.8] text-text-light">
      <div className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        <span>
          <span className="text-text-light">健保署資料日期：</span>
          <span className="font-mono text-text-muted">{version}</span>
        </span>
        <span>
          <span className="text-text-light">最後檢查更新（每週一 10:00）：</span>
          <span className="font-mono text-text-muted">{lastCheck}</span>
        </span>
      </div>
      <div>
        資料來源：
        <a
          href="https://www.nhi.gov.tw/ch/cp-13108-67ddf-2508-1.html"
          target="_blank"
          rel="noopener"
          className="text-accent no-underline hover:underline"
        >
          衛生福利部中央健康保險署
        </a>{' '}
        · 本站僅供查詢參考，以健保署官方公告為準
      </div>
      <div className="mt-3">
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1 text-xs leading-snug text-white no-underline transition-all hover:border-text-dim hover:bg-white/5"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.8} />
          回報錯誤 / 提建議
        </a>
      </div>
    </footer>
  )
}
