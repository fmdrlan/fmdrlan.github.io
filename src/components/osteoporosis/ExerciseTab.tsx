import { Printer, Download } from 'lucide-react'

const IMG_SRC = '/assets/osteoporosis-exercise.png'

export function ExerciseTab() {
  return (
    <div className="mx-auto max-w-[900px] px-5 pt-6 pb-16 max-md:px-4">
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3.5 print:hidden">
        <div>
          <h1 className="text-[22px] font-bold leading-tight text-text">骨鬆運動</h1>
          <p className="mt-0.5 text-[14px] text-text-muted">
            可直接列印成 A4 發給病人。按下方按鈕，或在圖片以外的地方按右鍵選「列印」。
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-text bg-text px-[18px] py-2 text-[14px] text-bg hover:opacity-90"
          >
            <Printer className="h-[15px] w-[15px]" strokeWidth={1.8} />
            列印
          </button>
          <a
            href={IMG_SRC}
            download="骨質疏鬆運動建議.png"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg2 px-[18px] py-2 text-[14px] text-text-muted no-underline hover:border-border-strong"
          >
            <Download className="h-[15px] w-[15px]" strokeWidth={1.8} />
            下載圖片
          </a>
        </div>
      </div>
      <figure className="m-0 rounded-md border border-border bg-white p-2.5 print:border-0 print:p-0">
        <img src={IMG_SRC} alt="骨質疏鬆運動建議海報" className="block h-auto w-full print:max-h-[285mm] print:object-contain" />
      </figure>
    </div>
  )
}
