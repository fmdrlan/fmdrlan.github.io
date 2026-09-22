import { useMemo, useState } from 'react'
import { Printer, Eraser } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PATIENT_DRUGS,
  PATIENT_COMMON,
  datesFor,
  parseDateInput,
  type PatientDrug,
} from '@/lib/osteoporosis-patient-data'

const INPUT =
  'rounded-md border border-border bg-bg2 px-2.5 py-1.5 text-[15px] text-text transition-colors placeholder:text-text-dim focus:border-accent focus:outline-none'

const localISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const RICH = '[&_b]:font-semibold [&_b]:text-text'

function Sheet({ d, name, base }: { d: PatientDrug; name: string; base: Date | null }) {
  const who = [name ? `${name} 女士／先生` : '', base ? `開立日期 ${base.getFullYear()}/${base.getMonth() + 1}/${base.getDate()}` : '']
    .filter(Boolean)
    .join('　·　')
  const dates = datesFor(d, base)

  return (
    <article className="mb-4 break-inside-avoid rounded-md border border-border bg-surface px-7 py-6 print:break-after-page print:border-none print:bg-white print:px-0 print:py-0 print:text-[#111]">
      <div className="mb-4 border-b-2 border-text pb-2.5">
        {who && <div className="mb-1.5 text-[13px] text-text-dim">{who}</div>}
        <h2 className="text-[23px] leading-tight font-bold tracking-tight text-text print:text-[#111]">
          {d.zh}
          <span className="mt-0.5 block text-[14px] font-normal text-text-dim">{d.en}</span>
        </h2>
        <p className="mt-2 text-[15px] text-text-muted">{d.what}</p>
      </div>

      <div className="mb-4 rounded-r-md border-l-4 border-accent bg-accent-dim px-4 py-3">
        <div className="mb-0.5 text-[12.5px] text-accent">用法</div>
        <div className="text-[18px] leading-snug font-semibold text-text">{d.usage}</div>
      </div>

      {d.steps && (
        <>
          <h3 className="mt-5 mb-2 border-b border-border pb-1 text-[16px] font-semibold text-text">服用步驟</h3>
          <ol className={cn('list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-text', RICH)}>
            {d.steps.map((s, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
            ))}
          </ol>
        </>
      )}

      <h3 className="mt-5 mb-2 border-b border-border pb-1 text-[16px] font-semibold text-text">一定要記得</h3>
      <ul className={cn('list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-text', RICH)}>
        {d.keys.map((s, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
        ))}
      </ul>

      <h3 className="mt-5 mb-2 border-b border-border pb-1 text-[16px] font-semibold text-text">可能出現的不適</h3>
      <ul className={cn('list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-text', RICH)}>
        {d.common.map((s, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
        ))}
      </ul>

      <div className="mt-4 rounded-md border border-warn bg-warn/[0.08] px-4 py-3.5 print:border-[#b3261e] print:bg-[#fdeceb]">
        <h3 className="mb-1.5 text-[16px] font-semibold text-warn print:text-[#b3261e]">出現這些情形，請立刻回診或就醫</h3>
        <ul className={cn('list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#f3b3a8] print:text-[#7d1b15]', RICH)}>
          {d.urgent.map((s, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
          ))}
        </ul>
      </div>

      {dates.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {dates.map((x, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-lg px-4 py-3 [min-width:200px]',
                x.strong ? 'border-2 border-text' : 'border border-border',
              )}
            >
              <div className="mb-0.5 text-[13px] text-text-muted">{x.lbl}</div>
              <div className={cn('font-bold tabular-nums text-text', x.strong ? 'text-[21px]' : 'text-[17px]')}>{x.val}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-border pt-3.5">
        <ul className="space-y-1 pl-5 text-[14px] text-text-muted">
          {PATIENT_COMMON.map((s, i) => (
            <li key={i} className="list-disc">{s}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-[13px] text-text-dim print:hidden">
        <span className="flex-1 border-b border-border pb-0.5 [min-width:180px]">開立醫師</span>
        <span className="flex-1 border-b border-border pb-0.5 [min-width:180px]">聯絡電話</span>
        <span className="flex-1 border-b border-border pb-0.5 [min-width:180px]">下次回診</span>
      </div>
    </article>
  )
}

export function PatientHandoutTab() {
  const [name, setName] = useState('')
  const [dateStr, setDateStr] = useState(() => localISO(new Date()))
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const base = useMemo(() => parseDateInput(dateStr), [dateStr])
  const selected = PATIENT_DRUGS.filter((d) => picked.has(d.id))

  return (
    <div className="mx-auto max-w-[820px] px-5 pt-6 pb-2 max-md:px-4">
      <div className="print:hidden">
        <h1 className="text-[22px] font-bold leading-tight text-text">病人用藥注意事項</h1>
        <p className="mt-1 mb-5 text-[14px] text-text-muted">
          勾選這次要開的藥，產生可列印的 A4 單張。資料只留在這台電腦的瀏覽器裡，不會送出。
        </p>

        <div className="mb-3.5 rounded-[10px] border border-border bg-surface px-5 py-4">
          <h2 className="mb-2.5 text-[14px] font-semibold text-text-muted">病人與日期</h2>
          <div className="flex flex-wrap gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] text-text-muted">病人姓名（選填，會印在單張上）</label>
              <input
                type="text"
                className={cn(INPUT, 'w-[190px]')}
                value={name}
                placeholder="例：王小美"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] text-text-muted">開立／施打日期</label>
              <input type="date" className={cn(INPUT, 'w-[150px]')} value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="mb-3.5 rounded-[10px] border border-border bg-surface px-5 py-4">
          <h2 className="mb-2.5 text-[14px] font-semibold text-text-muted">這次開立的藥物</h2>
          <div className="flex flex-wrap gap-2">
            {PATIENT_DRUGS.map((d) => {
              const on = picked.has(d.id)
              return (
                <label
                  key={d.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2.5 text-[14.5px]',
                    on ? 'border-accent bg-accent-dim text-text' : 'border-border bg-bg2 text-text hover:border-border-strong',
                  )}
                >
                  <input type="checkbox" className="h-[17px] w-[17px] shrink-0 accent-accent" checked={on} onChange={() => togglePick(d.id)} />
                  <span>
                    {d.zh} <span className="text-[12.5px] text-text-dim">{d.tag}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!picked.size) return
              window.print()
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-text bg-text px-[18px] py-2 text-[14px] text-bg hover:opacity-90"
          >
            <Printer className="h-[15px] w-[15px]" strokeWidth={1.8} />
            列印 / 存成 PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setPicked(new Set())
              setName('')
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-bg2 px-[18px] py-2 text-[14px] text-text-muted hover:border-border-strong"
          >
            <Eraser className="h-[15px] w-[15px]" strokeWidth={1.8} />
            清空
          </button>
          <span className="text-[13px] text-text-dim">{picked.size ? `已選 ${picked.size} 張` : ''}</span>
        </div>
      </div>

      <div className="pt-1 pb-14">
        {selected.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border bg-surface px-5 py-9 text-center text-[14.5px] text-text-dim print:hidden">
            勾選藥物後，這裡會出現可列印的單張。
          </div>
        ) : (
          selected.map((d) => <Sheet key={d.id} d={d} name={name.trim()} base={base} />)
        )}
      </div>
    </div>
  )
}
