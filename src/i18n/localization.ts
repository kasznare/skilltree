import {
  domainGuides as baseDomainGuides,
  stagePracticePrompts as baseStagePracticePrompts,
  type DomainGuide,
} from '../data/domainGuides'
import {
  domains as baseDomains,
  skills as baseSkills,
  stages as baseStages,
  treeMeta as baseTreeMeta,
  type Domain,
  type DomainId,
  type SkillAspectId,
  type SkillNode,
  type Stage,
  type StageId,
} from '../data/skillTree'

export type Language = 'en' | 'hu'

type ViewModeId = 'world' | 'path' | 'node'
type RelationLabelId = 'selected' | 'direct-before' | 'direct-next' | 'ancestor' | 'descendant' | 'matched'
type GraphRoleId = 'root' | 'keystone' | 'bridge' | 'leaf' | 'ordinary'

type SkillCopy = Pick<SkillNode, 'title' | 'summary' | 'outcomes' | 'tags'>
type DomainCopy = Pick<Domain, 'label' | 'shortLabel' | 'description'>
type StageCopy = Pick<Stage, 'title' | 'age' | 'focus'>
type DomainGuideCopy = Omit<DomainGuide, 'domain'>
type LocalizationCopy = {
  ui: UiCopy
  treeMeta: typeof baseTreeMeta
  domains: Record<DomainId, DomainCopy>
  stages: Record<StageId, StageCopy>
  skills: Record<string, SkillCopy>
  domainGuides: Record<DomainId, DomainGuideCopy>
  stagePracticePrompts: Record<StageId, string[]>
  viewModes: Array<{ id: ViewModeId; label: string }>
  relationLabels: Record<RelationLabelId, string>
  roleLabels: Record<GraphRoleId, string>
}

export type UiCopy = {
  locale: string
  documentTitle: string
  heading: string
  languageLabel: string
  languageAria: string
  treeSummaryAria: string
  metrics: {
    skills: string
    links: string
    domains: string
    ageBands: string
  }
  searchLabel: string
  searchPlaceholder: string
  mapViewAria: string
  clear: string
  ageFocusAria: string
  fullTimeline: string
  domainFocusAria: string
  allDomains: string
  resultCount: (matches: number, total: number) => string
  kidProfilesAria: string
  defaultProfileName: string
  progressSummary: (completed: number, ready: number) => string
  progressLabel: (name: string) => string
  activeChildAgeBand: string
  newChildName: string
  newChildAgeBand: string
  addChildPlaceholder: string
  add: string
  treeAria: string
  growthAtlas: string
  mapPanel: Record<ViewModeId, string>
  selectedSkillAria: string
  introImageLabel: (domain: string) => string
  completeFor: (name: string) => string
  completedFor: (name: string) => string
  detail: {
    age: string
    role: string
    lineage: string
    nodes: string
    unlocks: string
    prereqs: string
    root: string
    domainMap: string
    outcomes: string
    waysToBuild: string
    beforeThis: string
    unlocksNext: string
    noLinkedSkills: string
    tags: string
  }
  readyNode: string
  practicePlan: {
    startFrom: (skills: string) => string
    rootPrompt: (prompt: string) => string
    practiceAround: (loop: string, skillTitle: string, materials: string) => string
    repeatFor: (loop: string, outcome: string) => string
    watchFor: (observation: string) => string
  }
  listAnd: string
}

export type LocalizedContent = {
  ui: UiCopy
  treeMeta: typeof baseTreeMeta
  domains: Domain[]
  stages: Stage[]
  skills: SkillNode[]
  domainGuides: Record<DomainId, DomainGuide>
  stagePracticePrompts: Record<StageId, string[]>
  viewModes: Array<{ id: ViewModeId; label: string }>
  relationLabels: Record<RelationLabelId, string>
  roleLabels: Record<GraphRoleId, string>
}

export const languageOptions: Array<{ id: Language; label: string; shortLabel: string }> = [
  { id: 'en', label: 'English', shortLabel: 'EN' },
  { id: 'hu', label: 'Magyar', shortLabel: 'HU' },
]

const languageStorageKey = 'skilltree:language:v1'

export function loadLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const stored = window.localStorage.getItem(languageStorageKey)
  return stored === 'hu' || stored === 'en' ? stored : 'en'
}

export function saveLanguage(language: Language) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(languageStorageKey, language)
}

export function getLocalizedContent(language: Language): LocalizedContent {
  const copy = language === 'hu' ? hungarianCopy : englishCopy

  return {
    ui: copy.ui,
    treeMeta: {
      ...baseTreeMeta,
      ...copy.treeMeta,
    },
    domains: baseDomains.map((domain) => ({
      ...domain,
      ...copy.domains[domain.id],
    })),
    stages: baseStages.map((stage) => ({
      ...stage,
      ...copy.stages[stage.id],
    })),
    skills: baseSkills.map((skill) => ({
      ...skill,
      ...copy.skills[skill.id],
    })),
    domainGuides: mapDomainGuides(copy.domainGuides),
    stagePracticePrompts: copy.stagePracticePrompts,
    viewModes: copy.viewModes,
    relationLabels: copy.relationLabels,
    roleLabels: copy.roleLabels,
  }
}

function mapDomainGuides(copy: Record<DomainId, DomainGuideCopy>) {
  return Object.fromEntries(
    baseDomains.map((domain) => [
      domain.id,
      {
        ...baseDomainGuides[domain.id],
        ...copy[domain.id],
        domain: domain.id,
      },
    ]),
  ) as Record<DomainId, DomainGuide>
}

const englishUi: UiCopy = {
  locale: 'en-US',
  documentTitle: 'Skill Tree | Male Foundation Track',
  heading: 'Skill tree from baby to age 18',
  languageLabel: 'Language',
  languageAria: 'Choose language',
  treeSummaryAria: 'Tree summary',
  metrics: {
    skills: 'skills',
    links: 'links',
    domains: 'domains',
    ageBands: 'age bands',
  },
  searchLabel: 'Search skills',
  searchPlaceholder: 'Find skills, outcomes, tags',
  mapViewAria: 'Map view',
  clear: 'Clear',
  ageFocusAria: 'Age focus',
  fullTimeline: 'Full timeline',
  domainFocusAria: 'Domain focus',
  allDomains: 'All domains',
  resultCount: (matches, total) => `${matches} search match${matches === 1 ? '' : 'es'} in ${total} skills`,
  kidProfilesAria: 'Kid profiles',
  defaultProfileName: 'First child',
  progressSummary: (completed, ready) => `${completed} complete · ${ready} ready`,
  progressLabel: (name) => `${name} progress`,
  activeChildAgeBand: 'Active child age band',
  newChildName: 'New child name',
  newChildAgeBand: 'New child age band',
  addChildPlaceholder: 'Add child',
  add: 'Add',
  treeAria: 'Skill tree',
  growthAtlas: 'Growth atlas',
  mapPanel: {
    world: 'World view shows the whole capability map with compact nodes.',
    path: 'Path view highlights the selected skill, its roots, and its future branches.',
    node: 'Node view moves close to one skill and keeps its direct links loud.',
  },
  selectedSkillAria: 'Selected skill',
  introImageLabel: (domain) => `${domain} intro image`,
  completeFor: (name) => `Mark complete for ${name}`,
  completedFor: (name) => `Completed for ${name}`,
  detail: {
    age: 'Age',
    role: 'Role',
    lineage: 'Lineage',
    nodes: 'nodes',
    unlocks: 'Unlocks',
    prereqs: 'Prereqs',
    root: 'Root',
    domainMap: 'Domain map',
    outcomes: 'Outcomes',
    waysToBuild: 'Ways to build this',
    beforeThis: 'Before this',
    unlocksNext: 'Unlocks next',
    noLinkedSkills: 'No linked skills yet.',
    tags: 'Tags',
  },
  readyNode: 'Ready',
  practicePlan: {
    startFrom: (skills) => `Start from ${skills}; those are the roots this skill expects.`,
    rootPrompt: (prompt) => `${prompt}.`,
    practiceAround: (loop, skillTitle, materials) => `${loop} around "${skillTitle}" using ${materials}.`,
    repeatFor: (loop, outcome) => `${loop} so he can practice ${outcome}.`,
    watchFor: (observation) =>
      `Watch for ${observation}; mark complete when the outcomes are showing up in ordinary life.`,
  },
  listAnd: 'and',
}

const hungarianUi: UiCopy = {
  locale: 'hu-HU',
  documentTitle: 'Készségfa | Fiú alapozó pálya',
  heading: 'Készségfa babakortól 18 éves korig',
  languageLabel: 'Nyelv',
  languageAria: 'Nyelv kiválasztása',
  treeSummaryAria: 'Fa összefoglaló',
  metrics: {
    skills: 'készség',
    links: 'kapcsolat',
    domains: 'terület',
    ageBands: 'életszakasz',
  },
  searchLabel: 'Készségek keresése',
  searchPlaceholder: 'Készségek, eredmények, címkék',
  mapViewAria: 'Térképnézet',
  clear: 'Törlés',
  ageFocusAria: 'Életkori fókusz',
  fullTimeline: 'Teljes idővonal',
  domainFocusAria: 'Területi fókusz',
  allDomains: 'Minden terület',
  resultCount: (matches, total) => `${matches} találat ${total} készségből`,
  kidProfilesAria: 'Gyerekprofilok',
  defaultProfileName: 'Első gyerek',
  progressSummary: (completed, ready) => `${completed} kész · ${ready} készen áll`,
  progressLabel: (name) => `${name} haladása`,
  activeChildAgeBand: 'Aktív gyerek életszakasza',
  newChildName: 'Új gyerek neve',
  newChildAgeBand: 'Új gyerek életszakasza',
  addChildPlaceholder: 'Gyerek hozzáadása',
  add: 'Hozzáadás',
  treeAria: 'Készségfa',
  growthAtlas: 'Fejlődési atlasz',
  mapPanel: {
    world: 'A világ nézet a teljes képességtérképet mutatja kompakt csomópontokkal.',
    path: 'Az útvonal nézet kiemeli a kijelölt készséget, a gyökereit és a jövőbeli ágait.',
    node: 'A csomópont nézet közelről mutat egy készséget, és erősen kiemeli a közvetlen kapcsolatait.',
  },
  selectedSkillAria: 'Kijelölt készség',
  introImageLabel: (domain) => `${domain} bevezető kép`,
  completeFor: (name) => `Késznek jelölés ${name} számára`,
  completedFor: (name) => `Kész ${name} számára`,
  detail: {
    age: 'Kor',
    role: 'Szerep',
    lineage: 'Útvonal',
    nodes: 'csomópont',
    unlocks: 'Nyit',
    prereqs: 'Előfelt.',
    root: 'Gyökér',
    domainMap: 'Területtérkép',
    outcomes: 'Eredmények',
    waysToBuild: 'Hogyan építsd',
    beforeThis: 'Előtte',
    unlocksNext: 'Ez nyílik utána',
    noLinkedSkills: 'Még nincs kapcsolódó készség.',
    tags: 'Címkék',
  },
  readyNode: 'Készen',
  practicePlan: {
    startFrom: (skills) => `Induljatok innen: ${skills}; ezekre az előzményekre épít ez a készség.`,
    rootPrompt: (prompt) => `${prompt}.`,
    practiceAround: (loop, skillTitle, materials) => `${loop} a(z) "${skillTitle}" készség körül, ezekkel: ${materials}.`,
    repeatFor: (loop, outcome) => `${loop}, hogy gyakorolja ezt: ${outcome}.`,
    watchFor: (observation) =>
      `Figyeld ezeket: ${observation}; akkor jelöld késznek, ha az eredmények már a hétköznapokban is megjelennek.`,
  },
  listAnd: 'és',
}

const englishCopy: LocalizationCopy = {
  ui: englishUi,
  treeMeta: baseTreeMeta,
  domains: Object.fromEntries(baseDomains.map((domain) => [domain.id, domain])) as unknown as Record<DomainId, DomainCopy>,
  stages: Object.fromEntries(baseStages.map((stage) => [stage.id, stage])) as unknown as Record<StageId, StageCopy>,
  skills: Object.fromEntries(baseSkills.map((skill) => [skill.id, skill])) as unknown as Record<string, SkillCopy>,
  domainGuides: baseDomainGuides as unknown as Record<DomainId, DomainGuideCopy>,
  stagePracticePrompts: baseStagePracticePrompts,
  viewModes: [
    { id: 'world', label: 'World' },
    { id: 'path', label: 'Path' },
    { id: 'node', label: 'Node' },
  ] as Array<{ id: ViewModeId; label: string }>,
  relationLabels: {
    selected: 'Selected',
    'direct-before': 'Before',
    'direct-next': 'Next',
    ancestor: 'Root path',
    descendant: 'Branch',
    matched: 'Match',
  } as Record<RelationLabelId, string>,
  roleLabels: {
    root: 'Root',
    keystone: 'Keystone',
    bridge: 'Bridge',
    leaf: 'Leaf',
    ordinary: 'Skill',
  } as Record<GraphRoleId, string>,
}

const hungarianGeneratedDomainShort: Record<DomainId, string> = {
  movement: 'test',
  care: 'gondoskodás',
  language: 'szavak',
  reasoning: 'ész',
  social: 'társas',
  practical: 'élet',
  safety: 'biztonság',
  creativity: 'alkotás',
  character: 'értékek',
}

const hungarianGeneratedStageTitle: Record<StageId, string> = {
  infancy: 'Baba',
  toddler: 'Totyogó',
  preschool: 'Óvodás',
  'early-school': 'Iskolakezdő',
  'middle-childhood': 'Kisiskolás',
  'later-childhood': 'Nagyobb gyerek',
  preteen: 'Kiskamasz',
  'early-adolescence': 'Korai kamaszkor',
  'middle-adolescence': 'Középső kamaszkor',
  'late-adolescence': 'Késő kamaszkor',
}

const hungarianGeneratedStageContext: Record<StageId, { setting: string; autonomy: string; evidence: string; tags: string[] }> = {
  infancy: {
    setting: 'meleg, gondozó által vezetett rutinokban',
    autonomy: 'jelzésekkel, rövid részvétellel és ismételt találkozással',
    evidence: 'apró, ismétlődő készenléti jelekben',
    tags: ['baba', 'alapozás'],
  },
  toddler: {
    setting: 'egyszerű rutinokban, utánzásban és egylépéses választásokban',
    autonomy: 'felnőtt által vezetett próbákkal és rövid ismétlésekkel',
    evidence: 'több próbálkozásban és kevesebb feszültségben',
    tags: ['totyogó', 'gyakorlás'],
  },
  preschool: {
    setting: 'játékban, történetekben, látható rutinokban és kis munkákban',
    autonomy: 'irányított választásokkal és hibák utáni javítással',
    evidence: 'játékban és napi rutinokban megjelenő készségben',
    tags: ['óvodás', 'játék'],
  },
  'early-school': {
    setting: 'otthonban, osztályban, játékokban és hasznos segítésben',
    autonomy: 'lépések magyarázatával és rövid sorrendek követésével',
    evidence: 'megbízhatóbb végigvitelben',
    tags: ['iskola', 'sorrend'],
  },
  'middle-childhood': {
    setting: 'csapatokban, tanulásban, házimunkában, hobbikban és kortárséletben',
    autonomy: 'mérhető javulással és visszajelzés használatával',
    evidence: 'mások számára is látható kompetenciában',
    tags: ['kompetencia', 'visszajelzés'],
  },
  'later-childhood': {
    setting: 'nagyobb felelősségekben, önálló gyakorlásban és pubertásra készülésben',
    autonomy: 'ítélőképességgel, reflexióval és felügyelt tervezéssel',
    evidence: 'jobb döntésekben, mielőtt felnőtt lépne közbe',
    tags: ['ítélőképesség', 'kiskamasz'],
  },
  preteen: {
    setting: 'kortárscsoportokban, pubertásváltozásokban, online terekben és hosszabb feladatokban',
    autonomy: 'önfigyeléssel, segítségkéréssel és rutinok vállalásával',
    evidence: 'biztonságosabb önállóságban ismerős helyzetekben',
    tags: ['kiskamasz', 'pubertás'],
  },
  'early-adolescence': {
    setting: 'identitásmunkában, erősebb érzelmekben, csapatokban, telefonhasználatban és közösségi terekben',
    autonomy: 'egyeztetett önállósággal és őszinte reflexióval',
    evidence: 'kortárs nyomás alatt is megtartott döntésekben',
    tags: ['kamaszkor', 'identitás'],
  },
  'middle-adolescence': {
    setting: 'mélyebb tanulásban, munkagyakorlatban, közlekedésben, kapcsolatokban és kockázati döntésekben',
    autonomy: 'előretervezéssel és felügyelt felelősségvállalással',
    evidence: 'megbízható viselkedésben nagyobb téteknél',
    tags: ['kamasz', 'autonómia'],
  },
  'late-adolescence': {
    setting: 'felnőtt átmenetekben, munkában, állampolgári életben, egészségügyi rendszerekben és hosszú távú tervekben',
    autonomy: 'felnőtt szintű felelősséggel, szükség esetén tanácskéréssel',
    evidence: 'háztartáson túli életre való készenlétben',
    tags: ['felnőttkészülés', 'átmenet'],
  },
}

const hungarianGeneratedAspectTitle: Record<SkillAspectId, { title: string; tags: string[] }> = {
  'body-control': { title: 'Testkontroll', tags: ['test', 'koordináció'] },
  'fine-control': { title: 'Finom kontroll', tags: ['kezek', 'finommotorika'] },
  stamina: { title: 'Állóképesség', tags: ['állóképesség', 'fitness'] },
  'athletic-practice': { title: 'Atlétikai gyakorlás', tags: ['sport', 'gyakorlás'] },
  'recovery-posture': { title: 'Regeneráció és testtartás', tags: ['testtartás', 'regeneráció'] },
  'physical-confidence': { title: 'Fizikai önbizalom', tags: ['önbizalom', 'kockázat'] },
  'mobility-flexibility': { title: 'Mobilitás és hajlékonyság', tags: ['mobilitás', 'hajlékonyság'] },
  'strength-power': { title: 'Erő és robbanékonyság', tags: ['erő', 'robbanékonyság'] },
  'balance-agility': { title: 'Egyensúly és fürgeség', tags: ['egyensúly', 'fürgeség'] },
  'outdoor-movement': { title: 'Kültéri mozgás', tags: ['kültér', 'mozgás'] },
  'body-composition-literacy': { title: 'Testösszetétel-ismeret', tags: ['testösszetétel', 'testismeret'] },
  'competitive-play': { title: 'Versengő játék', tags: ['versengés', 'sportszerűség'] },
  'movement-teaching': { title: 'Mozgás tanítása', tags: ['tanítás', 'mozgás'] },
  'sleep-recovery': { title: 'Alvás és regeneráció', tags: ['alvás', 'regeneráció'] },
  'food-nutrition': { title: 'Étel és táplálkozás', tags: ['étel', 'táplálkozás'] },
  'hygiene-grooming': { title: 'Higiénia és ápoltság', tags: ['higiénia', 'ápoltság'] },
  'body-literacy': { title: 'Testismeret', tags: ['test', 'pubertás'] },
  'emotional-regulation': { title: 'Érzelmi szabályozás', tags: ['érzelem', 'szabályozás'] },
  'health-advocacy': { title: 'Egészségképviselet', tags: ['egészség', 'képviselet'] },
  'dental-skin-care': { title: 'Fog- és bőrápolás', tags: ['fogápolás', 'bőrápolás'] },
  'illness-management': { title: 'Betegségkezelés', tags: ['betegség', 'kezelés'] },
  'medication-safety': { title: 'Gyógyszerbiztonság', tags: ['gyógyszer', 'biztonság'] },
  'stress-recovery': { title: 'Stressz és helyreállás', tags: ['stressz', 'helyreállás'] },
  'mental-health-literacy': { title: 'Mentális egészségismeret', tags: ['mentális egészség', 'ismeret'] },
  'grooming-presentation': { title: 'Ápoltság és megjelenés', tags: ['ápoltság', 'megjelenés'] },
  'healthcare-navigation': { title: 'Egészségügyi eligazodás', tags: ['egészségügy', 'eligazodás'] },
  'listening-attention': { title: 'Figyelés és figyelem', tags: ['figyelés', 'figyelem'] },
  'spoken-expression': { title: 'Szóbeli kifejezés', tags: ['beszéd', 'kérdések'] },
  'reading-comprehension': { title: 'Olvasásértés', tags: ['olvasás', 'szövegértés'] },
  'writing-composition': { title: 'Írásbeli fogalmazás', tags: ['írás', 'fogalmazás'] },
  'research-media': { title: 'Kutatás és médiamérlegelés', tags: ['kutatás', 'média'] },
  'discussion-rhetoric': { title: 'Beszélgetés és érvelés', tags: ['beszélgetés', 'vita'] },
  'vocabulary-concepts': { title: 'Szókincs és fogalmak', tags: ['szókincs', 'fogalmak'] },
  'storytelling-narrative': { title: 'Történetmesélés és narratíva', tags: ['történetmesélés', 'narratíva'] },
  'note-taking-study': { title: 'Jegyzetelés és tanulás', tags: ['jegyzetelés', 'tanulás'] },
  'presentation-speaking': { title: 'Előadás és beszéd', tags: ['előadás', 'beszéd'] },
  'negotiation-asking': { title: 'Egyeztetés és kérés', tags: ['egyeztetés', 'kérés'] },
  'multilingual-cultural-language': { title: 'Többnyelvű és kulturális nyelv', tags: ['többnyelvűség', 'kultúra'] },
  'digital-communication': { title: 'Digitális kommunikáció', tags: ['digitális', 'kommunikáció'] },
  'number-sense': { title: 'Számérzék', tags: ['matek', 'szám'] },
  'spatial-systems': { title: 'Téri és rendszergondolkodás', tags: ['tér', 'rendszerek'] },
  'scientific-inquiry': { title: 'Tudományos vizsgálódás', tags: ['tudomány', 'vizsgálódás'] },
  'planning-executive': { title: 'Tervezés és végrehajtó működés', tags: ['tervezés', 'végrehajtás'] },
  'money-data': { title: 'Pénz és adatok', tags: ['pénz', 'adatok'] },
  'logic-tradeoffs': { title: 'Logika és átváltások', tags: ['logika', 'ítélőképesség'] },
  'memory-learning-strategy': { title: 'Memória és tanulási stratégia', tags: ['memória', 'tanulás'] },
  'algebraic-thinking': { title: 'Algebrai gondolkodás', tags: ['algebra', 'minták'] },
  'geometry-measurement': { title: 'Geometria és mérés', tags: ['geometria', 'mérés'] },
  'computational-thinking': { title: 'Számítógépes gondolkodás', tags: ['kódolás', 'algoritmusok'] },
  'decision-science': { title: 'Döntéstudatosság', tags: ['döntések', 'valószínűség'] },
  'ethics-civics-reasoning': { title: 'Etikai és állampolgári érvelés', tags: ['etika', 'állampolgárság'] },
  'project-analysis': { title: 'Projektelemzés', tags: ['projektek', 'elemzés'] },
  'belonging-attachment': { title: 'Odatartozás és kötődés', tags: ['odatartozás', 'kötődés'] },
  'empathy-perspective': { title: 'Empátia és nézőpont', tags: ['empátia', 'nézőpont'] },
  'friendship-belonging': { title: 'Barátság és odatartozás', tags: ['barátság', 'kortársak'] },
  'conflict-repair': { title: 'Konfliktus és jóvátétel', tags: ['konfliktus', 'jóvátétel'] },
  'team-leadership': { title: 'Csapatmunka és vezetés', tags: ['csapatmunka', 'vezetés'] },
  'boundaries-intimacy': { title: 'Határok és intimitás', tags: ['határok', 'tisztelet'] },
  'self-awareness': { title: 'Önismeret', tags: ['önismeret', 'identitás'] },
  'emotion-expression': { title: 'Érzelmek kifejezése', tags: ['érzelem', 'kifejezés'] },
  'family-relationships': { title: 'Családi kapcsolatok', tags: ['család', 'otthon'] },
  'peer-pressure-judgment': { title: 'Kortársnyomás és ítélet', tags: ['kortársnyomás', 'ítélet'] },
  'romantic-respect': { title: 'Romantikus tisztelet', tags: ['romantika', 'tisztelet'] },
  'mentoring-receiving': { title: 'Mentorálás elfogadása', tags: ['mentorálás', 'tanács'] },
  'community-participation': { title: 'Közösségi részvétel', tags: ['közösség', 'részvétel'] },
  'self-feeding-cooking': { title: 'Ételmunka és főzés', tags: ['főzés', 'étel'] },
  'home-chores': { title: 'Otthoni házimunkák', tags: ['házimunka', 'otthon'] },
  'organization-systems': { title: 'Rendszerezési rendszerek', tags: ['rendszerezés', 'rendszerek'] },
  'tools-repair': { title: 'Szerszámok és javítás', tags: ['szerszámok', 'javítás'] },
  'money-work': { title: 'Pénz és munkaszokások', tags: ['pénz', 'munka'] },
  'transport-logistics': { title: 'Közlekedés és logisztika', tags: ['közlekedés', 'logisztika'] },
  'clothing-laundry': { title: 'Ruházat és mosás', tags: ['ruházat', 'mosás'] },
  'room-systems': { title: 'Szobai rendszerek', tags: ['szoba', 'rendszerek'] },
  'shopping-consumer-skills': { title: 'Vásárlói készségek', tags: ['vásárlás', 'fogyasztó'] },
  'time-calendar': { title: 'Idő és naptár', tags: ['idő', 'naptár'] },
  'basic-technology': { title: 'Alaptechnológia', tags: ['technológia', 'eszközök'] },
  'work-service-habits': { title: 'Munka- és szolgálati szokások', tags: ['munka', 'szolgálat'] },
  'civic-legal-basics': { title: 'Állampolgári és jogi alapok', tags: ['állampolgári', 'jogi'] },
  'body-boundaries': { title: 'Testhatárok', tags: ['határok', 'beleegyezés'] },
  'traffic-water-fire': { title: 'Közlekedés, víz és tűz', tags: ['közlekedés', 'víz', 'tűz'] },
  'digital-privacy': { title: 'Digitális magánszféra', tags: ['digitális', 'magánszféra'] },
  'substance-risk': { title: 'Szerhasználat és kockázati nyomás', tags: ['szerek', 'nyomás'] },
  'sexual-health-consent': { title: 'Szexuális egészség és beleegyezés', tags: ['szexuális egészség', 'beleegyezés'] },
  'emergency-readiness': { title: 'Vészhelyzeti készenlét', tags: ['elsősegély', 'vészhelyzet'] },
  'hazard-scanning': { title: 'Veszélyfelismerés', tags: ['veszélyek', 'éberség'] },
  'personal-security': { title: 'Személyes biztonság', tags: ['biztonság', 'identitás'] },
  'online-manipulation': { title: 'Online manipuláció', tags: ['online', 'manipuláció'] },
  'medication-poison-safety': { title: 'Gyógyszer- és méregbiztonság', tags: ['méreg', 'gyógyszer'] },
  'violence-deescalation': { title: 'Erőszak csillapítása', tags: ['erőszak', 'csillapítás'] },
  'mental-health-crisis': { title: 'Mentális krízis biztonsága', tags: ['krízis', 'mentális egészség'] },
  'travel-safety': { title: 'Utazási biztonság', tags: ['utazás', 'közösségi közlekedés'] },
  'sensory-play': { title: 'Érzékszervi játék és képzelet', tags: ['játék', 'képzelet'] },
  'visual-design': { title: 'Vizuális design', tags: ['rajz', 'design'] },
  'music-rhythm': { title: 'Zene és ritmus', tags: ['zene', 'ritmus'] },
  'building-making': { title: 'Építés és készítés', tags: ['építés', 'készítés'] },
  'performance-story': { title: 'Előadás és történet', tags: ['történet', 'előadás'] },
  'creative-practice': { title: 'Kreatív gyakorlat', tags: ['gyakorlás', 'javítás'] },
  'creative-observation': { title: 'Kreatív megfigyelés', tags: ['megfigyelés', 'figyelem'] },
  'craft-technique': { title: 'Kézműves technika', tags: ['kézművesség', 'technika'] },
  'improvisation-play': { title: 'Improvizáció és játék', tags: ['improvizáció', 'játék'] },
  'digital-creation': { title: 'Digitális alkotás', tags: ['digitális', 'alkotás'] },
  'critique-feedback': { title: 'Kritika és visszajelzés', tags: ['kritika', 'visszajelzés'] },
  'portfolio-finished-work': { title: 'Portfólió és kész munka', tags: ['portfólió', 'kész munka'] },
  'cultural-appreciation': { title: 'Kulturális érzékenység', tags: ['kultúra', 'megbecsülés'] },
  'patience-attention': { title: 'Türelem és figyelem', tags: ['türelem', 'figyelem'] },
  'truth-accountability': { title: 'Igazság és elszámoltathatóság', tags: ['igazság', 'elszámoltathatóság'] },
  'responsibility-initiative': { title: 'Felelősség és kezdeményezés', tags: ['felelősség', 'kezdeményezés'] },
  'courage-resilience': { title: 'Bátorság és rugalmasság', tags: ['bátorság', 'rugalmasság'] },
  'service-citizenship': { title: 'Szolgálat és állampolgárság', tags: ['szolgálat', 'állampolgárság'] },
  'identity-self-respect': { title: 'Identitás és önbecsülés', tags: ['identitás', 'önbecsülés'] },
  'self-awareness-values': { title: 'Önismeret és értékek', tags: ['értékek', 'önismeret'] },
  'gratitude-contentment': { title: 'Hála és elégedettség', tags: ['hála', 'elégedettség'] },
  'humility-teachability': { title: 'Alázat és taníthatóság', tags: ['alázat', 'taníthatóság'] },
  'discipline-habits': { title: 'Fegyelem és szokások', tags: ['fegyelem', 'szokások'] },
  'justice-fairness': { title: 'Igazságosság és méltányosság', tags: ['igazságosság', 'méltányosság'] },
  'leadership-stewardship': { title: 'Vezetés és gondnokság', tags: ['vezetés', 'gondnokság'] },
  'purpose-goals': { title: 'Célok és irány', tags: ['célok', 'irány'] },
}

function hungarianDefiniteArticle(text: string) {
  return 'aáeéiíoóöőuúüű'.includes(text.charAt(0).toLocaleLowerCase('hu-HU')) ? 'Az' : 'A'
}

function uniqueLocalizedTags(tags: string[]) {
  return Array.from(new Set(tags))
}

function buildHungarianExpandedSkillCopy() {
  const generated: Record<string, SkillCopy> = {}

  for (const skill of baseSkills) {
    if (!skill.generated || !skill.aspectId) {
      continue
    }

    const aspect = hungarianGeneratedAspectTitle[skill.aspectId]
    const stageTitle = hungarianGeneratedStageTitle[skill.stage]
    const context = hungarianGeneratedStageContext[skill.stage]
    const aspectLower = aspect.title.toLocaleLowerCase('hu-HU')

    generated[skill.id] = {
      title: `${stageTitle}: ${aspect.title}`,
      summary: `${hungarianDefiniteArticle(aspectLower)} ${aspectLower} területét építi ${context.setting}, egyre önállóbb és valóságosabb helyzetekben.`,
      outcomes: [
        `Gyakorolja ezt a területet: ${aspectLower}`,
        `Önállósága nő ezen keresztül: ${context.autonomy}`,
        `A készség megjelenik ${context.evidence}`,
      ],
      tags: uniqueLocalizedTags([
        hungarianGeneratedDomainShort[skill.domain],
        stageTitle.toLocaleLowerCase('hu-HU'),
        ...context.tags,
        ...aspect.tags,
      ]),
    }
  }

  return generated
}

const hungarianCopy: LocalizationCopy = {
  ui: hungarianUi,
  treeMeta: {
    profile: 'Fiú alapozó pálya',
    range: 'Születéstől 18 éves korig',
    version: '0.1',
    stance:
      'Ez a pálya a fiúkori és kamaszkori fejlődést nagyrészt általános emberi fejlődésként kezeli, későbbi nemspecifikus ágak lehetőségével.',
  },
  domains: {
    movement: {
      label: 'Test és mozgás',
      shortLabel: 'Test',
      description: 'Erő, koordináció, testtartás, állóképesség és mozgásműveltség.',
    },
    care: {
      label: 'Egészség és öngondoskodás',
      shortLabel: 'Gondosk.',
      description: 'Alvás, étkezés, higiénia, testtudat és napi önszabályozás.',
    },
    language: {
      label: 'Nyelv és írás-olvasás',
      shortLabel: 'Szavak',
      description: 'Figyelés, beszéd, olvasás, írás és gondolatok elmagyarázása.',
    },
    reasoning: {
      label: 'Számok és gondolkodás',
      shortLabel: 'Ész',
      description: 'Matematika, memória, tervezés, mintafelismerés és problémamegoldás.',
    },
    social: {
      label: 'Társas és érzelmi',
      shortLabel: 'Társas',
      description: 'Kötődés, empátia, konfliktus, barátság és társas ítélőképesség.',
    },
    practical: {
      label: 'Gyakorlati élet',
      shortLabel: 'Élet',
      description: 'Étel, ruha, takarítás, szerszámok, pénz és otthoni hozzájárulás.',
    },
    safety: {
      label: 'Biztonság és határok',
      shortLabel: 'Biztons.',
      description: 'Kockázat, beleegyezés, magánszféra, közlekedés, víz, tűz, digitális tér és elsősegély.',
    },
    creativity: {
      label: 'Kreativitás és alkotás',
      shortLabel: 'Alkotás',
      description: 'Játék, rajzolás, zene, építés, előadás és eredeti munka.',
    },
    character: {
      label: 'Jellem és közösség',
      shortLabel: 'Értékek',
      description: 'Türelem, őszinteség, felelősség, bátorság, szolgálat és önbecsülés.',
    },
  } satisfies Record<DomainId, DomainCopy>,
  stages: {
    infancy: {
      title: 'Baba',
      age: '0-12 hó',
      focus: 'Bizalom, érzékszervi tanulás, kötődés, valamint a test és figyelem első kontrollja.',
    },
    toddler: {
      title: 'Totyogó',
      age: '1-2 év',
      focus: 'Mozgás, megnevezés, utánzás, egyszerű választások és korai határok.',
    },
    preschool: {
      title: 'Óvodás',
      age: '3-4 év',
      focus: 'Nyelvi ugrások, szerepjáték, rutinok, együttműködés és korai önkontroll.',
    },
    'early-school': {
      title: 'Iskolakezdő',
      age: '5-6 év',
      focus: 'Iskolaérettség, alapvető tanulási készségek, csoportszabályok és valódi segítés.',
    },
    'middle-childhood': {
      title: 'Kisiskolás',
      age: '7-8 év',
      focus: 'Kompetencia, állóképesség, barátságok, otthoni hasznosság és fair play.',
    },
    'later-childhood': {
      title: 'Nagyobb gyerek',
      age: '9-10 év',
      focus: 'Önálló ítélőképesség, mélyebb tanulás, vezetői magok és felkészülés a pubertásra.',
    },
    preteen: {
      title: 'Kiskamasz',
      age: '11-12 év',
      focus: 'Pubertáskezdés, erősebb kortársélet, digitális ítélőképesség, tanulási szokások és tartós felelősségek.',
    },
    'early-adolescence': {
      title: 'Korai kamaszkor',
      age: '13-14 év',
      focus: 'Identitás, érzelmi intenzitás, elvont gondolkodás, odatartozás, határok és felügyelt önállóság.',
    },
    'middle-adolescence': {
      title: 'Középső kamaszkor',
      age: '15-16 év',
      focus: 'Autonómia, kockázatítélet, mélyebb készségek, munkaszokások, vezetésre készülés és valódi hozzájárulás.',
    },
    'late-adolescence': {
      title: 'Késő kamaszkor',
      age: '17-18 év',
      focus: 'Felnőtté válásra készülés, hosszú távú tervezés, egészség felelőssége, intim határok, munka, szolgálat és állampolgári élet.',
    },
  } satisfies Record<StageId, StageCopy>,
  skills: {
    'core-strength-and-senses': {
      title: 'Törzserő és érzékszervek',
      summary: 'Fejkontrollt, fordulást, ülést, kúszást-mászást, nyúlást és érzékszervi tájékozódást épít.',
      outcomes: ['Hangok és arcok felé fordul', 'Sorban fordul, ül, mászik vagy felhúzza magát', 'Mozgó tárgyakat követ és értük nyúl'],
      tags: ['testkontroll', 'nagymozgás', 'érzékelés'],
    },
    'sleep-feed-rhythm': {
      title: 'Alvási és etetési ritmus',
      summary: 'Kiszámítható etetési, alvási, megnyugvási és éber játékciklusokat alakít ki.',
      outcomes: ['Jelzi az éhséget és a jóllakottságot', 'Elfogadja a megnyugtató rutinokat', 'Hosszabb alvási szakaszokat épít'],
      tags: ['alvás', 'étel', 'szabályozás'],
    },
    'first-communication': {
      title: 'Első kommunikáció',
      summary: 'Tekintettel, sírással, gügyögéssel, mutatással és közös figyelemmel kommunikál.',
      outcomes: ['Gügyög és hangokkal kísérletezik', 'Reagál a nevére és ismerős hangokra', 'Szavak előtt gesztusokat használ'],
      tags: ['figyelés', 'gügyögés', 'figyelem'],
    },
    'object-curiosity': {
      title: 'Tárgyi kíváncsiság',
      summary: 'Ok-okozatot fedez fel fogással, elejtéssel, elrejtéssel és ismétléssel.',
      outcomes: ['Keresi az elrejtett tárgyakat', 'Ismétli a cselekvéseket, hogy tesztelje az eredményt', 'Összehasonlít textúrát, súlyt és hangot'],
      tags: ['ok-okozat', 'memória', 'felfedezés'],
    },
    'secure-attachment': {
      title: 'Biztonságos kötődés',
      summary: 'Megtanulja, hogy a megbízható felnőttek visszatérnek, reagálnak, vigasztalnak és közös figyelmet adnak.',
      outcomes: ['Felismeri az ismerős gondozókat', 'Vigaszt keres, amikor zaklatott', 'Mosollyal, tekintettel és egyszerű játékokkal kapcsolódik'],
      tags: ['bizalom', 'kötődés', 'érzelem'],
    },
    'hands-and-mouth-exploration': {
      title: 'Kézzel és szájjal felfedezés',
      summary: 'Gyakorolja a fogást, elengedést, szájjal vizsgálódást, önetetési próbákat és tárgyak átvételét.',
      outcomes: ['Tárgyakat tesz át egyik kézből a másikba', 'Biztonságos ételeket fedez fel támogatással', 'A kívánt tárgyakért nyúl'],
      tags: ['finommotorika', 'étel', 'fogás'],
    },
    'body-safety-trust': {
      title: 'Védett testbizalom',
      summary: 'Megismeri a védő rutinokat, például a biztonságos alvást, autósülést és gyengéd kezelést.',
      outcomes: ['Elfogadja az ismétlődő gondozási rutinokat', 'Jelzi a kellemetlenséget vagy túlterhelést', 'Kiszámítható védelem mellett megnyugszik'],
      tags: ['biztonságos rutinok', 'testjelzések', 'gondozó vezeti'],
    },
    'play-and-sensory-discovery': {
      title: 'Játék és érzékszervi felfedezés',
      summary: 'Élvezi a ritmust, kukucsot, textúrákat, hangokat, mozgást és egyszerű utánzást.',
      outcomes: ['Hangokat vagy arckifejezéseket utánoz', 'Élvezi az énekeket és ismétlődő játékokat', 'Biztonságos anyagokat kíváncsian fedez fel'],
      tags: ['játék', 'ritmus', 'utánzás'],
    },
    'early-temperament': {
      title: 'Korai temperamentum',
      summary: 'Elindul a figyelem, frusztrációtűrés, kíváncsiság és helyreállás hosszú íve.',
      outcomes: ['Támogatással megnyugszik zaklatottság után', 'Kíváncsiságot mutat biztonságos újdonságok felé', 'Rövid várakozást gyakorol'],
      tags: ['türelem', 'figyelem', 'rugalmas helyreállás'],
    },
    'walking-and-climbing': {
      title: 'Járás és mászás',
      summary: 'A korai mozgékonyságból járás, guggolás, mászás, cipelés és biztonságosabb esés lesz.',
      outcomes: ['Egyre jobb kontrollal jár, fut és megáll', 'Felügyelettel alacsony szerkezetekre mászik', 'Mozgás közben tárgyakat cipel'],
      tags: ['nagymozgás', 'egyensúly', 'önbizalom'],
    },
    'self-soothing-basics': {
      title: 'Önmegnyugtatás alapjai',
      summary: 'Vigasztárgyakat, rutinokat, egyszerű választásokat és felnőtt segítséget használ nagy érzések rendezésére.',
      outcomes: ['Segítséggel megnevezi alapvető testi szükségleteit', 'Részt vesz esti és pakolási rutinokban', 'Néhány megnyugvási stratégiát használ'],
      tags: ['szabályozás', 'rutin', 'érzések'],
    },
    'first-words-and-naming': {
      title: 'Első szavak és megnevezés',
      summary: 'Gesztusokból és gügyögésből szavak, nevek, rövid szókapcsolatok és kérések felé lép.',
      outcomes: ['Megnevez ismerős embereket és tárgyakat', 'Egyszerű, egylépéses utasításokat követ', 'Korai kifejezésekké kapcsol szavakat'],
      tags: ['szókincs', 'figyelés', 'kérések'],
    },
    'sorting-and-simple-problems': {
      title: 'Rendezés és egyszerű problémák',
      summary: 'Párosít, rendez, tornyoz, nyit, zár, tesztel és látható problémákat old meg.',
      outcomes: ['Forma, szín vagy méret szerint rendez', 'Egyszerű kirakókat befejez', 'Elakadáskor más megoldást próbál'],
      tags: ['rendezés', 'kirakók', 'problémamegoldás'],
    },
    'parallel-play-and-turns': {
      title: 'Párhuzamos játék és váltások',
      summary: 'Más gyerekek mellett játszik, utánozza őket, rövid váltásokat gyakorol és konfliktus után visszatér.',
      outcomes: ['Társak mellett játszik állandó elkapkodás nélkül', 'Felnőtt támogatással gyakorolja a váltakozást', 'Konfliktus után segítséget használ'],
      tags: ['váltakozás', 'társak', 'megosztás'],
    },
    'spoon-cup-and-helping': {
      title: 'Kanál, pohár és segítés',
      summary: 'Kevesebb maszatolással eszik, pohárból iszik, tárgyakat visz és kis házimunkákat másol.',
      outcomes: ['Támogatással használ kanalat, poharat és szalvétát', 'Játékot vagy ruhát ismert helyre tesz', 'Egyszerű ismétlődő feladatokban segít'],
      tags: ['önálló evés', 'házimunka', 'finommotorika'],
    },
    'stop-and-hold-hands': {
      title: 'Megállás és kézfogás',
      summary: 'Sürgős határszavakat és védő szokásokat tanul utcán, lépcsőn, hőnél és víznél.',
      outcomes: ['Reagál a stop, forró, várj és gyere szavakra', 'Forgalom közelében megbízható kézbe kapaszkodik', 'Víz vagy magas hely közelében közel marad'],
      tags: ['közlekedés', 'hő', 'víz'],
    },
    'pretend-play-start': {
      title: 'Szerepjáték kezdete',
      summary: 'Tárgyakat, hangokat, szerepeket és utánzást használ, hogy a mindennapokból játék legyen.',
      outcomes: ['Úgy tesz, mintha főzne, telefonálna, vezetne vagy gondoskodna', 'Ritmusokat, gesztusokat és állathangokat másol', 'Tárgyakból kis jeleneteket épít'],
      tags: ['szerepjáték', 'utánzás', 'történet'],
    },
    'no-and-repair': {
      title: 'Nem és jóvátétel',
      summary: 'Megtanulja, hogy a határok valódiak, és a hibák segítséggel javíthatók.',
      outcomes: ['Támogatással elfogad rövid határokat', 'Javítás után gyakorolja a gyengéd kezeket', 'Korai bocsánat, segítség vagy újrapróbálás szavakat használ'],
      tags: ['határok', 'jóvátétel', 'gyengédség'],
    },
    'balance-and-coordination': {
      title: 'Egyensúly és koordináció',
      summary: 'Ugrást, dobást, elkapást, pedálozást, táncot és összehangoltabb egésztestes játékot ad hozzá.',
      outcomes: ['Ugrik, pedálozik, mászik és irányt vált', 'Nagy labdákat dob és elkap', 'Ollót, zsírkrétát és kockákat kontrollal használ'],
      tags: ['egyensúly', 'finommotorika', 'koordináció'],
    },
    'toilet-washing-dressing': {
      title: 'WC, mosakodás és öltözés',
      summary: 'Részt vesz WC-rutinban, kézmosásban, fogmosásban, öltözésben és testi szükségletek megnevezésében.',
      outcomes: ['Csökkenő segítséggel használja a WC-rutinokat', 'Emlékeztetőkkel kezet mos és fogat mos', 'Egyszerű ruhadarabokat felvesz'],
      tags: ['higiénia', 'öltözés', 'WC'],
    },
    'sentences-and-stories': {
      title: 'Mondatok és történetek',
      summary: 'Teljesebb mondatokban beszél, miérteket kérdez, eseményeket mesél vissza és élvezi a könyveket.',
      outcomes: ['Mondatokkal magyarázza szükségleteit és ötleteit', 'Ki, mi, hol és miért kérdésekre kérdez és válaszol', 'Egyszerű eseményeket sorrendben visszamesél'],
      tags: ['történet', 'kérdések', 'beszélgetés'],
    },
    'counting-shapes-patterns': {
      title: 'Számolás, formák és minták',
      summary: 'Felismeri a mennyiséget, formákat, sorrendet, kategóriákat és egyszerű ha-akkor mintákat.',
      outcomes: ['Tárgyakkal kis halmazokat megszámol', 'Megnevez gyakori formákat és helyzeteket', 'Megjósolja, mi következik egy mintában'],
      tags: ['számolás', 'minták', 'formák'],
    },
    'cooperative-play-empathy': {
      title: 'Együttműködő játék és empátia',
      summary: 'A párhuzamos játékból közös szerepek, egyszerű szabályok, bocsánatkérés és érzések észrevétele felé lép.',
      outcomes: ['Közös szerepjátékokban játszik', 'Alapérzelmeket nevez meg magában és másokban', 'Felnőtt segítséggel old meg társas konfliktust'],
      tags: ['empátia', 'játékszabályok', 'konfliktus'],
    },
    'tidy-up-simple-chores': {
      title: 'Pakolás és egyszerű házimunkák',
      summary: 'Elteszi a holmiját, kisebb dolgokat előkészít, ruhát visz, növényt locsol és segít feltörölni.',
      outcomes: ['Kétlépéses otthoni feladatot követ', 'Holmijait ismert helyekre rendezi', 'Segít előkészíteni vagy megtisztítani egy egyszerű területet'],
      tags: ['házimunka', 'rend', 'segítés'],
    },
    'private-parts-consent': {
      title: 'Magánrészek és beleegyezés szavai',
      summary: 'Megtanulja a magán testrészek nevét, a fürdőszobai magánszférát, a megbízható felnőtteket és hogy nemet mondhat nem kívánt érintésre.',
      outcomes: ['Pontosan és nyugodtan nevezi meg a magán testrészeket', 'Tudja, hogy a magán nem nyilvános megosztásra való', 'Megbízható felnőttnek szól veszélyes érintésről vagy titokról'],
      tags: ['beleegyezés', 'magánszféra', 'megbízható felnőttek'],
    },
    'drawing-music-building': {
      title: 'Rajz, zene és építés',
      summary: 'Jeleket, ritmust, mozgást, kockákat, jelmezeket és történeteket használ, hogy láthatóvá tegye az ötleteit.',
      outcomes: ['Ábrázoló jeleket és jeleneteket rajzol', 'Tartja az ütemet vagy ismétel egy dalmintát', 'Szándékkal épít szerkezeteket'],
      tags: ['rajz', 'zene', 'építés'],
    },
    'patience-and-honesty-seeds': {
      title: 'Türelem és őszinteség magjai',
      summary: 'Gyakorolja a várakozást, elmondja mi történt, újrapróbálkozik és kisebb jóvátételeket tesz.',
      outcomes: ['Támogatással kivár rövid késleltetéseket', 'Kérésre egyszerű igazságot mond', 'Kár vagy rendetlenség után jóvátételt próbál'],
      tags: ['őszinteség', 'türelem', 'jóvátétel'],
    },
    'sport-ready-movement': {
      title: 'Sportkész mozgás',
      summary: 'Felépíti a játékokhoz, sportokhoz, játszótérhez és hosszú aktív napokhoz szükséges mozgásszókincset.',
      outcomes: ['Jobb céllal fut, szökdel, ugrál, dob, elkap és rúg', 'Biztonságos esést és testtávolságot gyakorol', 'Aktív játékkal állóképességet épít'],
      tags: ['játékok', 'sport', 'állóképesség'],
    },
    'hygiene-and-morning-routine': {
      title: 'Higiénia és reggeli rutin',
      summary: 'Nagyobb felelősséget vállal fogmosásban, fürdésben, ruházatban, fürdőszobai gondozásban és alvási ritmusban.',
      outcomes: ['Egyszerű reggeli vagy esti sorrendet teljesít', 'Segítséggel időjáráshoz illő ruhát választ', 'Észreveszi az éhséget, szomjúságot, fáradtságot és betegségjeleket'],
      tags: ['higiénia', 'rutin', 'testjelzések'],
    },
    'early-reading-writing': {
      title: 'Korai olvasás és írás',
      summary: 'Hangokat köt betűkhöz, egyszerű szöveget olvas, üzeneteket ír és jelentésre figyel.',
      outcomes: ['Egyszerű könyveket vagy szakaszokat olvas', 'Nevet, címkéket és rövid mondatokat ír', 'Elég ideig figyel, hogy tartalmi kérdésekre válaszoljon'],
      tags: ['olvasás', 'írás', 'hang-betű'],
    },
    'arithmetic-and-time-basics': {
      title: 'Számtan és idő alapjai',
      summary: 'Számokat használ összeadáshoz, kivonáshoz, összehasonlításhoz, méréshez, időhöz és egyszerű tervezéshez.',
      outcomes: ['Tárgyakkal vagy rajzokkal összead és kivon', 'Egyszerű órákat, naptárakat és menetrendeket olvas', 'Egy kis probléma lépéseit elmagyarázza'],
      tags: ['matek', 'idő', 'tervezés'],
    },
    'friendship-rules-and-conflict': {
      title: 'Barátságszabályok és konfliktus',
      summary: 'Fair playt, csoportszabályokat, bocsánatkérést, kirekesztést, csúfolást és segítségkérést tanul.',
      outcomes: ['Játékban és osztályban közös szabályokat követ', 'Konfliktusban kéz helyett szavakat használ', 'Észreveszi, ha egy társ kimarad vagy sérül'],
      tags: ['barátság', 'fair play', 'konfliktus'],
    },
    'household-helper': {
      title: 'Otthoni segítő',
      summary: 'Megbízható házimunkával, iskolai előkészülettel, egyszerű ételkészítéssel és holmik gondozásával járul hozzá.',
      outcomes: ['Listával bepakol vagy ellenőriz egy kis táskát', 'Terít, törölközőt hajtogat vagy ruhát válogat', 'Biztonságosan segít egyszerű uzsonnák készítésében'],
      tags: ['házimunka', 'étel', 'felelősség'],
    },
    'traffic-water-fire-basics': {
      title: 'Közlekedés, víz és tűz alapjai',
      summary: 'Gyakorlati szabályokat ért utakhoz, medencékhez, konyhához, tűzhöz, vészhelyzeti kontaktokhoz és eltévedéshez.',
      outcomes: ['Felnőtt által vezetett szabályokkal kel át utcán', 'Elmondja a családnevet, címet és vészhelyzeti kontaktot', 'Tudja, mit tegyen füst, tűz és mély víz körül'],
      tags: ['közlekedés', 'víz', 'tűz'],
    },
    'make-believe-to-projects': {
      title: 'Képzeletjátéktól projektekig',
      summary: 'A képzeletet rajzokká, építésekké, előadásokká, gyűjteményekké és több lépéses projektekké alakítja.',
      outcomes: ['Megtervez és befejez egy kis kreatív projektet', 'Történetet, rajzot, hangot vagy mozgást kombinál', 'Kezdő frusztrációt kezel alkotás közben'],
      tags: ['projektek', 'művészet', 'előadás'],
    },
    'responsibility-and-fairness': {
      title: 'Felelősség és igazságosság',
      summary: 'Az igazmondás, megállapodások betartása, közös tulajdon tisztelete és fair játék szokásait építi.',
      outcomes: ['Emlékeztetőkkel betart kisebb vállalásokat', 'Visszaad kölcsönkapott tárgyakat és tiszteli a közös tereket', 'El tudja magyarázni, miért igazságos vagy igazságtalan egy szabály'],
      tags: ['igazságosság', 'igazság', 'tulajdon'],
    },
    'stamina-strength-and-hand-skills': {
      title: 'Állóképesség, erő és kézügyesség',
      summary: 'Fejleszti az állóképességet, mászóbiztosságot, kézírást, szerszámkontrollt és sportalapokat.',
      outcomes: ['Aktív játékot tart fenn gyakori összeomlás nélkül', 'Javítja a kézírást, kötést, vágást és eszközfogást', 'Edzői segítséggel sport- vagy tánckészségeket gyakorol'],
      tags: ['állóképesség', 'kézírás', 'sport'],
    },
    'body-awareness-and-nutrition': {
      title: 'Testtudat és táplálkozás',
      summary: 'Szégyen vagy megszállottság nélkül köti össze az ételt, alvást, mozgást, higiéniát, hangulatot és koncentrációt.',
      outcomes: ['Segít kiegyensúlyozott ételeket és uzsonnákat választani', 'Kevesebb emlékeztetővel tartja a higiéniát', 'Pontosabban ír le fájdalmat, betegséget, stresszt vagy fáradtságot'],
      tags: ['táplálkozás', 'higiénia', 'hangulat'],
    },
    'fluent-reading-and-clear-speaking': {
      title: 'Folyékony olvasás és tiszta beszéd',
      summary: 'Tanuláshoz olvas, rendezett bekezdéseket ír, véleményeket magyaráz és jobb kérdéseket tesz fel.',
      outcomes: ['Fejezetes könyveket vagy ismeretterjesztő szöveget olvas', 'Bekezdést ír fő gondolattal', 'Tisztán beszél felnőttekkel és társakkal'],
      tags: ['folyékonyság', 'bekezdések', 'kérdések'],
    },
    'multiplication-money-measure': {
      title: 'Szorzás, pénz és mérés',
      summary: 'Matematikát használ szorzáshoz, osztási alapokhoz, pénzhez, méréshez, térképekhez és többlépéses feladatokhoz.',
      outcomes: ['Érti az egyenlő csoportokat és egyszerű osztást', 'Pénzt számol és árakat hasonlít össze', 'Valódi feladatokhoz hosszt, időt, súlyt és távolságot mér'],
      tags: ['szorzás', 'pénz', 'mérés'],
    },
    'teamwork-and-reputation': {
      title: 'Csapatmunka és hírnév',
      summary: 'Megérti a csapatokat, lojalitást, csúfolást, bevonást, bizalmat és azt, hogyan épít viselkedés hírnevet.',
      outcomes: ['Közös csapat- vagy csoportcélért dolgozik', 'Érettebben kezeli a győzelmet, vereséget és korrekciót', 'Felismeri a zaklatást, pletykát és nyomást'],
      tags: ['csapatmunka', 'hírnév', 'zaklatás'],
    },
    'tools-cooking-and-care': {
      title: 'Szerszámok, főzés és gondozás',
      summary: 'Felügyelt szerszámhasználatot, egyszerű főzést, állat- vagy növénygondozást, javítási próbákat és személyes rendszerezést tanul.',
      outcomes: ['Alapvető szerszámokat felügyelettel és tisztelettel használ', 'Egyszerű ételt vagy uzsonnasort készít', 'Rendben tart egy táskát, íróasztalt vagy szobazónát'],
      tags: ['szerszámok', 'főzés', 'rendszerezés'],
    },
    'digital-and-community-safety': {
      title: 'Digitális és közösségi biztonság',
      summary: 'Szabályokat épít képernyőkre, idegenekre, titkokra, nyilvános terekre, magánszférára és korai segítségkérésre.',
      outcomes: ['Védi a neveket, fotókat, helyszínt és jelszavakat', 'Megbízható felnőtt szabályait használja online üzeneteknél', 'Világos határokkal mozog környékbeli terekben'],
      tags: ['digitális', 'magánszféra', 'közösség'],
    },
    'craft-design-and-performance': {
      title: 'Kézművesség, design és előadás',
      summary: 'Gyakorlással, javítással, közönségtudattal és mintákból tanulva finomítja kreatív ízlését.',
      outcomes: ['Visszajelzés után javít egy alkotáson', 'Anyagokat gondosabban és szándékosabban használ', 'Munkáját előadással, kiállítással vagy magyarázattal megosztja'],
      tags: ['kézművesség', 'javítás', 'közönség'],
    },
    'courage-and-accountability': {
      title: 'Bátorság és elszámoltathatóság',
      summary: 'Felelősséget vállal döntéseiért, nehezebb igazságokat mond, jobban kér bocsánatot és nehéz dolgokat próbál.',
      outcomes: ['Hibát vállal anélkül, hogy először másra hárítaná', 'Edzés után nehéz feladatba kezd', 'Megvéd egy fair szabályt vagy kiszolgáltatott társat'],
      tags: ['bátorság', 'felelősségvállalás', 'bocsánatkérés'],
    },
    'athletic-literacy-and-posture': {
      title: 'Atlétikai műveltség és testtartás',
      summary: 'Megérti a bemelegítést, testtartást, regenerációt, koordinációt, erőalapokat és egészséges versengést.',
      outcomes: ['Bemelegítési, levezetési és regenerációs szokásokat gyakorol', 'Testtartásra és ízületi biztonságra figyelve mozog', 'Gyakorlási naplóval vagy edzői visszajelzéssel fejlődik'],
      tags: ['atlétika', 'testtartás', 'gyakorlás'],
    },
    'independent-care-and-puberty-prep': {
      title: 'Önálló gondoskodás és pubertásra készülés',
      summary: 'Felkészül a pubertásra higiéniával, testtiszteletettel, alvással, étellel, érzelmekkel és megbízható kérdésekkel.',
      outcomes: ['Kezeli a dezodort, fürdést, mosási alapokat és tiszta ruhákat', 'Szégyen nélkül érti a pubertáskori változásokat', 'Egészségügyi kérdéseket tesz fel megbízható felnőtteknek'],
      tags: ['pubertás', 'higiénia', 'testtisztelet'],
    },
    'research-writing-and-debate': {
      title: 'Kutatás, írás és vita',
      summary: 'Olvasást, írást, bizonyítékot és beszélgetést használ, hogy a közvetlen tanításon túl tanuljon.',
      outcomes: ['Néhány megbízható forrásból információt talál', 'Több bekezdéses magyarázatokat ír', 'Sértések helyett érvekkel vitatkozik'],
      tags: ['kutatás', 'bizonyíték', 'vita'],
    },
    'logic-systems-and-planning': {
      title: 'Logika, rendszerek és tervezés',
      summary: 'Nagyobb feladatokat tervez, rendszereket vesz észre, következményeket becsül és valódi helyzetekben használ matematikát.',
      outcomes: ['Egy egyhetes feladatot lépésekre bont', 'Törteket, térképeket, költségvetést vagy méréseket gyakorlatban használ', 'Döntés előtt elmagyarázza az átváltásokat'],
      tags: ['tervezés', 'rendszerek', 'átváltások'],
    },
    'loyalty-boundaries-and-leadership': {
      title: 'Lojalitás, határok és vezetés',
      summary: 'Egyensúlyozza az odatartozást a lelkiismerettel, kezeli a kortárs nyomást és nyugodt vezetést gyakorol.',
      outcomes: ['Megőrzi a barátságot anélkül, hogy kegyetlenséghez vagy szabályszegéshez csatlakozna', 'Világosan és tisztelettel mond határokat', 'Dominálás nélkül vezet egy kis csoportfeladatot'],
      tags: ['vezetés', 'kortárs nyomás', 'határok'],
    },
    'home-competence-and-resourcefulness': {
      title: 'Otthoni kompetencia és találékonyság',
      summary: 'Főzéssel, takarítással, tervezéssel, alapjavítással és közös erőforrások gondozásával hasznossá válik otthon.',
      outcomes: ['Közel lévő felügyelettel egyszerű ételt főz', 'Saját terét rendszerből tartja rendben, nem pánikból', 'Biztonságos megoldásokat keres vagy rögtönöz, mielőtt feladná'],
      tags: ['otthoni készségek', 'javítás', 'találékonyság'],
    },
    'risk-judgment-and-first-aid': {
      title: 'Kockázatítélet és elsősegély',
      summary: 'Kockázatot ítél meg testben, csoportban, képernyőkön, szerszámoknál, utakon, időjárásban és vészhelyzetekben.',
      outcomes: ['Alap elsősegélyt használ kisebb vágásokra, égésekre és orrvérzésre', 'Megnevezi a veszélyes kihívásokat, manipulációt és titkolózást', 'Tudja, mikor hívjon vészhelyzeti szolgálatot vagy felnőttet'],
      tags: ['elsősegély', 'kockázat', 'vészhelyzet'],
    },
    'creative-voice-and-craft': {
      title: 'Kreatív hang és mesterség',
      summary: 'Személyes kreatív hangot fejleszt kitartó gyakorlással, ízléssel, visszajelzéssel és bátorsággal.',
      outcomes: ['Vázlatfüzetet, naplót, építési naplót vagy gyakorlási szokást tart', 'Megnevezi hatásait és döntéseit a munkájában', 'Befejez valami elég jelentőset ahhoz, hogy megossza'],
      tags: ['hang', 'gyakorlás', 'megosztás'],
    },
    'integrity-service-and-self-respect': {
      title: 'Integritás, szolgálat és önbecsülés',
      summary: 'Az erőt gondoskodással köti össze: igazmondással, felelősséggel, hozzájárulással, alázattal és önbecsüléssel.',
      outcomes: ['Akkor is helyesen cselekszik, amikor ez társas kényelmetlenséggel jár', 'Valódi módon szolgálja családját, csapatát, osztályát vagy környékét', 'Saját testét és másokat méltósággal kezeli'],
      tags: ['integritás', 'szolgálat', 'önbecsülés'],
    },
    ...buildHungarianExpandedSkillCopy(),
  } satisfies Record<string, SkillCopy>,
  domainGuides: {
    movement: {
      imageTone: 'Erdei mozgásösvény',
      imageMotifs: ['egyensúlygerenda', 'puha mászóformák', 'nyúlási utak'],
      subdomains: ['nagymozgás', 'finommotorika', 'egyensúly', 'állóképesség', 'testtartás', 'testtudat'],
      growthArc: {
        infancy: 'Érzékel, nyúl, fordul, ül, mászik és tájékozódik.',
        toddler: 'Jár, mászik, cipel, guggol, megáll és visszanyeri az egyensúlyát.',
        preschool: 'Összehangolja az ugrást, dobást, elkapást, pedálozást és kézkontrollt.',
        'early-school': 'Játékmozgást, állóképességet, térérzéket és biztonságos esést épít.',
        'middle-childhood': 'Finomítja az állóképességet, kézírást, eszközöket és sportalapokat.',
        'later-childhood': 'Bemelegítést, testtartást, erőalapokat és regenerációt gyakorol.',
        preteen: 'Növekedési ugrásokhoz, koordinációváltozásokhoz, testtartáshoz és gyakorlási szokásokhoz alkalmazkodik.',
        'early-adolescence': 'Technikát, regenerációt, testi önbizalmat és nyomás alatti biztonságos versengést gyakorol.',
        'middle-adolescence': 'Erőt, állóképességet, mobilitást és sérülésmegelőzést épít edzői segítséggel.',
        'late-adolescence': 'Saját fitneszt, regenerációt, fizikai normákat és egészséges kihívást vállal.',
      },
      practiceLoop: ['Mutasd lassan a mozgást', 'Hagyd játékos változatokkal ismételni', 'Adj hozzá egy kis kihívást, amikor könnyűvé válik'],
      materials: ['szabad padló', 'labdák', 'kockák', 'alacsony mászófelületek', 'papír és ceruzák'],
      observe: ['koordináció', 'fáradás', 'önbizalom', 'testkontroll', 'biztonságos kockázatítélet'],
    },
    care: {
      imageTone: 'Meleg napi ritmus jelenet',
      imageMotifs: ['napkelte rutin', 'vizes pohár', 'összehajtott ruhák'],
      subdomains: ['alvás', 'étkezés', 'higiénia', 'testjelzések', 'érzelmi szabályozás', 'pubertásra készülés'],
      growthArc: {
        infancy: 'Kiszámítható alvást, etetést, vigaszt és éber játékot épít.',
        toddler: 'Megnevezi szükségleteit, segítséggel megnyugszik és részt vesz egyszerű rutinokban.',
        preschool: 'WC-t, mosakodást, fogmosást, öltözést és testneveket gyakorol.',
        'early-school': 'Kevesebb emlékeztetővel viszi a reggeli és esti sorrendet.',
        'middle-childhood': 'Összeköti az ételt, alvást, hangulatot, mozgást és koncentrációt.',
        'later-childhood': 'Pubertásra, mosásra, tiszta ruhákra és egészségügyi kérdésekre készül.',
        preteen: 'Korai pubertást, ápoltságot, alvásváltozásokat és privát egészségügyi kérdéseket kezel.',
        'early-adolescence': 'Érzelmi helyreállást, táplálkozást, higiéniát és egészségügyi magánszférát gyakorol.',
        'middle-adolescence': 'Időpontokat, stresszt, alváshiányt, edzést és kockázati beszélgetéseket kezel.',
        'late-adolescence': 'Egészségügyi rendszerek, biztosítási alapok, gyógyszerek és megelőző ellátás felelősségére készül.',
      },
      practiceLoop: ['Kösd a készséget valódi napi rutinhoz', 'Használj rövid vizuális vagy szóbeli ellenőrzőlistát', 'Fokozatosan adj át egy-egy lépést'],
      materials: ['tükör', 'időzítő', 'szennyeskosár', 'fogkefe', 'vizes palack'],
      observe: ['önállóság', 'testtudat', 'szégyen nélküli kérdések', 'következetesség', 'stressz utáni helyreállás'],
    },
    language: {
      imageTone: 'Türkiz történetasztal',
      imageMotifs: ['nyitott könyv', 'beszédbuborékok', 'ceruzavonalak'],
      subdomains: ['figyelés', 'beszéd', 'szókincs', 'olvasás', 'írás', 'bizonyíték'],
      growthArc: {
        infancy: 'Tekinteten, hangokon, gesztusokon és váltakozáson át oszt meg figyelmet.',
        toddler: 'Embereket és tárgyakat nevez meg, kér és egyszerű utasításokat követ.',
        preschool: 'Történeteket mesél, miérteket kérdez és sorrendben mesél vissza.',
        'early-school': 'Hangokat köt betűkhöz és egyszerű üzeneteket ír.',
        'middle-childhood': 'Tanuláshoz olvas, bekezdéseket ír és véleményeket magyaráz.',
        'later-childhood': 'Kutat, okokat idéz és sértés nélkül vitatkozik.',
        preteen: 'Olvasást, írást, keresést és beszélgetést használ hosszabb iskolai és személyes projektekhez.',
        'early-adolescence': 'Bizonyítékkal érvel, érzelem alatt is figyel, és védi digitális hangját.',
        'middle-adolescence': 'Valódi közönségnek ír, prezentál, interjúzik és kutat.',
        'late-adolescence': 'Felnőtt módon kommunikál munkahelyi, iskolai, állampolgári és intim helyzetekben.',
      },
      practiceLoop: ['Beszéljetek arról, ami épp történik', 'Hívd meg, hogy magyarázza vissza', 'Adj hozzá egy új szót, okot vagy mondatszerkezetet'],
      materials: ['könyvek', 'címkék', 'papír', 'történetkártyák', 'családi beszélgetések'],
      observe: ['váltakozás', 'érthetőség', 'megértés', 'kíváncsiság', 'pontosság'],
    },
    reasoning: {
      imageTone: 'Kék problémamegoldó műhely',
      imageMotifs: ['számlapkák', 'mintakockák', 'térképvonalak'],
      subdomains: ['memória', 'minták', 'számolás', 'matek', 'tervezés', 'rendszerek'],
      growthArc: {
        infancy: 'Tárgyakat, ok-okozatot, elrejtést és ismétlést fedez fel.',
        toddler: 'Rendez, tornyoz, párosít, tesztel és alternatív megoldásokat próbál.',
        preschool: 'Kis halmazokat számol, formákat nevez meg és mintákat jósol.',
        'early-school': 'Összead, kivon, időt olvas és problémalépéseket magyaráz.',
        'middle-childhood': 'Szorzást, pénzt, mérést és térképeket használ.',
        'later-childhood': 'Nagyobb feladatokat tervez, következményeket becsül és átváltásokat hasonlít.',
        preteen: 'Többlépéses iskolai munkát, pénzdöntéseket, digitális információt és beosztást kezel.',
        'early-adolescence': 'Elvontabban gondolkodik rendszerekről, ösztönzőkről, bizonyítékról és következményekről.',
        'middle-adolescence': 'Tervezést, adatokat, költségvetést és kockázatelemzést használ valódi döntésekben.',
        'late-adolescence': 'Felnőtt átmeneteket tervez, életutakat hasonlít össze és hosszú távú átváltásokon gondolkodik.',
      },
      practiceLoop: ['Kezdj konkrét tárgyi problémával', 'Kérdezd meg, mi változott vagy mi jön ezután', 'Hagyd, hogy szavakkal vagy rajzzal mutassa a lépéseket'],
      materials: ['érmék', 'kockák', 'mérőszalag', 'naptár', 'térképek'],
      observe: ['stratégia', 'kitartás', 'becslés', 'mintafelismerés', 'magyarázat'],
    },
    social: {
      imageTone: 'Korall összetartozási kör',
      imageMotifs: ['két szék', 'közös játékelemek', 'javító híd'],
      subdomains: ['kötődés', 'érzelemszavak', 'empátia', 'barátság', 'konfliktus', 'vezetés'],
      growthArc: {
        infancy: 'Bízik ismerős felnőttekben, vigaszt keres és figyelmet oszt meg.',
        toddler: 'Társak közelében játszik, váltakozást gyakorol és konfliktus után javít.',
        preschool: 'Érzéseket nevez meg, szerepeket oszt meg és felnőtt segítséggel old meg problémákat.',
        'early-school': 'Fair playt, csoportszabályokat, bocsánatkérést és bevonást használ.',
        'middle-childhood': 'Csapatokat, hírnevet, csúfolást, nyomást és lojalitást kezel.',
        'later-childhood': 'Nyugodtan vezet, határokat állít és nyomás alatt is tartja a lelkiismeretét.',
        preteen: 'Pubertást, erősebb összehasonlítást, odatartozást és digitális hírnevet kezel.',
        'early-adolescence': 'Barátságokat, határokat, jóvátételt és identitást tart meg erősebb érzelmek alatt.',
        'middle-adolescence': 'Ismerkedési határokat, csapatvezetést, hírnevet és társas bátorságot gyakorol.',
        'late-adolescence': 'Felnőtt barátságot, intimitást, együttműködést és közösségi hozzájárulást épít.',
      },
      practiceLoop: ['Nevezd meg egyszerűen a társas helyzetet', 'Gyakoroljátok a pontos mondatokat', 'Hibák után gyorsan javítsatok'],
      materials: ['váltakozós játékok', 'érzelemkártyák', 'csapat házimunkák', 'szerepjáték ötletek'],
      observe: ['empátia', 'jóvátétel', 'igazságosság', 'kortárs nyomás', 'nyugodt vezetés'],
    },
    practical: {
      imageTone: 'Olívazöld hasznos otthoni munkapad',
      imageMotifs: ['kis szerszámok', 'hajtogatott törölköző', 'uzsonnás tányér'],
      subdomains: ['önálló evés', 'házimunkák', 'rendszerezés', 'főzés', 'szerszámok', 'találékonyság'],
      growthArc: {
        infancy: 'Fog, elenged, szájjal vizsgál, áttesz és biztonságos ételeket fedez fel.',
        toddler: 'Kanállal és pohárral próbálkozik, dolgokat cipel és kis házimunkákat másol.',
        preschool: 'Rendet rak, tárgyakat előkészít, növényt locsol és feltöröl.',
        'early-school': 'Táskát pakol, terít, törölközőt hajtogat és uzsonnát készít.',
        'middle-childhood': 'Szerszámokat használ, egyszerű ételeket főz, tereket gondoz és rendszerez.',
        'later-childhood': 'Főz, takarít, tervez, javít és közös erőforrásokat gondoz.',
        preteen: 'Személyes rendszereket, egyszerű ételeket, házimunkát, helyi ügyeket és időtervezést vállal.',
        'early-adolescence': 'Szerszámokat, pénzt, közlekedést, naptárakat és közös tereket használ önállóbban.',
        'middle-adolescence': 'Munkaszokásokat, közlekedési készültséget, költségvetést és gyakorlati megbízhatóságot épít.',
        'late-adolescence': 'Önálló életre, munkára, dokumentumokra, pénzre és háztartási normákra készül.',
      },
      practiceLoop: ['Adj neki valódi munkát valódi anyagokkal', 'Tedd láthatóvá a szintet', 'Engedd, hogy az ismétlés kompetenciát építsen'],
      materials: ['kosár', 'rongy', 'biztonságos eszközök', 'egyszerű szerszámok', 'címkék'],
      observe: ['hasznosság', 'sorrendemlékezet', 'eszközök gondozása', 'kezdeményezés', 'takarítás minősége'],
    },
    safety: {
      imageTone: 'Agyagszínű határtérkép',
      imageMotifs: ['pajzs jelölő', 'gyalogátkelő', 'elsősegély jel'],
      subdomains: ['testhatárok', 'közlekedés', 'víz', 'tűz', 'digitális magánszféra', 'elsősegély'],
      growthArc: {
        infancy: 'Védett rutinokat és megbízható testjelzéseket épít.',
        toddler: 'Sürgős biztonsági szavakra reagál utcán, hőnél, magasságnál és víznél.',
        preschool: 'Magán testrészeket, beleegyezést és megbízható felnőtt szabályokat tanul.',
        'early-school': 'Közlekedési, vízi, tűzvédelmi, cím- és vészhelyzeti alapokat használ.',
        'middle-childhood': 'Online magánszférát véd és közösségi határok között tájékozódik.',
        'later-childhood': 'Kockázatot ítél meg, felismeri a veszélyes nyomást és alap elsősegélyt használ.',
        preteen: 'Telefonokat, magánszférát, pubertáskori határokat, kihívásokat és közösségi mozgást kezel.',
        'early-adolescence': 'Ellenáll manipulációnak, veszélyes titkolózásnak, szerhasználati nyomásnak és digitális csapdáknak.',
        'middle-adolescence': 'Vezetési helyzetekre, randibiztonságra, bulikra, munkahelyekre és vészhelyzetekre készül.',
        'late-adolescence': 'Felnőtt biztonsági ítéletet, beleegyezést, egészségkockázatot, krízisválaszt és jogi téteket vállal.',
      },
      practiceLoop: ['Tanítsd meg a szabályt a kockázatos helyzet előtt', 'Próbáljátok el a pontos cselekvést', 'A helyzet után nyugodtan beszéljétek át'],
      materials: ['családi biztonsági szavak', 'vészhelyzeti kártya', 'gyakorló telefon', 'elsősegély készlet'],
      observe: ['megállási képesség', 'testhatárok', 'segítségkérés', 'magánszféra', 'kockázatítélet'],
    },
    creativity: {
      imageTone: 'Ibolya alkotóműterem',
      imageMotifs: ['papírformák', 'ritmusjelek', 'építőelemek'],
      subdomains: ['szerepjáték', 'rajzolás', 'zene', 'építés', 'előadás', 'kreatív hang'],
      growthArc: {
        infancy: 'Élvezi a ritmust, kukucsot, textúrát, hangokat és utánzást.',
        toddler: 'Napi életet játszik el hangokkal, szerepekkel és tárgyakkal.',
        preschool: 'Rajzol, énekel, épít, mozog és láthatóvá teszi az ötleteket.',
        'early-school': 'Kis kreatív projekteket fejez be frusztrációtámogatással.',
        'middle-childhood': 'Mesterséget javít, közönséggel oszt meg és mintákból tanul.',
        'later-childhood': 'Hangot, gyakorlási szokásokat, hatásokat és jelentős munkát fejleszt.',
        preteen: 'Ízlést, rajongásokat, eszközöket és korai portfóliószokásokat használ identitásfelfedezéshez.',
        'early-adolescence': 'Érzelmet és identitást fegyelmezett alkotássá és előadássá alakít.',
        'middle-adolescence': 'Visszajelzéssel, közönséggel, korlátokkal és tartós projektekkel finomítja mesterségét.',
        'late-adolescence': 'Érettebb kreatív gyakorlatot, portfóliót, ízlést és hozzájárulást épít.',
      },
      practiceLoop: ['Adj olyan anyagokat, ahol nincs egyetlen jó válasz', 'Kérdezd meg, mit készít vagy próbál', 'Segíts egy döntés javításában'],
      materials: ['papír', 'kockák', 'zene', 'jelmezek', 'újrahasznosított anyagok'],
      observe: ['eredetiség', 'fókusz', 'javítás', 'ízlés', 'megosztási bátorság'],
    },
    character: {
      imageTone: 'Palaszürke közösségi iránytű',
      imageMotifs: ['kis iránytű', 'közös asztal', 'stabil ösvény'],
      subdomains: ['türelem', 'őszinteség', 'felelősség', 'bátorság', 'szolgálat', 'önbecsülés'],
      growthArc: {
        infancy: 'Támogatással figyelmet, kíváncsiságot, helyreállást és rövid várakozást gyakorol.',
        toddler: 'Határokat tanul és segítséggel javítja a hibákat.',
        preschool: 'Egyszerű igazságot mond, vár, újrapróbálja és kis kárt javít.',
        'early-school': 'Kis vállalásokat tart be és tiszteli a közös tulajdont.',
        'middle-childhood': 'Vállalja a hibákat, nehéz dolgokat próbál és megvéd fair szabályokat.',
        'later-childhood': 'Az erőt integritással, szolgálattal, alázattal és méltósággal köti össze.',
        preteen: 'Őszinteséget, türelmet és önbecsülést tart meg összehasonlítás és kortárs nyomás alatt.',
        'early-adolescence': 'Identitást, bátorságot, alázatot, szolgálatot és jóvátételt formál érzelmi intenzitásban.',
        'middle-adolescence': 'Elszámoltathatóságot, munkamorált, önfegyelmet és elvi kockázatvállalást gyakorol.',
        'late-adolescence': 'Felnőtt jellemre készül: integritásra, szolgálatra, gondnokságra, méltóságra és célra.',
      },
      practiceLoop: ['Nevezd meg az értéket egy konkrét pillanatban', 'Adj kis felelősséget követéssel', 'Szégyenítés nélkül nézzétek át, mi történt'],
      materials: ['családi feladatok', 'javító mondat', 'szolgálati lehetőségek', 'reflexiós kérdések'],
      observe: ['őszinteség', 'végigvitel', 'jóvátétel', 'bátorság', 'méltóság'],
    },
  } satisfies Record<DomainId, DomainGuideCopy>,
  stagePracticePrompts: {
    infancy: ['Legyen meleg, rövid, érzékszervi és gondozó által vezetett', 'Ismételjétek gyakran hétköznapi rutinokban'],
    toddler: ['Használj egyszerű szavakat és egylépéses meghívásokat', 'Gyakorlást várj, ne mesterséget'],
    preschool: ['Fordítsd a készséget szerepjátékká vagy kis munkává', 'Használj látható rutinokat és gyors jóvátételt'],
    'early-school': ['Hagyd, hogy elmagyarázza a szabályt vagy sorrendet', 'Tedd a munkát hasznossá otthon, osztályban vagy játékban'],
    'middle-childhood': ['Adj felelősséget, visszajelzést és mérhető javulást', 'Hagyd stratégiákat összehasonlítani'],
    'later-childhood': ['Hívd be az ítélőképességet, tervezést és reflexiót', 'Kösd a készséget méltósághoz és hozzájáruláshoz'],
    preteen: ['Tedd konkréttá a készséget pubertás-, kortárs-, digitális és iskolai helyzetekben', 'Hagyd, hogy kövesse a haladást és segítséget kérjen'],
    'early-adolescence': ['Párosítsd az önállóságot kimondott határokkal és őszinte átbeszéléssel', 'Valódi helyzeteket használj, ne csak magyarázatot'],
    'middle-adolescence': ['Adj értelmes felelősséget látható normákkal', 'Kapcsold a gyakorlást munkához, kapcsolatokhoz, kockázathoz és jövőbeli utakhoz'],
    'late-adolescence': ['Mozgasd felnőtt felelősség felé tanácsadó támogatással', 'Kérj terveket, bizonyítékot, reflexiót és jóvátételt'],
  } satisfies Record<StageId, string[]>,
  viewModes: [
    { id: 'world', label: 'Világ' },
    { id: 'path', label: 'Út' },
    { id: 'node', label: 'Csomópont' },
  ] as Array<{ id: ViewModeId; label: string }>,
  relationLabels: {
    selected: 'Kijelölt',
    'direct-before': 'Előzmény',
    'direct-next': 'Következő',
    ancestor: 'Gyökérút',
    descendant: 'Ág',
    matched: 'Találat',
  } satisfies Record<RelationLabelId, string>,
  roleLabels: {
    root: 'Gyökér',
    keystone: 'Kulcspont',
    bridge: 'Híd',
    leaf: 'Levél',
    ordinary: 'Készség',
  } satisfies Record<GraphRoleId, string>,
}
