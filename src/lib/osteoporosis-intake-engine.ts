// Faithful port of osteoporosis.html's #tab-intake logic (SEC/RISK/PE lists,
// drugStatus(), buildNotes(), buildChart()) as pure functions operating on a
// plain form-state object, mirroring the obesity-engine.ts pattern.

export const SEC: [string, string][] = [
  ['steroid', '長期類固醇（>5mg/day 超過 3 個月）'],
  ['ra', '類風濕性關節炎'],
  ['dmIns', '糖尿病使用胰島素'],
  ['hyperthy', '甲狀腺功能亢進'],
  ['hyperpara', '副甲狀腺功能亢進'],
  ['hypogonad', '性腺功能低下'],
  ['malabs', '吸收不良或胃切除'],
  ['ckd', '慢性腎病'],
  ['aed', '長期抗癲癇藥'],
  ['ppi', '長期 PPI'],
  ['ai', 'Aromatase inhibitor 或 ADT'],
  ['smoke', '吸菸'],
  ['etoh', '飲酒 ≥3 單位/日'],
]

export const RISK: [string, string][] = [
  ['lowCa', '血鈣過低尚未矯正'],
  ['mi1y', '一年內心肌梗塞或中風'],
  ['cvRisk', '其他心血管危險因子未控制'],
  ['vte', '靜脈血栓史或即將長期臥床'],
  ['giUpper', '食道疾病、逆流性食道炎或無法直立 30 分鐘'],
  ['dental', '近期計畫侵入性牙科處置'],
  ['dialysis', '透析中（HD 或 PD）'],
  ['calcimimetic', '併用擬鈣藥物（cinacalcet 等）'],
  ['osteosarc', '骨肉瘤高風險（Paget、不明 ALP 上升、骨骼放射治療史）'],
  ['boneMalig', '骨骼惡性腫瘤、骨轉移或高血鈣'],
  ['pregnancy', '育齡女性可能懷孕'],
]

export const PE: [string, string][] = [
  ['kyphosis', '駝背'],
  ['scoliosis', '脊椎側彎'],
  ['spineTender', '脊椎壓痛'],
]

export const INTAKE_DRUGLIST: [string, string][] = [
  ['alen', 'Alendronate'], ['rise', 'Risedronate'], ['zole', 'Zoledronic acid'],
  ['ralo', 'Raloxifene'], ['deno', 'Denosumab'], ['teri', 'Teriparatide'], ['romo', 'Romosozumab'],
]

export interface IntakeForm {
  visitDate: string
  age: string
  sex: '' | 'F' | 'M'
  refer: string
  menoAge: string
  menoType: '' | 'natural' | 'surgical'
  fxHx: 'none' | 'yes'
  fxDetail: string
  famFx: 'none' | 'yes'
  falls: string
  pastRx: string
  subjOther: string
  bh: string
  bhYouth: string
  bw: string
  sbp: string
  dbp: string
  pulse: string
  wod: string
  rpd: string
  tug: string
  egfr: string
  ca: string
  ph: string
  vitd: string
  alp: string
  pth: string
  oc: string
  dxaDate: string
  dxaMachine: string
  lsBmd: string
  lsT: string
  fnBmd: string
  fnT: string
  fnSide: '' | 'L' | 'R'
  hpBmd: string
  hpT: string
  hpSide: '' | 'L' | 'R'
  spineImg: string
}

export const INTAKE_DEFAULTS: IntakeForm = {
  visitDate: '',
  age: '',
  sex: '',
  refer: '',
  menoAge: '',
  menoType: '',
  fxHx: 'none',
  fxDetail: '',
  famFx: 'none',
  falls: '0',
  pastRx: '',
  subjOther: '',
  bh: '',
  bhYouth: '',
  bw: '',
  sbp: '',
  dbp: '',
  pulse: '',
  wod: '',
  rpd: '',
  tug: '',
  egfr: '',
  ca: '',
  ph: '',
  vitd: '',
  alp: '',
  pth: '',
  oc: '',
  dxaDate: '',
  dxaMachine: 'GE/C',
  lsBmd: '',
  lsT: '',
  fnBmd: '',
  fnT: '',
  fnSide: '',
  hpBmd: '',
  hpT: '',
  hpSide: '',
  spineImg: '',
}

const num = (v: string): number | null => {
  const x = parseFloat(v)
  return Number.isFinite(x) ? x : null
}
const trimmed = (v: string) => (v ?? '').trim()

function twDate(s: string): string {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return `${y}/${+m}/${+d}`
}
function compact(s: string): string {
  return s ? s.replace(/-/g, '') : ''
}

// ── 身高/理學/檢驗自動判讀（HtCalc/PeCalc/LabCalc/DxaCalc 的合併版） ──
export interface CalcHint {
  text: string
  warn: boolean
}

export function heightLossCalc(f: IntakeForm): CalcHint {
  const bh = num(f.bh), bhy = num(f.bhYouth)
  if (bh === null || bhy === null) return { text: '', warn: false }
  const loss = +(bhy - bh).toFixed(1)
  return { text: loss > 0 ? `身高減損 ${loss} cm` : '無身高減損', warn: loss >= 4 }
}

export function peCalc(f: IntakeForm): CalcHint {
  const wod = num(f.wod), rpd = num(f.rpd)
  const parts: string[] = []
  if (wod !== null) parts.push(wod > 5 ? `WOD ${wod} cm 異常` : `WOD ${wod} cm 正常`)
  if (rpd !== null) parts.push(rpd < 2 ? `RPD ${rpd} 指幅異常` : `RPD ${rpd} 指幅正常`)
  return { text: parts.join('　·　'), warn: (wod !== null && wod > 5) || (rpd !== null && rpd < 2) }
}

export function labCalc(f: IntakeForm): CalcHint {
  const ca = num(f.ca), vitd = num(f.vitd)
  const parts: string[] = []
  if (ca !== null && ca < 8.5) parts.push('血鈣偏低，抗吸收藥物前須矯正')
  if (vitd !== null && vitd < 30) parts.push('維生素 D 不足')
  return { text: parts.join('　·　'), warn: parts.length > 0 }
}

export function dxaCalc(f: IntakeForm): CalcHint {
  const lsT = num(f.lsT)
  const hip = num(f.fnT) ?? num(f.hpT)
  if (lsT === null || hip === null) return { text: '', warn: false }
  const gap = +(lsT - hip).toFixed(1)
  return {
    text: gap >= 1.0 ? `腰椎高於髖部 ${gap}，疑受退化性變化影響，建議以髖部判讀` : `腰椎與髖部差 ${gap}`,
    warn: gap >= 1.0,
  }
}

// ── 判讀提示 ──
export interface NoteItem {
  level: 'red' | 'amb'
  title: string
  detail: string
}

export function buildNotes(f: IntakeForm): NoteItem[] {
  const n: NoteItem[] = []
  const bh = num(f.bh), bhy = num(f.bhYouth)
  const wod = num(f.wod), rpd = num(f.rpd), tug = num(f.tug)
  const lsT = num(f.lsT), fnT = num(f.fnT), hpT = num(f.hpT)
  const egfr = num(f.egfr), ca = num(f.ca), vitd = num(f.vitd)

  if (bh !== null && bhy !== null) {
    const loss = +(bhy - bh).toFixed(1)
    if (loss >= 4) n.push({ level: 'red', title: `身高減損 ${loss} cm`, detail: '超過 4 cm，椎體骨折機率明顯上升。建議加做胸腰椎側面 X 光或 VFA。' })
    else if (loss >= 2) n.push({ level: 'amb', title: `身高減損 ${loss} cm`, detail: '介於 2–4 cm，若合併背痛或駝背，可考慮脊椎影像。' })
  }
  if (wod !== null && wod > 5) n.push({ level: 'red', title: `枕牆距 ${wod} cm`, detail: '大於 5 cm，提示胸椎後凸或潛在椎體骨折。' })
  if (rpd !== null && rpd < 2) n.push({ level: 'red', title: `肋骨骨盆距 ${rpd} 指幅`, detail: '小於 2 指幅，提示腰椎椎體骨折。' })
  if (tug !== null && tug >= 12) n.push({ level: 'amb', title: `起立行走 ${tug} 秒`, detail: '≥12 秒屬跌倒高風險，建議轉介平衡訓練或復健。' })

  if (lsT !== null && (fnT !== null || hpT !== null)) {
    const hip = fnT !== null ? fnT : (hpT as number)
    const gap = +(lsT - hip).toFixed(1)
    if (gap >= 1.0) n.push({ level: 'amb', title: `腰椎與髖部 T-score 差 ${gap}`, detail: '腰椎明顯高於髖部，常見於退化性變化、骨贅、脊椎側彎或主動脈鈣化造成的假性升高。建議以髖部數值判讀。' })
  }
  if (egfr === null) n.push({ level: 'red', title: 'eGFR 未填', detail: '四支藥的可用性取決於腎功能，請先確認。' })
  if (ca === null) n.push({ level: 'red', title: '血鈣未填', detail: '抗吸收藥物治療前必須確認血鈣，低血鈣是禁忌。' })
  if (vitd === null) n.push({ level: 'amb', title: '25(OH)D 未填', detail: '治療前應矯正維生素 D 缺乏，否則低血鈣風險上升。' })
  else if (vitd < 30) n.push({ level: 'amb', title: `25(OH)D ${vitd} ng/mL`, detail: '低於 30，建議先補充至足量再開始抗吸收治療。' })

  return n
}

// ── 藥物檢核 ──
export type DrugFlagLevel = 'red' | 'amb' | 'gry'
export type DrugStatusMap = Record<string, [DrugFlagLevel, string][]>

export function drugStatus(f: IntakeForm, checks: Set<string>): DrugStatusMap {
  const egfr = num(f.egfr)
  const sex = f.sex
  const hd = checks.has('dialysis')
  const lowCa = checks.has('lowCa')
  const r: DrugStatusMap = {}
  const put = (k: string, lv: DrugFlagLevel, msg: string) => {
    if (!r[k]) r[k] = []
    r[k].push([lv, msg])
  }

  for (const [k] of INTAKE_DRUGLIST) r[k] = []

  // 低血鈣：全抗吸收與 romosozumab 禁忌
  if (lowCa) (['alen', 'rise', 'zole', 'deno', 'romo'] as const).forEach((k) => put(k, 'red', '低血鈣未矯正，禁忌'))

  // 腎功能
  if (egfr !== null) {
    if (egfr < 35) put('alen', 'red', `eGFR ${egfr}，<35 不建議使用`)
    if (egfr < 15) put('rise', 'red', `eGFR ${egfr}，<15 避免使用`)
    else if (egfr < 30) put('rise', 'amb', `eGFR ${egfr}，15–30 一般不建議`)
    if (egfr < 35) put('zole', 'red', `eGFR ${egfr}，<35 為非腫瘤適應症禁忌`)
    if (egfr < 30) put('deno', 'amb', `eGFR ${egfr}，屬黑框嚴重低血鈣族群。治療前矯正血鈣並評估 CKD-MBD，首月每週驗血鈣、之後每月一次`)
    if (egfr < 30) put('romo', 'amb', `eGFR ${egfr}，重度腎病低血鈣風險上升`)
  }
  if (hd) {
    put('zole', 'red', '透析中，非腫瘤適應症禁忌')
    put('rise', 'red', '透析中，避免使用')
    put('deno', 'red', '透析中，屬黑框警語族群，須由具 CKD-MBD 專業者共同評估')
  }
  if (checks.has('calcimimetic')) put('deno', 'amb', '併用擬鈣藥物會加重低血鈣，須嚴密監測')

  // 上消化道
  if (checks.has('giUpper')) {
    put('alen', 'red', '食道疾病或無法直立 30 分鐘，禁忌')
    put('rise', 'red', '食道疾病或無法直立 30 分鐘，禁忌')
  }

  // 血栓與性別
  if (checks.has('vte')) put('ralo', 'red', '靜脈血栓史或即將長期臥床，禁忌')
  if (sex === 'M') put('ralo', 'red', '僅適用於停經後女性')
  else if (sex === 'F' && !trimmed(f.menoAge)) put('ralo', 'amb', '需確認已停經，不適用於停經前婦女')
  if (checks.has('pregnancy')) {
    put('ralo', 'red', '可能懷孕，禁忌')
    put('deno', 'red', '可能懷孕，使用前應驗孕，懷孕與哺乳期間勿用')
    put('romo', 'amb', '可能懷孕，需先確認')
  }

  // 心血管
  if (checks.has('mi1y')) put('romo', 'red', '一年內心肌梗塞或中風，不建議使用')
  else if (checks.has('cvRisk')) put('romo', 'amb', '有未控制的心血管危險因子，須權衡效益與風險並記錄評估')

  // teriparatide
  if (checks.has('osteosarc')) put('teri', 'red', '骨肉瘤高風險，禁忌')
  if (checks.has('boneMalig')) put('teri', 'red', '骨骼惡性腫瘤、骨轉移或高血鈣，禁忌')

  // 牙科
  if (checks.has('dental')) {
    (['alen', 'rise', 'zole', 'deno', 'romo'] as const).forEach((k) =>
      put(k, 'gry', '有侵入性牙科計畫，建議先完成牙科處置再起始，或與牙科協調時程'))
  }

  return r
}

// ── LIS 貼上解析 ──
// 成大 LIS「檢驗報告查詢」整頁全選複製後的純文字。報表是以 tab 分欄的
// 「檢驗名稱→結果」表格，因此以欄位名精準比對（而非全文模糊搜尋），避免把
// 別的數字誤讀成檢驗值。DXA 另以區塊解析，雙側取較差的一側。
export type HipSide = '' | 'L' | 'R'

export interface ParsedLisField {
  value: number | string
  label: string
  unit: string
  display?: string
}

export interface LisIntakeResult {
  fields: Record<string, ParsedLisField>
  warnings: string[]
}

// 欄位名正規化：去空白、轉大寫，讓 "VIT D (25-OH)" 與 "VitD(25-OH)" 視為同一項
const normName = (s: string) => s.replace(/\s+/g, '').toUpperCase()

const LIS_ANALYTES: {
  id: keyof IntakeForm
  names: string[] // 依優先順序，前面的先採用
  min: number
  max: number
  unit: string
  label: string
}[] = [
  { id: 'egfr', names: ['EGFR(CKD-EPI)', 'EGFR(MDRD)', 'EGFR'], min: 1, max: 200, unit: 'mL/min/1.73m²', label: 'eGFR' },
  { id: 'ca', names: ['CA', 'CA(MG/DL)', 'CALCIUM', 'CA,TOTAL'], min: 4, max: 16, unit: 'mg/dL', label: 'Ca' },
  { id: 'ph', names: ['P', 'P(MG/DL)', 'PHOSPHORUS', 'PHOSPHATE', 'INORGANICP'], min: 0.5, max: 15, unit: 'mg/dL', label: 'P' },
  { id: 'vitd', names: ['VITD(25-OH)', 'VITD(25OH)', '25-OH-VITD', '25(OH)D', 'VITAMIND', 'VITD'], min: 1, max: 200, unit: 'ng/mL', label: '25(OH)D' },
  { id: 'alp', names: ['ALP', 'ALK-P', 'ALKALINEPHOSPHATASE'], min: 10, max: 3000, unit: 'U/L', label: 'ALP' },
  { id: 'pth', names: ['PTH', 'I-PTH', 'IPTH', 'INTACTPTH'], min: 1, max: 3000, unit: 'pg/mL', label: 'iPTH' },
  { id: 'oc', names: ['OSTEOC', 'OSTEOCALCIN', 'BGP'], min: 0.1, max: 500, unit: 'ng/mL', label: 'Osteocalcin' },
]

// "≧90"、"<5" 這類帶符號的結果取其數值
const toNumber = (s: string): number | null => {
  const n = parseFloat(s.replace(/[≧≦<>＜＞=]/g, '').trim())
  return isNaN(n) ? null : n
}

interface DxaSideRow {
  side: 'L' | 'R'
  bmd: number
  t: number
}

// 取 T-score 較低者；T 相同時取 BMD 較低者
function worseSide(rows: DxaSideRow[]): DxaSideRow | null {
  if (!rows.length) return null
  return rows.reduce((a, b) => (b.t < a.t || (b.t === a.t && b.bmd < a.bmd) ? b : a))
}

// 解析 "Neck / Total" 區塊下的 Left、Right 兩列
function parseHipBlock(lines: string[], header: RegExp): DxaSideRow[] {
  const rows: DxaSideRow[] = []
  const idx = lines.findIndex((l) => header.test(l.trim()))
  if (idx < 0) return rows
  for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
    const m = lines[i].match(/^\s*(Left|Right)\s+([\d.]+)\s+(-?[\d.]+)/i)
    if (!m) {
      if (rows.length) break
      continue
    }
    rows.push({
      side: /^l/i.test(m[1]) ? 'L' : 'R',
      bmd: parseFloat(m[2]),
      t: parseFloat(m[3]),
    })
  }
  return rows
}

export const SIDE_LABEL: Record<Exclude<HipSide, ''>, string> = { L: '左', R: '右' }

// 從整頁報告中抽出胸腰椎 X 光的判讀與日期。報告以「報告結果 - 」分段，
// 只取 X 光／放射線那一段，且內文要提到脊椎，避免抓到核醫的 DXA 段落。
function parseSpineXray(text: string): { value: string; date: string } | null {
  for (const block of text.split('報告結果 - ').slice(1)) {
    const header = block.split('\n')[0] ?? ''
    if (!/[ＸX]\s*光|放射線/.test(header)) continue

    const body = block.split('\n').slice(1)
    const titleLine = body.find((l) => /thoracolumbar|t-?l\s*spine|lumbar\s*spine|spine/i.test(l) && !/Bone Density/i.test(l))
    if (!titleLine) continue

    const dateMatch = block.match(/執行\s+(\d{4}-\d{2}-\d{2})/) || block.match(/報告\s+(\d{4}-\d{2}-\d{2})/)
    const date = dateMatch ? dateMatch[1] : ''

    const impIdx = body.findIndex((l) => /^\s*IMP\s*[:：]/i.test(l))
    const findingLines: string[] = []
    if (impIdx >= 0) {
      for (const line of body.slice(impIdx + 1)) {
        const t = line.trim()
        if (!t) {
          if (findingLines.length) break
          continue
        }
        if (/醫師|放診專|核專/.test(t)) break
        findingLines.push(t.replace(/^\d+\)\s*/, '').replace(/[。.]$/, ''))
      }
    }

    const title = titleLine.trim().replace(/[:：]\s*$/, '')
    const findings = findingLines.join('; ')
    if (!findings) continue
    return { value: `${title}${date ? ` (${date})` : ''}: ${findings}`, date }
  }
  return null
}

export function parseLisIntake(raw: string): LisIntakeResult | null {
  if (!raw || !raw.trim()) return null

  const text = raw.replace(/\r/g, '')
  const lines = text.split('\n')
  const result: LisIntakeResult = { fields: {}, warnings: [] }

  // 年齡、性別
  const ageMatch = text.match(/\((\d{1,3})歲\)/) || text.match(/年齡[^\d]{0,10}(\d{1,3})\s*歲/)
  if (ageMatch) {
    const age = parseInt(ageMatch[1])
    if (age >= 1 && age <= 120) result.fields.age = { value: age, label: '年齡', unit: '歲' }
  }
  if (/姓名[\s\S]{0,40}\(男\)/.test(text)) {
    result.fields.sex = { value: 'M', label: '生理性別', unit: '', display: '男' }
  } else if (/姓名[\s\S]{0,40}\(女\)/.test(text)) {
    result.fields.sex = { value: 'F', label: '生理性別', unit: '', display: '女' }
  }

  // 檢驗值：逐列拆欄，欄位名完全相符才取下一欄為結果
  // 同一項若出現多次（例如 eGFR 與 eGFR(CKD-EPI)），採用名稱優先度較高者
  const bestRank: Record<string, number> = {}
  for (const line of lines) {
    const cells = line.split('\t').map((c) => c.trim())
    if (cells.length < 2) continue
    for (let i = 0; i < cells.length - 1; i++) {
      const key = normName(cells[i])
      if (!key) continue
      for (const a of LIS_ANALYTES) {
        const rank = a.names.indexOf(key)
        if (rank < 0) continue
        const val = toNumber(cells[i + 1])
        if (val === null || val < a.min || val > a.max) continue
        if (bestRank[a.id] !== undefined && rank >= bestRank[a.id]) continue
        bestRank[a.id] = rank
        result.fields[a.id] = { value: val, label: a.label, unit: a.unit }
      }
    }
  }

  // DXA：腰椎 L1-L4 與雙側髖部
  const lsMatch = text.match(/L1\s*-+>?\s*L4\s+([\d.]+)\s+(-?[\d.]+)/i)
  if (lsMatch) {
    result.fields.lsBmd = { value: parseFloat(lsMatch[1]), label: 'L1-4 BMD', unit: 'g/cm²' }
    result.fields.lsT = { value: parseFloat(lsMatch[2]), label: 'L1-4 T-score', unit: '' }
  }

  const neck = worseSide(parseHipBlock(lines, /^neck$/i))
  if (neck) {
    result.fields.fnBmd = { value: neck.bmd, label: 'Hip neck BMD', unit: 'g/cm²' }
    result.fields.fnT = { value: neck.t, label: 'Hip neck T-score', unit: '' }
    result.fields.fnSide = {
      value: neck.side,
      label: 'Hip neck 取側',
      unit: '',
      display: `${SIDE_LABEL[neck.side]}側（較差側）`,
    }
  }

  const total = worseSide(parseHipBlock(lines, /^total$/i))
  if (total) {
    result.fields.hpBmd = { value: total.bmd, label: 'Total hip BMD', unit: 'g/cm²' }
    result.fields.hpT = { value: total.t, label: 'Total hip T-score', unit: '' }
    result.fields.hpSide = {
      value: total.side,
      label: 'Total hip 取側',
      unit: '',
      display: `${SIDE_LABEL[total.side]}側（較差側）`,
    }
  }

  // 胸腰椎 X 光判讀
  const spine = parseSpineXray(text)
  if (spine) {
    result.fields.spineImg = {
      value: spine.value,
      label: '脊椎影像',
      unit: '',
      display: spine.date ? `${spine.date} 報告` : '已讀到報告',
    }
  }

  // DXA 檢查日期：取 Bone Density 報告段落之前最後出現的日期
  const bdIdx = text.search(/Bone Density/i)
  if (bdIdx > 0) {
    const dates = text.slice(0, bdIdx).match(/\d{4}-\d{2}-\d{2}/g)
    if (dates && dates.length) result.fields.dxaDate = { value: dates[dates.length - 1], label: 'DXA 檢查日期', unit: '' }
  }

  if (!result.fields.ca) result.warnings.push('未讀到血鈣 — 抗吸收藥物治療前必須確認血鈣，請手動補上。')
  if (!result.fields.egfr) result.warnings.push('未讀到 eGFR — 四支藥的可用性取決於腎功能，請手動補上。')

  return result
}

// ── 病歷文字 ──
export function buildChartText(f: IntakeForm, checks: Set<string>): string {
  const L: string[] = []
  const v = (s: string) => trimmed(s)
  const chk = (k: string) => checks.has(k)

  // Subjective
  L.push('[Subjective]')
  const refer = v(f.refer)
  L.push('For the treatment of osteoporosis' + (refer ? ` (referred by ${refer})` : ''))

  const fxHx = f.fxHx === 'yes'
  const s1 = [
    `Fracture Hx (${fxHx ? '+' : '-'})` + (fxHx && v(f.fxDetail) ? `: ${v(f.fxDetail)}` : ''),
    `Family hip Fx Hx (${f.famFx === 'yes' ? '+' : '-'})`,
    `steroid use (${chk('steroid') ? '+' : '-'})`,
    `RA Hx (${chk('ra') ? '+' : '-'})`,
  ]
  L.push(s1.join(', '))

  const falls = num(f.falls)
  L.push(`Falling (${falls ? '+' : '-'})` + (falls ? `: ${falls} time(s) in past year` : ''))
  L.push(`Smoking (${chk('smoke') ? '+' : '-'}), Alcohol (${chk('etoh') ? '+' : '-'})`)

  if (v(f.menoAge)) {
    L.push(
      `Menopause at ${v(f.menoAge)} y/o` +
        (f.menoType === 'surgical' ? ' (surgical)' : f.menoType === 'natural' ? ' (natural)' : ''),
    )
  }

  const sec = SEC.filter(([k]) => chk(k) && !['steroid', 'ra', 'smoke', 'etoh'].includes(k)).map(([, t]) => t)
  L.push('Secondary cause screen: ' + (sec.length ? sec.join(', ') : 'none identified'))

  if (v(f.pastRx)) L.push('Prior osteoporosis Rx:\n' + v(f.pastRx))
  if (v(f.subjOther)) L.push(v(f.subjOther))

  // Objective
  L.push('', '[Objective]')
  const bh = num(f.bh), bhy = num(f.bhYouth), bw = num(f.bw)
  const bits: string[] = []
  if (bh !== null) bits.push(`BH:${bh}cm` + (bhy !== null ? ` (${bhy} at youth)` : ''))
  if (bw !== null) bits.push(`BW:${bw}kg`)
  if (bh && bw) bits.push(`BMI:${(bw / (bh / 100) ** 2).toFixed(1)}kg/㎡`)
  if (num(f.sbp) && num(f.dbp)) bits.push(`BP:${num(f.sbp)}/${num(f.dbp)}mmHg`)
  if (num(f.pulse)) bits.push(`P:${num(f.pulse)} times/min`)
  if (v(f.age)) bits.push(`${v(f.age)}歲`)
  if (bits.length) L.push(bits.join(', ') + (v(f.visitDate) ? ` (${twDate(v(f.visitDate))})` : ''))

  if (bh !== null && bhy !== null) {
    const loss = +(bhy - bh).toFixed(1)
    if (loss > 0) L.push(`Height loss = ${loss} cm`)
  }
  if (num(f.wod) !== null) L.push(`WOD = ${num(f.wod)} cm`)
  if (num(f.rpd) !== null) L.push(`RPD = ${num(f.rpd)} fingers`)
  if (num(f.tug) !== null) L.push(`TUG = ${num(f.tug)} sec`)
  const pe = PE.filter(([k]) => chk(k)).map(([, t]) => t)
  if (pe.length) L.push('PE: ' + pe.join(', '))

  const labs: string[] = []
  ;([
    ['egfr', 'eGFR'], ['ca', 'Ca'], ['ph', 'P'], ['vitd', 'VitD(25-OH)'],
    ['alp', 'ALP'], ['pth', 'iPTH'], ['oc', 'Osteocalcin'],
  ] as [keyof IntakeForm, string][]).forEach(([id, lbl]) => {
    if (num(f[id] as string) !== null) labs.push(`${lbl} ${num(f[id] as string)}`)
  })
  if (labs.length) L.push((v(f.visitDate) ? twDate(v(f.visitDate)) + '  ' : '') + labs.join(' ; '))

  if (num(f.lsT) !== null || num(f.fnT) !== null || num(f.hpT) !== null) {
    L.push(`DXA ${compact(v(f.dxaDate)) || ''}${v(f.dxaMachine) ? '(' + v(f.dxaMachine) + ')' : ''}`.trim())
    const sideTag = (s: IntakeForm['fnSide']) => (s === 'L' ? ' (Lt)' : s === 'R' ? ' (Rt)' : '')
    if (num(f.lsBmd) !== null || num(f.lsT) !== null) L.push(`L1-4= ${num(f.lsBmd) ?? '-'}(${num(f.lsT) ?? '-'})`)
    if (num(f.fnBmd) !== null || num(f.fnT) !== null) {
      L.push(`Hip neck${sideTag(f.fnSide)}= ${num(f.fnBmd) ?? '-'}(${num(f.fnT) ?? '-'})`)
    }
    if (num(f.hpBmd) !== null || num(f.hpT) !== null) {
      L.push(`Total hip${sideTag(f.hpSide)}= ${num(f.hpBmd) ?? '-'}(${num(f.hpT) ?? '-'})`)
    }
    const lsT = num(f.lsT)
    const hip = num(f.fnT) ?? num(f.hpT)
    if (lsT !== null && hip !== null && lsT - hip >= 1.0) {
      L.push(`Note: LS T-score higher than hip by ${(lsT - hip).toFixed(1)}; degenerative change suspected, interpret by hip.`)
    }
  }
  if (v(f.spineImg)) L.push(v(f.spineImg))

  // 檢核摘要
  const r = drugStatus(f, checks)
  const contra = INTAKE_DRUGLIST.filter(([k]) => (r[k] || []).some((x) => x[0] === 'red')).map(
    ([k, nm]) => `${nm} (${(r[k] || []).filter((x) => x[0] === 'red').map((x) => x[1]).join('; ')})`,
  )
  if (contra.length) {
    L.push('', '[Assessment]')
    L.push('Contraindicated / not recommended: ' + contra.join(' / '))
  }

  return L.join('\n')
}
