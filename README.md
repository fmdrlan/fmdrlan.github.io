# DR. LAN's Toolbox

家醫科醫師寫給自己用的臨床工具箱。

**Live**: https://fmdrlan.github.io/

---

## 工具列表

| 頁面 | 用途 |
|---|---|
| `index.html` | Landing page（六項工具導覽）|
| `drugs.html` | 健保藥品給付規定全文搜尋 |
| `lab.html` | LIS 檢驗報告解讀（複製貼上 → 自動分類異常 + 產生診斷）|
| `lipid.html` | 高血脂風險評估（台灣 2025 / ESC 2025 / AHA 2026 三大指引 + 健保給付）|
| `lipid_nhi.html` | 簡化版高血脂健保 statin 給付判斷 |
| `vaccine.html` | 疫苗查詢 |
| `compare.html` | 同類藥物比較（SGLT2 / GLP-1 / Statin / DOAC）|
| `obesity.html` | 門診結構化問診（肥胖議題）|

---

## 自動更新流程

每週一早上 10:00 透過 GitHub Actions 跑 `scripts/check_update.py`：

1. 抓健保署的「藥品給付規定」最新 PDF
2. 用 `scripts/parse_pdf.py` 解析成 `data/drugs.json`
3. 跟舊版 diff，產生 `data/changelog.json`（新增 / 修改 / 刪除）
4. Commit 到 main，GitHub Pages 自動部署

前端載入時 `fetch('data/changelog.json')`，在頁面頂端顯示「本次更新摘要」banner。

---

## 專案結構

```
fmdrlan.github.io/
├── index.html              Landing page
├── drugs.html              藥品給付查詢
├── lab.html                檢驗報告解讀
├── lipid.html / lipid_nhi.html  高血脂風險評估
├── vaccine.html            疫苗查詢
├── compare.html            藥物類別比較
├── obesity.html            門診問診
│
├── assets/
│   ├── shared.css          各頁共用樣式
│   ├── icons.js            SVG icons
│   ├── logo.png            主 LOGO（書法字）
│   └── favicon.ico ...     favicon
│
├── data/
│   ├── drugs.json          解析好的給付規定（每週自動更新）
│   ├── changelog.json      本次更新差異
│   ├── last_version.txt    目前版本號（如 1150323）
│   ├── sglt2.json / glp1.json  藥物類別比較資料
│   ├── lab_dict.json       檢驗項目對照字典（123 項、含成大命名）
│   └── dx_rules.json       診斷規則表（30 條，可編輯擴充）
│
├── scripts/
│   ├── check_update.py     檢查健保署 PDF 更新
│   └── parse_pdf.py        PDF 解析 + 自動產生 changelog
│
├── .github/workflows/
│   └── update.yml          GitHub Actions 自動排程
│
├── requirements.txt
└── README.md
```

---

## lab.html 解析能力

- **三層解析器**：報告區塊切片 → 抓日期 → 表格 / 特殊格式分流
- **跨日整合**：每個項目顯示最近一次異常，過去異常但目前正常的會一併標出
- **「已開立但無結果」自動跳過**：避免醫令未跑完的污染診斷
- **左右分欄 Diagnosis**：左欄可一鍵複製進病歷，右欄是佐證
- **123 項辨識 + 性別分層**：含成大命名（FERR / BIL-T / 微血管指血糖 等）
- **特殊格式支援**：
  - 動脈硬化（ABI / PWV）→ Arterial stiffness / PAD suspected
  - 糖尿病眼底篩檢 → Diabetic retinopathy（三狀態：正常 / 病變 / 無法評估）
  - 糖尿病足部檢查 → Diabetic foot findings
  - Sudomotor 排汗神經 → Reduced sudomotor function
  - 腹部超音波、胃鏡、胸部 X 光、CT 等 free-text impression 抽取
- **30 條診斷規則**（DM / Prediabetes / Dyslipidemia / CKD / UTI / Hematuria /
  Hyperuricemia / Anemia / Thyroid / HBV carrier / HBV past infection / HCV 等）
  全在 `data/dx_rules.json`

---

## 聲明

本網站為 DR. LAN 個人臨床工作備忘工具。

- 資料來源：衛生福利部中央健康保險署、各臨床指引（ADA、KDIGO、ESC、AHA、TLA 等）
- 僅供查詢參考，臨床決策以健保署官方公告與最新指引為準
- 本站不承擔任何因資料落差造成的責任
