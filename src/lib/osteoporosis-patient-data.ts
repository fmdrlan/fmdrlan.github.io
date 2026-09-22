// Faithful port of osteoporosis.html's #tab-patient data (handout sheet
// content per drug) and date-math helpers, as plain data + pure functions.

export const PATIENT_COMMON: string[] = [
  '每天補充足夠的鈣與維生素 D。除非醫師另有指示，一般建議鈣 1000–1200 毫克、維生素 D 800–1000 IU。',
  '規律做負重運動與平衡訓練，例如快走、原地踏步、扶著椅背練單腳站。避免彎腰搬重物。',
  '把家裡的地面整理好：移開電線和雜物、浴室加止滑墊與扶手、夜間留一盞小燈。跌倒是骨折最常見的原因。',
]

const DENTAL = '看牙醫前，請主動告訴牙醫師您正在使用骨質疏鬆藥物。需要拔牙、植牙或牙周手術時，請先讓開藥的醫師知道。'
const LOWCA = '手腳或嘴唇發麻、刺痛，肌肉抽筋或抽搐'
const ONJ = '下巴疼痛、牙齦腫痛，或嘴巴裡的傷口一直不癒合'
const AFF = '大腿或鼠蹊部持續疼痛，走路時更明顯'

export type CycleInfo =
  | { type: 'weekly' }
  | { type: 'daily'; courseMonths?: number; courseLabel?: string }
  | { type: 'months'; n: number; label: string; courseMonths?: number; courseLabel?: string }

export interface PatientDrug {
  id: string
  zh: string
  en: string
  tag: string
  what: string
  usage: string
  steps?: string[]
  keys: string[]
  common: string[]
  urgent: string[]
  cycle: CycleInfo
}

export const PATIENT_DRUGS: PatientDrug[] = [
  {
    id: 'alen', zh: '福善美保骨錠', en: 'Fosamax Plus（alendronate + 維生素 D₃）',
    tag: '每週口服',
    what: '減少骨質流失的口服藥，每週吃一次。同時含有維生素 D₃。',
    usage: '每週固定一天，早上起床後、吃第一口東西前 30 分鐘，一次 1 錠',
    steps: [
      '早上起床後先吃藥，這時還不能吃任何東西、也不能喝白開水以外的飲料。',
      '用 <b>200–300 毫升（約一整杯）白開水</b>整顆吞下。不可以配牛奶、豆漿、果汁、茶或礦泉水，這些都會讓藥效變差。',
      '<b>不可以咬碎、磨粉或剝半</b>，藥粉會刺激喉嚨和食道。',
      '吃完後 <b>30 分鐘內保持坐直或站立，不可以躺下</b>。',
      '滿 30 分鐘後，才可以吃早餐、喝飲料或吃其他藥。',
    ],
    keys: [
      '每週固定同一天服用。挑一個您最容易記得的日子，寫在日曆或設定手機提醒。',
      '鈣片、胃藥（制酸劑）和其他口服藥，都要跟這顆藥<b>間隔至少 30 分鐘</b>。',
      '這顆藥本身已含維生素 D₃。如果您還想自己買維生素 D 補充品，請先告訴醫師。',
      DENTAL,
    ],
    common: ['脹氣、腹痛、腹瀉、便秘、消化不良。多數輕微，持續或加重請回診告知。'],
    urgent: ['<b>吞東西會痛、吞不下去、胸口灼熱或胸骨後方疼痛</b>（可能是食道受傷）', AFF, ONJ],
    cycle: { type: 'weekly' },
  },
  {
    id: 'rise', zh: '瑞骨卓', en: 'Reosteo（risedronate 150 毫克）',
    tag: '每月口服',
    what: '減少骨質流失的口服藥，每個月只吃一次。',
    usage: '每月固定一天，早餐前 30 分鐘空腹，一次 1 錠',
    steps: [
      '當天第一餐之前 30 分鐘，空腹服用。',
      '用 <b>200–250 毫升白開水</b>整顆吞下，不可以配其他飲料。',
      '<b>不可以咬碎或磨粉</b>，磨粉容易刺激黏膜甚至灼傷食道。',
      '吃完後 <b>30 分鐘內保持坐直或站立，不可以躺下</b>。',
    ],
    keys: [
      '<b>一個月只吃一顆</b>。因為間隔很長，很容易忘記，請把日期寫在日曆上，並在手機設定每月提醒。',
      '如果忘記吃，想起來時若距離下次服藥日還有 7 天以上，可於隔天早上補服一次；若已接近下次服藥日，就直接等下次，<b>不可以一次吃兩顆</b>。',
      '鈣片、胃藥和其他口服藥要間隔至少 30 分鐘。',
      DENTAL,
    ],
    common: ['腹痛、腹瀉、噁心、頭痛、關節痛、背痛。多數輕微。'],
    urgent: ['<b>吞東西會痛、吞不下去、胸口灼熱或胸骨後方疼痛</b>（可能是食道受傷）', AFF, ONJ],
    cycle: { type: 'months', n: 1, label: '下次服藥日' },
  },
  {
    id: 'zole', zh: '骨力強注射液', en: 'Aclasta（zoledronic acid 5 毫克）',
    tag: '每年靜脈注射',
    what: '減少骨質流失的點滴注射，一年打一次。',
    usage: '每 12 個月一次，靜脈點滴約 15 分鐘以上',
    keys: [
      '<b>打針前後多喝水</b>（除非醫師限制您的喝水量）。水分充足可以減少不適，也保護腎臟。',
      '<b>打完後 1–3 天可能會發燒、肌肉痠痛、關節痛、頭痛、疲倦</b>，像感冒一樣。這是常見反應，通常兩三天內自己會好。可以依醫師指示服用普拿疼（acetaminophen）緩解。',
      '這些反應<b>第二次以後通常會減輕很多</b>，不需要因此停藥。',
      '一年才打一次，很容易忘記。請把下次日期寫在日曆上。',
      DENTAL,
    ],
    common: ['注射部位紅腫疼痛、噁心、嘔吐、疲倦、骨頭痠痛。'],
    urgent: [LOWCA + '（可能是血鈣過低）', '<b>發燒超過 3 天，或體溫持續高於 38.5°C</b>', AFF, ONJ],
    cycle: { type: 'months', n: 12, label: '下次施打日' },
  },
  {
    id: 'ralo', zh: '鈣穩錠', en: 'Evista（raloxifene 60 毫克）',
    tag: '每日口服',
    what: '減少骨質流失的口服藥，每天吃一次。只適用於停經後的女性。',
    usage: '每天 1 錠，飯前飯後都可以，不受吃飯影響',
    keys: [
      '<b>如果要開刀、需要長時間臥床，或要長途搭車、搭飛機，請提前告訴醫師。</b>通常需要提前至少 3 天停藥，因為長時間不活動加上這個藥，會增加血栓的風險。恢復正常活動後再開始吃。',
      '長途旅行時記得每隔一段時間起來走動、多喝水、避免翹腳太久。',
      '這個藥不可以和口服的荷爾蒙補充療法一起使用。如果您有在看婦產科拿荷爾蒙藥，請告訴醫師。',
      '每天固定一個時間吃，例如早餐後，比較不會忘記。',
    ],
    common: ['熱潮紅（臉部發熱）、小腿抽筋、腳部水腫。多數會隨時間減輕。'],
    urgent: [
      '<b>單側小腿或大腿腫脹、發熱、疼痛</b>（可能是深部靜脈栓塞）',
      '<b>突然喘不過氣、胸痛、咳血</b>（可能是肺栓塞）',
      '<b>突然單側手腳無力、臉歪嘴斜、講話不清楚、視力改變</b>（可能是中風）',
    ],
    cycle: { type: 'daily' },
  },
  {
    id: 'deno', zh: '保骼麗注射液', en: 'Prolia（denosumab 60 毫克）',
    tag: '每半年皮下注射',
    what: '減少骨質流失的皮下注射，每 6 個月打一針。',
    usage: '每 6 個月一針，皮下注射於上臂、大腿或腹部',
    keys: [
      '<b>這個藥絕對不可以自己停掉。</b>停藥之後骨質流失會反彈，有可能在幾個月內造成多根脊椎骨折。如果因為任何原因需要停藥，醫師會安排接續的藥物，請務必先回診討論。',
      '<b>時間到一定要回來打。</b>如果錯過了，請盡快回診補打，不要等到下一次。補打之後，再從補打那天重新計算 6 個月。',
      '每天要補充足夠的鈣（至少 1000 毫克）和維生素 D（至少 400 IU）。這不是可有可無的，是為了避免血鈣過低。',
      '如果您有<b>腎臟病或正在洗腎</b>，打針前後需要定期抽血驗血鈣，請不要自行跳過抽血或回診。',
      DENTAL + '不要為了看牙自行延後打針，請先和醫師討論時間安排。',
    ],
    common: ['背痛、肌肉骨骼痠痛、皮疹、腹瀉、疲倦。'],
    urgent: [LOWCA + '（<b>可能是血鈣過低，這是最需要注意的狀況</b>）', ONJ, AFF, '注射部位紅腫熱痛擴大、合併發燒（可能是感染）'],
    cycle: { type: 'months', n: 6, label: '下次施打日' },
  },
  {
    id: 'teri', zh: '骨穩／艾歐骨得注射液', en: 'Forteo / Alvosteo（teriparatide 20 微克）',
    tag: '每日皮下注射',
    what: '促進新骨生成的皮下注射，每天自己打一針。療程有時間限制。',
    usage: '每天 1 次，20 微克，皮下注射於大腿或腹部',
    keys: [
      '<b>藥品要放冰箱冷藏（2–8°C），不可以冷凍</b>。使用中的那支也要放冰箱，原包裝避光保存，要用時再拆。',
      '注射前<b>不需要排空氣</b>。',
      '<b>前幾次注射建議坐著或躺著進行</b>，因為可能出現頭暈或心悸。如果有這些情形，先坐下或躺下休息，等症狀緩解再起身。',
      '每天固定同一個時間打，可以設鬧鐘提醒。每次<b>更換注射部位</b>，不要一直打在同一個點。',
      '<b>這個療程有時間限制，一般不超過 24 個月。</b>療程結束後一定要接續其他骨質疏鬆藥物，否則好不容易增加的骨密度會很快流失。請在療程快結束前回診安排。',
    ],
    common: ['頭暈、噁心、頭痛、關節痛、小腿抽筋、注射部位紅腫疼痛。'],
    urgent: [
      '<b>持續噁心嘔吐、異常口渴、一直想上廁所、意識混亂</b>（可能是血鈣過高）',
      '<b>暈倒或差點暈倒</b>',
      '腰部或側腹劇烈疼痛、血尿（可能是尿路結石）',
    ],
    cycle: { type: 'daily', courseMonths: 24, courseLabel: '療程預計結束' },
  },
  {
    id: 'romo', zh: '益穩挺注射液', en: 'Evenity（romosozumab 105 毫克）',
    tag: '每月皮下注射',
    what: '同時促進新骨生成、減少骨質流失的皮下注射。每月一次，固定 12 個月。',
    usage: '每個月一次，一次 2 針（同一次打完），連續 12 個月',
    keys: [
      '<b>藥品從冰箱拿出來後，先放室溫回溫至少 30 分鐘再打</b>，可以明顯減少注射時的不適。<b>不要用力搖晃</b>藥劑。',
      '每次<b>更換注射部位</b>（大腿、肚子、上臂外側）。避開肚臍周圍約兩個手掌寬的範圍，也避開會痛、瘀青、有硬塊、疤痕或妊娠紋的皮膚。',
      '<b>這個療程固定 12 個月。</b>結束後一定要接續其他骨質疏鬆藥物，否則增加的骨密度會很快流失。請在療程快結束前回診安排。',
      '如果錯過施打時間，請盡快回診補打；之後從補打那天重新計算每個月的時間。',
      '每天補充足夠的鈣與維生素 D。',
      '<b>這個藥可能增加心臟血管疾病的風險。</b>如果您曾經發生過心肌梗塞或中風，請一定要告訴醫師。治療期間若發生，也要立即回報。',
    ],
    common: ['關節痛、頭痛、肌肉痙攣、注射部位反應。'],
    urgent: [
      '<b>胸悶、胸痛、冒冷汗、喘不過氣</b>（可能是心肌梗塞）',
      '<b>突然單側手腳無力、臉歪嘴斜、講話不清楚、視力突然模糊</b>（可能是中風）',
      LOWCA + '（可能是血鈣過低）',
      ONJ,
    ],
    cycle: { type: 'months', n: 1, label: '下次施打日', courseMonths: 12, courseLabel: '療程預計結束' },
  },
]

// ── 日期工具 ──
const WD = ['日', '一', '二', '三', '四', '五', '六']
export const fmtDateLong = (d: Date) => `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（星期${WD[d.getDay()]}）`
export const fmtDateShort = (d: Date) => `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  const day = r.getDate()
  r.setDate(1)
  r.setMonth(r.getMonth() + n)
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()
  r.setDate(Math.min(day, last))
  return r
}

export function parseDateInput(v: string): Date | null {
  if (!v) return null
  const [y, m, dd] = v.split('-').map(Number)
  if (!y || !m || !dd) return null
  return new Date(y, m - 1, dd)
}

export interface DateBox {
  lbl: string
  val: string
  strong: boolean
}

export function datesFor(d: PatientDrug, base: Date | null): DateBox[] {
  const out: DateBox[] = []
  if (!base) return out
  const c = d.cycle
  if (c.type === 'months') {
    out.push({ lbl: c.label, val: fmtDateLong(addMonths(base, c.n)), strong: true })
  } else if (c.type === 'weekly') {
    out.push({ lbl: '固定服藥日', val: `每週星期${WD[base.getDay()]}`, strong: true })
  } else if (c.type === 'daily') {
    out.push({ lbl: '服用／注射方式', val: '每天一次，不要中斷', strong: true })
  }
  if ('courseMonths' in c && c.courseMonths) {
    out.push({
      lbl: c.courseLabel ?? '',
      val: `${fmtDateShort(addMonths(base, c.courseMonths))}（請在此之前回診安排接續藥物）`,
      strong: false,
    })
  }
  return out
}
