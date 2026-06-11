import { MessageSquare } from 'lucide-react'

const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfNUXEtUPxavNh_ga1khBQr0VOcY0ZYVmkMK3Ux3CNxznPUSg/viewform'

export function Footer() {
  return (
    <div className="text-center text-xs leading-[1.7] text-text-dim">
      工具由 <strong className="font-medium text-text-dim">DR. LAN</strong> 個人維護 ·
      本站不隸屬於任何醫療機構或政府機關 · 程式碼用青春在下班空檔寫的，bug 也是
      <br />
      僅紀念我被扣去的紅利
      <div className="mt-3.5">
        <a
          href={FEEDBACK_URL}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1 text-xs leading-snug text-white no-underline transition-all duration-150 hover:border-text-dim hover:bg-white/5"
        >
          <MessageSquare className="h-[13px] w-[13px]" strokeWidth={1.8} />
          回報錯誤 / 提建議
        </a>
      </div>
    </div>
  )
}
