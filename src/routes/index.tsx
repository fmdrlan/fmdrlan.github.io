import { createFileRoute } from '@tanstack/react-router'
import {
  Search,
  FlaskConical,
  TrendingUp,
  Syringe,
  Scale,
  Weight,
} from 'lucide-react'
import { WarningBox } from '../components/WarningBox'
import { ToolCard } from '../components/ToolCard'
import { Footer } from '../components/Footer'
import { Badge } from '../components/Badge'

export const Route = createFileRoute('/')({
  component: Landing,
})

function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[600px]">
        <div className="mb-3 flex justify-center">
          <img
            src="/assets/logo.png"
            alt="DR. LAN — 成大家醫科"
            width={1254}
            height={1254}
            className="block h-auto w-[360px] max-w-[90%]"
          />
        </div>

        <WarningBox />

        <nav className="mb-12 flex flex-col gap-2.5" aria-label="工具列表">
          <ToolCard
            href="/drugs"
            icon={Search}
            name="健保藥品給付規定查詢"
            desc="全文搜尋健保給付條件"
          />
          <ToolCard
            href="/lab"
            icon={FlaskConical}
            name="檢驗報告解讀"
            desc="貼上成大 LIS 檢驗結果，自動辨識項目，產生可複製的 Objective 與 Diagnosis"
            badge={<Badge variant="new">NEW</Badge>}
          />
          <ToolCard
            href="/lipid"
            icon={TrendingUp}
            name="高血脂風險評估"
            desc="台灣 2025 / ESC 2024 / AHA 2026 三大指引風險分級與健保給付判斷"
          />
          <ToolCard
            href="/vaccine"
            icon={Syringe}
            name="疫苗查詢"
            desc="小兒疫苗時程、成人自費疫苗資訊"
            badge={<Badge variant="wip">建造中</Badge>}
          />
          <ToolCard
            href="/compare"
            icon={Scale}
            name="藥物類別比較"
            desc="同類藥之仿單適應症、指引建議比較"
            badge={<Badge variant="wip">建造中</Badge>}
          />
          <ToolCard
            href="/obesity"
            icon={Weight}
            name="門診問診工具"
            desc="結構化問診表，自動生成病歷文字及症狀導向 order 提示。僅支援肥胖議題"
            badge={<Badge variant="wip">建造中</Badge>}
          />
        </nav>

        <Footer />
      </div>
    </div>
  )
}
