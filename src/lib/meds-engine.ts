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
  prn: boolean // PRN（需要時）
  route: string // PO、SC、IV
  days: string // 28（可選保留）
  repeats: string // 3
  section: string // 慢性處方箋 / 一般處方 等
}

const ROUTES = new Set([
  'PO', 'SC', 'IM', 'IV', 'IVD', 'IVF', 'PR', 'SL', 'TOP', 'INH', 'NEB',
  'OD', 'OS', 'OU', 'AD', 'AS', 'AU', 'NS', 'TD', 'VAG', 'EXT', 'NA', 'SUBL', 'BUCC',
])

// 劑量與劑型：40mg/tab、5/80 mg/tab、500mcg/cap、12.5mg/tab
const STRENGTH_RE = /([\d.]+(?:\s*\/\s*[\d.]+)*)\s*(mg|mcg|ug|g|IU|iu|%|ml|mL)?\s*\/\s*(dose|spray|puff|act|tab|cap|amp|vial|btl|syrg|pen|ml|mL|g|patch|supp|bag|pc)\b/i
// 住院醫囑為 [學名(商品名)_劑量/劑型]，與門診的 [商品名 劑量/劑型(學名)] 相反。
// 以「右括號後接底線再接劑量」辨識住院格式。
const INPATIENT_SPEC_RE = /^(.+?)\(([^()]*)\)\s*_\s*(.+)$/
// 另一種門診匯出格式無中括號，以日期括號與冒號分隔：
//   Xyzal 5mg/tab(Levocetirizine)(2026/10/19) : 1.00 tab QDPC PO X 28.00天 = 28.00 tab
const COLON_LINE_RE = /^(.+?)\s*\((\d{4}[/-]\d{1,2}[/-]\d{1,2})\)\s*[:：]\s*([\d.]+)\s+(\S+)\s*(.*)$/

// 醫囑前後的狀態標記：【Change】【New】…、[ADC]、[註：…]、(警)、(已執行續用) 等
const LEAD_MARK_RE = /^(?:\s*【[^】]*】)+/
const TRAIL_MARK_RE = /(?:\s*\[[^\]]*\]|\s*（[^）]*）|\s*\((?:警|已執行續用|停|自備|暫停)\))+\s*$/

// 劑型字尾，用來把 "Folic Acid tab" 修成 "Folic Acid"
const TRAILING_FORM_RE = /\s+(nasal\s+spray|spray|inhaler|inhalation|tab|tablet|tablets|cap|capsule|capsules|inj|injection|syrup|susp|soln|sol|cream|oint|gel|patch|supp|powder|f\.?c\.?)\.?$/i

const trimNum = (v: string) => (v.includes('.') ? v.replace(/0+$/, '').replace(/\.$/, '') : v)

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
    let t = line.trim()
    if (!t) continue

    // 區段標題，例如 [慢性處方箋]：整行就是一個中括號且不含劑量
    const sectionMatch = t.match(/^\[([^\]]+)\]$/)
    if (sectionMatch) {
      section = sectionMatch[1]
      continue
    }

    // 住院醫囑可能以【Change】等狀態標記開頭
    t = t.replace(LEAD_MARK_RE, '').trim()

    // 藥品行有三種格式：
    //   [商品名 劑量/劑型(學名)] 數量 單位 用法…      （門診）
    //   [學名(商品名)_劑量/劑型] 數量 單位 用法…      （住院）
    //   商品名 劑量/劑型(學名)(日期) : 數量 單位 用法… （門診另一種匯出）
    let spec: string
    let qty: string
    let qtyUnit: string
    let rawTail: string

    const bracket = t.match(/^\[(.+?)\]\s+([\d.]+)\s+(\S+)\s*(.*)$/)
    const colon = bracket ? null : t.match(COLON_LINE_RE)
    if (bracket) {
      ;[, spec, qty, qtyUnit, rawTail] = bracket
    } else if (colon) {
      ;[, spec, , qty, qtyUnit, rawTail] = colon
    } else {
      continue
    }

    let brand: string
    let generic: string
    let strength = ''
    let unit = ''
    let form = ''

    const inpatient = spec.match(INPATIENT_SPEC_RE)
    if (inpatient) {
      // [學名(商品名)_劑量/劑型]
      generic = inpatient[1].trim().replace(/\s*\/\s*/g, '/')
      brand = inpatient[2].trim()
      const sm = inpatient[3].match(STRENGTH_RE)
      if (sm) {
        strength = sm[1].replace(/\s+/g, '')
        unit = sm[2] ?? 'mg'
        form = sm[3]
      }
    } else {
      // [商品名 劑量/劑型(學名)]
      const paren = splitLastParen(spec)
      generic = paren ? paren.inside.replace(/\s*\/\s*/g, '/') : ''
      const beforeParen = paren ? paren.before : spec
      const sm = beforeParen.match(STRENGTH_RE)
      if (sm) {
        strength = sm[1].replace(/\s+/g, '')
        unit = sm[2] ?? 'mg'
        form = sm[3]
      }
      brand = (sm ? beforeParen.slice(0, sm.index) : beforeParen).trim()
      brand = brand.replace(TRAILING_FORM_RE, '').trim()
    }

    // 尾段：先取調劑量，再剝除 [ADC]、[註：…]、(警) 等標記
    const dispense =
      rawTail.match(/[xX×]\s*([\d.]+)\s*天(?:\s*[xX×]\s*([\d.]+)\s*次)?/) ?? null
    let tail = rawTail
      .split(/\s*[xX×]\s*[\d.]+\s*天/)[0]
      .replace(TRAIL_MARK_RE, '')
      .trim()
    // 標記也可能夾在用法中間（住院常見），逐一清掉
    tail = tail.replace(/\[[^\]]*\]|（[^）]*）/g, ' ')

    const sigTokens = tail.split(/\s+/).filter(Boolean)

    // PRN 可出現在頻次前後，單獨抽出
    let prn = false
    const prnIdx = sigTokens.findIndex((tok) => /^PRN$/i.test(tok))
    if (prnIdx >= 0) {
      prn = true
      sigTokens.splice(prnIdx, 1)
    }

    // 途徑在住院醫囑可能出現在頻次之前
    let route = ''
    const routeIdx = sigTokens.findIndex((tok) => ROUTES.has(tok.toUpperCase()))
    if (routeIdx >= 0) {
      route = sigTokens[routeIdx].toUpperCase()
      sigTokens.splice(routeIdx, 1)
    }
    const freq = sigTokens.join(' ')

    out.push({
      raw: line.trim(),
      brand,
      generic: generic || brand,
      strength,
      unit,
      form,
      qty: trimNum(qty),
      qtyUnit,
      freq,
      prn,
      route,
      days: dispense?.[1] ? trimNum(dispense[1]) : '',
      repeats: dispense?.[2] ? trimNum(dispense[2]) : '',
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

// HIS 常以 tall-man lettering 標示易混淆藥名（dexTROmethorphan），統一成首字大寫。
// 只處理 4 個字以上的純字母詞：短詞與含數字者（MgO、A+B、B12）保留原樣。
export function normalizeName(name: string): string {
  return name.replace(/[^\s/+]+/g, (tok) =>
    /^[A-Za-z]{5,}$/.test(tok) ? tok[0].toUpperCase() + tok.slice(1).toLowerCase() : tok,
  )
}

export function formatOrder(o: MedOrder, useBrand: boolean, withDispense = false): string {
  const name = normalizeName(useBrand ? o.brand : o.generic)
  const dose = doseLabel(o)
  const head = dose ? `${name}(${dose})` : name
  const parts = [head, qtyLabel(o), o.freq, o.prn ? 'PRN' : '', o.route].filter(Boolean)
  let s = parts.join(' ')
  if (withDispense && o.days) s += ` ×${o.days}天${o.repeats ? `×${o.repeats}` : ''}`
  return s
}
