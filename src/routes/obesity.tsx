import { useMemo, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  MessageSquare,
  ClipboardList,
  CalendarDays,
  User,
  Target,
  Clock,
  Flame,
  Pill,
  Search,
  Heart,
  Activity,
  Users,
  Utensils,
  Brain,
  Footprints,
  Moon,
  Smile,
  Stethoscope,
  Dumbbell,
  FileText,
  FlaskConical,
  Scale,
  Check,
  ArrowRight,
  Copy,
  RotateCcw,
  Ruler,
  X,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  renderNote,
  renderOrders,
  renderFu,
  waistNote,
  computeBmi,
  type Val,
  type Flag,
  type Radio,
} from '@/lib/obesity-engine'

const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfNUXEtUPxavNh_ga1khBQr0VOcY0ZYVmkMK3Ux3CNxznPUSg/viewform'

export const Route = createFileRoute('/obesity')({
  component: ObesityPage,
})

// ── Shared Tailwind class strings ──
const SEC = 'mb-3 rounded-[10px] border border-border bg-surface px-5 py-4'
const H3 =
  'mb-3.5 flex items-center gap-2 text-[15px] font-semibold text-text [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-accent [&>svg]:[stroke-width:1.8]'
const ROW = 'mb-2.5 flex flex-wrap items-center gap-2 last:mb-0'
const FL = 'min-w-[88px] text-[13px] text-text-muted max-[600px]:min-w-[70px]'
const SUBGRID =
  'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2 max-[600px]:grid-cols-2'
const INPUT =
  'rounded-md border border-border bg-bg2 px-2.5 py-1.5 text-[14px] text-text transition-colors placeholder:text-text-dim focus:border-accent focus:outline-none'
const CHK =
  'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-3 py-[5px] text-[13.5px] transition-all [&>input]:m-0 [&>input]:cursor-pointer [&>input]:accent-accent'
const SUBHEADER =
  'mt-3.5 mb-1.5 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-text-muted first:mt-0'
const OUTPUT =
  'max-h-[450px] min-h-[120px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-bg2 px-4 py-3.5 font-mono text-[13px] leading-[1.75] text-text'
const BTNBAR = 'mt-3 flex flex-wrap gap-2'
const ACT =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-bg2 px-3.5 py-[7px] text-[13px] text-text transition-all hover:border-border-strong hover:bg-surface2 [&>svg]:h-[13px] [&>svg]:w-[13px] [&>svg]:[stroke-width:1.8]'
const ACT_PRIMARY = 'border-accent bg-accent text-white hover:border-[#45c8d8] hover:bg-[#45c8d8]'
const PILL =
  'my-0.5 mr-1 inline-block rounded border border-accent/30 bg-surface px-2.5 py-0.5 font-mono text-xs text-text'

const chkCls = (on: boolean) =>
  cn(CHK, on ? 'border-accent/50 bg-accent-dim text-accent' : 'border-border bg-bg2 text-text hover:border-border-strong')

// ── Stable field components (module-level so inputs keep focus) ──
function Chk({ checked, label, onToggle }: { checked: boolean; label: ReactNode; onToggle: () => void }) {
  return (
    <label className={chkCls(checked)}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      {label}
    </label>
  )
}

function RadioPill({ checked, label, onSelect }: { checked: boolean; label: ReactNode; onSelect: () => void }) {
  return (
    <label className={chkCls(checked)}>
      <input type="radio" checked={checked} onChange={onSelect} />
      {label}
    </label>
  )
}

function TextIn({
  value,
  onChange,
  placeholder,
  small,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  small?: boolean
  className?: string
}) {
  return (
    <input
      type="text"
      className={cn(INPUT, small ? 'w-[130px]' : 'w-full', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function NumIn({
  value,
  onChange,
  step,
}: {
  value: string
  onChange: (v: string) => void
  step?: string
}) {
  return (
    <input
      type="number"
      className={cn(INPUT, 'w-20')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
    />
  )
}

function NoteRow({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="mt-2.5">
      <input
        type="text"
        className={cn(INPUT, 'w-full')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function Sec({
  icon,
  title,
  extra,
  children,
}: {
  icon: ReactNode
  title: ReactNode
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={SEC}>
      <h3 className={H3}>
        {icon}
        {title}
        {extra}
      </h3>
      {children}
    </div>
  )
}

function CopyFb({ show }: { show: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto font-mono text-[11px] uppercase tracking-[0.05em] text-green transition-opacity',
        show ? 'opacity-100' : 'opacity-0',
      )}
    >
      已複製
    </span>
  )
}

// ── Checkbox group definitions ──
type Item = { f: string; label: ReactNode; sex?: '男' | '女' }

const EVENTS: Item[] = [
  { f: 'quit-smoke', label: '曾經戒菸' },
  { f: 'preg-gain', label: '懷孕期間增重過多', sex: '女' },
  { f: 'menstrual', label: '月經不規則', sex: '女' },
  { f: 'post-meno', label: '停經後體重增加', sex: '女' },
]
const OBESO_MEDS: Item[] = [
  { f: 'med-dm', label: '降血糖藥（SU、TZD、insulin）' },
  { f: 'med-antipsych', label: '抗精神病藥' },
  { f: 'med-antidep', label: '抗憂鬱劑' },
  { f: 'med-antiep', label: '抗癲癇藥' },
  { f: 'med-steroid', label: '類固醇' },
  { f: 'med-bb', label: 'β-blocker' },
]
const ENDO: Item[] = [
  { f: 'sx-thyroid', label: '疲倦/便秘/怕冷（甲低？）' },
  { f: 'sx-cushing', label: '圓臉/水牛肩/皮膚變薄（庫欣？）' },
  { f: 'sx-pcos', label: '多毛/月經失調/痤瘡（PCOS？）', sex: '女' },
  { f: 'sx-hypogonad', label: '性慾下降/疲倦/肌力減弱（低睪固酮？）', sex: '男' },
]
const COMORBID: Item[] = [
  { f: 'cm-htn', label: '高血壓' },
  { f: 'cm-dm', label: '糖尿病' },
  { f: 'cm-dl', label: '血脂異常' },
  { f: 'cm-osa', label: '睡眠呼吸中止症' },
  { f: 'cm-masld', label: '脂肪肝 (MASLD)' },
  { f: 'cm-knee', label: '退化性膝關節炎' },
  { f: 'cm-hfpef', label: 'HFpEF' },
  { f: 'cm-gout', label: '痛風' },
  { f: 'cm-psy', label: '精神科疾病' },
]
const WSYMPTOMS: Item[] = [
  { f: 'sym-dyspnea', label: '爬樓梯會喘' },
  { f: 'sym-knee', label: '膝蓋痠痛' },
  { f: 'sym-fatigue', label: '容易疲倦' },
  { f: 'sym-snore', label: '打鼾' },
  { f: 'sym-sleepy', label: '白天嗜睡' },
  { f: 'sym-apnea', label: '目擊呼吸暫停' },
]
const FAMILY: Item[] = [
  { f: 'fh-obesity', label: '肥胖' },
  { f: 'fh-dm', label: '糖尿病' },
  { f: 'fh-htn', label: '高血壓' },
  { f: 'fh-dl', label: '高血脂' },
  { f: 'fh-cv', label: '心血管疾病' },
]
const DIET_PATTERN: Item[] = [
  { f: 'diet-skip-bf', label: '常略過早餐' },
  { f: 'diet-late-dinner', label: '晚餐進食時間晚' },
  { f: 'diet-night-eat', label: '吃宵夜' },
  { f: 'diet-snack', label: '兩餐之間吃點心' },
  { f: 'diet-fast-eat', label: '用餐速度快' },
  { f: 'diet-distract', label: '邊看手機/電視吃' },
]
const DIET_CONTENT: Item[] = [
  { f: 'diet-sugary', label: '含糖飲料' },
  { f: 'diet-fried', label: '油炸食物' },
  { f: 'diet-redmeat', label: '紅肉/加工肉' },
  { f: 'diet-upf', label: '超加工食品/零食' },
  { f: 'diet-alcohol', label: '飲酒' },
  { f: 'diet-highsalt', label: '高鹽飲食' },
]
const DIET_BEH: Item[] = [
  { f: 'diet-emo', label: '情緒性進食' },
  { f: 'diet-stress', label: '壓力性進食' },
  { f: 'diet-binge', label: '暴食傾向' },
  { f: 'diet-night-syn', label: '夜食症候群' },
]
const PSYCHO: Item[] = [
  { f: 'psy-depress', label: '憂鬱情緒' },
  { f: 'psy-anxiety', label: '焦慮情緒' },
  { f: 'psy-stigma', label: '體重相關自我污名' },
  { f: 'psy-stress', label: '高壓生活' },
]
const PE_SKIN: Item[] = [
  { f: 'pe-acanth', label: '黑色棘皮症' },
  { f: 'pe-stria', label: '肥胖紋' },
  { f: 'pe-intertrigo', label: '對磨皮疹' },
  { f: 'pe-acne', label: '痤瘡' },
  { f: 'pe-hirsut', label: '多毛', sex: '女' },
  { f: 'pe-xanth', label: '黃色瘤' },
]
const PE_HEADNECK: Item[] = [
  { f: 'pe-thyroid', label: '甲狀腺腫大' },
  { f: 'pe-mooning', label: '圓臉/水牛肩（庫欣？）' },
]
const PE_CARDIO: Item[] = [
  { f: 'pe-heart', label: '心音異常' },
  { f: 'pe-lung', label: '肺音異常' },
  { f: 'pe-edema', label: '下肢水腫' },
]
const FU_AE: Item[] = [
  { f: 'fu-ae-nausea', label: '噁心' },
  { f: 'fu-ae-vomit', label: '嘔吐' },
  { f: 'fu-ae-diarrhea', label: '腹瀉' },
  { f: 'fu-ae-constip', label: '便秘' },
  { f: 'fu-ae-bloat', label: '腹脹' },
  { f: 'fu-ae-reflux', label: '胃食道逆流' },
  { f: 'fu-ae-fatigue', label: '疲倦' },
  { f: 'fu-ae-inject', label: '注射處反應' },
]
const FU_PLAN: Item[] = [
  { f: 'fu-plan-continue', label: '繼續原方案' },
  { f: 'fu-plan-titrate', label: '藥物調整劑量' },
  { f: 'fu-plan-switch', label: '換藥' },
  { f: 'fu-plan-add', label: '加藥' },
  { f: 'fu-plan-stop', label: '停藥' },
  { f: 'fu-plan-refer', label: '轉介(營養/心理/手術)' },
  { f: 'fu-plan-lab', label: '排檢驗' },
]

function ObesityPage() {
  const [mode, setMode] = useState<'intake' | 'followup'>('intake')
  const [text, setText] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Set<string>>(new Set())
  const [radios, setRadios] = useState<Record<string, string>>({})

  const [bmiOpen, setBmiOpen] = useState(false)
  const [bmiHeight, setBmiHeight] = useState('')
  const [bmiWt, setBmiWt] = useState('')

  const [copied, setCopied] = useState<string | null>(null)

  const setT = useCallback((id: string, v: string) => setText((p) => ({ ...p, [id]: v })), [])
  const toggle = useCallback(
    (f: string) =>
      setChecks((p) => {
        const n = new Set(p)
        if (n.has(f)) n.delete(f)
        else n.add(f)
        return n
      }),
    [],
  )
  const setRadio = useCallback((name: string, v: string) => setRadios((p) => ({ ...p, [name]: v })), [])

  const val: Val = useCallback((id) => (text[id] ?? '').trim(), [text])
  const flag: Flag = useCallback((f) => checks.has(f), [checks])
  const radio: Radio = useCallback((name) => radios[name], [radios])

  const sex = radios['sex']
  const showItem = (it: Item) => !it.sex || it.sex === sex

  const note = useMemo(() => renderNote(val, flag, radio), [val, flag, radio])
  const orders = useMemo(() => renderOrders(val, flag), [val, flag])
  const fu = useMemo(() => renderFu(val, flag, radio), [val, flag, radio])
  const bmi = useMemo(() => computeBmi(bmiHeight, bmiWt), [bmiHeight, bmiWt])
  const wNote = useMemo(() => waistNote(sex, text['waist'] ?? ''), [sex, text])

  useEffect(() => {
    if (!bmiOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBmiOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [bmiOpen])

  const copyText = (textToCopy: string, key: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
    })
  }

  const resetPane = (which: 'intake' | 'followup') => {
    const prefix = which === 'intake' ? INTAKE_IDS : FU_IDS
    setText((p) => {
      const n = { ...p }
      for (const id of prefix.text) delete n[id]
      return n
    })
    setChecks((p) => {
      const n = new Set(p)
      for (const f of prefix.flags) n.delete(f)
      return n
    })
    setRadios((p) => {
      const n = { ...p }
      for (const name of prefix.radios) delete n[name]
      return n
    })
  }

  const subgrid = (items: Item[]) => (
    <div className={SUBGRID}>
      {items.filter(showItem).map((it) => (
        <Chk key={it.f} checked={checks.has(it.f)} label={it.label} onToggle={() => toggle(it.f)} />
      ))}
    </div>
  )

  return (
    <>
      <SiteNav />

      <div className="mx-auto max-w-[1100px] px-6 pt-8 pb-10 max-md:px-4 max-md:pt-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">門診結構化問診</h1>
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-relaxed text-text-muted">
            看診時邊問邊勾選，自動生成可貼進病歷的英文結構化文字 + 症狀導向 order 提示。
          </p>
        </div>

        <div className="mb-[18px] flex flex-wrap items-center gap-2" aria-label="問診議題">
          <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">議題</span>
          <button className="cursor-pointer rounded-md border border-accent/40 bg-accent-dim px-3.5 py-1.5 text-[13px] text-accent">
            肥胖
          </button>
          {['DM 控制', '高血壓', '戒菸諮詢'].map((t) => (
            <button
              key={t}
              disabled
              title="待加入"
              className="cursor-not-allowed rounded-md border border-border bg-surface px-3.5 py-1.5 text-[13px] text-text-muted opacity-40"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-[18px] flex items-start gap-2.5 rounded-lg border border-yellow/25 bg-yellow/[0.06] px-3.5 py-2.5 text-[12.5px] leading-[1.7] text-[#d8c08a] [&_strong]:text-[#e8d8a8] [&>svg]:mt-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-yellow [&>svg]:[stroke-width:1.8]">
          <AlertTriangle />
          <div>
            <strong>使用提醒：</strong>本工具為醫師端輔助記錄使用。產出之病歷文字與檢驗建議僅供臨床參考，
            <strong>不取代個別病人之完整評估與醫師判斷</strong>。請依各院 SOP 與最新指引調整。
            肥胖問診內容依據台灣成人肥胖臨床實證指引（2026）第八章。
          </div>
        </div>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as 'intake' | 'followup')}
          className="mb-[18px]"
        >
          <TabsList variant="line" className="w-full justify-start border-b border-border">
            <TabsTrigger value="intake" className="flex-none">
              <ClipboardList />
              初診評估
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex-none">
              <CalendarDays />
              回診追蹤
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ============= 初診 ============= */}
        {mode === 'intake' && (
          <div>
            <Sec icon={<User />} title="性別">
              <div className={ROW}>
                <RadioPill checked={sex === '男'} label="男" onSelect={() => setRadio('sex', '男')} />
                <RadioPill checked={sex === '女'} label="女" onSelect={() => setRadio('sex', '女')} />
              </div>
            </Sec>

            <Sec icon={<Target />} title="減重動機與目標">
              <div className={ROW}>
                <label className={FL}>就診動機</label>
                <TextIn
                  value={text['motivation'] ?? ''}
                  onChange={(v) => setT('motivation', v)}
                  placeholder="健康/外觀/共病改善/其他"
                  className="flex-1"
                />
              </div>
              <div className={ROW}>
                <label className={FL}>目標體重</label>
                <NumIn value={text['goal-wt'] ?? ''} onChange={(v) => setT('goal-wt', v)} step="0.1" /> kg
                <label className={cn(FL, 'ml-3')}>期望時程</label>
                <TextIn small value={text['goal-time'] ?? ''} onChange={(v) => setT('goal-time', v)} placeholder="例：6個月" />
              </div>
              <NoteRow value={text['goal-note'] ?? ''} onChange={(v) => setT('goal-note', v)} placeholder="其他備註" />
            </Sec>

            <Sec icon={<Clock />} title="體重變化史">
              <div className={ROW}>
                <label className={FL}>最高體重</label>
                <NumIn value={text['max-wt'] ?? ''} onChange={(v) => setT('max-wt', v)} step="0.1" /> kg
                <label className={cn(FL, 'ml-3')}>何時</label>
                <TextIn small value={text['max-wt-when'] ?? ''} onChange={(v) => setT('max-wt-when', v)} placeholder="例：去年" />
              </div>
              <div className={ROW}>
                <label className={FL}>最低體重</label>
                <NumIn value={text['min-wt'] ?? ''} onChange={(v) => setT('min-wt', v)} step="0.1" /> kg
                <label className={cn(FL, 'ml-3')}>起始增重</label>
                <TextIn small value={text['onset'] ?? ''} onChange={(v) => setT('onset', v)} placeholder="例：30歲後" />
              </div>
              <div className={ROW}>
                <Chk
                  checked={checks.has('weight-cycling')}
                  label="反覆減重 (weight cycling)"
                  onToggle={() => toggle('weight-cycling')}
                />
                <label className={cn(FL, 'ml-1')}>次數/方式</label>
                <TextIn small value={text['cycling-times'] ?? ''} onChange={(v) => setT('cycling-times', v)} />
              </div>
              <div className={ROW}>
                <label className={FL}>過去減重方式</label>
                <TextIn
                  value={text['prev-method'] ?? ''}
                  onChange={(v) => setT('prev-method', v)}
                  placeholder="飲食/運動/藥物/手術，成效，失敗原因"
                  className="flex-1 min-w-[240px]"
                />
              </div>
            </Sec>

            <Sec icon={<Flame />} title="生活事件">
              {subgrid(EVENTS)}
              <NoteRow value={text['event-note'] ?? ''} onChange={(v) => setT('event-note', v)} placeholder="其他生活事件備註" />
            </Sec>

            <Sec icon={<Pill />} title="致胖藥物史">
              {subgrid(OBESO_MEDS)}
              <NoteRow value={text['med-detail'] ?? ''} onChange={(v) => setT('med-detail', v)} placeholder="藥物名稱/劑量/其他" />
            </Sec>

            <Sec icon={<Search />} title="內分泌症狀（症狀導向）">
              {subgrid(ENDO)}
              <NoteRow value={text['endo-note'] ?? ''} onChange={(v) => setT('endo-note', v)} placeholder="其他內分泌症狀備註" />
            </Sec>

            <Sec icon={<Heart />} title="共病評估">
              {subgrid(COMORBID)}
              <NoteRow value={text['cm-note'] ?? ''} onChange={(v) => setT('cm-note', v)} placeholder="其他共病/補充" />
            </Sec>

            <Sec icon={<Activity />} title="體重相關症狀">
              {subgrid(WSYMPTOMS)}
              <NoteRow value={text['sym-note'] ?? ''} onChange={(v) => setT('sym-note', v)} placeholder="其他症狀備註" />
            </Sec>

            <Sec icon={<Users />} title="家族史">
              {subgrid(FAMILY)}
              <NoteRow
                value={text['fh-note'] ?? ''}
                onChange={(v) => setT('fh-note', v)}
                placeholder="哪位親屬/其他細節（例：母親 DM、父親 50歲心肌梗塞）"
              />
            </Sec>

            <Sec icon={<Clock />} title="用餐型態">
              {subgrid(DIET_PATTERN)}
              <div className={cn(ROW, 'mt-2.5')}>
                <label className={FL}>外食比例</label>
                <RadioPill checked={radios['eat-out'] === '低（<30%）'} label="低" onSelect={() => setRadio('eat-out', '低（<30%）')} />
                <RadioPill checked={radios['eat-out'] === '中（30–70%）'} label="中" onSelect={() => setRadio('eat-out', '中（30–70%）')} />
                <RadioPill checked={radios['eat-out'] === '高（>70%）'} label="高" onSelect={() => setRadio('eat-out', '高（>70%）')} />
              </div>
              <div className={ROW}>
                <label className={FL}>備餐者</label>
                <TextIn small value={text['cook-person'] ?? ''} onChange={(v) => setT('cook-person', v)} placeholder="自己/家人/外食" />
              </div>
              <NoteRow value={text['pattern-note'] ?? ''} onChange={(v) => setT('pattern-note', v)} placeholder="其他用餐型態備註" />
            </Sec>

            <Sec icon={<Utensils />} title="飲食內容">
              {subgrid(DIET_CONTENT)}
              <div className={cn(ROW, 'mt-2')}>
                <label className={FL}>含糖飲頻率</label>
                <TextIn small value={text['sugary-freq'] ?? ''} onChange={(v) => setT('sugary-freq', v)} placeholder="例：每天1杯" />
                <label className={cn(FL, 'ml-3')}>酒精</label>
                <TextIn small value={text['alc-amount'] ?? ''} onChange={(v) => setT('alc-amount', v)} placeholder="種類/量/週" />
              </div>
              <NoteRow value={text['content-note'] ?? ''} onChange={(v) => setT('content-note', v)} placeholder="其他飲食內容備註" />
            </Sec>

            <Sec icon={<Brain />} title="飲食行為（心理面）">
              {subgrid(DIET_BEH)}
              <NoteRow value={text['beh-note'] ?? ''} onChange={(v) => setT('beh-note', v)} placeholder="其他飲食行為備註" />
            </Sec>

            <Sec icon={<Footprints />} title="身體活動">
              <div className={ROW}>
                <label className={FL}>運動類型</label>
                <TextIn value={text['exercise-type'] ?? ''} onChange={(v) => setT('exercise-type', v)} placeholder="例：快走、重訓" className="flex-1" />
              </div>
              <div className={ROW}>
                <label className={FL}>頻率/時間</label>
                <TextIn small value={text['exercise-freq'] ?? ''} onChange={(v) => setT('exercise-freq', v)} placeholder="例：3次/週" />
                <TextIn small value={text['exercise-dur'] ?? ''} onChange={(v) => setT('exercise-dur', v)} placeholder="例：30分/次" className="ml-2" />
                <label className={cn(FL, 'ml-3')}>強度</label>
                <RadioPill checked={radios['intensity'] === '低'} label="低" onSelect={() => setRadio('intensity', '低')} />
                <RadioPill checked={radios['intensity'] === '中'} label="中" onSelect={() => setRadio('intensity', '中')} />
                <RadioPill checked={radios['intensity'] === '高'} label="高" onSelect={() => setRadio('intensity', '高')} />
              </div>
              <div className={ROW}>
                <Chk checked={checks.has('ls-sedentary')} label="久坐 > 8 小時/天" onToggle={() => toggle('ls-sedentary')} />
                <Chk checked={checks.has('ls-act-limit')} label="有活動受限因子" onToggle={() => toggle('ls-act-limit')} />
              </div>
              <div className={ROW}>
                <label className={FL}>活動限制</label>
                <TextIn value={text['act-limit-detail'] ?? ''} onChange={(v) => setT('act-limit-detail', v)} placeholder="例：膝痛、心肺功能" className="flex-1" />
              </div>
            </Sec>

            <Sec icon={<Moon />} title="睡眠">
              <div className={ROW}>
                <label className={FL}>睡眠時數</label>
                <NumIn value={text['sleep-hr'] ?? ''} onChange={(v) => setT('sleep-hr', v)} step="0.5" /> 小時
                <label className={cn(FL, 'ml-3')}>品質</label>
                <RadioPill checked={radios['sleep-q'] === '好'} label="好" onSelect={() => setRadio('sleep-q', '好')} />
                <RadioPill checked={radios['sleep-q'] === '普通'} label="普通" onSelect={() => setRadio('sleep-q', '普通')} />
                <RadioPill checked={radios['sleep-q'] === '差'} label="差" onSelect={() => setRadio('sleep-q', '差')} />
              </div>
              <div className={ROW}>
                <Chk checked={checks.has('ls-shift')} label="夜班/輪班工作" onToggle={() => toggle('ls-shift')} />
                <Chk checked={checks.has('ls-irreg')} label="作息不規律" onToggle={() => toggle('ls-irreg')} />
              </div>
              <NoteRow value={text['sleep-note'] ?? ''} onChange={(v) => setT('sleep-note', v)} placeholder="入睡困難、易醒、其他睡眠細節" />
            </Sec>

            <Sec icon={<Smile />} title="心理與社會">
              {subgrid(PSYCHO)}
              <div className={cn(ROW, 'mt-2')}>
                <label className={FL}>家庭支持</label>
                <RadioPill checked={radios['support'] === '好'} label="好" onSelect={() => setRadio('support', '好')} />
                <RadioPill checked={radios['support'] === '普通'} label="普通" onSelect={() => setRadio('support', '普通')} />
                <RadioPill checked={radios['support'] === '差'} label="差" onSelect={() => setRadio('support', '差')} />
                <label className={cn(FL, 'ml-4')}>工作型態</label>
                <TextIn small value={text['work-type'] ?? ''} onChange={(v) => setT('work-type', v)} placeholder="例：辦公室" />
              </div>
              <NoteRow value={text['psy-note'] ?? ''} onChange={(v) => setT('psy-note', v)} placeholder="其他心理社會備註" />
            </Sec>

            <Sec icon={<Stethoscope />} title="系統性理學檢查">
              <div className={ROW}>
                <label className={FL}>腰圍 (cm)</label>
                <NumIn value={text['waist'] ?? ''} onChange={(v) => setT('waist', v)} step="0.1" />
                <span className={cn('ml-2 text-xs', wNote.warn ? 'text-yellow' : 'text-text-light')}>
                  {text['waist'] || sex ? wNote.text : ''}
                </span>
              </div>
              <div className={ROW}>
                <label className={FL}>頸圍 (cm)</label>
                <NumIn value={text['neck'] ?? ''} onChange={(v) => setT('neck', v)} step="0.1" />
                <span className="ml-2 text-xs text-text-light">男 ≥ 43、女 ≥ 38 提示 OSA 風險</span>
              </div>

              <div className={SUBHEADER}>皮膚徵象（代謝異常）</div>
              {subgrid(PE_SKIN)}
              <div className={SUBHEADER}>頭頸部</div>
              {subgrid(PE_HEADNECK)}
              <div className={SUBHEADER}>心肺與下肢</div>
              {subgrid(PE_CARDIO)}
              <NoteRow value={text['pe-note'] ?? ''} onChange={(v) => setT('pe-note', v)} placeholder="其他理學檢查發現" />
            </Sec>

            <Sec icon={<Dumbbell />} title="肌少肥胖症評估（懷疑時加做）">
              <div className="mb-3 rounded-md border border-border bg-bg2 px-3.5 py-2.5 text-[12.5px] leading-[1.7] text-text-muted">
                <strong className="mb-1 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text">
                  異常切點 · AWGS 2019 / 指引建議
                </strong>
                ・小腿圍：男 &lt; 34 cm、女 &lt; 33 cm<br />
                ・握力：男 &lt; 28 kg、女 &lt; 18 kg<br />
                ・5 次坐站：≥ 12 秒<br />
                ・6 公尺步行速度：&lt; 1.0 m/s（≈ 6 公尺 &gt; 6 秒）
              </div>
              <div className={ROW}>
                <label className={FL}>小腿圍 (cm)</label>
                <NumIn value={text['calf'] ?? ''} onChange={(v) => setT('calf', v)} step="0.1" />
                <label className={cn(FL, 'ml-3')}>握力 (kg)</label>
                <NumIn value={text['grip'] ?? ''} onChange={(v) => setT('grip', v)} step="0.1" />
              </div>
              <div className={ROW}>
                <label className={FL}>5次坐站 (秒)</label>
                <NumIn value={text['sts'] ?? ''} onChange={(v) => setT('sts', v)} step="0.1" />
                <label className={cn(FL, 'ml-3')}>6m步行 (秒)</label>
                <NumIn value={text['walk'] ?? ''} onChange={(v) => setT('walk', v)} step="0.1" />
              </div>
            </Sec>

            <Sec icon={<FileText />} title="病歷文字（自動生成英文）" extra={<CopyFb show={copied === 'note'} />}>
              <div className={OUTPUT}>{note}</div>
              <div className={BTNBAR}>
                <button className={cn(ACT, ACT_PRIMARY)} onClick={() => copyText(note, 'note')}>
                  <Copy />
                  複製病歷
                </button>
                <button
                  className={ACT}
                  onClick={() => {
                    if (confirm('確定要清空初診所有欄位？')) resetPane('intake')
                  }}
                >
                  <RotateCcw />
                  清空初診
                </button>
              </div>
            </Sec>

            <Sec icon={<FlaskConical />} title="建議檢驗 order" extra={<CopyFb show={copied === 'order'} />}>
              <div className="mt-2.5 rounded-lg border border-accent/25 bg-accent/5 px-3.5 py-3">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-accent [&>svg]:h-[13px] [&>svg]:w-[13px] [&>svg]:[stroke-width:2]">
                  <Check />
                  Routine（所有肥胖病人）
                </div>
                <div className="text-[13px] leading-[1.8] text-text">
                  {orders.routine.map((t) => (
                    <span key={t} className={PILL}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {orders.cond.length > 0 && (
                <div className="mt-2.5 rounded-lg border border-accent/25 bg-accent/5 px-3.5 py-3">
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-accent [&>svg]:h-[13px] [&>svg]:w-[13px] [&>svg]:[stroke-width:2]">
                    <Target />
                    Symptom-directed（症狀導向加做）
                  </div>
                  <div className="text-[13px] leading-[1.8] text-text">
                    {orders.cond.map((c) => (
                      <div key={c.test} className="my-1">
                        <span className={PILL}>{c.test}</span>
                        <span className="ml-1 text-xs text-text-muted">— {c.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className={BTNBAR}>
                <button
                  className={ACT}
                  onClick={() => {
                    let t = '[Routine] ' + orders.routine.join(', ')
                    if (orders.cond.length) t += '\n[Symptom-directed] ' + orders.cond.map((c) => c.test).join(', ')
                    copyText(t, 'order')
                  }}
                >
                  <Copy />
                  複製 order 清單
                </button>
              </div>
            </Sec>
          </div>
        )}

        {/* ============= 回診 ============= */}
        {mode === 'followup' && (
          <div>
            <Sec icon={<Scale />} title="體重變化">
              <div className={ROW}>
                <label className={FL}>本次體重</label>
                <NumIn value={text['fu-wt'] ?? ''} onChange={(v) => setT('fu-wt', v)} step="0.1" /> kg
                <label className={cn(FL, 'ml-3')}>上次體重</label>
                <NumIn value={text['fu-wt-prev'] ?? ''} onChange={(v) => setT('fu-wt-prev', v)} step="0.1" /> kg
                {fu.wtDelta && (
                  <span className={cn('ml-2 text-xs', fu.wtDelta.good ? 'text-green' : 'text-yellow')}>{fu.wtDelta.text}</span>
                )}
              </div>
              <div className={ROW}>
                <label className={FL}>起始體重</label>
                <NumIn value={text['fu-wt-start'] ?? ''} onChange={(v) => setT('fu-wt-start', v)} step="0.1" /> kg
                {fu.wtTotal && (
                  <span className={cn('ml-2 text-xs', fu.wtTotal.good ? 'text-green' : 'text-yellow')}>{fu.wtTotal.text}</span>
                )}
              </div>
              <div className={ROW}>
                <label className={FL}>腰圍 (cm)</label>
                <NumIn value={text['fu-waist'] ?? ''} onChange={(v) => setT('fu-waist', v)} step="0.1" />
                <label className={cn(FL, 'ml-3')}>上次腰圍</label>
                <NumIn value={text['fu-waist-prev'] ?? ''} onChange={(v) => setT('fu-waist-prev', v)} step="0.1" />
                {fu.waistDelta && (
                  <span className={cn('ml-2 text-xs', fu.waistDelta.good ? 'text-green' : 'text-yellow')}>{fu.waistDelta.text}</span>
                )}
              </div>
              <div className={ROW}>
                {['持續下降', '平台期', '反彈', '持平'].map((v) => (
                  <RadioPill key={v} checked={radios['fu-trend'] === v} label={v} onSelect={() => setRadio('fu-trend', v)} />
                ))}
              </div>
            </Sec>

            <Sec icon={<Pill />} title="減重藥物">
              <div className={ROW}>
                <label className={FL}>使用藥物</label>
                <Chk checked={checks.has('fu-med-glp1')} label="GLP-1 RA" onToggle={() => toggle('fu-med-glp1')} />
                <Chk checked={checks.has('fu-med-orlistat')} label="Orlistat" onToggle={() => toggle('fu-med-orlistat')} />
                <Chk checked={checks.has('fu-med-pb')} label="Phentermine/Bupropion" onToggle={() => toggle('fu-med-pb')} />
                <Chk checked={checks.has('fu-med-none')} label="未使用" onToggle={() => toggle('fu-med-none')} />
              </div>
              <div className={ROW}>
                <label className={FL}>藥名/劑量</label>
                <TextIn value={text['fu-med-detail'] ?? ''} onChange={(v) => setT('fu-med-detail', v)} placeholder="例：Semaglutide 1.0 mg QW" className="flex-1" />
              </div>
              <div className={ROW}>
                <label className={FL}>依從性</label>
                <RadioPill checked={radios['fu-adh'] === '佳'} label="佳" onSelect={() => setRadio('fu-adh', '佳')} />
                <RadioPill checked={radios['fu-adh'] === '尚可'} label="尚可" onSelect={() => setRadio('fu-adh', '尚可')} />
                <RadioPill checked={radios['fu-adh'] === '差'} label="差" onSelect={() => setRadio('fu-adh', '差')} />
                <span className="ml-3">
                  <Chk checked={checks.has('fu-self-pay')} label="自費" onToggle={() => toggle('fu-self-pay')} />
                </span>
              </div>
              <NoteRow value={text['fu-med-note'] ?? ''} onChange={(v) => setT('fu-med-note', v)} placeholder="調整原因/其他備註" />
            </Sec>

            <Sec icon={<AlertTriangle />} title="藥物副作用 (GLP-1 相關)">
              {subgrid(FU_AE)}
              <NoteRow value={text['fu-ae-note'] ?? ''} onChange={(v) => setT('fu-ae-note', v)} placeholder="其他副作用/嚴重度" />
            </Sec>

            <Sec icon={<Check />} title="生活型態執行">
              <div className={ROW}>
                <label className={FL}>飲食控制</label>
                <RadioPill checked={radios['fu-diet'] === '佳'} label="佳" onSelect={() => setRadio('fu-diet', '佳')} />
                <RadioPill checked={radios['fu-diet'] === '尚可'} label="尚可" onSelect={() => setRadio('fu-diet', '尚可')} />
                <RadioPill checked={radios['fu-diet'] === '差'} label="差" onSelect={() => setRadio('fu-diet', '差')} />
              </div>
              <div className={ROW}>
                <label className={FL}>運動執行</label>
                <RadioPill checked={radios['fu-exer'] === '佳'} label="佳" onSelect={() => setRadio('fu-exer', '佳')} />
                <RadioPill checked={radios['fu-exer'] === '尚可'} label="尚可" onSelect={() => setRadio('fu-exer', '尚可')} />
                <RadioPill checked={radios['fu-exer'] === '差'} label="差" onSelect={() => setRadio('fu-exer', '差')} />
              </div>
              <NoteRow value={text['fu-ls-note'] ?? ''} onChange={(v) => setT('fu-ls-note', v)} placeholder="主要遇到的困難/其他" />
            </Sec>

            <Sec icon={<FlaskConical />} title="檢驗追蹤">
              <div className={ROW}>
                <Chk checked={checks.has('fu-lab-followup')} label="本次需追蹤檢驗" onToggle={() => toggle('fu-lab-followup')} />
              </div>
              <NoteRow
                value={text['fu-lab-note'] ?? ''}
                onChange={(v) => setT('fu-lab-note', v)}
                placeholder="例：HbA1c、肝腎、血脂；或上次結果摘要"
              />
            </Sec>

            <Sec icon={<ArrowRight />} title="本次處置與計畫">
              {subgrid(FU_PLAN)}
              <NoteRow value={text['fu-plan-note'] ?? ''} onChange={(v) => setT('fu-plan-note', v)} placeholder="計畫細節、下次回診時間" />
            </Sec>

            <Sec icon={<FileText />} title="回診病歷文字（自動生成英文）" extra={<CopyFb show={copied === 'fu'} />}>
              <div className={OUTPUT}>{fu.text}</div>
              <div className={BTNBAR}>
                <button className={cn(ACT, ACT_PRIMARY)} onClick={() => copyText(fu.text, 'fu')}>
                  <Copy />
                  複製病歷
                </button>
                <button
                  className={ACT}
                  onClick={() => {
                    if (confirm('確定要清空回診所有欄位？')) resetPane('followup')
                  }}
                >
                  <RotateCcw />
                  清空回診
                </button>
              </div>
            </Sec>
          </div>
        )}

        <div className="mt-8 text-center text-xs leading-[1.8] text-text-light">
          肥胖議題依據：台灣成人肥胖臨床實證指引（2026）第八章「肥胖患者的全面性評估」
          <br />
          本工具僅供醫護人員臨床參考，不取代個別病人評估與最新指引。
          <div className="mt-3">
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-[5px] border border-border bg-transparent px-3 py-[5px] text-xs leading-[1.4] text-white no-underline transition-all hover:border-text-dim hover:bg-white/5 [&>svg]:h-[13px] [&>svg]:w-[13px] [&>svg]:[stroke-width:1.8]"
            >
              <MessageSquare />
              回報錯誤 / 提建議
            </a>
          </div>
        </div>
      </div>

      {/* ── BMI 對照浮動工具 ── */}
      <button
        onClick={() => setBmiOpen(true)}
        aria-label="開啟 BMI 對照工具"
        className="fixed right-6 bottom-6 z-50 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_4px_14px_rgba(43,184,201,0.35)] transition-all hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(43,184,201,0.45)] [&>svg]:h-[14px] [&>svg]:w-[14px] [&>svg]:[stroke-width:2]"
      >
        <Ruler />
        BMI 對照
      </button>

      {bmiOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setBmiOpen(false)}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(13,17,23,0.7)] px-5 pt-[60px] pb-5 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-bg2 px-5 py-4">
              <div className="flex items-center gap-2 text-[15px] font-semibold [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-accent [&>svg]:[stroke-width:1.8]">
                <Ruler />
                BMI 對照（台灣標準）
              </div>
              <button
                onClick={() => setBmiOpen(false)}
                aria-label="關閉"
                className="flex cursor-pointer rounded border-none bg-transparent p-1 text-text-muted transition-all hover:bg-bg2 hover:text-text [&>svg]:h-4 [&>svg]:w-4 [&>svg]:[stroke-width:2]"
              >
                <X />
              </button>
            </div>
            <div className="px-5 py-[18px]">
              <div className="mb-3.5 flex flex-wrap gap-3">
                <div className="min-w-[140px] flex-1">
                  <label htmlFor="bmiHeight" className="mb-1 block text-xs text-text-muted">
                    身高 (cm)
                  </label>
                  <input
                    type="number"
                    id="bmiHeight"
                    step="0.5"
                    min="100"
                    max="220"
                    placeholder="例：165"
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(e.target.value)}
                    autoFocus
                    className="w-full rounded-md border border-border bg-bg2 px-2.5 py-[7px] text-[14px] text-text focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="min-w-[140px] flex-1">
                  <label htmlFor="bmiCurrentWt" className="mb-1 block text-xs text-text-muted">
                    目前體重 (kg)
                    <span className="font-normal text-text-dim">（選填）</span>
                  </label>
                  <input
                    type="number"
                    id="bmiCurrentWt"
                    step="0.1"
                    min="20"
                    max="300"
                    placeholder="例：80"
                    value={bmiWt}
                    onChange={(e) => setBmiWt(e.target.value)}
                    className="w-full rounded-md border border-border bg-bg2 px-2.5 py-[7px] text-[14px] text-text focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div
                className={cn(
                  'mb-3.5 flex items-center rounded-lg border border-border bg-bg2 px-3.5 py-2.5 text-[13px]',
                  bmi.current ? 'justify-between' : 'justify-center text-text-dim',
                )}
              >
                {bmi.current ? (
                  <>
                    <span>目前 BMI</span>
                    <span className="font-mono text-[18px] font-semibold text-accent">{bmi.current.bmi.toFixed(1)}</span>
                    <span className="rounded bg-surface2 px-2.5 py-[3px] text-xs text-text-muted">{bmi.current.cat}</span>
                  </>
                ) : (
                  bmi.currentHint
                )}
              </div>

              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['分級', 'BMI', '對應體重'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-border bg-bg2 px-2.5 py-[7px] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bmi.rows ? (
                    bmi.rows.map((r) => (
                      <tr key={r.label} className={r.highlight ? '[&>td]:bg-accent-dim [&>td]:text-accent' : ''}>
                        <td className={cn('border-b border-border px-2.5 py-[7px] text-xs text-text-muted', r.highlight && 'font-semibold')}>
                          {r.label}
                        </td>
                        <td className="border-b border-border px-2.5 py-[7px] font-mono font-semibold text-text">{r.bmiStr}</td>
                        <td className="border-b border-border px-2.5 py-[7px] font-mono text-text">{r.wtStr}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="border-b border-border px-2.5 py-[18px] text-center text-text-dim">
                        先輸入身高
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {bmi.diff && (
                <div className="mt-3 rounded-md border border-green/25 bg-green/[0.06] px-3.5 py-2.5 text-[13px] text-[#b3d8b8]">
                  {bmi.diff}
                </div>
              )}
            </div>
            <div className="border-t border-border bg-bg2 px-5 pt-2.5 pb-3.5 text-[11px] leading-[1.6] text-text-dim">
              台灣標準（衛福部）：過重 24–27 · 輕度肥胖 27–30 · 中度肥胖 30–35 · 重度肥胖 ≥ 35
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Field id groups for reset ──
const INTAKE_IDS = {
  text: [
    'motivation', 'goal-wt', 'goal-time', 'goal-note', 'max-wt', 'max-wt-when', 'min-wt', 'onset',
    'cycling-times', 'prev-method', 'event-note', 'med-detail', 'endo-note', 'cm-note', 'sym-note',
    'fh-note', 'cook-person', 'pattern-note', 'sugary-freq', 'alc-amount', 'content-note', 'beh-note',
    'exercise-type', 'exercise-freq', 'exercise-dur', 'act-limit-detail', 'sleep-hr', 'sleep-note',
    'work-type', 'psy-note', 'waist', 'neck', 'pe-note', 'calf', 'grip', 'sts', 'walk',
  ],
  flags: [
    'weight-cycling', ...EVENTS, ...OBESO_MEDS, ...ENDO, ...COMORBID, ...WSYMPTOMS, ...FAMILY,
    ...DIET_PATTERN, ...DIET_CONTENT, ...DIET_BEH, ...PSYCHO, ...PE_SKIN, ...PE_HEADNECK, ...PE_CARDIO,
    'ls-sedentary', 'ls-act-limit', 'ls-shift', 'ls-irreg',
  ].map((x) => (typeof x === 'string' ? x : x.f)),
  radios: ['sex', 'eat-out', 'intensity', 'sleep-q', 'support'],
}

const FU_IDS = {
  text: [
    'fu-wt', 'fu-wt-prev', 'fu-wt-start', 'fu-waist', 'fu-waist-prev', 'fu-med-detail', 'fu-med-note',
    'fu-ae-note', 'fu-ls-note', 'fu-lab-note', 'fu-plan-note',
  ],
  flags: [
    'fu-med-glp1', 'fu-med-orlistat', 'fu-med-pb', 'fu-med-none', 'fu-self-pay', 'fu-lab-followup',
    ...FU_AE, ...FU_PLAN,
  ].map((x) => (typeof x === 'string' ? x : x.f)),
  radios: ['fu-trend', 'fu-adh', 'fu-diet', 'fu-exer'],
}
