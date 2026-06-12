import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, Search } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'

export const Route = createFileRoute('/compare')({
  component: ComparePage,
})

// ── Data shapes ──
interface SourcedValue {
  value: string
  source?: string
  last_verified?: string
}
interface Indications {
  value: string[]
  source?: string
  last_verified?: string
  note?: string
}
interface NhiCoverage {
  value: string
  source?: string
  cross_ref_section?: string
}
interface Trial {
  name: string
  year: number
  population: string
  intervention: string
  primary_outcome: string
  secondary?: string
  note?: string
  ref: string
  pmid?: string
}
interface Guideline {
  guideline: string
  statement: string
  section?: string
}
interface Drug {
  generic: string
  brand_tw: string
  brand_zh: string
  in_formulary: boolean
  manufacturer?: string
  in_formulary_note?: string
  class_note?: string
  basic: {
    doses_available: SourcedValue
    renal_adjustment: SourcedValue
    hepatic_adjustment: SourcedValue
  }
  indications_tfda: Indications
  nhi_coverage: NhiCoverage
  common_ae: string[]
  key_trials?: Trial[]
  guideline_position?: Guideline[]
}
interface CompareData {
  _meta: { last_updated?: string; [k: string]: unknown }
  drugs: Drug[]
}

type ClassKey = 'sglt2' | 'glp1'
const CLASS_FILES: Record<ClassKey, string> = {
  sglt2: '/data/sglt2.json',
  glp1: '/data/glp1.json',
}
const CLASS_BTNS = [
  { key: 'sglt2', label: 'SGLT2', enabled: true },
  { key: 'glp1', label: 'GLP-1 RA', enabled: true },
  { key: 'statin', label: 'Statin', enabled: false },
  { key: 'doac', label: 'DOAC', enabled: false },
] as const

function ComparePage() {
  const [currentClass, setCurrentClass] = useState<ClassKey>('sglt2')
  const [data, setData] = useState<CompareData | null>(null)
  const [showOOF, setShowOOF] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setLoadError(null)
    ;(async () => {
      try {
        const res = await fetch(CLASS_FILES[currentClass])
        if (!res.ok) throw new Error(`${currentClass}.json: ${res.status}`)
        const json: CompareData = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentClass])

  const drugs = data ? data.drugs.filter((d) => showOOF || d.in_formulary) : []

  return (
    <div className="compare-page">
      <SiteNav />
      <div className="mx-auto max-w-[1200px] px-6 pt-8 max-md:px-3 max-md:pt-5">
        <div className="mb-5 min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-text">藥物類別比較</h1>
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-relaxed text-text-muted">
            同類藥之仿單適應症、里程碑試驗、指引建議分層呈現。每筆資料標註來源，便於核對。
          </p>
        </div>

        <div className="disclaimer mb-5">
          <span className="dc-icon">
            <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </span>
          <div>
            <strong>使用提醒：</strong>本表整理自 TFDA 仿單、原始試驗論文（NEJM/Lancet 等）、ADA / KDIGO / ESC 指引。
            <strong>同類藥之間如無註明 head-to-head 試驗，不應推論優劣。</strong>
            不同試驗之人群、follow-up、終點定義均不同，跨試驗之 HR 數值不可直接比較。臨床決策請以最新仿單與指引為準。
          </div>
        </div>

        <div className="class-selector mb-5">
          {CLASS_BTNS.map((b) => (
            <button
              key={b.key}
              type="button"
              disabled={!b.enabled}
              title={!b.enabled ? '待加入' : undefined}
              onClick={() => b.enabled && setCurrentClass(b.key as ClassKey)}
              className={`class-btn ${!b.enabled ? 'disabled' : currentClass === b.key ? 'active' : ''}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 pb-16 max-md:px-3">
        <div className="toggle-bar mb-5">
          <span className="toggle-label">顯示設定</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={showOOF} onChange={(e) => setShowOOF(e.target.checked)} />
            <span className="toggle-track" />
            <span className="toggle-text">顯示成大醫院非常備藥物（淡色標示）</span>
          </label>
        </div>

        {loadError ? (
          <div className="rounded-lg border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            ⚠️ 載入資料失敗：{loadError}
          </div>
        ) : !data ? (
          <div className="px-5 py-12 text-center text-text-muted">載入中…</div>
        ) : (
          <>
            <Layer num="L1" title="仿單事實層" desc="高可信 · 來源為 TFDA 仿單與健保署">
              <table className="compare-table">
                <DrugHead drugs={drugs} />
                <tbody>
                  {LAYER1_ROWS.map((row) => (
                    <tr key={row.label}>
                      <th className="row-label">
                        {row.label}
                        <span className="row-label-sub">{row.sub}</span>
                      </th>
                      {drugs.map((d, i) => (
                        <Cell key={i} drug={d}>
                          {row.render(d)}
                        </Cell>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Layer>

            <Layer num="L2" title="里程碑試驗層" desc="中高可信 · 各藥之主要 RCT，跨藥不直接比較">
              <table className="compare-table">
                <DrugHead drugs={drugs} />
                <tbody>
                  <tr>
                    <th className="row-label">
                      關鍵試驗<span className="row-label-sub">Key trials</span>
                    </th>
                    {drugs.map((d, i) => (
                      <Cell key={i} drug={d}>
                        <TrialsCell drug={d} />
                      </Cell>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Layer>

            <Layer num="L3" title="指引建議層" desc="引用主要國際與台灣指引立場（不改寫）">
              <table className="compare-table">
                <DrugHead drugs={drugs} />
                <tbody>
                  <tr>
                    <th className="row-label">
                      指引立場<span className="row-label-sub">Guideline position</span>
                    </th>
                    {drugs.map((d, i) => (
                      <Cell key={i} drug={d}>
                        <GuidelinesCell drug={d} />
                      </Cell>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Layer>

            <div className="mt-8 text-center text-xs leading-[1.8] text-text-light">
              資料整理：DR. LAN · 最後更新：{data._meta.last_updated ?? '—'}
              <br />
              本工具僅供醫護人員臨床參考，不取代個別病人評估與最新指引。
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Layer 1 row definitions ──
const LAYER1_ROWS: { label: string; sub: string; render: (d: Drug) => React.ReactNode }[] = [
  {
    label: '常用劑量',
    sub: 'Doses available',
    render: (d) => (
      <>
        {d.basic.doses_available.value}
        <SrcTag src={d.basic.doses_available.source} />
      </>
    ),
  },
  {
    label: '腎功能調整',
    sub: 'Renal adjustment',
    render: (d) => (
      <>
        {d.basic.renal_adjustment.value}
        <SrcTag src={d.basic.renal_adjustment.source} />
      </>
    ),
  },
  {
    label: '肝功能調整',
    sub: 'Hepatic adjustment',
    render: (d) => (
      <>
        {d.basic.hepatic_adjustment.value}
        <SrcTag src={d.basic.hepatic_adjustment.source} />
      </>
    ),
  },
  {
    label: 'TFDA 仿單適應症',
    sub: 'Indications (TFDA label)',
    render: (d) => (
      <>
        <ul className="cell-list">
          {d.indications_tfda.value.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
        {d.indications_tfda.note && (
          <div className="mt-1.5 text-[12px] text-yellow">⚠ {d.indications_tfda.note}</div>
        )}
        <SrcTag src={d.indications_tfda.source} lastVerified={d.indications_tfda.last_verified} />
      </>
    ),
  },
  {
    label: '健保給付',
    sub: 'NHI coverage',
    render: (d) => (
      <>
        {d.nhi_coverage.value}
        {d.nhi_coverage.cross_ref_section && (
          <>
            <br />
            <Link className="nhi-link" to="/drugs" search={{ q: d.nhi_coverage.cross_ref_section }}>
              <Search className="h-[11px] w-[11px]" strokeWidth={1.8} />查 {d.nhi_coverage.cross_ref_section}
            </Link>
          </>
        )}
        <SrcTag src={d.nhi_coverage.source} />
      </>
    ),
  },
  {
    label: '常見不良反應',
    sub: 'Common AE',
    render: (d) => (
      <ul className="cell-list">
        {d.common_ae.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    ),
  },
]

// ── Pieces ──
function DrugHead({ drugs }: { drugs: Drug[] }) {
  return (
    <thead>
      <tr>
        <th className="row-label" />
        {drugs.map((d, i) => (
          <th key={i} className={`drug-col-header ${d.in_formulary ? '' : 'dimmed'}`}>
            <div className="drug-name-line1">{d.generic}</div>
            <div className="drug-name-line2">
              {d.brand_tw} · {d.brand_zh}
            </div>
            {d.class_note && (
              <div className="drug-name-line3" style={{ color: 'var(--color-yellow)', fontStyle: 'italic' }}>
                ⚐ {d.class_note}
              </div>
            )}
            {!d.in_formulary && <span className="form-tag out">非常備</span>}
            {!d.in_formulary && d.in_formulary_note && (
              <div className="drug-name-line3">{d.in_formulary_note}</div>
            )}
          </th>
        ))}
      </tr>
    </thead>
  )
}

function Cell({ drug, children }: { drug: Drug; children: React.ReactNode }) {
  return <td className={drug.in_formulary ? '' : 'dimmed'}>{children}</td>
}

function SrcTag({ src, lastVerified }: { src?: string; lastVerified?: string }) {
  if (!src) return null
  return (
    <div className="src">
      <span className="src-label">SRC</span>
      {src}
      {lastVerified ? ` · 驗證 ${lastVerified}` : ''}
    </div>
  )
}

function TrialsCell({ drug }: { drug: Drug }) {
  if (!drug.key_trials || drug.key_trials.length === 0) {
    return <span className="empty-cell">無收錄主要試驗</span>
  }
  const sorted = [...drug.key_trials].sort((a, b) => (b.year || 0) - (a.year || 0))
  return (
    <>
      {sorted.map((t, i) => (
        <div key={i} className="trial-card">
          <div className="trial-name">
            {t.name}
            <span className="trial-year">{t.year}</span>
          </div>
          <div className="trial-meta">
            <span className="trial-meta-label">人群</span>
            {t.population}
          </div>
          <div className="trial-meta">
            <span className="trial-meta-label">介入</span>
            {t.intervention}
          </div>
          <div className="trial-result">
            <span className="trial-meta-label">結果</span>
            {t.primary_outcome}
          </div>
          {t.secondary && (
            <div className="trial-meta" style={{ marginTop: 4 }}>
              <span className="trial-meta-label">次要</span>
              {t.secondary}
            </div>
          )}
          {t.note && <div className="trial-note">{t.note}</div>}
          <div className="trial-ref">
            {t.ref}
            {t.pmid && (
              <>
                {' · '}
                <a href={`https://pubmed.ncbi.nlm.nih.gov/${t.pmid}/`} target="_blank" rel="noopener noreferrer">
                  PMID {t.pmid}
                </a>
              </>
            )}
          </div>
        </div>
      ))}
    </>
  )
}

function GuidelinesCell({ drug }: { drug: Drug }) {
  if (!drug.guideline_position || drug.guideline_position.length === 0) {
    return <span className="empty-cell">無收錄指引立場</span>
  }
  return (
    <>
      {drug.guideline_position.map((g, i) => (
        <div key={i} className="gl-card">
          <div className="gl-name">{g.guideline}</div>
          <div className="gl-stmt">{g.statement}</div>
          {g.section && <div className="gl-section">{g.section}</div>}
        </div>
      ))}
    </>
  )
}

function Layer({
  num,
  title,
  desc,
  children,
}: {
  num: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="layer-section">
      <div className="layer-header">
        <span className="layer-num">{num}</span>
        <span className="layer-title">{title}</span>
        <span className="layer-desc">{desc}</span>
      </div>
      <div className="compare-scroll">{children}</div>
    </div>
  )
}
