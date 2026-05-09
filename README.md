# 💊 DR. YANG's Toolbox — 健保藥品給付規定查詢

家醫科醫師寫給自己用的查詢工具箱。

不需要任何程式基礎，跟著步驟做就可以架好！

---

## 🚀 第一次設定（約 15 分鐘）

### 步驟 1：建立免費 GitHub 帳號

1. 打開瀏覽器，前往 [https://github.com](https://github.com)
2. 點右上角「Sign up」
3. 依照指示完成註冊（需要 email）

---

### 步驟 2：上傳這個專案到 GitHub

1. 登入 GitHub 後，點右上角「+」→「New repository」
2. Repository name 填入：`nhi-drug-search`
3. 選「Public」（公開，才能用免費的 Pages）
4. 點「Create repository」
5. 選擇「uploading an existing file」
6. 把這個資料夾裡的**所有檔案和資料夾**都拖進去上傳
7. 點「Commit changes」

---

### 步驟 3：開啟 GitHub Pages（讓網站可以公開瀏覽）

1. 進入你的 repository 頁面
2. 點上方「Settings」（齒輪圖示）
3. 左側選「Pages」
4. Source 選「Deploy from a branch」
5. Branch 選「main」，資料夾選「/ (root)」
6. 點「Save」

等 1~2 分鐘，你的網站就會在這個網址可以看：
```
https://你的帳號名.github.io/nhi-drug-search
```

> 入口頁是 `index_landing.html`（工具箱首頁）。藥品搜尋頁是 `index.html`。
> 若要讓 GitHub Pages 預設打開工具箱首頁，請把 `index_landing.html` 重新命名為 `index.html`，並把現在的 `index.html` 改名為 `search.html`（記得同時更新所有頁面 tab 的 href）。

---

### 步驟 4：設定每週自動更新

1. 進入 repository 頁面
2. 點上方「Actions」
3. 如果看到提示說「I understand my workflows, go ahead and enable them」→ 點它
4. 完成！之後每週一早上 10 點會自動執行

---

## 🔄 手動觸發更新

如果你知道健保署剛公告新版，不想等到週一：

1. 進入 repository → 點「Actions」
2. 左側點「每週自動更新藥品給付規定」
3. 右側點「Run workflow」→「Run workflow」

---

## 📁 專案結構說明

```
nhi-drug-search/
├── index_landing.html        # 工具箱首頁（landing page）
├── index.html                # 藥品搜尋頁
├── lipid.html                # 高血脂風險評估
├── vaccine.html              # 疫苗查詢（建造中）
│
├── assets/                   # 共用資源
│   ├── shared.css            # 三頁共用樣式（tabs、footer、changelog、related drugs）
│   └── icons.js              # SVG icon（Lucide 風格，跨平台一致）
│
├── data/
│   ├── drugs.json            # 解析好的給付規定資料
│   ├── changelog.json        # 與上一版的差異（新增/修改/刪除）
│   └── last_version.txt      # 記錄目前版本號（如 1150323）
│
├── scripts/
│   ├── check_update.py       # 自動檢查健保署 PDF 更新
│   └── parse_pdf.py          # PDF 解析 + 自動產生 changelog.json
│
├── .github/workflows/
│   └── update.yml            # GitHub Actions 自動排程設定
│
└── requirements.txt          # Python 套件清單
```

---

## ✨ 功能特色

### 藥品搜尋頁（index.html）
- **全文搜尋**：支援中文、英文學名、商品名、適應症、藥物類別
- **同義詞展開（ALIAS_MAP）**：搜 `statin` 自動展開到 rosuvastatin、atorvastatin、可定、立普妥…
- **相關條目推薦**：點開任一條目，下方自動列出同類藥的其他給付條文
- **本次更新摘要**：頁面頂端顯示「新增 X 條 / 修改 Y 條 / 刪除 Z 條」，可展開明細
- **複製條文**：每張卡片右下角按鈕，一鍵複製整段給付規定

### 自動更新流程
每次 GitHub Actions 跑 `parse_pdf.py` 時：
1. 解析新 PDF 為新的 `drugs.json`
2. 跟舊的 `drugs.json` 用標準化標題作 key 做 diff
3. 產生 `changelog.json`（包含 added / modified / removed 三組標題）
4. Commit 三個檔案：`drugs.json`、`changelog.json`、`last_version.txt`
5. 前端載入時 `fetch('data/changelog.json')` 顯示在頂端 banner

---

## ❓ 常見問題

**Q：網站多久更新一次？**
A：GitHub Actions 設定每週一早上 10 點自動執行，檢查健保署有沒有新 PDF，有才會更新。

**Q：GitHub Actions 免費嗎？**
A：Public repository 完全免費，每月有 2,000 分鐘額度（本專案每次執行約 2 分鐘）。

**Q：健保署更新格式怎麼辦？**
A：如果 `check_update.py` 找不到新的 PDF 連結，GitHub Actions 執行結果會顯示錯誤，你可以到 Actions 頁面查看，再手動下載 PDF 執行一次解析。

**Q：如何手動更新資料？**
A：從健保署下載新版 PDF，重命名為任意名稱（建議含日期，如 `完整給付規定1150323.pdf`，這樣 changelog 才會正確標示版本），放到 `data/` 資料夾，再執行：
```
python scripts/parse_pdf.py data/你下載的檔案.pdf
```
然後把 `data/drugs.json` 和 `data/changelog.json` 上傳到 GitHub。

**Q：怎麼新增藥物類別到 ALIAS_MAP？**
A：編輯 `index.html` 中的 `ALIAS_MAP` 物件，鍵是搜尋詞、值是同義詞陣列。例如新增「免疫抑制劑」分類：
```js
'免疫抑制劑': ['cyclosporine','tacrolimus','azathioprine','mycophenolate'],
```
ALIAS_MAP 同時驅動「搜尋展開」與「相關條目推薦」兩個功能。

---

## ⚠️ 聲明

本網站使用對象為 DR. YANG 本人，僅作個人臨床工作備忘之用。
資料來源為衛生福利部中央健康保險署，僅供查詢參考，
以健保署官方公告內容為準。本站不承擔任何因資料落差造成的責任。
