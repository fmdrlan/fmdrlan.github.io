import type { Drug } from '@/data/drugs-data'
import { ALIAS_MAP } from '@/data/drugs-data'

const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g

function escapeRegex(s: string) {
  return s.replace(REGEX_ESCAPE, '\\$&')
}

/**
 * Expand a query through ALIAS_MAP into a set of search terms.
 * - exact-match: query == key → add aliases
 * - query-contains-key: key length ≥ 4 → add aliases
 * - key-starts-with-query: query length ≥ 4 → add aliases
 */
export function getSearchTerms(q: string): string[] {
  const lower = q.toLowerCase().trim()
  const terms = new Set([lower])
  for (const key in ALIAS_MAP) {
    const exactMatch = lower === key
    const queryContainsKey = lower.includes(key) && key.length >= 4
    const keyStartsWithQuery = key.startsWith(lower) && lower.length >= 4
    if (exactMatch || queryContainsKey || keyStartsWithQuery) {
      for (const a of ALIAS_MAP[key]) terms.add(a.toLowerCase())
    }
  }
  return [...terms]
}

/**
 * Word-boundary aware match for term in haystack.
 * - ≤2 char term: plain includes
 * - >2 char: regex with non-alphanumeric boundaries (so "statin" doesn't match "Sandostatin")
 */
export function termMatches(term: string, hay: string): boolean {
  if (term.length <= 2) return hay.includes(term)
  const re = new RegExp(`(?<![a-z0-9])${escapeRegex(term)}(?![a-z0-9])`, 'i')
  return re.test(hay)
}

/**
 * Wrap matching terms in <mark> tags. Operates on already-escaped HTML.
 */
export function highlight(html: string, query: string): string {
  if (!query) return html
  const terms = getSearchTerms(query).sort((a, b) => b.length - a.length)
  let out = html
  for (const t of terms) {
    if (t.length < 2) continue
    try {
      out = out.replace(new RegExp(`(${escapeRegex(t)})`, 'gi'), '<mark>$1</mark>')
    } catch {
      // ignore bad regex
    }
  }
  return out
}

/** HTML-escape user content. */
export function esc(s: string | undefined): string {
  return (s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Find related drugs via ALIAS_MAP intersection. Max 8 results. */
export function findRelated(drug: Drug, allDrugs: Drug[]): Drug[] {
  if (drug.is_appendix) return []
  const hay = (drug.title + ' ' + (drug.drug_names || []).join(' ')).toLowerCase()
  const candidateTerms = new Set<string>()

  for (const key in ALIAS_MAP) {
    const all = [key, ...ALIAS_MAP[key]]
    const hit = all.some((t) => {
      const tt = t.toLowerCase()
      if (tt.length < 3) return false
      return hay.includes(tt)
    })
    if (hit) all.forEach((t) => candidateTerms.add(t.toLowerCase()))
  }
  if (candidateTerms.size === 0) return []

  const related: Drug[] = []
  const seen = new Set<Drug['id']>([drug.id])
  for (const d of allDrugs) {
    if (seen.has(d.id) || d.is_appendix) continue
    const dHay = (d.title + ' ' + (d.drug_names || []).join(' ')).toLowerCase()
    let matched = false
    for (const t of candidateTerms) {
      if (t.length < 3) continue
      const re = new RegExp(`(?<![a-z0-9])${escapeRegex(t)}(?![a-z0-9])`, 'i')
      if (re.test(dHay)) {
        matched = true
        break
      }
    }
    if (matched) {
      related.push(d)
      seen.add(d.id)
    }
    if (related.length >= 8) break
  }
  return related
}

/** Extract leading section number from a drug title, e.g. "2.6.1.史塔汀..." → "2.6.1" */
export function getSectionFromTitle(title: string): string {
  const m = title.match(/^\d+(?:\.\d+)*/)
  return m ? m[0] : ''
}

/** Strip leading section number from title for display, e.g. "2.6.1.史塔汀..." → "史塔汀..." */
export function stripSection(title: string): string {
  return title.replace(/^[\d.]+\.?\s*/, '')
}

/** Insert <br> before sub-item markers within a single block of text. */
export function breakSubItems(html: string): string {
  let out = html
  out = out.replace(/([。：）])\s*([（(]\d+[）)])/g, '$1<br>$2')
  out = out.replace(/([。：）者])\s*(\d+\.[　 ])/g, '$1<br>$2')
  out = out.replace(/([。])\s*(\d+\.)/g, '$1<br>$2')
  out = out.replace(/([。：）])\s*([IⅠ][IⅠ]?[IⅠ]?\.[　 ])/g, '$1<br>$2')
  out = out.replace(/([。：）])\s*([ivx]+\.[　 ])/g, '$1<br>$2')
  return out
}
