import { useState, type ReactNode } from 'react'

// 2.6.1 降血脂給付規定：條文本身是跨欄的大表格，PDF 解析後會變成錯位的純文字，
// 手機上尤其難讀，因此這裡依官方原文重排為表格。
// 內容對應 115/9/1 版；底部保留「官方條文原文」可展開，隨資料更新自動反映最新條文。

export interface Table2Item {
  ingredient: string
  code: string
  name: string
}

// 下方三個表格是依官方條文人工重排的，只對應這個版本。
// 健保署改版時，資料檔會自動更新但表格不會，因此比對版本並在不一致時提醒。
const TABLE_SOURCE_VERSION = '1150922'

const TH = 'border border-border bg-surface2 px-2 py-1.5 text-center font-semibold text-text'
const TD = 'border border-border px-2 py-1.5 align-top leading-[1.5] text-text'
const NUM = `${TD} text-center font-mono whitespace-nowrap`

function Card({ title, tone, children }: { title: string; tone?: 'new' | 'old'; children: ReactNode }) {
  const ring =
    tone === 'new' ? 'border-accent/35 bg-accent/[0.05]' : tone === 'old' ? 'border-yellow/30 bg-yellow/[0.04]' : 'border-border'
  return (
    <section className={`mt-3 rounded-lg border px-3 py-2.5 ${ring}`}>
      <h4 className="mb-2 text-sm font-bold text-text">{title}</h4>
      {children}
    </section>
  )
}

function Fold({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2 rounded-md border border-border bg-black/[0.15]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[12.5px] font-medium text-text-muted hover:text-text"
      >
        <span className="text-accent">{open ? '▾' : '▸'}</span>
        {title}
      </button>
      {open && <div className="px-2.5 pt-0.5 pb-2.5 text-[12.5px] leading-[1.75] text-text">{children}</div>}
    </div>
  )
}

const T1_ROWS = [
  { lv: '極高風險', start: '≧55', goal: '<55', nonhdl: '<85', nd: 'a' },
  { lv: '非常高風險', start: '≧70', goal: '<70', nonhdl: '<100', nd: 'a' },
  { lv: '高風險', start: '≧100', goal: '<100', nonhdl: '<130', nd: 'b' },
  { lv: '中風險', start: '≧115', goal: '<115', nonhdl: '<145', nd: 'c' },
  { lv: '低風險', start: '≧130', goal: '<130', nonhdl: '<160', nd: 'c' },
  { lv: '0 項心血管風險因子', start: '≧160', goal: '<160', nonhdl: '—', nd: 'c' },
]
const ND: Record<string, string> = {
  a: '處置各項可改善心血管風險因子，與藥物治療並行',
  b: '生活型態改變與藥物治療並行',
  c: '給藥前應有 3–6 個月生活型態改變，並處置心血管風險因子',
}

const T2_ROWS = [
  { who: '1. 有急性冠狀動脈症候群病史\n2. 曾接受心導管介入治療或外科冠動脈搭橋手術之冠狀動脈粥狀硬化患者', nd: '與藥物治療可並行', start: 'LDL-C ≧70', goal: 'LDL-C <70' },
  { who: '心血管疾病或糖尿病患者', nd: '與藥物治療可並行', start: 'TC ≧160 或\nLDL-C ≧100', goal: 'TC <160 或\nLDL-C <100' },
  { who: '2 個危險因子或以上', nd: '給藥前應有 3–6 個月非藥物治療', start: 'TC ≧200 或\nLDL-C ≧130', goal: 'TC <200 或\nLDL-C <130' },
  { who: '1 個危險因子', nd: '給藥前應有 3–6 個月非藥物治療', start: 'TC ≧240 或\nLDL-C ≧160', goal: 'TC <240 或\nLDL-C <160' },
  { who: '0 個危險因子', nd: '給藥前應有 3–6 個月非藥物治療', start: 'LDL-C ≧190', goal: 'LDL-C <190' },
]

const TG_ROWS = [
  { who: '心血管疾病或糖尿病病人', nd: '與藥物治療可並行', start: 'TG ≧200 且\n(TC/HDL-C >5 或 HDL-C <40)', goal: 'TG <200' },
  { who: '無心血管疾病病人', nd: '給藥前應有 3–6 個月非藥物治療', start: 'TG ≧200 且\n(TC/HDL-C >5 或 HDL-C <40)', goal: 'TG <200' },
  { who: '無心血管疾病病人（嚴重）', nd: '與藥物治療可並行', start: 'TG ≧500', goal: 'TG <500' },
]

function Table2Items({ items }: { items: Table2Item[] }) {
  // 依成分分組，組內維持官方清單順序
  const groups: { ing: string; rows: Table2Item[] }[] = []
  for (const it of items) {
    const last = groups[groups.length - 1]
    if (last && last.ing === it.ingredient) last.rows.push(it)
    else groups.push({ ing: it.ingredient, rows: [it] })
  }
  return (
    <Fold title={`適用本表之品項清單（${items.length} 項）`}>
      <div className="max-h-[420px] overflow-y-auto rounded border border-border bg-black/20">
        {groups.map((g) => (
          <div key={g.ing} className="border-b border-border last:border-b-0">
            <div className="sticky top-0 bg-surface2 px-2 py-1 text-[11.5px] font-semibold text-accent">
              {g.ing}
              <span className="ml-1.5 font-normal text-text-light">{g.rows.length} 項</span>
            </div>
            {g.rows.map((r) => (
              <div key={r.code} className="flex gap-2 border-t border-white/[0.04] px-2 py-1">
                <span className="w-[86px] shrink-0 font-mono text-[11px] text-text-light">{r.code}</span>
                <span className="flex-1 text-[12px] leading-snug text-text">{r.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Fold>
  )
}

export function Section261({
  table2Items,
  dataVersion,
}: {
  table2Items?: Table2Item[]
  dataVersion?: string
}) {
  const stale = !!dataVersion && dataVersion !== TABLE_SOURCE_VERSION
  const roc = (v: string) => `${v.slice(0, 3)}/${v.slice(3, 5)}/${v.slice(5, 7)}`
  return (
    <div className="pt-3">
      {stale && (
        <div className="mb-3 rounded-lg border border-yellow/40 bg-yellow/[0.08] px-3 py-2 text-[12.5px] leading-relaxed text-[#e8d8a8]">
          ⚠️ 下方表格依 <strong>{roc(TABLE_SOURCE_VERSION)}</strong> 版條文整理，
          目前資料為 <strong>{roc(dataVersion!)}</strong> 版。條文可能已修訂，
          用藥決策請以
          <a
            href="https://www.nhi.gov.tw/ch/np-2508-1.html"
            target="_blank"
            rel="noopener"
            className="mx-0.5 text-accent no-underline hover:underline"
          >
            健保署公告
          </a>
          為準。（下方品項清單為自動擷取，已是最新。）
        </div>
      )}
      {/* ── 表一（新制） ── */}
      <Card title="降膽固醇藥物給付規定表一（115/9/1 起適用）" tone="new">
        <p className="mb-2 text-[12.5px] leading-relaxed text-text-muted">
          降膽固醇藥物適用<strong className="text-text">表一</strong>；惟條文所列特定品項不適用表一，
          <strong className="text-text">僅適用表二</strong>（見下方）。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={TH}>ASCVD 風險等級</th>
                <th className={TH}>起始治療<br />LDL-C</th>
                <th className={TH}>目標<br />LDL-C</th>
                <th className={TH}>次要目標<br />non-HDL-C</th>
              </tr>
            </thead>
            <tbody>
              {T1_ROWS.map((r) => (
                <tr key={r.lv} className={r.lv === '極高風險' ? 'bg-accent/[0.07]' : undefined}>
                  <td className={`${TD} whitespace-nowrap font-medium`}>{r.lv}</td>
                  <td className={NUM}>{r.start}</td>
                  <td className={NUM}>{r.goal}</td>
                  <td className={NUM}>{r.nonhdl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11.5px] text-text-light">單位均為 mg/dL</p>

        <Fold title="非藥物治療要求">
          <ul className="space-y-1">
            <li>・<strong>極高、非常高風險</strong>：{ND.a}</li>
            <li>・<strong>高風險</strong>：{ND.b}</li>
            <li>・<strong>中、低風險、0 項因子</strong>：{ND.c}</li>
          </ul>
        </Fold>

        <Fold title="處方規定與追蹤時程">
          <p className="font-semibold text-text">極高、非常高風險</p>
          <p>一、起始治療：依基線血脂值、用藥史和臨床狀況，給予中至高強度 statin 或合併 ezetimibe。</p>
          <p>二、起始治療 6~8 週後檢測血脂；達標則維持並每 6 個月追蹤。未達標則檢視服藥狀況，考慮調整至高強度或最大耐受 statin 劑量，同時考慮合併 non-statin 治療（ezetimibe、PCSK9 單株抗體、siRNA、ATP citrate lyase 抑制劑）。</p>
          <p>三、更動治療 1~3 個月內追蹤是否達標；達標則維持並每 6 個月追蹤，未達標則檢視服藥狀況並考慮調整藥物組合。</p>
          <p className="mt-2 font-semibold text-text">高風險</p>
          <p>一、起始治療：依基線血脂值與臨床狀況，給予中至高強度 statin 或合併 ezetimibe，同時進行生活型態改變。</p>
          <p>二、起始治療 6~8 週後檢測血脂；達標則維持並每 6 個月追蹤。未達標則考慮高強度或最大耐受 statin 劑量，或合併 non-statin 治療。</p>
          <p>三、更動治療 1~3 個月內追蹤是否達標。</p>
          <p className="mt-2 font-semibold text-text">中、低風險</p>
          <p>一、起始治療：進行生活型態改變，並處置心血管風險因子。</p>
          <p>二、起始治療 3~6 個月後檢測血脂；達標則維持並每 6-12 個月追蹤。未達標則給予中強度 statin。</p>
          <p>三、中強度 statin 治療 6~8 週後追蹤；未達標則檢視服藥狀況，可給予高強度或最大耐受 statin 劑量，或合併 non-statin 治療。</p>
        </Fold>

        <Fold title="ASCVD 風險等級定義">
          <p className="font-semibold text-text">一、極高風險</p>
          <p>（一）冠狀動脈疾病合併下列任一：1. 一年內曾經歷心肌梗塞{'\u3000'}2. ≧兩次心肌梗塞病史{'\u3000'}3. 多支冠狀動脈阻塞{'\u3000'}4. 急性冠心症合併糖尿病{'\u3000'}5. 周邊動脈疾病或頸動脈狹窄</p>
          <p>（二）周邊動脈疾病合併下列任一：1. 冠狀動脈疾病{'\u3000'}2. 頸動脈狹窄</p>
          <p className="mt-1.5 font-semibold text-text">二、非常高風險</p>
          <p>（一）經臨床檢查確診為動脈硬化心血管疾病：1. 急性冠心症病史{'\u3000'}2. 接受血管再通術（心導管介入治療或外科冠狀動脈繞道手術）{'\u3000'}3. 缺血性中風／短暫性腦缺血發作合併動脈硬化相關疾病或病史{'\u3000'}4. 周邊動脈疾病（曾接受血管再通術、有肢體缺血相關症狀或截肢）</p>
          <p>（二）經影像檢查確認有顯著斑塊負擔（≧50% 直徑狹窄率）：1. 冠狀動脈血管攝影{'\u3000'}2. 冠狀動脈或周邊血管電腦斷層攝影{'\u3000'}3. 頸動脈或周邊血管超音波</p>
          <p className="mt-1.5 font-semibold text-text">三、高風險</p>
          <p>（一）糖尿病{'\u3000'}（二）慢性腎臟病（進入透析前，包括 UACR ≧30mg/g 或 eGFR &lt;60mL/min/1.73m² 至少持續 3 個月）{'\u3000'}（三）LDL-C ≧190mg/dL{'\u3000'}（四）冠狀動脈鈣化分數（CAC）≧400</p>
          <p className="mt-1.5 font-semibold text-text">四、中風險</p>
          <p>2 項（含）以上心血管風險因子</p>
          <p className="mt-1.5 font-semibold text-text">五、低風險</p>
          <p>1 項心血管風險因子</p>
        </Fold>

        <Fold title="心血管風險因子定義（6 項）">
          <p>一、高血壓</p>
          <p>二、男性 ≧45 歲，女性 ≧55 歲</p>
          <p>三、早發性冠心病家族史（男性 ≦55 歲，女性 ≦65 歲）</p>
          <p>四、HDL-C：男性 &lt;40mg/dL，女性 &lt;50mg/dL</p>
          <p>五、抽菸</p>
          <p>六、代謝性症候群（符合以下至少三項）：</p>
          <p className="pl-3">（一）腹部肥胖（男性 ≧90cm，女性 ≧80cm）<br />（二）血壓偏高（≧130/85mmHg 或使用高血壓藥物）<br />（三）空腹血糖偏高（≧100mg/dL 或使用糖尿病藥物）<br />（四）空腹 TG 偏高（≧150mg/dL 或使用治療 TG 血脂藥物）<br />（五）HDL-C 偏低（男性 &lt;40mg/dL，女性 &lt;50mg/dL）</p>
        </Fold>

        <Fold title="各風險等級評估建議">
          <p className="font-semibold text-text">一、極高風險、非常高風險</p>
          <p>（一）初始評估應檢測完整血脂指標，並應於急性病人入院後 24 小時內完成血脂檢驗。</p>
          <p>（二）處置各項可改善心血管風險因子，包含血壓、HbA1c、肥胖、抽菸、酒精攝取、生活型態。</p>
          <p className="mt-1.5 font-semibold text-text">二、高風險、中風險、低風險</p>
          <p>（一）給予完整血脂指標檢測，辨識各項可改善心血管風險因子。</p>
          <p>（二）風險分級為高風險且有嚴重高膽固醇血症、肌腱黃色瘤、早發心血管疾病或家族病史時，應依台灣家族性高膽固醇血症診斷標準進行篩檢。</p>
          <p>（三）若未符合高風險條件，應以低至中風險欄位的心血管風險因子數量作為風險評估。</p>
          <p className="mt-2 border-t border-border pt-1.5">
            當 LDL-C 達到理想治療目標後，non-HDL-C 可作為次要標的（＝總膽固醇 − HDL-C），尤其適用於合併高三酸甘油酯、糖尿病或肥胖的病人。
          </p>
        </Fold>
      </Card>

      {/* ── 表二（舊制） ── */}
      <Card title="降膽固醇藥物給付規定表二（特定品項適用）" tone="old">
        <p className="mb-2 text-[12.5px] leading-relaxed text-text-muted">
          條文所列特定品項<strong className="text-text">不適用表一，僅適用本表</strong>。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={TH}>對象</th>
                <th className={TH}>非藥物治療</th>
                <th className={TH}>起始治療血脂值</th>
                <th className={TH}>目標值</th>
              </tr>
            </thead>
            <tbody>
              {T2_ROWS.map((r, i) => (
                <tr key={i} className={i === 0 ? 'bg-yellow/[0.06]' : undefined}>
                  <td className={`${TD} whitespace-pre-line`}>{r.who}</td>
                  <td className={TD}>{r.nd}</td>
                  <td className={`${TD} whitespace-pre-line font-mono`}>{r.start}</td>
                  <td className={`${TD} whitespace-pre-line font-mono`}>{r.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11.5px] text-text-light">單位均為 mg/dL。追蹤：第一年每 3–6 個月，第二年後至少每 6–12 個月抽血一次，並注意肝功能異常、橫紋肌溶解症等副作用。</p>

        <Fold title="心血管疾病定義">
          <p>（一）冠狀動脈粥狀硬化患者包含：心絞痛病人，有心導管證實或缺氧性心電圖變化或負荷性試驗陽性反應者（附檢查報告）</p>
          <p>（二）缺血型腦血管疾病病人包含：1. 腦梗塞{'\u3000'}2. 暫時性腦缺血患者（TIA，診斷須由神經科醫師確立）{'\u3000'}3. 有症狀之頸動脈狹窄（診斷須由神經科醫師確立）</p>
        </Fold>

        <Fold title="危險因子定義（5 項，與表一不同）">
          <p>1. 高血壓</p>
          <p>2. 男性 ≧45 歲，女性 ≧55 歲或停經者</p>
          <p>3. 有早發性冠心病家族史（男性 ≦55 歲，女性 ≦65 歲）</p>
          <p>4. HDL-C &lt;40mg/dL</p>
          <p>5. 吸菸（因吸菸而符合起步治療準則之個案，若未戒菸而要求藥物治療，應以自費治療）</p>
        </Fold>

        {table2Items && table2Items.length > 0 && <Table2Items items={table2Items} />}
      </Card>

      {/* ── 降三酸甘油酯 ── */}
      <Card title="降三酸甘油酯藥物給付規定表">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className={TH}>對象</th>
                <th className={TH}>非藥物治療</th>
                <th className={TH}>起始治療 TG 值</th>
                <th className={TH}>目標值</th>
              </tr>
            </thead>
            <tbody>
              {TG_ROWS.map((r, i) => (
                <tr key={i}>
                  <td className={TD}>{r.who}</td>
                  <td className={TD}>{r.nd}</td>
                  <td className={`${TD} whitespace-pre-line font-mono`}>{r.start}</td>
                  <td className={`${TD} font-mono`}>{r.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[11.5px] text-text-light">單位均為 mg/dL。追蹤：第一年每 3–6 個月，第二年後至少每 6–12 個月抽血一次。</p>
      </Card>
    </div>
  )
}
