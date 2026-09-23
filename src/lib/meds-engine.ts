// 把 HIS「藥品醫囑」整段文字解析成精簡的一行一藥。
// 原始格式範例：
//   [Lipitor 40mg/tab(Atorvastatin)] 0.5 tab QD PO x 28 天 x 3 次 = 14.00 tab .
// 目標輸出：
//   Atorvastatin(40) 0.5# QD PO

export interface MedOrder {
  raw: string
  brand: string // 商品名（去掉劑量與劑型）
  generic: string // 括號內的學名
  strength: string // 40、5/80、500
  unit: string // mg、mcg、IU…（mg 不顯示）
  form: string // tab、cap、ml…
  qty: string // 0.5、1、2
  qtyUnit: string // tab、cap、ml
  freq: string // QD、BIDPC、HS
  route: string // PO、SC、IV
  days: string // 28（可選保留）
  repeats: string // 3
  section: string // 慢性處方箋 / 一般處方 等
}

const ROUTES = new Set([
  'PO', 'SC', 'IM', 'IV', 'IVD', 'IVF', 'PR', 'SL', 'TOP', 'INH', 'NEB',
  'OD', 'OS', 'OU', 'AD', 'AS', 'AU', 'NS', 'TD', 'VAG', 'EXT',
])

// 劑量與劑型：40mg/tab、5/80 mg/tab、500mcg/cap、12.5mg/tab
const STRENGTH_RE = /([\d.]+(?:\s*\/\s*[\d.]+)*)\s*(mg|mcg|ug|g|IU|iu|%|ml|mL)?\s*\/\s*(tab|cap|amp|vial|btl|syrg|pen|ml|mL|g|patch|supp|bag|pc)\b/i
// 劑型字尾，用來把 "Folic Acid tab" 修成 "Folic Acid"
const TRAILING_FORM_RE = /\s+(tab|tablet|tablets|cap|capsule|capsules|inj|injection|syrup|susp|soln|sol|cream|oint|gel|patch|supp|powder|f\.?c\.?)\.?$/i

function splitLastParen(s: string): { before: string; inside: string } | null {
  const close = s.lastIndexOf(')')
  if (close === -1) return null
  let depth = 0
  for (let i = close; i >= 0; i--) {
    if (s[i] === ')') depth++
    else if (s[i] === '(') {
      depth--
      if (depth === 0) return { before: s.slice(0, i).trim(), inside: s.slice(i + 1, close).trim() }
    }
  }
  return null
}

export function parseMedOrders(raw: string): MedOrder[] {
  if (!raw || !raw.trim()) return []
  const out: MedOrder[] = []
  let section = ''

  for (const line of raw.replace(/\r/g, '').split('\n')) {
    const t = line.trim()
    if (!t) continue

    // 區段標題，例如 [慢性處方箋]：整行就是一個中括號且不含劑量
    const sectionMatch = t.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      section = sectionMatch[1]
      continue
    }

    // 藥品行：[……] 數量 單位 頻次 途徑 …
    const m = t.match(/^\[(.+)\]\s+([\d.]+)\s+(\S+)\s+(.*)$/)
    if (!m) continue

    const [, spec, qty, qtyUnit, tail] = m

    const paren = splitLastParen(spec)
    const generic = paren ? paren.inside.replace(/\s*\/\s*/g, '/') : ''
    const beforeParen = paren ? paren.before : spec

    const sm = beforeParen.match(STRENGTH_RE)
    const strength = sm ? sm[1].replace(/\s+/g, '') : ''
    const unit = sm ? (sm[2] ?? 'mg') : ''
    const form = sm ? sm[3] : ''

    let brand = sm ? beforeParen.slice(0, sm.index).trim() : beforeParen.trim()
    brand = brand.replace(TRAILING_FORM_RE, '').trim()

    // 尾段：頻次 途徑 x 28 天 x 3 次 = 56.00 tab .
    const dispense = tail.match(/[xX×]\s*([\d.]+)\s*天(?:\s*[xX×]\s*([\d.]+)\s*次)?/)
    const sigPart = tail.split(/\s+[xX×]\s*[\d.]+\s*天/)[0].trim()
    const sigTokens = sigPart.split(/\s+/).filter(Boolean)

    let route = ''
    const routeIdx = sigTokens.findIndex((tok) => ROUTES.has(tok.toUpperCase()))
    if (routeIdx >= 0) {
      route = sigTokens[routeIdx].toUpperCase()
      sigTokens.splice(routeIdx, 1)
    }
    const freq = sigTokens.join(' ')

    out.push({
      raw: t,
      brand,
      generic: generic || brand,
      strength,
      unit,
      form,
      qty,
      qtyUnit,
      freq,
      route,
      days: dispense?.[1] ?? '',
      repeats: dispense?.[2] ?? '',
      section,
    })
  }

  return out
}

// 劑量括號：mg 省略單位，其餘保留（避免 500mcg 被誤看成 500mg）
export function doseLabel(o: MedOrder): string {
  if (!o.strength) return ''
  const u = o.unit.toLowerCase()
  return u === 'mg' || u === '' ? o.strength : `${o.strength}${o.unit}`
}

// 數量：錠劑膠囊用 #，其餘保留原單位
export function qtyLabel(o: MedOrder): string {
  const u = o.qtyUnit.toLowerCase()
  return u === 'tab' || u === 'cap' ? `${o.qty}#` : `${o.qty} ${o.qtyUnit}`
}

export function formatOrder(o: MedOrder, useBrand: boolean, withDispense = false): string {
  const name = useBrand ? o.brand : o.generic
  const dose = doseLabel(o)
  const head = dose ? `${name}(${dose})` : name
  const parts = [head, qtyLabel(o), o.freq, o.route].filter(Boolean)
  let s = parts.join(' ')
  if (withDispense && o.days) s += ` ×${o.days}天${o.repeats ? `×${o.repeats}` : ''}`
  return s
}
