#!/usr/bin/env python3
"""抓取頂尖期刊近期文章 → public/data/journals.json

來源：PubMed E-utilities（免金鑰，只用標準庫）。
只保留研究/回顧型文章：擋掉社論/信件/新聞/詩等，並要求有夠長摘要。
僅取公開的標題與 abstract，連結回 PubMed 原文。
"""

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# (分類, PubMed 期刊縮寫[用於查詢], 顯示名稱)
JOURNALS = [
    ("四大綜合", "N Engl J Med", "NEJM"),
    ("四大綜合", "Lancet", "Lancet"),
    ("四大綜合", "JAMA", "JAMA"),
    ("四大綜合", "Ann Intern Med", "Ann Intern Med"),
    ("家醫科", "Ann Fam Med", "Ann Fam Med"),
    ("家醫科", "Am Fam Physician", "Am Fam Physician"),
    ("家醫科", "J Am Board Fam Med", "JABFM"),
    ("家醫科", "Br J Gen Pract", "BJGP"),
]

RELDATE = 30          # 近幾天
RETMAX = 30           # 每本最多撈幾筆（過濾前）
MIN_ABSTRACT = 500    # 無強類型標記時，摘要至少這麼長才算研究文
REQ_PAUSE = 0.4       # 尊重 PubMed 速率限制（無金鑰 3 req/s）
TR_PAUSE = 0.8        # 翻譯端點之間的間隔，避免被限流
TR_MAXLEN = 4000      # gtx 單次請求字數上限，超過就切句翻

# 摘要結構標籤的本地對照（免翻譯、穩定）
LABEL_MAP = {
    "BACKGROUND": "背景", "CONTEXT": "背景", "IMPORTANCE": "重要性",
    "OBJECTIVE": "目的", "OBJECTIVES": "目的", "AIM": "目的", "AIMS": "目的",
    "PURPOSE": "目的", "METHODS": "方法", "METHOD": "方法",
    "MATERIALS AND METHODS": "材料與方法", "DESIGN": "設計",
    "SETTING": "場域", "SETTINGS": "場域", "PARTICIPANTS": "受試者",
    "PATIENTS": "病人", "INTERVENTION": "介入", "INTERVENTIONS": "介入",
    "EXPOSURES": "暴露因子", "MAIN OUTCOMES AND MEASURES": "主要結果與測量",
    "OUTCOMES": "結果指標", "MEASUREMENTS": "測量",
    "RESULTS": "結果", "FINDINGS": "發現",
    "CONCLUSION": "結論", "CONCLUSIONS": "結論",
    "CONCLUSIONS AND RELEVANCE": "結論與意義", "INTERPRETATION": "詮釋",
    "FUNDING": "經費來源", "TRIAL REGISTRATION": "試驗註冊",
    "REGISTRATION": "註冊",
}

# 擋掉的類型（社論/信件/評論/新聞/訃聞/詩/更正…）
DROP = {
    "Editorial", "Letter", "Comment", "News", "Personal Narrative",
    "Biography", "Portrait", "Interview", "Published Erratum",
    "Historical Article", "Congress", "Video-Audio Media",
    "Introductory Journal Article", "Autobiography", "Address", "Obituary",
}
# 直接保留的研究/回顧型
STRONG = {
    "Review", "Systematic Review", "Meta-Analysis",
    "Randomized Controlled Trial", "Clinical Trial", "Clinical Trial, Phase I",
    "Clinical Trial, Phase II", "Clinical Trial, Phase III", "Clinical Trial, Phase IV",
    "Observational Study", "Multicenter Study", "Comparative Study",
    "Evaluation Study", "Validation Study", "Clinical Study",
    "Pragmatic Clinical Trial", "Equivalence Trial", "Controlled Clinical Trial",
}

MONTHS = {m: i for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], start=1)}


def _get(url: str) -> bytes:
    """PubMed 請求，遇暫時性錯誤（5xx / 連線問題）退避重試。"""
    last = None
    for delay in (0, 3, 8, 20):
        if delay:
            time.sleep(delay)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "fmdrlan-journals/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            last = e
            if e.code >= 500 or e.code == 429:
                continue
            raise
        except Exception as e:
            last = e
            continue
    raise last


def esearch(journal: str) -> list[str]:
    q = urllib.parse.urlencode({
        "db": "pubmed", "term": f'"{journal}"[ta]', "retmax": RETMAX,
        "datetype": "pdat", "reldate": RELDATE, "sort": "pub_date", "retmode": "json",
    })
    data = json.loads(_get(f"{EUTILS}/esearch.fcgi?{q}"))
    return data["esearchresult"].get("idlist", [])


def efetch(ids: list[str]) -> ET.Element:
    q = urllib.parse.urlencode({"db": "pubmed", "id": ",".join(ids), "retmode": "xml"})
    return ET.fromstring(_get(f"{EUTILS}/efetch.fcgi?{q}"))


def _text(el) -> str:
    return "".join(el.itertext()).strip() if el is not None else ""


def parse_date(art: ET.Element) -> tuple[str, str]:
    """回傳 (顯示字串, 排序鍵 YYYY-MM-DD)。"""
    pub = art.find(".//Article/Journal/JournalIssue/PubDate")
    if pub is None:
        return "", "0000-00-00"
    year = _text(pub.find("Year"))
    if not year:
        medline = _text(pub.find("MedlineDate"))   # 如 "2026 Jun-Jul"
        if medline:
            parts = medline.split()
            year = parts[0] if parts else ""
            mon = MONTHS.get(parts[1][:3], 0) if len(parts) > 1 else 0
            return medline, f"{year or '0000'}-{mon:02d}-01"
        return "", "0000-00-00"
    mon_raw = _text(pub.find("Month"))
    mon = MONTHS.get(mon_raw[:3], 0) if mon_raw else (int(mon_raw) if mon_raw.isdigit() else 0)
    day = _text(pub.find("Day"))
    day_i = int(day) if day.isdigit() else 0
    disp = " ".join(p for p in [year, mon_raw, day] if p)
    return disp, f"{year}-{mon:02d}-{day_i:02d}"


def parse_authors(art: ET.Element, limit: int = 8) -> str:
    names = []
    for a in art.findall(".//AuthorList/Author"):
        coll = _text(a.find("CollectiveName"))
        if coll:
            names.append(coll)
            continue
        last = _text(a.find("LastName"))
        initials = _text(a.find("Initials"))
        if last:
            names.append(f"{last} {initials}".strip())
    if not names:
        return ""
    if len(names) > limit:
        return ", ".join(names[:limit]) + ", et al."
    return ", ".join(names)


def parse_abstract(art: ET.Element) -> list[dict]:
    out = []
    for ab in art.findall(".//Abstract/AbstractText"):
        txt = _text(ab)
        if not txt:
            continue
        label = ab.get("Label")
        out.append({"label": label, "text": txt} if label else {"text": txt})
    return out


def abstract_len(segs: list[dict]) -> int:
    return sum(len(s["text"]) for s in segs)


def keep(ptypes: list[str], segs: list[dict]) -> bool:
    if any(p in DROP for p in ptypes):
        return False
    if any(p in STRONG for p in ptypes):
        return True
    return abstract_len(segs) >= MIN_ABSTRACT


def doi_of(art: ET.Element) -> str:
    for el in art.findall(".//ArticleIdList/ArticleId"):
        if el.get("IdType") == "doi":
            return (el.text or "").strip()
    for el in art.findall(".//ELocationID"):
        if el.get("EIdType") == "doi":
            return (el.text or "").strip()
    return ""


MYMEMORY = "https://api.mymemory.translated.net/get"
MM_EMAIL = os.environ.get("MYMEMORY_EMAIL", "")  # 提高每日額度（非機密，從環境帶入）


class QuotaExceeded(Exception):
    """MyMemory 當日額度用罄，停止本次後續翻譯（保留快取，下次再補）。"""


def _mymemory(text: str) -> str:
    """呼叫 MyMemory 免金鑰端點翻成繁中。額度用罄丟 QuotaExceeded，其他失敗回空字串。"""
    params = {"q": text, "langpair": "en|zh-TW"}
    if MM_EMAIL:
        params["de"] = MM_EMAIL
    url = f"{MYMEMORY}?{urllib.parse.urlencode(params)}"
    for delay in (0, 5, 12, 25):
        if delay:
            time.sleep(delay)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.load(r)
            status = d.get("responseStatus")
            translated = (d.get("responseData") or {}).get("translatedText") or ""
            detail = str(d.get("responseDetails") or "").upper()
            if status == 200 and translated:
                return translated
            # 真正的每日額度用罄 → 停止本次後續翻譯
            if status == 403 or "USED ALL AVAILABLE" in detail or "DAILY" in detail:
                raise QuotaExceeded(detail or str(status))
            if status == 429 or "LIMIT" in detail:
                continue  # 每秒限流 → 退避重試
            return ""
        except urllib.error.HTTPError as e:
            if e.code in (429,) or e.code >= 500:
                continue  # 限流 / 伺服器暫時錯誤 → 退避重試
            if e.code == 403:
                raise QuotaExceeded(str(e))
            print(f"   ⚠️ 翻譯失敗：{e}")
            return ""
        except QuotaExceeded:
            raise
        except Exception as e:
            print(f"   ⚠️ 翻譯失敗：{e}")
            return ""
    # 多次退避後仍被限流 → 視為額度用罄，停止本次
    raise QuotaExceeded("rate limited after retries")


def translate_block(texts: list[str]) -> list[str]:
    """逐段翻譯（MyMemory 可吃長文，逐段對位最穩）。回傳對應繁中清單，失敗位置為空字串。"""
    out = []
    for t in texts:
        out.append(_mymemory(t))
        time.sleep(TR_PAUSE)
    return out


def label_zh(label):
    if not label:
        return label
    return LABEL_MAP.get(label.upper().strip().rstrip(":"), label)


def load_tr_cache() -> dict[str, str]:
    """從現有 journals.json 建「英文→繁中」文字快取，避免每週重翻重疊的文章。"""
    cache = {}
    p = Path("public/data/journals.json")
    if not p.exists():
        return cache
    try:
        old = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return cache
    for a in old.get("articles", []):
        if a.get("title") and a.get("titleZh"):
            cache[a["title"]] = a["titleZh"]
        for s in a.get("abstract", []):
            if s.get("text") and s.get("textZh"):
                cache[s["text"]] = s["textZh"]
    return cache


def add_translations(articles: list[dict]) -> None:
    """每篇一次（含標題+摘要併批）翻譯；只快取成功結果，失敗者下次重跑會再試。"""
    cache = load_tr_cache()
    reused = new = failed = 0
    quota_hit = False
    print(f"\n翻譯 {len(articles)} 篇（重用既有翻譯，只翻新增）…")

    for a in articles:
        for seg in a["abstract"]:
            seg["labelZh"] = label_zh(seg.get("label"))

        wanted = [a["title"]] + [s["text"] for s in a["abstract"]]
        todo = [t for t in dict.fromkeys(wanted) if t.strip() and t not in cache]
        reused += len(wanted) - len(todo)
        if todo and not quota_hit:
            try:
                for t, zh in zip(todo, translate_block(todo)):
                    if zh:
                        cache[t] = zh
                        new += 1
                    else:
                        failed += 1
            except QuotaExceeded as e:
                quota_hit = True
                print(f"   ⏸ 當日翻譯額度用罄（{e}），其餘保留原文，下次自動補譯")

        a["titleZh"] = cache.get(a["title"], "")
        for seg in a["abstract"]:
            seg["textZh"] = cache.get(seg["text"], "")

    print(f"   翻譯完成：沿用 {reused} 段、新翻 {new} 段、失敗 {failed} 段")
    if failed or quota_hit:
        print("   （未譯段保留原文，重跑本腳本會自動補譯）")


def collect() -> list[dict]:
    articles = []
    seen = set()
    for cat, query, display in JOURNALS:
        print(f"[{cat}] {query} …", end=" ", flush=True)
        try:
            ids = esearch(query)
            time.sleep(REQ_PAUSE)
            if not ids:
                print("無新文章")
                continue
            root = efetch(ids)
            time.sleep(REQ_PAUSE)
        except Exception as e:
            print(f"⚠️ 失敗：{e}")
            continue

        kept = 0
        for art in root.findall(".//PubmedArticle"):
            pmid = _text(art.find(".//PMID"))
            if not pmid or pmid in seen:
                continue
            title = _text(art.find(".//Article/ArticleTitle")).rstrip(".")
            ptypes = [pt.text for pt in art.findall(".//PublicationTypeList/PublicationType")]
            segs = parse_abstract(art)
            if not title or not keep(ptypes, segs):
                continue
            disp_date, sort_date = parse_date(art)
            seen.add(pmid)
            kept += 1
            articles.append({
                "pmid": pmid,
                "title": title,
                "journal": display,
                "category": cat,
                "date": disp_date,
                "sortDate": sort_date,
                "authors": parse_authors(art),
                "abstract": segs,
                "doi": doi_of(art),
                "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
            })
        print(f"留 {kept} 篇")
    articles.sort(key=lambda a: a["sortDate"], reverse=True)
    return articles


def main():
    articles = collect()
    add_translations(articles)
    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "windowDays": RELDATE,
        "journals": [{"category": c, "name": d} for c, _, d in JOURNALS],
        "count": len(articles),
        "articles": articles,
    }
    out = Path("public/data/journals.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 共 {len(articles)} 篇 → {out}（{out.stat().st_size // 1024} KB）")


if __name__ == "__main__":
    main()
