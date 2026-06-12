// ═══════════════════════════════════════════════════════════════
// Lipid risk + NHI reimbursement engine
// Ported verbatim from legacy lipid.html / lipid_nhi.html inline scripts.
// Medical logic is unchanged. The full-version calc functions emit HTML
// strings (rendered via dangerouslySetInnerHTML); the simplified version
// returns structured data. Only the drugs cross-link href was changed
// from "drugs.html?q=" to "/drugs?q=" for the SPA router.
// ═══════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Sex = 'M' | 'F'

export interface LipidInput {
  age: number | null
  sex: Sex
  tc: number | null
  ldl: number | null
  ldlSource: 'measured' | 'calculated' | null
  hdl: number | null
  tg: number | null
  tgmed: number | null
  sbp: number | null
  dbp: number | null
  bpMed: number | null
  egfr: number | null
  uacr: number | null
  waist: number | null
  smoking: number | null
  htn: number | null
  fh: number | null
  fhcad: number | null
  dm: number | null
  ascvd: number | null
  ascvd_multi: number | null
  imaging_stenosis: number | null
  ascvdTypes: string[]
  cac: number | null
  lpa: number | null
  hscrp: number | null
  statin: string
  statinDose: string
  eze: number | null
  fpg: number | null
  hba1c: number | null
  dmMed: number | null
}

// ── Effective LDL (measured first, else Friedewald) ──
export function computeEffectiveLDL(
  tc: number | null,
  hdl: number | null,
  tg: number | null,
  ldl: number | null
): { value: number | null; source: 'measured' | 'calculated' | null } {
  if (ldl) return { value: ldl, source: 'measured' }
  if (tc && hdl && tg && tg < 400) {
    const calc = tc - hdl - tg / 5
    if (calc > 0) return { value: Math.round(calc), source: 'calculated' }
  }
  return { value: null, source: null }
}

// ─────────────────────────────────────────────────────────────
//  SCORE2 / SCORE2-OP
// ─────────────────────────────────────────────────────────────
function _score2Base(age: number, sex: Sex, sbp: number, tc_mmol: number, hdl_mmol: number, smoking: number | null) {
  const isMale = sex === 'M'
  const ageC = (age - 60) / 5
  const sbpC = (sbp - 120) / 20
  const tcC = tc_mmol - 6
  const hdlC = (hdl_mmol - 1.3) / 0.5
  const smk = smoking ? 1 : 0
  const dm = 0

  let lp
  if (isMale) {
    lp =
      0.3742 * ageC +
      0.6012 * smk +
      0.2777 * sbpC +
      0.6457 * dm +
      0.1458 * tcC -
      0.2698 * hdlC -
      0.0755 * ageC * smk -
      0.0255 * ageC * sbpC -
      0.0281 * ageC * tcC +
      0.0426 * ageC * hdlC -
      0.0983 * ageC * dm
  } else {
    lp =
      0.4648 * ageC +
      0.7744 * smk +
      0.3131 * sbpC +
      0.8096 * dm +
      0.1002 * tcC -
      0.2606 * hdlC -
      0.1088 * ageC * smk -
      0.0277 * ageC * sbpC -
      0.0226 * ageC * tcC +
      0.0613 * ageC * hdlC -
      0.1272 * ageC * dm
  }

  const S0 = isMale ? 0.9605 : 0.9776
  return 1 - Math.pow(S0, Math.exp(lp))
}

function _score2OPBase(age: number, sex: Sex, sbp: number, tc_mmol: number, hdl_mmol: number, smoking: number | null) {
  const isMale = sex === 'M'
  const ageC = age - 73
  const sbpC = sbp - 150
  const tcC = tc_mmol - 6
  const hdlC = hdl_mmol - 1.4
  const smk = smoking ? 1 : 0
  const dm = 0

  let lp, meanLP, S0
  if (isMale) {
    lp =
      0.0634 * ageC +
      0.4245 * dm +
      0.3524 * smk +
      0.0094 * sbpC +
      0.085 * tcC -
      0.3564 * hdlC -
      0.0174 * ageC * dm -
      0.0247 * ageC * smk -
      0.0005 * ageC * sbpC +
      0.0073 * ageC * tcC +
      0.0091 * ageC * hdlC
    meanLP = 0.0929
    S0 = 0.7576
  } else {
    lp =
      0.0789 * ageC +
      0.601 * dm +
      0.4921 * smk +
      0.0102 * sbpC +
      0.0605 * tcC -
      0.304 * hdlC -
      0.0107 * ageC * dm -
      0.0255 * ageC * smk -
      0.0004 * ageC * sbpC -
      0.0009 * ageC * tcC +
      0.0154 * ageC * hdlC
    meanLP = 0.229
    S0 = 0.8082
  }

  return 1 - Math.pow(S0, Math.exp(lp - meanLP))
}

function calcScore2(age: number, sex: Sex, sbp: number, tc_mmol: number, hdl_mmol: number, smoking: number | null) {
  if (age == null || sbp == null || tc_mmol == null || hdl_mmol == null) return null
  const risk = age >= 70 ? _score2OPBase(age, sex, sbp, tc_mmol, hdl_mmol, smoking) : _score2Base(age, sex, sbp, tc_mmol, hdl_mmol, smoking)
  return Math.max(0, Math.min(1, risk)) * 100
}

function score2RiskBand(score2: number | null): { band: string | null; label: string | null } {
  if (score2 === null || score2 === undefined) return { band: null, label: null }
  if (score2 >= 20) return { band: 'veryhigh', label: '≥20%' }
  if (score2 >= 10) return { band: 'high', label: '≥10% 且 <20%' }
  if (score2 >= 2) return { band: 'moderate', label: '≥2% 且 <10%' }
  return { band: 'low', label: '<2%' }
}

// ─────────────────────────────────────────────────────────────
//  AHA PREVENT 10-yr ASCVD risk (base equation)
// ─────────────────────────────────────────────────────────────
const PREVENT_ASCVD_10YR: Record<string, Record<string, number>> = {
  female: { age10: 0.719883, nonHdl: 0.1176967, hdl: -0.151185, sbpLt: -0.0835358, sbpGe: 0.3592852, dm: 0.8348585, smk: 0.4831078, bmiLt: 0.0, bmiGe: 0.0, egfrLt: 0.4864619, egfrGe: 0.0397779, bpTx: 0.2265309, statin: -0.0592374, txSbp: -0.0395762, txNonHdl: 0.0844423, ageNonHdl: -0.0567839, ageHdl: 0.0325692, ageSbpGe: -0.1035985, ageDm: -0.2417542, ageSmk: -0.0791142, ageBmiGe: 0.0, ageEgfrLt: -0.1671492, k0: -3.819975 },
  male: { age10: 0.7099847, nonHdl: 0.1658663, hdl: -0.1144285, sbpLt: -0.2837212, sbpGe: 0.3239977, dm: 0.7189597, smk: 0.3956973, bmiLt: 0.0, bmiGe: 0.0, egfrLt: 0.3690075, egfrGe: 0.0203619, bpTx: 0.2036522, statin: -0.0865581, txSbp: -0.0322916, txNonHdl: 0.114563, ageNonHdl: -0.0300005, ageHdl: 0.0232747, ageSbpGe: -0.0927024, ageDm: -0.2018525, ageSmk: -0.0970527, ageBmiGe: 0.0, ageEgfrLt: -0.1217081, k0: -3.500655 },
}

function calcPrevent(
  age: number,
  sex: Sex,
  sbp: number,
  tc_mgdl: number,
  hdl_mgdl: number,
  dm: number | null,
  smoking: number | null,
  bpMed: number | null,
  _dmMed: number | null,
  egfr: number | null
) {
  const sexKey = sex === 'M' ? 'male' : 'female'
  const statinFlag = 0
  const bmi = 25
  const eGFR = egfr || 90

  const MGDL_PER_MMOL = 38.67
  const nonHdlMmol = (tc_mgdl - hdl_mgdl) / MGDL_PER_MMOL
  const hdlMmol = hdl_mgdl / MGDL_PER_MMOL

  const age10 = (age - 55) / 10
  const dmF = dm ? 1 : 0
  const smkF = smoking ? 1 : 0
  const bpTxF = bpMed ? 1 : 0

  const nonHdl = nonHdlMmol - 3.5
  const hdl = (hdlMmol - 1.3) / 0.3

  const sbpLt = (Math.min(sbp, 110) - 110) / 20
  const sbpGe = (Math.max(sbp, 110) - 130) / 20
  const bmiLt = (Math.min(bmi, 30) - 25) / 5
  const bmiGe = (Math.max(bmi, 30) - 30) / 5
  const egfrLt = (Math.min(eGFR, 60) - 60) / -15
  const egfrGe = (Math.max(eGFR, 60) - 90) / -15

  const t: Record<string, number> = {
    age10,
    nonHdl,
    hdl,
    sbpLt,
    sbpGe,
    dm: dmF,
    smk: smkF,
    bmiLt,
    bmiGe,
    egfrLt,
    egfrGe,
    bpTx: bpTxF,
    statin: statinFlag,
    txSbp: bpTxF * sbpGe,
    txNonHdl: statinFlag * nonHdl,
    ageNonHdl: age10 * nonHdl,
    ageHdl: age10 * hdl,
    ageSbpGe: age10 * sbpGe,
    ageDm: age10 * dmF,
    ageSmk: age10 * smkF,
    ageBmiGe: age10 * bmiGe,
    ageEgfrLt: age10 * egfrLt,
  }

  const b = PREVENT_ASCVD_10YR[sexKey]
  let lp = b.k0
  for (const k in t) lp += (b[k] || 0) * t[k]

  const risk = 100 / (1 + Math.exp(-lp))
  return Math.max(0, Math.min(99, risk))
}

// ─────────────────────────────────────────────────────────────
//  HTML render helpers
// ─────────────────────────────────────────────────────────────
function riskBadge(level: string, text: string) {
  return `<div class="risk-badge risk-${level}">${text}</div>`
}

function metricRow(label: string, value: string, cls = '') {
  return `<div class="result-metric">
    <span class="metric-label">${label}</span>
    <span class="metric-value ${cls}">${value}</span>
  </div>`
}

function reasoningBox(text: string) {
  return `<div class="reasoning-box">
    <div class="reasoning-label">推論依據</div>
    ${text}
  </div>`
}

// ─────────────────────────────────────────────────────────────
//  Taiwan 2025
// ─────────────────────────────────────────────────────────────
export function calcTaiwan(p: LipidInput): string {
  const { age, sex, ldl, ldlSource, tc, hdl, tg, tgmed, sbp, dbp, bpMed, egfr, uacr, waist, smoking, htn, fhcad, dm, ascvd, imaging_stenosis, ascvdTypes, cac, lpa, hscrp } = p
  let level: string, ldlTarget: number, nonhdlTarget: number
  const reasons: string[] = []

  const nonhdl = tc && hdl ? tc - hdl : null
  const isMale = sex === 'M'

  const metSyn = (() => {
    let count = 0
    const items: string[] = []
    if (waist && ((isMale && waist >= 90) || (!isMale && waist >= 80))) {
      count++
      items.push(`腹部肥胖（腰圍 ${waist}cm）`)
    }
    if (bpMed || (sbp && sbp >= 130) || (dbp && dbp >= 85)) {
      count++
      items.push(bpMed ? '血壓用藥' : `血壓偏高（${sbp || '?'}/${dbp || '?'} mmHg）`)
    }
    if (p.dmMed || (p.fpg && p.fpg >= 100)) {
      count++
      items.push(p.dmMed ? '血糖用藥' : `空腹血糖 ${p.fpg} mg/dL`)
    }
    if (tgmed || (tg && tg >= 150)) {
      count++
      items.push(tgmed ? 'TG 血脂用藥' : `TG ${tg} mg/dL`)
    }
    if (hdl && ((isMale && hdl < 40) || (!isMale && hdl < 50))) {
      count++
      items.push(`HDL-C ${hdl} mg/dL（男<40/女<50）`)
    }
    return { count, items, positive: count >= 3 }
  })()

  const hasCKD = (egfr && egfr < 60) || (uacr && uacr >= 30)
  const ckdDesc: string[] = []
  if (egfr && egfr < 60) ckdDesc.push(`eGFR ${egfr} mL/min/1.73m²`)
  if (uacr && uacr >= 30) ckdDesc.push(`UACR ${uacr} mg/g`)

  const ageRF = age && ((isMale && age >= 45) || (!isMale && age >= 55))
  const cac400 = cac !== null && cac >= 400

  const hasCAD = ascvd && ascvdTypes.some((t) => ['ACS', 'MI_1yr', 'MI_multi', 'PCI', 'CABG', 'multivessel'].includes(t))
  const hasPAD = ascvd && ascvdTypes.includes('PAD')
  const hasCarotid = ascvd && ascvdTypes.includes('carotid')

  const extremeConditions: string[] = []
  if (hasCAD) {
    if (ascvdTypes.includes('MI_1yr')) extremeConditions.push('一年內心肌梗塞')
    if (ascvdTypes.includes('MI_multi')) extremeConditions.push('≥2次心肌梗塞病史')
    if (ascvdTypes.includes('multivessel')) extremeConditions.push('多支冠狀動脈阻塞')
    if (ascvdTypes.includes('ACS_DM') || (ascvdTypes.includes('ACS') && dm)) extremeConditions.push('急性冠心症合併糖尿病')
    if (hasPAD) extremeConditions.push('合併周邊動脈疾病')
    if (hasCarotid) extremeConditions.push('合併頸動脈狹窄')
    if (!hasPAD && hasCarotid && hasCAD) extremeConditions.push('冠狀動脈疾病合併頸動脈狹窄')
  }
  const polyvascExtreme = hasPAD && (hasCAD || hasCarotid)

  if (extremeConditions.length > 0 || polyvascExtreme) {
    level = 'extreme'
    ldlTarget = 55
    nonhdlTarget = 85
    if (extremeConditions.length > 0) reasons.push(`冠狀動脈疾病合併：${extremeConditions.join('、')} → 極高風險`)
    if (polyvascExtreme && !extremeConditions.length) reasons.push(`周邊動脈疾病合併${hasCAD ? '冠狀動脈疾病' : ''}${hasCarotid ? '頸動脈狹窄' : ''} → 極高風險`)
  } else if (ascvd || imaging_stenosis) {
    level = 'veryhigh'
    ldlTarget = 70
    nonhdlTarget = 100
    if (ascvd) reasons.push('臨床確診 ASCVD（' + (ascvdTypes.length ? ascvdTypes.join('、') : '已記錄') + '）→ 非常高風險')
    if (imaging_stenosis) reasons.push('影像確認 ≥50% 直徑狹窄（冠狀動脈攝影/CTA/頸動脈或周邊血管超音波）→ 非常高風險')
  } else if (dm || hasCKD || (ldl && ldl >= 190) || cac400) {
    level = 'high'
    ldlTarget = 100
    nonhdlTarget = 130
    if (dm) reasons.push('糖尿病 → 高風險')
    if (hasCKD) reasons.push(`慢性腎臟病（${ckdDesc.join('、')}）→ 高風險`)
    if (ldl && ldl >= 190) reasons.push(`LDL-C ${ldl} mg/dL ≥190 → 高風險（可能 FH，建議家族篩檢）`)
    if (cac400) reasons.push(`冠狀動脈鈣化分數 CAC ${cac} ≥400 → 高風險`)
  } else {
    let rfCount = 0
    const rfList: string[] = []

    if (htn) {
      rfCount++
      rfList.push('高血壓')
    }
    if (ageRF) {
      rfCount++
      rfList.push(`年齡（${age}歲，${isMale ? '男≥45' : '女≥55'}歲）`)
    }
    if (fhcad) {
      rfCount++
      rfList.push(`早發冠心病家族史`)
    }
    if (hdl && ((isMale && hdl < 40) || (!isMale && hdl < 50))) {
      rfCount++
      rfList.push(`HDL-C 偏低（${hdl} mg/dL）`)
    }
    if (smoking) {
      rfCount++
      rfList.push('抽菸')
    }
    if (metSyn.positive) {
      rfCount++
      rfList.push(`代謝症候群（${metSyn.count}/5項：${metSyn.items.join('、')}）`)
    }

    if (rfList.length) reasons.push(`心血管危險因子（${rfCount} 項）：${rfList.join('、')}`)

    const advNotes: string[] = []
    if (cac !== null && cac >= 100 && cac < 400) advNotes.push(`CAC ${cac}（100-399，建議考慮積極治療）`)
    if (lpa !== null && lpa >= 50) advNotes.push(`Lp(a) ${lpa} mg/dL（≥50，獨立心血管風險因子）`)
    if (hscrp !== null && hscrp >= 2) advNotes.push(`hsCRP ${hscrp} mg/L（≥2，發炎指標升高）`)
    if (advNotes.length) reasons.push(`⚠️ 輔助評估指標（供醫師參考，不自動上移等級）：${advNotes.join('、')}`)

    if (rfCount >= 2) {
      level = 'moderate'
      ldlTarget = 115
      nonhdlTarget = 145
      reasons.push(`≥2 項危險因子 → 中度風險`)
    } else if (rfCount === 1) {
      level = 'low'
      ldlTarget = 130
      nonhdlTarget = 160
      reasons.push(`1 項危險因子 → 低度風險`)
    } else {
      level = 'low'
      ldlTarget = 130
      nonhdlTarget = 160
      reasons.push('無主要心血管危險因子 → 低度風險')
    }
  }

  const labels: Record<string, string> = { low: '低度風險', moderate: '中度風險', high: '高度風險', veryhigh: '非常高風險', extreme: '極高風險' }
  const ldlOK = ldl ? (ldl < ldlTarget ? '✓ 已達標' : `✗ 未達標（差 ${(ldl - ldlTarget).toFixed(0)} mg/dL）`) : '—'
  const metSynRow = metSyn.count > 0 ? metricRow(`代謝症候群（${metSyn.count}/5 項）`, metSyn.positive ? '✓ 符合（≥3項）' : `未符合（${metSyn.count}/5項）`) : ''

  let html = riskBadge(level, labels[level])
  html += metricRow('LDL-C 目標', `< ${ldlTarget} mg/dL`, 'target')
  html += metricRow('non-HDL-C 目標', `< ${nonhdlTarget} mg/dL`, 'target')
  if (ldl) html += metricRow('目前 LDL-C', `${ldl} mg/dL${ldlSource === 'calculated' ? ' <span style="color:var(--color-text-muted);font-size:12px;">(Friedewald 推算)</span>' : ''}`)
  html += metricRow('達標狀況', ldlOK)
  if (nonhdl) html += metricRow('目前 non-HDL-C', `${nonhdl} mg/dL`)
  html += metSynRow
  html += reasoningBox(reasons.map((r) => `• ${r}`).join('<br>'))
  return html
}

// ─────────────────────────────────────────────────────────────
//  ESC 2024/2025
// ─────────────────────────────────────────────────────────────
export function calcESC(p: LipidInput): string {
  const { age, sex, sbp, dbp, tc, hdl, ldl, ldlSource, smoking, ascvd, ascvd_multi, ascvdTypes, dm, fh, egfr, statin, statinDose, imaging_stenosis } = p
  let level: string | null, ldlTarget: number | null = null, nonhdlTarget: number | null = null
  let score2: number | null = null
  const reasons: string[] = []

  const tc_mmol = tc ? tc / 38.67 : null
  const ldl_mmol = ldl ? ldl / 38.67 : null
  const hdl_mmol = hdl ? hdl / 38.67 : null

  const hasSevereCKD = egfr && egfr < 30
  const hasModCKD = egfr && egfr >= 30 && egfr < 60

  const dmTargetOrgan = dm && (hasSevereCKD || (egfr && egfr < 45) || (p.uacr && p.uacr >= 300))
  const dmMajorRFcount = [p.htn, smoking, ldl_mmol && ldl_mmol > 2.6, hasModCKD].filter(Boolean).length

  const hasPolyvasc = ascvd && (ascvdTypes.includes('PAD') || ascvdTypes.includes('carotid')) && ascvdTypes.some((t) => ['ACS', 'MI_1yr', 'PCI', 'CABG', 'MI_multi', 'multivessel'].includes(t))

  const onMaxStatin = statin && statinDose === 'high'
  const hasRecurrentOnStatin = ascvd && ascvd_multi && onMaxStatin

  if (age && sbp && tc_mmol && hdl_mmol) {
    score2 = calcScore2(age, sex, sbp, tc_mmol, hdl_mmol, smoking)
  }
  const score2Band = score2RiskBand(score2)

  if (hasRecurrentOnStatin || hasPolyvasc) {
    level = 'extreme'
    ldlTarget = 40
    nonhdlTarget = 55
    if (hasRecurrentOnStatin) reasons.push('ASCVD 患者在最大耐受 statin 治療下仍發生復發性血管事件 → Extreme risk（LDL 目標 <40 mg/dL）')
    if (hasPolyvasc) reasons.push('Polyvascular disease（冠狀動脈 + 周邊/頸動脈同時受累）→ Extreme risk')
  } else if (
    ascvd ||
    imaging_stenosis ||
    dmTargetOrgan ||
    (dm && dmMajorRFcount >= 3) ||
    hasSevereCKD ||
    score2Band.band === 'veryhigh' ||
    (fh && (ascvd || p.htn || smoking || hasModCKD || (ldl_mmol && ldl_mmol > 4.9)))
  ) {
    level = 'veryhigh'
    ldlTarget = 55
    nonhdlTarget = 85

    if (ascvd) reasons.push('Documented ASCVD（' + (ascvdTypes.length ? ascvdTypes.join('、') : '臨床已記錄') + '）→ Very high risk')
    if (imaging_stenosis) reasons.push('影像確認顯著斑塊（≥50% 狹窄）→ Very high risk')
    if (dmTargetOrgan) reasons.push(`DM + 靶器官損傷（${[hasSevereCKD && `eGFR ${egfr}`, p.uacr && p.uacr >= 300 && `UACR ${p.uacr}`].filter(Boolean).join('、')}）→ Very high risk`)
    if (dm && dmMajorRFcount >= 3) reasons.push(`DM + ≥3 主要危險因子（${[p.htn && '高血壓', smoking && '抽菸', ldl_mmol && ldl_mmol > 2.6 && `LDL ${ldl}mg/dL`, hasModCKD && `CKD(eGFR${egfr})`].filter(Boolean).join('、')}）→ Very high risk`)
    if (hasSevereCKD) reasons.push(`Severe CKD（eGFR ${egfr} <30 mL/min/1.73m²）→ Very high risk`)
    if (score2Band.band === 'veryhigh') reasons.push(`SCORE2 ${score2!.toFixed(1)}%，${score2Band.label} → Very high risk`)
    if (fh && !ascvd) reasons.push('FH + 另一主要危險因子 → Very high risk')
  } else if (
    (tc_mmol && tc_mmol > 8) ||
    (ldl_mmol && ldl_mmol > 4.9) ||
    (sbp && sbp >= 180) ||
    (dbp && dbp >= 110) ||
    (fh && !ascvd) ||
    (dm && !dmTargetOrgan && dmMajorRFcount >= 1) ||
    hasModCKD ||
    score2Band.band === 'high'
  ) {
    level = 'high'
    ldlTarget = 70
    nonhdlTarget = 100

    if (tc_mmol && tc_mmol > 8) reasons.push(`TC ${tc} mg/dL（>${(8 * 38.67).toFixed(0)} mg/dL, >8 mmol/L）→ High risk`)
    if (ldl_mmol && ldl_mmol > 4.9) reasons.push(`LDL-C ${ldl} mg/dL（>190 mg/dL, >4.9 mmol/L）→ High risk`)
    if ((sbp && sbp >= 180) || (dbp && dbp >= 110)) reasons.push(`BP ${sbp || '?'}/${dbp || '?'} mmHg ≥180/110 → High risk`)
    if (fh && !ascvd) reasons.push('FH 無其他主要危險因子 → High risk')
    if (dm && !dmTargetOrgan) reasons.push(`DM 無靶器官損傷${dmMajorRFcount >= 1 ? '，有額外危險因子' : '，病程可能≥10年'} → High risk`)
    if (hasModCKD) reasons.push(`Moderate CKD（eGFR ${egfr} 30–59 mL/min/1.73m²）→ High risk`)
    if (score2Band.band === 'high') reasons.push(`SCORE2 ${score2!.toFixed(1)}%，${score2Band.label} → High risk`)
  } else if (score2Band.band === 'moderate' || (dm && age! < 50 && dmMajorRFcount === 0)) {
    level = 'moderate'
    ldlTarget = 100
    nonhdlTarget = 130
    if (score2Band.band === 'moderate') reasons.push(`SCORE2 ${score2!.toFixed(1)}%，${score2Band.label} → Moderate risk`)
    if (dm && age! < 50 && dmMajorRFcount === 0) reasons.push('Young DM（T2DM <50歲，病程<10年且無其他危險因子）→ Moderate risk')
  } else if (score2Band.band === 'low') {
    level = 'low'
    ldlTarget = 116
    nonhdlTarget = 145
    reasons.push(`SCORE2 ${score2!.toFixed(1)}%，${score2Band.label} → Low risk`)
    if (ldl_mmol && ldl_mmol >= 3.0 && ldl_mmol < 4.9) reasons.push(`LDL-C ${ldl} mg/dL 偏高（3.0–<4.9 mmol/L）→ ESC 2025 建議考慮藥物治療（Class IIa, A）`)
  } else {
    level = null
    reasons.push('需年齡、SBP、TC、HDL-C 才能計算 SCORE2')
  }

  const drivers: string[] = []
  if (score2 !== null) {
    if (smoking) drivers.push('抽菸')
    if (sbp && sbp >= 140) drivers.push(`SBP ${sbp} mmHg`)
    if (tc_mmol && tc_mmol >= 6) drivers.push(`TC ${tc} mg/dL`)
    if (hdl_mmol && hdl_mmol < 1.0) drivers.push(`HDL ${hdl} mg/dL 偏低`)
    if (age! >= 60) drivers.push(`年齡 ${age} 歲`)
  }

  const labels: Record<string, string> = {
    low: 'Low risk（低度）',
    moderate: 'Moderate risk（中度）',
    high: 'High risk（高度）',
    veryhigh: 'Very high risk（非常高）',
    extreme: 'Extreme risk（極高）',
  }
  const ldlOK = ldl ? (ldlTarget && ldl < ldlTarget ? '✓ 已達標' : ldlTarget ? `✗ 未達標（差 ${(ldl - ldlTarget).toFixed(0)} mg/dL）` : '—') : '—'

  let html = ''
  if (level === null) {
    html += `<div class="insufficient-notice">
      <div class="ins-title">資料不足</div>
      需年齡、SBP、總膽固醇、HDL-C 才能依 ESC 2024 指引分類風險
    </div>`
    html += reasoningBox(reasons.map((r) => `• ${r}`).join('<br>'))
    return html
  }

  html += riskBadge(level, labels[level])
  if (score2 !== null) {
    const modelLabel = age! >= 70 ? 'SCORE2-OP' : 'SCORE2'
    html += `<div class="score-display">
      <div class="score-big score">${score2.toFixed(1)}<small style="font-size:14px">%</small></div>
      <div class="score-label">${modelLabel} 10年 CVD 風險</div>
    </div>`
  }
  html += metricRow('LDL-C 目標', `< ${ldlTarget} mg/dL`, 'target')
  html += metricRow('non-HDL-C 目標', `< ${nonhdlTarget} mg/dL`, 'target')
  if (ldl) html += metricRow('目前 LDL-C', `${ldl} mg/dL${ldlSource === 'calculated' ? ' <span style="color:var(--color-text-muted);font-size:12px;">(Friedewald 推算)</span>' : ''}`)
  html += metricRow('達標狀況', ldlOK)
  html += reasoningBox(reasons.map((r) => `• ${r}`).join('<br>'))
  if (score2 !== null && drivers.length) {
    const modelLabel = age! >= 70 ? 'SCORE2-OP' : 'SCORE2'
    html += `<div class="drivers-block">
      <div class="drivers-label">${modelLabel} 主要貢獻因子</div>
      <div class="drivers-chips">${drivers.map((d) => `<span class="driver-chip">${d}</span>`).join('')}</div>
    </div>`
  }
  return html
}

// ─────────────────────────────────────────────────────────────
//  AHA 2026 PREVENT
// ─────────────────────────────────────────────────────────────
export function calcAHA(p: LipidInput): string {
  const { age, sex, sbp, tc, hdl, ldl, ldlSource, dm, smoking, bpMed, dmMed, egfr, ascvd, ascvd_multi, ascvdTypes, fh, cac, imaging_stenosis } = p
  let level: string | null, ldlTarget: number | null = null, nonhdlTarget: number | null = null
  let prevent: number | null = null
  const reasons: string[] = []

  if (ascvd) {
    const hasCAD = ascvdTypes.some((t) => ['ACS', 'MI_1yr', 'MI_multi', 'PCI', 'CABG', 'multivessel'].includes(t))
    const hasPAD = ascvdTypes.includes('PAD')
    const hasCarotid = ascvdTypes.includes('carotid')
    const hasPolyvasc = (hasPAD || hasCarotid) && hasCAD
    const onMaxStatin = p.statin && p.statinDose === 'high'
    const recurrentOnStatin = ascvd_multi && onMaxStatin
    const hasCKD = egfr && egfr < 60
    const recentACS = ascvdTypes.some((t) => ['ACS', 'MI_1yr'].includes(t))
    const multivessel = ascvdTypes.includes('multivessel') || ascvdTypes.includes('MI_multi')

    const veryHighFlags: string[] = []
    if (hasCKD) veryHighFlags.push(`CKD（eGFR ${egfr}）合併 ASCVD`)
    if (recurrentOnStatin) veryHighFlags.push('在最大耐受 statin 下復發 vascular event')
    if (hasPolyvasc) veryHighFlags.push('Polyvascular disease（冠狀動脈 + 周邊/頸動脈）')
    if (multivessel) veryHighFlags.push('多支冠狀動脈或多次 MI')
    if (recentACS) veryHighFlags.push('近期 ACS 或 1 年內 MI')
    if (dm) veryHighFlags.push('糖尿病合併 ASCVD')

    if (veryHighFlags.length > 0) {
      level = 'veryhigh'
      ldlTarget = 55
      nonhdlTarget = 85
      reasons.push('臨床 ASCVD → 二級預防（AHA 2026 Figure 11: Very high-risk）')
      reasons.push(`ASCVD 類型：${ascvdTypes.length ? ascvdTypes.join('、') : '已記錄'}`)
      reasons.push(`Very high-risk 條件：${veryHighFlags.join('、')}`)
      reasons.push('目標：LDL-C <55 mg/dL（且降幅 ≥50%），non-HDL-C <85 mg/dL（COR 1）')
      if (fh) reasons.push('合併 FH（建議 apoB <55 mg/dL）')
    } else {
      level = 'high'
      ldlTarget = 70
      nonhdlTarget = 100
      reasons.push('臨床 ASCVD → 二級預防（AHA 2026 Figure 12: Not very high-risk）')
      reasons.push(`ASCVD 類型：${ascvdTypes.length ? ascvdTypes.join('、') : '已記錄'}`)
      reasons.push('目標：LDL-C <70 mg/dL（降幅 ≥50%），non-HDL-C <100 mg/dL（COR 1）')
      reasons.push('Optional goal：LDL-C <55 mg/dL、non-HDL-C <85 mg/dL（COR 2a）')
      if (fh) reasons.push('合併 FH')
    }
  } else if (ldl && ldl >= 190) {
    const hasFHorRF = fh || (cac && cac >= 100) || imaging_stenosis || [dm, smoking, p.htn, egfr && egfr < 60].filter(Boolean).length >= 1

    if (hasFHorRF) {
      level = 'high'
      ldlTarget = 70
      nonhdlTarget = 100
      reasons.push(`LDL-C ${ldl} mg/dL ≥190（嚴重高膽固醇血症）合併 FH/危險因子/亞臨床動脈硬化`)
      reasons.push('目標：LDL-C <70 mg/dL，non-HDL-C <100 mg/dL')
      if (cac && cac >= 100) reasons.push(`CAC ${cac} ≥100 → 亞臨床動脈硬化證據`)
    } else {
      level = 'high'
      ldlTarget = 100
      nonhdlTarget = 130
      reasons.push(`LDL-C ${ldl} mg/dL ≥190（嚴重高膽固醇血症）`)
      reasons.push('無其他危險因子/FH/亞臨床動脈硬化 → 目標 LDL-C <100 mg/dL')
    }
  } else if (cac !== null && cac >= 1) {
    if (cac >= 1000) {
      level = 'veryhigh'
      ldlTarget = 55
      nonhdlTarget = 85
      reasons.push(`CAC ${cac} ≥1000（Extensive）→ 風險等同二級預防`)
      reasons.push('目標：LDL-C <55 mg/dL，non-HDL-C <85 mg/dL')
    } else if (cac >= 300) {
      level = 'high'
      ldlTarget = 70
      nonhdlTarget = 100
      reasons.push(`CAC ${cac} 300–999（Severe）`)
      reasons.push('目標：LDL-C <70 mg/dL，non-HDL-C <100 mg/dL')
    } else if (cac >= 100) {
      level = 'high'
      ldlTarget = 70
      nonhdlTarget = 100
      reasons.push(`CAC ${cac} 100–299 或 ≥75 百分位`)
      reasons.push('目標：LDL-C <70 mg/dL，non-HDL-C <100 mg/dL')
    } else {
      level = 'moderate'
      ldlTarget = 100
      nonhdlTarget = 130
      reasons.push(`CAC ${cac} 1–99（Mild，<75 百分位）`)
      reasons.push('目標：LDL-C <100 mg/dL，non-HDL-C <130 mg/dL')
    }
  } else if (dm && !ascvd) {
    if (age && age >= 40 && age <= 75) {
      if (age && sbp && tc && hdl) {
        prevent = calcPrevent(age, sex, sbp, tc, hdl, dm, smoking, bpMed, dmMed, egfr || 75)
      }
      const highRisk = prevent !== null ? prevent >= 10 : [p.htn, smoking, egfr && egfr < 60, ldl && ldl >= 130].filter(Boolean).length >= 2

      if (highRisk || (prevent !== null && prevent >= 10)) {
        level = 'high'
        ldlTarget = 70
        nonhdlTarget = 100
        reasons.push(`DM 40–75歲${prevent !== null ? `，PREVENT ${prevent.toFixed(1)}%，≥10%` : '，多重危險因子'} → High risk`)
        reasons.push('目標：LDL-C <70 mg/dL，non-HDL-C <100 mg/dL')
      } else {
        level = 'moderate'
        ldlTarget = 100
        nonhdlTarget = 130
        reasons.push(`DM 40–75歲${prevent !== null ? `，PREVENT ${prevent.toFixed(1)}%，<10%` : ''} → Moderate risk`)
        reasons.push('目標：LDL-C <100 mg/dL，non-HDL-C <130 mg/dL')
      }
    } else if (age && age > 75) {
      level = 'moderate'
      ldlTarget = 100
      nonhdlTarget = 130
      reasons.push('DM >75歲 → Benefit-risk discussion')
      reasons.push('目標：LDL-C <100 mg/dL，non-HDL-C <130 mg/dL')
    } else {
      if (age && sbp && tc && hdl) {
        prevent = calcPrevent(age, sex, sbp, tc, hdl, dm, smoking, bpMed, dmMed, egfr || 75)
      }
      if (prevent !== null && prevent >= 3) {
        level = 'moderate'
        ldlTarget = 100
        nonhdlTarget = 130
        reasons.push(`DM 20–39歲，PREVENT ${prevent.toFixed(1)}%，≥3% → 考慮 moderate statin`)
      } else {
        level = 'low'
        ldlTarget = 130
        nonhdlTarget = 160
        reasons.push(`DM 20–39歲${prevent !== null ? `，PREVENT ${prevent.toFixed(1)}%，<3%` : ''} → 評估 DM 特定風險增強因子`)
      }
    }
  } else if (age && sbp && tc && hdl) {
    prevent = calcPrevent(age, sex, sbp, tc, hdl, dm, smoking, bpMed, dmMed, egfr || 75)

    if (prevent < 3) {
      level = 'low'
      ldlTarget = 160
      nonhdlTarget = 190
      reasons.push(`PREVENT ${prevent.toFixed(1)}%，<3% → Low risk`)
      if (ldl && ldl >= 160) {
        ldlTarget = 100
        nonhdlTarget = 130
        reasons.push(`LDL-C ${ldl} mg/dL 160–189，10年風險低但 LDL 偏高`)
      }
    } else if (prevent < 5) {
      level = 'moderate'
      ldlTarget = 100
      nonhdlTarget = 130
      reasons.push(`PREVENT ${prevent.toFixed(1)}%，3% 至 <5% → Borderline risk`)
    } else if (prevent < 10) {
      level = 'moderate'
      ldlTarget = 100
      nonhdlTarget = 130
      reasons.push(`PREVENT ${prevent.toFixed(1)}%，5% 至 <10% → Intermediate risk`)
    } else {
      level = 'high'
      ldlTarget = 70
      nonhdlTarget = 100
      reasons.push(`PREVENT ${prevent.toFixed(1)}%，≥10% → High risk`)
      reasons.push('AHA 2026 Recommendation 8（COR 2a, B-R）：高風險一級預防 LDL-C <70 mg/dL，non-HDL-C <100 mg/dL')
      reasons.push('AHA 2026 Recommendation 7（COR 1, A）：建議 high-intensity statin、LDL-C 降幅 ≥50%')
    }
  } else {
    level = null
    reasons.push('需年齡、SBP、TC、HDL-C 才能計算 PREVENT')
  }

  const drivers: string[] = []
  if (prevent !== null) {
    if (smoking) drivers.push('抽菸')
    if (dm) drivers.push('糖尿病')
    if (sbp && sbp >= 130) drivers.push(`SBP ${sbp} mmHg`)
    if (egfr && egfr < 60) drivers.push(`eGFR ${egfr}（CKD）`)
    if (hdl && hdl < 40) drivers.push(`HDL ${hdl} mg/dL 偏低`)
    if (age! >= 60) drivers.push(`年齡 ${age} 歲`)
  }

  const labels: Record<string, string> = {
    low: 'Low risk（低度）',
    moderate: 'Borderline / Intermediate',
    high: 'High risk（高度）',
    veryhigh: 'Very high risk（非常高）',
    extreme: 'Extreme risk（極高）',
  }
  const ldlOK = ldl ? (ldlTarget && ldl < ldlTarget ? '✓ 已達標' : ldlTarget ? `✗ 未達標（差 ${(ldl - ldlTarget).toFixed(0)} mg/dL）` : '—') : '—'

  let html = ''
  if (level === null) {
    html += `<div class="insufficient-notice">
      <div class="ins-title">資料不足</div>
      需年齡、SBP、總膽固醇、HDL-C 才能依 AHA 2026 指引分類風險
    </div>`
    html += reasoningBox(reasons.map((r) => `• ${r}`).join('<br>'))
    return html
  }

  html += riskBadge(level, labels[level])
  if (prevent !== null) {
    html += `<div class="score-display">
      <div class="score-big score">${prevent.toFixed(1)}<small style="font-size:14px">%</small></div>
      <div class="score-label">PREVENT-ASCVD 10年風險</div>
    </div>`
  }
  html += metricRow('LDL-C 目標', `< ${ldlTarget} mg/dL`, 'target')
  html += metricRow('non-HDL-C 目標', `< ${nonhdlTarget} mg/dL`, 'target')
  if (ldl) html += metricRow('目前 LDL-C', `${ldl} mg/dL${ldlSource === 'calculated' ? ' <span style="color:var(--color-text-muted);font-size:12px;">(Friedewald 推算)</span>' : ''}`)
  html += metricRow('達標狀況', ldlOK)
  html += reasoningBox(reasons.map((r) => `• ${r}`).join('<br>'))
  if (prevent !== null && drivers.length) {
    html += `<div class="drivers-block">
      <div class="drivers-label">PREVENT 主要貢獻因子</div>
      <div class="drivers-chips">${drivers.map((d) => `<span class="driver-chip">${d}</span>`).join('')}</div>
    </div>`
  }
  return html
}

// ─────────────────────────────────────────────────────────────
//  NHI reimbursement (full version)
// ─────────────────────────────────────────────────────────────
export function calcNHI(p: LipidInput): string {
  const { ldl, tc, hdl, tg, ascvd, ascvdTypes, dm, htn, smoking, statin, statinDose, eze, age, sex } = p
  let html = ''

  const isMale = sex === 'M'

  const hasCV = ascvd
  const hasAcuteOrRevascularization = ascvd && ascvdTypes.some((t) => ['ACS', 'MI_1yr', 'MI_multi', 'PCI', 'CABG'].includes(t))

  const rfItems: string[] = []
  if (htn) rfItems.push('高血壓')
  if (age && ((isMale && age >= 45) || (!isMale && age >= 55))) rfItems.push(`年齡（${age}歲）`)
  if (p.fhcad) rfItems.push('早發冠心病家族史')
  if (smoking) rfItems.push('吸菸')
  if (hdl && hdl < 40) rfItems.push(`HDL-C ${hdl} mg/dL <40`)
  const rfCount = rfItems.length

  // 一、Statin
  html += `<div class="nhi-section"><div class="nhi-section-title">降膽固醇藥物（Statin）</div>`

  let statinCovered = false
  let statinCategory = ''
  let statinLDLTarget: number | null = null
  let statinTCTarget: number | null = null
  const statinReasons: string[] = []

  if (hasAcuteOrRevascularization) {
    statinCategory = '第一類（急性冠心症/PCI/CABG）'
    statinLDLTarget = 70
    if (ldl && ldl >= 70) {
      statinCovered = true
      statinReasons.push(`LDL-C ${ldl} mg/dL ≥70 → 符合給付`)
    } else if (ldl) {
      statinReasons.push(`LDL-C ${ldl} mg/dL <70，目前已達目標值，暫不符合起始給付條件`)
    } else {
      statinCovered = true
      statinReasons.push('急性冠心症/PCI/CABG 病史，建議檢測 LDL-C 確認')
    }
    statinReasons.push('目標：LDL-C <70 mg/dL')
    statinReasons.push('追蹤：第一年每 3–6 個月，第二年後至少每 6–12 個月')
  } else if (hasCV || dm) {
    statinCategory = '第二類（心血管疾病或糖尿病）'
    statinLDLTarget = 100
    statinTCTarget = 160
    const ldlOK = ldl && ldl >= 100
    const tcOK = tc && tc >= 160
    if (ldlOK || tcOK) {
      statinCovered = true
      const triggers: string[] = []
      if (tcOK) triggers.push(`TC ${tc} mg/dL ≥160`)
      if (ldlOK) triggers.push(`LDL-C ${ldl} mg/dL ≥100`)
      statinReasons.push(`${triggers.join(' 或 ')} → 符合給付`)
    } else {
      const vals: string[] = []
      if (tc) vals.push(`TC ${tc} mg/dL <160`)
      if (ldl) vals.push(`LDL-C ${ldl} mg/dL <100`)
      statinReasons.push(`${vals.join('、')}，未達起始給付條件`)
    }
    statinReasons.push('目標：TC <160 mg/dL 或 LDL-C <100 mg/dL')
    statinReasons.push('可與藥物治療並行（不需非藥物治療期）')
  } else if (rfCount >= 2) {
    statinCategory = `第三類（≥2個危險因子：${rfItems.join('、')}）`
    statinLDLTarget = 130
    statinTCTarget = 200
    const ldlOK = ldl && ldl >= 130
    const tcOK = tc && tc >= 200
    if (ldlOK || tcOK) {
      statinCovered = true
      const triggers: string[] = []
      if (tcOK) triggers.push(`TC ${tc} mg/dL ≥200`)
      if (ldlOK) triggers.push(`LDL-C ${ldl} mg/dL ≥130`)
      statinReasons.push(`${triggers.join(' 或 ')} → 符合給付`)
    } else {
      const vals: string[] = []
      if (tc) vals.push(`TC ${tc} mg/dL <200`)
      if (ldl) vals.push(`LDL-C ${ldl} mg/dL <130`)
      statinReasons.push(`${vals.join('、')}，未達起始給付條件`)
    }
    statinReasons.push('目標：TC <200 mg/dL 或 LDL-C <130 mg/dL')
    statinReasons.push('需先有 3–6 個月非藥物治療')
  } else if (rfCount === 1) {
    statinCategory = `第四類（1個危險因子：${rfItems.join('、')}）`
    statinLDLTarget = 160
    statinTCTarget = 240
    const ldlOK = ldl && ldl >= 160
    const tcOK = tc && tc >= 240
    if (ldlOK || tcOK) {
      statinCovered = true
      const triggers: string[] = []
      if (tcOK) triggers.push(`TC ${tc} mg/dL ≥240`)
      if (ldlOK) triggers.push(`LDL-C ${ldl} mg/dL ≥160`)
      statinReasons.push(`${triggers.join(' 或 ')} → 符合給付`)
    } else {
      const vals: string[] = []
      if (tc) vals.push(`TC ${tc} mg/dL <240`)
      if (ldl) vals.push(`LDL-C ${ldl} mg/dL <160`)
      statinReasons.push(`${vals.join('、')}，未達起始給付條件`)
    }
    statinReasons.push('目標：TC <240 mg/dL 或 LDL-C <160 mg/dL')
    statinReasons.push('需先有 3–6 個月非藥物治療')
  } else {
    statinCategory = '第五類（0個危險因子）'
    statinLDLTarget = 190
    if (ldl && ldl >= 190) {
      statinCovered = true
      statinReasons.push(`LDL-C ${ldl} mg/dL ≥190 → 符合給付`)
    } else {
      statinReasons.push(`LDL-C ${ldl ? ldl + ' mg/dL <190' : '未填'}，未達起始給付條件`)
    }
    statinReasons.push('目標：LDL-C <190 mg/dL')
    statinReasons.push('需先有 3–6 個月非藥物治療')
  }

  if (rfCount > 0) statinReasons.push(`健保危險因子（${rfCount}/5）：${rfItems.join('、')}`)

  html += `<div class="coverage-item ${statinCovered ? 'covered' : 'not-covered'}">
    <span class="coverage-icon">${statinCovered ? '✅' : '❌'}</span>
    <span class="coverage-text">
      <strong>Statin｜${statinCategory}</strong><br>
      ${statinReasons.map((r) => `• ${r}`).join('<br>')}
    </span>
  </div>`

  if (statinCovered) {
    html += `
      <div class="quick-action-row">
        <span class="quick-action-label">查健保給付規定</span>
        <a href="/drugs?q=Atorvastatin" class="quick-action-chip">Atorvastatin</a>
        <a href="/drugs?q=Rosuvastatin" class="quick-action-chip">Rosuvastatin</a>
        <a href="/drugs?q=Pitavastatin" class="quick-action-chip">Pitavastatin</a>
        <a href="/drugs?q=Simvastatin"  class="quick-action-chip">Simvastatin</a>
      </div>
    `
  }

  html += `</div>`

  // 二、降 TG
  html += `<div class="nhi-section"><div class="nhi-section-title">降 TG 藥物（Fibrate / 魚油等）</div>`

  let tgCovered = false
  const tgReasons: string[] = []
  const tcHdlRatio = tc && hdl && hdl > 0 ? tc / hdl : null
  const hdlLow = hdl && hdl < 40

  if (hasCV || dm) {
    if (tg && tg >= 500) {
      tgCovered = true
      tgReasons.push(`TG ${tg} mg/dL ≥500 → 符合給付（可與藥物治療並行）`)
      tgReasons.push('目標：TG <500 mg/dL')
    } else if (tg && tg >= 200 && ((tcHdlRatio && tcHdlRatio > 5) || hdlLow)) {
      tgCovered = true
      const cond: string[] = []
      if (tcHdlRatio && tcHdlRatio > 5) cond.push(`TC/HDL-C ${tcHdlRatio.toFixed(1)} >5`)
      if (hdlLow) cond.push(`HDL-C ${hdl} mg/dL <40`)
      tgReasons.push(`TG ${tg} mg/dL ≥200 且（${cond.join(' 或 ')}）→ 符合給付`)
      tgReasons.push('目標：TG <200 mg/dL')
      tgReasons.push('可與藥物治療並行（不需非藥物治療期）')
    } else {
      if (tg) {
        const missing: string[] = []
        if (tg < 200) missing.push(`TG ${tg} mg/dL <200`)
        else {
          const condMissing: string[] = []
          if (!tcHdlRatio || tcHdlRatio <= 5) condMissing.push(`TC/HDL-C ${tcHdlRatio ? tcHdlRatio.toFixed(1) : '未知'} ≤5`)
          if (!hdlLow) condMissing.push(`HDL-C ${hdl || '未填'} mg/dL ≥40`)
          missing.push(`不符合附加條件（${condMissing.join(' 且 ')}）`)
        }
        tgReasons.push(`未達給付條件：${missing.join('、')}`)
      } else {
        tgReasons.push('未填 TG 值，無法判斷')
      }
    }
  } else {
    if (tg && tg >= 500) {
      tgCovered = true
      tgReasons.push(`TG ${tg} mg/dL ≥500 → 符合給付（可與藥物治療並行）`)
      tgReasons.push('目標：TG <500 mg/dL')
    } else if (tg && tg >= 200 && ((tcHdlRatio && tcHdlRatio > 5) || hdlLow)) {
      tgCovered = true
      const cond: string[] = []
      if (tcHdlRatio && tcHdlRatio > 5) cond.push(`TC/HDL-C ${tcHdlRatio.toFixed(1)} >5`)
      if (hdlLow) cond.push(`HDL-C ${hdl} mg/dL <40`)
      tgReasons.push(`TG ${tg} mg/dL ≥200 且（${cond.join(' 或 ')}）→ 符合給付`)
      tgReasons.push('目標：TG <200 mg/dL')
      tgReasons.push('需先有 3–6 個月非藥物治療')
    } else {
      if (tg) {
        const missing: string[] = []
        if (tg < 200) missing.push(`TG ${tg} mg/dL <200`)
        else {
          const condMissing: string[] = []
          if (!tcHdlRatio || tcHdlRatio <= 5) condMissing.push(`TC/HDL-C ≤5`)
          if (!hdlLow) condMissing.push(`HDL-C ≥40 mg/dL`)
          missing.push(`不符合附加條件（${condMissing.join(' 且 ')}）`)
        }
        tgReasons.push(`未達給付條件：${missing.join('、')}`)
      } else {
        tgReasons.push('未填 TG 值，無法判斷')
      }
    }
  }
  tgReasons.push('追蹤：第一年每 3–6 個月，第二年後至少每 6–12 個月')

  html += `<div class="coverage-item ${tgCovered ? 'covered' : 'not-covered'}">
    <span class="coverage-icon">${tgCovered ? '✅' : '❌'}</span>
    <span class="coverage-text">
      <strong>降 TG 藥物</strong><br>
      ${tgReasons.map((r) => `• ${r}`).join('<br>')}
    </span>
  </div>`
  html += `</div>`

  // 三、Ezetimibe
  html += `<div class="nhi-section"><div class="nhi-section-title">Ezetimibe（如 Ezetrol）</div>`
  let ezeCovered = false
  const ezeReasons: string[] = []

  if (!statinCovered) {
    ezeReasons.push('Statin 本身不符合給付條件，Ezetimibe 亦不予給付')
  } else {
    const onStatin = statin !== ''
    if (!onStatin) {
      ezeCovered = true
      ezeReasons.push('未使用 Statin（Statin 不耐受）→ 可單獨申請 Ezetimibe 給付')
      ezeReasons.push('條件：Severe myalgia 或 Myositis')
    } else {
      if (statinLDLTarget && ldl && ldl >= statinLDLTarget) {
        ezeCovered = true
        ezeReasons.push(`使用 Statin ≥3 個月後 LDL-C ${ldl} mg/dL 仍 ≥ 目標值 ${statinLDLTarget} mg/dL → 可合併 Ezetimibe`)
      } else if (statinTCTarget && tc && tc >= statinTCTarget) {
        ezeCovered = true
        ezeReasons.push(`使用 Statin ≥3 個月後 TC ${tc} mg/dL 仍 ≥ 目標值 ${statinTCTarget} mg/dL → 可合併 Ezetimibe`)
      } else {
        ezeReasons.push(`使用 Statin 後血脂已達目標（LDL-C <${statinLDLTarget}${statinTCTarget ? ' 且 TC <' + statinTCTarget : ''} mg/dL）→ 暫不符合 Ezetimibe 給付`)
      }
    }
    ezeReasons.push('適用診斷：原發性高膽固醇血症、HoFH、植物脂醇血症')
  }

  html += `<div class="coverage-item ${ezeCovered ? 'covered' : statinCovered ? 'conditional' : 'not-covered'}">
    <span class="coverage-icon">${ezeCovered ? '✅' : statinCovered ? '⚠️' : '❌'}</span>
    <span class="coverage-text">
      <strong>Ezetimibe</strong><br>
      ${ezeReasons.map((r) => `• ${r}`).join('<br>')}
    </span>
  </div>`

  if (ezeCovered) {
    html += `
      <div class="quick-action-row">
        <span class="quick-action-label">查健保給付規定</span>
        <a href="/drugs?q=Ezetimibe" class="quick-action-chip">Ezetimibe</a>
      </div>
    `
  }

  html += `</div>`

  // 四、PCSK9
  html += `<div class="nhi-section"><div class="nhi-section-title">PCSK9 抑制劑<br><small style="color:var(--color-text-muted);font-weight:400">Evolocumab（Repatha）/ Alirocumab（Praluent）</small></div>`
  let pcsk9Covered = false
  let pcsk9Class = 'not-covered'
  const pcsk9Reasons: string[] = []

  const majorEventTypes = ['ACS', 'MI_1yr', 'MI_multi', 'PCI', 'CABG', 'stroke']
  const hasMajorEvent = ascvd && ascvdTypes.some((t) => majorEventTypes.includes(t))

  const onHighStatin = statin !== '' && statinDose === 'high'
  const onMaxStatinPlusEze = onHighStatin && eze
  const statinIntolerantWithEze = statin === '' && eze

  if (!ascvd) {
    pcsk9Reasons.push('無臨床 ASCVD → 不符合 PCSK9 抑制劑給付（重大心血管事件後一年內才符合）')
  } else if (!hasMajorEvent) {
    pcsk9Reasons.push(`ASCVD 類型（${ascvdTypes.join('、')}）不屬於重大心血管事件（需為心肌梗塞、冠狀動脈/其他動脈血管再通術、或動脈硬化相關缺血性腦中風）`)
  } else {
    pcsk9Reasons.push(`重大心血管事件：${ascvdTypes.filter((t) => majorEventTypes.includes(t)).join('、')} ✓`)

    if (onMaxStatinPlusEze) {
      if (ldl && ldl > 100) {
        pcsk9Covered = true
        pcsk9Class = 'covered'
        pcsk9Reasons.push(`情境 A：高強度 Statin + Ezetimibe 10mg 各 ≥3 個月後，LDL-C ${ldl} mg/dL 仍 >100 mg/dL → 符合給付`)
      } else {
        pcsk9Reasons.push(`情境 A：使用高強度 Statin + Ezetimibe，但 LDL-C ${ldl || '未填'} mg/dL ≤100 → 不符合`)
      }
    } else if (statinIntolerantWithEze) {
      if (ldl && ldl > 100) {
        pcsk9Covered = true
        pcsk9Class = 'covered'
        pcsk9Reasons.push(`情境 B：Statin 禁忌/不耐受，使用含 Ezetimibe 10mg 的降脂藥 ≥3 個月，LDL-C ${ldl} mg/dL 仍 >100 mg/dL → 符合給付`)
      } else {
        pcsk9Reasons.push(`情境 B：Statin 不耐受 + Ezetimibe，但 LDL-C ${ldl || '未填'} mg/dL ≤100 → 不符合`)
      }
    } else {
      pcsk9Class = 'conditional'
      const missing: string[] = []
      if (!onHighStatin && statin !== '') missing.push('Statin 劑量需升至高強度（rosuvastatin 20mg 或 atorvastatin ≥40mg）')
      if (!eze) missing.push('尚未加上 Ezetimibe 10mg')
      if (onHighStatin && !eze) missing.push('需再加 Ezetimibe 10mg ≥3 個月後評估')
      pcsk9Reasons.push(`尚未完成最大耐受療程：${missing.join('；')}`)
    }

    if (!pcsk9Covered) {
      pcsk9Reasons.push('需事前審查，每次核准 12 個月')
      pcsk9Reasons.push('LDL-C 下降未達 30% → 不再給付')
    } else {
      pcsk9Reasons.push('需事前審查（附表二-D），每次核准 12 個月')
      pcsk9Reasons.push('最高劑量：每兩週 1 支；LDL-C 下降未達 30% → 不再給付')
      pcsk9Reasons.push('不可同時使用其他 PCSK9 抑制劑')
    }
  }

  html += `<div class="coverage-item ${pcsk9Class}">
    <span class="coverage-icon">${pcsk9Covered ? '✅' : pcsk9Class === 'conditional' ? '⚠️' : '❌'}</span>
    <span class="coverage-text">
      <strong>PCSK9 抑制劑</strong><br>
      ${pcsk9Reasons.map((r) => `• ${r}`).join('<br>')}
    </span>
  </div>`

  if (pcsk9Covered) {
    html += `
      <div class="quick-action-row">
        <span class="quick-action-label">查健保給付規定</span>
        <a href="/drugs?q=Evolocumab" class="quick-action-chip">Evolocumab</a>
        <a href="/drugs?q=Alirocumab" class="quick-action-chip">Alirocumab</a>
      </div>
    `
  }

  html += `</div>`

  return html
}

// ─────────────────────────────────────────────────────────────
//  Simplified statin NHI judgment (lipid_nhi)
// ─────────────────────────────────────────────────────────────
export interface NhiSimpleInput {
  age: number | null
  sex: Sex
  menopause: number | null
  tc: number | null
  ldl: number | null
  ldlSource: 'measured' | 'calculated' | null
  hdl: number | null
  ascvd: number | null
  dm: number | null
  htn: number | null
  fhcad: number | null
  smoking: number | null
}

export interface NhiSimpleResult {
  covered: boolean
  alreadyAtGoal: boolean
  category: string
  condition: string
  ldlThreshold: number
  tcThreshold: number | null
  needLifestyle: boolean
  rfItems: string[]
  rfCount: number
  reasons: string[]
  ldl: number | null
  tc: number | null
  ldlSource: 'measured' | 'calculated' | null
}

export function calcStatinNHISimple(p: NhiSimpleInput): NhiSimpleResult {
  const { age, sex, menopause, tc, ldl, ldlSource, hdl, ascvd, dm, htn, fhcad, smoking } = p
  const isMale = sex === 'M'

  const rfItems: string[] = []
  if (htn) rfItems.push('高血壓')
  if (age) {
    if (isMale && age >= 45) {
      rfItems.push(`年齡 ${age} 歲（男 ≥ 45）`)
    } else if (!isMale && age >= 55) {
      rfItems.push(`年齡 ${age} 歲（女 ≥ 55）`)
    } else if (!isMale && menopause) {
      rfItems.push(`已停經（女性年齡 < 55 仍計入）`)
    }
  } else if (!isMale && menopause) {
    rfItems.push('已停經')
  }
  if (fhcad) rfItems.push('早發 CAD 家族史')
  if (smoking) rfItems.push('吸菸')
  if (hdl && hdl < 40) rfItems.push(`HDL-C ${hdl} < 40`)
  const rfCount = rfItems.length

  let category: string, ldlThreshold: number, tcThreshold: number | null, needLifestyle: boolean
  let condition: string

  if (ascvd) {
    condition = '2.6.6'
    category = '心血管疾病（次發性預防）'
    ldlThreshold = 100
    tcThreshold = 160
    needLifestyle = false
  } else if (dm) {
    condition = '2.6.5'
    category = '糖尿病'
    ldlThreshold = 100
    tcThreshold = 160
    needLifestyle = false
  } else if (rfCount >= 2) {
    condition = '2.6.1'
    category = `一般民眾（≥ 2 項危險因子）`
    ldlThreshold = 130
    tcThreshold = 200
    needLifestyle = true
  } else if (rfCount === 1) {
    condition = '2.6.1'
    category = `一般民眾（1 項危險因子）`
    ldlThreshold = 160
    tcThreshold = 240
    needLifestyle = true
  } else {
    condition = '2.6.1'
    category = '一般民眾（0 項危險因子）'
    ldlThreshold = 190
    tcThreshold = null
    needLifestyle = true
  }

  let covered = false
  let alreadyAtGoal = false
  const triggers: string[] = []
  const reasons: string[] = []

  if (ldl && ldl >= ldlThreshold) {
    covered = true
    triggers.push(`LDL-C ${ldl} mg/dL ≥ ${ldlThreshold}`)
  }
  if (tc && tcThreshold && tc >= tcThreshold) {
    covered = true
    triggers.push(`TC ${tc} mg/dL ≥ ${tcThreshold}`)
  }

  if (!covered) {
    if (ldl && ldl < ldlThreshold) {
      alreadyAtGoal = true
      reasons.push(`LDL-C ${ldl} mg/dL < ${ldlThreshold} → 未達起始給付閾值${ldlSource === 'calculated' ? '（推算值）' : ''}`)
    }
    if (tc && tcThreshold && tc < tcThreshold) {
      reasons.push(`TC ${tc} mg/dL < ${tcThreshold} → 未達起始給付閾值`)
    }
    if (!ldl && !tc) {
      reasons.push('TC 或 LDL-C 未填，無法判斷')
    }
  } else {
    reasons.push(triggers.join(' 或 ') + ' → <strong style="color:var(--color-green);">符合起始給付</strong>')
  }

  return { covered, alreadyAtGoal, category, condition, ldlThreshold, tcThreshold, needLifestyle, rfItems, rfCount, reasons, ldl, tc, ldlSource }
}

// ─────────────────────────────────────────────────────────────
//  LIS paste parser (shared)
// ─────────────────────────────────────────────────────────────
export interface ParsedField {
  value: number | string
  label: string
  unit: string
  display?: string
  rawText?: string
}
export interface LisParseResult {
  fields: Record<string, ParsedField>
  warnings: string[]
}

export function parseLisPaste(raw: string): LisParseResult | null {
  if (!raw || !raw.trim()) return null

  const text = raw.replace(/\r/g, '')
  const result: LisParseResult = { fields: {}, warnings: [] }

  const ageMatch = text.match(/\((\d{1,3})歲\)/) || text.match(/年齡[^\d]{0,10}(\d{1,3})\s*歲/)
  if (ageMatch) {
    const age = parseInt(ageMatch[1])
    if (age >= 1 && age <= 120) {
      result.fields.age = { value: age, label: '年齡', unit: '歲' }
    }
  }

  if (/姓名[\s\S]{0,40}\(男\)/.test(text)) {
    result.fields.sex = { value: 'M', label: '性別', unit: '', display: '男' }
  } else if (/姓名[\s\S]{0,40}\(女\)/.test(text)) {
    result.fields.sex = { value: 'F', label: '性別', unit: '', display: '女' }
  }

  function extractValue(patterns: string[], minVal: number | undefined, maxVal: number | undefined, specialHandler?: (s: string) => number | null) {
    for (const pat of patterns) {
      const escapedPat = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(escapedPat + '[\\s\\S]{0,30}?[\\t ]([\\d.≧≦<>＜＞]+(?:\\.\\d+)?)', 'i')
      const m = text.match(re)
      if (m) {
        const valStr = m[1]
        const matchPos = m.index! + m[0].lastIndexOf(valStr)
        const surround = text.substring(Math.max(0, matchPos - 6), matchPos + valStr.length + 6)
        if (/\d{2,4}[-/]\d{1,2}[-/]\d{1,2}/.test(surround)) continue
        if (/\d{1,2}:\d{2}/.test(surround)) continue

        let val
        if (specialHandler) {
          val = specialHandler(valStr)
          if (val === null) continue
        } else if (/^[≧≦<>＜＞]/.test(valStr)) {
          const numPart = valStr.replace(/[≧≦<>＜＞]/g, '')
          val = parseFloat(numPart)
          if (isNaN(val)) continue
        } else {
          val = parseFloat(valStr)
        }
        if (isNaN(val)) continue
        if (minVal !== undefined && val < minVal) continue
        if (maxVal !== undefined && val > maxVal) continue
        return { value: val, rawText: valStr }
      }
    }
    return null
  }

  const egfrSpecial = (s: string): number | null => {
    if (/^≧/.test(s) || /^>=/.test(s)) {
      const n = parseFloat(s.replace(/[≧≦<>＜＞=]/g, ''))
      return isNaN(n) ? null : n
    }
    if (/^<|^≦|^＜/.test(s)) {
      const n = parseFloat(s.replace(/[≧≦<>＜＞=]/g, ''))
      return isNaN(n) ? null : n
    }
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  const targets: { id: string; patterns: string[]; min: number; max: number; unit: string; label: string; special?: (s: string) => number | null }[] = [
    { id: 'tc', patterns: ['CHOL(mg/dL)', 'CHOL', '總膽固醇', 'Cholesterol'], min: 50, max: 600, unit: 'mg/dL', label: 'TC' },
    { id: 'hdl', patterns: ['HDL-C(mg/dL)', 'HDL-C', 'HDL(mg/dL)', 'HDL', 'High Density'], min: 10, max: 150, unit: 'mg/dL', label: 'HDL-C' },
    { id: 'ldl', patterns: ['LDL-C(mg/dL)', 'LDL-C', 'LDL(mg/dL)', 'LDL', 'Low Density'], min: 10, max: 500, unit: 'mg/dL', label: 'LDL-C' },
    { id: 'tg', patterns: ['TG(mg/dL)', 'TG', '三酸甘油酯', 'Triglyceride'], min: 20, max: 3000, unit: 'mg/dL', label: 'TG' },
    { id: 'fpg', patterns: ['GLU, AC(mg/dL)', 'GLU, AC', 'GLU,AC', 'GLU AC', 'GLU(mg/dL)', 'Glucose AC', '空腹血糖'], min: 40, max: 600, unit: 'mg/dL', label: '空腹血糖' },
    { id: 'hba1c', patterns: ['HbA1c(%)', 'HbA1C(%)', 'HbA1c', 'HbA1C', '糖化血色素'], min: 3, max: 20, unit: '%', label: 'HbA1c' },
    { id: 'egfr', patterns: ['eGFR(CKD-EPI)', 'eGFR(MDRD)', 'eGFR'], min: 1, max: 200, unit: '', label: 'eGFR', special: egfrSpecial },
    { id: 'uacr', patterns: ['UACR', 'U-ACR', 'Albumin/Creatinine'], min: 0, max: 10000, unit: 'mg/g', label: 'UACR' },
  ]

  targets.forEach((t) => {
    const found = extractValue(t.patterns, t.min, t.max, t.special)
    if (found) {
      result.fields[t.id] = { value: found.value, label: t.label, unit: t.unit, rawText: found.rawText }
    }
  })

  const hasTcHdl = result.fields.tc && result.fields.hdl
  const hasTg = result.fields.tg
  const noLdl = !result.fields.ldl
  if (hasTcHdl && hasTg && noLdl) {
    result.warnings.push('LIS 未報告 LDL-C — 欄位填入後將用 Friedewald 公式自動推算 LDL。')
  } else if (hasTcHdl && !hasTg && noLdl) {
    result.warnings.push('LIS 未報告 LDL-C — 已有 TC + HDL，若再補 TG 即可用 Friedewald 公式推算 LDL。')
  }

  return result
}
