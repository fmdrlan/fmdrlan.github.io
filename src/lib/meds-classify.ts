// 學名 → 藥理分類、以及高齡潛在不適當用藥（AGS 2023 Beers Criteria）對照。
// 比對方式：學名轉小寫後做子字串比對，複方藥（如 Amlodipine/Valsartan）會比對到多個分類。

export const GROUP_ORDER = [
  '心血管',
  '內分泌與代謝',
  '腸胃',
  '神經與精神',
  '止痛與消炎',
  '呼吸與過敏',
  '泌尿',
  '骨骼與營養補充',
  '抗感染',
  '其他',
] as const

export type DrugGroup = (typeof GROUP_ORDER)[number]

interface ClassDef {
  group: DrugGroup
  cls: string
  keys: string[]
}

const CLASSES: ClassDef[] = [
  // ── 心血管 ──
  { group: '心血管', cls: 'Statin', keys: ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'pitavastatin', 'lovastatin', 'fluvastatin'] },
  { group: '心血管', cls: '降血脂（非 statin）', keys: ['ezetimibe', 'fenofibrate', 'gemfibrozil', 'bezafibrate', 'niacin', 'cholestyramine'] },
  { group: '心血管', cls: 'ACEI', keys: ['captopril', 'enalapril', 'lisinopril', 'ramipril', 'perindopril', 'fosinopril', 'imidapril'] },
  { group: '心血管', cls: 'ARB', keys: ['valsartan', 'losartan', 'irbesartan', 'candesartan', 'telmisartan', 'olmesartan', 'azilsartan'] },
  { group: '心血管', cls: 'ARNI', keys: ['sacubitril'] },
  { group: '心血管', cls: 'CCB', keys: ['amlodipine', 'felodipine', 'nifedipine', 'lercanidipine', 'benidipine', 'diltiazem', 'verapamil', 'nicardipine'] },
  { group: '心血管', cls: 'β-blocker', keys: ['bisoprolol', 'metoprolol', 'carvedilol', 'propranolol', 'atenolol', 'nebivolol', 'labetalol'] },
  { group: '心血管', cls: 'α-blocker（降壓）', keys: ['doxazosin', 'terazosin', 'prazosin'] },
  { group: '心血管', cls: '利尿劑', keys: ['hydrochlorothiazide', 'indapamide', 'chlorthalidone', 'furosemide', 'torsemide', 'spironolactone', 'eplerenone', 'amiloride'] },
  { group: '心血管', cls: '抗血小板', keys: ['aspirin', 'clopidogrel', 'ticagrelor', 'prasugrel', 'dipyridamole', 'cilostazol'] },
  { group: '心血管', cls: '抗凝血', keys: ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'] },
  { group: '心血管', cls: '心律與心衰', keys: ['digoxin', 'amiodarone', 'dronedarone', 'ivabradine', 'propafenone', 'mexiletine'] },
  { group: '心血管', cls: '硝酸鹽', keys: ['isosorbide', 'nitroglycerin', 'trimetazidine'] },

  // ── 內分泌與代謝 ──
  { group: '內分泌與代謝', cls: 'Metformin', keys: ['metformin'] },
  { group: '內分泌與代謝', cls: 'Sulfonylurea', keys: ['glimepiride', 'gliclazide', 'glipizide', 'glibenclamide', 'glyburide', 'chlorpropamide'] },
  { group: '內分泌與代謝', cls: 'DPP-4 抑制劑', keys: ['sitagliptin', 'linagliptin', 'saxagliptin', 'vildagliptin', 'alogliptin'] },
  { group: '內分泌與代謝', cls: 'SGLT2 抑制劑', keys: ['empagliflozin', 'dapagliflozin', 'canagliflozin', 'ertugliflozin'] },
  { group: '內分泌與代謝', cls: 'GLP-1 受體促效劑', keys: ['semaglutide', 'dulaglutide', 'liraglutide', 'tirzepatide', 'exenatide'] },
  { group: '內分泌與代謝', cls: '其他降血糖', keys: ['pioglitazone', 'acarbose', 'repaglinide', 'nateglinide', 'insulin'] },
  { group: '內分泌與代謝', cls: '甲狀腺', keys: ['levothyroxine', 'methimazole', 'propylthiouracil', 'thyroxine'] },
  { group: '內分泌與代謝', cls: '痛風', keys: ['allopurinol', 'febuxostat', 'benzbromarone', 'colchicine', 'probenecid'] },

  // ── 腸胃 ──
  { group: '腸胃', cls: 'PPI / P-CAB', keys: ['omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole', 'rabeprazole', 'dexlansoprazole', 'vonoprazan'] },
  { group: '腸胃', cls: 'H2 阻斷劑', keys: ['famotidine', 'ranitidine', 'cimetidine', 'nizatidine'] },
  { group: '腸胃', cls: '制酸與黏膜保護', keys: ['magnesium oxide', 'aluminum hydroxide', 'sucralfate', 'misoprostol', 'alginic', 'oxethazaine', 'sodium bicarbonate'] },
  { group: '腸胃', cls: '瀉劑', keys: ['sennoside', 'senna', 'bisacodyl', 'lactulose', 'psyllium', 'polyethylene glycol', 'macrogol', 'castor oil', 'naldemedine', 'magnesium citrate'] },
  { group: '腸胃', cls: '止瀉與腸道', keys: ['loperamide', 'diosmectite', 'racecadotril', 'mesalazine', 'rifaximin'] },
  { group: '腸胃', cls: '促蠕動與制吐', keys: ['mosapride', 'domperidone', 'metoclopramide', 'itopride', 'ondansetron'] },
  { group: '腸胃', cls: '解痙', keys: ['hyoscine', 'hyoscyamine', 'dicyclomine', 'mebeverine', 'pinaverium', 'trimebutine'] },
  { group: '腸胃', cls: '消脹氣與消化酵素', keys: ['simethicone', 'pancreatin', 'ursodeoxycholic', 'silymarin'] },

  // ── 神經與精神 ──
  { group: '神經與精神', cls: 'Benzodiazepine', keys: ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'estazolam', 'bromazepam', 'midazolam', 'flunitrazepam', 'triazolam', 'oxazepam', 'nitrazepam', 'fludiazepam'] },
  { group: '神經與精神', cls: 'Z-drug 安眠', keys: ['zolpidem', 'zopiclone', 'eszopiclone', 'zaleplon'] },
  { group: '神經與精神', cls: 'SSRI / SNRI', keys: ['fluoxetine', 'sertraline', 'escitalopram', 'paroxetine', 'citalopram', 'venlafaxine', 'duloxetine', 'fluvoxamine', 'vortioxetine'] },
  { group: '神經與精神', cls: '其他抗憂鬱', keys: ['mirtazapine', 'trazodone', 'bupropion', 'agomelatine'] },
  { group: '神經與精神', cls: '三環抗憂鬱（TCA）', keys: ['amitriptyline', 'nortriptyline', 'imipramine', 'doxepin', 'clomipramine'] },
  { group: '神經與精神', cls: '抗精神病', keys: ['quetiapine', 'risperidone', 'olanzapine', 'haloperidol', 'aripiprazole', 'sulpiride', 'paliperidone', 'amisulpride', 'clozapine'] },
  { group: '神經與精神', cls: '抗癲癇與神經痛', keys: ['valproate', 'valproic', 'carbamazepine', 'oxcarbazepine', 'levetiracetam', 'phenytoin', 'lamotrigine', 'topiramate', 'gabapentin', 'pregabalin'] },
  { group: '神經與精神', cls: '失智症', keys: ['donepezil', 'rivastigmine', 'memantine', 'galantamine'] },
  { group: '神經與精神', cls: '巴金森氏症', keys: ['levodopa', 'pramipexole', 'ropinirole', 'entacapone', 'amantadine', 'trihexyphenidyl', 'benztropine', 'rasagiline', 'selegiline'] },
  { group: '神經與精神', cls: '暈眩與腦循環', keys: ['betahistine', 'dimenhydrinate', 'flunarizine', 'cinnarizine', 'ginkgo'] },

  // ── 止痛與消炎 ──
  { group: '止痛與消炎', cls: 'Acetaminophen', keys: ['acetaminophen', 'paracetamol'] },
  { group: '止痛與消炎', cls: 'NSAID', keys: ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'celecoxib', 'etoricoxib', 'indomethacin', 'ketorolac', 'mefenamic', 'flurbiprofen', 'piroxicam', 'sulindac', 'nabumetone'] },
  { group: '止痛與消炎', cls: '鴉片類', keys: ['tramadol', 'codeine', 'morphine', 'fentanyl', 'oxycodone', 'buprenorphine', 'meperidine', 'pethidine'] },
  { group: '止痛與消炎', cls: '肌肉鬆弛劑', keys: ['methocarbamol', 'chlorzoxazone', 'eperisone', 'baclofen', 'tizanidine', 'cyclobenzaprine', 'orphenadrine', 'carisoprodol'] },
  { group: '止痛與消炎', cls: 'DMARD', keys: ['methotrexate', 'hydroxychloroquine', 'sulfasalazine', 'leflunomide', 'azathioprine'] },
  { group: '止痛與消炎', cls: '類固醇', keys: ['prednisolone', 'prednisone', 'methylprednisolone', 'dexamethasone', 'hydrocortisone', 'deflazacort'] },

  // ── 呼吸與過敏 ──
  { group: '呼吸與過敏', cls: '第一代抗組織胺', keys: ['diphenhydramine', 'chlorpheniramine', 'hydroxyzine', 'cyproheptadine', 'promethazine', 'brompheniramine'] },
  { group: '呼吸與過敏', cls: '第二代抗組織胺', keys: ['cetirizine', 'levocetirizine', 'loratadine', 'desloratadine', 'fexofenadine', 'bilastine', 'ebastine'] },
  { group: '呼吸與過敏', cls: '支氣管擴張與吸入', keys: ['salbutamol', 'albuterol', 'terbutaline', 'formoterol', 'salmeterol', 'tiotropium', 'ipratropium', 'indacaterol', 'umeclidinium', 'budesonide', 'fluticasone', 'beclomethasone'] },
  { group: '呼吸與過敏', cls: '其他呼吸道', keys: ['theophylline', 'montelukast', 'acetylcysteine', 'ambroxol', 'bromhexine', 'dextromethorphan', 'procaterol'] },

  // ── 泌尿 ──
  { group: '泌尿', cls: '攝護腺 α-blocker', keys: ['tamsulosin', 'alfuzosin', 'silodosin'] },
  { group: '泌尿', cls: '5α 還原酶抑制劑', keys: ['finasteride', 'dutasteride'] },
  { group: '泌尿', cls: '膀胱過動', keys: ['solifenacin', 'tolterodine', 'oxybutynin', 'mirabegron', 'trospium', 'flavoxate'] },
  { group: '泌尿', cls: '其他泌尿', keys: ['sildenafil', 'tadalafil', 'desmopressin', 'phenazopyridine'] },

  // ── 骨骼與營養補充 ──
  { group: '骨骼與營養補充', cls: '骨鬆用藥', keys: ['alendronate', 'risedronate', 'zoledronic', 'ibandronate', 'raloxifene', 'denosumab', 'teriparatide', 'romosozumab'] },
  { group: '骨骼與營養補充', cls: '鈣與維生素 D', keys: ['calcium carbonate', 'calcium citrate', 'cholecalciferol', 'calcitriol', 'alfacalcidol', 'ergocalciferol'] },
  { group: '骨骼與營養補充', cls: '維生素與礦物質', keys: ['folic acid', 'mecobalamin', 'methylcobalamin', 'cyanocobalamin', 'vitamin', 'ferrous', 'iron', 'potassium chloride', 'zinc', 'magnesium lactate', 'thiamine', 'pyridoxine'] },

  // ── 抗感染 ──
  { group: '抗感染', cls: '抗生素', keys: ['amoxicillin', 'augmentin', 'cephalexin', 'cefixime', 'cefuroxime', 'azithromycin', 'clarithromycin', 'erythromycin', 'levofloxacin', 'ciprofloxacin', 'moxifloxacin', 'doxycycline', 'minocycline', 'clindamycin', 'metronidazole', 'nitrofurantoin', 'trimethoprim', 'sulfamethoxazole', 'penicillin'] },
  { group: '抗感染', cls: '抗病毒與抗黴菌', keys: ['acyclovir', 'valacyclovir', 'oseltamivir', 'fluconazole', 'itraconazole', 'terbinafine', 'nirmatrelvir'] },
]

export interface Classification {
  group: DrugGroup
  classes: string[]
}

const norm = (s: string) => s.toLowerCase().replace(/\[.*?\]/g, ' ')

export function classify(generic: string): Classification {
  const g = norm(generic)
  const hits = CLASSES.filter((c) => c.keys.some((k) => g.includes(k)))
  if (!hits.length) return { group: '其他', classes: [] }
  return { group: hits[0].group, classes: [...new Set(hits.map((h) => h.cls))] }
}

// ── AGS 2023 Beers Criteria：高齡（≥65 歲）潛在不適當用藥 ──
export interface BeersFlag {
  label: string
  reason: string
}

const BEERS: { keys: string[]; label: string; reason: string }[] = [
  { keys: ['diphenhydramine', 'chlorpheniramine', 'hydroxyzine', 'cyproheptadine', 'promethazine', 'brompheniramine', 'dimenhydrinate'],
    label: '第一代抗組織胺', reason: '強抗膽鹼性，易致意識混亂、口乾、便秘、尿滯留' },
  { keys: ['alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'estazolam', 'bromazepam', 'flunitrazepam', 'triazolam', 'oxazepam', 'nitrazepam', 'fludiazepam'],
    label: 'Benzodiazepine', reason: '認知功能下降、譫妄、跌倒與骨折風險上升' },
  { keys: ['zolpidem', 'zopiclone', 'eszopiclone', 'zaleplon'],
    label: 'Z-drug 安眠藥', reason: '與 BZD 類似的譫妄、跌倒與骨折風險' },
  { keys: ['amitriptyline', 'imipramine', 'doxepin', 'clomipramine', 'nortriptyline'],
    label: '三環抗憂鬱劑', reason: '強抗膽鹼性、鎮靜、姿勢性低血壓' },
  { keys: ['paroxetine'], label: 'Paroxetine', reason: 'SSRI 中抗膽鹼性最強；另有低血鈉風險' },
  { keys: ['quetiapine', 'risperidone', 'olanzapine', 'haloperidol', 'aripiprazole', 'sulpiride', 'paliperidone', 'amisulpride'],
    label: '抗精神病藥', reason: '用於失智行為症狀時中風與死亡率上升，非藥物處置無效才用' },
  { keys: ['glibenclamide', 'glyburide', 'chlorpropamide', 'glimepiride'],
    label: '長效 Sulfonylurea', reason: '低血糖風險高且不易察覺' },
  { keys: ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'indomethacin', 'ketorolac', 'mefenamic', 'flurbiprofen', 'piroxicam', 'sulindac'],
    label: 'NSAID（長期使用）', reason: '消化道出血與潰瘍、腎功能惡化、血壓上升' },
  { keys: ['omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole', 'rabeprazole', 'dexlansoprazole'],
    label: 'PPI（超過 8 週）', reason: '困難梭菌感染、骨質流失與骨折風險；長期使用應評估是否仍需要' },
  { keys: ['methocarbamol', 'chlorzoxazone', 'cyclobenzaprine', 'orphenadrine', 'carisoprodol'],
    label: '肌肉鬆弛劑', reason: '抗膽鹼性、鎮靜、跌倒風險，高齡耐受性差' },
  { keys: ['metoclopramide'], label: 'Metoclopramide', reason: '錐體外症候群與遲發性運動障礙' },
  { keys: ['digoxin'], label: 'Digoxin', reason: '不建議作為心房顫動或心衰竭第一線；劑量避免超過 0.125 mg/day' },
  { keys: ['doxazosin', 'terazosin', 'prazosin'], label: '週邊 α1-blocker（降壓用）', reason: '姿勢性低血壓，不建議作為降壓第一線' },
  { keys: ['oxybutynin', 'tolterodine', 'flavoxate'], label: '抗膽鹼型膀胱用藥', reason: '抗膽鹼負擔高，認知影響與尿滯留' },
  { keys: ['dicyclomine', 'hyoscyamine', 'hyoscine', 'scopolamine'], label: '抗膽鹼解痙劑', reason: '抗膽鹼性強，效益有限' },
  { keys: ['trihexyphenidyl', 'benztropine'], label: '抗膽鹼型抗巴金森藥', reason: '不建議用於預防錐體外症狀' },
  { keys: ['amiodarone'], label: 'Amiodarone', reason: '不建議作為心房顫動第一線，甲狀腺與肺毒性' },
  { keys: ['nitrofurantoin'], label: 'Nitrofurantoin', reason: 'CrCl <30 應避免；長期抑菌使用有肺與肝毒性' },
  { keys: ['dipyridamole'], label: '口服短效 Dipyridamole', reason: '姿勢性低血壓，且有更好的替代藥' },
  { keys: ['desmopressin'], label: 'Desmopressin（夜尿）', reason: '低血鈉風險高' },
  { keys: ['megestrol'], label: 'Megestrol', reason: '效益有限，血栓風險上升' },
  { keys: ['theophylline'], label: 'Theophylline', reason: '治療區間窄，與多種藥物交互作用' },
]

export function beersFlags(generic: string): BeersFlag[] {
  const g = norm(generic)
  return BEERS.filter((b) => b.keys.some((k) => g.includes(k))).map(({ label, reason }) => ({ label, reason }))
}
