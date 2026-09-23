import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardPaste, Copy, Eraser, AlertTriangle } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { cn } from '@/lib/utils'
import { parseMedOrders, formatOrder, type MedOrder } from '@/lib/meds-engine'
import { classify, beersFlags, GROUP_ORDER, type DrugGroup } from '@/lib/meds-classify'

export const Route = createFileRoute('/meds')({
  component: MedsPage,
})

interface Row {
  order: MedOrder
  group: DrugGroup
  classes: string[]
  beers: { label: string; reason: string }[]
}

function MedsPage() {
  const [text, setText] = useState('')
  const [useBrand, setUseBrand] = useState(false)
  const [sortByClass, setSortByClass] = useState(true)
  const [copied, setCopied] = useState(false)

  const rows: Row[] = useMemo(() => {
    return parseMedOrders(text).map((order) => {
      const { group, classes } = classify(order.generic)
      return { order, group, classes, beers: beersFlags(order.generic) }
    })
  }, [text])

  // 依藥理分類把同類排在一起，組內維持原處方順序；不顯示分類標題
  const shown = useMemo(() => {
    if (!sortByClass) return rows
    const map = new Map<DrugGroup, Row[]>()
    for (const r of rows) {
      if (!map.has(r.group)) map.set(r.group, [])
      map.get(r.group)!.push(r)
    }
    return GROUP_ORDER.filter((g) => map.has(g)).flatMap((g) => map.get(g)!)
  }, [rows, sortByClass])

  const beersRows = rows.filter((r) => r.beers.length > 0)

  const copyAll = async () => {
    const out = shown.map((r) => formatOrder(r.order, useBrand)).join('\n')
    try {
      await navigator.clipboard.writeText(out)
    } catch {
      // 沒有剪貼簿權限時靜默略過，使用者仍可自行選取
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[1100px] px-6 pt-8 pb-16 max-md:px-4 max-md:pt-5">
        <div className="mb-5">
          <h1 className="text-[22px] font-bold leading-tight text-text">用藥整理</h1>
          <p className="mt-1.5 max-w-[680px] text-[13px] leading-relaxed text-text-muted">
            把 HIS 的藥品醫囑整段貼進來，自動精簡成一行一藥、同類藥物排在一起，並標出高齡潛在不適當用藥。
            貼上的內容只在本機瀏覽器處理，不會送出。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
              <ClipboardPaste className="h-4 w-4 text-accent" strokeWidth={1.8} />
              貼上藥品醫囑
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              placeholder={'從 HIS 複製「藥品醫囑」整段貼上，例如：\n\n[慢性處方箋]\n  [Lipitor 40mg/tab(Atorvastatin)] 0.5 tab QD PO x 28 天 x 3 次 = 14.00 tab .'}
              className="h-[280px] w-full resize-y rounded-lg border border-border bg-bg2 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setText('')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg2 px-3 py-1.5 text-[13px] text-text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                <Eraser className="h-3.5 w-3.5" strokeWidth={1.8} />
                清空
              </button>
              <span className="text-[12.5px] text-text-light">
                {text.trim() ? `解析到 ${rows.length} 筆` : ''}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-text">精簡結果</div>
              <div className="ml-auto flex items-center gap-2">
                <div className="inline-flex overflow-hidden rounded-lg border border-border">
                  {([false, true] as const).map((b) => (
                    <button
                      key={String(b)}
                      type="button"
                      onClick={() => setUseBrand(b)}
                      className={cn(
                        'px-2.5 py-1 text-[12.5px] transition-colors',
                        useBrand === b ? 'bg-accent text-bg font-medium' : 'bg-bg2 text-text-muted hover:text-text',
                      )}
                    >
                      {b ? '商品名' : '學名'}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSortByClass((g) => !g)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1 text-[12.5px] transition-colors',
                    sortByClass ? 'border-accent bg-accent-dim text-accent' : 'border-border bg-bg2 text-text-muted hover:text-text',
                  )}
                >
                  同類排序
                </button>
                <button
                  type="button"
                  onClick={copyAll}
                  disabled={!rows.length}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg2 px-2.5 py-1 text-[12.5px] text-text transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
            </div>

            {!rows.length ? (
              <div className="rounded-lg border border-dashed border-border bg-bg2/40 px-4 py-12 text-center text-[13px] text-text-dim">
                貼上左側內容後，這裡會出現精簡後的用藥清單
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-bg2 px-3.5 py-3 font-mono text-[13px] leading-[1.9] text-text">
                {shown.map((r, i) => (
                  <MedLine key={i} row={r} useBrand={useBrand} />
                ))}
              </div>
            )}
          </div>
        </div>

        {beersRows.length > 0 && (
          <div className="mt-4 rounded-xl border border-yellow/30 bg-yellow/[0.05] p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#e8d8a8]">
              <AlertTriangle className="h-4 w-4 text-yellow" strokeWidth={1.8} />
              高齡潛在不適當用藥（{beersRows.length} 項）
            </div>
            <div className="space-y-1.5">
              {beersRows.map((r, i) => (
                <div key={i} className="text-[13px] leading-relaxed text-[#d8c08a]">
                  <span className="font-mono font-semibold text-text">{r.order.generic}</span>
                  {r.beers.map((b, j) => (
                    <span key={j}>
                      {'\u3000·\u3000'}{b.label}：{b.reason}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-light">
              依 AGS 2023 Beers Criteria 標示，適用 65 歲以上。僅為提醒，不代表一定要停藥——臨床上仍以個別適應症、療效與替代方案評估為準。
            </p>
          </div>
        )}
      </main>
    </>
  )
}

function MedLine({ row, useBrand }: { row: Row; useBrand: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span>{formatOrder(row.order, useBrand)}</span>
      {row.classes.length > 0 && (
        <span className="font-sans text-[11px] text-text-light">{row.classes.join('／')}</span>
      )}
      {row.beers.length > 0 && (
        <span className="font-sans text-[11px] text-yellow" title={row.beers.map((b) => b.reason).join('；')}>
          ⚠ Beers
        </span>
      )}
    </div>
  )
}
