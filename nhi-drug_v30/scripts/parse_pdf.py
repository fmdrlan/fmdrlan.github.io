#!/usr/bin/env python3
"""
解析健保藥品給付規定 PDF → data/drugs.json
改進版：
- 偵測並保留編號層次結構（羅馬數字/阿拉伯數字/括號）
- 偵測附表條目，只保留標題
- 每個條目的 content 拆成 blocks，標記 level 供前端縮排渲染
- 解析完後跟舊 drugs.json diff，產生 data/changelog.json
"""

import sys
import json
import re
import pdfplumber
from pathlib import Path


# ── 附表標題列表（只顯示標題，不顯示內容）──
APPENDIX_PATTERN = re.compile(r'附表[一二三四五六七八九十百零\d]+')

# ── 編號層次正則（由高到低優先）──
LEVEL_PATTERNS = [
    (0, re.compile(r'^(\d+\.\d+(?:\.\d+)*\.?)\s')),           # 1.2.3. 章節編號
    (1, re.compile(r'^[（(]\d+[）)]\s')),                        # (1) 第一層括號
    (2, re.compile(r'^[IVXivx]+\.\s')),                          # I. II. 羅馬數字
    (2, re.compile(r'^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ][\.\s]')),            # 全形羅馬數字
    (3, re.compile(r'^[①②③④⑤⑥⑦⑧⑨⑩]\s')),                  # 圓圈數字
    (3, re.compile(r'^[ａ-ｚa-z]\.\s')),                        # a. b. 字母
    (1, re.compile(r'^\d+\.\s')),                                # 1. 2. 純數字點
    (2, re.compile(r'^[（(][一二三四五六七八九十][）)]\s')),      # (一) 中文括號
    (2, re.compile(r'^[一二三四五六七八九十][、\.]\s')),           # 一、 中文序號
    (3, re.compile(r'^[（(][IVXivx]+[）)]\s')),                  # (I) 括號羅馬
    (4, re.compile(r'^[①-⑳]\s')),                              # 其他圓圈
]


def detect_level(line: str) -> int:
    """偵測行的縮排層次，回傳 0-4，-1 表示普通文字"""
    stripped = line.strip()
    for level, pat in LEVEL_PATTERNS:
        if pat.match(stripped):
            return level
    return -1


def parse_content_to_blocks(content: str) -> list[dict]:
    """將純文字 content 解析成帶層次的 blocks"""
    blocks = []
    lines = content.split('\n')
    current_text = []
    current_level = -1

    def flush():
        nonlocal current_text, current_level
        if current_text:
            text = ' '.join(l.strip() for l in current_text if l.strip())
            if text:
                blocks.append({'type': 'text', 'level': max(0, current_level), 'text': text})
        current_text = []
        current_level = -1

    for line in lines:
        if not line.strip():
            flush()
            continue
        level = detect_level(line)
        if level == -1:
            # 連接到上一行
            current_text.append(line)
        else:
            if current_level != -1 and level != current_level:
                flush()
            current_level = level
            current_text.append(line)

    flush()
    return blocks


def parse_drug_sections(pdf_path: str) -> list[dict]:
    print(f"📖 讀取 PDF：{pdf_path}")
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        for i, page in enumerate(pdf.pages):
            t = page.extract_text()
            if t:
                full_text += t + "\n"
            if (i + 1) % 50 == 0:
                print(f"  已讀取 {i+1}/{total} 頁...")

    print(f"✅ 共讀取 {total} 頁，開始解析...")

    # 清理頁首頁尾和換頁符號
    full_text = re.sub(r'\(\d{3}\.\d+\.\d+更新\)', '', full_text)
    full_text = re.sub(r'\f', '\n', full_text)
    # 清理 PDF cid 亂碼
    full_text = re.sub(r'\(cid:\d+\)', '', full_text)

    # 切割條目：形如 "1.2.3.藥名" 或 "1.2.3 藥名"
    pattern = re.compile(
        r'^(\d+\.\d+(?:\.\d+)?\.?\s{0,3}[A-Za-z\u4e00-\u9fff\(（][^\n]{2,120})$',
        re.MULTILINE
    )

    entries = []
    matches = list(pattern.finditer(full_text))

    for i, m in enumerate(matches):
        title = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        body = full_text[start:end].strip()

        if len(body) < 5:
            continue

        # 抽出英文藥名
        drug_names = re.findall(
            r'\b[A-Z][a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,}){0,2}\b',
            title + ' ' + body[:500]
        )
        drug_names = list(dict.fromkeys(drug_names))[:8]

        # 章節編號
        section_match = re.match(r'^(\d+\.\d+)', title)
        section = section_match.group(1) if section_match else ''

        # 附表判斷：標題含「附表」→ 只保留標題，內容替換為提示
        is_appendix = bool(APPENDIX_PATTERN.search(title) or APPENDIX_PATTERN.search(body[:100]))
        if is_appendix:
            blocks = [{'type': 'appendix', 'level': 0,
                       'text': '本項涉及複雜附表，請至健保署官方網站查閱完整規定。'}]
            content_text = body[:100]
        else:
            # Truncate at appendix bleed-through point
            bleed = re.search(
                r'附表[一二三四五六七八九十百\d]+-?[A-Z]?\s*全民|'
                r'附表[一二三四五六七八九十百\d]+之[一二三四五六七八九十百\d]\s',
                body
            )
            if bleed and bleed.start() > 50:
                body = body[:bleed.start()].rstrip()
            blocks = parse_content_to_blocks(body[:4000])
            content_text = body[:4000]

        entries.append({
            "id": i,
            "title": title,
            "drug_names": drug_names,
            "section": section,
            "content": content_text,
            "blocks": blocks,
            "is_appendix": is_appendix,
        })

    return entries


# ── 標題標準化：用來做 diff 的 key ─────────────────
def normalize_title_key(title: str) -> str:
    """把標題的章節號 + 主名稱抽出來當 diff 用的 key
    例：'1.1.1.非類固醇抗發炎劑外用製劑：(88/9/1、92/2/1)' → '1.1.1.非類固醇抗發炎劑外用製劑'
    """
    # 移除括號內的日期版本標記（含中英括號、含中英逗號分隔的多日期）
    t = re.sub(r'[（(][\d、,/.\s]+[）)]\s*$', '', title).strip()
    # 移除尾端冒號
    t = t.rstrip('：:').strip()
    return t


def normalize_content(text: str) -> str:
    """正規化內容文字以便比對：合併空白、去掉版本標記"""
    if not text:
        return ''
    t = re.sub(r'[（(]\d{2,3}[\.、/]\d{1,2}[\.、/]\d{1,2}[）)]', '', text)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()


def diff_drugs(old: list[dict], new: list[dict]) -> dict:
    """比對新舊 drugs.json，回傳 changelog dict"""
    old_map = {normalize_title_key(d['title']): d for d in old}
    new_map = {normalize_title_key(d['title']): d for d in new}

    added = []
    removed = []
    modified = []

    for k, d in new_map.items():
        if k not in old_map:
            added.append(d['title'])
        else:
            # 內容有實質改變才算 modified（忽略空白與版本日期差異）
            old_norm = normalize_content(old_map[k].get('content', ''))
            new_norm = normalize_content(d.get('content', ''))
            if old_norm != new_norm:
                modified.append(d['title'])

    for k, d in old_map.items():
        if k not in new_map:
            removed.append(d['title'])

    return {
        'added': added,
        'modified': modified,
        'removed': removed,
    }


def write_changelog(new_entries: list[dict], from_version: str = None, to_version: str = None):
    """讀取舊 drugs.json、跟新的 diff、寫入 data/changelog.json"""
    old_path = Path('data/drugs.json')
    if not old_path.exists():
        print("ℹ️  找不到舊 drugs.json，跳過 changelog 產生（首次解析）")
        # 首次解析也寫一個空 changelog，避免前端 fetch 失敗
        empty = {
            'added': [], 'modified': [], 'removed': [],
            'from_version': from_version, 'to_version': to_version,
            'note': '首次建置，無歷史資料可比對'
        }
        out = Path('data/changelog.json')
        out.parent.mkdir(exist_ok=True)
        with open(out, 'w', encoding='utf-8') as f:
            json.dump(empty, f, ensure_ascii=False, indent=2)
        return

    try:
        with open(old_path, encoding='utf-8') as f:
            old_entries = json.load(f)
    except Exception as e:
        print(f"⚠️  讀取舊 drugs.json 失敗：{e}，跳過 changelog 產生")
        return

    diff = diff_drugs(old_entries, new_entries)
    diff['from_version'] = from_version
    diff['to_version'] = to_version

    out = Path('data/changelog.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(diff, f, ensure_ascii=False, indent=2)

    print(f"📊 Changelog：新增 {len(diff['added'])} / 修改 {len(diff['modified'])} / 刪除 {len(diff['removed'])}")
    print(f"💾 已儲存：{out}")


def main():
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdfs = sorted(Path('.').glob('*.pdf')) + sorted(Path('data').glob('*.pdf'))
        if not pdfs:
            print("❌ 找不到 PDF 檔案")
            sys.exit(1)
        pdf_path = str(pdfs[-1])
        print(f"自動選擇：{pdf_path}")

    # 從檔名抽出新版本日期（如 完整給付規定1150323.pdf → 1150323）
    new_version = None
    m = re.search(r'(\d{7})', Path(pdf_path).name)
    if m:
        new_version = m.group(1)

    # 從 last_version.txt 讀舊版本
    from_version = None
    ver_file = Path('data/last_version.txt')
    if ver_file.exists():
        from_version = ver_file.read_text(encoding='utf-8').strip() or None

    entries = parse_drug_sections(pdf_path)
    print(f"✅ 解析完成，共 {len(entries)} 個條目")

    # ── 在覆蓋 drugs.json 之前，先 diff 出 changelog ──
    write_changelog(entries, from_version=from_version, to_version=new_version)

    out = Path('data/drugs.json')
    out.parent.mkdir(exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"💾 已儲存：{out}（{out.stat().st_size // 1024} KB）")


if __name__ == '__main__':
    main()
