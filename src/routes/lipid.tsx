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
          資料來源：台灣脂質暨動脈硬化學會 2025 ｜ ESC CVD Prevention 2024 ｜ AHA 2026 PREVENT ｜ 健保藥品給付規定第 2.6 節
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
  menopause: number
  tc: string
  ldl: string
  hdl: string
  tg: string
  ascvd: number
  dm: number
  htn: number
  fhcad: number
  smoking: number
}
const SIMPLE_DEFAULTS: SimpleForm = {
  age: '', sex: 'M', menopause: 0, tc: '', ldl: '', hdl: '', tg: '',
  ascvd: 0, dm: 0, htn: 0, fhcad: 0, smoking: 0,
}

function SimpleVersion() {
  const [f, setF] = useState<SimpleForm>(SIMPLE_DEFAULTS)
  const [lisOpen, setLisOpen] = useState(false)
  const set = <K extends keyof SimpleForm>(k: K, v: SimpleForm[K]) => setF((p) => ({ ...p, [k]: v }))

  const tc = num(f.tc), hdl = num(f.hdl), tg = num(f.tg)
  const eff = computeEffectiveLDL(tc, hdl, tg, num(f.ldl))
  const showCalcLdl = !num(f.ldl) && tc && hdl && tg

  const result = useMemo(() => {
    if (!num(f.age)) return null
    const input: NhiSimpleInput = {
      age: num(f.age), sex: f.sex, menopause: f.menopause, tc, ldl: eff.value, ldlSource: eff.source, hdl,
      ascvd: f.ascvd, dm: f.dm, htn: f.htn, fhcad: f.fhcad, smoking: f.smoking,
    }
    return calcStatinNHISimple(input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, tc, hdl, eff.value, eff.source])

  const applyLis = (fields: Record<string, { value: number | string }>) => {
    const patch: Partial<SimpleForm> = {}
    for (const id of ['age', 'tc', 'hdl', 'ldl', 'tg'] as const) {
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
          {f.sex === 'F' && <Toggle label="已停經" hint="（女性）" value={f.menopause} onChange={(v) => set('menopause', v as number)} options={YN} />}

          <SectionLabel>血脂檢驗 <span className="font-normal text-text-light">(mg/dL)</span></SectionLabel>
          <NumField label="TC" unit="mg/dL" value={f.tc} onChange={(v) => set('tc', v)} placeholder="總膽固醇" />
          <NumField label="LDL-C" unit="mg/dL" value={f.ldl} onChange={(v) => set('ldl', v)} placeholder="壞膽固醇" />
          <NumField label="HDL-C" unit="mg/dL" value={f.hdl} onChange={(v) => set('hdl', v)} placeholder="好膽固醇" />
          <NumField label="TG" unit="mg/dL" value={f.tg} onChange={(v) => set('tg', v)} placeholder="三酸甘油酯" />
          {showCalcLdl && (
            <Computed
              label="Calculated LDL"
              unit="mg/dL"
              tip="未實測 LDL 時用 Friedewald 公式推算：LDL = TC − HDL − TG/5。TG ≥ 400 時不適用。"
              value={tg! >= 400 ? 'TG ≥400 不適用' : eff.value != null ? `${eff.value} mg/dL` : '異常'}
              warn={tg! >= 400 || eff.value == null}
            />
          )}

          <SectionLabel>心血管病史與糖尿病</SectionLabel>
          <Toggle label="ASCVD 病史" hint="（CAD/stroke/PAD）" value={f.ascvd} onChange={(v) => set('ascvd', v as number)} options={YN} />
          <Toggle label="糖尿病" value={f.dm} onChange={(v) => set('dm', v as number)} options={YN} />

          <SectionLabel>健保危險因子（5 項）</SectionLabel>
          <Toggle label="高血壓" value={f.htn} onChange={(v) => set('htn', v as number)} options={YN} />
          <Toggle label="早發 CAD 家族史" tip="男性 ≦ 55 歲、女性 ≦ 65 歲一等親有冠心病" value={f.fhcad} onChange={(v) => set('fhcad', v as number)} options={YN} />
          <Toggle label="吸菸" value={f.smoking} onChange={(v) => set('smoking', v as number)} options={YN} />

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

function SimpleResultCard({ r }: { r: ReturnType<typeof calcStatinNHISimple> }) {
  const tone = r.covered ? 'green' : r.alreadyAtGoal ? 'green' : 'muted'
  const title = r.covered ? '符合健保 statin 起始給付' : r.alreadyAtGoal ? '未達起始給付閾值（目前 LDL 已低於門檻）' : '資料不足或未達起始給付'
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${tone === 'green' ? 'bg-green/15 text-green' : 'bg-surface2 text-text-muted'}`}>
          {r.covered || r.alreadyAtGoal ? '✓' : '–'}
        </div>
        <div>
          <div className={`text-sm font-semibold ${tone === 'green' ? 'text-green' : 'text-text'}`}>{title}</div>
          <div className="text-xs text-text-muted">適用條文：{r.condition}　·　{r.category}</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <Metric label="起始 LDL-C 閾值" value={`≥ ${r.ldlThreshold} mg/dL`} tone="accent" />
        {r.tcThreshold && <Metric label="起始 TC 閾值" value={`≥ ${r.tcThreshold} mg/dL`} tone="accent" />}
        {r.ldl && <Metric label={`目前 LDL-C${r.ldlSource === 'calculated' ? '（推算）' : ''}`} value={`${r.ldl} mg/dL`} tone={r.ldl >= r.ldlThreshold ? 'green' : 'yellow'} />}
      </div>

      <div className="rounded-lg bg-bg2 px-3 py-2.5 text-[13px] leading-relaxed text-text-muted">
        <div className="mb-1 font-semibold text-text">判斷依據</div>
        {r.reasons.map((t, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: `• ${t}` }} />
        ))}
        {r.rfCount > 0 ? (
          <div>• 危險因子（{r.rfCount}/5）：{r.rfItems.join('、')}</div>
        ) : !r.covered && !['2.6.5', '2.6.6'].includes(r.condition) ? (
          <div>• 危險因子（0/5）— LDL-C 需 ≥ 190 mg/dL 才達起始給付</div>
        ) : null}
        {r.needLifestyle && r.covered && <div className="text-text-light">• 需先 3–6 個月非藥物治療後仍未達標，方得起始 statin</div>}
        {!r.needLifestyle && r.covered && <div className="text-text-light">• 可與藥物治療並行（不需非藥物治療期）</div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
//  Shared pieces
// ════════════════════════════════════════════════════════════
const YN = [{ v: 0, l: '否' }, { v: 1, l: '是' }]

function InfoTip({ tip }: { tip: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <i className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-accent/35 bg-accent/[0.18] text-[10px] font-bold not-italic leading-none text-accent">
        !
      </i>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-[280px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg border border-accent/30 bg-[#1c2740] px-3 py-2 text-[13px] font-normal leading-relaxed text-text opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.55)] transition-opacity duration-150 group-hover:opacity-100">
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

function Metric({ label, value, tone }: { label: string; value: string; tone: 'accent' | 'green' | 'yellow' }) {
  const c = tone === 'green' ? 'text-green' : tone === 'yellow' ? 'text-yellow' : 'text-accent'
  return (
    <div className="rounded-lg bg-bg2 px-3 py-2">
      <div className="text-[11px] text-text-muted">{label}</div>
      <div className={`text-sm font-semibold ${c}`}>{value}</div>
    </div>
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
