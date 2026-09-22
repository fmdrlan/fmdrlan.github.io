import { useMemo, useState } from 'react'
import { Copy, RotateCcw, ClipboardPaste, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SEC,
  RISK,
  PE,
  INTAKE_DRUGLIST,
  INTAKE_DEFAULTS,
  heightLossCalc,
  peCalc,
  labCalc,
  dxaCalc,
  buildNotes,
  drugStatus,
  buildChartText,
  parseLisIntake,
  type IntakeForm,
} from '@/lib/osteoporosis-intake-engine'

const CARD = 'mb-3 rounded-[10px] border border-border bg-surface px-5 py-4'
const H2 = 'mb-3 border-b border-border pb-2 text-[15px] font-semibold text-text'
const H4 = 'mt-4 mb-1.5 text-[13px] font-semibold text-text-muted first:mt-0'
const ROW = 'mb-2.5 flex flex-wrap items-end gap-3'
const FIELD = 'flex flex-col gap-1'
const LABEL = 'text-[12.5px] text-text-muted'
const UNIT = 'text-[11.5px] text-text-dim'
const INPUT =
  'rounded-md border border-border bg-bg2 px-2.5 py-1.5 text-[14px] text-text transition-colors placeholder:text-text-dim focus:border-accent focus:outline-none'
const CALC = 'mt-1 min-h-[17px] text-[12.5px] text-accent'
const CALC_WARN = 'text-warn font-medium'

const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function TextField({
  label, value, onChange, unit, placeholder, width,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
  placeholder?: string
  width?: string
}) {
  return (
    <div className={FIELD}>
      <label className={LABEL}>
        {label} {unit && <span className={UNIT}>{unit}</span>}
      </label>
      <input
        type="text"
        className={cn(INPUT, width ?? 'w-[150px]')}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function NumField({
  label, value, onChange, unit, step, width,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  unit?: string
  step?: string
  width?: string
}) {
  return (
    <div className={FIELD}>
      <label className={LABEL}>
        {label} {unit && <span className={UNIT}>{unit}</span>}
      </label>
      <input
        type="number"
        className={cn(INPUT, width ?? 'w-[96px]')}
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={FIELD}>
      <label className={LABEL}>{label}</label>
      <input type="date" className={cn(INPUT, 'w-[150px]')} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function SideField({
  label, value, onChange,
}: {
  label: string
  value: IntakeForm['fnSide']
  onChange: (v: IntakeForm['fnSide']) => void
}) {
  return (
    <div className={FIELD}>
      <label className={LABEL}>{label}</label>
      <select
        className={cn(INPUT, 'w-[96px]')}
        value={value}
        onChange={(e) => onChange(e.target.value as IntakeForm['fnSide'])}
      >
        <option value="">—</option>
        <option value="L">左 Lt</option>
        <option value="R">右 Rt</option>
      </select>
    </div>
  )
}

function TextArea({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      className={cn(INPUT, 'min-h-[52px] w-full resize-y')}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ChipGroup({
  items, checks, onToggle, risk,
}: {
  items: [string, string][]
  checks: Set<string>
  onToggle: (k: string) => void
  risk?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([k, label]) => {
        const on = checks.has(k)
        return (
          <label
            key={k}
            className={cn(
              'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-3 py-[5px] text-[13.5px] transition-all',
              on
                ? risk
                  ? 'border-warn/50 bg-warn/10 text-warn'
                  : 'border-accent/50 bg-accent-dim text-accent'
                : 'border-border bg-bg2 text-text hover:border-border-strong',
            )}
          >
            <input type="checkbox" className="m-0 accent-accent" checked={on} onChange={() => onToggle(k)} />
            {label}
          </label>
        )
      })}
    </div>
  )
}

function LisPastePanel({ onApply }: { onApply: (fields: Record<string, { value: number | string }>) => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const parsed = useMemo(() => (text.trim() ? parseLisIntake(text) : null), [text])
  const entries = parsed ? Object.entries(parsed.fields) : []

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface2 px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
      >
        <ClipboardPaste className="h-3.5 w-3.5" strokeWidth={1.8} />
        從 LIS 貼上自動填入
      </button>
    )
  }

  return (
    <div className="mb-3 rounded-lg border border-border bg-bg2 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
          <ClipboardPaste className="h-4 w-4 text-accent" strokeWidth={1.8} />
          從 LIS 貼上自動填入
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setText('')
          }}
          className="text-text-muted hover:text-text"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mb-2 rounded-md border border-green/25 bg-green/[0.08] px-3 py-2 text-[12px] leading-relaxed text-text-muted">
        🔒 貼上的內容僅在本機瀏覽器處理，<b className="text-text">不會上傳到任何伺服器</b>。從成大 LIS（檢驗報告查詢）Ctrl + A 全選 → 複製，貼在下面。
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        placeholder="在這裡 Ctrl + V 貼上 LIS 全選複製的內容..."
        className="h-32 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-text placeholder:text-text-dim focus:border-accent focus:outline-none"
      />

      <div className="mt-2 rounded-md border border-border bg-surface p-2.5">
        <div className="mb-1.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">
          偵測結果{entries.length > 0 ? `（${entries.length} 個欄位）` : ''}
        </div>
        {entries.length === 0 ? (
          <div className="text-[12px] text-text-muted">
            {parsed === null ? '貼上 LIS 內容後，自動顯示能填入的欄位' : '未在貼上內容中找到任何已知欄位'}
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map(([id, f]) => (
              <div key={id} className="flex items-center gap-2 text-[12.5px]">
                <span className="text-green">✓</span>
                <span className="min-w-[88px] text-text-muted">{f.label}</span>
                <span className="text-text">
                  {f.display ?? f.value}
                  {f.unit ? ` ${f.unit}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        {parsed && parsed.warnings.length > 0 && (
          <div className="mt-2 border-t border-border pt-1.5 text-[11.5px] text-yellow">{parsed.warnings.join(' / ')}</div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setText('')}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-text-muted hover:text-text"
        >
          清除
        </button>
        <button
          type="button"
          disabled={entries.length === 0}
          onClick={() => {
            if (parsed) onApply(parsed.fields)
            setText('')
            setOpen(false)
          }}
          className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-bg transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          填入欄位
        </button>
      </div>
    </div>
  )
}

const LEVEL_STYLE: Record<'red' | 'amb', string> = {
  red: 'border-warn/30 bg-warn/[0.08] text-[#f3b3a8]',
  amb: 'border-orange/30 bg-orange/[0.08] text-[#f0c493]',
}

const DRUG_PILL: Record<'red' | 'amb' | 'ok', string> = {
  red: 'bg-warn text-white',
  amb: 'bg-orange text-white',
  ok: 'bg-green text-white',
}

export function IntakeTab() {
  const [form, setForm] = useState<IntakeForm>(() => ({ ...INTAKE_DEFAULTS, visitDate: localISO(new Date()) }))
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const set = <K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  const toggle = (k: string) =>
    setChecks((p) => {
      const n = new Set(p)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  const bmi = useMemo(() => {
    const bh = parseFloat(form.bh), bw = parseFloat(form.bw)
    return Number.isFinite(bh) && Number.isFinite(bw) && bh > 0 ? (bw / (bh / 100) ** 2).toFixed(1) : ''
  }, [form.bh, form.bw])

  const hCalc = useMemo(() => heightLossCalc(form), [form])
  const pCalc = useMemo(() => peCalc(form), [form])
  const lCalc = useMemo(() => labCalc(form), [form])
  const dCalc = useMemo(() => dxaCalc(form), [form])
  const notes = useMemo(() => buildNotes(form), [form])
  const drugs = useMemo(() => drugStatus(form, checks), [form, checks])
  const chartText = useMemo(() => buildChartText(form, checks), [form, checks])

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(chartText)
    } catch {
      // clipboard API unavailable — nothing to fall back to in a form-only view
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetAll = () => {
    setForm({ ...INTAKE_DEFAULTS, visitDate: localISO(new Date()) })
    setChecks(new Set())
  }

  const applyLis = (fields: Record<string, { value: number | string }>) => {
    setForm((p) => {
      const next = { ...p }
      const textIds = [
        'egfr', 'ca', 'ph', 'vitd', 'alp', 'pth', 'oc', 'age',
        'lsBmd', 'lsT', 'fnBmd', 'fnT', 'hpBmd', 'hpT', 'dxaDate', 'spineImg',
      ] as const
      for (const id of textIds) {
        if (fields[id]) next[id] = String(fields[id].value)
      }
      if (fields.sex) next.sex = fields.sex.value as IntakeForm['sex']
      if (fields.fnSide) next.fnSide = fields.fnSide.value as IntakeForm['fnSide']
      if (fields.hpSide) next.hpSide = fields.hpSide.value as IntakeForm['hpSide']
      return next
    })
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 pt-6 pb-16 max-md:px-4">
      <h1 className="text-[22px] font-bold leading-tight text-text">骨質疏鬆：問診與理學檢查</h1>
      <p className="mt-1.5 mb-5 text-[14px] text-text-muted">
        填完自動產生病歷文字，並比對七支院內藥品的禁忌與警語。不做選藥建議。資料只留在本機瀏覽器。
      </p>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
        {/* ── 左欄 ── */}
        <div className="min-w-0">
          <div className={CARD}>
            <h2 className={H2}>基本資料</h2>
            <div className={ROW}>
              <DateField label="就診日期" value={form.visitDate} onChange={(v) => set('visitDate', v)} />
              <NumField label="年齡" value={form.age} onChange={(v) => set('age', v)} width="w-[90px]" />
              <div className={FIELD}>
                <label className={LABEL}>生理性別</label>
                <select
                  className={cn(INPUT, 'w-[96px]')}
                  value={form.sex}
                  onChange={(e) => set('sex', e.target.value as IntakeForm['sex'])}
                >
                  <option value="">—</option>
                  <option value="F">女</option>
                  <option value="M">男</option>
                </select>
              </div>
              <TextField label="轉介來源" unit="（選填）" value={form.refer} onChange={(v) => set('refer', v)} width="w-[190px]" />
            </div>
            {form.sex !== 'M' && (
              <div className={ROW}>
                <NumField label="停經年齡" value={form.menoAge} onChange={(v) => set('menoAge', v)} width="w-[90px]" />
                <div className={FIELD}>
                  <label className={LABEL}>停經型態</label>
                  <select
                    className={cn(INPUT, 'w-[110px]')}
                    value={form.menoType}
                    onChange={(e) => set('menoType', e.target.value as IntakeForm['menoType'])}
                  >
                    <option value="">—</option>
                    <option value="natural">自然</option>
                    <option value="surgical">手術</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className={CARD}>
            <h2 className={H2}>問診</h2>

            <h4 className={cn(H4, 'mt-0')}>骨折與跌倒風險</h4>
            <div className={ROW}>
              <div className={FIELD}>
                <label className={LABEL}>骨折史</label>
                <select className={cn(INPUT, 'w-[80px]')} value={form.fxHx} onChange={(e) => set('fxHx', e.target.value as IntakeForm['fxHx'])}>
                  <option value="none">無</option>
                  <option value="yes">有</option>
                </select>
              </div>
              <div className={cn(FIELD, 'flex-1')}>
                <label className={LABEL}>骨折部位與年齡（有骨折史才填）</label>
                <input
                  type="text"
                  className={cn(INPUT, 'w-full')}
                  value={form.fxDetail}
                  placeholder="例：L1 compression fracture, 70 y/o, low trauma"
                  onChange={(e) => set('fxDetail', e.target.value)}
                />
              </div>
            </div>
            <div className={ROW}>
              <div className={FIELD}>
                <label className={LABEL}>家族髖部骨折史</label>
                <select className={cn(INPUT, 'w-[80px]')} value={form.famFx} onChange={(e) => set('famFx', e.target.value as IntakeForm['famFx'])}>
                  <option value="none">無</option>
                  <option value="yes">有</option>
                </select>
              </div>
              <NumField label="過去一年跌倒次數" value={form.falls} onChange={(v) => set('falls', v)} width="w-[90px]" />
            </div>

            <h4 className={H4}>次發性骨鬆原因（勾選符合項目）</h4>
            <ChipGroup items={SEC} checks={checks} onToggle={toggle} />

            <h4 className={H4}>用藥安全相關（勾選符合項目，會直接觸發警示）</h4>
            <ChipGroup items={RISK} checks={checks} onToggle={toggle} risk />

            <h4 className={H4}>過去與目前骨鬆用藥（含起訖，決定接續規劃）</h4>
            <TextArea
              value={form.pastRx}
              onChange={(v) => set('pastRx', v)}
              placeholder={'例：\nProlia 2023/05 – 2025/11（共 6 劑，2025/11 後未回診）\nFosamax 2019 – 2022'}
            />

            <h4 className={H4}>其他主訴（選填）</h4>
            <TextArea
              value={form.subjOther}
              onChange={(v) => set('subjOther', v)}
              placeholder="例：Low back pain, especially bending and lifting; no radiating pain or ROM limitation"
            />
          </div>

          <div className={CARD}>
            <h2 className={H2}>理學檢查</h2>
            <div className={ROW}>
              <NumField label="目前身高" unit="cm" value={form.bh} onChange={(v) => set('bh', v)} step="0.1" />
              <NumField label="年輕時身高" unit="cm" value={form.bhYouth} onChange={(v) => set('bhYouth', v)} step="0.1" />
              <NumField label="體重" unit="kg" value={form.bw} onChange={(v) => set('bw', v)} step="0.1" />
              <div className={FIELD}>
                <label className={LABEL}>BMI</label>
                <input readOnly className={cn(INPUT, 'w-[88px] bg-bg text-text-muted')} value={bmi} />
              </div>
            </div>
            {hCalc.text && <div className={cn(CALC, hCalc.warn && CALC_WARN)}>{hCalc.text}</div>}

            <div className={ROW}>
              <NumField label="收縮壓" value={form.sbp} onChange={(v) => set('sbp', v)} width="w-[90px]" />
              <NumField label="舒張壓" value={form.dbp} onChange={(v) => set('dbp', v)} width="w-[90px]" />
              <NumField label="脈搏" value={form.pulse} onChange={(v) => set('pulse', v)} width="w-[90px]" />
            </div>

            <h4 className={H4}>脊椎相關檢查</h4>
            <div className={ROW}>
              <NumField label="枕牆距 WOD" unit="cm" value={form.wod} onChange={(v) => set('wod', v)} step="0.1" />
              <NumField label="肋骨骨盆距 RPD" unit="指幅" value={form.rpd} onChange={(v) => set('rpd', v)} step="0.5" />
              <NumField label="起立行走 TUG" unit="秒，選填" value={form.tug} onChange={(v) => set('tug', v)} step="0.1" />
            </div>
            {pCalc.text && <div className={cn(CALC, pCalc.warn && CALC_WARN)}>{pCalc.text}</div>}
            <div className="mt-2">
              <ChipGroup items={PE} checks={checks} onToggle={toggle} />
            </div>
          </div>

          <div className={CARD}>
            <h2 className={H2}>檢驗與影像</h2>
            <LisPastePanel onApply={applyLis} />
            <div className={ROW}>
              <NumField label="eGFR" unit="mL/min/1.73m²" value={form.egfr} onChange={(v) => set('egfr', v)} width="w-[90px]" />
              <NumField label="Ca" unit="mg/dL" value={form.ca} onChange={(v) => set('ca', v)} step="0.1" />
              <NumField label="P" unit="mg/dL" value={form.ph} onChange={(v) => set('ph', v)} step="0.1" width="w-[90px]" />
              <NumField label="25(OH)D" unit="ng/mL" value={form.vitd} onChange={(v) => set('vitd', v)} step="0.1" />
            </div>
            <div className={ROW}>
              <NumField label="ALP" unit="U/L" value={form.alp} onChange={(v) => set('alp', v)} width="w-[90px]" />
              <NumField label="iPTH" unit="pg/mL" value={form.pth} onChange={(v) => set('pth', v)} step="0.1" />
              <NumField label="Osteocalcin" unit="ng/mL" value={form.oc} onChange={(v) => set('oc', v)} step="0.01" />
            </div>
            {lCalc.text && <div className={cn(CALC, lCalc.warn && CALC_WARN)}>{lCalc.text}</div>}

            <h4 className={H4}>DXA</h4>
            <div className={ROW}>
              <DateField label="檢查日期" value={form.dxaDate} onChange={(v) => set('dxaDate', v)} />
              <TextField label="機型" value={form.dxaMachine} onChange={(v) => set('dxaMachine', v)} width="w-[88px]" />
            </div>
            <div className={ROW}>
              <NumField label="L1-4 BMD" unit="g/cm²" value={form.lsBmd} onChange={(v) => set('lsBmd', v)} step="0.001" />
              <NumField label="L1-4 T" value={form.lsT} onChange={(v) => set('lsT', v)} step="0.1" />
            </div>
            <div className={ROW}>
              <NumField label="Hip neck BMD" unit="g/cm²" value={form.fnBmd} onChange={(v) => set('fnBmd', v)} step="0.001" />
              <NumField label="Hip neck T" value={form.fnT} onChange={(v) => set('fnT', v)} step="0.1" />
              <SideField label="Hip neck 取側" value={form.fnSide} onChange={(v) => set('fnSide', v)} />
            </div>
            <div className={ROW}>
              <NumField label="Total hip BMD" unit="g/cm²" value={form.hpBmd} onChange={(v) => set('hpBmd', v)} step="0.001" />
              <NumField label="Total hip T" value={form.hpT} onChange={(v) => set('hpT', v)} step="0.1" />
              <SideField label="Total hip 取側" value={form.hpSide} onChange={(v) => set('hpSide', v)} />
            </div>
            <p className="mt-1 text-[12px] text-text-dim">
              雙側 DXA 以 T-score 較低（較差）的一側為準；T 相同時取 BMD 較低者。從 LIS 貼上時會自動挑側並標註。
            </p>
            {dCalc.text && <div className={cn(CALC, dCalc.warn && CALC_WARN)}>{dCalc.text}</div>}

            <h4 className={H4}>脊椎影像（選填）</h4>
            <TextArea
              value={form.spineImg}
              onChange={(v) => set('spineImg', v)}
              placeholder="例：TL spine — no compression fracture; DDD L1-2, L2-3; spondylosis"
            />
          </div>

          <div className={CARD}>
            <h2 className={H2}>病歷文字</h2>
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyAll}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-bg2 px-3.5 py-[7px] text-[13px] text-text hover:border-border-strong hover:bg-surface2"
              >
                <Copy className="h-[13px] w-[13px]" strokeWidth={1.8} />
                複製全部
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-bg2 px-3.5 py-[7px] text-[13px] text-text hover:border-border-strong hover:bg-surface2"
              >
                <RotateCcw className="h-[13px] w-[13px]" strokeWidth={1.8} />
                清空
              </button>
              <span className={cn('text-[13px] text-green transition-opacity', copied ? 'opacity-100' : 'opacity-0')}>
                已複製
              </span>
            </div>
            <pre className="max-h-[450px] min-h-[120px] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-bg2 px-4 py-3.5 font-mono text-[13px] leading-[1.75] text-text">
              {chartText}
            </pre>
          </div>
        </div>

        {/* ── 右欄：警示側欄 ── */}
        <div className="sticky top-[70px] min-w-0 max-lg:static">
          <div className={CARD}>
            <h2 className={H2}>判讀提示</h2>
            {notes.length ? (
              <div className="space-y-2">
                {notes.map((n, i) => (
                  <div key={i} className={cn('rounded-md border px-3.5 py-2.5 text-[13.5px] leading-relaxed', LEVEL_STYLE[n.level])}>
                    <b className="mb-0.5 block text-[14px]">{n.title}</b>
                    {n.detail}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-green/30 bg-green/[0.08] px-3.5 py-2.5 text-[13px] text-[#8fd4a3]">
                目前沒有需要特別注意的判讀提示。
              </div>
            )}
          </div>

          <div className={CARD}>
            <h2 className={H2}>藥物適用性檢核</h2>
            <div className="divide-y divide-border/60">
              {INTAKE_DRUGLIST.map(([k, nm]) => {
                const items = drugs[k] ?? []
                const red = items.filter((x) => x[0] === 'red')
                const amb = items.filter((x) => x[0] === 'amb')
                const gry = items.filter((x) => x[0] === 'gry')
                const level: 'red' | 'amb' | 'ok' = red.length ? 'red' : amb.length ? 'amb' : 'ok'
                const label = red.length ? '禁忌' : amb.length ? '慎用' : '無禁忌'
                let text = red.length
                  ? red.map((x) => x[1]).join('；')
                  : amb.length
                    ? amb.map((x) => x[1]).join('；')
                    : '依目前輸入未觸發禁忌'
                if (gry.length) text += '。' + gry.map((x) => x[1]).join('；')
                return (
                  <div key={k} className="flex gap-2 py-2 text-[13.5px]">
                    <span className="w-[92px] shrink-0 font-semibold text-text">{nm}</span>
                    <span className="flex-1 text-text-muted">
                      <span className={cn('mr-1.5 inline-block rounded-full px-2 py-[1px] text-[11px] text-white', DRUG_PILL[level])}>
                        {label}
                      </span>
                      {text}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-text-dim">
              僅依輸入欄位比對仿單禁忌與警語，未涵蓋所有臨床考量，也不構成選藥建議。空白欄位一律視為未評估。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
