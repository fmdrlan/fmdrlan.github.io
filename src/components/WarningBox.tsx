import { AlertTriangle } from 'lucide-react'

export function WarningBox() {
  return (
    <div className="mb-10 border-b border-border pb-8 text-center">
      <div className="mb-2.5 inline-flex items-center justify-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-yellow">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
        Warning
      </div>
      <div className="text-sm leading-[1.8] text-text-muted">
        本站使用對象為 <strong className="font-medium text-text">懶醫師本人</strong>，
        <strong className="font-medium text-text">路人請自負風險</strong>
        <br />
        這裡沒有 IRB 把關、沒有同儕審閱、沒有 24 小時客服
        <br />
        開立任何醫囑前，請以你的知識為準，或參考健保署最新公告與最新版指引原文
        <br />
        資料可能過時、可能筆誤、可能我心情不好那天寫錯
      </div>
    </div>
  )
}
