import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare, CircleCheck } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import {
  TIME_COLS,
  PED_VACCINES,
  ADULT_VACCINES,
  SPECIAL_POPULATIONS,
  type PedVaccine,
  type AdultVaccine,
  type SpecialPopulation,
  type SpVaccineEntry,
} from '@/data/vaccine-data'

export const Route = createFileRoute('/vaccine')({
  component: VaccinePage,
})

const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfNUXEtUPxavNh_ga1khBQr0VOcY0ZYVmkMK3Ux3CNxznPUSg/viewform'

function VaccinePage() {
  const [mode, setMode] = useState<'peds' | 'adult'>('peds')

  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-[1200px] px-6 py-6 max-md:px-3 max-md:py-4">
        <div className="mb-5 flex items-start gap-3">
          <span className="text-2xl">💉</span>
          <div>
            <h1 className="mb-1 text-[22px] font-bold text-text">疫苗查詢</h1>
            <p className="text-[13px] text-text-muted">
              查詢小兒（0–18 歲）與成人疫苗接種建議。輸入出生日期，系統會列出該年齡層應接種、未接種的疫苗。
            </p>
          </div>
        </div>

        <ModeButtons mode={mode} onChange={setMode} />

        {mode === 'peds' ? <PedsSection /> : <AdultSection />}
      </div>

      <FeedbackFooter />
    </>
  )
}

// ────────────────────────────────────────────────────────
//  Mode switch (peds / adult)
// ────────────────────────────────────────────────────────
function ModeButtons({
  mode,
  onChange,
}: {
  mode: 'peds' | 'adult'
  onChange: (m: 'peds' | 'adult') => void
}) {
  const base =
    'rounded-lg border px-5 py-2 text-sm font-medium transition-colors'
  const inactive =
    'border-border bg-surface text-text-muted hover:border-border-strong hover:text-text'
  const active = 'border-accent bg-accent-dim text-accent'

  return (
    <div className="mb-7 flex gap-2">
      <button
        type="button"
        onClick={() => onChange('peds')}
        className={`${base} ${mode === 'peds' ? active : inactive}`}
      >
        👶 小兒（0–18歲）
      </button>
      <button
        type="button"
        onClick={() => onChange('adult')}
        className={`${base} ${mode === 'adult' ? active : inactive}`}
      >
        🧑 成人（18歲以上）
      </button>
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  Pediatric section
// ────────────────────────────────────────────────────────
function getAgeMonths(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  const y = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  return y * 12 + m + (today.getDate() >= birth.getDate() ? 0 : -1)
}

function formatAge(months: number): string {
  if (months < 0) return '未出生'
  if (months < 1) return '新生兒'
  if (months < 24) return months + ' 個月'
  const y = Math.floor(months / 12)
  const m = months % 12
  return m > 0 ? `${y} 歲 ${m} 個月` : `${y} 歲`
}

function PedsSection() {
  const [dob, setDob] = useState('')

  const ageMonths = useMemo(
    () => (dob ? getAgeMonths(dob) : null),
    [dob]
  )

  const nowColIdx = useMemo(() => {
    if (ageMonths === null) return -1
    let idx = -1
    TIME_COLS.forEach((c, i) => {
      if (c.months <= ageMonths) idx = i
    })
    return idx
  }, [ageMonths])

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-4">
        <span className="whitespace-nowrap text-sm text-text-muted">出生日期</span>
        <Input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="!w-auto !rounded-lg !border-border !bg-surface !px-3.5 !py-2 !text-[15px] !text-text focus-visible:!border-accent focus-visible:!ring-accent/15"
        />
        <div className="rounded-lg border border-border bg-surface px-4 py-2 font-mono text-sm font-semibold text-accent">
          {ageMonths === null ? '—' : `今日月齡：${formatAge(ageMonths)}`}
        </div>
      </div>

      <Legend />

      <div className="overflow-x-auto pb-3">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 overflow-hidden rounded-[10px] border border-border">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[160px] min-w-[140px] bg-surface px-3 py-2.5 text-left align-middle text-xs font-semibold text-text-muted">
                疫苗
              </th>
              {TIME_COLS.map((col, i) => (
                <th
                  key={i}
                  className={`min-w-[54px] px-1 py-2 text-center text-[11px] font-semibold ${
                    i === nowColIdx ? 'bg-accent/8 text-accent' : 'bg-surface text-text-muted'
                  }`}
                >
                  {col.label.split('\n').map((line, idx, arr) => (
                    <span key={idx}>
                      {line}
                      {idx < arr.length - 1 && <br />}
                    </span>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TimelineBody nowColIdx={nowColIdx} ageMonths={ageMonths} />
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs leading-[1.8] text-yellow">
        ※ 流感疫苗每年公費政策可能變動，自 114/1/1 起公費已擴大至全民（6 個月以上未接種者，至疫苗用罄止）；6 個月–8 歲初次接種者須打 2 劑（間隔 4 週以上），9 歲以上 1 劑即可。
      </div>
    </div>
  )
}

function Legend() {
  const items = [
    { color: 'bg-green', label: '公費疫苗' },
    { color: 'bg-orange', label: '自費疫苗' },
    { color: 'bg-accent animate-pulse-green', label: '現在應打（高亮閃爍）' },
    { color: 'bg-border-strong', label: '已到期' },
    { color: 'bg-surface2 border border-border', label: '尚未到期' },
  ]
  return (
    <div className="mb-5 flex flex-wrap gap-4">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-[7px] text-[13px] text-text-muted">
          <div className={`h-3 w-3 rounded-full ${it.color}`} />
          {it.label}
        </div>
      ))}
    </div>
  )
}

function TimelineBody({
  nowColIdx,
  ageMonths,
}: {
  nowColIdx: number
  ageMonths: number | null
}) {
  let lastSection = ''
  const rows: React.ReactNode[] = []

  PED_VACCINES.forEach((vax, vIdx) => {
    if (vax.section && vax.section !== lastSection) {
      lastSection = vax.section
      rows.push(
        <tr key={`section-${vIdx}`}>
          <td
            colSpan={TIME_COLS.length + 1}
            className="bg-surface2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted"
          >
            {vax.section}
          </td>
        </tr>
      )
    }
    rows.push(<VaccineRow key={vIdx} vax={vax} nowColIdx={nowColIdx} ageMonths={ageMonths} />)
  })

  return <>{rows}</>
}

function VaccineRow({
  vax,
  nowColIdx,
  ageMonths,
}: {
  vax: PedVaccine
  nowColIdx: number
  ageMonths: number | null
}) {
  return (
    <tr>
      <td className="sticky left-0 z-[5] !border-r border-border-strong bg-bg2 px-3 py-2.5 align-middle text-[13px] font-medium leading-tight">
        <span className="block">
          {vax.name.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
        <span
          className={`mt-[3px] inline-block rounded border px-1.5 py-[1px] text-[10px] font-semibold tracking-wide ${
            vax.type === 'pub'
              ? 'border-green/35 bg-green/12 text-green'
              : 'border-orange/35 bg-orange/12 text-orange'
          }`}
        >
          {vax.type === 'pub' ? '公費' : '自費'}
        </span>
      </td>
      {TIME_COLS.map((col, colIdx) => {
        const dose = vax.doses.find((d) => d.months === col.months)
        const isNowCol = colIdx === nowColIdx
        const isColPast = ageMonths !== null && col.months <= ageMonths

        let dotClass = ''
        if (dose) {
          if (ageMonths === null) {
            dotClass = 'bg-surface2 text-text-light border border-border'
          } else if (isNowCol) {
            dotClass =
              vax.type === 'pub'
                ? 'bg-green text-white animate-pulse-green'
                : 'bg-orange text-white animate-pulse-orange'
          } else if (isColPast) {
            dotClass =
              vax.type === 'pub'
                ? 'bg-green text-white shadow-[0_0_8px_rgba(63,185,80,0.4)]'
                : 'bg-orange text-white shadow-[0_0_8px_rgba(240,136,62,0.4)]'
          } else {
            dotClass = 'bg-surface2 text-text-light border border-border'
          }
        }

        return (
          <td
            key={colIdx}
            className={`min-w-[54px] px-[3px] py-1.5 text-center align-middle ${
              isNowCol ? 'bg-accent/[0.04]' : ''
            }`}
          >
            {dose ? (
              <Tooltip>
                <TooltipTrigger
                  className={`inline-flex h-[30px] w-[30px] cursor-default items-center justify-center rounded-full font-mono text-[11px] font-bold transition-transform hover:scale-[1.15] ${dotClass}`}
                >
                  {dose.label}
                </TooltipTrigger>
                <TooltipContent>{dose.tip}</TooltipContent>
              </Tooltip>
            ) : null}
          </td>
        )
      })}
    </tr>
  )
}

// ────────────────────────────────────────────────────────
//  Adult section
// ────────────────────────────────────────────────────────
function AdultSection() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ADULT_VACCINES
    return ADULT_VACCINES.filter(
      (v) =>
        v.name.toLowerCase().includes(q) || v.en.toLowerCase().includes(q)
    )
  }, [query])

  const selected = ADULT_VACCINES.find((v) => v.id === selectedId) ?? null

  return (
    <div>
      <div className="mb-3">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 搜尋疫苗名稱..."
          className="!w-full !max-w-[400px] !rounded-lg !border-border !bg-surface !px-3.5 !py-2 !text-[15px] !text-text focus-visible:!border-accent focus-visible:!ring-accent/15"
        />
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-5 max-md:grid-cols-1">
        <div className="overflow-hidden rounded-[10px] border border-border bg-bg2">
          <div className="border-b border-border px-4 py-3 text-[13px] font-bold uppercase tracking-wider text-text-muted">
            自費疫苗清單
          </div>
          {filtered.length === 0 ? (
            <div className="p-4 text-[13px] text-text-light">找不到相關疫苗</div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={`flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left text-sm transition-all last:border-0 ${
                  selectedId === v.id
                    ? 'border-l-[3px] !border-l-accent bg-accent-dim text-accent'
                    : 'text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                {v.name}
              </button>
            ))
          )}
        </div>

        <div className="rounded-[10px] border border-border bg-bg2 p-6">
          {selected ? <AdultDetail vaccine={selected} /> : <DetailPlaceholder />}
        </div>
      </div>

      <SpecialPopulations />
    </div>
  )
}

function DetailPlaceholder() {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center gap-2.5 text-text-light">
      <CircleCheck className="h-12 w-12 opacity-30" strokeWidth={1.5} />
      <span>← 點選左側疫苗查看詳細資訊</span>
    </div>
  )
}

function AdultDetail({ vaccine: v }: { vaccine: AdultVaccine }) {
  return (
    <div>
      <div className="mb-1 text-[20px] font-bold text-text">{v.name}</div>
      <div className="mb-5 text-[13px] text-text-muted">{v.en}</div>

      <div className="mb-5 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <DetailCard label="劑數" value={v.doses} highlight />
        <DetailCard label="接種時程" value={v.schedule} highlight />
        <div className="col-span-2 max-sm:col-span-1">
          <DetailCard label="適用對象" value={v.target} />
        </div>
      </div>

      <DetailSection title="注意事項">
        <ul className="list-none">
          {v.notes.map((n, i) => (
            <li
              key={i}
              className="relative py-1 pl-3.5 text-sm text-text before:absolute before:left-0 before:text-accent before:content-['·']"
            >
              {n}
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection title="接種禁忌">
        <div className="rounded-r-md border-l-[3px] border-yellow bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-text-muted">
          ⚠️ {v.contraindication}
        </div>
      </DetailSection>

      {v.public_note && (
        <DetailSection title="📋 公費資訊" titleClass="text-green">
          <div
            className="rounded-r-md border-l-[3px] border-green bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-text-muted [&_a]:text-accent [&_a]:no-underline"
            dangerouslySetInnerHTML={{ __html: v.public_note }}
          />
        </DetailSection>
      )}

      <DetailSection title="自費價格">
        {v.price ? (
          <div className="inline-block rounded-md border border-yellow/35 bg-yellow/12 px-3 py-1 text-[13px] font-semibold text-yellow">
            💰 {v.price}
          </div>
        ) : (
          <div className="mt-1 text-[13px] text-text-light">待補充（請洽診所）</div>
        )}
      </DetailSection>
    </div>
  )
}

function DetailCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-3.5 py-3 ${
        highlight
          ? 'border-accent bg-accent-dim'
          : 'border-border bg-surface'
      }`}
    >
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className={`text-[15px] font-semibold leading-[1.5] ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}
      </div>
    </div>
  )
}

function DetailSection({
  title,
  titleClass,
  children,
}: {
  title: string
  titleClass?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className={`mb-2 text-xs font-bold uppercase tracking-wider text-text-muted ${titleClass ?? ''}`}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  Special populations
// ────────────────────────────────────────────────────────
function SpecialPopulations() {
  const [activeId, setActiveId] = useState(SPECIAL_POPULATIONS[0].id)
  const active =
    SPECIAL_POPULATIONS.find((p) => p.id === activeId) ?? SPECIAL_POPULATIONS[0]

  return (
    <div className="mt-9 border-t border-border pt-7">
      <div className="mb-1.5 flex items-center gap-2.5">
        <h2 className="text-[20px] font-semibold text-text">特殊族群速查</h2>
      </div>
      <div className="mb-4 text-[13px] text-text-muted">
        針對特定族群與一般成人時程不同之疫苗建議；點選下方頁籤切換族群。
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto border-b border-border">
        {SPECIAL_POPULATIONS.map((p) => {
          const isActive = p.id === activeId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveId(p.id)}
              className={`-mb-px whitespace-nowrap border-b-2 bg-transparent px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {p.icon} {p.name}
            </button>
          )
        })}
      </div>

      <SpecialPopCard pop={active} />
    </div>
  )
}

function SpecialPopCard({ pop }: { pop: SpecialPopulation }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-5">
      <SpBlock title="建議接種" accent="accent">
        <div className="flex flex-col gap-2">
          {pop.vaccines.map((v, i) => (
            <SpVaccineItem key={i} vax={v} />
          ))}
        </div>
      </SpBlock>

      <SpBlock title="特殊時機" accent="green">
        <ul className="flex list-none flex-col gap-2 p-0">
          {pop.timing.map((t, i) => (
            <li
              key={i}
              className="rounded-md border-l-[3px] border-green bg-bg2 px-3 py-2.5 text-[13.5px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t }}
            />
          ))}
        </ul>
      </SpBlock>

      <SpBlock title="注意事項" accent="yellow">
        <ul className="flex list-none flex-col gap-2 p-0">
          {pop.warnings.map((w, i) => (
            <li
              key={i}
              className={`rounded-md border-l-[3px] bg-bg2 px-3 py-2.5 text-[13.5px] leading-relaxed ${
                w.critical ? 'border-warn' : 'border-yellow'
              } [&_strong]:font-semibold [&_strong]:text-text`}
              dangerouslySetInnerHTML={{ __html: w.text }}
            />
          ))}
        </ul>
      </SpBlock>

      <div className="mt-4 border-t border-dashed border-border pt-3.5 text-xs leading-[1.7] text-text-muted">
        <strong className="font-medium text-text-muted">資料來源</strong>
        <br />
        {pop.sources.map((s, i) => (
          <div key={i} className="mb-1">
            •{' '}
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                className="text-accent no-underline hover:underline"
              >
                {s.text}
              </a>
            ) : (
              s.text
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SpBlock({
  title,
  accent,
  children,
}: {
  title: string
  accent: 'accent' | 'green' | 'yellow'
  children: React.ReactNode
}) {
  const dotColor =
    accent === 'accent' ? 'bg-accent' : accent === 'green' ? 'bg-green' : 'bg-yellow'
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text">
        <span className={`inline-block h-3.5 w-[3px] rounded-sm ${dotColor}`} />
        {title}
      </div>
      {children}
    </div>
  )
}

function SpVaccineItem({ vax: v }: { vax: SpVaccineEntry }) {
  const tagClass =
    v.type === 'pub'
      ? 'border-green/35 bg-green/12 text-green'
      : v.type === 'priv'
        ? 'border-orange/35 bg-orange/12 text-orange'
        : 'border-green/35 bg-green/12 text-green'
  const tagText = v.type === 'pub' ? '公費' : v.type === 'priv' ? '自費' : '公費/自費'

  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 rounded-md bg-bg2 px-3 py-2.5 text-[13.5px] leading-snug max-sm:grid-cols-1">
      <div className="flex flex-col gap-1 font-semibold text-text max-sm:flex-row max-sm:items-center max-sm:gap-2">
        <span>
          {v.name.split('\n').map((line, idx, arr) => (
            <span key={idx}>
              {line}
              {idx < arr.length - 1 && <br />}
            </span>
          ))}
        </span>
        <span
          className={`inline-block w-fit rounded-sm border px-1.5 py-[1px] text-[10px] font-medium ${tagClass}`}
        >
          {tagText}
        </span>
      </div>
      <div
        className="text-text-muted [&_strong]:font-medium [&_strong]:text-text"
        dangerouslySetInnerHTML={{ __html: v.detail }}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────
//  Footer
// ────────────────────────────────────────────────────────
function FeedbackFooter() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-7 text-center text-xs leading-[1.8] text-text-light">
      <div>
        資料來源：
        <a
          href="https://www.cdc.gov.tw"
          target="_blank"
          rel="noopener"
          className="text-accent no-underline hover:underline"
        >
          衛生福利部疾病管制署
        </a>{' '}
        · 本工具由 DR. LAN 個人維護，資訊僅供參考，以 CDC 官方公告為準
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
    </div>
  )
}
