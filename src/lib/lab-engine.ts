// ═══════════════════════════════════════════════════════════════
// Lab parser + diagnosis engine
// Ported verbatim from the legacy lab.html inline script. The pure
// parsing / diagnosis logic is unchanged — only data loading differs:
// LAB_DICT / DX_RULES are injected via initLabEngine() instead of
// being read from inline <script> JSON.
// ═══════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Sex = 'M' | 'F'

export interface LabDef {
  group?: string
  aliases?: string[]
  unit?: string
  ref?: [number, number]
  ref_m?: [number, number]
  ref_f?: [number, number]
  crit_low?: number
  crit_high?: number
  direction?: string
  is_qual?: boolean
  qual_neg?: string[]
  prefer_note?: boolean
}

export interface LabDict {
  _meta?: any
  _groups?: any[]
  items: Record<string, LabDef>
}

export interface DxRules {
  _meta?: any
  rules: any[]
}

// ─── Injected data ─────────────────────────────────────────────
let LAB_DICT: LabDict = { items: {}, _groups: [] }
let DX_RULES: DxRules = { rules: [] }
let ALIAS_MAP = new Map<string, string>()

export function initLabEngine(dict: LabDict, rules: DxRules) {
  LAB_DICT = dict && dict.items ? dict : { items: {}, _groups: [] }
  DX_RULES = rules && rules.rules ? rules : { rules: [] }
  ALIAS_MAP = new Map<string, string>()
  for (const [key, def] of Object.entries(LAB_DICT.items || {})) {
    const aliases = [key, ...((def as LabDef).aliases || [])]
    for (const a of aliases) {
      const n = norm(a)
      if (n && !ALIAS_MAP.has(n)) ALIAS_MAP.set(n, key)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PARSER + ENGINE
// ═══════════════════════════════════════════════════════════════

const norm = (s: any): string =>
  String(s)
    .toLowerCase()
    .replace(/[\s\.\-_,/\\()（）]+/g, '')
    .replace(/[％]/g, '%')
    .replace(/[：:]/g, '')

function getRef(def: LabDef, sex: Sex): [number, number] | null {
  if (def.ref_m && sex === 'M') return def.ref_m
  if (def.ref_f && sex === 'F') return def.ref_f
  return def.ref || null
}

function splitReports(text: string): any[] {
  const parts = text.split(/(?=^報告結果\s*-\s*)/m).filter((s) => s.trim())
  return parts.map((part) => {
    const firstLine = part.split('\n')[0]
    const typeMatch = firstLine.match(/報告結果\s*-\s*([^()]+?)(?:\s*\([^)]*\))?\s*-\s*單號/)
    const type = typeMatch ? typeMatch[1].trim() : ''
    const sampleMatch = part.match(/採檢\s+(\d{4}-\d{2}-\d{2})/)
    const execMatch = part.match(/執行\s+(\d{4}-\d{2}-\d{2})/)
    const signMatch = part.match(/簽收\s+(\d{4}-\d{2}-\d{2})/)
    const reportMatch = part.match(/報告\s+(\d{4}-\d{2}-\d{2})/)
    const date = (sampleMatch || execMatch || signMatch || reportMatch || [])[1] || null
    const isPending =
      /單據狀態[：:]\s*(?:已開立|簽收\/執行(?!\s*\S))/.test(part) ||
      (part.includes('單據狀態') && !/檢驗名稱.*結果/.test(part))
    return { type, date, isPending, text: part }
  })
}

function parseValue(cell: string, _def?: LabDef): any {
  if (!cell) return { num: null, qual: null }
  const s = cell.trim()
  const plusMatch = s.match(/^([+-]?(?:\d+\+?|\+{1,4}|-{1,2}|Trace|trace))\s*\(\s*[<>]?\s*(\d+\.?\d*)\s*\)/)
  if (plusMatch) return { num: parseFloat(plusMatch[2]), qual: plusMatch[1] }
  const rangeMatch = s.match(/^(\d+\.?\d*)\s*~\s*(\d+\.?\d*)\s*\(\s*[<>]?\s*=?\s*(\d+\.?\d*)\s*\)/)
  if (rangeMatch)
    return {
      num: parseFloat(rangeMatch[3]),
      qual: `${rangeMatch[1]}~${rangeMatch[2]}`,
      range: [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])],
    }
  const qualNumMatch = s.match(/^([A-Za-z]+)\s*\(\s*[<>]?\s*=?\s*(\d+\.?\d*)\s*\)/)
  if (qualNumMatch) return { num: parseFloat(qualNumMatch[2]), qual: qualNumMatch[1] }
  const capMatch = s.match(/^[≧≥>]\s*(-?\d+\.?\d*)$/) || s.match(/^[≦≤<]\s*(-?\d+\.?\d*)$/)
  if (capMatch) return { num: parseFloat(capMatch[1]), qual: s, capped: true }
  const numMatch = s.match(/^(-?\d+\.?\d*)$/)
  if (numMatch) return { num: parseFloat(numMatch[1]), qual: null }
  if (/^\+{1,4}$/.test(s) || /^\d+\+$/.test(s)) return { num: null, qual: s }
  if (/^[A-Za-z][A-Za-z\s-]+$/.test(s)) return { num: null, qual: s }
  return { num: null, qual: s }
}

function findRefCell(nonEmpty: string[], nameIdx: number): string | null {
  for (let i = nameIdx + 2; i < Math.min(nameIdx + 5, nonEmpty.length); i++) {
    const c = nonEmpty[i]
    if (!c) continue
    if (/^\d{3,7}-\d+$/.test(c)) continue
    if (/[\-~≦≤≧≥<>]/.test(c) || /^(Negative|Normal|Non-reactive|Neg)/i.test(c)) {
      return c
    }
  }
  return nonEmpty[nameIdx + 3] || null
}

function parseRefCell(cell: string | null): [number, number] | null {
  if (!cell) return null
  const s = cell.trim()
  let m = s.match(/^(-?\d+\.?\d*)\s*[-~]\s*(-?\d+\.?\d*)$/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  m = s.match(/^[≦≤<]\s*=?\s*(-?\d+\.?\d*)/)
  if (m) return [0, parseFloat(m[1])]
  m = s.match(/^[≧≥>]\s*=?\s*(-?\d+\.?\d*)/)
  if (m) return [parseFloat(m[1]), Infinity]
  return null
}

function parseTableSection(section: any): any[] | null {
  const results: any[] = []
  const lines = section.text.split('\n')
  const isUrineReport = /尿液檢驗報告|尿液、胃液/.test(section.type)
  let tableStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('檢驗名稱') && lines[i].includes('結果')) tableStart = i
  }
  if (tableStart < 0) return null

  let currentItem: any = null
  for (let i = tableStart + 1; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim()) continue
    if (raw.includes('檢驗名稱') && raw.includes('結果')) continue
    if (/^\s*\*?COMMENT/i.test(raw)) continue
    if (/^\s*\d{3,7}-\d+\s*$/.test(raw)) continue

    const cells = raw.split(/\t/).map((c: string) => c.trim())
    const nonEmpty = cells.filter((c: string) => c !== '')
    if (nonEmpty.length < 2) {
      if (currentItem && raw.trim() && !/^\s*\d/.test(raw)) {
        currentItem.notes = (currentItem.notes || '') + ' ' + raw.trim()
      }
      continue
    }

    let nameCell = nonEmpty[0]
    let key = ALIAS_MAP.get(norm(nameCell))
    if (!key && nonEmpty.length >= 2) {
      key = ALIAS_MAP.get(norm(nonEmpty[1]))
      if (key) nameCell = nonEmpty[1]
    }
    if (!key) {
      if (nonEmpty.length >= 2) {
        key = ALIAS_MAP.get(norm(nonEmpty[0] + ' ' + nonEmpty[1]))
      }
      if (!key) {
        const looksLikeNewItem =
          nonEmpty.length >= 2 &&
          /[A-Za-z一-鿿]/.test(nonEmpty[0]) &&
          /\d|Non-reactive|Reactive|Positive|Negative|Trace|\+/i.test(nonEmpty[1])

        if (looksLikeNewItem) {
          const URINE_SEDIMENT_FIELDS = new Set([
            'Others',
            'Cast',
            'Crystal',
            'EC',
            'Color',
            'Clarity',
            'Bacteria',
            'Yeast',
            'Mucus',
            'Sperm',
          ])
          if (isUrineReport && URINE_SEDIMENT_FIELDS.has(nonEmpty[0])) {
            currentItem = null
            continue
          }
          results.push({
            key: nonEmpty[0],
            def: null,
            unknown: true,
            raw,
            valueCell: nonEmpty[1],
            num: null,
            qual: nonEmpty[1],
            sampledAt: section.date,
            sourceType: section.type,
            flag: '?',
          })
          currentItem = null
        } else if (currentItem && /[a-zA-Z一-鿿]/.test(raw)) {
          currentItem.notes = (currentItem.notes || '') + ' ' + raw.trim()
        }
        continue
      }
    }

    if (isUrineReport) {
      if (key === 'WBC') key = 'U-WBC'
      else if (key === 'RBC') key = 'U-RBC'
    }

    const def = LAB_DICT.items[key]
    const nameIdx = nonEmpty.indexOf(nameCell)
    const valueCell = nonEmpty[nameIdx + 1] || ''
    const refCell = findRefCell(nonEmpty, nameIdx)
    const reportRef = parseRefCell(refCell)
    const v = parseValue(valueCell, def)

    currentItem = {
      key,
      def,
      raw,
      valueCell,
      num: v.num,
      qual: v.qual,
      capped: v.capped,
      range: v.range,
      reportRef,
      sampledAt: section.date,
      sourceType: section.type,
      notes: '',
    }
    results.push(currentItem)
  }

  for (const item of results) {
    if (item.def && item.def.prefer_note && item.notes) {
      const m = item.notes.match(/(?:計算值|計算結果)\s*[:：]\s*(-?\d+\.?\d*)/)
      if (m) {
        item.num = parseFloat(m[1])
        item.qual = m[1]
        item.capped = false
      }
    }
  }

  return results
}

function parseSpecialSection(section: any): any[] {
  const results: any[] = []
  const lines = section.text.split('\n')
  for (const raw of lines) {
    let m = raw.match(/足踝肱動脈血壓比.*?(左側|右側).*?[:：]\s*(\d+\.?\d*)/)
    if (m) {
      const key = m[1] === '左側' ? 'ABI-L' : 'ABI-R'
      const def = LAB_DICT.items[key]
      if (def)
        results.push({
          key,
          def,
          raw,
          valueCell: m[2],
          num: parseFloat(m[2]),
          qual: null,
          sampledAt: section.date,
          sourceType: section.type,
          notes: '',
        })
      continue
    }
    m = raw.match(/肱踝動脈間脈波速率.*?(左側|右側).*?[:：]\s*(\d+\.?\d*)/)
    if (m) {
      const key = m[1] === '左側' ? 'PWV-L' : 'PWV-R'
      const def = LAB_DICT.items[key]
      if (def)
        results.push({
          key,
          def,
          raw,
          valueCell: m[2],
          num: parseFloat(m[2]),
          qual: null,
          sampledAt: section.date,
          sourceType: section.type,
          notes: '',
        })
    }
  }
  return results
}

export interface Demographics {
  name: string | null
  chartNo: string | null
  sex: Sex | null
  age: number | null
  birthDate: string | null
}

function parseDemographics(text: string): Demographics {
  const demo: Demographics = { name: null, chartNo: null, sex: null, age: null, birthDate: null }

  let m = text.match(/病歷號碼\s*[\t　\s]*\s*(\d{4,12})/)
  if (m) demo.chartNo = m[1]

  m = text.match(/姓名\s*\([^)]*\)\s*[\t　\s]+\s*([一-鿿·•・\s]{2,15}?)\s*\(([男女MFmf])\)/)
  if (m) {
    demo.name = m[1].trim()
    const s = m[2].toUpperCase()
    demo.sex = s === '男' || s === 'M' ? 'M' : s === '女' || s === 'F' ? 'F' : null
  }

  m = text.match(/(\d{4}-\d{2}-\d{2})\s*\(\s*(\d{1,3})\s*歲\s*\)/)
  if (m) {
    demo.birthDate = m[1]
    demo.age = parseInt(m[2])
  }

  return demo
}

// ─── Free-text report parsing ──────────────────────────────────
const FREE_TEXT_TYPES = [
  { match: /內視鏡室檢查報告/, label: '內視鏡', short: 'EGD', keywords: ['DIAGNOSIS', 'IMPRESSION'] },
  { match: /病理組織切片報告/, label: '病理切片', short: 'Pathology', keywords: ['PATHOLOGICAL DIAGNOSIS', 'DIAGNOSIS'] },
  { match: /細胞學檢查報告/, label: '細胞學', short: 'Cytology', keywords: ['DIAGNOSIS', 'IMPRESSION', 'CYTOLOGIC DIAGNOSIS'] },
  { match: /超音波/, label: '超音波', short: 'US', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /(電腦斷層|CT)/, label: 'CT', short: 'CT', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /磁振造影/, label: 'MRI', short: 'MRI', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /Ｘ光|X光|X-ray|放射線/, label: 'X光', short: 'XR', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /皮膚科檢查報告/, label: '皮膚科超音', short: 'Skin US', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /家醫部特殊檢查報告/, label: '家醫部', short: 'FM', keywords: ['醫師診斷', 'DIAGNOSIS', '診斷'] },
  { match: /健檢中心檢查報告/, label: '健檢中心', short: 'Checkup', keywords: ['Impression', 'IMPRESSION', 'IMP', 'DIAGNOSIS'] },
  { match: /新陳代謝科檢查報告/, label: '新陳代謝', short: 'Endo', keywords: ['Impression', 'IMPRESSION', 'IMP'] },
  { match: /心臟內科檢查報告/, label: '心臟內科', short: 'ECG', keywords: ['Impression', 'IMPRESSION', 'IMP', 'DIAGNOSIS', '__SPECIAL_ECG__'] },
  { match: /神經傳導速度/, label: '神經傳導', short: 'NCV', keywords: ['IMPRESSION', 'DIAGNOSIS', 'IMP'] },
  { match: /泌尿科部檢查報告/, label: '泌尿科', short: 'Urology', keywords: ['Impression', 'IMPRESSION', 'DIAGNOSIS', 'IMP'] },
  { match: /行為神經學檢查報告/, label: '神經行為', short: 'Cognitive', keywords: ['__SPECIAL_COGNITIVE__'] },
]

function refineXrayShort(text: string): string {
  if (/KUB\b|abdominal\s+plain|abd\.?\s+plain/i.test(text)) return 'KUB'
  if (/CXR\b|chest\s+plain|chest\s+film|chest\s+x[- ]?ray|chest\s+PA/i.test(text)) return 'CXR'
  if (/mammograph|乳房攝影/i.test(text)) return 'Mammo'
  if (/(thoracolumbar|lumbar|L-spine|LS\s+spine|腰椎)/i.test(text)) return 'L-spine XR'
  if (/(cervical|C-spine|頸椎)/i.test(text)) return 'C-spine XR'
  return 'XR'
}

function refineShortByContent(typeInfo: any, text: string): string {
  if (typeInfo.label === 'X光') return refineXrayShort(text)

  if (typeInfo.label === '健檢中心') {
    if (/abdominal\s+sonograph|腹部超音波/i.test(text)) return 'Abd Echo'
    if (/thyroid\s+sonograph|甲狀腺超音波/i.test(text)) return 'Thy Echo'
    if (/breast.*sonograph|乳房超音波/i.test(text)) return 'Breast Echo'
    if (/FibroScan|liver\s+stiffness/i.test(text)) return 'FibroScan'
    if (/\bABI\b|baPWV|ankle.brachial/i.test(text)) return 'ABI'
    if (/heart\s+rate\s+variability|HRV/i.test(text)) return 'HRV'
    if (/mammograph/i.test(text)) return 'Mammo'
    return 'Checkup'
  }

  if (typeInfo.label === '新陳代謝') {
    if (/thyroid|甲狀腺/i.test(text)) return 'Thy Echo'
    return 'Endo'
  }

  if (typeInfo.label === '內視鏡') {
    if (/colon|cecum|ileum|terminal\s+ileum|rectum|ascending|sigmoid|descending\s+colon|transverse\s+colon|colonoscop|大腸鏡/i.test(text)) return 'Colonoscopy'
    if (/esophagus|stomach|duodenum|antrum|fundus.*stomach|EGD|gastroscop|panendoscop|胃鏡/i.test(text)) return 'EGD'
    return 'EGD'
  }

  if (typeInfo.label === '病理切片') {
    if (/colon|cecum|sigmoid|ascending|descending\s+colon|rectum/i.test(text)) return 'Colon Pathology'
    if (/stomach|gastric|duodenum/i.test(text)) return 'EGD Pathology'
    if (/thyroid|甲狀腺/i.test(text)) return 'Thy Pathology'
    if (/breast|乳房/i.test(text)) return 'Breast Pathology'
    if (/skin|cutan/i.test(text)) return 'Skin Pathology'
    return 'Pathology'
  }

  if (typeInfo.label === '細胞學') {
    if (/thyroid|甲狀腺|FNA.*thyroid|thyroid.*FNA/i.test(text)) return 'Thy FNA'
    if (/cervix|cervical|pap\s+test|子宮頸抹片/i.test(text)) return 'Pap'
    if (/sputum|痰/i.test(text)) return 'Sputum cyto'
    if (/breast.*FNA|FNA.*breast/i.test(text)) return 'Breast FNA'
    return typeInfo.short
  }

  return typeInfo.short
}

function detectFreeTextType(sectionType: string): any {
  for (const t of FREE_TEXT_TYPES) {
    if (t.match.test(sectionType)) return t
  }
  return null
}

function parseCultureSection(section: any): any[] {
  const text = section.text
  if (/No\s+(?:aerobic|anaerobic|growth|bacteria|organism|pathogen)/i.test(text)) {
    return []
  }
  const dx: any[] = []
  const isolateMatch = text.match(/(?:isolated|Isolate|FINAL REPORT)[：:\s]+([\s\S]+?)(?:\n\n|報告結果|$)/)
  if (isolateMatch) {
    const cleaned = isolateMatch[1].trim().split(/\n+/)[0].replace(/^[-•・]+\s*/, '').trim()
    if (cleaned && cleaned.length < 200) {
      dx.push({ text: cleaned, sourceLabel: '細菌培養', sourceShort: 'Culture', sampledAt: section.date })
    }
  }
  return dx
}

function parseEcgReport(section: any, typeInfo: any): any[] {
  const results: any[] = []
  const text = section.text
  const lines = text.split('\n')
  for (let raw of lines) {
    raw = raw.trim()
    if (!raw) continue
    if (/^SINUS\s+RHYTHM\s*$/i.test(raw)) continue
    if (/^Normal\s+(ECG|sinus)/i.test(raw)) continue

    let isAbnormal = false
    if (/^(CONSIDER|SUGGEST|SUSPECT)\b/i.test(raw)) isAbnormal = true
    if (
      /\b(A\.?\s?Fib|atrial\s+fibrillation|AV\s*block|AVB\b|bradycardia|tachycardia|bundle\s+branch\s+block|LBBB|RBBB|hypertrophy|ischemi[ac]|infarction|ST\s+(elevation|depression)|Q\s+wave|prolonged\s+QT)/i.test(raw)
    )
      isAbnormal = true
    if (!isAbnormal) continue
    let prefix = ''
    let body = raw
    const pm = raw.match(/^(CONSIDER|SUGGEST|SUSPECT)\s+(.+)$/i)
    if (pm) {
      prefix = pm[1].charAt(0).toUpperCase() + pm[1].slice(1).toLowerCase()
      body = pm[2]
    }
    if (/^[A-Z][A-Z\s,.\-]*[A-Z]$/.test(body) || /^[A-Z]+$/.test(body)) {
      body = body.toLowerCase().replace(/\b([a-z])/g, (_: string, c: string) => c.toUpperCase())
    }
    const dxText = prefix ? `${prefix} ${body}` : body
    if (dxText.length < 200) {
      results.push({
        text: dxText,
        sourceLabel: typeInfo.label,
        sourceShort: typeInfo.short,
        sampledAt: section.date,
        fromFreeText: true,
      })
    }
  }
  return results
}

function parseCognitiveReport(section: any, typeInfo: any): any[] {
  const results: any[] = []
  const text = section.text
  const m = text.match(/Clinical\s+(?:diagnosis|problem)\s*[:：]\s*([^\n]+)/i)
  if (m) {
    const dx = m[1].trim().replace(/[。\.\s]+$/, '')
    if (dx && dx.length < 200 && !/^(none|nil|n\/a|unremarkable|normal)$/i.test(dx)) {
      results.push({
        text: dx,
        sourceLabel: typeInfo.label,
        sourceShort: typeInfo.short,
        sampledAt: section.date,
        fromFreeText: true,
      })
    }
  }
  return results
}

function parseFreeTextSection(section: any, typeInfo: any): any[] {
  const results: any[] = []
  const text = section.text

  if (typeInfo.keywords.includes('__SPECIAL_ECG__')) {
    return parseEcgReport(section, typeInfo)
  }
  if (typeInfo.keywords.includes('__SPECIAL_COGNITIVE__')) {
    return parseCognitiveReport(section, typeInfo)
  }

  for (const kw of typeInfo.keywords) {
    if (kw.startsWith('__SPECIAL_')) continue
    const pattern = new RegExp(
      kw +
        '\\s*[：:]?\\s*\\n?([\\s\\S]*?)' +
        '(?=\\n\\s*(?:NOTE|GROSS|MICROSCOPIC|Pathologists|檢查醫師|醫師簽章|醫師簽章|報告結果|\\n\\n|[A-Z]{4,}[：:]|Impression|IMPRESSION|DIAGNOSIS)|$)',
      ''
    )
    const m = text.match(pattern)
    if (!m) continue
    const body = m[1].trim()
    if (!body) continue

    let lines = body
      .split(/\n+|;|；/)
      .map((s: string) =>
        s
          .replace(/^[\s\->•・*>＞＝=\]\[]+/, '')
          .replace(/^\d+[\)\.]\s*/, '')
          .replace(/^診斷\s*[:：]\s*/, '')
          .replace(/^Dx\s*[:：]\s*/i, '')
          .replace(/[。\.\s]+$/, '')
          .trim()
      )
      .filter((s: string) => s.length > 0 && s.length < 200)

    lines = lines.filter((line: string) => {
      if (/^(null|N\/A|None|Nil|無|\]|\[)$/i.test(line)) return false
      if (/^(Fellow|R:|VS:|主治醫師|檢查醫師|醫師簽章|Pathologists?|Premedication|Clinical Information|Indication|Rapid urease test|AccessionNumber|PatientID)/i.test(line)) return false
      if (/醫師.*[-－]\s*[一-鿿]+專/.test(line)) return false
      if (/^(Right|Left)\s+kidney\s+size|^Spleen\s*=|^kidney\s*=/i.test(line)) return false
      if (/^(Normal\s+(?:heart\s+size|sized?))$/i.test(line)) return false
      if (/(?:is\s+not\s+(?:widened|enlarged|dilated)|is\s+intact|are\s+intact|appears?\s+normal|are\s+free\s+of|unremarkable|not\s+distended)$/i.test(line)) return false

      if (/^Confirmed\s*\.?\s*$/i.test(line)) return false
      if (/^(Recommend(?:ed|ation)?\s+|Please\s+correlate|Clinical\s+correlation\s+is)/i.test(line)) return false
      if (/^Suggest\b/i.test(line) && !/(suspicious|malignan|tumor|mass)/i.test(line)) return false
      if (/\b(are|is)\s+(sharp|clear|patent|unremarkable|symmetric(?:al)?|smooth|intact)\b/i.test(line) && !/\b(mass|lesion|tumor|nodule|opacity|infiltrate|suspicious|hernia|polyp|cyst|effusion)\b/i.test(line)) return false
      if (/^[□■☐☑✓✔]/i.test(line)) return false
      if (/^(Suggestion|Suggestions)\s*[:：]?\s*$/i.test(line)) return false
      if (/^R\d+\s+[A-Z]/.test(line)) return false
      if (/^\(\d+\)\s*[A-Z]/i.test(line) && /[:：]\s*$/.test(line)) return false
      if (line.length > 120) return false
      if (/^The\s+controlled\s+attenuation\s+parameter/i.test(line)) return false
      if (/^The\s+liver\s+stiff(?:i?)ness/i.test(line)) return false
      if (/BIRADs?\s+category\s*[:：]?\s*[01]\b/i.test(line)) return false
      if (/^BIRADs?\s+category\s*\d\s*[:：]/i.test(line)) {
        if (/[:：]\s*(Negative|Benign)/i.test(line)) return false
      }
      if (/^(NEGATIVE\s+FOR|Within\s+normal\s+limit|Negative\s+finding)/i.test(line)) return false
      if (/^Note\s*[:：]?\s*$/i.test(line)) return false
      if (/^\(\d+\)\s+/.test(line)) return false
      if (/^(Colon|Liver|Kidney|Lung|Thyroid|Breast|Stomach|Skin|Soft\s+tissue),\s+\w+;?\s*biopsy/i.test(line)) return false
      if (/biopsy\s+and\s+removal\s*[:：]?\s*$/i.test(line)) return false
      if (/Metavir\s+F\s*0[\-~]?1?/i.test(line)) return false
      if (/無明顯肝臟纖維化/.test(line)) return false

      if (/^(Clear|Patent|Normal|Intact|Symmetric(?:al)?|Smooth|Preserved|Well[-\s]?(?:defined|aerated|preserved))\b/i.test(line)) {
        if (!/\b(mass|lesion|tumor|nodule|opacity|infiltrate|suspicious)\b/i.test(line)) return false
      }
      if (/[,，][\s\S]+[,，][\s\S]+[:：]\s*$/.test(line)) return false
      if (/(?:biopsy|excision|aspiration|resection)\s*[:：]?\s*$/i.test(line)) return false
      if (/^(Soft\s+tissue|Bladder|Liver|Kidney|Lung|Brain|Heart|Stomach|Colon|Skin|Muscle|Bone|Lymph|Breast|Prostate|Ovary|Uterus|Cervix|Thyroid|Parathyroid|Pancreas|Spleen|Gallbladder|Esophagus|Duodenum|Jejunum|Ileum|Appendix|Rectum)[,，]/i.test(line)) return false
      if (/^\d/.test(line) && line.length < 8) return false
      if (/^[a-z一-鿿]+\s*[:：]\s*$/.test(line)) return false
      if (/^(?:[Ii]so|[Hh]yper|[Hh]ypo|[Aa]n)[\-\s]?(?:to|echoic|echogenic)/.test(line) && !/lipoma|cyst|stone|tumor|mass|lesion\s+suspect/i.test(line)) return false

      if (/^No\s+(?:obi?vious|abnormal|definite|evidence|focal|gross|significant|active|obvious|apparent|specific)?/i.test(line)) {
        const hasCaveat = /\b(may|might|but|however|cannot\s+(?:exclude|rule\s+out)|too\s+subtle|despite|though|although|further\s+(?:follow|workup|evaluation)|suggest(?:ed|s)?\s+(?:follow|workup))\b/i.test(line)
        if (!hasCaveat) return false
      }

      return true
    })

    for (const line of lines) {
      const short = refineShortByContent(typeInfo, text)
      let cleanText = line
      if (/^UNSATISFACTORY\b/i.test(cleanText)) {
        cleanText = 'unsatisfactory'
      }
      cleanText = cleanText.replace(/^(Thyroid|Breast|Skin|Lymph\s+node|Lung|Liver|Colon|Stomach)[,，][\s\S]*?(FNA|biopsy|cytology|smear)\s*[:：]\s*/i, '')
      cleanText = cleanText.replace(/^R\s*\/\s*O\s+(.+?)\.?$/i, '$1 (suspected)')
      results.push({
        text: cleanText,
        sourceLabel: typeInfo.label,
        sourceShort: short,
        sampledAt: section.date,
      })
    }
    if (results.length > 0) break
  }

  return results
}

function detectFMSubtype(text: string): string | null {
  if (/糖尿病眼底篩檢|視網膜病變|NPDR|PDR|NDR/.test(text)) return 'fundus'
  if (/足部檢查|足背動脈脈搏|單股尼龍線|皮膚受損|足癬|感染潰瘍|截肢/.test(text)) return 'foot'
  if (/FEET SCORE|HANDS SCORE|CONDUCTANCES|sudomotor/i.test(text)) return 'sudomotor'
  return null
}

function parseFundusSection(section: any): any[] {
  const text = section.text
  const eyePatterns = [
    { side: '右眼', re: /右眼\s*[:：]\s*([^\n]+)/ },
    { side: '左眼', re: /左眼\s*[:：]\s*([^\n]+)/ },
  ]
  const retinopathy: string[] = []
  const unevaluable: string[] = []
  const reasonsMatch = text.match(/(?:無法評估|不能評估)原因\s*[:：]+\s*([^\n]+)/)
  const unevalReason = reasonsMatch ? reasonsMatch[1].replace(/^[:：\s]+/, '').trim() : ''

  for (const e of eyePatterns) {
    const m = text.match(e.re)
    if (!m) continue
    const content = m[1].trim()
    if (/無法.*評估|不能.*評估|無法判讀|無法辨識|影像.*不佳|影像.*品質|cannot\s+evaluate|unable\s+to\s+assess/i.test(content)) {
      unevaluable.push(e.side)
      continue
    }
    if (/^(無糖尿病|NDR|Normal|無.*病變)/.test(content) || (/NDR/.test(content) && !/NPDR|PDR/.test(content))) continue
    if (/NPDR|PDR|增殖性|視網膜病變|黃斑部|maculopathy|CSME|edema/i.test(content)) {
      retinopathy.push(`${e.side}: ${content}`)
    }
  }

  const results: any[] = []
  if (retinopathy.length > 0) {
    results.push({
      text: `Diabetic retinopathy (${retinopathy.join('; ')})`,
      sourceLabel: '眼底篩檢',
      sourceShort: 'Fundus',
      sampledAt: section.date,
    })
  }
  if (unevaluable.length > 0) {
    const eyesStr = unevaluable.length === 2 ? 'bilateral' : unevaluable[0] === '右眼' ? 'right eye' : 'left eye'
    let dxText = `Fundus exam unevaluable (${eyesStr})`
    if (unevalReason) dxText += ` — ${unevalReason}`
    dxText += ', further ophthalmology workup recommended'
    results.push({
      text: dxText,
      sourceLabel: '眼底篩檢',
      sourceShort: 'Fundus',
      sampledAt: section.date,
    })
  }
  return results
}

function parseFootSection(section: any): any[] {
  const text = section.text
  const abnormalItems: string[] = []
  const patterns = [
    { key: '皮膚受損', en: 'skin lesion' },
    { key: '足癬', en: 'tinea pedis' },
    { key: '趾甲異常', en: 'nail deformity' },
    { key: '感染潰瘍', en: 'infected ulcer' },
    { key: '胼胝/雞眼', en: 'callus/corn' },
    { key: '外觀變形', en: 'foot deformity' },
    { key: '截肢', en: 'amputation' },
  ]
  for (const p of patterns) {
    const re = new RegExp(p.key + '\\s*[:：]\\s*(右|左)\\s*\\(([+\\-－])\\)\\s*,?\\s*(右|左)\\s*\\(([+\\-－])\\)')
    const m = text.match(re)
    if (!m) continue
    const sides: string[] = []
    if (m[2] === '+') sides.push(m[1])
    if (m[4] === '+') sides.push(m[3])
    if (sides.length === 0) continue
    const sideStr = sides.length === 2 ? 'bilateral' : sides[0] === '右' ? 'right' : 'left'
    abnormalItems.push(`${p.en} (${sideStr})`)
  }
  const monoMatch = text.match(/單股尼龍線\s*[:：]\s*右\s*[:：]?\s*([^,，]+)\s*,?\s*左\s*[:：]?\s*([^\n]+)/)
  if (monoMatch) {
    const rNormal = /^正常|Normal/.test(monoMatch[1].trim())
    const lNormal = /^正常|Normal/.test(monoMatch[2].trim())
    if (!rNormal || !lNormal) {
      const side = !rNormal && !lNormal ? 'bilateral' : !rNormal ? 'right' : 'left'
      abnormalItems.push(`reduced protective sensation by monofilament (${side})`)
    }
  }
  if (abnormalItems.length === 0) return []

  const dxText = `Diabetic foot findings: ${abnormalItems.join(', ')}`
  return [
    {
      text: dxText,
      sourceLabel: '足部檢查',
      sourceShort: 'Foot exam',
      sampledAt: section.date,
    },
  ]
}

function parseSudomotorSection(section: any): any[] {
  const text = section.text
  const values: number[] = []
  const re = /(Left|Right|L|R)\s*[:：]\s*(\d+(?:\.\d+)?)\s*[µu]S/gi
  let m
  while ((m = re.exec(text)) !== null) {
    values.push(parseFloat(m[2]))
  }
  if (values.length === 0) return []
  const minVal = Math.min(...values)
  if (minVal >= 60) return []
  let severity
  if (minVal < 40) severity = 'severely'
  else severity = 'moderately'
  return [
    {
      text: `${severity.charAt(0).toUpperCase() + severity.slice(1)} reduced sudomotor function (min ${minVal}µS, suggesting autonomic neuropathy)`,
      sourceLabel: '排汗神經',
      sourceShort: 'Sudomotor',
      sampledAt: section.date,
    },
  ]
}

function normDxText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s,，.。;；:：()()\[\]<>"'·]+/g, '')
    .replace(/grade[a-z0-9]+/g, '')
    .trim()
}

const FREE_TEXT_ICD_MAP = [
  { pattern: /thyroidectomy/i, icd: 'Z90.6', desc: 'Acquired absence of other endocrine glands' },
  { pattern: /thyroid\s+(nodule|nodules)/i, icd: 'E04.1', desc: 'Nontoxic single thyroid nodule' },
  { pattern: /thyroid\s+(cyst|cysts)/i, icd: 'E04.1', desc: 'Nontoxic thyroid nodule (cyst)' },
  { pattern: /thyroid\s+goiter/i, icd: 'E04.9', desc: 'Nontoxic goiter, unspecified' },
  { pattern: /hashimoto/i, icd: 'E06.3', desc: 'Autoimmune thyroiditis' },
  { pattern: /graves/i, icd: 'E05.00', desc: 'Thyrotoxicosis with diffuse goiter' },
  { pattern: /(fatty\s+liver|hepatic\s+steatosis|steatohepatitis)/i, icd: 'K76.0', desc: 'Fatty (change of) liver, not elsewhere classified' },
  { pattern: /liver\s+cirrhosis/i, icd: 'K74.60', desc: 'Unspecified cirrhosis of liver' },
  { pattern: /liver\s+(cyst|cysts)/i, icd: 'K76.89', desc: 'Other specified diseases of liver' },
  { pattern: /hemangioma.*liver|liver.*hemangioma/i, icd: 'D18.03', desc: 'Hemangioma of intra-abdominal structures' },
  { pattern: /gallbladder\s+(stone|stones)|cholelithiasis/i, icd: 'K80.20', desc: 'Calculus of gallbladder without cholecystitis' },
  { pattern: /gallbladder\s+polyp/i, icd: 'K82.8', desc: 'Other specified diseases of gallbladder' },
  { pattern: /(s\/?p\s+)?cholecystectomy/i, icd: 'Z90.49', desc: 'Acquired absence of other specified parts of digestive tract' },
  { pattern: /(renal|kidney)\s+(stone|stones|calculus|calculi)|nephrolithiasis/i, icd: 'N20.0', desc: 'Calculus of kidney' },
  { pattern: /(renal|kidney)\s+(cyst|cysts)/i, icd: 'N28.1', desc: 'Cyst of kidney, acquired' },
  { pattern: /polycystic\s+kidney/i, icd: 'Q61.3', desc: 'Polycystic kidney, unspecified' },
  { pattern: /hydronephrosis/i, icd: 'N13.30', desc: 'Unspecified hydronephrosis' },
  { pattern: /bladder\s+stone/i, icd: 'N21.0', desc: 'Calculus in bladder' },
  { pattern: /lipoma/i, icd: 'D17.9', desc: 'Benign lipomatous neoplasm, unspecified' },
  { pattern: /sebaceous\s+cyst|epidermal\s+cyst/i, icd: 'L72.0', desc: 'Epidermal cyst' },
  { pattern: /breast\s+(cyst|cysts)/i, icd: 'N60.0', desc: 'Solitary cyst of breast' },
  { pattern: /breast\s+(nodule|fibroadenoma)/i, icd: 'D24.9', desc: 'Benign neoplasm of unspecified breast' },
  { pattern: /esophagitis/i, icd: 'K20.9', desc: 'Esophagitis, unspecified' },
  { pattern: /gerd|reflux\s+esophagitis|gastroesophageal\s+reflux/i, icd: 'K21.9', desc: 'Gastro-esophageal reflux disease without esophagitis' },
  { pattern: /(barrett'?s|barrett)/i, icd: 'K22.7', desc: "Barrett's esophagus" },
  { pattern: /(hiatal|hiatus)\s+hernia/i, icd: 'K44.9', desc: 'Diaphragmatic hernia without obstruction or gangrene' },
  { pattern: /gastric\s+ulcer/i, icd: 'K25.9', desc: 'Gastric ulcer, unspecified' },
  { pattern: /duodenal\s+ulcer/i, icd: 'K26.9', desc: 'Duodenal ulcer, unspecified' },
  { pattern: /duodenal?\s+erosion/i, icd: 'K29.80', desc: 'Duodenitis without bleeding' },
  { pattern: /gastritis/i, icd: 'K29.70', desc: 'Gastritis, unspecified, without bleeding' },
  { pattern: /colon\s+polyp|colonic\s+polyp/i, icd: 'K63.5', desc: 'Polyp of colon' },
  { pattern: /diverticul(um|osis|itis)/i, icd: 'K57.30', desc: 'Diverticulosis of large intestine without perforation or abscess' },
  { pattern: /hemorrhoid/i, icd: 'K64.9', desc: 'Unspecified hemorrhoids' },
  { pattern: /appendicitis/i, icd: 'K35.80', desc: 'Unspecified acute appendicitis' },
  { pattern: /(septal|nasal\s+septum)\s+deviation|deviated\s+(nasal\s+)?septum/i, icd: 'J34.2', desc: 'Deviated nasal septum' },
  { pattern: /(turbinate\s+hypertrophy|hypertrophic\s+(?:inferior\s+)?turbinate)/i, icd: 'J34.3', desc: 'Hypertrophy of nasal turbinates' },
  { pattern: /adenoid\s+(hypertrophy|vegetation)|tongue\s+base\s+lymphoid\s+hypertrophy/i, icd: 'J35.2', desc: 'Hypertrophy of adenoids' },
  { pattern: /hearing\s+loss/i, icd: 'H91.90', desc: 'Unspecified hearing loss, unspecified ear' },
  { pattern: /pulmonary\s+nodule|lung\s+nodule/i, icd: 'R91.1', desc: 'Solitary pulmonary nodule' },
  { pattern: /(emphysema|copd)/i, icd: 'J44.9', desc: 'Chronic obstructive pulmonary disease, unspecified' },
  { pattern: /bronchiectasis/i, icd: 'J47.9', desc: 'Bronchiectasis, uncomplicated' },
  { pattern: /pleural\s+effusion/i, icd: 'J90', desc: 'Pleural effusion, not elsewhere classified' },
  { pattern: /increased\s+(bilateral\s+)?lung\s+markings/i, icd: 'R91.8', desc: 'Other nonspecific abnormal finding of lung field' },
  { pattern: /(left\s+ventricular\s+hypertrophy|\bLVH\b)/i, icd: 'I51.7', desc: 'Cardiomegaly / Left ventricular hypertrophy' },
  { pattern: /(right\s+ventricular\s+hypertrophy|\bRVH\b)/i, icd: 'I51.7', desc: 'Cardiomegaly / Right ventricular hypertrophy' },
  { pattern: /atrial\s+fibrillation|\bA\.?\s?Fib\b/i, icd: 'I48.91', desc: 'Unspecified atrial fibrillation' },
  { pattern: /(LBBB|left\s+bundle\s+branch\s+block)/i, icd: 'I44.7', desc: 'Left bundle-branch block, unspecified' },
  { pattern: /(RBBB|right\s+bundle\s+branch\s+block)/i, icd: 'I45.10', desc: 'Unspecified right bundle-branch block' },
  { pattern: /cardiomegaly/i, icd: 'I51.7', desc: 'Cardiomegaly' },
  { pattern: /atherosclerosis.*(internal\s+carotid|ICA)/i, icd: 'I65.21', desc: 'Occlusion and stenosis of right internal carotid artery' },
  { pattern: /atherosclerosis.*(vertebrobasilar|VB\b|vertebral)/i, icd: 'I65.01', desc: 'Occlusion and stenosis of vertebral artery' },
  { pattern: /(P1\s+PCA|PCA\s+stenosis|posterior\s+cerebral\s+artery.*stenosis)/i, icd: 'I66.21', desc: 'Occlusion and stenosis of left posterior cerebral artery' },
  { pattern: /(carotid\s+stenosis|carotid\s+atherosclerosis)/i, icd: 'I65.29', desc: 'Occlusion and stenosis of unspecified carotid artery' },
  { pattern: /vascular\s+calcification/i, icd: 'I70.90', desc: 'Unspecified atherosclerosis' },
  { pattern: /aortic\s+(calcification|atherosclerosis)/i, icd: 'I70.0', desc: 'Atherosclerosis of aorta' },
  { pattern: /spondylolisthesis/i, icd: 'M43.10', desc: 'Spondylolisthesis, site unspecified' },
  { pattern: /compression\s+fracture/i, icd: 'M48.50XA', desc: 'Collapsed vertebra, NEC, site unspecified, initial encounter' },
  { pattern: /scoliosis/i, icd: 'M41.9', desc: 'Scoliosis, unspecified' },
  { pattern: /osteoporosis/i, icd: 'M81.0', desc: 'Age-related osteoporosis without current pathological fracture' },
  { pattern: /degenerative\s+disc\s+disease.*(L\d|lumbar|thoracolumbar)/i, icd: 'M51.36', desc: 'Other intervertebral disc degeneration, lumbar region' },
  { pattern: /degenerative\s+disc\s+disease.*(C\d|cervical)/i, icd: 'M50.30', desc: 'Other cervical disc degeneration, unspecified cervical region' },
  { pattern: /spondylosis.*cervical|cervical\s+spondylosis/i, icd: 'M47.812', desc: 'Spondylosis without myelopathy or radiculopathy, cervical region' },
  { pattern: /spondylosis.*(lumbar|thoracic)|lumbar\s+spondylosis/i, icd: 'M47.816', desc: 'Spondylosis without myelopathy or radiculopathy, lumbar region' },
  { pattern: /spondylosis|degenerative\s+disc/i, icd: 'M47.819', desc: 'Spondylosis without myelopathy or radiculopathy, site unspecified' },
  { pattern: /(disc|disk)\s+(protrusion|herniation|bulging)/i, icd: 'M51.9', desc: 'Unspecified thoracic, thoracolumbar and lumbosacral intervertebral disc disorder' },
  { pattern: /(cortical\s+atrophy|cerebral\s+atrophy|brain\s+atrophy)/i, icd: 'G31.9', desc: 'Degenerative disease of nervous system, unspecified (cortical atrophy)' },
  { pattern: /(periventricular\s+white\s+matter|white\s+matter\s+changes|leukoaraiosis)/i, icd: 'R90.82', desc: 'White matter disease, unspecified' },
  { pattern: /(ventriculomegaly|hydrocephalus)/i, icd: 'G93.89', desc: 'Other specified disorders of brain' },
  { pattern: /\bAD\s+MCI\b|alzheimer.*mci/i, icd: 'G31.84', desc: 'Mild cognitive impairment, so stated' },
  { pattern: /\bMCI\b|mild\s+cognitive\s+impairment/i, icd: 'G31.84', desc: 'Mild cognitive impairment, so stated' },
  { pattern: /alzheimer/i, icd: 'G30.9', desc: "Alzheimer's disease, unspecified" },
  { pattern: /dementia/i, icd: 'F03.90', desc: 'Unspecified dementia, unspecified severity' },
  { pattern: /uterine\s+(myoma|fibroid|leiomyoma)/i, icd: 'D25.9', desc: 'Leiomyoma of uterus, unspecified' },
  { pattern: /ovarian\s+(cyst|cysts)/i, icd: 'N83.20', desc: 'Unspecified ovarian cysts' },
  { pattern: /(maxillary|ethmoid|frontal|sphenoid)\s+sinusitis|sinusitis/i, icd: 'J32.9', desc: 'Chronic sinusitis, unspecified' },
  { pattern: /gallbladder\s+polyp/i, icd: 'K82.8', desc: 'Other specified diseases of gallbladder (GB polyp)' },
  { pattern: /(left|right)?\s*renal\s+cyst/i, icd: 'N28.1', desc: 'Cyst of kidney, acquired' },
  { pattern: /renal\s+hyperechoic\s+nodule/i, icd: 'N28.89', desc: 'Other specified disorders of kidney and ureter' },
  { pattern: /milk\s+of\s+calcium/i, icd: 'N28.89', desc: 'Other specified disorders of kidney (milk of calcium)' },
  { pattern: /phlebolith/i, icd: 'I86.8', desc: 'Varicose veins of other specified sites (phlebolith)' },
  { pattern: /thyroid\s+nodule/i, icd: 'E04.1', desc: 'Nontoxic single thyroid nodule' },
  { pattern: /thyroid\s+cyst/i, icd: 'E04.1', desc: 'Nontoxic thyroid cyst' },
  { pattern: /metavir\s+f[3-4]|liver\s+fibrosis|liver\s+cirrhosis/i, icd: 'K74.60', desc: 'Unspecified cirrhosis of liver' },
  { pattern: /non[-\s]?specific\s+colitis/i, icd: 'K52.9', desc: 'Noninfective gastroenteritis and colitis, unspecified' },
  { pattern: /hyperplastic\s+polyp/i, icd: 'K63.5', desc: 'Polyp of colon (hyperplastic)' },
  { pattern: /colonic\s+polyp|colon\s+polyp/i, icd: 'K63.5', desc: 'Polyp of colon' },
  { pattern: /colonic\s+diverticul(um|osis)|colon\s+diverticul(um|osis)/i, icd: 'K57.30', desc: 'Diverticulosis of large intestine without perforation' },
  { pattern: /superficial\s+gastritis/i, icd: 'K29.70', desc: 'Gastritis, unspecified, without bleeding' },
  { pattern: /antrum.*hyperemic|hyperemic.*mucosa/i, icd: 'K29.70', desc: 'Gastritis, unspecified, without bleeding' },
  { pattern: /diabetic\s+retinopathy/i, icd: 'E11.319', desc: 'T2DM with unspecified diabetic retinopathy without macular edema' },
  { pattern: /diabetic\s+(peripheral\s+)?neuropathy/i, icd: 'E11.42', desc: 'T2DM with diabetic polyneuropathy' },
  { pattern: /diabetic\s+foot/i, icd: 'E11.621', desc: 'T2DM with foot ulcer' },
  { pattern: /(reduced\s+sudomotor|sudomotor\s+dysfunction)/i, icd: 'G90.09', desc: 'Other idiopathic peripheral autonomic neuropathy' },
  { pattern: /(arterial\s+stiffness|increased\s+pwv)/i, icd: 'I77.81', desc: 'Stenosis of artery' },
  { pattern: /pad\s+suspected|peripheral\s+arterial\s+disease/i, icd: 'I73.9', desc: 'Peripheral vascular disease, unspecified' },
]

export function lookupFreeTextIcd(dxText: string): { icd10: string; icd10_desc: string } | null {
  for (const entry of FREE_TEXT_ICD_MAP) {
    if (entry.pattern.test(dxText)) {
      return { icd10: entry.icd, icd10_desc: entry.desc }
    }
  }
  return null
}

function integrateFreeTextDx(items: any[]): any[] {
  if (!items.length) return []
  const grouped: Record<string, any> = {}
  for (const item of items) {
    const key = normDxText(item.text)
    if (!grouped[key]) {
      grouped[key] = { text: item.text, sources: [] }
    }
    grouped[key].sources.push({
      label: item.sourceLabel,
      short: item.sourceShort || item.sourceLabel,
      date: item.sampledAt,
    })
  }
  const integrated = Object.values(grouped)
  const afterPathMerge = mergePathologyIntoEndoscopy(integrated)
  return mergeDiagnosesByICD(afterPathMerge)
}

function integrateFreeTextDxRaw(items: any[]): any[] {
  if (!items.length) return []
  const grouped: Record<string, any> = {}
  for (const item of items) {
    const key = `${normDxText(item.text)}|${item.sampledAt || ''}`
    if (!grouped[key]) {
      grouped[key] = { text: item.text, sources: [] }
    }
    grouped[key].sources.push({
      label: item.sourceLabel,
      short: item.sourceShort || item.sourceLabel,
      date: item.sampledAt,
    })
  }
  const integrated = Object.values(grouped)
  return mergePathologyIntoEndoscopy(integrated)
}

export function extractSeverity(text: string): string | null {
  let m = text.match(/\bLA[\s\-]*grade\s+([A-D])\b/i)
  if (m) return `LA grade ${m[1].toUpperCase()}`
  m = text.match(/\bLA[\-\s]+([A-D])\b/i)
  if (m) return `LA grade ${m[1].toUpperCase()}`
  m = text.match(/\bgrade\s+([A-D]|I{1,4}V?|[1-4])\b/i)
  if (m) return `grade ${m[1].toUpperCase()}`
  m = text.match(/BIRADs?\s+category\s+([1-5])/i)
  if (m) return `BIRADs ${m[1]}`
  m = text.match(/\b(mild|moderate|severe)\b/i)
  if (m) return m[1].toLowerCase()
  if (/\(suspect(?:ed)?\)/i.test(text)) return 'suspected'
  return null
}

function diagnosisSpecificity(dx: any): number {
  let score = 0
  const text = dx.text.toLowerCase()
  if (/pathology|biopsy/.test(text)) score += 3
  if (/\b(acute|severe|suppurative|grade\s+[bcd])\b/i.test(text)) score += 2
  if (/\b(mild|grade\s+a|suspect)/i.test(text)) score -= 1
  score += Math.min(text.length / 30, 3)
  const latestDate = [...dx.sources].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]?.date
  if (latestDate) {
    const year = parseInt(latestDate.slice(0, 4))
    score += (year - 2000) * 0.01
  }
  return score
}

function extractLocation(text: string): string | null {
  const m = text.match(/^\s*(Left|Right|Bilateral|Bil\.?|L'?t|R'?t)\b/i)
  if (m) {
    const word = m[1].toLowerCase().replace(/[.'`]/g, '')
    if (word === 'lt' || word === 'l') return 'left'
    if (word === 'rt' || word === 'r') return 'right'
    if (word === 'bil' || word === 'bilateral') return 'bilateral'
    return word
  }
  return null
}

function mergeDiagnosesByICD(items: any[]): any[] {
  const byKey = new Map<string, any>()
  const noIcd: any[] = []
  for (const item of items) {
    const icd = lookupFreeTextIcd(item.text)
    if (!icd) {
      noIcd.push(item)
      continue
    }
    const location = extractLocation(item.text)
    const key = `${icd.icd10}|${location || ''}`
    if (!byKey.has(key)) {
      byKey.set(key, { icd, items: [] })
    }
    byKey.get(key).items.push(item)
  }

  const result: any[] = []
  for (const group of byKey.values()) {
    if (group.items.length === 1) {
      result.push(group.items[0])
      continue
    }
    const sorted = [...group.items].sort((a, b) => diagnosisSpecificity(b) - diagnosisSpecificity(a))
    const primary = sorted[0]
    const occurrences = group.items
      .map((item: any) => {
        const dates = item.sources.map((s: any) => s.date).filter(Boolean).sort()
        const date = dates[0] || null
        const severity = extractSeverity(item.text)
        return { date, severity, text: item.text }
      })
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
    const seenMonth = new Set<string>()
    const uniqueOcc = occurrences.filter((o: any) => {
      const month = (o.date || '').slice(0, 7)
      if (seenMonth.has(month)) return false
      seenMonth.add(month)
      return true
    })
    const allSources = group.items.flatMap((i: any) => i.sources)
    result.push({
      text: primary.text,
      sources: allSources,
      occurrences: uniqueOcc,
    })
  }
  return [...result, ...noIcd]
}

const PATHOLOGY_TO_PROCEDURE_MAP: Record<string, { target: string; prefix: string; maxDays: number }> = {
  'Colon Pathology': { target: 'Colonoscopy', prefix: 'pathology', maxDays: 31 },
  'EGD Pathology': { target: 'EGD', prefix: 'pathology', maxDays: 31 },
  'Thy Pathology': { target: 'Thy FNA', prefix: 'pathology', maxDays: 31 },
  'Breast Pathology': { target: 'Breast FNA', prefix: 'pathology', maxDays: 31 },
  'Skin Pathology': { target: 'Skin US', prefix: 'pathology', maxDays: 31 },
  'Thy FNA': { target: 'Thy Echo', prefix: 'FNA', maxDays: 365 },
  'Breast FNA': { target: 'Breast Echo', prefix: 'FNA', maxDays: 365 },
}
export const PATHOLOGY_TO_PROCEDURE: Record<string, string> = Object.fromEntries(
  Object.entries(PATHOLOGY_TO_PROCEDURE_MAP).map(([k, v]) => [k, v.target])
)

function mergePathologyIntoEndoscopy(items: any[]): any[] {
  const pathologyItems: any[] = []
  const procedureItems: any[] = []
  const otherItems: any[] = []

  for (const item of items) {
    const primarySrc = [...item.sources].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
    const short = primarySrc.short
    if (short in PATHOLOGY_TO_PROCEDURE_MAP) {
      const cfg = PATHOLOGY_TO_PROCEDURE_MAP[short]
      pathologyItems.push({ item, primarySrc, cfg })
    } else if (Object.values(PATHOLOGY_TO_PROCEDURE_MAP).some((c) => c.target === short)) {
      procedureItems.push({ item, primarySrc, short })
    } else {
      otherItems.push(item)
    }
  }

  const usedPathology = new Set<any>()
  const procPriority = (item: any) => {
    const t = item.text.toLowerCase()
    if (/polyp|mass|tumor|nodule|lesion|biops|ulcer|cyst/.test(t)) return 0
    if (/diverticul|gastritis|colitis|esophagitis/.test(t)) return 2
    return 1
  }

  function inWindow(dateA: string, dateB: string, maxDays: number) {
    if (!dateA || !dateB) return false
    const ta = new Date(dateA).getTime()
    const tb = new Date(dateB).getTime()
    if (isNaN(ta) || isNaN(tb)) return false
    const diffDays = Math.abs(ta - tb) / (1000 * 60 * 60 * 24)
    return diffDays <= maxDays
  }

  for (const proc of procedureItems.slice().sort((a, b) => procPriority(a.item) - procPriority(b.item))) {
    const matchingPaths = pathologyItems.filter((p) => {
      if (usedPathology.has(p.item)) return false
      if (p.cfg.target !== proc.short) return false
      return inWindow(p.primarySrc.date, proc.primarySrc.date, p.cfg.maxDays)
    })
    if (matchingPaths.length === 0) continue
    const byPrefix = new Map<string, string[]>()
    for (const p of matchingPaths) {
      if (!byPrefix.has(p.cfg.prefix)) byPrefix.set(p.cfg.prefix, [])
      byPrefix.get(p.cfg.prefix)!.push(p.item.text)
    }
    let mergedText = proc.item.text
    for (const [prefix, texts] of byPrefix) {
      const seenLower = new Set<string>()
      const uniqueTexts = texts.filter((t) => {
        const lo = t.toLowerCase().trim()
        if (seenLower.has(lo)) return false
        seenLower.add(lo)
        return true
      })
      mergedText += `, ${prefix}: ${uniqueTexts.join(', ')}`
    }
    proc.item.text = mergedText
    for (const p of matchingPaths) {
      proc.item.sources.push(...p.item.sources)
      usedPathology.add(p.item)
    }
  }

  const result = [
    ...procedureItems.map((p) => p.item),
    ...pathologyItems.filter((p) => !usedPathology.has(p.item)).map((p) => p.item),
    ...otherItems,
  ]
  return result
}

function sanitizeLISNoise(text: string): string {
  text = text.replace(/^[ \t]*(?:摺疊|展開)\s+[\s\S]*?\(\d+\)[ \t]*$/gm, '')
  text = text.replace(/^略過巡覽連結。?[ \t]*$/gm, '')
  text = text.replace(/^[ \t]*最前頁\s+前一頁[\s\S]*?總筆數[：:]\s*\d+[ \t]*$/gm, '')
  text = text.replace(/^查詢條件[ \t]*$/gm, '')
  text = text.replace(/^(?:起始日|結束日)[：:][ \t]*$/gm, '')
  text = text.replace(/^[ \t]*提交[ \t]*$/gm, '')
  text = text.replace(/^[ \t]*(?:二年|一年|六月|三月|門\s*診|急\s*診|住\s*院)(?:\s*\|\s*(?:二年|一年|六月|三月|門\s*診|急\s*診|住\s*院))+[ \t]*$/gm, '')
  text = text.replace(/^累加顯示[ \t]*$/gm, '')
  text = text.replace(/^依表單\s+依類別\s+依日期[ \t]*$/gm, '')
  text = text.replace(/^計算機[ \t]*$/gm, '')
  text = text.replace(/^數據判讀參考資料[ \t]*$/gm, '')
  text = text.replace(/^病理部網頁\(?[^)]*\)?[ \t]*$/gm, '')
  text = text.replace(/^外科病理研究委託申請表單[ \t]*$/gm, '')
  text = text.replace(/^查詢結果[ \t]*$/gm, '')
  return text
}

export interface ParseLISResult {
  results: any[]
  skipped: any[]
  demographics: Demographics
  freeTextDx: any[]
  freeTextDxRaw: any[]
  unknown: any[]
}

export function parseLIS(text: string): ParseLISResult {
  text = sanitizeLISNoise(text)

  const demographics = parseDemographics(text)
  const sections = splitReports(text)
  const allResults: any[] = []
  const freeTextItems: any[] = []
  const skipped: any[] = []

  for (const sec of sections) {
    if (sec.isPending) {
      const itemMatches = [...sec.text.matchAll(/項目名稱[：:]\s*(.+?)(?:\s*　　|\s{2,}|\n|$)/g)]
      skipped.push({
        type: sec.type,
        items: itemMatches.map((m) => m[1].trim()).filter(Boolean),
      })
      continue
    }

    if (/動脈硬化檢查|肱踝動脈|足踝肱動脈/.test(sec.text)) {
      allResults.push(...parseSpecialSection(sec))
      continue
    }

    if (/細菌檢查報告|培養|Culture/i.test(sec.type)) {
      freeTextItems.push(...parseCultureSection(sec))
      continue
    }

    const ftType = detectFreeTextType(sec.type)
    if (ftType) {
      if (ftType.label === '家醫部') {
        const subtype = detectFMSubtype(sec.text)
        if (subtype === 'fundus') {
          freeTextItems.push(...parseFundusSection(sec))
          continue
        }
        if (subtype === 'foot') {
          freeTextItems.push(...parseFootSection(sec))
          continue
        }
        if (subtype === 'sudomotor') {
          freeTextItems.push(...parseSudomotorSection(sec))
          continue
        }
      }
      freeTextItems.push(...parseFreeTextSection(sec, ftType))
      continue
    }

    const r = parseTableSection(sec)
    if (r) allResults.push(...r)
  }

  const freeTextDx = integrateFreeTextDx(freeTextItems)
  const freeTextDxRaw = integrateFreeTextDxRaw(freeTextItems)

  const knownResults = allResults.filter((r) => !r.unknown)
  const unknownResults = allResults.filter((r) => r.unknown)
  const unknownByKey: Record<string, any> = {}
  for (const r of unknownResults) {
    if (!unknownByKey[r.key]) unknownByKey[r.key] = r
  }
  const unknownUnique = Object.values(unknownByKey)

  return { results: knownResults, skipped, demographics, freeTextDx, freeTextDxRaw, unknown: unknownUnique }
}

function classifyResult(item: any, sex: Sex): string {
  if (item.unknown) return '?'
  const def = item.def
  if (def.is_qual) {
    const negs = (def.qual_neg || []).map((s: string) => norm(s))
    const q = norm(item.qual || '')
    if (negs.includes(q) || q === '' || q === 'normal') return 'OK'
    return 'H'
  }
  if (item.num === null) return '?'
  if (def.crit_low != null && item.num <= def.crit_low) return 'LL'
  if (def.crit_high != null && item.num >= def.crit_high) return 'HH'
  const ref = item.reportRef || getRef(def, sex)
  if (!ref) return '?'
  const [lo, hi] = ref
  if (item.range) {
    const rHi = item.range[1]
    if (def.direction === 'low_bad') return item.range[0] < lo ? 'L' : 'OK'
    if (rHi > hi) return 'H'
    if (item.range[0] < lo) return 'L'
    return 'OK'
  }
  if (def.direction === 'low_bad') return item.num < lo ? 'L' : 'OK'
  if (item.num < lo) return 'L'
  if (item.num > hi) return 'H'
  return 'OK'
}

export function integrateTimeline(allResults: any[], sex: Sex): any[] {
  for (const r of allResults) r.flag = classifyResult(r, sex)
  const byKey: Record<string, any[]> = {}
  for (const r of allResults) {
    if (!byKey[r.key]) byKey[r.key] = []
    byKey[r.key].push(r)
  }
  for (const key of Object.keys(byKey)) {
    const byDate: Record<string, any> = {}
    for (const r of byKey[key]) {
      const d = r.sampledAt || '?'
      if (!byDate[d]) {
        byDate[d] = r
        continue
      }
      const cur = byDate[d]
      const curScore = (cur.capped ? 0 : 2) + (cur.num != null ? 1 : 0)
      const newScore = (r.capped ? 0 : 2) + (r.num != null ? 1 : 0)
      if (newScore > curScore) byDate[d] = r
    }
    byKey[key] = Object.values(byDate)
  }
  const integrated: any[] = []
  for (const [, arr] of Object.entries(byKey)) {
    arr.sort((a, b) => {
      const da = a.sampledAt || '0000-00-00'
      const db = b.sampledAt || '0000-00-00'
      return db.localeCompare(da)
    })
    const latest = arr[0]
    const olderAbnormal = arr.slice(1).find((r) => r.flag !== 'OK' && r.flag !== '?')
    if (latest.flag === 'OK' && !olderAbnormal) continue
    if (latest.flag === '?' && !olderAbnormal) continue
    integrated.push({
      ...latest,
      pastAbnormal: latest.flag === 'OK' && olderAbnormal ? olderAbnormal : null,
      allReadings: arr,
    })
  }
  return integrated
}

function getReading(integrated: any[], itemKey: string): any {
  return integrated.find((r) => r.key === itemKey)
}

function evaluateCriterion(crit: any, integrated: any[]): any {
  const reading = getReading(integrated, crit.item)
  if (!reading) return { met: false }
  const useReading = reading.flag !== 'OK' && reading.flag !== '?' ? reading : reading.pastAbnormal
  if (!useReading) return { met: false }
  const num = useReading.num
  let met = false
  switch (crit.op) {
    case '>':
      met = num != null && num > crit.value
      break
    case '>=':
      met = num != null && num >= crit.value
      break
    case '<':
      met = num != null && num < crit.value
      break
    case '<=':
      met = num != null && num <= crit.value
      break
    case '==':
      met = num != null && num === crit.value
      break
    case 'between':
      met = num != null && num >= crit.value[0] && num <= crit.value[1]
      break
    case 'out_of_ref':
      met = ['H', 'L', 'HH', 'LL'].includes(useReading.flag)
      break
    case 'above_ref':
      met = useReading.flag === 'H' || useReading.flag === 'HH'
      break
    case 'below_ref':
      met = useReading.flag === 'L' || useReading.flag === 'LL'
      break
    case 'qual_positive':
      met = useReading.flag === 'H' || useReading.flag === 'HH'
      break
  }
  return { met, reading: useReading }
}

export function applyDiagnosisRules(integrated: any[]): any[] {
  const triggered: any[] = []
  const triggeredIds = new Set<string>()
  for (const rule of DX_RULES.rules) {
    if (rule.exclude_if && rule.exclude_if.some((id: string) => triggeredIds.has(id))) continue
    const evals = rule.criteria.map((c: any) => ({ crit: c, ...evaluateCriterion(c, integrated) }))
    const ok = rule.logic === 'all' ? evals.every((e: any) => e.met) : evals.some((e: any) => e.met)
    if (ok) {
      const evidence = evals.filter((e: any) => e.met).map((e: any) => e.reading)
      triggered.push({ rule, evidence })
      triggeredIds.add(rule.id)
    }
  }
  return triggered.map((t) => {
    if (t.rule.id === 'ckd') return refineCkdStage(t, integrated)
    if (t.rule.id === 'diabetes_mellitus') return refineDmCode(t, integrated)
    return t
  })
}

function refineCkdStage(triggered: any, integrated: any[]): any {
  const egfrItem = integrated.find((it) => it.key === 'eGFR')
  const egfr = egfrItem ? egfrItem.num : null
  if (egfr == null) return triggered

  let stageLabel, icd10, icdDesc
  if (egfr >= 90) {
    stageLabel = 'stage G1 (≥90)'
    icd10 = 'N18.1'
    icdDesc = 'CKD stage 1'
  } else if (egfr >= 60) {
    stageLabel = 'stage G2 (60–89)'
    icd10 = 'N18.2'
    icdDesc = 'CKD stage 2 (mild)'
  } else if (egfr >= 45) {
    stageLabel = 'stage G3a (45–59)'
    icd10 = 'N18.30'
    icdDesc = 'CKD stage 3a (mild-moderate)'
  } else if (egfr >= 30) {
    stageLabel = 'stage G3b (30–44)'
    icd10 = 'N18.32'
    icdDesc = 'CKD stage 3b (moderate-severe)'
  } else if (egfr >= 15) {
    stageLabel = 'stage G4 (15–29)'
    icd10 = 'N18.4'
    icdDesc = 'CKD stage 4 (severe)'
  } else {
    stageLabel = 'stage G5 (<15)'
    icd10 = 'N18.5'
    icdDesc = 'CKD stage 5'
  }

  return {
    ...triggered,
    rule: {
      ...triggered.rule,
      name: 'Chronic kidney disease, ' + stageLabel,
      icd10,
      icd10_desc: icdDesc,
    },
  }
}

function refineDmCode(triggered: any, integrated: any[]): any {
  const a1cItem = integrated.find((it) => it.key === 'HbA1c')
  const a1c = a1cItem ? a1cItem.num : null
  if (a1c == null || a1c < 9) return triggered
  return {
    ...triggered,
    rule: {
      ...triggered.rule,
      name: 'Diabetes mellitus, with hyperglycemia',
      icd10: 'E11.65',
      icd10_desc: 'Type 2 diabetes mellitus with hyperglycemia',
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// Pure presentation helpers (used by the React UI)
// ═══════════════════════════════════════════════════════════════

export function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}/${m[2]}/${m[3]}` : iso
}

export function labGroupName(sourceType: string): string {
  if (!sourceType) return '其他'
  if (/尿液|胃液/.test(sourceType)) return '尿液'
  if (/一般.*血液|血液檢驗.*一般/.test(sourceType)) return 'CBC'
  if (/緊急.*血液|凝血/.test(sourceType)) return '凝血'
  if (/核醫科免疫/.test(sourceType)) return '核醫'
  if (/血清免疫/.test(sourceType)) return '血清'
  if (/特殊生化/.test(sourceType)) return '特殊生化'
  if (/緊急生化/.test(sourceType)) return '生化'
  if (/自動化生化|生化/.test(sourceType)) return '生化'
  if (/微生物|細菌培養/.test(sourceType)) return '培養'
  return sourceType.replace(/檢驗報告|檢查報告|門診|報告/g, '').trim() || '其他'
}

export function fmtYearMonth(iso: string | null): string {
  if (!iso) return ''
  const m = iso.match(/(\d{4})-(\d{2})/)
  return m ? `${m[1]}/${m[2]}` : iso
}

export function displayValue(item: any): string {
  if (item.def && item.def.is_qual) return item.qual || (item.num != null ? String(item.num) : '—')
  if (item.qual && /[~+]/.test(item.qual)) return item.qual
  if (item.num != null) return String(item.num)
  return item.qual || '—'
}

function stripSeverityFromText(text: string): string {
  return text
    .replace(/,\s*LA[\s\-]*grade\s+[A-D]\s*$/i, '')
    .replace(/,\s*LA[\-\s]+[A-D]\s*$/i, '')
    .replace(/,\s*grade\s+[A-D1-4IV]+\s*$/i, '')
    .replace(/,\s*(?:mild|moderate|severe)\s*$/i, '')
    .trim()
}

export function formatFreeTextDx(d: any): string {
  const sortedSources = [...d.sources].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const tagSources = sortedSources.filter((s) => !(s.short in PATHOLOGY_TO_PROCEDURE))
  const uniqueShorts = [...new Set(tagSources.map((s) => s.short))]
  const shortTag = uniqueShorts.join(', ')

  if (d.occurrences && d.occurrences.length > 1) {
    const cleanName = stripSeverityFromText(d.text)
    const occParts = d.occurrences.map((o: any) => {
      const dateStr = fmtYearMonth(o.date)
      return o.severity ? `${dateStr} ${o.severity}` : dateStr
    })
    return `${cleanName}, ${occParts.join(', ')} (${shortTag})`
  }

  const seen = new Set<string>()
  const uniqueTagSources = tagSources.filter((s) => {
    const k = `${fmtYearMonth(s.date)}|${s.short}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const tag = uniqueTagSources.map((s) => `${fmtYearMonth(s.date)} ${s.short}`).join(' / ')
  return `${d.text} (${tag})`
}
