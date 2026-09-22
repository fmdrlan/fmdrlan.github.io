import { Fragment, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  COMPARE_DRUGS,
  COMPARE_ROWS,
  COMPARE_QA,
  COMPARE_CALLOUT,
  COMPARE_NOTES,
  type CompareCell,
  type CompareDrug,
  type CompareMode,
  type DrugSource,
} from '@/lib/osteoporosis-drugs-data'

// Renders the cell/label HTML that was authored with inline markup
// (<b>, <br>, <span class="…">, <div class="alt">, <table class="mini">…).
// Static, clinician-authored content — not user input.
const RICH =
  'text-[12.5px] leading-[1.55] text-text ' +
  '[&_b]:font-semibold [&_b]:text-text ' +
  '[&_.na]:text-text-dim ' +
  '[&_.flag]:mt-1.5 [&_.flag]:inline-block [&_.flag]:rounded [&_.flag]:border [&_.flag]:border-warn/30 [&_.flag]:bg-warn/10 [&_.flag]:px-1.5 [&_.flag]:py-0.5 [&_.flag]:text-[11px] [&_.flag]:text-warn ' +
  '[&_.alt]:mt-1.5 [&_.alt]:border-t [&_.alt]:border-dashed [&_.alt]:border-border [&_.alt]:pt-1.5 ' +
  '[&_.arr]:font-bold [&_.arr.dn]:text-accent [&_.arr.up]:text-orange ' +
  '[&_.num]:font-semibold [&_.num]:tabular-nums ' +
  '[&_table.mini]:mt-1 [&_table.mini]:w-full [&_table.mini]:border-collapse ' +
  '[&_table.mini_th]:py-0.5 [&_table.mini_th]:pr-2 [&_table.mini_th]:text-left [&_table.mini_th]:font-normal [&_table.mini_th]:text-text-muted [&_table.mini_th]:border-b [&_table.mini_th]:border-border ' +
  '[&_table.mini_td]:py-0.5 [&_table.mini_td]:text-center [&_table.mini_td]:border-b [&_table.mini_td]:border-border ' +
  '[&_table.mini_td.y]:font-bold [&_table.mini_td.y]:text-accent ' +
  '[&_table.mini_td.n]:text-text-dim'

function SourceDot({ s }: { s: DrugSource }) {
  return (
    <span
      className={cn(
        'mt-[5px] inline-block h-[7px] w-[7px] shrink-0 rounded-full',
        s === 'ncku' && 'bg-accent',
        s === 'lit' && 'border border-text-muted',
        s === 'todo' && 'border border-dashed border-warn',
      )}
    />
  )
}

function cellParts(cell?: CompareCell): { html: string; s: DrugSource } {
  if (cell === undefined) return { html: '<span class="na">—</span>', s: 'lit' }
  if (typeof cell === 'string') return { html: cell, s: 'lit' }
  return { html: cell.v, s: cell.s }
}

const MODE_BG: Record<CompareMode, string> = {
  anti: 'bg-accent/[0.04]',
  ana: 'bg-orange/[0.05]',
}

function DrugHeaderCell({ d }: { d: CompareDrug }) {
  return (
    <th
      className={cn(
        'w-[172px] min-w-[172px] border-b-2 border-border px-2.5 py-2 text-left align-bottom',
        MODE_BG[d.mode],
      )}
    >
      <span className="block text-[14.5px] font-bold tracking-tight text-text">{d.g}</span>
      <span className="mt-0.5 block text-[13px] text-text-muted">{d.zh}</span>
      <span className="mt-0.5 block text-[12px] italic text-text-dim">{d.b}</span>
      <span className="mt-1.5 inline-block rounded-full border border-border-strong/60 bg-bg2/70 px-2 py-[1px] text-[11px] text-text-muted">
        {d.chip}
      </span>
    </th>
  )
}

interface RowGroup {
  label: string
  rows: Extract<(typeof COMPARE_ROWS)[number], { kind: 'row' }>[]
}

function groupRows(): RowGroup[] {
  const groups: RowGroup[] = []
  let current: RowGroup | null = null
  for (const r of COMPARE_ROWS) {
    if (r.kind === 'group') {
      current = { label: r.label, rows: [] }
      groups.push(current)
    } else if (current) {
      current.rows.push(r)
    }
  }
  return groups
}

const GROUPS = groupRows()

export function DrugCompareTab() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.map((g) => [g.label, true])),
  )
  const toggleGroup = (label: string) => setOpenGroups((p) => ({ ...p, [label]: !p[label] }))

  const openQaCount = useMemo(() => COMPARE_QA.length, [])

  return (
    <div className="mx-auto max-w-[1500px] px-6 pt-6 pb-16 max-md:px-4">
      <header className="mb-4">
        <h1 className="text-[22px] font-bold leading-tight text-text">骨質疏鬆藥物比較表</h1>
        <p className="mt-1.5 max-w-[68ch] text-[13px] leading-relaxed text-text-muted">
          以「抗骨流失」與「促骨生成」分軸，整合成大醫院藥品基本檔與院內警訊。健保給付條件不收錄於本表。
        </p>
        <p className="mt-2 text-[12px] text-text-dim">
          院內資料節錄自成大藥品基本檔{'　·　'}療效數據為各別試驗結果，非頭對頭比較
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] text-text-muted print:hidden">
        <b className="font-semibold text-text">資料來源標示</b>
        <span className="inline-flex items-center gap-1.5">
          <SourceDot s="ncku" /> 成大藥品基本檔／院內警訊
        </span>
        <span className="inline-flex items-center gap-1.5">
          <SourceDot s="lit" /> 仿單、指引或原始比較表
        </span>
        <span className="text-text-dim">左側欄位可點擊收合</span>
      </div>

      <div className="max-h-[80vh] overflow-auto rounded-lg border border-border print:max-h-none print:overflow-visible">
        <table className="w-max min-w-full border-collapse">
          <thead>
            <tr className="sticky top-0 z-20">
              <th className="sticky left-0 z-30 w-[124px] min-w-[124px] border-b border-border bg-bg2" />
              <th
                colSpan={COMPARE_DRUGS.filter((d) => d.mode === 'anti').length}
                className="border-b border-border bg-accent px-3 py-1.5 text-left text-[12px] font-semibold tracking-wide text-white"
              >
                抗骨流失（antiresorptive）
              </th>
              <th
                colSpan={COMPARE_DRUGS.filter((d) => d.mode === 'ana').length}
                className="border-b border-border bg-orange px-3 py-1.5 text-left text-[12px] font-semibold tracking-wide text-white"
              >
                促骨生成（anabolic）
              </th>
            </tr>
            <tr className="sticky top-[30px] z-20 bg-bg2">
              <th className="sticky left-0 z-30 w-[124px] min-w-[124px] border-b-2 border-border bg-bg2 px-2.5 py-2 text-left text-[12.5px] font-semibold text-text-muted">
                項目
              </th>
              {COMPARE_DRUGS.map((d) => (
                <DrugHeaderCell key={d.id} d={d} />
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => {
              const open = openGroups[g.label]
              const rows = g.rows
              return (
                <Fragment key={g.label}>
                  <tr
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={() => toggleGroup(g.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleGroup(g.label)
                      }
                    }}
                    className="cursor-pointer bg-surface"
                  >
                    <th
                      colSpan={COMPARE_DRUGS.length + 1}
                      className="sticky left-0 z-10 border-y border-border bg-surface px-3 py-1.5 text-left text-[13px] font-bold text-text"
                    >
                      <span className="mr-1.5 inline-block w-3.5 text-text-muted">{open ? '▾' : '▸'}</span>
                      {g.label}
                    </th>
                  </tr>
                  {open &&
                    rows.map((row) => (
                      <tr key={row.label} data-key={row.key ? '1' : '0'} className="hover:bg-surface/60">
                        <th
                          className="sticky left-0 z-10 w-[124px] min-w-[124px] border-b border-border/60 bg-bg2 px-2.5 py-1.5 align-top text-[12.5px] leading-snug font-semibold text-text-muted"
                          dangerouslySetInnerHTML={{ __html: row.label }}
                        />
                        {COMPARE_DRUGS.map((d) => {
                          const { html, s } = cellParts(row.cells[d.id])
                          return (
                            <td
                              key={d.id}
                              className={cn('w-[172px] min-w-[172px] border-b border-border/60 px-2.5 py-1.5 align-top', MODE_BG[d.mode])}
                            >
                              <div className="flex gap-1.5">
                                <SourceDot s={s} />
                                <div className={cn(RICH, s === 'todo' && 'text-warn')} dangerouslySetInnerHTML={{ __html: html }} />
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="mx-auto mt-8 max-w-[76ch] text-[13px] leading-relaxed text-text-muted">
        <div className="rounded-lg border border-warn/30 bg-warn/[0.06] px-4 py-3.5 text-[#e8a99e]">
          <b className="mb-1 block text-text">{COMPARE_CALLOUT.title}</b>
          {COMPARE_CALLOUT.body}
        </div>

        <section className="mt-8">
          <h2 className="mb-1 text-center text-[16px] font-semibold text-text">常見問題</h2>
          <p className="mb-3.5 text-center text-[13px] text-text-dim">
            門診最常被問到、以及最常被誤解的幾題（共 {openQaCount} 題）。
          </p>
          <div className="space-y-2">
            {COMPARE_QA.map((qa) => (
              <details key={qa.q} className="rounded-lg border border-border bg-surface open:pb-1">
                <summary className="flex cursor-pointer list-none items-start gap-2 px-3.5 py-2.5 text-[14px] font-semibold text-text marker:content-none">
                  <span className="mt-0.5 text-text-dim">＋</span>
                  <span className="flex-1">{qa.q}</span>
                  {qa.tag && (
                    <span
                      className={cn(
                        'ml-auto shrink-0 rounded-full border px-2 py-[1px] text-[11px] font-normal',
                        qa.tag === '高風險'
                          ? 'border-warn/40 bg-warn/10 text-warn'
                          : 'border-border bg-bg2 text-text-muted',
                      )}
                    >
                      {qa.tag}
                    </span>
                  )}
                </summary>
                <div className="space-y-2 px-3.5 pt-1 pb-3 pl-9 text-[13.5px] leading-relaxed text-text-muted">
                  {qa.body.map((p, i) => (
                    <p key={i} className="[&_b]:font-semibold [&_b]:text-text" dangerouslySetInnerHTML={{ __html: p }} />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <h2 className="mt-8 mb-2.5 text-center text-[15px] font-semibold text-text">使用說明</h2>
        <ol className="list-decimal space-y-1.5 rounded-lg border border-border bg-surface px-5 py-4 pl-9 [&_b]:font-semibold [&_b]:text-text [&_code]:rounded [&_code]:bg-bg2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px]">
          {COMPARE_NOTES.map((note, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: note }} />
          ))}
        </ol>
      </footer>
    </div>
  )
}
