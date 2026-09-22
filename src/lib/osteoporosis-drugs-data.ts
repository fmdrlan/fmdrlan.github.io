// Faithful port of the 骨質疏鬆藥物比較表 data from the source osteoporosis.html.
// Cell content keeps its original inline HTML (<b>, <br>, <span class="...">,
// <div class="alt">, <table class="mini">…) and is rendered via
// dangerouslySetInnerHTML in DrugCompareTab — the markup is fully static,
// authored by the clinician, not user input.

export type DrugSource = 'ncku' | 'lit' | 'todo'

export interface DrugCell {
  v: string
  s: DrugSource
}

export type CompareMode = 'anti' | 'ana'

export interface CompareDrug {
  id: string
  g: string // 學名
  zh: string // 中文商品名
  b: string // 英文商品名
  mode: CompareMode
  chip: string
}

export type CompareCell = DrugCell | string

export type CompareRow =
  | { kind: 'group'; label: string }
  | { kind: 'row'; label: string; key?: boolean; cells: Partial<Record<string, CompareCell>> }

// 來源標記：n() = 成大藥品基本檔；純字串 = 仿單／指引／原始比較表
const n = (v: string): DrugCell => ({ v, s: 'ncku' })

export const COMPARE_DRUGS: CompareDrug[] = [
  { id: 'alen', g: 'Alendronate + D₃', zh: '福善美保骨', b: 'Fosamax Plus', mode: 'anti', chip: '口服 每週・複方' },
  { id: 'rise', g: 'Risedronate', zh: '瑞骨卓', b: 'Reosteo', mode: 'anti', chip: '口服 每月' },
  { id: 'zole', g: 'Zoledronic acid', zh: '骨力強', b: 'Aclasta', mode: 'anti', chip: '靜脈 每年' },
  { id: 'ralo', g: 'Raloxifene', zh: '鈣穩', b: 'Evista', mode: 'anti', chip: '口服 每日' },
  { id: 'deno', g: 'Denosumab', zh: '保骼麗', b: 'Prolia', mode: 'anti', chip: '皮下 每半年' },
  { id: 'teri', g: 'Teriparatide', zh: '骨穩／艾歐骨得', b: 'Forteo・Alvosteo', mode: 'ana', chip: '皮下 每日・院內 2 品項' },
  { id: 'romo', g: 'Romosozumab', zh: '益穩挺', b: 'Evenity', mode: 'ana', chip: '皮下 每月・雙重作用' },
]

export const COMPARE_ROWS: CompareRow[] = [
  /* ---------- 1. 院內品項 ---------- */
  { kind: 'group', label: '院內品項辨識' },
  {
    kind: 'row', label: '品名', key: true, cells: {
      alen: n('Fosamax Plus 70 mg/5600 IU/tab<br>福善美保骨錠（4 錠／片）・俗名 PlusDmax<br><span class="na">alendronate 併 vitamin D₃ 複方</span>'),
      rise: n('Risedronate 150 mg/tab（Reosteo）<br>瑞骨卓（1 錠／片、1 錠／盒）'),
      zole: n('Zoledronic Acid inj 5 mg/100 mL/btl（Aclasta）<br>骨力強注射液'),
      ralo: n('Raloxifene 60 mg/tab（Evista）<br>鈣穩錠（14 錠／片）'),
      deno: n('Denosumab inj 60 mg/1 mL/syrg（Prolia）<br>保骼麗注射液'),
      teri: n('<b>Forteo</b> 28 dose/2.4 mL/pen（骨穩注射液）<div class="alt"><b>Alvosteo</b> 28 dose/2.4 mL/vial（艾歐骨得注射液）</div>'),
      romo: n('Romosozumab inj 105 mg/1.17 mL/syrg（Evenity）<br>益穩挺（2 支／盒）'),
    },
  },
  {
    kind: 'row', label: '健保碼', cells: {
      alen: n('BC26136100'),
      rise: n('BC27022100'),
      zole: n('BC24692255'),
      ralo: n('BB24023100'),
      deno: n('KC00918209'),
      teri: n('Forteo KC00787216<div class="alt">Alvosteo KC01151213</div>'),
      romo: n('KC011372BN'),
    },
  },
  {
    kind: 'row', label: '廠牌／產地', cells: {
      alen: n('ROVI Pharma Industrial Services／西班牙'),
      rise: n('Pharmascience Inc.／加拿大'),
      zole: n('Corden Pharma S.p.A.／義大利'),
      ralo: n('Bushu Pharmaceuticals（川越廠）／日本'),
      deno: n('Amgen Manufacturing Limited LLC／波多黎各'),
      teri: n('Forteo：Lilly France（禮來）／法國<div class="alt">Alvosteo：Gedeon Richter／匈牙利</div>'),
      romo: n('Patheon Italia SpA／義大利'),
    },
  },
  {
    kind: 'row', label: '健保價／自費價', cells: {
      alen: n('107 ／ 128.4 元（每錠）'),
      rise: n('533 ／ 639.6 元（每錠）'),
      zole: n('8,995 ／ 10,794 元（每瓶）'),
      ralo: n('28.5 ／ 34.2 元（每錠）'),
      deno: n('4,321 ／ 5,185.2 元（每支）'),
      teri: n('Forteo 11,681 ／ 14,017.2 元<div class="alt">Alvosteo 8,471 ／ 10,165.2 元</div>'),
      romo: n('3,900 ／ 4,680 元（每支，每月 2 支）'),
    },
  },
  {
    kind: 'row', label: '約當藥費<br><span class="na">依自費價換算</span>', key: true, cells: {
      alen: n('每錠 128.4 元，每週 1 錠 ≒ <b>每日 18.3 元</b>'),
      rise: n('每錠 639.6 元，每月 1 錠 ≒ <b>每日 21.0 元</b>'),
      zole: n('每瓶 10,794 元，每年 1 次 ≒ <b>每日 29.6 元</b>'),
      ralo: n('每錠 34.2 元，每日 1 錠 ＝ <b>每日 34.2 元</b>'),
      deno: n('每支 5,185.2 元，每半年 1 支 ≒ <b>每日 28.4 元</b>'),
      teri: n('Forteo 每支 14,017.2 元（28 劑）≒ <b>每日 501 元</b>；18 支療程 252,310 元<div class="alt">Alvosteo 每支 10,165.2 元 ≒ <b>每日 363 元</b>；18 支療程 182,974 元</div><span class="flag">同成分改用 Alvosteo，全療程差約 6.9 萬元</span>'),
      romo: n('每支 4,680 元，每月 2 支 ＝ 9,360 元／月 ≒ <b>每日 308 元</b>；12 個月療程 112,320 元'),
    },
  },

  /* ---------- 2. 分類與機轉 ---------- */
  { kind: 'group', label: '分類與作用機轉' },
  {
    kind: 'row', label: '藥物類別', key: true, cells: {
      alen: '雙磷酸鹽（含氮）＋ 維生素 D₃ 複方',
      rise: '雙磷酸鹽（含氮）',
      zole: '雙磷酸鹽（含氮）',
      ralo: '選擇性雌激素受體調節劑（SERM）',
      deno: '抗 RANKL 單株抗體',
      teri: '副甲狀腺素衍生物（PTH 1-34）',
      romo: '抗 sclerostin 單株抗體',
    },
  },
  {
    kind: 'row', label: '機轉細節', cells: {
      alen: '結合骨表面 hydroxyapatite，抑制 farnesyl pyrophosphate synthase，誘導蝕骨細胞凋亡',
      rise: '同左，骨親和力較 alendronate 低，停藥後作用消退較快',
      zole: '同左，骨親和力最高，單次輸注作用可維持約一年',
      ralo: '骨骼中呈雌激素致效、乳房與子宮內膜呈拮抗',
      deno: '中和 RANKL，阻斷蝕骨細胞分化與存活；非骨結合藥物，作用可逆',
      teri: '間歇給藥刺激造骨細胞活性，骨形成先於骨吸收上升（anabolic window）',
      romo: '阻斷 sclerostin 解除 Wnt 路徑抑制，同時提升骨形成、抑制骨吸收',
    },
  },
  {
    kind: 'row', label: '作用方式', key: true, cells: {
      alen: '減少骨流失', rise: '減少骨流失', zole: '減少骨流失',
      ralo: '減少骨流失', deno: '減少骨流失',
      teri: '增加骨生成',
      romo: '增加骨生成 ＋ 減少骨流失',
    },
  },
  {
    kind: 'row', label: 'FDA 核准適應症', key: true, cells: {
      alen: '<table class="mini"><tr><th>停經後・預防</th><td class="y">✓</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="y">✓</td></tr><tr><th>男性骨鬆</th><td class="y">✓</td></tr></table>',
      rise: '<table class="mini"><tr><th>停經後・預防</th><td class="y">✓</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="y">✓</td></tr><tr><th>類固醇性・治療</th><td class="y">✓</td></tr><tr><th>男性骨鬆</th><td class="y">✓</td></tr></table><span class="na">五項全涵蓋</span>',
      zole: '<table class="mini"><tr><th>停經後・預防</th><td class="y">✓</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="y">✓</td></tr><tr><th>男性骨鬆</th><td class="y">✓</td></tr></table>',
      ralo: '<table class="mini"><tr><th>停經後・預防</th><td class="y">✓</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="n">—</td></tr><tr><th>男性骨鬆</th><td class="n">—</td></tr></table>',
      deno: '<table class="mini"><tr><th>停經後・預防</th><td class="n">—</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="y">✓</td></tr><tr><th>男性骨鬆</th><td class="y">✓</td></tr></table>',
      teri: '<table class="mini"><tr><th>停經後・預防</th><td class="n">—</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="y">✓</td></tr><tr><th>男性骨鬆</th><td class="y">✓</td></tr></table>',
      romo: '<table class="mini"><tr><th>停經後・預防</th><td class="n">—</td></tr><tr><th>停經後・治療</th><td class="y">✓</td></tr><tr><th>類固醇性・預防</th><td class="n">—</td></tr><tr><th>類固醇性・治療</th><td class="n">—</td></tr><tr><th>男性骨鬆</th><td class="n">—</td></tr></table><span class="na">治療限高骨折風險；美國未核准男性，日本已核准</span>',
    },
  },
  {
    kind: 'row', label: '骨轉換標記<br><span class="na">P1NP／CTX</span>', key: true, cells: {
      alen: '<span class="arr dn">↓↓</span>下降（骨形成與骨吸收標記同步受抑）',
      rise: '<span class="arr dn">↓↓</span>下降；骨親和力較低，停藥後回升較 alendronate 快',
      zole: '<span class="arr dn">↓↓↓</span>下降幅度最大；單次輸注後抑制可維持約一年',
      ralo: '<span class="arr dn">↓</span>下降，但幅度明顯小於雙磷酸鹽',
      deno: '<span class="arr dn">↓↓↓</span>抑制最深且最快；<b>停藥後出現反彈性上升</b>，可短暫超過治療前水準，這正是停藥反彈的機轉',
      teri: '<span class="arr up">↑↑</span>上升（骨形成標記先升，骨吸收隨後跟上，形成 anabolic window）',
      romo: '<b>Mixed</b>：P1NP 快速上升、約 9 個月回到基線，CTX 同時下降。這組反向變化是同時促骨生成與抑制骨吸收的特徵，也解釋了為何療程固定 12 個月',
    },
  },

  /* ---------- 3. 用法 ---------- */
  { kind: 'group', label: '用法與給藥' },
  {
    kind: 'row', label: '給藥途徑', key: true, cells: {
      alen: n('口服'), rise: n('口服'), zole: n('靜脈滴注'), ralo: n('口服'),
      deno: n('皮下注射'), teri: n('皮下注射'), romo: n('皮下注射'),
    },
  },
  {
    kind: 'row', label: '頻次與劑量', key: true, cells: {
      alen: n('1 錠每週一次（QWAC），於當日第一份食物、飲料或其他藥物前 30 分鐘服用'),
      rise: n('150 mg 每月一次，第一餐前至少 30 分鐘。每月最多 1 錠'),
      zole: n('5 mg 每 12 個月一次靜脈滴注（Paget 氏病為單次 5 mg）'),
      ralo: n('1 錠每日一次，每日上限 60 mg'),
      deno: n('60 mg 每 6 個月一次'),
      teri: n('20 mcg 每日一次（兩品項相同）'),
      romo: n('210 mg（＝2 支）每月一次'),
    },
  },
  {
    kind: 'row', label: '給藥要點', cells: {
      alen: n('早上飯前 30 分鐘空腹，配 200–300 mL 白開水整粒吞服，不可咬碎或磨粉。服後 30 分鐘保持站立或坐直、不可躺下，也不可睡前或未起床時服用。礦泉水、其他飲料、食物、鈣片與制酸劑都會降低吸收，其他口服藥至少間隔 30 分鐘。維持口腔清潔並定期牙科檢查，拔牙或植牙前主動告知牙醫正在使用雙磷酸鹽<span class="flag">不宜剝半，易引起口咽潰瘍</span>'),
      rise: n('第一餐飯前 30 分鐘空腹，配 200–250 mL 白開水整粒吞服，不可咬碎或磨粉。服後 30 分鐘保持站立或坐直、不可躺下。因為是每月一次，請病人記錄服藥日期以免漏服。維持口腔清潔並定期牙科檢查，拔牙或植牙前主動告知牙醫<span class="flag">不建議磨粉，易刺激黏膜或灼傷食道</span>'),
      zole: n('輸注時間 ≥ 15 分鐘；不可與含鈣溶液或其他靜脈注射藥物混合使用。輸注前後補足水分可降低急性期反應'),
      ralo: n('可與食物併服，不受用餐影響。不建議合併使用全身性作用的荷爾蒙補充療法。即將長期不活動（手術、臥床、長途旅行）前應至少停藥 72 小時，以避免血栓栓塞風險'),
      deno: n('皮下注射於上臂、大腿或腹部。注射前勿將綠色安全保護裝置向前滑動超過針頭，否則會鎖住而阻礙注射。給藥前確認血鈣正常<div class="alt"><span class="na">仿單：所有病人每日應補充至少 1000 mg 鈣與至少 400 IU 維生素 D。漏打一劑應儘快補打，之後從最後一次注射日期重排每 6 個月</span></div>'),
      teri: n('注射時不須排空氣體。若出現頭暈或心悸，應坐下或躺下至症狀緩解'),
      romo: n('大腿、腹部（避開肚臍周圍 2 吋）、上臂外側皮下注射；每次更換部位，避開觸痛、瘀青、硬塊、疤痕與妊娠紋。回溫 ≥ 30 分鐘後再打以減少不適。避免用力震搖'),
    },
  },
  {
    kind: 'row', label: '儲存條件', cells: {
      alen: n('室溫 ≦30 °C，避光存放'),
      rise: n('室溫 ≦25 °C'),
      zole: n('低於 25 °C 儲存'),
      ralo: n('20–25 °C 儲存'),
      deno: n('冷藏 2–8 °C，勿冷凍或振搖；25 °C 以下可存放 30 天<span class="flag">廠商資料：避光 ≦30 °C 安定性達 30 天；離開冷藏後再回冷藏者無資料（非仿單，僅供異常事件參考）</span>'),
      teri: n('冷藏 2–8 °C，原包裝避光存放，要用時再拆包裝'),
      romo: n('冷藏 2–8 °C，不可冷凍，原包裝避光，用時再拆。室溫（&lt;25 °C）避光可放 30 天<span class="flag">未避光僅可存放 8 小時（廠商回覆，非仿單）</span>'),
    },
  },

  /* ---------- 4. 療效 ---------- */
  { kind: 'group', label: '療效數據（試驗間不可直接比較）' },
  {
    kind: 'row', label: 'BMD 反應・相對強度<br><span class="na">脊椎／髖部</span>', key: true, cells: {
      alen: '脊椎 <span class="arr up">↑↑↑</span>　髖部 <span class="arr up">↑↑</span>',
      rise: '脊椎 <span class="arr up">↑↑↑</span>　髖部 <span class="arr up">↑↑</span>',
      zole: '脊椎 <span class="arr up">↑↑↑</span>　髖部 <span class="arr up">↑↑</span>',
      ralo: '脊椎 <span class="arr up">↑</span>　髖部 <span class="arr up">(↑)</span><span class="na">　反應最弱</span>',
      deno: '脊椎 <span class="arr up">↑↑↑</span>　髖部 <span class="arr up">↑↑</span>',
      teri: '脊椎 <span class="arr up">↑↑↑↑</span>　髖部 <span class="arr up">↑</span><span class="na">　脊椎強、髖部弱</span>',
      romo: '脊椎 <span class="arr up">↑↑↑↑</span>　髖部 <span class="arr up">↑↑</span><span class="na">　兩處都強</span>',
    },
  },
  {
    kind: 'row', label: 'BMD 增加・脊椎', cells: {
      alen: '<span class="num">8.8%</span>（3 年）',
      rise: '<span class="num">6.6%</span>（3 年）',
      zole: '<span class="num">6.7%</span>（3 年）',
      ralo: '<span class="num">2–3%</span>（3 年，脊椎與髖部）<span class="na">增幅為各藥中最小</span>',
      deno: '<span class="num">8.8%</span>（3 年）；<span class="num">21.7%</span>（10 年）',
      teri: '<span class="num">9.7%</span>（19 個月）',
      romo: '<span class="num">12.7%</span>（12 個月）',
    },
  },
  {
    kind: 'row', label: 'BMD 增加・髖部', cells: {
      alen: '<span class="num">2.7%</span>（1 年）',
      rise: '<span class="num">0.9%</span>（1 年）',
      zole: '<span class="num">6%</span>（3 年）',
      ralo: '<span class="num">2–3%</span>（3 年）',
      deno: '<span class="num">6.4%</span>（3 年）；<span class="num">9.2%</span>（10 年）',
      teri: '<span class="num">2.6%</span>（19 個月）',
      romo: '<span class="num">5.8%</span>（12 個月）',
    },
  },
  {
    kind: 'row', label: '椎體骨折下降', key: true, cells: {
      alen: '<span class="num">48%</span>（3 年）',
      rise: '<span class="num">49%</span>（3 年）',
      zole: '<span class="num">70%</span>（3 年）',
      ralo: '<span class="num">30–55%</span>（3 年）',
      deno: '<span class="num">68%</span>（3 年）',
      teri: '<span class="num">65%</span>（19 個月）',
      romo: '<span class="num">73%</span>（12 個月）',
    },
  },
  {
    kind: 'row', label: '髖部骨折下降', key: true, cells: {
      alen: '<span class="num">51%</span>（3 年）',
      rise: '<span class="num">30%</span>（3 年）',
      zole: '<span class="num">41%</span>（3 年）',
      ralo: '<span class="na">無實證</span>',
      deno: '<span class="num">40%</span>（3 年）',
      teri: '<span class="num">56%</span>（18–24 個月）<span class="na">＊原表引用之整合分析，主要終點為非椎體骨折</span>',
      romo: '<span class="num">40%</span>（12 個月）',
    },
  },

  /* ---------- 5. 安全性 ---------- */
  { kind: 'group', label: '安全性與禁忌' },
  {
    kind: 'row', label: '誰不適合使用', key: true, cells: {
      alen: '低血鈣；食道狹窄或食道排空異常；無法坐立 30 分鐘；重度腎功能不全',
      rise: '低血鈣；食道狹窄或排空異常；無法坐立 30 分鐘；重度腎功能不全',
      zole: n('低血鈣；重度腎功能不全（非腫瘤適應症下 CrCl &lt;35、HD、PD 均禁忌）'),
      ralo: n('不建議使用於停經前婦女；有靜脈栓塞病史者；懷孕或可能懷孕；不建議合併全身性 HRT'),
      deno: n('低血鈣（給藥前須矯正）；懷孕及哺乳期間勿使用，有生育能力女性使用前應驗孕'),
      teri: '骨肉瘤高危險群（Paget 病、不明原因 ALP 上升、骨骼放射治療史）；高血鈣；骨骼惡性腫瘤或轉移',
      romo: n('低血鈣；過去一年曾發生心肌梗塞或中風的病人不建議使用'),
    },
  },
  {
    kind: 'row', label: '腎功能', key: true, cells: {
      alen: 'CrCl &lt;35 不建議',
      rise: n('CrCl 15–30 一般不建議；CrCl &lt;15 避免使用；HD、PD、CVVH 均避免使用'),
      zole: n('CrCl &lt;35、HD、PD：非腫瘤適應症禁忌使用'),
      ralo: '嚴重腎功能不全謹慎使用',
      deno: '仿單載明腎功能不全不需調整劑量，但 CrCl &lt;30 或透析病人施打後發生低血鈣症是相當重大的風險，且可能伴隨 PTH 明顯升高。強烈建議監測血鈣與礦物質（磷、鎂）。併用擬鈣藥物（calcimimetics）可能加重低血鈣，須嚴密監控。治療前先矯正既有低血鈣<span class="flag">重度 CKD／透析：黑框警語族群，需 CKD-MBD 專業共同評估</span>',
      teri: '嚴重腎功能不全謹慎使用',
      romo: '不需依腎功能調整劑量；重度腎病病人低血鈣風險上升',
    },
  },
  {
    kind: 'row', label: '常見副作用', cells: {
      alen: n('脹氣、腹痛、腹瀉、便秘、消化不良、食道炎、頭痛'),
      rise: n('感染、腹痛、腹瀉、噁心、頭痛、關節痛、皮疹、背痛、高血壓'),
      zole: n('發燒、噁心、嘔吐、低血鈣、注射部位紅腫痛、倦怠、骨骼疼痛（急性期反應多在首次給藥後 1–3 天）'),
      ralo: n('潮紅、腹瀉、鼻炎、噁心、頭痛、關節痛、類感冒症狀、支氣管炎、咳嗽'),
      deno: n('腹瀉、膀胱炎、頭痛、高膽固醇血症、上呼吸道感染、背痛、倦怠'),
      teri: n('Forteo：暈眩、心搏過速、注射部位紅腫痛、高血鈣<div class="alt">Alvosteo：暈眩、噁心、注射部位紅腫痛、高血鈣</div>'),
      romo: n('過敏反應、關節痛、頭痛、注射部位反應、肌肉痙攣'),
    },
  },
  {
    kind: 'row', label: '黑框警語', key: true, cells: {
      alen: '<span class="na">無</span>', rise: '<span class="na">無</span>', zole: '<span class="na">無</span>',
      ralo: '致死性中風風險上升（具冠心病或高中風風險者）；靜脈血栓栓塞風險上升<div class="alt"><span class="na">配對理解：整體中風風險未上升、冠心事件風險亦未上升，但致死性中風增加。DVT 風險與雌激素相當</span></div>',
      deno: '<b>警告：晚期腎病病人的嚴重低血鈣症</b>（台灣中文仿單已刊載）。晚期 CKD（eGFR &lt;30 mL/min/1.73 m²）含透析病人風險較大，曾有住院、危及生命及致命案例；CKD-MBD 會顯著增加風險。開始用藥前應先評估是否有 CKD-MBD，治療應由具 CKD-MBD 診斷與處置專業者監督<div class="alt"><span class="na">FDA 2024/1/19 依據：CMS 研究中 2,804 位透析病人 12 週嚴重低血鈣發生率 41.1%，口服雙磷酸鹽 2.0%；多在注射後 2–10 週、第 2–5 週風險最高</span></div>',
      teri: '<span class="na">現行仿單已移除骨肉瘤黑框警語，仍列為警語</span>',
      romo: n('可能增加心肌梗塞、中風及心血管疾病死亡風險。過去一年曾發生 MI 或中風者不建議使用；有其他心血管危險因子者須權衡效益與風險；治療中若發生 MI 或中風應停用'),
    },
  },
  {
    kind: 'row', label: '長期／罕見風險', cells: {
      alen: '下顎骨壞死（罕見）、非典型股骨骨折（極罕見）',
      rise: '同 alendronate',
      zole: '同 alendronate',
      ralo: '<span class="na">無 ONJ／AFF 疑慮</span>；深部靜脈栓塞',
      deno: '仿單列為嚴重不良反應者：低血鈣症、嚴重感染、皮膚不良反應、顎骨壞死、非典型股骨粗隆下與骨幹骨折、停藥後多發性脊椎骨折。ONJ 與 AFF 發生率隨用藥年數累積，10 年資料中絕對風險仍低',
      teri: '高血鈣、高尿酸、尿路結石',
      romo: n('可能引發下顎骨壞死（罕見）、非典型股骨骨折'),
    },
  },
  {
    kind: 'row', label: '骨骼外效益與影響', cells: {
      alen: '<span class="na">—</span>',
      rise: '<span class="na">—</span>',
      zole: '<span class="na">—</span>',
      ralo: '降低侵襲性乳癌的相對風險；對血脂有正面影響；不刺激子宮內膜（與雌激素不同，無子宮內膜增生疑慮）<div class="alt"><span class="na">此欄為選藥時的加分考量，非適應症</span></div>',
      deno: '<span class="na">—</span>',
      teri: '<span class="na">—</span>',
      romo: '<span class="na">—</span>',
    },
  },

  /* ---------- 6. 療程與接續 ---------- */
  { kind: 'group', label: '療程長度與停藥後處置' },
  {
    kind: 'row', label: '建議療程', key: true, cells: {
      alen: 'AACE 2020：治療 <b>5 年</b>後，若骨折風險已不再屬高風險（T-score &gt; −2.5、無骨折等），可考慮進入藥物假期；<b>若仍屬高風險則再續用至多 5 年</b>（合計 10 年）<div class="alt"><span class="na">高風險定義：T-score ≤ −2.5，或近期骨折</span></div>',
      rise: '同 alendronate（AACE 2020 對口服雙磷酸鹽一體適用）',
      zole: 'AACE 2020：高風險病人治療 <b>3 年</b>後可考慮藥物假期；<b>極高風險者續用至多 6 年</b>',
      ralo: '可長期使用，限停經後女性',
      deno: '可長期使用（安全性與療效資料達 10 年），<b>但不得中斷</b>。若預期未來可能需要停藥或換藥，ECTS 建議在使用 2.5 年內完成轉換；超過此期限則傾向持續治療至 10 年<span class="flag">無「兩年上限」，時間點的意義是離場窗口，不是安全上限</span>',
      teri: '仿單療程一般不超過 24 個月。美國仿單 2020/11 修訂後改為：若病人仍屬或再次成為高骨折風險，可考慮超過 2 年，不再是絕對的終生上限',
      romo: '仿單療程為 12 個月',
    },
  },
  {
    kind: 'row', label: '停藥後處置', key: true, cells: {
      alen: '骨骼中殘留藥效可維持數年。<b>藥物假期何時結束依個別狀況判斷</b>，AACE 2020 列出三項觸發點：骨折風險上升、骨密度下降幅度超過該台 DXA 的 LSC、或骨轉換標記上升<div class="alt"><span class="na">假期不是結案，期間仍須定期追蹤</span></div>',
      rise: '同 alendronate；停藥後作用消退較 alendronate 快，假期期間更需留意',
      zole: '單次給藥效果可維持約 1 年以上；結束假期的判斷標準同口服雙磷酸鹽',
      ralo: '停藥後骨密度增益逐漸流失，無反彈性骨折現象',
      deno: '<b>停藥會出現骨吸收反彈</b>，可能於 3–18 個月內發生多發性椎體骨折——台灣中文仿單已將「停止使用 Prolia 治療後發生多發性脊椎骨折（MVF）」列為警語專節。不可自行中斷，須接續雙磷酸鹽類；漏打或延遲給藥應盡快補上',
      teri: '療程結束後<b>必須接續抗吸收藥物</b>，否則骨密度增益快速流失',
      romo: n('療程結束後應接續抗吸收藥物以維持療效；漏打時應盡快重新安排施打，之後從最後一次注射日期重新排定每月時間'),
    },
  },

  /* ---------- 7. 院內調劑 ---------- */
  { kind: 'group', label: '院內調劑與警訊' },
  {
    kind: 'row', label: '器材與調劑', cells: {
      alen: '<span class="na">—</span>', rise: '<span class="na">—</span>',
      zole: '<span class="na">—</span>', ralo: '<span class="na">—</span>',
      deno: n('預充式針筒，附綠色安全保護裝置'),
      teri: n('Forteo 為預充式注射筆，需另開立注射筆專用針（俗稱胰島素針頭，常用 8 mm，或依病人體型選擇）<div class="alt">Alvosteo 為 vial，須搭配專用注射筆。門診首次使用請至藥品諮詢窗口領取專用筆並由藥師衛教；急診與住院首次給衛教包（內含注射筆），置於 UD 前 3 架 D</div>'),
      romo: n('預充式針筒，每次 2 支'),
    },
  },
  {
    kind: 'row', label: '院內警訊設定', key: true, cells: {
      alen: n('建議 QWAC 使用；限 PO 投予；不宜剝半。藥劑部 6515'),
      rise: n('限口服給予；28 天內已開立過會觸發提示（建議每月 1 顆）；每次醫令與每月處方上限均為 1 顆。藥劑部 6515'),
      zole: n('限 IVD 投予；360 天內已施打過會觸發提示；每次建議劑量 5 mg。院內另有同成份 Zometa 4 mg/vial（適應症為高血鈣症），勿混淆。藥劑部 6515'),
      ralo: n('限 PO 投予；超過每日常用量 60 mg 會觸發提示。藥劑部 6515'),
      deno: n('限 SC 投予；168 天內已施打過會觸發提示（建議每 6 個月一次）。藥劑部 6515'),
      teri: n('限 SC 投予（Forteo 與 Alvosteo 皆同）。藥劑部 6515'),
      romo: n('限皮下注射；每次建議劑量 2 支（210 mg）SC QM，開立時確認劑量、單位與藥名。藥劑部 6515'),
    },
  },
]

export interface CompareQa {
  q: string
  tag?: string
  body: string[] // paragraphs, each may contain <b>…</b>
}

export const COMPARE_QA: CompareQa[] = [
  {
    q: 'Prolia 是不是只能用兩年？',
    tag: '迷思',
    body: [
      '沒有兩年上限。Prolia 的安全性與療效資料追蹤到 10 年。',
      '這個說法多半來自三處混淆：一是跟 <b>Forteo 搞混</b>（teriparatide 才是 24 個月上限）；二是把<b>雙磷酸鹽的藥物假期</b>套過來（Prolia 剛好相反，不能放假）；三是 <b>ECTS 關於轉換時機的建議</b>被誤讀成安全上限。',
      'ECTS 的原意是：如果預期未來可能需要停藥或換藥，建議在使用 2.5 年內完成轉換；超過約 3 年再轉換，即使接上 zoledronate 仍容易出現明顯骨密度流失，此時反而傾向持續治療到 10 年。<b>那是離場窗口，不是安全上限。</b>',
      '臨床意涵：開始 Prolia 時就要判斷病人是否可能中途停藥（計畫懷孕、大手術、經濟因素、依從性差），若是，轉換規劃要提早。',
    ],
  },
  {
    q: 'Prolia 用久了會不會出現停滯期、效果變差？',
    body: [
      '不會。FREEDOM 延伸試驗中腰椎骨密度從 3 年的 8.8% 上升到 10 年的 21.7%，全髖從 6.4% 到 9.2%，<b>逐年持續上升、沒有進入平台期</b>。雙磷酸鹽則通常在 3–5 年後大致持平。',
      '機轉差異：雙磷酸鹽須結合骨表面 hydroxyapatite 才作用，結合位點會飽和、藥物也會沉入深層骨基質失去活性，抑制效果有上限；Prolia 是循環中的抗體，不進入骨基質，對 RANKL 的抑制持續且完全。',
      '但要注意兩點：延伸試驗是開放標籤、無安慰劑對照，證據等級低於前 3 年；且後期骨密度增益有相當比例來自次級礦化，與骨強度不是線性對應。<b>骨密度一直漲，不等於骨折風險一直等比下降。</b>',
    ],
  },
  {
    q: '病人用了幾年，骨密度反而沒進步甚至下降，是不是產生抗藥性？',
    body: [
      '骨鬆藥物沒有「抗藥性」這回事。依序先想這三件事：',
      '<b>一、依從性與給藥間隔。</b>口服雙磷酸鹽是否照空腹、直立的方式服用；注射劑是否延遲施打。<b>二、鈣與維生素 D 是否足量。</b>不足時抗吸收藥物的效果會打折。<b>三、有無未處理的次發性骨鬆原因</b>：長期類固醇、副甲狀腺功能亢進、甲狀腺功能亢進、性腺功能低下、吸收不良、多發性骨髓瘤、長期使用 PPI 或抗癲癇藥等。',
      '三項都排除後，才考慮換藥或升階為促骨生成藥物。',
    ],
  },
  {
    q: 'Prolia 可以直接停嗎？停藥會怎樣？',
    tag: '高風險',
    body: [
      '不可以自行中斷。停藥後會出現骨吸收反彈，可能在 3–18 個月內發生<b>多發性椎體骨折</b>。台灣中文仿單已將「停止使用 Prolia 治療後發生多發性脊椎骨折（MVF）」列為警語專節。',
      '用愈久、累積的骨密度增益愈多，停藥時可以掉的就愈多。停用必須接續雙磷酸鹽類（常用 zoledronate），不是單純停掉。',
      '<b>延遲施打本身就是風險。</b>漏打應儘快補上，之後從最後一次注射日期重新排定每 6 個月。超過 7 個月未打就要當成問題處理，主動追回病人。',
    ],
  },
  {
    q: '新聞說維生素 D 會增加失智風險，骨鬆病人還要補嗎？',
    tag: '迷思',
    body: [
      '要補，而且那則新聞講的不是我們開的那個東西。',
      '2022 年國衛院的研究，健保資料庫分析的暴露是<b>活性維生素 D3（calcitriol）</b>，每年服用超過 146 天者失智風險 1.8 倍。Calcitriol 是處方用的 1,25(OH)₂D，主要用於 CKD-MBD 與副甲狀腺功能低下；骨鬆補充用的是<b>一般維生素 D（cholecalciferol）</b>，須經肝腎兩次羥化才有活性，兩者藥理完全不同。',
      '此外，台灣長期服用 calcitriol 的族群以 CKD 與透析病人為主，而慢性腎病本身就是失智與死亡的強危險因子，適應症混淆難以排除；該研究自己的動物實驗也主張「阿茲海默症才是造成維生素 D 低下的原因」，這反而支持反向因果的可能。RCT 層級的證據（如 VITAL 認知子研究）未測到 cholecalciferol 的認知傷害，至今也沒有骨鬆指引因此撤掉鈣與維生素 D 的建議。',
      '<b>實務做法：</b>一般骨鬆病人補 cholecalciferol 800–1000 IU/day，目標 25(OH)D 約 30 ng/mL；Prolia 仿單明文要求每日至少 1000 mg 鈣與至少 400 IU 維生素 D。避免大劑量間歇給藥（年度 bolus 反而增加跌倒與骨折）。不要為了骨鬆常規開 calcitriol。',
    ],
  },
  {
    q: '洗腎或重度腎病的病人可以打 Prolia 嗎？',
    tag: '高風險',
    body: [
      '可以，但屬於黑框警語族群，不應該當成常規決定。台灣仿單開頭即載明「警告：晚期腎病病人的嚴重低血鈣症」，eGFR &lt;30 含透析病人風險較大，已有住院、危及生命與致命案例。',
      '要做的事：用藥前先<b>矯正既有低血鈣</b>並評估是否有 CKD-MBD；第一個月<b>每週監測血鈣</b>、之後每月一次；同時監測磷與鎂，注意 PTH 可能明顯升高；<b>併用擬鈣藥物（calcimimetics）會加重低血鈣</b>，須嚴密監控。治療應由具 CKD-MBD 診斷與處置專業者共同管理。',
      '注意這一題沒有簡單的替代方案：雙磷酸鹽在 CrCl &lt;35、透析與腹膜透析的非腫瘤適應症下是禁忌，所以不是「改用雙磷酸鹽就好」。',
    ],
  },
  {
    q: '骨鬆藥要用多久？什麼情況可以進入藥物假期？',
    body: [
      '<b>藥物假期只適用於雙磷酸鹽</b>，因為它會殘留在骨骼、停藥後仍有殘效。',
      'AACE 2020 給的年限是：<b>口服雙磷酸鹽治療 5 年後</b>，若骨折風險已不再屬高風險（T-score &gt; −2.5、無骨折等），可考慮進入假期；若仍屬高風險，再續用至多 5 年。<b>Zoledronate 則是高風險者 3 年後</b>可考慮假期，極高風險者續用至多 6 年。這裡的高風險指 T-score ≤ −2.5 或近期骨折。',
      '<b>假期什麼時候該結束？</b>依個別狀況判斷，AACE 列出三個觸發點：骨折風險上升、骨密度下降幅度超過該台 DXA 的 LSC、或骨轉換標記上升。所以假期不是結案，期間仍要定期追蹤 DXA 與標記。',
      '<b>Prolia 沒有藥物假期</b>，作用完全可逆，停藥即反彈。',
      '<b>促骨生成藥物有固定療程</b>：teriparatide 仿單一般不超過 24 個月、romosozumab 12 個月，兩者結束後都<b>必須接續抗吸收藥物</b>，否則骨密度增益快速流失。',
    ],
  },
  {
    q: '骨轉換標記什麼時候驗？要驗哪一個？',
    body: [
      'IOF 與 IFCC 建議以血清 <b>P1NP</b>（骨形成）與 <b>CTX</b>（骨吸收）作為參考標記，其他如骨鈣素、骨特異性鹼性磷酸酶為次選。亞太地區共識也採同一組。',
      '<b>主要用途是早期確認有沒有在吃藥、藥有沒有作用</b>，比 DXA 早得多——BMD 要等一到兩年才看得出變化，標記幾週到幾個月就會動。',
      '時機上，抗吸收藥物建議<b>治療前先抽基線值</b>，靜脈雙磷酸鹽或 denosumab 在 1 到 3 個月後複驗，口服雙磷酸鹽在 3 到 6 個月後複驗，確認確實從基線下降。治療目標一般是把標記壓到停經前婦女參考範圍的下半部。促骨生成藥物則看 P1NP 在 3 到 6 個月的上升幅度。',
      '兩個限制要知道：一是各家檢驗方法尚未完全標準化，不同實驗室的數值不能互比；二是變化量要超過該實驗室的 LSC 才算真的有變。判讀請以本院檢驗科的參考區間為準。',
    ],
  },
  {
    q: '表上哪個藥降骨折的百分比最高，就選那個嗎？',
    body: [
      '不能這樣挑。這些數字來自不同試驗，對照組、收案族群、基礎骨折風險與追蹤時間都不同，<b>不是頭對頭比較</b>。表格保留各自的追蹤時間就是為了提醒這件事。',
      '真正的頭對頭試驗很少：ARCH（romosozumab vs alendronate）與 VERO（risedronate vs teriparatide）是少數例外。',
      '實際選藥看的是：骨折風險層級（是否屬極高風險）、給藥途徑與依從性、腎功能、共病（心血管病史決定能否用 romosozumab、血栓病史決定能否用 raloxifene）、上消化道狀況、以及成本。',
    ],
  },
  {
    q: '病人要拔牙或植牙，藥要停嗎？',
    body: [
      '下顎骨壞死在骨鬆劑量下屬罕見，發生率遠低於腫瘤劑量。處理原則是<b>預防重於停藥</b>：起始治療前儘量先完成侵入性牙科處置、維持口腔清潔、定期牙科檢查，並請病人主動告知牙醫正在使用哪一類骨鬆藥。',
      '<b>不要為了牙科處置就片面停掉 Prolia</b>，停藥反彈的風險高於 ONJ。若需安排，與牙科協調在給藥週期中段進行、趕在下一劑之前，而不是延後下一劑。',
      '雙磷酸鹽因為有骨骼殘效，短期停藥對 ONJ 風險的改善證據本來就有限，也不建議反射性停藥。',
    ],
  },
  {
    q: 'Forteo 和 Alvosteo 有什麼不一樣？',
    body: [
      '成分、劑量、給藥頻次完全相同，都是 teriparatide 20 mcg 每日一次皮下注射。差別在三處：',
      '<b>器材：</b>Forteo 是預充式注射筆，需另開立筆針（常用 8 mm）；Alvosteo 是 vial，須搭配專用注射筆，門診首次使用要到藥品諮詢窗口領筆並由藥師衛教，急診與住院首次給衛教包。',
      '<b>價格：</b>Forteo 健保價 11,681 元／支，Alvosteo 8,471 元／支，每日約 417 元對 303 元。',
      '<b>調劑流程：</b>第一次開立時最容易卡住的就是器材與衛教包，建議先確認流程再開單。',
    ],
  },
]

export const COMPARE_CALLOUT = {
  title: '原始比較表最容易漏掉的一件事：停藥後的接續治療',
  body: 'Denosumab 停用後會出現骨吸收反彈，未接續抗吸收藥物者可能在數月內發生多發性椎體骨折；teriparatide 與 romosozumab 療程結束後若未接續，骨密度增益會快速流失。這三個藥都不是「打完就結束」，安排下一段治療應在起始時就規劃。',
}

export const COMPARE_NOTES: string[] = [
  '療效數字取自各藥的關鍵試驗，對照組、追蹤時間與收案族群皆不同，<b>不可直接橫向比較數值大小</b>。欄位保留原始追蹤時間即為此故。',
  '七支藥的院內欄位皆已填入成大藥品基本檔資料。Ibandronate 因成大無此品項已移除。',
  'Teriparatide 欄位同時列出院內兩個品項：Forteo（預充筆）與 Alvosteo（vial ＋專用筆）。兩者成分與劑量相同，價差與調劑流程不同。',
  '本表不收錄健保給付適應症、事前審查與累積量規定，請另行查詢院內系統或醫療事務室公告。',
  '「FDA 核准適應症」欄位為美國 FDA 的核准範圍，與台灣衛福部核准的適應症、以及健保給付範圍都是三件不同的事，不可互相推論。該欄的用途是快速判斷某支藥有沒有「預防」適應症——骨質缺乏（osteopenia）階段要用藥時，看的就是這一格。',
  '所有骨鬆藥物治療期間均需確保鈣與維生素 D 充足，並在起始前矯正低血鈣與維生素 D 缺乏。此處指一般維生素 D（cholecalciferol），與處方用的活性維生素 D（calcitriol）不同，兩者不可混為一談（見常見問題）。侵入性牙科處置前應評估顎骨壞死風險。',
]
