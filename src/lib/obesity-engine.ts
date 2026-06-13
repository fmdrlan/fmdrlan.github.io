// Faithful port of obesity.html's note/order/BMI logic as pure functions.
// Accessors mirror the original helpers: val(id), flag(dataFlag), radio(name).

export type Val = (id: string) => string
export type Flag = (f: string) => boolean
export type Radio = (name: string) => string | undefined

const NOTE_PLACEHOLDER = '（填寫上方欄位後此處會自動產生英文病歷文字）'
const FU_PLACEHOLDER = '（填寫上方欄位後此處會自動產生英文回診病歷文字）'

function joinChecked(items: { cond: boolean; label: string }[], sep = '、'): string | null {
  const arr = items.filter((x) => x.cond).map((x) => x.label)
  return arr.length ? arr.join(sep) : null
}

function appendNote(s: string | null, note: string): string | null {
  if (note) return s ? `${s}; ${note}` : note
  return s
}

// ── Initial note (English) ──
export function renderNote(val: Val, flag: Flag, radio: Radio): string {
  const lines: string[] = []

  // [Goal]
  const goalParts: string[] = []
  if (val('motivation')) goalParts.push(`motivation: ${val('motivation')}`)
  if (val('goal-wt')) {
    let s = `target ${val('goal-wt')} kg`
    if (val('goal-time')) s += ` (within ${val('goal-time')})`
    goalParts.push(s)
  }
  let goalLine: string | null = goalParts.join('; ')
  goalLine = appendNote(goalLine, val('goal-note'))
  if (goalLine) lines.push(`[Goal] ${goalLine}`)

  // [Weight history]
  const wtHist: string[] = []
  if (val('max-wt'))
    wtHist.push(`max ${val('max-wt')} kg${val('max-wt-when') ? ' (' + val('max-wt-when') + ')' : ''}`)
  if (val('min-wt')) wtHist.push(`min ${val('min-wt')} kg`)
  if (val('onset')) wtHist.push(`weight gain onset: ${val('onset')}`)
  if (flag('weight-cycling')) {
    let s = 'weight cycling'
    if (val('cycling-times')) s += ` (${val('cycling-times')})`
    wtHist.push(s)
  }
  if (val('prev-method')) wtHist.push(`prior weight-loss methods: ${val('prev-method')}`)
  if (wtHist.length) lines.push(`[Weight Hx] ${wtHist.join('; ')}`)

  // [Life events]
  let events = joinChecked(
    [
      { cond: flag('quit-smoke'), label: 's/p smoking cessation' },
      { cond: flag('preg-gain'), label: 'excessive pregnancy weight gain' },
      { cond: flag('menstrual'), label: 'irregular menses' },
      { cond: flag('post-meno'), label: 'post-menopausal weight gain' },
    ],
    ', ',
  )
  events = appendNote(events, val('event-note'))
  if (events) lines.push(`[Life events] ${events}`)

  // [Obesogenic meds]
  let meds = joinChecked(
    [
      { cond: flag('med-dm'), label: 'antidiabetic agents (SU/TZD/insulin)' },
      { cond: flag('med-antipsych'), label: 'antipsychotics' },
      { cond: flag('med-antidep'), label: 'antidepressants' },
      { cond: flag('med-antiep'), label: 'antiepileptics' },
      { cond: flag('med-steroid'), label: 'corticosteroids' },
      { cond: flag('med-bb'), label: 'β-blockers' },
    ],
    ', ',
  )
  meds = appendNote(meds, val('med-detail'))
  if (meds) lines.push(`[Obesogenic meds] ${meds}`)

  // [Endocrine symptoms]
  let endo = joinChecked(
    [
      { cond: flag('sx-thyroid'), label: 'fatigue/constipation/cold intolerance (r/o hypothyroidism)' },
      { cond: flag('sx-cushing'), label: "moon face/buffalo hump/thin skin (r/o Cushing's)" },
      { cond: flag('sx-pcos'), label: 'hirsutism/menstrual irregularity/acne (r/o PCOS)' },
      {
        cond: flag('sx-hypogonad'),
        label: 'decreased libido/fatigue/loss of muscle strength (r/o hypogonadism)',
      },
    ],
    '; ',
  )
  endo = appendNote(endo, val('endo-note'))
  if (endo) lines.push(`[Endocrine sx] ${endo}`)

  // [Comorbidities]
  let cm = joinChecked(
    [
      { cond: flag('cm-htn'), label: 'HTN' },
      { cond: flag('cm-dm'), label: 'DM' },
      { cond: flag('cm-dl'), label: 'dyslipidemia' },
      { cond: flag('cm-osa'), label: 'OSA' },
      { cond: flag('cm-masld'), label: 'MASLD' },
      { cond: flag('cm-knee'), label: 'knee OA' },
      { cond: flag('cm-hfpef'), label: 'HFpEF' },
      { cond: flag('cm-gout'), label: 'gout' },
      { cond: flag('cm-psy'), label: 'psychiatric disorder' },
    ],
    ', ',
  )
  cm = appendNote(cm, val('cm-note'))
  if (cm) lines.push(`[Comorbidities] ${cm}`)

  // [Weight-related symptoms]
  let symp = joinChecked(
    [
      { cond: flag('sym-dyspnea'), label: 'DOE on climbing stairs' },
      { cond: flag('sym-knee'), label: 'knee pain' },
      { cond: flag('sym-fatigue'), label: 'easy fatigability' },
      { cond: flag('sym-snore'), label: 'snoring' },
      { cond: flag('sym-sleepy'), label: 'daytime sleepiness' },
      { cond: flag('sym-apnea'), label: 'witnessed apnea' },
    ],
    ', ',
  )
  symp = appendNote(symp, val('sym-note'))
  if (symp) lines.push(`[Weight-related sx] ${symp}`)

  // [Family Hx]
  let fh = joinChecked(
    [
      { cond: flag('fh-obesity'), label: 'obesity' },
      { cond: flag('fh-dm'), label: 'DM' },
      { cond: flag('fh-htn'), label: 'HTN' },
      { cond: flag('fh-dl'), label: 'dyslipidemia' },
      { cond: flag('fh-cv'), label: 'CV disease' },
    ],
    ', ',
  )
  fh = appendNote(fh, val('fh-note'))
  if (fh) lines.push(`[Family Hx] ${fh}`)

  // [Diet]
  const dietPattern = joinChecked(
    [
      { cond: flag('diet-skip-bf'), label: 'skipping breakfast' },
      { cond: flag('diet-late-dinner'), label: 'late dinner' },
      { cond: flag('diet-night-eat'), label: 'late-night eating' },
      { cond: flag('diet-snack'), label: 'between-meal snacking' },
      { cond: flag('diet-fast-eat'), label: 'fast eating' },
      { cond: flag('diet-distract'), label: 'distracted eating' },
    ],
    ', ',
  )
  const dietContent = joinChecked(
    [
      { cond: flag('diet-sugary'), label: 'sugary beverages' },
      { cond: flag('diet-fried'), label: 'fried food' },
      { cond: flag('diet-redmeat'), label: 'red/processed meat' },
      { cond: flag('diet-upf'), label: 'ultra-processed food' },
      { cond: flag('diet-alcohol'), label: 'alcohol' },
      { cond: flag('diet-highsalt'), label: 'high-salt diet' },
    ],
    ', ',
  )
  const dietBeh = joinChecked(
    [
      { cond: flag('diet-emo'), label: 'emotional eating' },
      { cond: flag('diet-stress'), label: 'stress-related eating' },
      { cond: flag('diet-binge'), label: 'binge eating tendency' },
      { cond: flag('diet-night-syn'), label: 'night eating syndrome' },
    ],
    ', ',
  )

  const eatOutMap: Record<string, string> = {
    '低（<30%）': 'low (<30%)',
    '中（30–70%）': 'moderate (30-70%)',
    '高（>70%）': 'high (>70%)',
  }
  const dietParts: string[] = []
  let patternLine: string | null = dietPattern
  if (radio('eat-out'))
    patternLine =
      (patternLine ? patternLine + ', ' : '') + `eats out ${eatOutMap[radio('eat-out')!] || radio('eat-out')}`
  if (val('cook-person'))
    patternLine = (patternLine ? patternLine + ', ' : '') + `meal prep: ${val('cook-person')}`
  patternLine = appendNote(patternLine, val('pattern-note'))
  if (patternLine) dietParts.push(`pattern: ${patternLine}`)

  let contentLine: string | null = dietContent
  const subs: string[] = []
  if (val('sugary-freq')) subs.push(`sugary bev ${val('sugary-freq')}`)
  if (val('alc-amount')) subs.push(`alcohol ${val('alc-amount')}`)
  if (subs.length)
    contentLine = contentLine ? contentLine + ' (' + subs.join(', ') + ')' : subs.join(', ')
  contentLine = appendNote(contentLine, val('content-note'))
  if (contentLine) dietParts.push(`content: ${contentLine}`)

  const behLine = appendNote(dietBeh, val('beh-note'))
  if (behLine) dietParts.push(`behavior: ${behLine}`)

  if (dietParts.length) lines.push(`[Diet] ${dietParts.join('; ')}`)

  // [Physical activity]
  const intensityMap: Record<string, string> = { 低: 'low', 中: 'moderate', 高: 'high' }
  const actParts: string[] = []
  if (val('exercise-type')) actParts.push(val('exercise-type'))
  const af: string[] = []
  if (val('exercise-freq')) af.push(val('exercise-freq'))
  if (val('exercise-dur')) af.push(val('exercise-dur'))
  if (radio('intensity')) af.push(`${intensityMap[radio('intensity')!] || radio('intensity')} intensity`)
  if (af.length) actParts.push(af.join(', '))
  if (flag('ls-sedentary')) actParts.push('sedentary >8h/d')
  if (flag('ls-act-limit')) {
    let s = 'activity-limiting factors'
    if (val('act-limit-detail')) s += ` (${val('act-limit-detail')})`
    actParts.push(s)
  }
  if (actParts.length) lines.push(`[Physical activity] ${actParts.join('; ')}`)

  // [Sleep]
  const sleepQMap: Record<string, string> = { 好: 'good', 普通: 'fair', 差: 'poor' }
  const slpParts: string[] = []
  if (val('sleep-hr')) slpParts.push(`${val('sleep-hr')} h/night`)
  if (radio('sleep-q')) slpParts.push(`quality ${sleepQMap[radio('sleep-q')!] || radio('sleep-q')}`)
  if (flag('ls-shift')) slpParts.push('shift work')
  if (flag('ls-irreg')) slpParts.push('irregular schedule')
  let slpLine: string | null = slpParts.join(', ')
  slpLine = appendNote(slpLine, val('sleep-note'))
  if (slpLine) lines.push(`[Sleep] ${slpLine}`)

  // [Psychosocial]
  const psy = joinChecked(
    [
      { cond: flag('psy-depress'), label: 'depressive mood' },
      { cond: flag('psy-anxiety'), label: 'anxiety' },
      { cond: flag('psy-stigma'), label: 'weight-related self-stigma' },
      { cond: flag('psy-stress'), label: 'high stress' },
    ],
    ', ',
  )
  const supportMap: Record<string, string> = { 好: 'good', 普通: 'fair', 差: 'poor' }
  const socParts: string[] = []
  if (psy) socParts.push(`psych: ${psy}`)
  if (radio('support')) socParts.push(`family support ${supportMap[radio('support')!] || radio('support')}`)
  if (val('work-type')) socParts.push(`occupation: ${val('work-type')}`)
  let socLine: string | null = socParts.join('; ')
  socLine = appendNote(socLine, val('psy-note'))
  if (socLine) lines.push(`[Psychosocial] ${socLine}`)

  // [PE]
  const peParts: string[] = []
  if (val('waist')) peParts.push(`WC ${val('waist')} cm`)
  if (val('neck')) peParts.push(`NC ${val('neck')} cm`)
  const skin = joinChecked(
    [
      { cond: flag('pe-acanth'), label: 'acanthosis nigricans' },
      { cond: flag('pe-stria'), label: 'striae' },
      { cond: flag('pe-intertrigo'), label: 'intertrigo' },
      { cond: flag('pe-acne'), label: 'acne' },
      { cond: flag('pe-hirsut'), label: 'hirsutism' },
      { cond: flag('pe-xanth'), label: 'xanthoma' },
    ],
    ', ',
  )
  const peOther = joinChecked(
    [
      { cond: flag('pe-thyroid'), label: 'thyroid enlargement' },
      { cond: flag('pe-mooning'), label: 'moon face / buffalo hump' },
      { cond: flag('pe-heart'), label: 'abnormal heart sounds' },
      { cond: flag('pe-lung'), label: 'abnormal breath sounds' },
      { cond: flag('pe-edema'), label: 'lower limb edema' },
    ],
    ', ',
  )
  if (skin) peParts.push(`skin: ${skin}`)
  if (peOther) peParts.push(peOther)
  if (val('calf') || val('grip') || val('sts') || val('walk')) {
    const sarc: string[] = []
    if (val('calf')) sarc.push(`calf circumference ${val('calf')} cm`)
    if (val('grip')) sarc.push(`grip ${val('grip')} kg`)
    if (val('sts')) sarc.push(`5x sit-to-stand ${val('sts')} s`)
    if (val('walk')) sarc.push(`6m walk ${val('walk')} s`)
    peParts.push(`sarcopenic obesity workup: ${sarc.join(', ')}`)
  }
  let peLine: string | null = peParts.join('; ')
  peLine = appendNote(peLine, val('pe-note'))
  if (peLine) lines.push(`[PE] ${peLine}`)

  return lines.length ? lines.join('\n') : NOTE_PLACEHOLDER
}

// ── Orders ──
export interface OrderResult {
  routine: string[]
  cond: { test: string; reason: string }[]
}

export function renderOrders(_val: Val, flag: Flag): OrderResult {
  const routine = ['FPG', 'Lipid profile (TC, TG, HDL-C, LDL-C)', 'AST, ALT', 'BUN, Cr']
  const cond: { test: string; reason: string }[] = []

  if (flag('cm-dm') || flag('fh-dm') || flag('med-dm') || flag('pe-acanth')) {
    cond.push({ test: 'HbA1c', reason: 'DM/DM risk' })
  }
  if (flag('cm-gout') || flag('sym-knee') || flag('cm-masld')) {
    cond.push({ test: 'Uric acid', reason: 'gout/metabolic risk' })
  }
  if (flag('cm-htn') || flag('cm-dm')) {
    cond.push({ test: 'U/A + microalbuminuria', reason: 'HTN/DM renal screen' })
  }
  if (flag('cm-masld')) {
    cond.push({ test: 'Abd sonography', reason: 'MASLD eval' })
  }
  if (flag('sx-thyroid') || flag('pe-thyroid')) {
    cond.push({ test: 'TSH (± free T4)', reason: 'suspect hypothyroidism' })
  }
  if (flag('sx-pcos')) {
    cond.push({ test: 'Total testosterone', reason: 'suspect PCOS' })
  }
  if (flag('sx-cushing') || flag('pe-mooning')) {
    cond.push({ test: '1 mg dexamethasone suppression test', reason: "suspect Cushing's" })
  }
  if (flag('sx-hypogonad')) {
    cond.push({ test: 'Total testosterone', reason: 'suspect male hypogonadism' })
  }
  const osaRisk = ['sym-snore', 'sym-sleepy', 'sym-apnea'].some((f) => flag(f))
  if (osaRisk || flag('cm-osa')) {
    cond.push({ test: 'STOP-BANG / PSG', reason: 'suspect OSA' })
  }
  if (flag('sym-dyspnea') || flag('cm-hfpef')) {
    cond.push({ test: 'ECG (± echo)', reason: 'suspect HFpEF/CV' })
  }

  return { routine, cond }
}

// ── Follow-up note (English) ──
export interface Delta {
  text: string
  good: boolean // green when ≤0, yellow otherwise
}
export interface FuResult {
  text: string
  wtDelta: Delta | null
  wtTotal: Delta | null
  waistDelta: Delta | null
}

export function renderFu(val: Val, flag: Flag, radio: Radio): FuResult {
  const lines: string[] = []
  let wtDelta: Delta | null = null
  let wtTotal: Delta | null = null
  let waistDelta: Delta | null = null

  // [Weight]
  const wtParts: string[] = []
  if (val('fu-wt')) wtParts.push(`current ${val('fu-wt')} kg`)
  const cur = parseFloat(val('fu-wt'))
  const prev = parseFloat(val('fu-wt-prev'))
  const start = parseFloat(val('fu-wt-start'))
  if (!isNaN(cur) && !isNaN(prev)) {
    const d = (cur - prev).toFixed(1)
    const sign = Number(d) > 0 ? '+' : ''
    wtParts.push(`Δ vs last visit ${sign}${d} kg`)
    wtDelta = { text: `Δ ${sign}${d} kg`, good: Number(d) <= 0 }
  }
  if (!isNaN(cur) && !isNaN(start)) {
    const d = (cur - start).toFixed(1)
    const pct = (((cur - start) / start) * 100).toFixed(1)
    const sign = Number(d) > 0 ? '+' : ''
    wtParts.push(`Δ vs baseline ${sign}${d} kg (${sign}${pct}%)`)
    wtTotal = { text: `Δ ${sign}${d} kg (${sign}${pct}%)`, good: Number(d) <= 0 }
  }
  const trendMap: Record<string, string> = {
    持續下降: 'sustained decrease',
    平台期: 'plateau',
    反彈: 'rebound',
    持平: 'unchanged',
  }
  if (radio('fu-trend')) wtParts.push(`trend: ${trendMap[radio('fu-trend')!] || radio('fu-trend')}`)

  const waistParts: string[] = []
  if (val('fu-waist')) waistParts.push(`WC ${val('fu-waist')} cm`)
  const wc = parseFloat(val('fu-waist'))
  const wcp = parseFloat(val('fu-waist-prev'))
  if (!isNaN(wc) && !isNaN(wcp)) {
    const d = (wc - wcp).toFixed(1)
    const sign = Number(d) > 0 ? '+' : ''
    waistParts.push(`Δ WC vs last ${sign}${d} cm`)
    waistDelta = { text: `Δ ${sign}${d} cm`, good: Number(d) <= 0 }
  }

  const allWt = [...wtParts, ...waistParts]
  if (allWt.length) lines.push(`[Weight] ${allWt.join('; ')}`)

  // [Medications]
  const meds = joinChecked(
    [
      { cond: flag('fu-med-glp1'), label: 'GLP-1 RA' },
      { cond: flag('fu-med-orlistat'), label: 'Orlistat' },
      { cond: flag('fu-med-pb'), label: 'Phen/Bup' },
      { cond: flag('fu-med-none'), label: 'none' },
    ],
    ', ',
  )
  const adhMap: Record<string, string> = { 佳: 'good', 尚可: 'fair', 差: 'poor' }
  const medParts: string[] = []
  if (meds) medParts.push(meds)
  if (val('fu-med-detail')) medParts.push(val('fu-med-detail'))
  if (radio('fu-adh')) medParts.push(`adherence ${adhMap[radio('fu-adh')!] || radio('fu-adh')}`)
  if (flag('fu-self-pay')) medParts.push('self-paid')
  let medLine: string | null = medParts.join('; ')
  medLine = appendNote(medLine, val('fu-med-note'))
  if (medLine) lines.push(`[Meds] ${medLine}`)

  // [Adverse effects]
  let ae = joinChecked(
    [
      { cond: flag('fu-ae-nausea'), label: 'nausea' },
      { cond: flag('fu-ae-vomit'), label: 'vomiting' },
      { cond: flag('fu-ae-diarrhea'), label: 'diarrhea' },
      { cond: flag('fu-ae-constip'), label: 'constipation' },
      { cond: flag('fu-ae-bloat'), label: 'bloating' },
      { cond: flag('fu-ae-reflux'), label: 'GERD' },
      { cond: flag('fu-ae-fatigue'), label: 'fatigue' },
      { cond: flag('fu-ae-inject'), label: 'injection-site reaction' },
    ],
    ', ',
  )
  ae = appendNote(ae, val('fu-ae-note'))
  if (ae) lines.push(`[Adverse effects] ${ae}`)

  // [Lifestyle adherence]
  const lsParts: string[] = []
  if (radio('fu-diet')) lsParts.push(`diet ${adhMap[radio('fu-diet')!] || radio('fu-diet')}`)
  if (radio('fu-exer')) lsParts.push(`exercise ${adhMap[radio('fu-exer')!] || radio('fu-exer')}`)
  let lsLine: string | null = lsParts.join(', ')
  lsLine = appendNote(lsLine, val('fu-ls-note'))
  if (lsLine) lines.push(`[Lifestyle] ${lsLine}`)

  // [Labs]
  const labParts: string[] = []
  if (flag('fu-lab-followup')) labParts.push('f/u labs pending')
  if (val('fu-lab-note')) labParts.push(val('fu-lab-note'))
  if (labParts.length) lines.push(`[Labs] ${labParts.join('; ')}`)

  // [Plan]
  let plan = joinChecked(
    [
      { cond: flag('fu-plan-continue'), label: 'continue current regimen' },
      { cond: flag('fu-plan-titrate'), label: 'titrate dose' },
      { cond: flag('fu-plan-switch'), label: 'switch agent' },
      { cond: flag('fu-plan-add'), label: 'add-on agent' },
      { cond: flag('fu-plan-stop'), label: 'discontinue' },
      { cond: flag('fu-plan-refer'), label: 'referral' },
      { cond: flag('fu-plan-lab'), label: 'arrange labs' },
    ],
    ', ',
  )
  plan = appendNote(plan, val('fu-plan-note'))
  if (plan) lines.push(`[Plan] ${plan}`)

  return {
    text: lines.length ? lines.join('\n') : FU_PLACEHOLDER,
    wtDelta,
    wtTotal,
    waistDelta,
  }
}

// ── Waist central-obesity note ──
export function waistNote(sex: string | undefined, waist: string): { text: string; warn: boolean } {
  if (!sex) return { text: '請先選性別', warn: false }
  const w = parseFloat(waist)
  if (isNaN(w)) return { text: `${sex} ≥ ${sex === '男' ? 90 : 80} cm 為中心性肥胖`, warn: false }
  const cutoff = sex === '男' ? 90 : 80
  if (w >= cutoff) return { text: `⚠ 達中心性肥胖（${sex} ≥ ${cutoff} cm）`, warn: true }
  return { text: `未達中心性肥胖（${sex} ≥ ${cutoff} cm）`, warn: false }
}

// ── BMI（台灣衛福部標準）──
export interface BmiBand {
  min: number
  max: number | null
  label: string
}
export const BMI_BANDS: BmiBand[] = [
  { min: 0, max: 18.5, label: '過輕' },
  { min: 18.5, max: 24.0, label: '正常' },
  { min: 24.0, max: 27.0, label: '過重' },
  { min: 27.0, max: 30.0, label: '輕度肥胖' },
  { min: 30.0, max: 35.0, label: '中度肥胖' },
  { min: 35.0, max: null, label: '重度肥胖' },
]

export function classifyBMI(bmi: number): string {
  for (const b of BMI_BANDS) {
    if (bmi >= b.min && (b.max === null || bmi < b.max)) return b.label
  }
  return '—'
}

export interface BmiRow {
  label: string
  bmiStr: string
  wtStr: string
  highlight: boolean
}
export interface BmiResult {
  current: { bmi: number; cat: string } | null
  currentHint: string | null // shown when current can't be computed
  rows: BmiRow[] | null // null when no height
  diff: string | null
}

export function computeBmi(heightStr: string, weightStr: string): BmiResult {
  const h = parseFloat(heightStr)
  const w = parseFloat(weightStr)

  let current: { bmi: number; cat: string } | null = null
  let currentHint: string | null = null
  if (h > 0 && w > 0) {
    const m = h / 100
    const bmi = w / (m * m)
    current = { bmi, cat: classifyBMI(bmi) }
  } else {
    currentHint = h > 0 ? '輸入目前體重以計算 BMI' : '輸入身高與目前體重，自動計算 BMI'
  }

  if (!(h > 0)) {
    return { current, currentHint, rows: null, diff: null }
  }

  const m = h / 100
  const currentBmi = w > 0 ? w / (m * m) : null
  const currentCat = currentBmi !== null ? classifyBMI(currentBmi) : null

  const rows: BmiRow[] = BMI_BANDS.map((b) => {
    const wtMin = (b.min * m * m).toFixed(1)
    const wtMax = b.max !== null ? (b.max * m * m).toFixed(1) : null
    let bmiStr: string, wtStr: string
    if (b.min === 0) {
      bmiStr = `< ${b.max!.toFixed(1)}`
      wtStr = `< ${wtMax} kg`
    } else if (b.max === null) {
      bmiStr = `≥ ${b.min.toFixed(1)}`
      wtStr = `≥ ${wtMin} kg`
    } else {
      bmiStr = `${b.min.toFixed(1)} – ${b.max.toFixed(1)}`
      wtStr = `${wtMin} – ${wtMax} kg`
    }
    return { label: b.label, bmiStr, wtStr, highlight: currentCat === b.label }
  })

  let diff: string | null = null
  if (w > 0 && currentBmi !== null) {
    const target = 24.0
    const targetKg = target * m * m
    const diffKg = w - targetKg
    if (diffKg > 0.5) {
      diff = `若要達 BMI < 24（正常範圍），需減 ${diffKg.toFixed(1)} kg（目標體重 < ${targetKg.toFixed(1)} kg）`
    } else if (currentBmi < 18.5) {
      const lowKg = 18.5 * m * m
      diff = `目前 BMI 過輕，達 BMI ≥ 18.5 需增加 ${(lowKg - w).toFixed(1)} kg（目標體重 ≥ ${lowKg.toFixed(1)} kg）`
    }
  }

  return { current, currentHint, rows, diff }
}
