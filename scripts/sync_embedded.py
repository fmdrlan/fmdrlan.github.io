#!/usr/bin/env python3
"""
把 data/lab_dict.json 跟 data/dx_rules.json 同步到 lab.html 內嵌的 JSON。

用途：當你改了 data/*.json 之後跑這個腳本，lab.html 內嵌會自動更新，
否則網頁實際讀的是 lab.html 內的舊版字典，data/*.json 改了沒效果。

用法：
    python3 scripts/sync_embedded.py
"""
import re
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
LAB_HTML = ROOT / 'public' / 'lab.html'
LAB_DICT_JSON = ROOT / 'public' / 'data' / 'lab_dict.json'
DX_RULES_JSON = ROOT / 'public' / 'data' / 'dx_rules.json'

def sync():
    if not LAB_HTML.exists():
        print(f'❌ {LAB_HTML} not found')
        return 1
    html = LAB_HTML.read_text(encoding='utf-8')
    new_lab = LAB_DICT_JSON.read_text(encoding='utf-8').strip()
    new_dx = DX_RULES_JSON.read_text(encoding='utf-8').strip()

    # 替換 lab-dict-data
    lab_pat = r'(<script id="lab-dict-data" type="application/json">\s*)(.*?)(\s*</script>)'
    html, n1 = re.subn(lab_pat,
        lambda m: m.group(1) + new_lab + m.group(3),
        html, count=1, flags=re.DOTALL)
    if n1 == 0:
        print('❌ <script id="lab-dict-data"> not found in lab.html')
        return 1

    # 替換 dx-rules-data
    dx_pat = r'(<script id="dx-rules-data" type="application/json">\s*)(.*?)(\s*</script>)'
    html, n2 = re.subn(dx_pat,
        lambda m: m.group(1) + new_dx + m.group(3),
        html, count=1, flags=re.DOTALL)
    if n2 == 0:
        print('❌ <script id="dx-rules-data"> not found in lab.html')
        return 1

    LAB_HTML.write_text(html, encoding='utf-8')

    # 驗證
    lab_data = json.loads(new_lab)
    dx_data = json.loads(new_dx)
    print(f'✓ lab.html updated')
    print(f'  lab_dict: {len(lab_data["items"])} items')
    print(f'  dx_rules: {len(dx_data["rules"])} rules')
    return 0

if __name__ == '__main__':
    sys.exit(sync())
