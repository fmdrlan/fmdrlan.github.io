#!/usr/bin/env python3
"""
自動檢查健保署是否有新版 PDF，有則下載並重新解析。
由 GitHub Actions 每週自動執行。
"""

import requests
import re
import json
import subprocess
import sys
from pathlib import Path
from bs4 import BeautifulSoup

NHI_URL = "https://www.nhi.gov.tw/ch/np-2508-1.html"
VERSION_FILE = Path("data/last_version.txt")
DATA_DIR = Path("data")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}


def get_latest_pdf_info():
    """從健保署網頁找最新的整份 PDF 連結與日期"""
    print(f"🌐 檢查健保署網頁：{NHI_URL}")
    resp = requests.get(NHI_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    pdf_url = None
    version_str = None

    # 找所有超連結中包含「完整給付規定」字樣的 PDF
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(strip=True)
        if ".pdf" in href.lower() and "完整給付規定" in (href + text):
            # 從檔名中抽日期，如 完整給付規定1150323.pdf → 1150323
            m = re.search(r'(\d{7})', href)
            if m:
                version_str = m.group(1)
                # 補全 URL
                if href.startswith("http"):
                    pdf_url = href
                elif href.startswith("/"):
                    pdf_url = "https://www.nhi.gov.tw" + href
                else:
                    pdf_url = "https://www.nhi.gov.tw/" + href
                break

    if not pdf_url:
        # 備用：直接嘗試已知格式的 URL
        print("⚠️  頁面上找不到 PDF 連結，嘗試備用方法...")
        # 從頁面文字找日期
        m = re.search(r'完整給付規定(\d{7})', resp.text)
        if m:
            version_str = m.group(1)
            pdf_url = f"https://www.nhi.gov.tw/ch/dl-{version_str}-完整給付規定{version_str}.pdf"

    return pdf_url, version_str


def read_last_version():
    if VERSION_FILE.exists():
        return VERSION_FILE.read_text(encoding="utf-8").strip()
    return None


def save_version(version_str):
    DATA_DIR.mkdir(exist_ok=True)
    VERSION_FILE.write_text(version_str, encoding="utf-8")


def download_pdf(url: str, dest: Path):
    print(f"⬇️  下載 PDF：{url}")
    resp = requests.get(url, headers=HEADERS, timeout=120, stream=True)
    resp.raise_for_status()

    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    dest.parent.mkdir(exist_ok=True)

    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=65536):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)

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
    try:
        pdf_url, new_version = get_latest_pdf_info()
    except Exception as e:
        print(f"❌ 無法取得健保署頁面：{e}")
        sys.exit(1)

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
