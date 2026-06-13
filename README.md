# DR. LAN's Toolbox

家醫科醫師寫給自己用的臨床工具箱。

**Live**: https://fmdrlan.github.io/

---

## 技術棧

- **Vite** + **React 19** + **TypeScript**（strict）
- **Tailwind CSS v4**（`@theme` tokens，主色 teal）
- **TanStack Router**（file-based routing，乾淨 URL）
- **shadcn/ui**（Base UI primitives）、**lucide-react** icons
- **Fuse.js**（藥品模糊搜尋）、**react-day-picker** + **date-fns**（疫苗生日選擇）
- 部署：**GitHub Actions → GitHub Pages**

---

## 工具列表（皆為 React route，乾淨 URL）

| 路由 | 用途 |
|---|---|
| `/` | Landing page（六項工具導覽）|
| `/drugs` | 健保藥品給付規定全文搜尋 |
| `/lab` | LIS 檢驗報告解讀（貼上 → 自動分類異常 + 產生診斷）|
| `/lipid` | 高血脂風險評估（台灣 2025 / ESC 2024 / AHA 2026 三大指引；簡化版 tab = 健保 statin 給付判斷）|
| `/vaccine` | 疫苗查詢（小兒時程依生日推算、成人自費）|
| `/compare` | 同類藥物比較（SGLT2 / GLP-1；Statin / DOAC 待加入）|
| `/obesity` | 門診結構化問診（肥胖議題；初診 / 回診 + BMI 對照工具）|

> 移植原則：**引擎/資料邏輯**從舊版逐行照搬到 `src/lib/*-engine.ts`，**UI** 用 React + Tailwind 重寫。

---

## 開發

需要 Node 22 + pnpm。

```bash
pnpm install
pnpm dev       # 本機開發伺服器（http://localhost:5173）
pnpm build     # tsc -b && vite build && cp dist/index.html dist/404.html
pnpm preview   # 預覽 production build
pnpm lint      # eslint
```

`vite.config.ts` 的 `server.allowedHosts` 已放行 `.trycloudflare.com`，方便用 Cloudflare quick tunnel 遠端預覽（改完 config 記得重啟 `pnpm dev` 才會生效）。

---

## 部署

`main` 一有 push，`.github/workflows/deploy.yml` 就會 `pnpm build` 後把 `dist/` 部署到 GitHub Pages（Pages source 設為 **GitHub Actions**）。

`pnpm build` 會把 `dist/index.html` 複製成 `dist/404.html` 當 SPA fallback——所以直接開或重新整理乾淨 URL（如 `/drugs`）時，GitHub Pages 會回傳 `404.html` 把 React app 載入並渲染對應路由。瀏覽器體驗正常，只是這類深層路徑的 HTTP 狀態碼會是 404（GitHub Pages SPA 的固有行為）。

---

## 藥品資料自動更新

`.github/workflows/update.yml`：每週一 02:00 UTC（台灣 10:00）排程，也可在 Actions 頁面手動 **Run workflow**。

1. `scripts/check_update.py` 爬健保署頁面，抓「藥品給付規定」最新 PDF 的版本日期，跟 `public/data/last_version.txt` 比對
   - 健保署防火牆會擋雲端 IP（403），所以用 `curl_cffi` 模擬 Chrome TLS 指紋 + 完整瀏覽器標頭 + 暖身取 cookie + 重試 backoff（偶爾仍會被擋，手動重跑通常即可）
2. 有新版才下載 PDF，`scripts/parse_pdf.py` 用 `pdfplumber` 解析成 `public/data/drugs.json`（偵測編號層次 → 帶縮排的 blocks；附表只留標題）
3. 跟舊版 diff，產生 `public/data/changelog.json`
4. 以 `NHI Update Bot` 身分 commit 回 `main`，觸發部署

---

## 專案結構

```
fmdrlan.github.io/
├── index.html                Vite 入口
├── vite.config.ts
├── src/
│   ├── routes/               file-based routes
│   │   ├── index.tsx         Landing
│   │   ├── drugs.tsx  lab.tsx  lipid.tsx
│   │   ├── vaccine.tsx  compare.tsx  obesity.tsx
│   │   └── __root.tsx
│   ├── lib/                   移植過來的引擎（pure logic）
│   │   ├── lab-engine.ts  lipid-engine.ts  obesity-engine.ts
│   │   └── drugs-search.ts
│   ├── components/            SiteNav / ToolCard / Footer / ui（shadcn）…
│   └── data/                  drugs-data.ts、vaccine-data.ts（型別 + 內嵌資料）
│
├── public/
│   ├── data/                 執行期 fetch 的 JSON
│   │   ├── drugs.json         解析好的給付規定（每週自動更新）
│   │   ├── changelog.json     更新差異
│   │   ├── last_version.txt / last_check.txt
│   │   ├── sglt2.json / glp1.json     藥物類別比較資料
│   │   ├── lab_dict.json      檢驗項目對照字典
│   │   └── dx_rules.json      診斷規則表
│   └── assets/               logo、favicon、refs/（疫苗參考 PDF）
│
├── scripts/
│   ├── check_update.py        檢查健保署 PDF 更新
│   └── parse_pdf.py           PDF 解析 + 產生 changelog
│
└── .github/workflows/
    ├── deploy.yml             build + 部署到 Pages
    └── update.yml             每週自動更新藥品資料
```

---

## /lab 解析能力

- **三層解析器**：報告區塊切片 → 抓日期 → 表格 / 特殊格式分流
- **跨日整合**：每個項目顯示最近一次異常，過去異常但目前正常的會一併標出
- **「已開立但無結果」自動跳過**：避免醫令未跑完的污染診斷
- **左右分欄 Diagnosis**：左欄可一鍵複製進病歷，右欄是佐證
- **辨識 + 性別分層**：含成大命名（FERR / BIL-T / 微血管指血糖 等）
- **特殊格式支援**：
  - 動脈硬化（ABI / PWV）→ Arterial stiffness / PAD suspected
  - 糖尿病眼底篩檢 → Diabetic retinopathy（三狀態：正常 / 病變 / 無法評估）
  - 糖尿病足部檢查 → Diabetic foot findings
  - Sudomotor 排汗神經 → Reduced sudomotor function
  - 腹部超音波、胃鏡、胸部 X 光、CT 等 free-text impression 抽取
- **診斷規則**（DM / Prediabetes / Dyslipidemia / CKD / UTI / Hematuria /
  Hyperuricemia / Anemia / Thyroid / HBV carrier / HBV past infection / HCV 等）全在 `public/data/dx_rules.json`

---

## 聲明

本網站為 DR. LAN 個人臨床工作備忘工具。

- 資料來源：衛生福利部中央健康保險署、各臨床指引（ADA、KDIGO、ESC、AHA、TLA 等）
- 僅供查詢參考，臨床決策以健保署官方公告與最新指引為準
- 本站不承擔任何因資料落差造成的責任
