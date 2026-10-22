#!/usr/bin/env python3
"""抓取疾管署新聞稿 → public/data/cdc_news.json

來源：疾管署全球資訊網「新聞稿」列表（公開頁面，無金鑰）。
清單頁取標題、日期與連結；內文頁取本文（以 <br> 分段，非 <p>）。
內容本身已是中文，不需翻譯。
"""

import json
import html
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

LIST_URL = "https://www.cdc.gov.tw/Bulletin/List/MmgtpeidAR5Ooai4-fgHzQ"
BASE = "https://www.cdc.gov.tw"
OUT = Path("public/data/cdc_news.json")

WINDOW_DAYS = 60      # 只保留近幾天的新聞稿
MAX_ITEMS = 25        # 最多保留幾則
MAX_PAGES = 3         # 最多翻幾頁清單
EXCERPT_LEN = 220     # 卡片摘要長度
REQ_PAUSE = 0.6       # 禮貌性間隔
TRIES = 4

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9",
}


def fetch(url: str) -> str:
    """取回頁面；失敗時指數退避重試。"""
    last = None
    for i in range(TRIES):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "ignore")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last = e
            if i < TRIES - 1:
                wait = 3 * (i + 1)
                print(f"   取得失敗（{e}），{wait}s 後重試…")
                time.sleep(wait)
    raise RuntimeError(f"{url} 取得失敗：{last}")


def parse_list(page_html: str) -> list[dict]:
    items = []
    for href, inner in re.findall(
        r'<a[^>]+href="(/Bulletin/Detail/[^"]+)"[^>]*>(.*?)</a>', page_html, re.S
    ):
        txt = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", inner))).strip()
        # 清單項目開頭為「2026 - 10 21 標題…」
        m = re.match(r"(\d{4})\s*-\s*(\d{1,2})\s+(\d{1,2})\s+(.*)$", txt)
        if not m:
            continue
        y, mo, d, title = m.groups()
        title = title.strip()
        if not title:
            continue
        items.append({
            "date": f"{y}-{int(mo):02d}-{int(d):02d}",
            "title": title,
            "url": BASE + href,
        })
    return items


def parse_body(detail_html: str) -> str:
    """內文位於「發佈日期：」之後的區塊，段落以 <br> 分隔。"""
    m = re.search(
        r"發佈日期：\s*\d{4}-\d{2}-\d{2}\s*</div>(.*?)(?:<div class=\"clearfix\"|<hr|<div class=\"page|$)",
        detail_html,
        re.S,
    )
    if not m:
        return ""
    raw = re.sub(r"<script.*?</script>|<style.*?</style>", "", m.group(1), flags=re.S)
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)
    txt = html.unescape(re.sub(r"<[^>]+>", " ", raw))
    txt = re.sub(r"[ \t　]+", " ", txt)
    txt = re.sub(r"\n\s*\n+", "\n", txt).strip()
    return txt


def main() -> int:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=WINDOW_DAYS)).strftime("%Y-%m-%d")

    collected: list[dict] = []
    seen: set[str] = set()
    try:
        for page in range(1, MAX_PAGES + 1):
            url = LIST_URL if page == 1 else f"{LIST_URL}?page={page}"
            print(f"📰 清單第 {page} 頁…")
            items = parse_list(fetch(url))
            if not items:
                break
            fresh = [i for i in items if i["url"] not in seen]
            for i in fresh:
                seen.add(i["url"])
            collected.extend(fresh)
            # 整頁都比保留區間舊就不用再往下翻
            if all(i["date"] < cutoff for i in items):
                break
            time.sleep(REQ_PAUSE)
    except RuntimeError as e:
        print(f"⚠️  清單取得失敗：{e}")
        if OUT.exists():
            print("   保留既有 cdc_news.json，不覆寫。")
            return 0
        return 1

    recent = [i for i in collected if i["date"] >= cutoff][:MAX_ITEMS]
    print(f"✅ 清單共 {len(collected)} 則，近 {WINDOW_DAYS} 天保留 {len(recent)} 則")

    out_items = []
    for i, it in enumerate(recent, 1):
        try:
            body = parse_body(fetch(it["url"]))
        except RuntimeError as e:
            print(f"   [{i}/{len(recent)}] 內文取得失敗，僅保留標題：{e}")
            body = ""
        excerpt = body[:EXCERPT_LEN].replace("\n", " ").strip()
        if body and len(body) > EXCERPT_LEN:
            excerpt += "…"
        out_items.append({
            "title": it["title"],
            "date": it["date"],
            "sortDate": it["date"],
            "url": it["url"],
            "excerpt": excerpt,
            "body": body,
        })
        print(f"   [{i}/{len(recent)}] {it['title'][:40]}（內文 {len(body)} 字）")
        time.sleep(REQ_PAUSE)

    if not out_items:
        print("⚠️  沒有可寫入的項目，保留既有檔案。")
        return 0

    out_items.sort(key=lambda x: x["sortDate"], reverse=True)
    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "windowDays": WINDOW_DAYS,
        "source": "衛生福利部疾病管制署 新聞稿",
        "sourceUrl": LIST_URL,
        "count": len(out_items),
        "items": out_items,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 共 {len(out_items)} 則 → {OUT}（{OUT.stat().st_size // 1024} KB）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
