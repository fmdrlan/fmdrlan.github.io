import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardPaste, X } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  calcTaiwan,
  calcESC,
  calcAHA,
  calcNHI,
  calcStatinNHISimple,
  computeEffectiveLDL,
  CV_ITEMS,
  NCKU_TABLE1_DRUGS,
  parseLisPaste,
  type LipidInput,
  type NhiSimpleInput,
  type Sex,
} from '@/lib/lipid-engine'

export const Route = createFileRoute('/lipid')({
  component: LipidPage,
})

const num = (v: string): number | null => parseFloat(v) || null

function LipidPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[1200px] px-6 py-8 max-md:px-3 max-md:py-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">高血脂風險評估</h1>
          <p className="mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-text-muted">
            輸入病人基本資料與檢驗值，依台灣 2025、ESC 2025、AHA 2026 PREVENT 三大指引分類風險、計算 LDL 目標，並判斷健保給付資格。
          </p>
        </div>

        <Tabs defaultValue="full" className="gap-6">
          <TabsList variant="line" className="w-full justify-start border-b border-border">
            <TabsTrigger value="full" className="flex-none">
              完整版（3 大指引 + 健保）
            </TabsTrigger>
            <TabsTrigger value="nhi" className="flex-none">
              簡化版（只看健保 statin）
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full">
            <FullVersion />
          </TabsContent>
          <TabsContent value="nhi">
            <SimpleVersion />
          </TabsContent>
        </Tabs>

        <footer className="mt-8 text-center text-xs leading-[1.9] text-text-light">
          資料來源：台灣脂質暨動脈硬化學會 2025 ｜ ESC CVD Prevention 2024 ｜ AHA 2026 PREVENT ｜ 健保藥品給付規定第 2.6 節（115/9/1 修訂，健保審字第1150671962號）
          <br />
          ⚠️ 本工具僅供醫護人員臨床參考，不取代個別病人評估與醫師判斷。
        </footer>
      </main>
    </>
  )
}

// ════════════════════════════════════════════════════════════
//  Full version
// ════════════════════════════════════════════════════════════
interface FullForm {
  age: string
  sex: Sex
  tc: string
  ldl: string
  hdl: string
  tg: string
  tgmed: number
  sbp: string
  dbp: string
  bpmed: number
  htn: number
  fpg: string
  hba1c: string
  dmmed: number
  dm: number
  egfr: string
  uacr: string
  waist: string
  smoking: number
  fh: number
  fhcad: number
  ascvd: number
  ascvdTypes: string[]
  ascvd_multi: number
  imaging_stenosis: number
  cac: string
  lpa: string
  hscrp: string
  statin_drug: string
  statin_dose: string
  eze: number
}

const FULL_DEFAULTS: FullForm = {
  age: '', sex: 'M', tc: '', ldl: '', hdl: '', tg: '', tgmed: 0,
  sbp: '', dbp: '', bpmed: 0, htn: 0,
  fpg: '', hba1c: '', dmmed: 0, dm: 0,
  egfr: '', uacr: '', waist: '',
  smoking: 0, fh: 0, fhcad: 0,
  ascvd: 0, ascvdTypes: [], ascvd_multi: 0,
  imaging_stenosis: 0, cac: '', lpa: '', hscrp: '',
  statin_drug: '', statin_dose: '', eze: 0,
}

const ASCVD_TYPE_OPTIONS = [
  { val: 'ACS', label: '急性冠心症 ACS' },
  { val: 'MI_1yr', label: '一年內心肌梗塞' },
  { val: 'MI_multi', label: '≥2次心肌梗塞' },
  { val: 'PCI', label: 'PCI 介入' },
  { val: 'CABG', label: 'CABG 繞道' },
  { val: 'multivessel', label: '多支冠狀動脈阻塞' },
  { val: 'stroke', label: '缺血性中風/TIA' },
  { val: 'PAD', label: '周邊動脈病 PAD' },
  { val: 'carotid', label: '頸動脈狹窄' },
  { val: 'ACS_DM', label: 'ACS 合併糖尿病' },
]

const STATIN_DRUGS = [
  { value: '', label: '— 未使用 —' },
  { value: 'rosu', label: 'Rosuvastatin（可定）' },
  { value: 'ator', label: 'Atorvastatin（立普妥）' },
  { value: 'simva', label: 'Simvastatin' },
  { value: 'prava', label: 'Pravastatin' },
  { value: 'fluva', label: 'Fluvastatin' },
  { value: 'pitava', label: 'Pitavastatin' },
  { value: 'lova', label: 'Lovastatin' },
]

function FullVersion() {
  const [f, setF] = useState<FullForm>(FULL_DEFAULTS)
  const [lisOpen, setLisOpen] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const set = <K extends keyof FullForm>(k: K, v: FullForm[K]) => setF((p) => ({ ...p, [k]: v }))

  // Prefill from query string (lab.html "下一步" handoff)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.toString()) return
    const patch: Partial<FullForm> = {}
    for (const key of ['tc', 'ldl', 'hdl', 'tg', 'age', 'sbp', 'dbp'] as const) {
      const v = params.get(key)
      if (v) patch[key] = v
    }
    const sex = params.get('sex')
    if (sex && (sex.toUpperCase() === 'M' || sex.toUpperCase() === 'F')) patch.sex = sex.toUpperCase() as Sex
    if (Object.keys(patch).length) setF((p) => ({ ...p, ...patch }))
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  const tc = num(f.tc), hdl = num(f.hdl), tg = num(f.tg)
  const eff = computeEffectiveLDL(tc, hdl, tg, num(f.ldl))
  const nonHDL = tc && hdl ? tc - hdl : null
  const showCalcLdl = !num(f.ldl) && tc && hdl && tg

  const p: LipidInput = useMemo(() => {
    const fpg = num(f.fpg), hba1c = num(f.hba1c)
    const dm = f.dm || (fpg && fpg >= 126) || (hba1c && hba1c >= 6.5) ? 1 : 0
    return {
      age: num(f.age), sex: f.sex, tc, ldl: eff.value, ldlSource: eff.source, hdl, tg,
      tgmed: f.tgmed, sbp: num(f.sbp), dbp: num(f.dbp), bpMed: f.bpmed, egfr: num(f.egfr),
      uacr: num(f.uacr), waist: num(f.waist), smoking: f.smoking, htn: f.htn, fh: f.fh,
      fhcad: f.fhcad, dm, ascvd: f.ascvd, ascvd_multi: f.ascvd_multi,
      imaging_stenosis: f.imaging_stenosis, ascvdTypes: f.ascvdTypes, cac: num(f.cac),
      lpa: num(f.lpa), hscrp: num(f.hscrp), statin: f.statin_drug, statinDose: f.statin_dose,
      eze: f.eze, fpg, hba1c, dmMed: f.dmmed,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, tc, hdl, tg, eff.value, eff.source])

  const canCalc = num(f.age) != null
  const cards = useMemo(() => {
    if (!canCalc) return null
    return { nhi: calcNHI(p), tw: calcTaiwan(p), esc: calcESC(p), aha: calcAHA(p) }
  }, [p, canCalc])

  const applyLis = (fields: Record<string, { value: number | string }>) => {
    const patch: Partial<FullForm> = {}
    for (const id of ['age', 'tc', 'hdl', 'ldl', 'tg', 'fpg', 'hba1c', 'egfr', 'uacr'] as const) {
      if (fields[id]) patch[id] = String(fields[id].value)
    }
    if (fields.sex) patch.sex = fields.sex.value as Sex
    setF((prev) => ({ ...prev, ...patch }))
  }

  const jumpToResults = () => {
    const el = resultsRef.current
    if (!el) return
    const top = window.scrollY + el.getBoundingClientRect().top - window.innerHeight * 0.12
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      {/* Input panel (full width) */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-text">病人資料輸入</div>
          <PasteButton onClick={() => setLisOpen(true)} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-3">
          {/* 基本資料 */}
          <SectionLabel>基本資料</SectionLabel>
          <NumField label="年齡" unit="歲" value={f.age} onChange={(v) => set('age', v)} placeholder="例：65" />
          <Toggle label="性別" value={f.sex} onChange={(v) => set('sex', v as Sex)} options={[{ v: 'M', l: '男' }, { v: 'F', l: '女' }]} />

          {/* 血脂檢驗 */}
          <SectionLabel>血脂檢驗 <span className="font-normal text-text-light">(mg/dL)</span></SectionLabel>
          <NumField label="TC" unit="mg/dL" value={f.tc} onChange={(v) => set('tc', v)} placeholder="總膽固醇" />
          <NumField label="LDL-C" unit="mg/dL" value={f.ldl} onChange={(v) => set('ldl', v)} placeholder="壞膽固醇" />
          <NumField label="HDL-C" unit="mg/dL" value={f.hdl} onChange={(v) => set('hdl', v)} placeholder="好膽固醇" />
          <NumField label="TG" unit="mg/dL" value={f.tg} onChange={(v) => set('tg', v)} placeholder="三酸甘油酯" />
          <Toggle label="是否用 TG 血脂藥" tip="使用降 TG 藥物（如 fibrate、魚油）即符合代謝症候群 TG 偏高條件" value={f.tgmed} onChange={(v) => set('tgmed', v as number)} options={YN} />
          <Computed label="non-HDL-C" unit="mg/dL" hint="自動計算" value={nonHDL != null ? `${nonHDL.toFixed(0)} mg/dL` : '—'} />
          {showCalcLdl && (
            <Computed
              label="Calculated LDL"
              unit="mg/dL"
              tip="未實測 LDL 時，由 TC、HDL、TG 用 Friedewald 公式推算：LDL = TC − HDL − TG/5。TG ≥ 400 mg/dL 時公式不適用，建議實測 LDL。"
              value={tg! >= 400 ? 'TG ≥400 不適用' : eff.value != null ? `${eff.value} mg/dL` : '異常'}
              warn={tg! >= 400 || eff.value == null}
            />
          )}

          {/* 血壓 */}
          <SectionLabel>血壓</SectionLabel>
          <NumField label="收縮壓" unit="mmHg" value={f.sbp} onChange={(v) => set('sbp', v)} placeholder="SBP" />
          <NumField label="舒張壓" unit="mmHg" tip="代謝症候群判斷：舒張壓 ≥85 mmHg 或使用降壓藥即符合" value={f.dbp} onChange={(v) => set('dbp', v)} placeholder="DBP" />
          <Toggle label="是否用降壓藥" value={f.bpmed} onChange={(v) => set('bpmed', v as number)} options={YN} />
          <Toggle label="高血壓診斷" value={f.htn} onChange={(v) => set('htn', v as number)} options={YN} />

          {/* 血糖代謝 */}
          <SectionLabel>血糖代謝</SectionLabel>
          <NumField label="空腹血糖" unit="mg/dL" hint="擇一" value={f.fpg} onChange={(v) => set('fpg', v)} placeholder="FPG" />
          <NumField label="HbA1c" unit="%" hint="擇一" value={f.hba1c} onChange={(v) => set('hba1c', v)} placeholder="糖化血色素" />
          <Toggle label="是否用降血糖藥" value={f.dmmed} onChange={(v) => set('dmmed', v as number)} options={YN} />
          <Toggle label="糖尿病 (DM)" value={f.dm} onChange={(v) => set('dm', v as number)} options={YN} />

          {/* 腎功能 */}
          <SectionLabel>腎功能</SectionLabel>
          <NumField label="eGFR" unit="mL/min/1.73m²" value={f.egfr} onChange={(v) => set('egfr', v)} placeholder="估算腎絲球過濾率" />
          <NumField label="UACR" unit="mg/g" tip="尿液白蛋白肌酸酐比值 ≥30 mg/g 符合慢性腎臟病定義，可影響台灣指引風險分級" value={f.uacr} onChange={(v) => set('uacr', v)} placeholder="尿白蛋白/肌酸酐" />

          {/* 代謝症候群 */}
          <SectionLabel tip="符合以下 ≥3 項即為代謝症候群（台灣 2025 低/中風險危險因子之一）：腹部肥胖、血壓偏高/用藥、血糖偏高/用藥、TG 偏高/用藥、HDL-C 偏低。系統將自動根據您填入的數值判斷。">代謝症候群</SectionLabel>
          <NumField label="腰圍" unit="cm" tip="代謝症候群腹部肥胖切點：男性 ≥90 cm、女性 ≥80 cm" value={f.waist} onChange={(v) => set('waist', v)} placeholder="腰圍" />

          {/* 危險因子 & 病史 */}
          <SectionLabel>危險因子 &amp; 病史</SectionLabel>
          <Toggle label="抽菸" value={f.smoking} onChange={(v) => set('smoking', v as number)} options={YN} />
          <Toggle label="家族性高膽固醇 (FH)" value={f.fh} onChange={(v) => set('fh', v as number)} options={YN} />
          <Toggle label="早發冠心病家族史" tip="男性親屬 <55 歲、女性親屬 <65 歲發生冠心病（CAD）即屬早發。" value={f.fhcad} onChange={(v) => set('fhcad', v as number)} options={YN} />

          {/* 臨床 ASCVD */}
          <SectionLabel tip="包含：急性冠心症（ACS）、心肌梗塞、穩定性冠心病、經皮冠狀動脈介入（PCI）、冠狀動脈繞道手術（CABG）、缺血性中風/TIA、周邊動脈疾病（PAD，含踝臂指數 <0.9）">臨床 ASCVD</SectionLabel>
          <Toggle label="有無臨床 ASCVD" value={f.ascvd} onChange={(v) => set('ascvd', v as number)} options={[{ v: 0, l: '無' }, { v: 1, l: '有' }]} />
          {f.ascvd === 1 && (
            <div className="col-span-2">
              <div className="mb-1.5 text-[11px] text-text-muted">ASCVD 類型（可複選）</div>
              <div className="flex flex-wrap gap-1.5">
                {ASCVD_TYPE_OPTIONS.map((o) => {
                  const on = f.ascvdTypes.includes(o.val)
                  return (
                    <button
                      key={o.val}
                      type="button"
                      onClick={() => set('ascvdTypes', on ? f.ascvdTypes.filter((t) => t !== o.val) : [...f.ascvdTypes, o.val])}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        on ? 'border-accent bg-accent-dim text-accent' : 'border-border bg-surface2 text-text-muted hover:border-accent/40'
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3">
                <Toggle
                  label="有無多次/多部位 ASCVD 事件（極高風險判斷）"
                  value={f.ascvd_multi}
                  onChange={(v) => set('ascvd_multi', v as number)}
                  options={[{ v: 0, l: '無（單次事件）' }, { v: 1, l: '有（多次或多部位）' }]}
                />
              </div>
            </div>
          )}

          {/* 影像學檢查 */}
          <SectionLabel tip="影像確認有顯著斑塊負擔（≥50% 直徑狹窄）即達非常高風險，包含：冠狀動脈攝影、CTA、頸動脈或周邊血管超音波">影像學檢查</SectionLabel>
          <div className="col-span-2">
            <Toggle
              label="影像確認 ≥50% 冠狀動脈/頸動脈/周邊血管狹窄"
              value={f.imaging_stenosis}
              onChange={(v) => set('imaging_stenosis', v as number)}
              options={[{ v: 0, l: '無/未做' }, { v: 1, l: '是，有 ≥50% 狹窄' }]}
            />
          </div>

          {/* 進階指標 */}
          <SectionLabel tip="CAC ≥400 分（台灣 2025 高風險條件之一）；CAC ≥100 或 Lp(a) ≥50 mg/dL 或 hsCRP ≥2 mg/L 任一陽性，可將低/中風險上調一級。">進階指標</SectionLabel>
          <NumField label="CAC 分數" tip="≥400 分：台灣 2025 直接列為高風險條件；≥100 分：低/中風險者上移一級" value={f.cac} onChange={(v) => set('cac', v)} placeholder="Agatston 分" />
          <NumField label="Lp(a)" unit="mg/dL" value={f.lpa} onChange={(v) => set('lpa', v)} />
          <NumField label="hsCRP" unit="mg/L" value={f.hscrp} onChange={(v) => set('hscrp', v)} />

          {/* 目前用藥 */}
          <SectionLabel>目前用藥</SectionLabel>
          <SelectField label="是否使用 Statin" value={f.statin_drug} onChange={(v) => set('statin_drug', v)} options={STATIN_DRUGS} />
          <SelectField
            label="劑量"
            value={f.statin_dose}
            onChange={(v) => set('statin_dose', v)}
            options={[{ value: '', label: '劑量' }, { value: 'low', label: '低強度' }, { value: 'moderate', label: '中強度' }, { value: 'high', label: '高強度' }]}
          />
          <Toggle label="Ezetimibe" value={f.eze} onChange={(v) => set('eze', v as number)} options={YN} />

          {/* 動作列 */}
          <div className="col-span-full mt-2 flex flex-col items-stretch gap-2">
            <div className="text-center text-[12px] text-text-light">輸入欄位後自動計算結果</div>
            <div className="flex justify-center gap-2">
              <button type="button" onClick={jumpToResults} disabled={!canCalc} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50">
                ↓ 跳至結果
              </button>
              <button type="button" onClick={() => setF(FULL_DEFAULTS)} className="rounded-lg border border-border bg-surface2 px-4 py-2 text-sm text-text-muted transition-colors hover:text-text">
                ↺ 重設
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results (below the form) */}
      <div ref={resultsRef}>
        {!canCalc ? (
          <EmptyState text="輸入年齡與性別後，結果會自動顯示在下方" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ResultCard label="健保署" name="給付資格判斷" html={cards!.nhi} accent />
            <ResultCard label="台灣" name="2025 血脂指引" html={cards!.tw} />
            <ResultCard label="歐洲心臟學會" name="ESC 2024/2025" html={cards!.esc} />
            <ResultCard label="美國心臟學會" name="AHA 2026 Dyslipidemia" html={cards!.aha} />
          </div>
        )}
      </div>

      <LisPasteModal open={lisOpen} onClose={() => setLisOpen(false)} onApply={applyLis} extraMissing="SBP / DBP（血壓）" />
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Simple version
// ════════════════════════════════════════════════════════════
interface SimpleForm {
  age: string
  sex: Sex
  tc: string
  ldl: string
  hdl: string
  tg: string
  egfr: string
  uacr: string
  cvItems: string[]
  dm: number
  cacOver400: number
  htn: number
  fhcad: number
  smoking: number
  waist: string
  bpHigh: number
  fpgHigh: number
  tgMed: number
}
const SIMPLE_DEFAULTS: SimpleForm = {
  age: '', sex: 'M', tc: '', ldl: '', hdl: '', tg: '', egfr: '', uacr: '',
  cvItems: [], dm: 0, cacOver400: 0, htn: 0, fhcad: 0, smoking: 0,
  waist: '', bpHigh: 0, fpgHigh: 0, tgMed: 0,
}

function SimpleVersion() {
  const [f, setF] = useState<SimpleForm>(SIMPLE_DEFAULTS)
  const [lisOpen, setLisOpen] = useState(false)
  const set = <K extends keyof SimpleForm>(k: K, v: SimpleForm[K]) => setF((p) => ({ ...p, [k]: v }))

  // 勾選血管疾病項目；取消時一併清掉其子項，避免留下「一年內」卻沒有心肌梗塞
  const setCv = (val: string, on: number) =>
    setF((p) => {
      if (on) return { ...p, cvItems: p.cvItems.includes(val) ? p.cvItems : [...p.cvItems, val] }
      const descendants = new Set([val])
      let grew = true
      while (grew) {
        grew = false
        for (const item of CV_ITEMS) {
          if (item.parent && descendants.has(item.parent) && !descendants.has(item.val)) {
            descendants.add(item.val)
            grew = true
          }
        }
      }
      return { ...p, cvItems: p.cvItems.filter((t) => !descendants.has(t)) }
    })

  const tc = num(f.tc), hdl = num(f.hdl), tg = num(f.tg)
  const eff = computeEffectiveLDL(tc, hdl, tg, num(f.ldl))
  const showCalcLdl = !num(f.ldl) && tc && hdl && tg

  const result = useMemo(() => {
    if (!num(f.age)) return null
    const input: NhiSimpleInput = {
      age: num(f.age), sex: f.sex, tc, ldl: eff.value, ldlSource: eff.source, hdl,
      egfr: num(f.egfr), uacr: num(f.uacr),
      tg, cvItems: f.cvItems, dm: f.dm, cacOver400: f.cacOver400,
      htn: f.htn, fhcad: f.fhcad, smoking: f.smoking,
      waist: num(f.waist), bpHigh: f.bpHigh, fpgHigh: f.fpgHigh, tgMed: f.tgMed,
    }
    return calcStatinNHISimple(input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, tc, hdl, eff.value, eff.source])

  const applyLis = (fields: Record<string, { value: number | string }>) => {
    const patch: Partial<SimpleForm> = {}
    for (const id of ['age', 'tc', 'hdl', 'ldl', 'tg', 'egfr', 'uacr'] as const) {
      if (fields[id]) patch[id] = String(fields[id].value)
    }
    if (fields.sex) patch.sex = fields.sex.value as Sex
    setF((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-text">病人資料輸入</div>
          <PasteButton onClick={() => setLisOpen(true)} />
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-x-4 gap-y-3">
          <SectionLabel>基本資料</SectionLabel>
          <NumField label="年齡" unit="歲" value={f.age} onChange={(v) => set('age', v)} placeholder="例：65" />
          <Toggle label="性別" value={f.sex} onChange={(v) => set('sex', v as Sex)} options={[{ v: 'M', l: '男' }, { v: 'F', l: '女' }]} />

          <SectionLabel>檢驗值 <span className="font-normal text-text-light">（可從 LIS 貼上自動填入）</span></SectionLabel>
          <NumField label="TC" unit="mg/dL" value={f.tc} onChange={(v) => set('tc', v)} placeholder="總膽固醇" />
          <NumField label="LDL-C" unit="mg/dL" value={f.ldl} onChange={(v) => set('ldl', v)} placeholder="壞膽固醇" />
          <NumField label="HDL-C" unit="mg/dL" value={f.hdl} onChange={(v) => set('hdl', v)} placeholder="好膽固醇" />
          <NumField label="TG" unit="mg/dL" value={f.tg} onChange={(v) => set('tg', v)} placeholder="三酸甘油酯" />
          <NumField label="eGFR" unit="mL/min/1.73m²" tip="eGFR <60 或 UACR ≥30 mg/g 持續 ≥3 個月 → CKD，歸類高風險（起始 LDL-C ≥100）" value={f.egfr} onChange={(v) => set('egfr', v)} placeholder="估算腎絲球過濾率" />
          <NumField label="UACR" unit="mg/g" value={f.uacr} onChange={(v) => set('uacr', v)} placeholder="尿白蛋白/肌酸酐" />
          {showCalcLdl && (
            <Computed
              label="Calculated LDL"
              unit="mg/dL"
              tip="未實測 LDL 時用 Friedewald 公式推算：LDL = TC − HDL − TG/5。TG ≥ 400 時不適用。"
              value={tg! >= 400 ? 'TG ≥400 不適用' : eff.value != null ? `${eff.value} mg/dL` : '異常'}
              warn={tg! >= 400 || eff.value == null}
            />
          )}

          <SectionLabel>心血管病史（勾選臨床事實，風險分級由系統判定）</SectionLabel>
          <div className="col-span-full grid gap-2.5 md:grid-cols-2">
            {CV_ITEMS.filter((o) => !o.parent).map((top) => {
              const kids = CV_ITEMS.filter((c) => c.parent === top.val)
              return (
                <div key={top.val} className="rounded-lg border border-border bg-bg2/40 p-2.5">
                  <Toggle
                    label={top.label}
                    tip={top.tip}
                    value={f.cvItems.includes(top.val) ? 1 : 0}
                    onChange={(v) => setCv(top.val, v as number)}
                    options={YN}
                  />
                  {f.cvItems.includes(top.val) && kids.length > 0 && (
                    <div className="mt-2.5 grid gap-2.5 border-l-2 border-border pl-2.5 sm:grid-cols-2">
                      {kids.map((kid) => {
                        const grandKids = CV_ITEMS.filter((g) => g.parent === kid.val)
                        return (
                          <div key={kid.val} className={grandKids.length ? 'sm:col-span-2' : undefined}>
                            <Toggle
                              label={kid.label}
                              tip={kid.tip}
                              value={f.cvItems.includes(kid.val) ? 1 : 0}
                              onChange={(v) => setCv(kid.val, v as number)}
                              options={YN}
                            />
                            {f.cvItems.includes(kid.val) && grandKids.length > 0 && (
                              <div className="mt-2.5 grid gap-2.5 border-l-2 border-border pl-2.5 sm:grid-cols-2">
                                {grandKids.map((g) => (
                                  <Toggle
                                    key={g.val}
                                    label={g.label}
                                    tip={g.tip}
                                    value={f.cvItems.includes(g.val) ? 1 : 0}
                                    onChange={(v) => setCv(g.val, v as number)}
                                    options={YN}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            <div className="text-[11px] leading-relaxed text-text-light md:col-span-2">
              極高風險＝冠狀動脈疾病或周邊動脈疾病，再合併「一年內 MI／≥2 次 MI／多支阻塞／ACS＋糖尿病／另一血管床」；未合併者為非常高風險。
            </div>
          </div>
          <Toggle label="糖尿病" value={f.dm} onChange={(v) => set('dm', v as number)} options={YN} />
          <Toggle label="CAC ≥400" tip="冠狀動脈鈣化分數 ≥400 → 高風險（起始 LDL-C ≥100）" value={f.cacOver400} onChange={(v) => set('cacOver400', v as number)} options={YN} />

          <SectionLabel>心血管風險因子（6 項）</SectionLabel>
          <Toggle label="高血壓" value={f.htn} onChange={(v) => set('htn', v as number)} options={YN} />
          <Toggle label="早發 CAD 家族史" tip="男性 ≦ 55 歲、女性 ≦ 65 歲一等親有冠心病" value={f.fhcad} onChange={(v) => set('fhcad', v as number)} options={YN} />
          <Toggle label="吸菸" value={f.smoking} onChange={(v) => set('smoking', v as number)} options={YN} />
          <SectionLabel>代謝症候群組成（符合 ≥3 項即計為 1 個風險因子）</SectionLabel>
          <NumField label="腰圍" unit="cm" value={f.waist} onChange={(v) => set('waist', v)} placeholder={f.sex === 'M' ? '男 ≥90' : '女 ≥80'} />
          <Toggle label="血壓 ≥130/85" tip="血壓 ≥130/85 mmHg 或正在使用高血壓藥物；已勾高血壓者自動計入" value={f.bpHigh} onChange={(v) => set('bpHigh', v as number)} options={YN} />
          <Toggle label="空腹血糖 ≥100" tip="空腹血糖 ≥100 mg/dL 或正在使用糖尿病藥物；已勾糖尿病者自動計入" value={f.fpgHigh} onChange={(v) => set('fpgHigh', v as number)} options={YN} />
          <Toggle label="降 TG 藥物" tip="正在使用降三酸甘油酯藥物；TG ≥150 mg/dL 會由上方 TG 欄位自動判定" value={f.tgMed} onChange={(v) => set('tgMed', v as number)} options={YN} />

          <div className="col-span-full mt-2 flex justify-end">
            <button type="button" onClick={() => setF(SIMPLE_DEFAULTS)} className="rounded-lg border border-border bg-surface2 px-3.5 py-1.5 text-sm text-text-muted transition-colors hover:text-text">
              ↺ 重設
            </button>
          </div>
        </div>
      </div>

      <div>
        {!result ? <EmptyState text="輸入年齡、性別、TC 或 LDL-C，結果會自動顯示在下方" /> : <SimpleResultCard r={result} />}
      </div>

      <LisPasteModal open={lisOpen} onClose={() => setLisOpen(false)} onApply={applyLis} />
    </div>
  )
}

const YN = [{ v: 0, l: '否' }, { v: 1, l: '是' }]

function RuleCard({
  title, sub, covered, start, target, nonhdl,
}: {
  title: string
  sub: string
  covered: boolean
  start: string
  target: string
  nonhdl?: string
}) {
  return (
    <div className={`rounded-xl border p-4 ${covered ? 'border-green/40 bg-green/[0.05]' : 'border-border bg-surface'}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-text">{title}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${covered ? 'bg-green/15 text-green' : 'bg-surface2 text-text-muted'}`}>
          {covered ? '符合' : '不符合'}
        </span>
      </div>
      <div className="mb-2.5 text-[12.5px] leading-relaxed text-text-muted">{sub}</div>
      <div className="space-y-1 text-[13px]">
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">起始治療</span>
          <span className="font-medium text-text">{start}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-text-muted">治療目標</span>
          <span className="font-medium text-accent">{target}</span>
        </div>
        {nonhdl && (
          <div className="flex justify-between gap-3">
            <span className="text-text-muted">次要目標</span>
            <span className="font-medium text-accent">{nonhdl}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SimpleResultCard({ r }: { r: ReturnType<typeof calcStatinNHISimple> }) {
  const t2 = r.table2
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <RuleCard
          title="表一（新制）"
          sub={r.category}
          covered={r.covered}
          start={`LDL-C ≥ ${r.ldlThreshold} mg/dL`}
          target={`LDL-C < ${r.ldlThreshold} mg/dL`}
          nonhdl={r.nonhdlTarget ? `non-HDL-C < ${r.nonhdlTarget} mg/dL` : undefined}
        />
        <RuleCard
          title="表二（舊制）"
          sub={t2.category}
          covered={t2.covered}
          start={t2.tcThreshold ? `LDL-C ≥ ${t2.ldlThreshold} 或 TC ≥ ${t2.tcThreshold} mg/dL` : `LDL-C ≥ ${t2.ldlThreshold} mg/dL`}
          target={t2.tcThreshold ? `LDL-C < ${t2.ldlThreshold} 或 TC < ${t2.tcThreshold} mg/dL` : `LDL-C < ${t2.ldlThreshold} mg/dL`}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2 text-sm font-semibold text-text">成大院內適用新制（表一）品項</div>
        <div className="grid gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2">
          {NCKU_TABLE1_DRUGS.map((d) => (
            <div key={d.brand} className="flex items-baseline gap-1.5">
              <span className="text-text">{d.brand} {d.dose}</span>
              <span className="text-[12px] text-text-light">{d.generic}</span>
            </div>
          ))}
        </div>
      </div>

      <details className="rounded-xl border border-border bg-surface px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-medium text-text-muted hover:text-text">詳細判斷依據</summary>
        <div className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-text-muted">
          <div>
            {r.reasons.map((t, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: `• ${t}` }} />
            ))}
            {r.rfCount > 0 && <div>• 心血管風險因子（{r.rfCount}/6）：{r.rfItems.join('、')}</div>}
            {r.severityNotes.map((t, i) => (
              <div key={`s${i}`} className="text-yellow">• {t}</div>
            ))}
          </div>
          <div className="border-t border-border pt-2">
            <div className="mb-0.5 text-text">
              代謝症候群 {r.metSynCount}/5 項 → {r.metSynPositive ? '成立，計為 1 個風險因子' : '不成立（需 ≥3 項）'}
            </div>
            {r.metSynItems.map((m, i) => (
              <div key={i} className="pl-3">
                <span className={m.met ? 'text-green' : 'text-text-light'}>{m.met ? '✓' : '○'}</span>{' '}
                <span className={m.met ? '' : 'text-text-light'}>{m.label}</span>
                {m.note && <span className="ml-1 text-text-light">（{m.note}）</span>}
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2">
            <div className="mb-0.5 text-text">表一處方規定與追蹤時程{r.needLifestyle ? '（中／低風險）' : '（高風險以上）'}</div>
            {r.schedule.map((t, i) => (
              <div key={i} className="pl-3">{i + 1}. {t}</div>
            ))}
          </div>
        </div>
      </details>
    </div>
  )
}

function InfoTip({ tip }: { tip: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <button
        type="button"
        aria-label="說明"
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-accent/35 bg-accent/[0.18] text-[10px] font-bold not-italic leading-none text-accent"
      >
        !
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-[280px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border border-accent/30 bg-[#1c2740] px-3 py-2 text-[13px] font-normal leading-relaxed text-text opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.55)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {tip}
      </span>
    </span>
  )
}

function FieldLabel({ label, unit, hint, tip }: { label: React.ReactNode; unit?: string; hint?: string; tip?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-text-muted">
      <span>{label}</span>
      {unit && <span className="text-text-light">{unit}</span>}
      {hint && <span className="text-accent/70">{hint}</span>}
      {tip && <InfoTip tip={tip} />}
    </span>
  )
}

function SectionLabel({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <div className="col-span-full mb-1 mt-4 flex items-center border-b border-border pb-1 text-xs font-semibold text-text-muted first:mt-0">
      {children}
      {tip && <InfoTip tip={tip} />}
    </div>
  )
}

function NumField({ label, unit, hint, tip, value, onChange, placeholder }: { label: string; unit?: string; hint?: string; tip?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel label={label} unit={unit} hint={hint} tip={tip} />
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg2 px-2.5 py-1.5 text-sm text-text placeholder:text-text-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
      />
    </label>
  )
}

function Computed({ label, unit, hint, tip, value, warn }: { label: string; unit?: string; hint?: string; tip?: string; value: string; warn?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} unit={unit} hint={hint} tip={tip} />
      <div className={`rounded-lg border border-dashed border-border bg-bg2 px-2.5 py-1.5 text-sm ${warn ? 'text-yellow' : 'text-text'}`}>{value}</div>
    </div>
  )
}

function Toggle<T extends string | number>({ label, tip, hint, value, onChange, options }: { label: string; tip?: string; hint?: string; value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel label={label} tip={tip} hint={hint} />
      <div className="flex rounded-lg border border-border bg-bg2 p-0.5">
        {options.map((o) => (
          <button
            key={String(o.v)}
            type="button"
            onClick={() => onChange(o.v)}
            className={`flex-1 rounded-md px-2 py-1 text-[13px] transition-colors ${value === o.v ? 'bg-accent text-bg font-medium' : 'text-text-muted hover:text-text'}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg2 px-2.5 py-1.5 text-sm text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border bg-surface/50 px-5 py-16 text-center text-sm text-text-muted">{text}</div>
}

function PasteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface2 px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent/40 hover:text-accent"
    >
      <ClipboardPaste className="h-3.5 w-3.5" strokeWidth={1.8} />
      從 LIS 貼上自動填入
    </button>
  )
}

function ResultCard({ label, name, html, accent }: { label: string; name: string; html: string; accent?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-xl border bg-surface ${accent ? 'border-accent/40' : 'border-border'}`}>
      <div className={`flex items-baseline gap-2 border-b border-border px-4 py-2.5 ${accent ? 'bg-accent/[0.06]' : ''}`}>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-light">{label}</span>
        <span className="text-sm font-semibold text-text">{name}</span>
      </div>
      <div className="lipid-result px-4 py-3" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}

// ── LIS paste modal ──
function LisPasteModal({
  open,
  onClose,
  onApply,
  extraMissing,
}: {
  open: boolean
  onClose: () => void
  onApply: (fields: Record<string, { value: number | string }>) => void
  extraMissing?: string
}) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => (text.trim() ? parseLisPaste(text) : null), [text])

  useEffect(() => {
    if (!open) setText('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const fieldEntries = parsed ? Object.entries(parsed.fields) : []
  const haveLdl = !!parsed?.fields.ldl
  const haveTcHdl = !!(parsed?.fields.tc && parsed?.fields.hdl)
  const missing: string[] = []
  if (!haveLdl && haveTcHdl) missing.push('LDL-C（將自動推算）')
  if (!haveLdl && !haveTcHdl) missing.push('LDL-C')
  if (extraMissing) missing.push(extraMissing)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-border bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <ClipboardPaste className="h-4 w-4 text-accent" strokeWidth={1.8} />
            從 LIS 貼上自動填入
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 rounded-lg border border-green/25 bg-green/[0.08] px-3 py-2.5 text-[12.5px] leading-relaxed text-text-muted">
            🔒 貼上的內容僅在本機瀏覽器處理，<b className="text-text">不會上傳到任何伺服器</b>。按完「填入」後 textarea 會自動清空。
          </div>
          <div className="mb-2 text-[12.5px] leading-relaxed text-text-muted">
            從成大醫院 LIS（檢驗報告查詢）<b className="text-text">Ctrl + A 全選 → Ctrl + C 複製</b>，然後在下方貼上：
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            spellCheck={false}
            placeholder="在這裡 Ctrl + V 貼上 LIS 全選複製的內容..."
            className="h-40 w-full resize-y rounded-lg border border-border bg-bg2 px-3 py-2.5 font-mono text-[13px] text-text placeholder:text-text-light focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />

          <div className="mt-3 rounded-lg border border-border bg-bg2 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-light">
              偵測結果{fieldEntries.length > 0 ? `（${fieldEntries.length} 個欄位）` : ''}
            </div>
            {fieldEntries.length === 0 ? (
              <div className="text-xs text-text-muted">{parsed === null ? '貼上 LIS 內容後，自動顯示能填入的欄位' : '未在貼上內容中找到任何已知欄位'}</div>
            ) : (
              <div className="space-y-1">
                {fieldEntries.map(([id, fld]) => (
                  <div key={id} className="flex items-center gap-2 text-[13px]">
                    <span className="text-green">✓</span>
                    <span className="min-w-[88px] text-text-muted">{fld.label}</span>
                    <span className="text-text">{fld.display ?? fld.value}{fld.unit ? ` ${fld.unit}` : ''}</span>
                  </div>
                ))}
                {missing.length > 0 && (
                  <div className="mt-2 border-t border-border pt-2 text-[11.5px] text-text-light">未提供：{missing.join('、')}</div>
                )}
              </div>
            )}
            {parsed?.warnings && parsed.warnings.length > 0 && (
              <div className="mt-2 text-[11.5px] text-yellow">{parsed.warnings.join(' / ')}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-border bg-surface2 px-3.5 py-1.5 text-sm text-text-muted hover:text-text">
            取消
          </button>
          <button
            type="button"
            disabled={fieldEntries.length === 0}
            onClick={() => {
              if (parsed) onApply(parsed.fields)
              onClose()
            }}
            className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-bg transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            填入欄位
          </button>
        </div>
      </div>
    </div>
  )
}
