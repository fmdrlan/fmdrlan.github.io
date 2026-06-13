import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown, Copy } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import {
  initLabEngine,
  parseLIS,
  integrateTimeline,
  applyDiagnosisRules,
  lookupFreeTextIcd,
  formatFreeTextDx,
  fmtDate,
  fmtYearMonth,
  labGroupName,
  displayValue,
  PATHOLOGY_TO_PROCEDURE,
  type Demographics,
  type LabDict,
  type DxRules,
  type Sex,
} from '@/lib/lab-engine'

export const Route = createFileRoute('/lab')({
  component: LabPage,
})

interface ParsedState {
  demographics: Demographics
  sex: Sex
  results: any[]
  integrated: any[]
  skipped: any[]
  dx: any[]
  freeTextDx: any[]
  freeTextDxRaw: any[]
  unknown: any[]
  totalParsed: number
}

function LabPage() {
  const [engineReady, setEngineReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [parsed, setParsed] = useState<ParsedState | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  // ── Load dictionary + rules, init engine ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [dictR, rulesR] = await Promise.all([
          fetch('/data/lab_dict.json'),
          fetch('/data/dx_rules.json'),
        ])
        if (!dictR.ok) throw new Error(`lab_dict.json: ${dictR.status}`)
        if (!rulesR.ok) throw new Error(`dx_rules.json: ${rulesR.status}`)
        const dict: LabDict = await dictR.json()
        const rules: DxRules = await rulesR.json()
        if (cancelled) return
        initLabEngine(dict, rules)
        setEngineReady(true)
      } catch (e: any) {
        if (!cancelled) setLoadError(e?.message ?? String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }

  const runParse = () => {
    if (!engineReady) return
    if (!input.trim()) {
      showToast('請先貼上 LIS 報告')
      return
    }
    const { results, skipped, demographics, freeTextDx, freeTextDxRaw, unknown } = parseLIS(input)
    const sex: Sex = demographics.sex || 'M'
    const integrated = integrateTimeline(results, sex)
    const dx = applyDiagnosisRules(integrated)
    setParsed({
      demographics,
      sex,
      results,
      integrated,
      skipped,
      dx,
      freeTextDx: freeTextDx || [],
      freeTextDxRaw: freeTextDxRaw || [],
      unknown: unknown || [],
      totalParsed: results.length,
    })
  }

  const clearAll = () => {
    setInput('')
    setParsed(null)
    setCollapsed(false)
  }

  // ── Scroll result into view after a parse ──
  useEffect(() => {
    if (!parsed) return
    const t = setTimeout(() => {
      const el = resultRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const targetTop = window.scrollY + rect.top
      window.scrollTo({ top: targetTop - window.innerHeight * 0.18, behavior: 'smooth' })
    }, 60)
    return () => clearTimeout(t)
  }, [parsed])

  const hasIdentifiableResult =
    parsed && (parsed.totalParsed > 0 || parsed.skipped.length > 0)
  const unrecognized = parsed && parsed.totalParsed === 0 && parsed.skipped.length === 0

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[980px] px-6 py-8 max-md:px-3 max-md:py-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">檢驗報告解讀</h1>
          <p className="mt-1.5 max-w-[680px] text-[13px] leading-relaxed text-text-muted">
            從成大醫院 LIS 複製檢驗結果（可多份不同日期一起貼）。系統會自動辨識項目、跨日整合「最近一次異常」，並產生可直接複製的 Objective 與 Diagnosis 段落。
          </p>
        </div>

        {/* ── Input panel ── */}
        <section className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => parsed && setCollapsed((c) => !c)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-text"
          >
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-text-light transition-transform ${
                collapsed ? '-rotate-90' : ''
              }`}
              strokeWidth={1.8}
            />
            輸入
            {collapsed && parsed && (
              <span className="font-normal text-text-light">
                · 已解析 {parsed.totalParsed} 項　[點此展開重編]
              </span>
            )}
          </button>

          {!collapsed && (
            <div className="border-t border-border px-4 pb-4 pt-3.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    runParse()
                  }
                }}
                spellCheck={false}
                autoComplete="off"
                placeholder={
                  '從成大醫院 LIS Ctrl + A 全選 → 複製 貼上\n\n貼上的內容僅在本機瀏覽器處理，不會上傳到任何伺服器'
                }
                className="h-56 w-full resize-y rounded-lg border border-border bg-bg2 px-3.5 py-3 font-mono text-[13px] leading-relaxed text-text placeholder:text-text-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={runParse}
                  disabled={!engineReady}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {engineReady ? '解析' : '載入中…'}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-border bg-surface2 px-4 py-2 text-sm text-text-muted transition-colors hover:border-border-strong hover:text-text"
                >
                  清除
                </button>
              </div>
            </div>
          )}
        </section>

        {loadError && (
          <div className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            ⚠️ 載入字典失敗：{loadError}
          </div>
        )}

        {/* ── Results ── */}
        <div ref={resultRef}>
          {unrecognized ? (
            <div className="px-5 py-12 text-center text-text-muted">
              <div className="mb-3 text-[44px]">😕</div>
              無法辨識任何檢驗項目。
              <br />
              請確認貼上的是完整的成大 LIS 報告內容。
            </div>
          ) : hasIdentifiableResult ? (
            <>
              <PatientInfo d={parsed!.demographics} />
              <WarningBanner parsed={parsed!} />
              <div className="grid gap-4 md:grid-cols-2">
                <ObjectivePanel parsed={parsed!} onToast={showToast} />
                <DiagnosisPanel parsed={parsed!} onToast={showToast} />
              </div>
            </>
          ) : (
            !parsed && (
              <div className="px-5 py-12 text-center text-text-muted">
                <div className="mb-3 text-[44px]">🧪</div>
                貼上檢驗結果後按「解析」
              </div>
            )
          )}
        </div>

        <div className="mt-8 text-center text-xs leading-[1.8] text-text-light">
          參考範圍以成大檢驗報告公告值為準。
          <br />
          本工具僅作個人臨床備忘，不取代臨床判斷。
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-surface2 px-4 py-2.5 text-sm text-text shadow-lg ring-1 ring-border">
          {toast}
        </div>
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────
//  Patient info
// ────────────────────────────────────────────────────────
function PatientInfo({ d }: { d: Demographics }) {
  if (!(d.name || d.chartNo || d.age != null || d.sex)) return null
  const sexLabel = d.sex === 'M' ? '男' : d.sex === 'F' ? '女' : '—'
  const ageLabel = d.age != null ? `${d.age} 歲` : '—'
  return (
    <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1.5 rounded-lg border border-border bg-bg2 px-4 py-2.5 text-sm">
      {d.name && <Field label="姓名" value={d.name} />}
      {d.chartNo && <Field label="病歷號" value={d.chartNo} mono />}
      <Field label="性別" value={sexLabel} />
      <Field label="年齡" value={ageLabel} />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-text-light">{label}</span>
      <span className={mono ? 'font-mono text-text' : 'text-text'}>{value}</span>
    </span>
  )
}

// ────────────────────────────────────────────────────────
//  Warning banner (abnormal but not auto-diagnosed)
// ────────────────────────────────────────────────────────
function WarningBanner({ parsed }: { parsed: ParsedState }) {
  const { unassignedUnique } = useMemo(() => {
    const usedKeysInDx = new Set<string>()
    parsed.dx.forEach((dx) => dx.evidence.forEach((ev: any) => usedKeysInDx.add(ev.key)))
    const unassignedAbnormal = parsed.integrated.filter((item) => {
      const flag = item.flag
      const isAbn = flag === 'H' || flag === 'HH' || flag === 'L' || flag === 'LL'
      if (!isAbn) return false
      if (usedKeysInDx.has(item.key)) return false
      if (item.def && item.def.is_qual && (item.qual || '').toLowerCase().includes('non-reactive')) return false
      return true
    })
    const seen = new Set<string>()
    const unassignedUnique = unassignedAbnormal.filter((item) => {
      if (seen.has(item.key)) return false
      seen.add(item.key)
      return true
    })
    return { unassignedUnique }
  }, [parsed])

  const hasUnassigned = unassignedUnique.length > 0 || parsed.unknown.length > 0
  if (!hasUnassigned) return null
  const total = unassignedUnique.length + parsed.unknown.length

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-yellow/30 bg-yellow/[0.08] px-4 py-2.5 text-[13px]">
      <span className="font-semibold text-yellow">⚠ 共 {total} 項請醫師確認</span>
      {unassignedUnique.length > 0 && (
        <ChipGroup label="Objective 已列、未自動診斷">
          {unassignedUnique.map((item) => (
            <Chip key={item.key}>{item.key}</Chip>
          ))}
        </ChipGroup>
      )}
      {parsed.unknown.length > 0 && (
        <ChipGroup label="未列出（字典未收錄）">
          {parsed.unknown.map((item) => (
            <Chip key={item.key} title={`原始值：${item.valueCell || ''}`} unknown>
              {item.key}
            </Chip>
          ))}
        </ChipGroup>
      )}
    </div>
  )
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-text-muted">{label}</span>
      {children}
    </span>
  )
}

function Chip({
  children,
  title,
  unknown,
}: {
  children: React.ReactNode
  title?: string
  unknown?: boolean
}) {
  return (
    <span
      title={title}
      className={`rounded-md border px-1.5 py-px font-mono text-[11px] ${
        unknown
          ? 'border-warn/30 bg-warn/10 text-warn'
          : 'border-border bg-surface2 text-text-muted'
      }`}
    >
      {children}
    </span>
  )
}

// ────────────────────────────────────────────────────────
//  Objective panel
// ────────────────────────────────────────────────────────
function flagBadgeClass(flag: string): string {
  if (flag === 'HH' || flag === 'LL') return 'bg-warn/15 text-warn'
  if (flag === 'H') return 'bg-orange/15 text-orange'
  if (flag === 'L') return 'bg-accent/15 text-accent'
  return 'bg-surface2 text-text-muted'
}

function valueClass(flag: string): string {
  if (flag === 'H' || flag === 'HH') return 'text-orange'
  if (flag === 'L' || flag === 'LL') return 'text-accent'
  return 'text-text'
}

function ObjectivePanel({ parsed, onToast }: { parsed: ParsedState; onToast: (m: string) => void }) {
  const labGroups = useMemo(() => groupLab(parsed.integrated), [parsed.integrated])
  const ftGroups = useMemo(() => groupFreeText(parsed.freeTextDxRaw), [parsed.freeTextDxRaw])
  const totalObjCount = parsed.integrated.length + parsed.freeTextDxRaw.length

  return (
    <Panel title="Objective">
      {totalObjCount > 0 && (
        <CopyBar>
          <SmallBtn onClick={() => onToast(copyObjective(parsed, 'current'))}>僅現異常</SmallBtn>
          <SmallBtn primary onClick={() => onToast(copyObjective(parsed, 'all'))}>
            全部複製
          </SmallBtn>
        </CopyBar>
      )}

      {totalObjCount === 0 ? (
        parsed.totalParsed > 0 && (
          <div className="px-4 py-5 text-center text-sm text-green">✓ 所有解析項目均在正常範圍</div>
        )
      ) : (
        <div className="max-h-[560px] overflow-y-auto px-3 py-2">
          {labGroups.map((grp) => (
            <div key={`${grp.date}|${grp.group}`} className="mb-3">
              <GroupHeader date={fmtDate(grp.date)} tag={grp.group} />
              {grp.items.map((item, i) => {
                const value = displayValue(item)
                const unit = item.def && item.def.unit ? ` ${item.def.unit}` : ''
                return (
                  <div
                    key={`${item.key}-${i}`}
                    className="flex items-center gap-2 border-b border-white/[0.03] py-1 text-[13px] last:border-b-0"
                  >
                    <span className="min-w-[88px] flex-shrink-0 text-text">{item.key}</span>
                    <span className={`flex-1 ${valueClass(item.flag)}`}>
                      {value}
                      {unit}
                    </span>
                    <span
                      className={`rounded px-1.5 py-px text-[11px] font-semibold ${flagBadgeClass(
                        item.flag
                      )}`}
                    >
                      {item.flag === 'HH' ? 'H!' : item.flag === 'LL' ? 'L!' : item.flag}
                    </span>
                    {item.pastAbnormal && (
                      <span className="flex-shrink-0 text-[11px] text-yellow/80">
                        ⚠ 曾異常 {displayValue(item.pastAbnormal)} ({fmtDate(item.pastAbnormal.sampledAt)})
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}

          {ftGroups.map((grp) => (
            <div key={`ft|${grp.date}|${grp.short}`} className="mb-3">
              <GroupHeader date={fmtYearMonth(grp.date)} tag={grp.short} />
              {grp.items.map((dx, i) => (
                <div key={i} className="border-b border-white/[0.03] py-1 text-[13px] text-text last:border-b-0">
                  {dx.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

// ────────────────────────────────────────────────────────
//  Diagnosis panel
// ────────────────────────────────────────────────────────
function DiagnosisPanel({ parsed, onToast }: { parsed: ParsedState; onToast: (m: string) => void }) {
  const totalDxCount = parsed.dx.length + parsed.freeTextDx.length

  return (
    <Panel title="Diagnosis">
      {totalDxCount > 0 && (
        <CopyBar>
          <SmallBtn onClick={() => onToast(copyDiagnosis(parsed, 'current'))}>僅現異常</SmallBtn>
          <SmallBtn primary onClick={() => onToast(copyDiagnosis(parsed, 'all'))}>
            全部複製
          </SmallBtn>
        </CopyBar>
      )}

      {totalDxCount === 0 ? (
        parsed.integrated.length > 0 && (
          <div className="px-4 py-5 text-center text-sm text-text-muted">異常項目未觸發任何預設診斷規則</div>
        )
      ) : (
        <div className="max-h-[560px] overflow-y-auto px-3 py-2">
          {parsed.dx.map((dx, i) => (
            <DxRow key={`v${i}`} idx={i + 1}>
              <span className="text-text">
                {dx.rule.name}
                {dx.rule.icd10 && <IcdTag icd={dx.rule.icd10} desc={dx.rule.icd10_desc} />}
              </span>
              <DxEvidence>
                <div className="mb-1 text-[11px] text-text-light">佐證數值（不複製）</div>
                {dx.evidence.map((ev: any, j: number) => {
                  const isPast = parsed.integrated.find(
                    (it) => it.key === ev.key && it.pastAbnormal === ev
                  )
                  return (
                    <div key={j} className="text-[12px] text-text-muted">
                      <span className="text-text-light">{fmtDate(ev.sampledAt)}</span>{' '}
                      {isPast && <span className="text-yellow/80">曾異常 </span>}
                      <span className="text-text">{ev.key}:</span>{' '}
                      <span className={ev.flag === 'L' || ev.flag === 'LL' ? 'text-accent' : 'text-orange'}>
                        {displayValue(ev)}
                      </span>
                    </div>
                  )
                })}
              </DxEvidence>
            </DxRow>
          ))}

          {parsed.freeTextDx.map((dx, i) => {
            const icdInfo = lookupFreeTextIcd(dx.text)
            const sortedSources = [...dx.sources].sort((a, b) =>
              (b.date || '').localeCompare(a.date || '')
            )
            const tagSources = sortedSources.filter((s) => !(s.short in PATHOLOGY_TO_PROCEDURE))
            const seen = new Set<string>()
            const uniqueTagSources = tagSources.filter((s) => {
              const k = `${fmtYearMonth(s.date)}|${s.short}`
              if (seen.has(k)) return false
              seen.add(k)
              return true
            })
            const tag = uniqueTagSources.map((s) => `${fmtYearMonth(s.date)} ${s.short}`).join(' / ')
            const showOcc = dx.occurrences && dx.occurrences.length > 1
            return (
              <DxRow key={`f${i}`} idx={parsed.dx.length + i + 1}>
                <span className="text-text">
                  {dx.text}
                  {icdInfo && <IcdTag icd={icdInfo.icd10} desc={icdInfo.icd10_desc} />}
                  {showOcc && (
                    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
                      {dx.occurrences.map((o: any, k: number) => (
                        <span
                          key={k}
                          className="rounded bg-surface2 px-1.5 py-px font-mono text-[10.5px] text-text-muted"
                        >
                          {fmtYearMonth(o.date)}
                          {o.severity ? ` ${o.severity}` : ''}
                        </span>
                      ))}
                    </span>
                  )}
                  {!showOcc && tag && <span className="ml-1 text-[12px] text-text-light">({tag})</span>}
                </span>
                <DxEvidence>
                  <div className="mb-1 text-[11px] text-text-light">來源詳情（不複製）</div>
                  {sortedSources.map((s, j) => (
                    <div key={j} className="text-[12px] text-text-muted">
                      <span className="text-text-light">{fmtYearMonth(s.date)}</span> {s.label}
                    </div>
                  ))}
                </DxEvidence>
              </DxRow>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

// ────────────────────────────────────────────────────────
//  Shared layout pieces
// ────────────────────────────────────────────────────────
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-text">{title}</div>
      {children}
    </section>
  )
}

function CopyBar({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 border-b border-border px-3 py-2">{children}</div>
}

function SmallBtn({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
        primary
          ? 'bg-accent text-bg hover:bg-accent/90'
          : 'border border-border bg-surface2 text-text-muted hover:border-accent/40 hover:text-accent'
      }`}
    >
      {primary && <Copy className="h-3 w-3" strokeWidth={1.8} />}
      {children}
    </button>
  )
}

function GroupHeader({ date, tag }: { date: string; tag: string }) {
  return (
    <div className="mb-1 flex items-center gap-2 border-b border-border pb-1">
      <span className="text-xs font-semibold text-accent">{date}</span>
      <span className="rounded bg-surface2 px-1.5 py-px text-[11px] text-text-muted">{tag}</span>
    </div>
  )
}

function DxRow({ idx, children }: { idx: number; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children : [children]
  return (
    <div className="border-b border-white/[0.03] py-2 last:border-b-0">
      <div className="flex gap-2 text-[13px]">
        <span className="flex-shrink-0 font-mono text-text-light">{idx}.</span>
        <div className="min-w-0 flex-1">{arr[0]}</div>
      </div>
      {arr[1]}
    </div>
  )
}

function DxEvidence({ children }: { children: React.ReactNode }) {
  return <div className="mt-1.5 rounded-md bg-bg2 px-2.5 py-1.5">{children}</div>
}

function IcdTag({ icd, desc }: { icd: string; desc?: string }) {
  return (
    <span
      title={desc || ''}
      className="ml-1.5 rounded border border-accent/30 bg-accent/10 px-1.5 py-px font-mono text-[10.5px] text-accent"
    >
      {icd}
    </span>
  )
}

// ────────────────────────────────────────────────────────
//  Grouping + copy helpers
// ────────────────────────────────────────────────────────
interface LabGroup {
  date: string
  group: string
  items: any[]
}
function groupLab(integrated: any[]): LabGroup[] {
  const map = new Map<string, LabGroup>()
  for (const item of integrated) {
    const dateKey = (item.sampledAt || '').slice(0, 10)
    const group = labGroupName(item.sourceType)
    const key = `${dateKey}|${group}`
    if (!map.has(key)) map.set(key, { date: dateKey, group, items: [] })
    map.get(key)!.items.push(item)
  }
  return [...map.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

interface FtGroup {
  date: string
  short: string
  items: any[]
}
function groupFreeText(raw: any[]): FtGroup[] {
  const map = new Map<string, FtGroup>()
  for (const dx of raw) {
    const sourcesSorted = [...dx.sources].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const primary = sourcesSorted[0]
    const dateKey = (primary.date || '').slice(0, 7)
    const short = primary.short || 'Other'
    const key = `${dateKey}|${short}`
    if (!map.has(key)) map.set(key, { date: dateKey, short, items: [] })
    map.get(key)!.items.push(dx)
  }
  return [...map.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

function copyObjective(parsed: ParsedState, mode: 'all' | 'current'): string {
  const lines: string[] = []
  const currentOnly = mode === 'current'

  if (parsed.integrated.length > 0) {
    const filtered = currentOnly
      ? parsed.integrated.filter((it) => ['H', 'HH', 'L', 'LL'].includes(it.flag))
      : parsed.integrated
    if (filtered.length > 0) {
      for (const grp of groupLab(filtered)) {
        lines.push(`${fmtDate(grp.date)} ${grp.group}:`)
        for (const item of grp.items) {
          const value = displayValue(item)
          const unit = (item.def && item.def.unit) || ''
          const flag =
            item.flag === 'H' || item.flag === 'HH'
              ? ' (H)'
              : item.flag === 'L' || item.flag === 'LL'
                ? ' (L)'
                : ''
          let line = `  ${item.key}: ${value}${unit ? ' ' + unit : ''}${flag}`
          if (item.pastAbnormal && !currentOnly) {
            line += ` (past: ${displayValue(item.pastAbnormal)} ${fmtDate(item.pastAbnormal.sampledAt)})`
          }
          lines.push(line)
        }
        lines.push('')
      }
    }
  }

  if (parsed.freeTextDxRaw.length > 0) {
    for (const grp of groupFreeText(parsed.freeTextDxRaw)) {
      lines.push(`${fmtYearMonth(grp.date)} ${grp.short}:`)
      for (const d of grp.items) lines.push(`  ${d.text}`)
      lines.push('')
    }
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  navigator.clipboard.writeText(lines.join('\n'))
  return currentOnly ? '已複製 Objective（僅現異常）' : '已複製 Objective'
}

function copyDiagnosis(parsed: ParsedState, mode: 'all' | 'current'): string {
  const lines: string[] = []
  let idx = 1
  parsed.dx.forEach((d) => {
    lines.push(`${idx}. ${d.rule.name}`)
    idx++
  })
  parsed.freeTextDx.forEach((d) => {
    lines.push(`${idx}. ${formatFreeTextDx(d)}`)
    idx++
  })
  navigator.clipboard.writeText(lines.join('\n'))
  const label = mode === 'current' ? '已複製 Diagnosis（僅現異常）' : '已複製 Diagnosis'
  return `${label}（${lines.length} 條）`
}
