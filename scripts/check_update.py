#!/usr/bin/env python3
"""
自動檢查健保署是否有新版 PDF，有則下載並重新解析。
由 GitHub Actions 每週自動執行。
"""

import re
import json
import subprocess
import sys
import time
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path
from bs4 import BeautifulSoup

# 優先用 curl_cffi（能模擬 Chrome 的底層 TLS 指紋，破解 403 封鎖）；
# 若環境沒裝，退回一般 requests。
try:
    from curl_cffi import requests as httpclient
    _USE_CFFI = True
except ImportError:
    import requests as httpclient
    _USE_CFFI = False

NHI_URL = "https://www.nhi.gov.tw/ch/np-2508-1.html"
NHI_HOME = "https://www.nhi.gov.tw/ch/mp-1.html"
VERSION_FILE = Path("public/data/last_version.txt")
LAST_CHECK_FILE = Path("public/data/last_check.txt")
DATA_DIR = Path("public/data")

# 一整組「真瀏覽器」會送出的標頭。健保署的防火牆會檢查這些是否齊全，
# 只設 User-Agent 不夠，會被擋 403。
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,image/apng,*/*;q=0.8"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive",
}


def make_session():
    """建立連線 session。有 curl_cffi 時模擬 Chrome（連 TLS 指紋一起），
    並先逛一次首頁取得 cookie，最大化通過健保署防火牆的機率。"""
    if _USE_CFFI:
        s = httpclient.Session(impersonate="chrome")
        s.headers.update({"Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"})
        print("🦊 使用 curl_cffi（模擬 Chrome 指紋）")
    else:
        s = httpclient.Session()
        s.headers.update(HEADERS)
        print("ℹ️  使用一般 requests（未安裝 curl_cffi）")
    try:
        # 暖身：先 GET 首頁拿 cookie（失敗不致命，繼續試目標頁）
        s.get(NHI_HOME, timeout=30)
    except Exception as e:
        print(f"⚠️  暖身連線首頁未成功（繼續嘗試目標頁）：{e}")
    return s


def fetch_with_retry(session, url, *, referer=None, timeout=30, tries=6):
    """帶重試的 GET，第二次起補上 Referer。被臨時限流(403)時拉長等待，
    並加隨機抖動，給對方防火牆時間解除冷凍。"""
    last_err = None
    # 每次重試的基礎等待秒數（越後面等越久）
    backoff = [20, 45, 90, 120, 150, 180]
    for i in range(tries):
        extra = {}
        if referer or i > 0:
            extra["Referer"] = referer or NHI_HOME
        try:
            resp = session.get(url, headers=extra, timeout=timeout)
            resp.raise_for_status()
            return resp
        except Exception as e:
            last_err = e
            print(f"⚠️  第 {i+1} 次連線失敗：{e}")
            if i < tries - 1:
                wait = backoff[min(i, len(backoff) - 1)] + random.randint(0, 15)
                print(f"   ⏳ 等待 {wait} 秒後重試...")
                time.sleep(wait)
    raise last_err


def _abs_url(href):
    if href.startswith("http"):
        return href
    if href.startswith("/"):
        return "https://www.nhi.gov.tw" + href
    return "https://www.nhi.gov.tw/" + href


def _valid_minguo(v):
    """檢查是否為合理的民國日期 7 碼 YYYMMDD（月 1-12、日 1-31、民國年 >=100）。"""
    if not v or len(v) != 7 or not v.isdigit():
        return False
    yyy, mm, dd = int(v[0:3]), int(v[3:5]), int(v[5:7])
    return yyy >= 100 and 1 <= mm <= 12 and 1 <= dd <= 31


def extract_version(*texts):
    """從多個字串裡抽民國版本日期，回傳 7 碼（如 1150522）。
    支援 1150522 / 115.05.22 / 115/05/22 / 115-05-22，並驗證月日合理，
    避免把下載連結裡的內部編號（如 dl-1548463）誤當成日期。"""
    for t in texts:
        if not t:
            continue
        s = t.replace(" ", "")
        # 點/斜線/連字號分隔的民國日期（最可靠）
        m = re.search(r'(\d{3})[.\-/](\d{1,2})[.\-/](\d{1,2})', s)
        if m:
            y, mo, d = m.groups()
            cand = f"{int(y):03d}{int(mo):02d}{int(d):02d}"
            if _valid_minguo(cand):
                return cand
        # 連續 7 碼，但要通過月日合理性檢查（擋掉內部編號）
        for m in re.finditer(r'(\d{7})', s):
            if _valid_minguo(m.group(1)):
                return m.group(1)
    return None


def get_latest_pdf_info():
    """從健保署網頁找最新「整份/完整」給付規定 PDF 連結與版本日期"""
    print(f"🌐 檢查健保署網頁：{NHI_URL}")
    session = make_session()
    resp = fetch_with_retry(session, NHI_URL)

    soup = BeautifulSoup(resp.text, "html.parser")

    # 頁面標題/內文常見「115.05.22更新」，先抽一個版本日期備用
    page_version = extract_version(soup.title.get_text() if soup.title else "", resp.text)

    # 收集所有可能是「整份給付規定」的連結
    KEYWORDS = ("完整給付規定", "整份", "整份帶走", "給付規定")
    candidates = []          # (score, version, url, text)
    all_pdf_links = []       # 診斷用：所有 PDF / 下載連結
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(strip=True)
        is_pdf = ".pdf" in href.lower()
        is_dl = ("dl-" in href.lower()) or ("download" in href.lower()) or ("/resource/" in href.lower())
        if is_pdf or is_dl:
            all_pdf_links.append((text or "(無文字)", href))
        if not (is_pdf or is_dl):
            continue
        blob = href + " " + text
        # 評分：命中越多關鍵字、且是 PDF，分數越高
        score = sum(2 for k in KEYWORDS if k in blob)
        if is_pdf:
            score += 1
        if score == 0:
            continue
        candidates.append((score, _abs_url(href), text))

    if candidates:
        candidates.sort(key=lambda c: c[0], reverse=True)
        _, pdf_url, text = candidates[0]
        # 版本一律以頁面「更新日期」為準（如標題「115.05.22更新」），
        # 不用下載連結裡的內部編號；連結文字只在頁面抽不到時才退而求其次。
        version_str = page_version or extract_version(text)
        print(f"🔗 命中連結：{text or '(無文字)'} → {pdf_url}")
        print(f"📅 採用版本：{version_str}")
        return pdf_url, version_str

    # ── 找不到：印出診斷資訊，讓我們從 log 看健保署現在的真實結構 ──
    print("⚠️  自動規則找不到「整份給付規定」連結，列出頁面上所有 PDF / 下載連結供診斷：")
    if all_pdf_links:
        for i, (txt, href) in enumerate(all_pdf_links[:40], 1):
            print(f"   [{i}] 文字「{txt}」 → {href}")
    else:
        print("   ⛔ 頁面上完全沒有 PDF / 下載連結（可能是 JS 動態載入，或頁面結構大改）")
    print(f"   📅 從頁面文字抽到的版本日期：{page_version or '（無）'}")

    # 仍嘗試用舊的已知格式湊一個 URL（搭配抽到的版本）
    if page_version:
        guess = f"https://www.nhi.gov.tw/ch/dl-{page_version}-完整給付規定{page_version}.pdf"
        print(f"   🤔 備用猜測 URL：{guess}")
        return guess, page_version

    return None, None


def read_last_version():
    if VERSION_FILE.exists():
        return VERSION_FILE.read_text(encoding="utf-8").strip()
    return None


def save_version(version_str):
    DATA_DIR.mkdir(exist_ok=True)
    VERSION_FILE.write_text(version_str, encoding="utf-8")


def download_pdf(url: str, dest: Path):
    print(f"⬇️  下載 PDF：{url}")
    session = make_session()
    resp = fetch_with_retry(session, url, referer=NHI_URL, timeout=120)

    dest.parent.mkdir(exist_ok=True)
    with open(dest, "wb") as f:
        f.write(resp.content)

    size_mb = dest.stat().st_size / 1024 / 1024
    print(f"✅ 下載完成：{dest}（{size_mb:.1f} MB）")


def run_parser(pdf_path: Path):
    print("🔄 執行 PDF 解析...")
    result = subprocess.run(
        [sys.executable, "scripts/parse_pdf.py", str(pdf_path)],
        capture_output=True, text=True
    )
    print(result.stdout)
    if result.returncode != 0:
        print("❌ 解析失敗：", result.stderr)
        sys.exit(1)
    print("✅ 解析完成")


def main():
    # 記錄這次檢查時間（用台灣時間 UTC+8）
    tw_now = datetime.now(timezone(timedelta(hours=8)))
    check_time_str = tw_now.strftime("%Y-%m-%d %H:%M")
    LAST_CHECK_FILE.write_text(check_time_str, encoding="utf-8")
    print(f"⏱  記錄檢查時間：{check_time_str}")

    try:
        pdf_url, new_version = get_latest_pdf_info()
    except Exception as e:
        # 健保署常對雲端(GitHub Actions) IP 段間歇性回 403。多次重試仍連不上時，
        # 視為「本週無法檢查」軟性略過（不讓 workflow 紅燈），下週換 runner IP 再試。
        print(f"⚠️  無法取得健保署頁面（多次重試後仍失敗）：{e}")
        print("   本週略過檢查（多半是健保署對雲端 IP 的間歇性封鎖），下次排程會再試。")
        Path(Path.home() / "no_update").touch()
        sys.exit(0)

    if not pdf_url or not new_version:
        print("❌ 找不到 PDF 連結，請手動確認健保署網頁格式是否改變")
        sys.exit(1)

    print(f"📋 找到最新版本：{new_version}")
    print(f"🔗 PDF 網址：{pdf_url}")

    last_version = read_last_version()
    print(f"📁 本地版本：{last_version or '（無）'}")

    if new_version == last_version:
        print("✅ 版本相同，無需更新")
        # 寫入 GitHub Actions output
        Path(Path.home() / "no_update").touch()
        return

    print(f"🆕 發現新版本！{last_version} → {new_version}")

    # 下載新 PDF
    pdf_dest = DATA_DIR / f"完整給付規定{new_version}.pdf"
    try:
        download_pdf(pdf_url, pdf_dest)
    except Exception as e:
        print(f"❌ 下載失敗：{e}")
        print("請手動從健保署下載 PDF 後執行：python scripts/parse_pdf.py <pdf路徑>")
        sys.exit(1)

    # 解析
    run_parser(pdf_dest)

    # 記錄版本
    save_version(new_version)
    print(f"💾 版本記錄更新：{new_version}")

    # 刪除舊 PDF（節省空間，只保留 JSON）
    pdf_dest.unlink()
    print("🗑️  已刪除暫存 PDF")

    print("\n🎉 更新完成！")


if __name__ == "__main__":
    main()
