export type TimeCol = { label: string; months: number }
export type Dose = { months: number; label: string; tip: string }
export type VaccineType = 'pub' | 'priv'

export type PedVaccine = {
  section?: string
  name: string
  en: string
  type: VaccineType
  doses: Dose[]
}

export type AdultVaccine = {
  id: string
  icon: string
  name: string
  en: string
  doses: string
  schedule: string
  target: string
  notes: string[]
  public_note?: string
  contraindication: string
  price: string | null
}

export type SpVaccineEntry = {
  name: string
  type: 'pub' | 'priv' | 'pub/priv'
  detail: string
}

export type SpWarning = { text: string; critical?: boolean }
export type SpSource = { text: string; url?: string }

export type SpecialPopulation = {
  id: string
  icon: string
  name: string
  en: string
  vaccines: SpVaccineEntry[]
  timing: string[]
  warnings: SpWarning[]
  sources: SpSource[]
}

export const TIME_COLS: TimeCol[] = [
  { label: '出生\n24hr', months: 0 },
  { label: '1\nm', months: 1 },
  { label: '2\nm', months: 2 },
  { label: '4\nm', months: 4 },
  { label: '5\nm', months: 5 },
  { label: '6\nm', months: 6 },
  { label: '12\nm', months: 12 },
  { label: '15\nm', months: 15 },
  { label: '18\nm', months: 18 },
  { label: '24\nm', months: 24 },
  { label: '27\nm', months: 27 },
  { label: '4–6\ny', months: 54 },
  { label: '5y\n入學前', months: 60 },
  { label: '9y+\n(HPV)', months: 108 },
  { label: '13y+', months: 156 },
]

export const PED_VACCINES: PedVaccine[] = [
  {
    section: '公費疫苗',
    name: 'B型肝炎', en: 'Hepatitis B', type: 'pub',
    doses: [
      { months: 0, label: '第1', tip: '出生24hr內' },
      { months: 1, label: '第2', tip: '出生滿1個月' },
      { months: 6, label: '第3', tip: '出生滿6個月' },
    ],
  },
  {
    name: '卡介苗', en: 'BCG', type: 'pub',
    doses: [{ months: 5, label: '1劑', tip: '出生滿5個月（建議5–8個月）' }],
  },
  {
    name: '五合一\nDTaP-Hib-IPV', en: 'DTaP-Hib-IPV', type: 'pub',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月' },
      { months: 4, label: '第2', tip: '出生滿4個月' },
      { months: 6, label: '第3', tip: '出生滿6個月' },
      { months: 18, label: '第4', tip: '出生滿18個月' },
    ],
  },
  {
    name: '肺炎鏈球菌\nPCV13', en: 'PCV13', type: 'pub',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月' },
      { months: 4, label: '第2', tip: '出生滿4個月' },
      { months: 12, label: '第3', tip: '出生滿12-15個月（建議於 12 個月後即可接種）' },
    ],
  },
  {
    name: '水痘\n(第1劑)', en: 'Varicella ×1', type: 'pub',
    doses: [{ months: 12, label: '第1', tip: '出生滿12個月（公費）' }],
  },
  {
    name: 'MMR\n麻疹腮腺炎德麻', en: 'MMR', type: 'pub',
    doses: [
      { months: 12, label: '第1', tip: '出生滿12個月（CDC 公費為 12 個月）' },
      { months: 60, label: '第2', tip: '滿 5 歲，入國小前（與第 1 劑間隔至少 4 週）' },
    ],
  },
  {
    name: '日本腦炎\n(活性減毒)', en: 'JEV', type: 'pub',
    doses: [
      { months: 15, label: '第1', tip: '出生滿15個月' },
      { months: 27, label: '第2', tip: '出生滿27個月（間隔12個月）' },
    ],
  },
  {
    name: 'A型肝炎\n(特定對象)', en: 'Hepatitis A', type: 'pub',
    doses: [
      { months: 18, label: '第1', tip: '出生滿18個月（114 年起新時程）' },
      { months: 27, label: '第2', tip: '出生滿27個月（與第 1 劑間隔至少 6 個月）' },
    ],
  },
  {
    name: '四合一\nDTaP-IPV', en: 'DTaP-IPV', type: 'pub',
    doses: [{ months: 60, label: '1劑', tip: '滿5歲，入國小前加強' }],
  },
  {
    section: '自費疫苗',
    name: '輪狀病毒\n羅特律 (Rotarix)', en: 'Rotavirus (Rotarix, 2-dose)', type: 'priv',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月（最早出生6週可接種）' },
      { months: 4, label: '第2', tip: '與第 1 劑間隔至少 4 週；最後 1 劑不得晚於 24 週（約 6 個月）' },
    ],
  },
  {
    name: '輪狀病毒\n輪達停 (RotaTeq)', en: 'Rotavirus (RotaTeq, 3-dose)', type: 'priv',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月（最早出生6週可接種）' },
      { months: 4, label: '第2', tip: '與前劑間隔至少 4 週' },
      { months: 6, label: '第3', tip: '最後 1 劑不得晚於 32 週（約 8 個月）' },
    ],
  },
  {
    name: '腸病毒A71型\n國光/安特羅', en: 'EV71 (EnVAX-A71)', type: 'priv',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月（2個月–未滿6歲）' },
      { months: 3, label: '第2', tip: '間隔至少28天（4週）' },
    ],
  },
  {
    name: '腸病毒A71型\n高端', en: 'EV71 (Medigen)', type: 'priv',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月（2個月–未滿6歲）' },
      { months: 4, label: '第2', tip: '間隔至少56天（8週）' },
      { months: 14, label: '追加', tip: '第1劑接種時未滿2歲者，建議於第1劑後1年接種追加劑' },
    ],
  },
  {
    name: 'RSV單株抗體\n(Nirsevimab)', en: 'RSV mAb', type: 'priv',
    doses: [{ months: 0, label: '1劑', tip: '出生後即可；1歲以下嬰兒' }],
  },
  {
    name: '流行性腦膜炎\nMenveo (ACWY)', en: 'MenACWY (Menveo)', type: 'priv',
    doses: [{ months: 24, label: '1劑', tip: '2 歲以上單劑接種（台灣 CDC 旅遊醫學主要使用之 MCV4）' }],
  },
  {
    name: '流行性腦膜炎\nMenactra (ACWY)', en: 'MenACWY (Menactra)', type: 'priv',
    doses: [
      { months: 9, label: '第1', tip: '9 個月以上未滿 2 歲：2 劑（間隔至少 3 個月）' },
      { months: 12, label: '第2', tip: '與第 1 劑間隔至少 3 個月' },
    ],
  },
  {
    name: '流行性腦膜炎\nMenB (Bexsero)', en: 'MenB (4CMenB)', type: 'priv',
    doses: [
      { months: 2, label: '第1', tip: '出生滿2個月（2 個月起接種者為 3+1 共 4 劑）' },
      { months: 4, label: '第2', tip: '與第 1 劑間隔至少 1 個月' },
      { months: 6, label: '第3', tip: '與第 2 劑間隔至少 1 個月' },
      { months: 12, label: '追加', tip: '12 個月以上接種，與第 3 劑間隔至少 6 個月' },
    ],
  },
  {
    name: '水痘\n(第2劑)', en: 'Varicella ×2', type: 'priv',
    doses: [{ months: 54, label: '第2', tip: '滿4–6歲自費接種第2劑' }],
  },
  {
    name: 'HPV 9價', en: 'HPV (9-valent)', type: 'pub',
    doses: [
      { months: 108, label: '第1', tip: '公費接種於國中二年級（生日 9/2~翌年 9/1 那批），114/9 起男女皆可。9–14歲接種：兩劑時程' },
      { months: 156, label: '第2', tip: '與第 1 劑間隔 6–12 個月。注意：若 ≥15 歲才開始施打，須改打 3 劑（0、2、6 個月）' },
    ],
  },
  {
    name: '流感\n(學齡與青少年)', en: 'Influenza (annual)', type: 'pub',
    doses: [
      { months: 108, label: '每年', tip: '6 個月以上每年秋冬接種 1 劑（自 114/1 起全民公費）' },
      { months: 156, label: '每年', tip: '每年秋冬接種 1 劑（公費）' },
    ],
  },
]

export const ADULT_VACCINES: AdultVaccine[] = [
  {
    id: 'hpv', icon: '🧬', name: 'HPV 9價疫苗', en: 'Human Papillomavirus Vaccine (9-valent)',
    doses: '2劑（9–14歲）/ 3劑（15歲以上）',
    schedule: '9–14歲：0、6–12個月（2劑）；15歲以上：0、2、6個月（3劑）',
    target: '仿單適應 9–45 歲男女',
    notes: ['預防子宮頸癌、肛門癌、口咽癌、外生殖器癌等與 HPV 相關之疾病', '9–14歲2劑效果等同15歲以上3劑', '接種前不必常規篩檢 HPV', '已有性經驗者仍可接種，效力對未曾感染之型別仍有保護'],
    public_note: '【公費對象】自 107 年 12 月起國中女生公費接種；自 114 年 9 月起擴大為全體國中生（男女皆可），由 113 學年度入學國中生開始，採校園集中接種 9 價疫苗，9–14 歲僅需 2 劑。<br>詳見：<a href="https://www.hpa.gov.tw/Pages/List.aspx?nodeid=1799" target="_blank">國健署 HPV 疫苗 QA</a>',
    contraindication: '對疫苗成分嚴重過敏；孕婦暫緩',
    price: null,
  },
  {
    id: 'shingrix', icon: '🦠', name: '帶狀疱疹疫苗', en: 'Zoster Vaccine (Shingrix)',
    doses: '2劑',
    schedule: '2劑，間隔 2–6 個月',
    target: '50 歲以上成人；18 歲以上免疫功能不全或低下者',
    notes: [
      '非活性基因重組蛋白疫苗，免疫不全者可接種；台灣目前取得許可證者僅此劑型（無活性減毒之 Zostavax）',
      '預防帶狀疱疹及疱疹後神經痛',
      '<strong>不論過去是否有水痘或帶狀疱疹病史，均建議接種</strong>',
      '<strong>免疫功能低下族群</strong>包括：HIV 感染、癌症、糖尿病、慢性腎臟病、氣喘、慢性阻塞性肺病、類風濕性關節炎，及使用免疫抑制劑者',
      '孕婦應避免接種',
    ],
    contraindication: '對疫苗成分嚴重過敏',
    price: null,
  },
  {
    id: 'hepb', icon: '🩸', name: 'B型肝炎疫苗', en: 'Hepatitis B Vaccine',
    doses: '3劑（或追加1劑）',
    schedule: '0、1、6 個月（未曾接種者）',
    target: '無抗體（<10 mIU/mL）且非帶原者',
    notes: [
      '接種前建議檢驗 <strong>HBsAg 與 anti-HBs</strong>，確認未具表面抗體且非帶原者再接種',
      '已完成 3 劑但 anti-HBs 仍 &lt;10 mIU/mL：<strong>高危險群補 1 劑後 1 個月複驗</strong>；若仍為陰性，再依 0-1-6 個月時程完成一次全程接種',
      '非高危險群：尚無須全面追加，可自費追加 1 劑',
      '<strong>高危險群</strong>：血液透析患者、器官移植者、接受血液製品者、免疫功能不全者、多重性伴侶者、注射藥癮者、帶原者之家庭成員與性伴侶、教養機構住民與工作人員、有血液暴露風險之醫療人員',
    ],
    contraindication: '對疫苗成分嚴重過敏',
    price: null,
  },
  {
    id: 'hepa', icon: '🟡', name: 'A型肝炎疫苗', en: 'Hepatitis A Vaccine',
    doses: '2劑',
    schedule: '2劑，間隔至少 6 個月',
    target: '未曾接種且未得過A型肝炎者',
    notes: [
      '接種 1 劑後約 95% 產生保護抗體，完成 2 劑後保護力可達 20 年以上',
      '前往 A 肝流行地區前建議接種',
      '<strong>建議自費接種之對象</strong>：前往流行地區之旅遊者、餐飲從業人員、廚師、醫療人員、托育人員、<strong>慢性肝病患者、血友病患者、肝臟移植者</strong>、注射藥癮者、男男性行為者',
      '孕婦暫緩接種',
    ],
    contraindication: '對疫苗成分嚴重過敏；孕婦',
    price: null,
  },
  {
    id: 'tdap', icon: '💪', name: '破傷風白喉百日咳疫苗', en: 'Tdap / Td Vaccine',
    doses: 'Tdap 1劑；之後每10年 Td',
    schedule: '成人加強1劑Tdap，每10年追加Td',
    target: '成人；孕婦每次懷孕（27–36週）',
    notes: [
      '<strong>孕婦每胎接種 1 劑 Tdap，任何週數皆可接種</strong>；建議於 <strong>27–36 週</strong>接種，可使傳遞給新生兒之抗體最多',
      '孕期未接種者，應於<strong>產後立即補接種</strong>',
      '優先接種族群：醫療人員、準備懷孕之女性、嬰兒照顧者（繭式策略）',
      '接種史不明或基礎劑未完成之成人，先補 1 劑 Tdap，之後每 10 年追加 1 劑 Td',
      '傷口深或污染：若超過 5 年未接種含破傷風疫苗則補打',
    ],
    contraindication: '對疫苗成分嚴重過敏；接種含百日咳疫苗後 7 天內曾發生無其他可辨識原因之腦病變。注意事項：曾於接種含破傷風疫苗後 6 週內發生 Guillain-Barré 症候群者，或曾發生 Arthus 過敏反應者（需間隔 ≥10 年）',
    price: null,
  },
  {
    id: 'pneumo', icon: '🫁', name: '肺炎鏈球菌疫苗', en: 'Pneumococcal Vaccine (PCV20 / PPV23)',
    doses: '1劑 PCV20（新政策）',
    schedule: '從未接種過者：1劑 PCV20 即完整接種',
    target: '65 歲以上；55–64 歲原住民；19–64 歲 IPD 高風險對象',
    notes: [
      'PCV20（20 價結合型）：自 115/1/15 起取代原 PCV13 + PPV23 雙劑接種模式，1 劑即完整保護',
      'IPD 高風險對象：脾臟功能缺損、先天/後天免疫功能不全、人工耳植入、腦脊髓液滲漏、一年內接受免疫抑制劑或放射治療之惡性腫瘤患者及器官移植者',
      '銜接規則（依過去接種紀錄）：',
      '　• 從未接種：直接接種 1 劑 PCV20',
      '　• 僅曾接種 PPV23（間隔≥1 年）：補打 1 劑 PCV20',
      '　• 僅曾接種 PCV13/15（間隔≥1 年；高風險者≥8 週）：以 1 劑 PPV23 銜接（過渡期，俟 PPV23 用罄後改 PCV20）',
      '　• 已接種 PCV13/15 + PPV23：視為完整接種，無需再打',
      '　• 19–64 歲 IPD 高風險者，於 65 歲前完整接 PCV13/15+PPV23：滿 65 歲且距前劑≥5 年，可追加 1 劑 PCV20',
    ],
    public_note: '【公費對象（115 年起新制）】3 類人公費：(1) 65 歲以上、(2) 55–64 歲原住民、(3) 19–64 歲 IPD 高風險對象。自 115/1/15 起政策大改：以 1 劑 PCV20 取代原 2 劑接種。<br>詳見：<a href="https://www.cdc.gov.tw/Category/Page/U_hY1WCfa5BU6fuqW9FIXg" target="_blank">CDC 成人肺炎鏈球菌疫苗</a>',
    contraindication: '對疫苗成分嚴重過敏',
    price: null,
  },
  {
    id: 'je', icon: '🦟', name: '日本腦炎疫苗', en: 'Japanese Encephalitis Vaccine',
    doses: '不活化疫苗 3 劑／活性減毒（IMOJEV）1 劑',
    schedule: '不活化疫苗（無接種史成人）：第 0、4 週，滿 1 年後第 3 劑；IMOJEV：2 歲以上單劑',
    target: '前往東南亞/亞洲農村的旅遊者；長期居住流行區者',
    notes: [
      '<strong>無接種史或接種史不明之成人，不活化疫苗須接種 3 劑</strong>：第 1、2 劑間隔 4 週，第 3 劑於 1 年後接種',
      '活性減毒嵌合型疫苗（IMOJEV）：2 歲以上單劑，單劑保護力估計可達 10 年',
      '出發前至少 4 週完成接種',
      '自費約 3,000–4,000 元／劑，可於旅遊醫學門診評估後接種',
    ],
    contraindication: '對疫苗成分嚴重過敏；孕婦暫緩',
    price: null,
  },
  {
    id: 'varicella', icon: '💧', name: '水痘疫苗（成人）', en: 'Varicella Vaccine (Adult)',
    doses: '2劑',
    schedule: '2劑，間隔 4–8 週',
    target: '13歲以上未曾接種且未得過水痘者',
    notes: [
      '接種後 4 週內應避免懷孕',
      '免疫不全者禁用（活性減毒疫苗）',
      '接種後若出現疹子，避免接觸免疫不全者',
      '<strong>與免疫球蛋白／血液製品之間隔</strong>：一般肌肉注射免疫球蛋白或 HBIG 後隔 <strong>3 個月</strong>；輸血或靜脈注射血液製品後隔 <strong>6 個月</strong>；高劑量靜脈免疫球蛋白（≧1g/kg）後隔 <strong>11 個月</strong>再接種',
      '<strong>抗病毒藥物</strong>：接種前 24 小時內曾使用 acyclovir、famciclovir 或 valacyclovir 者，接種後間隔 14 天以後再恢復用藥',
      '18 歲以下接種後 6 週內宜避免使用水楊酸類藥品（阿斯匹靈）',
    ],
    contraindication: '孕婦；已知嚴重免疫缺失者',
    price: null,
  },
  {
    id: 'menacwy', icon: '🧪', name: '流行性腦脊髓膜炎疫苗 ACWY', en: 'MenACWY (Menveo)',
    doses: '1 劑（2 歲以上）',
    schedule: '單劑肌肉注射，接種後 7-10 天產生保護力，預防接種證明書於接種 10 天後生效',
    target: '前往腦膜炎流行地區（非洲腦膜炎帶）；沙烏地阿拉伯朝聖者；留學生（部分學校要求）；高危險族群（脾臟切除、補體缺損、HIV）',
    notes: [
      '台灣 CDC 旅遊醫學專案進口廠牌為 Menveo（GSK，腦寧安）',
      '保護 A、C、W-135、Y 四種血清型；不涵蓋 B 型',
      '保護力可維持約 5 年；持續暴露於高風險環境者，建議每 5 年追加 1 劑',
      '可至疾管署合約之旅遊醫學門診接種；建議出國前至少 10 天完成接種',
      '9 個月-未滿 2 歲嬰幼兒：可考慮 Menactra 接種 2 劑（間隔至少 3 個月）',
    ],
    contraindication: '對疫苗成分嚴重過敏（含白喉類毒素過敏者）',
    price: null,
  },
  {
    id: 'menb', icon: '🧪', name: '流行性腦脊髓膜炎疫苗 B 型', en: 'MenB (Bexsero / 4CMenB)',
    doses: '依年齡 2-4 劑',
    schedule: '依起始年齡決定劑次：2-5 個月起 → 3 + 1 共 4 劑；6-11 個月起 → 2 + 1 共 3 劑；12 個月以上起 → 2 劑',
    target: '台灣本土流行性腦脊髓膜炎以 B 型為主（約佔 80%）；建議高危險族群接種：脾臟功能缺損、先天/後天補體缺損、原發性免疫缺損、HIV 感染者、接受 eculizumab 治療者、造血幹細胞移植者；學校群居族群亦可考慮自費接種',
    notes: [
      '台灣現用為 Bexsero（GSK，必思諾）四成份重組蛋白疫苗（4CMenB）',
      '不涵蓋 ACWY 血清型（如有需要可同時接種 MenACWY，分開不同部位）',
      '輝瑞 Trumenba（適用 10 歲以上）在台灣較少見',
      '可預防性使用 acetaminophen 降低發燒發生率，不影響免疫生成效果',
    ],
    contraindication: '對疫苗成分嚴重過敏',
    price: null,
  },
  {
    id: 'rsv', icon: '🫧', name: 'RSV 疫苗（成人/孕婦）', en: 'RSV Vaccine (Abrysvo / Arexvy)',
    doses: '1 劑',
    schedule: '1 劑（單次接種）',
    target: '60 歲以上長者（尤其慢性肺病、心臟病等高危族群）；懷孕 28–36 週（為新生兒被動免疫）',
    notes: [
      'Abrysvo（艾沛兒，輝瑞）：2025 年於台灣上市，雙適應 — 60 歲以上成人 + 孕婦（28–36 週）',
      'Arexvy（GSK）：適用 60 歲以上成人，未涵蓋孕婦',
      '孕婦接種後抗體經胎盤傳給胎兒，可保護新生兒至出生後 6 個月',
      '孕婦建議與百日咳疫苗（Tdap）間隔 2 週，避免可能免疫干擾',
      '基因重組蛋白疫苗，非活性疫苗',
      '60–74 歲一般健康成人建議與醫師討論後決定',
    ],
    contraindication: '對疫苗成分嚴重過敏',
    price: null,
  },
  {
    id: 'mpox', icon: '🔴', name: 'M痘疫苗', en: 'Mpox Vaccine (JYNNEOS)',
    doses: '2 劑',
    schedule: '2 劑，間隔 4 週；18 歲以上採皮內注射 0.1mL',
    target: '正痘病毒屬實驗室操作人員；與確診個案有任何形式性接觸之高風險接觸者；近 1 年有風險性行為（多重性伴侶、性交易、於營業場所發生性行為）或曾罹患性病者，及其性接觸對象；照護確診個案之醫療照護與清消人員、採檢及接種作業人員',
    notes: [
      '非複製型活性疫苗（MVA-BN，天花疫苗改良株）',
      '<strong>暴露後預防應於最後一次暴露後 14 天內接種</strong>；<strong>4 天內接種效果最佳</strong>，4–14 天內接種可能無法預防發病，但可降低嚴重度',
      '<strong>給藥途徑</strong>：18 歲以上之暴露前與暴露後對象採<strong>皮內</strong>注射 0.1mL；18 歲以下、嚴重免疫不全或有蟹足腫病史者不適用皮內注射，應採<strong>皮下</strong>注射',
      '1 劑保護力約 40–80%，完成 2 劑可達 90% 以上',
      '與其他疫苗可任意間隔同時接種',
      '常見不良反應：注射部位疼痛 80–85%、紅斑 61–81%、腫脹 52–67%；全身性為疲倦、頭痛、肌痛',
    ],
    public_note: '【公費對象】(1) 正痘病毒屬之實驗室操作人員；(2) 與確診個案曾有任何形式性接觸、且未曾接種暴露後預防疫苗之高風險接觸者；(3) 近 1 年有風險性行為者、過去曾罹患性病者，或其性接觸對象有前述情形者；(4) 照護確診個案之醫療照護與清消人員，及協助採檢或執行疫苗接種作業之人員。<br>詳見：<a href="https://www.cdc.gov.tw/Category/Page/IO0eHp7UlpW8hkmdNuZY0Q" target="_blank">CDC M痘疫苗</a>',
    contraindication: '對疫苗成分嚴重過敏；嚴重免疫不全者免疫反應可能降低',
    price: null,
  },
  {
    id: 'rabies', icon: '🐾', name: '狂犬病疫苗', en: 'Rabies Vaccine',
    doses: '暴露前 3 劑／暴露後 4 劑（曾接種者 2 劑）',
    schedule: '暴露前：第 0、7、21 或 28 天；暴露後（未曾接種）：第 0、3、7、14 天',
    target: '前往狂犬病流行地區之旅遊者；狂犬病毒實驗室工作人員、動物防疫人員、捕犬人員、動物保育人員、獸醫從業人員、消防隊員、巡山員及經常出入深山者',
    notes: [
      '<strong>傷口處理為第一步</strong>：立即以肥皂及清水沖洗傷口 15 分鐘，再以優碘或 70% 酒精消毒，並儘速就醫評估',
      '<strong>暴露後・未曾接種</strong>：4 劑，第 0、3、7、14 天；第 1 劑應於咬傷後儘速施打，並依傷口分級評估是否併用免疫球蛋白',
      '<strong>暴露後・已完成暴露前接種</strong>：僅需 2 劑，第 0、3 天，<strong>不需併用免疫球蛋白</strong>',
      '<strong>台灣為狂犬病疫區</strong>：自 102（2013）年起於野生動物檢出狂犬病毒，以<strong>鼬獾</strong>為主、少數白鼻心，分布於南投、雲林、臺東、花蓮、嘉義、臺中、臺南、高雄、屏東部分鄉鎮之山區',
      '流浪犬貓監測結果均為陰性，惟仍不可排除個別風險',
      '1–6% 接種者出現注射部位疼痛、紅斑、腫脹或搔癢，少數出現頭痛、噁心等全身反應',
    ],
    public_note: '【給付方式】<strong>暴露後</strong>遭鼬獾、白鼻心、蝙蝠及臺東市錢鼠等<strong>野生哺乳類動物</strong>抓咬傷者，不限地點皆由健保給付疫苗及免疫球蛋白；遭家犬貓抓咬傷原則自費，若該動物於 10 日觀察期內出現疑似症狀、經動物防疫機關研判可疑，則改依健保給付；遭流浪犬貓或其他動物抓咬傷而要求接種者為自費。<strong>暴露前</strong>預防接種（旅遊、職業需求）為自費，須至旅遊醫學合約門診。<br>詳見：<a href="https://www.cdc.gov.tw/Category/QAPage/3xoWx2U2FGpCjF752cmKGA" target="_blank">CDC 狂犬病 Q&A</a>',
    contraindication: '對 neomycin 過敏者不建議接種，除非有高度暴露風險或需暴露後治療；<strong>暴露後接種無絕對禁忌</strong>（狂犬病致死率近 100%）',
    price: null,
  },
  {
    id: 'typhoid', icon: '🦠', name: '傷寒疫苗', en: 'Typhoid Vaccine',
    doses: '1劑（注射型）',
    schedule: '出發前至少2週完成接種',
    target: '前往傷寒流行地區（南亞、非洲、東南亞）',
    notes: [
      '注射型 Vi 多醣體疫苗（TYPHIM Vi，專案進口），單劑 0.5mL 肌肉或皮下注射',
      '<strong>接種後約 14 天產生保護力，可維持 2–3 年</strong>；持續處於高風險者每 3 年追加 1 劑',
      '保護力約 70%，非完美保護，旅途中仍須注意飲食與飲水衛生',
      '南亞感染風險最高，其次為東南亞、非洲、中南美洲及加勒比海地區；前往非觀光區、鄉村或衛生條件較差地區者尤應接種',
      '須至疾管署旅遊醫學合約醫院接種',
    ],
    contraindication: '<strong>未滿 2 歲</strong>；對疫苗成分嚴重過敏。免疫功能不全者、孕婦、發高燒或嚴重慢性病者應經評估或待病情穩定後接種',
    price: null,
  },
  {
    id: 'flu', icon: '🤧', name: '流感疫苗（成人）', en: 'Influenza Vaccine',
    doses: '每年 1 劑（9 歲以下初次接種者 2 劑）',
    schedule: '每年施打，建議 10 月前完成；秋冬接種計畫於每年 10/1 起分階段開打',
    target: '所有 6 個月以上民眾建議接種，尤其是高風險族群',
    notes: ['9 歲以下初次接種者須接 2 劑，間隔至少 4 週；9 歲以上 1 劑即可', '每年病毒株不同，需年年接種', '孕婦、幼兒、65 歲以上長者、慢性病人為優先族群'],
    public_note: '【公費對象（114 年起）】自 114/1/1 起公費流感疫苗已擴大全民接種，凡 6 個月以上具中華民國國民身分或持居留證者皆可接種，至疫苗用罄止。每年秋冬接種計畫於 10/1 起分階段優先服務高風險族群（醫事人員、65 歲以上長者、55 歲以上原住民、孕婦、學齡前幼兒、學生、高風險慢性病人 etc.），但全民皆可接種。<br>詳見：<a href="https://www.cdc.gov.tw/Category/MPage/JNTC9qza3F_rgt9sRHqV2Q" target="_blank">CDC 流感疫苗接種計畫</a>',
    contraindication: '對疫苗成分（含雞蛋蛋白）嚴重過敏；發燒中',
    price: null,
  },
  {
    id: 'yellowfever', icon: '🌡️', name: '黃熱病疫苗', en: 'Yellow Fever Vaccine',
    doses: '1劑（終身有效）',
    schedule: '出發前至少10天完成接種',
    target: '前往非洲或南美洲黃熱病流行地區者',
    notes: [
      '活性減毒疫苗；經研究證實具終生保護力',
      '<strong>國際預防接種證明書於接種後第 10 天生效</strong>；依 WHO 規定自 2016/7/11 起效期<strong>由 10 年改為終身有效</strong>，無須再追加',
      '許多非洲／南美洲國家入境時需出示黃熱病接種證明（小黃卡）',
      '<strong>限疾管署旅遊醫學合約醫院接種</strong>並於該處申請國際預防接種證明書',
    ],
    contraindication: '孕婦（特殊情況醫師評估）；免疫不全者；對雞蛋嚴重過敏',
    price: null,
  },
]

export const SPECIAL_POPULATIONS: SpecialPopulation[] = [
  {
    id: 'asplenia',
    icon: '🫀',
    name: '脾切除 / 無脾症',
    en: 'Asplenia / Hyposplenism',
    vaccines: [
      { name: '肺炎鏈球菌', type: 'priv', detail: '<strong>單劑 PCV20 或 PCV21</strong>（依 2024 ACIP 與台灣 2026 公費政策，已可單劑取代過去 PCV13→PPSV23 序貫）；先前已接種者依原時程銜接' },
      { name: 'B型嗜血桿菌\n(HiB)', type: 'priv', detail: '兒童時未完整接種者，<strong>終生補接種 1 劑</strong>' },
      { name: 'MenACWY\n(Menveo)', type: 'priv', detail: '<strong>2 劑，間隔 ≥ 8 週</strong>；之後<strong>每 5 年追加 1 劑</strong>' },
      { name: 'MenB\n(Bexsero)', type: 'priv', detail: '<strong>2 劑，間隔 ≥ 4 週</strong>；初次接種 1 年後追加 1 劑，之後<strong>每 2–3 年追加</strong>' },
      { name: '流感疫苗', type: 'pub', detail: '<strong>每年 1 劑</strong>非活性疫苗（公費全民）' },
    ],
    timing: [
      '<strong>擇期切脾：</strong>建議手術前 <strong>10–12 週</strong>開始接種，<strong>術前 14 天</strong>完成所有疫苗',
      '<strong>緊急切脾：</strong>術後第 <strong>7–14 天</strong>或出院當天即可開始接種（澳洲 Spleen Australia 建議第 7 天；ACIP 建議第 14 天，免疫原性較佳）',
      '<strong>化療 / 放療：</strong>治療結束後 <strong>3 個月</strong>再接種',
      '<strong>Rituximab：</strong>用藥後 <strong>6 個月</strong>再接種',
    ],
    warnings: [
      { text: '<strong>禁用活性減毒流感疫苗（LAIV，鼻噴劑型）</strong>', critical: true },
      { text: 'Menactra（MenACWY 另一廠牌）不可與 PCV 同時接種，需間隔 ≥ 4 週；Menveo / Nimenrix 則可同時' },
      { text: '若兒童時期已完整接種 PCV13 (2 歲前 4 劑)，不需再接種 PCV；但仍需依新政策銜接 PCV20 / PCV21' },
      { text: '請於致死性脾切除後感染（OPSI）高風險期警覺：術後兩年內為高峰、死亡率約 50%' },
    ],
    sources: [
      { text: '周志傑、林菀茹、廖再緯。成人脾臟切除者的疫苗接種。家庭醫學與基層醫療 2022;37(10):315-320。', url: '/assets/refs/splenectomy_vaccine_2022.pdf' },
      { text: 'CDC. Adult immunization schedule by medical condition and other indication (ACIP).', url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/adult-conditions.html' },
      { text: 'Kanhutu K, et al. Spleen Australia guidelines for the prevention of sepsis in patients with asplenia. Intern Med J 2017;47:848-55.' },
    ],
  },
  {
    id: 'ckd',
    icon: '🩺',
    name: 'CKD / 透析 / 腎移植',
    en: 'Chronic Kidney Disease / Dialysis / Kidney Transplant',
    vaccines: [
      { name: 'RSV 疫苗', type: 'priv', detail: '<strong>50 歲以上 CKD 或腎移植者建議接種</strong>；建議優先選擇<strong>含佐劑型 RSVPreF3（Arexvy）</strong>' },
      { name: '帶狀疱疹', type: 'priv', detail: '<strong>非活性重組疫苗（Shingrix）2 劑，間隔 2–6 個月</strong>；18 歲以上 CKD/透析/移植皆建議' },
      { name: '肺炎鏈球菌', type: 'pub/priv', detail: '<strong>單劑 PCV20 或 PCV21</strong>（2026 公費政策）；或既有 PCV13/15 + PPSV23 序貫' },
      { name: 'B 型肝炎', type: 'priv', detail: '<strong>透析/移植：</strong>Engerix-B 四劑 0/1/2/6 月（每劑 40 mcg）或 H-B-VAX II 三劑 0/1/6 月（每劑 40 mcg）。<strong>一般 CKD：</strong>用一般成人劑量（Engerix-B 20 mcg 或 H-B-VAX II 10 mcg）' },
      { name: '流感疫苗', type: 'pub', detail: '<strong>每年 1 劑</strong>；65 歲以上可<strong>優先考慮高劑量或含佐劑型</strong>流感疫苗' },
      { name: 'COVID-19', type: 'pub', detail: '<strong>每年 2 劑</strong>最新變異株疫苗，間隔原則 6 個月（高傳播時可縮短至 2 個月）' },
    ],
    timing: [
      '<strong>腎移植前：</strong>可於等待移植期間或<strong>術前 2 個月以前</strong>規劃接種；最後 1 劑應於<strong>術前 2 週</strong>完成',
      '<strong>腎移植後（若術前未完成）：</strong><strong>術後 6–12 個月</strong>、待免疫抑制劑使用穩定後再接種',
      '<strong>流感疫苗特例：</strong>移植後 <strong>1 個月即可</strong>接種（不必等到 6–12 個月）',
      'B 肝完整接種後 1–2 個月檢驗抗體；透析/移植者若 <strong>anti-HBs < 10 mIU/ml</strong>，可追加 1 劑',
    ],
    warnings: [
      { text: '<strong>禁用活性減毒疫苗於免疫低下者：</strong>包括活性減毒流感疫苗（LAIV）、活性減毒帶疱疫苗 Zostavax', critical: true },
      { text: 'B 肝 non-responder（兩輪接種後抗體仍 < 10）並非完全無保護，可能存在細胞免疫；臨床決策應個別評估' },
      { text: 'PCV20 / PCV21 在 CKD/移植族群直接證據有限，但 ACIP 與台灣腎臟學會 2025 共識皆支持使用' },
      { text: '透析開始後 <strong>2 年內</strong>接種帶疱疫苗保護效果較佳；移植病人盡可能於移植前接種' },
    ],
    sources: [
      { text: '台灣腎臟病患疫苗接種建議指引（台灣腎臟醫學會、感染症醫學會、移植醫學會聯合共識）。2025/12。ISBN 978-626-92619-0-1。', url: '/assets/refs/ckd_vaccine_consensus_2025.pdf' },
      { text: 'KDIGO Clinical Practice Guideline for the Care of Kidney Transplant Recipients.' },
      { text: 'ACIP Adult Immunization Schedule (kidney disease conditions).', url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/adult-conditions.html' },
    ],
  },
  {
    id: 'pregnancy',
    icon: '🤰',
    name: '懷孕',
    en: 'Pregnancy',
    vaccines: [
      { name: 'Tdap\n(百日咳)', type: 'priv', detail: '<strong>每次懷孕</strong>都要接種 1 劑，不論過去接種史。<strong>建議於懷孕 28–36 週</strong>接種，使母體抗體傳給胎兒效益最大。若孕期未接種，應於<strong>產後立即</strong>補種' },
      { name: '流感疫苗', type: 'pub', detail: '<strong>任何孕期</strong>皆可接種 1 劑（不活化疫苗）；孕婦為公費對象之一' },
      { name: 'COVID-19', type: 'pub', detail: '<strong>孕婦為公費接種對象</strong>，依當年度最新變異株疫苗接種' },
      { name: 'RSV 疫苗\n(RSVpreF, Abrysvo)', type: 'priv', detail: '<strong>懷孕 28–36 週</strong>接種 1 劑，為新生兒（出生至 6 個月）提供被動免疫；FDA 限制適用於 32–36 週以避免極早產風險' },
    ],
    timing: [
      '<strong>Tdap：</strong>每次懷孕都要打 1 劑（不是「一輩子 1 劑」），最佳接種週數 <strong>28–36 週</strong>',
      '<strong>RSV pre-F：</strong>建議 <strong>28–36 週</strong>；若與 Tdap 同時考量，可先打 RSV，<strong>間隔 ≥ 14 天</strong>後再打 Tdap，避開免疫干擾',
      '<strong>流感：</strong>任何孕期皆可，不必等特定週數',
      '<strong>產後：</strong>若孕期未接種 Tdap，<strong>離院前</strong>立即補種；MMR/水痘等活疫苗也可於產後接種',
    ],
    warnings: [
      { text: '<strong>禁用活性減毒疫苗：</strong>MMR（麻疹/腮腺炎/德國麻疹）、水痘、HPV、LAIV 鼻噴流感、活性帶疱疫苗皆禁用於懷孕', critical: true },
      { text: '<strong>建議孕前 1 個月以上</strong>完成 MMR、水痘等活疫苗接種；接種後避孕 1 個月' },
      { text: 'HPV 疫苗孕期不建議接種；若接種後才發現懷孕，可待產後補完剩餘劑次（不需引產）' },
      { text: '建議嬰兒主要照顧者（父親、祖父母、保母）也自費接種 1 劑 Tdap，形成「包覆免疫（cocoon strategy）」' },
    ],
    sources: [
      { text: '衛生福利部疾病管制署：破傷風、白喉及百日咳相關疫苗接種建議（孕婦每次懷孕第 28–36 週自費接種 1 劑 Tdap）。', url: 'https://www.cdc.gov/Category/Page/MXy9TPGNNXMS_rzotG7xzQ' },
      { text: '衛生福利部疾病管制署：孕婦預防接種建議（流感、新冠、RSV）。', url: 'https://www.cdc.gov.tw/Category/List/TcKynGco9G59NR02tsMyaQ' },
      { text: '台灣兒童感染症醫學會：呼吸道細胞融合病毒疫苗使用建議（專業版）。', url: 'https://www.pids.org.tw/index.php?route=education%2Feducation&path=137' },
    ],
  },
]
