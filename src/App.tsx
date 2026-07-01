import type { CSSProperties, FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Edge, Node, NodeProps } from '@xyflow/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Activity,
  BadgeCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Compass,
  Filter,
  GitBranch,
  Handshake,
  HeartPulse,
  Languages,
  MessageCircle,
  Paintbrush,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import './App.css'
import headerImage from './assets/skill-tree-header.png'
import type { DomainGuide } from './data/domainGuides'
import {
  type Domain,
  type DomainId,
  type SkillAspectId,
  type SkillNode,
  type Stage,
  type StageId,
} from './data/skillTree'
import {
  getLocalizedContent,
  languageOptions,
  loadLanguage,
  saveLanguage,
  type Language,
  type UiCopy,
} from './i18n/localization'
import { createProfile, loadProfiles, saveProfiles, type KidProfile } from './storage/profiles'

type DomainFocus = DomainId | 'all'
type StageFocus = StageId | 'all'
type ViewMode = 'world' | 'path' | 'node'
type Relation = 'selected' | 'direct-before' | 'direct-next' | 'ancestor' | 'descendant' | 'matched'
type GraphRole = 'root' | 'keystone' | 'bridge' | 'leaf' | 'ordinary'
type ViewportTier = 'mobile' | 'tablet' | 'desktop'

type SkillNodeData = {
  skill: SkillNode
  domain: Domain
  stage: Stage
  relation?: Relation
  role: GraphRole
  badgeLabel: string
  readyLabel: string
  dimmed: boolean
  compact: boolean
  completed: boolean
  ready: boolean
  unlockCount: number
}

const nodeTypes = {
  skill: SkillMapNode,
}

const domainIcons: Record<DomainId, LucideIcon> = {
  movement: Activity,
  care: HeartPulse,
  language: MessageCircle,
  reasoning: Brain,
  social: Handshake,
  practical: Wrench,
  safety: ShieldCheck,
  creativity: Paintbrush,
  character: BadgeCheck,
}

const topicMotifs: Record<DomainId, ReactNode> = {
  movement: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="0" cy="-18" r="13" fill="#fffefa" opacity="0.74" strokeWidth="3" />
      <path d="M-24 4 C-8 -8, 10 -8, 26 4" strokeWidth="7" opacity="0.36" />
      <path d="M-18 25 L0 5 L22 27" strokeWidth="5" />
      <path d="M-28 36 C-8 28, 11 28, 32 36" strokeWidth="4" opacity="0.5" />
    </g>
  ),
  care: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 -32 C24 -8, 22 23, 0 35 C-22 23, -24 -8, 0 -32Z" fill="#fffefa" opacity="0.76" strokeWidth="3" />
      <path d="M-22 7 H-8 L-2 -8 L8 22 L15 7 H26" strokeWidth="5" />
      <circle cx="0" cy="4" r="31" strokeWidth="2" opacity="0.32" />
    </g>
  ),
  language: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-34 -20 H28 Q38 -20, 38 -8 V11 Q38 23, 26 23 H-4 L-24 38 V23 H-34 Q-44 23, -44 11 V-8 Q-44 -20, -34 -20Z" fill="#fffefa" opacity="0.78" strokeWidth="3" />
      <path d="M-24 -4 H20 M-24 9 H8" strokeWidth="4" />
      <circle cx="27" cy="9" r="4" fill="var(--domain-color)" strokeWidth="0" />
    </g>
  ),
  reasoning: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-34" y="-28" width="68" height="56" rx="10" fill="#fffefa" opacity="0.72" strokeWidth="3" />
      <path d="M-18 -12 H-3 V3 H13 V18 M-18 18 H-4 M14 -12 H22" strokeWidth="4" />
      <circle cx="-18" cy="-12" r="5" fill="var(--domain-color)" strokeWidth="0" />
      <circle cx="13" cy="3" r="5" fill="var(--domain-color)" strokeWidth="0" />
      <circle cx="22" cy="-12" r="5" fill="var(--domain-color)" strokeWidth="0" />
    </g>
  ),
  social: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-30 23 C-22 4, -8 -5, 0 -5 C8 -5, 22 4, 30 23" strokeWidth="6" opacity="0.42" />
      <circle cx="-24" cy="-8" r="14" fill="#fffefa" opacity="0.78" strokeWidth="3" />
      <circle cx="24" cy="-8" r="14" fill="#fffefa" opacity="0.78" strokeWidth="3" />
      <path d="M-10 12 C-3 19, 3 19, 10 12" strokeWidth="4" />
    </g>
  ),
  practical: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-33" y="-19" width="48" height="43" rx="8" fill="#fffefa" opacity="0.76" strokeWidth="3" />
      <path d="M-22 -19 V-29 H3 V-19 M23 -27 L38 -12 L6 20 L-9 5 Z" strokeWidth="4" />
      <path d="M-20 -3 H-2 M-20 11 H5" strokeWidth="4" opacity="0.56" />
    </g>
  ),
  safety: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 -35 L34 -21 V3 C34 24, 16 35, 0 42 C-16 35, -34 24, -34 3 V-21 Z" fill="#fffefa" opacity="0.78" strokeWidth="3" />
      <path d="M-13 4 L-2 15 L18 -12" strokeWidth="6" />
      <circle cx="0" cy="3" r="27" strokeWidth="2" opacity="0.28" />
    </g>
  ),
  creativity: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-34 24 C-23 -18, 8 -34, 33 -20 C19 -4, 7 13, -2 35" fill="#fffefa" opacity="0.72" strokeWidth="3" />
      <path d="M-17 15 C-2 7, 7 -7, 18 -17 M-32 35 C-22 29, -13 29, -2 35" strokeWidth="5" />
      <circle cx="28" cy="-25" r="5" fill="var(--domain-color)" strokeWidth="0" />
    </g>
  ),
  character: (
    <g fill="none" stroke="var(--domain-color)" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="0" cy="0" r="34" fill="#fffefa" opacity="0.74" strokeWidth="3" />
      <path d="M0 -25 L9 -4 L30 0 L9 7 L0 29 L-9 7 L-30 0 L-9 -4 Z" strokeWidth="4" />
      <circle cx="0" cy="0" r="7" fill="var(--domain-color)" strokeWidth="0" />
    </g>
  ),
}

const defaultSkillId = 'social-infancy-belonging-attachment'

const worldOverviewAspectIds = new Set<SkillAspectId>([
  'body-control',
  'sleep-recovery',
  'listening-attention',
  'number-sense',
  'belonging-attachment',
  'self-feeding-cooking',
  'body-boundaries',
  'sensory-play',
  'patience-attention',
])

function App() {
  return (
    <ReactFlowProvider>
      <SkillTreeApp />
    </ReactFlowProvider>
  )
}

function SkillTreeApp() {
  const [language, setLanguage] = useState<Language>(loadLanguage)
  const [selectedId, setSelectedId] = useState(defaultSkillId)
  const [query, setQuery] = useState('')
  const [focusedDomain, setFocusedDomain] = useState<DomainFocus>('all')
  const [focusedStage, setFocusedStage] = useState<StageFocus>('infancy')
  const [viewMode, setViewMode] = useState<ViewMode>('path')
  const [viewportTier, setViewportTier] = useState<ViewportTier>(getViewportTier)
  const [profiles, setProfiles] = useState<KidProfile[]>(loadProfiles)
  const [activeProfileId, setActiveProfileId] = useState(() => loadProfiles()[0]?.id ?? 'default-child')
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileAge, setNewProfileAge] = useState<StageId>('infancy')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SkillNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { fitView } = useReactFlow()

  const localized = useMemo(() => getLocalizedContent(language), [language])
  const {
    ui,
    treeMeta,
    domains,
    stages,
    skills,
    domainGuides,
    stagePracticePrompts,
    viewModes,
    relationLabels,
    roleLabels,
  } = localized
  const stageLabelById = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages])
  const domainById = useMemo(() => new Map(domains.map((domain) => [domain.id, domain])), [domains])
  const activeProfile = (profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? loadProfiles()[0])!
  const activeProfileName = getProfileDisplayName(activeProfile, ui)
  const completedIds = useMemo(
    () => new Set(activeProfile?.completedSkillIds ?? []),
    [activeProfile?.completedSkillIds],
  )

  const skillById = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills])

  const unlockMap = useMemo(() => {
    const map = new Map<string, SkillNode[]>()

    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) {
        const existing = map.get(prerequisite) ?? []
        existing.push(skill)
        map.set(prerequisite, existing)
      }
    }

    return map
  }, [skills])

  const graphEdges = useMemo(() => {
    return skills.flatMap((skill) =>
      skill.prerequisites
        .map((prerequisiteId) => {
          const prerequisite = skillById.get(prerequisiteId)
          return prerequisite ? { from: prerequisite, to: skill } : undefined
        })
        .filter((edge): edge is { from: SkillNode; to: SkillNode } => Boolean(edge)),
    )
  }, [skillById, skills])

  const selectedSkill = skillById.get(selectedId) ?? skillById.get(defaultSkillId) ?? skills[0]
  const selectedDomain = domainById.get(selectedSkill.domain) ?? domains[0]
  const selectedGuide = domainGuides[selectedSkill.domain]
  const SelectedDomainIcon = domainIcons[selectedDomain.id]
  const selectedUnlocks = useMemo(() => unlockMap.get(selectedSkill.id) ?? [], [selectedSkill.id, unlockMap])
  const selectedPrerequisites = useMemo(
    () =>
      selectedSkill.prerequisites
        .map((id) => skillById.get(id))
        .filter((skill): skill is SkillNode => Boolean(skill)),
    [selectedSkill.prerequisites, skillById],
  )

  const normalizedQuery = query.trim().toLocaleLowerCase(ui.locale)
  const activeQuery = normalizedQuery.length >= 2 ? normalizedQuery : ''
  const matchedSkills = useMemo(() => {
    if (!activeQuery) {
      return skills
    }

    return skills.filter((skill) => {
      const haystack = [
        skill.title,
        skill.summary,
        domainById.get(skill.domain)?.label ?? skill.domain,
        domainById.get(skill.domain)?.shortLabel ?? skill.domain,
        stageLabelById.get(skill.stage)?.title ?? skill.stage,
        stageLabelById.get(skill.stage)?.age ?? skill.stage,
        ...skill.outcomes,
        ...skill.tags,
      ]
        .join(' ')
        .toLocaleLowerCase(ui.locale)

      return haystack.includes(activeQuery)
    })
  }, [activeQuery, domainById, skills, stageLabelById, ui.locale])

  const matchedIds = useMemo(() => new Set(matchedSkills.map((skill) => skill.id)), [matchedSkills])
  const ancestorIds = useMemo(() => collectAncestors(selectedSkill.id, skillById), [selectedSkill.id, skillById])
  const descendantIds = useMemo(() => collectDescendants(selectedSkill.id, unlockMap), [selectedSkill.id, unlockMap])
  const directPrerequisiteIds = useMemo(() => new Set(selectedSkill.prerequisites), [selectedSkill.prerequisites])
  const directUnlockIds = useMemo(() => new Set(selectedUnlocks.map((skill) => skill.id)), [selectedUnlocks])
  const lineageIds = useMemo(
    () => new Set([selectedSkill.id, ...ancestorIds, ...descendantIds]),
    [ancestorIds, descendantIds, selectedSkill.id],
  )
  const graphRoles = useMemo(() => buildGraphRoles(unlockMap, skills), [skills, unlockMap])
  const selectedPrerequisiteCompleteCount = selectedSkill.prerequisites.filter((id) => completedIds.has(id)).length
  const selectedComplete = completedIds.has(selectedSkill.id)
  const completedCount = completedIds.size
  const readyCount = skills.filter(
    (skill) => !completedIds.has(skill.id) && skill.prerequisites.every((id) => completedIds.has(id)),
  ).length
  const activeFocusCount =
    Number(Boolean(activeQuery)) + Number(focusedDomain !== 'all') + Number(focusedStage !== 'all')
  const graphBudget = getGraphBudget(viewportTier, viewMode)
  const filteredSkills = useMemo(() => {
    if (activeFocusCount === 0) {
      return skills
    }

    return skills.filter((skill) =>
      skillMatchesFocus(skill, {
        focusedDomain,
        focusedStage,
        matchedIds,
        normalizedQuery: activeQuery,
      }),
    )
  }, [activeFocusCount, activeQuery, focusedDomain, focusedStage, matchedIds, skills])
  const filteredSkillIds = useMemo(() => new Set(filteredSkills.map((skill) => skill.id)), [filteredSkills])
  const visibleFilteredSkills = useMemo(
    () =>
      limitSkillsForViewport(filteredSkills, graphBudget, {
        completedIds,
        directPrerequisiteIds,
        directUnlockIds,
        graphRoles,
        lineageIds,
        selectedSkill,
      }),
    [completedIds, directPrerequisiteIds, directUnlockIds, filteredSkills, graphBudget, graphRoles, lineageIds, selectedSkill],
  )
  const renderedSkillIds = useMemo(() => {
    const ids = new Set<string>()

    if (activeFocusCount > 0) {
      for (const skill of visibleFilteredSkills) {
        ids.add(skill.id)
      }

      return ids
    }

    if (viewMode === 'world') {
      for (const skill of skills) {
        if (isWorldOverviewSkill(skill)) {
          ids.add(skill.id)
        }
      }

      ids.add(selectedSkill.id)

      return ids
    }

    ids.add(selectedSkill.id)

    if (viewMode === 'node') {
      for (const id of directPrerequisiteIds) {
        ids.add(id)
      }

      for (const id of directUnlockIds) {
        ids.add(id)
      }
    } else {
      for (const id of lineageIds) {
        ids.add(id)
      }
    }

    return ids
  }, [
    activeFocusCount,
    directPrerequisiteIds,
    directUnlockIds,
    lineageIds,
    selectedSkill.id,
    skills,
    visibleFilteredSkills,
    viewMode,
  ])
  const renderedSkills = useMemo(
    () => skills.filter((skill) => renderedSkillIds.has(skill.id)),
    [renderedSkillIds, skills],
  )
  const renderedGraphEdges = useMemo(
    () => graphEdges.filter(({ from, to }) => renderedSkillIds.has(from.id) && renderedSkillIds.has(to.id)),
    [graphEdges, renderedSkillIds],
  )
  const cameraFitKey = [
    viewportTier,
    viewMode,
    focusedDomain,
    focusedStage,
    activeQuery,
    renderedSkills.length,
    renderedGraphEdges.length,
  ].join(':')
  const graphNodeSize = getGraphNodeSize(viewportTier)
  const useCompactNodes = viewportTier !== 'desktop' || viewMode === 'world' || renderedSkills.length > 90
  const showMiniMap = viewportTier === 'desktop' && renderedSkills.length <= 180

  useEffect(() => {
    saveLanguage(language)
    document.documentElement.lang = language
    document.title = ui.documentTitle
  }, [language, ui.documentTitle])

  useEffect(() => {
    function syncViewportTier() {
      setViewportTier(getViewportTier())
    }

    window.addEventListener('resize', syncViewportTier)

    return () => {
      window.removeEventListener('resize', syncViewportTier)
    }
  }, [])

  useEffect(() => {
    saveProfiles(profiles)
  }, [profiles])

  useEffect(() => {
    if (!profiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(profiles[0]?.id ?? 'default-child')
    }
  }, [activeProfileId, profiles])

  useEffect(() => {
    if (activeFocusCount > 0 && filteredSkills.length > 0 && !filteredSkillIds.has(selectedId)) {
      setSelectedId(filteredSkills[0].id)
    }
  }, [activeFocusCount, filteredSkillIds, filteredSkills, selectedId])

  useEffect(() => {
    let cancelled = false

    async function layoutGraph() {
      const laidOut = await getLayoutedGraph(
        renderedSkills.map((skill) => ({
          id: skill.id,
          width: graphNodeSize.width,
          height: graphNodeSize.height,
        })),
        renderedGraphEdges.map(({ from, to }) => ({
          id: `${from.id}->${to.id}`,
          sources: [from.id],
          targets: [to.id],
        })),
      )

      if (cancelled) {
        return
      }

      const nextNodes: Node<SkillNodeData>[] = renderedSkills.map((skill) => {
        const layoutNode = laidOut.children?.find((child) => child.id === skill.id)
        const domain = domainById.get(skill.domain) ?? domains[0]
        const stage = stageLabelById.get(skill.stage) ?? stages[0]
        const relation = relationFor(skill, selectedSkill, {
          ancestorIds,
          descendantIds,
          directPrerequisiteIds,
          directUnlockIds,
          matchedIds,
          normalizedQuery: activeQuery,
        })
        const dimmed = isSkillDimmed(skill, viewMode, {
          activeFocusCount,
          focusedDomain,
          focusedStage,
          lineageIds,
          matchedIds,
          normalizedQuery: activeQuery,
        })

        return {
          id: skill.id,
          type: 'skill',
          position: {
            x: layoutNode?.x ?? 0,
            y: layoutNode?.y ?? 0,
          },
          data: {
            skill,
            domain,
            stage,
            relation,
            role: graphRoles.get(skill.id) ?? 'ordinary',
            badgeLabel: relation ? relationLabels[relation] : roleLabels[graphRoles.get(skill.id) ?? 'ordinary'],
            readyLabel: ui.readyNode,
            dimmed,
            compact: useCompactNodes,
            completed: completedIds.has(skill.id),
            ready: skill.prerequisites.every((id) => completedIds.has(id)),
            unlockCount: unlockMap.get(skill.id)?.length ?? 0,
          },
          selected: selectedSkill.id === skill.id,
          draggable: false,
          style: {
            width: graphNodeSize.width,
            height: graphNodeSize.height,
            '--domain-color': domain.color,
          } as CSSProperties,
        }
      })

      const nextEdges: Edge[] = renderedGraphEdges.map(({ from, to }) => {
        const sourceRelated = lineageIds.has(from.id)
        const targetRelated = lineageIds.has(to.id)
        const direct =
          (from.id === selectedSkill.id && directUnlockIds.has(to.id)) ||
          (to.id === selectedSkill.id && directPrerequisiteIds.has(from.id))
        const dimmed =
          isSkillDimmed(from, viewMode, {
            activeFocusCount,
            focusedDomain,
            focusedStage,
            lineageIds,
            matchedIds,
            normalizedQuery: activeQuery,
          }) ||
          isSkillDimmed(to, viewMode, {
            activeFocusCount,
            focusedDomain,
            focusedStage,
            lineageIds,
            matchedIds,
            normalizedQuery: activeQuery,
          })

        return {
          id: `${from.id}->${to.id}`,
          source: from.id,
          target: to.id,
          type: 'smoothstep',
          animated: direct,
          className: [
            'skill-edge',
            sourceRelated && targetRelated ? 'skill-edge--lineage' : '',
            direct ? 'skill-edge--direct' : '',
            completedIds.has(from.id) && completedIds.has(to.id) ? 'skill-edge--completed' : '',
            dimmed ? 'skill-edge--dimmed' : '',
          ]
            .filter(Boolean)
            .join(' '),
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
          },
        }
      })

      setNodes(nextNodes)
      setEdges(nextEdges)
    }

    void layoutGraph()

    return () => {
      cancelled = true
    }
  }, [
    activeFocusCount,
    activeQuery,
    ancestorIds,
    completedIds,
    descendantIds,
    directPrerequisiteIds,
    directUnlockIds,
    domainById,
    domains,
    fitView,
    focusedDomain,
    focusedStage,
    graphNodeSize.height,
    graphNodeSize.width,
    graphRoles,
    lineageIds,
    matchedIds,
    renderedGraphEdges,
    renderedSkills,
    selectedSkill,
    setEdges,
    setNodes,
    skills,
    stageLabelById,
    stages,
    unlockMap,
    relationLabels,
    roleLabels,
    ui.readyNode,
    useCompactNodes,
    viewMode,
  ])

  useEffect(() => {
    if (nodes.length > 0) {
      window.requestAnimationFrame(() => {
        void fitView({
          duration: viewportTier === 'desktop' ? 650 : 0,
          maxZoom: viewMode === 'node' ? 1.15 : viewMode === 'path' ? 0.98 : 0.78,
          padding: viewMode === 'node' ? 0.9 : viewMode === 'path' ? 0.52 : 0.16,
        })
      })
    }
  }, [cameraFitKey, fitView, nodes.length, viewportTier, viewMode])

  function clearFocus() {
    setQuery('')
    setFocusedDomain('all')
    setFocusedStage(activeProfile.ageBand)
    setViewMode('path')
  }

  function chooseStage(stage: StageFocus) {
    if (stage === 'all' && focusedDomain === 'all') {
      setFocusedDomain(selectedSkill.domain)
    }

    setFocusedStage(stage)
  }

  function chooseDomain(domain: DomainFocus) {
    if (domain === 'all' && focusedStage === 'all') {
      setFocusedStage(selectedSkill.stage)
    }

    setFocusedDomain(domain)
  }

  function updateActiveProfile(updater: (profile: KidProfile) => KidProfile) {
    setProfiles((current) => current.map((profile) => (profile.id === activeProfile.id ? updater(profile) : profile)))
  }

  function toggleSelectedComplete() {
    updateActiveProfile((profile) => {
      const completed = new Set(profile.completedSkillIds)

      if (completed.has(selectedSkill.id)) {
        completed.delete(selectedSkill.id)
      } else {
        completed.add(selectedSkill.id)
      }

      return {
        ...profile,
        completedSkillIds: Array.from(completed),
      }
    })
  }

  function updateActiveProfileAge(ageBand: StageId) {
    updateActiveProfile((profile) => ({
      ...profile,
      ageBand,
    }))
    setFocusedStage(ageBand)
  }

  function addProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newProfileName.trim()

    if (!name) {
      return
    }

    const profile = createProfile(name, newProfileAge)
    setProfiles((current) => [...current, profile])
    setActiveProfileId(profile.id)
    setNewProfileName('')
  }

  const selectedRole = graphRoles.get(selectedSkill.id) ?? 'ordinary'
  const selectedPracticePlan = buildPracticePlan(
    selectedSkill,
    selectedGuide,
    selectedPrerequisites,
    stagePracticePrompts,
    ui,
  )

  return (
    <div className="app-shell">
      <header className="masthead">
        <img className="masthead__image" src={headerImage} alt="" />
        <div className="masthead__shade" />
        <div className="masthead__content">
          <div className="masthead__utility">
            <p className="eyebrow">{treeMeta.profile}</p>
            <label className="language-picker">
              <Languages aria-hidden="true" size={16} />
              <span>{ui.languageLabel}</span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                aria-label={ui.languageAria}
              >
                {languageOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h1>{ui.heading}</h1>
          <p className="masthead__copy">{treeMeta.stance}</p>
          <div className="metrics" aria-label={ui.treeSummaryAria}>
            <span>
              <strong>{skills.length}</strong>
              {ui.metrics.skills}
            </span>
            <span>
              <strong>{graphEdges.length}</strong>
              {ui.metrics.links}
            </span>
            <span>
              <strong>{domains.length}</strong>
              {ui.metrics.domains}
            </span>
            <span>
              <strong>{stages.length}</strong>
              {ui.metrics.ageBands}
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="focus-bar" aria-label={ui.treeAria}>
          <div className="focus-bar__topline">
            <label className="search-box">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">{ui.searchLabel}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={ui.searchPlaceholder}
              />
            </label>

            <div className="view-switch" aria-label={ui.mapViewAria}>
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={viewMode === mode.id}
                  onClick={() => setViewMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <button className="clear-button" type="button" onClick={clearFocus} disabled={activeFocusCount === 0}>
              <X aria-hidden="true" size={17} />
              {ui.clear}
            </button>
          </div>

          <div className="focus-row" aria-label={ui.ageFocusAria}>
            <button
              className="stage-tab"
              type="button"
              aria-pressed={focusedStage === 'all'}
              onClick={() => chooseStage('all')}
            >
              {ui.fullTimeline}
            </button>
            {stages.map((stage) => (
              <button
                className="stage-tab"
                type="button"
                key={stage.id}
                aria-pressed={focusedStage === stage.id}
                onClick={() => chooseStage(stage.id)}
              >
                <span>{stage.age}</span>
                {stage.title}
              </button>
            ))}
          </div>

          <div className="focus-row" aria-label={ui.domainFocusAria}>
            <button
              className="domain-chip"
              type="button"
              aria-pressed={focusedDomain === 'all'}
              onClick={() => chooseDomain('all')}
            >
              <Filter aria-hidden="true" size={16} />
              {ui.allDomains}
            </button>
            {domains.map((domain) => {
              const Icon = domainIcons[domain.id]
              return (
                <button
                  className="domain-chip"
                  type="button"
                  key={domain.id}
                  aria-pressed={focusedDomain === domain.id}
                  onClick={() => chooseDomain(domain.id)}
                  style={{ '--domain-color': domain.color } as CSSProperties}
                >
                  <Icon aria-hidden="true" size={16} />
                  {domain.shortLabel}
                </button>
              )
            })}
          </div>

          <p className="result-count">{ui.resultCount(filteredSkills.length, renderedSkills.length, skills.length)}</p>

          <div className="profile-row" aria-label={ui.kidProfilesAria}>
            <div className="profile-summary">
              <Users aria-hidden="true" size={18} />
              <span>
                <strong>{activeProfileName}</strong>
                <em>
                  {stageLabelById.get(activeProfile.ageBand)?.title} · {stageLabelById.get(activeProfile.ageBand)?.age}
                </em>
                {ui.progressSummary(completedCount, readyCount)}
              </span>
              <progress value={completedCount} max={skills.length} aria-label={ui.progressLabel(activeProfileName)} />
              <label className="profile-age-select">
                <span className="sr-only">{ui.activeChildAgeBand}</span>
                <select
                  value={activeProfile.ageBand}
                  onChange={(event) => updateActiveProfileAge(event.target.value as StageId)}
                  aria-label={ui.activeChildAgeBand}
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.age} · {stage.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="profile-tabs">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  aria-pressed={activeProfile.id === profile.id}
                  onClick={() => setActiveProfileId(profile.id)}
                >
                  <UserRound aria-hidden="true" size={15} />
                  <span>
                    {getProfileDisplayName(profile, ui)}
                    <small>{stageLabelById.get(profile.ageBand)?.age}</small>
                  </span>
                </button>
              ))}
            </div>

            <form className="add-profile" onSubmit={addProfile}>
              <input
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
                placeholder={ui.addChildPlaceholder}
                aria-label={ui.newChildName}
              />
              <select
                value={newProfileAge}
                onChange={(event) => setNewProfileAge(event.target.value as StageId)}
                aria-label={ui.newChildAgeBand}
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.age}
                  </option>
                ))}
              </select>
              <button type="submit">
                <Plus aria-hidden="true" size={16} />
                {ui.add}
              </button>
            </form>
          </div>
        </section>

        <section className="tree-layout" aria-label={ui.treeAria}>
          <div className="flow-shell">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              minZoom={0.18}
              maxZoom={1.55}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              onlyRenderVisibleElements
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d8d0bf" gap={28} size={1} />
              <Controls position="bottom-left" />
              {showMiniMap && (
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  nodeStrokeWidth={4}
                  nodeColor={(node) => {
                    const data = node.data as SkillNodeData
                    return data.completed ? '#2f6b4f' : data.dimmed ? '#d7d0c3' : data.domain.color
                  }}
                />
              )}
              <Panel position="top-left" className="map-panel">
                <div className="map-panel__title">
                  <Compass aria-hidden="true" size={18} />
                  {ui.growthAtlas}
                </div>
                <p>{ui.mapPanel[viewMode]}</p>
              </Panel>
              <Panel position="top-right" className="legend-panel">
                <span>
                  <i className="legend-dot legend-dot--root" />
                  {roleLabels.root}
                </span>
                <span>
                  <i className="legend-dot legend-dot--keystone" />
                  {roleLabels.keystone}
                </span>
                <span>
                  <i className="legend-dot legend-dot--bridge" />
                  {roleLabels.bridge}
                </span>
              </Panel>
            </ReactFlow>
          </div>

          <aside className="detail-panel" aria-label={ui.selectedSkillAria}>
            <div className="detail-kicker" style={{ '--domain-color': selectedDomain.color } as CSSProperties}>
              <span className="detail-icon">
                <SelectedDomainIcon aria-hidden="true" size={18} />
              </span>
              {selectedDomain.label}
            </div>

            <h2>{selectedSkill.title}</h2>
            <p className="detail-summary">{selectedSkill.summary}</p>

            <SkillTopicImage
              skill={selectedSkill}
              domain={selectedDomain}
              stage={stageLabelById.get(selectedSkill.stage) ?? stages[0]}
              stageIndex={Math.max(0, stages.findIndex((stage) => stage.id === selectedSkill.stage))}
              guide={selectedGuide}
              roleLabel={roleLabels[selectedRole]}
              imageLabel={ui.introImageLabel(selectedSkill.title)}
            />

            <button
              className={['complete-button', selectedComplete ? 'complete-button--done' : '']
                .filter(Boolean)
                .join(' ')}
              type="button"
              onClick={toggleSelectedComplete}
            >
              <CheckCircle2 aria-hidden="true" size={18} />
              {selectedComplete ? ui.completedFor(activeProfileName) : ui.completeFor(activeProfileName)}
            </button>

            <dl className="detail-meta">
              <div>
                <dt>{ui.detail.age}</dt>
                <dd>{stageLabelById.get(selectedSkill.stage)?.age}</dd>
              </div>
              <div>
                <dt>{ui.detail.role}</dt>
                <dd>{roleLabels[selectedRole]}</dd>
              </div>
              <div>
                <dt>{ui.detail.lineage}</dt>
                <dd>
                  {ancestorIds.size + descendantIds.size + 1} {ui.detail.nodes}
                </dd>
              </div>
              <div>
                <dt>{ui.detail.unlocks}</dt>
                <dd>{selectedUnlocks.length}</dd>
              </div>
              <div>
                <dt>{ui.detail.prereqs}</dt>
                <dd>
                  {selectedSkill.prerequisites.length === 0
                    ? ui.detail.root
                    : `${selectedPrerequisiteCompleteCount}/${selectedSkill.prerequisites.length}`}
                </dd>
              </div>
            </dl>

            <div className="detail-section domain-atlas">
              <h3>
                <Compass aria-hidden="true" size={17} />
                {ui.detail.domainMap}
              </h3>
              <div className="subdomain-cloud">
                {selectedGuide.subdomains.map((subdomain, index) => (
                  <span key={`${selectedDomain.id}-subdomain-${index}`}>{subdomain}</span>
                ))}
              </div>
              <p>{selectedGuide.growthArc[selectedSkill.stage] ?? selectedDomain.description}</p>
            </div>

            <div className="detail-section">
              <h3>
                <Sparkles aria-hidden="true" size={17} />
                {ui.detail.outcomes}
              </h3>
              <ul className="outcome-list">
                {selectedSkill.outcomes.map((outcome, index) => (
                  <li key={`${selectedSkill.id}-outcome-${index}`}>{outcome}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section practice-plan">
              <h3>
                <ClipboardCheck aria-hidden="true" size={17} />
                {ui.detail.waysToBuild}
              </h3>
              <ol>
                {selectedPracticePlan.map((step, index) => (
                  <li key={`${selectedSkill.id}-practice-${index}`}>{step}</li>
                ))}
              </ol>
            </div>

            <SkillLinks
              title={ui.detail.beforeThis}
              icon={GitBranch}
              skills={selectedPrerequisites}
              emptyLabel={ui.detail.noLinkedSkills}
              onSelect={setSelectedId}
            />
            <SkillLinks
              title={ui.detail.unlocksNext}
              icon={ChevronRight}
              skills={selectedUnlocks}
              emptyLabel={ui.detail.noLinkedSkills}
              onSelect={setSelectedId}
            />

            <div className="tag-row" aria-label={ui.detail.tags}>
              {selectedSkill.tags.map((tag, index) => (
                <button key={`${selectedSkill.id}-tag-${index}`} type="button" onClick={() => setQuery(tag)}>
                  #{tag}
                </button>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}

function getProfileDisplayName(profile: KidProfile, ui: UiCopy) {
  return profile.id === 'default-child' && profile.name === 'First child' ? ui.defaultProfileName : profile.name
}

function SkillMapNode({ data, selected }: NodeProps<Node<SkillNodeData>>) {
  const Icon = domainIcons[data.domain.id]

  return (
    <div
      className={[
        'skill-map-node',
        selected ? 'skill-map-node--selected' : '',
        data.dimmed ? 'skill-map-node--dimmed' : '',
        data.compact ? 'skill-map-node--compact' : '',
        data.completed ? 'skill-map-node--completed' : '',
        data.ready ? 'skill-map-node--ready' : '',
        data.relation ? `skill-map-node--${data.relation}` : '',
        `skill-map-node--role-${data.role}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--domain-color': data.domain.color } as CSSProperties}
    >
      <Handle className="skill-handle" type="target" position={Position.Left} />
      <div className="node-orb" aria-hidden="true">
        {data.completed ? <CheckCircle2 size={18} /> : <Icon size={18} />}
      </div>
      {data.ready && !data.completed && <span className="node-ready">{data.readyLabel}</span>}
      <div className="node-copy">
        <span className="node-kicker">
          {data.domain.shortLabel}
          <span>{data.stage.age}</span>
        </span>
        <strong>{data.skill.title}</strong>
        {!data.compact && <p>{data.skill.summary}</p>}
      </div>
      <span className="node-badge">{data.badgeLabel}</span>
      <span className="node-count">
        <GitBranch aria-hidden="true" size={13} />
        {data.unlockCount}
      </span>
      <Handle className="skill-handle" type="source" position={Position.Right} />
    </div>
  )
}

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function SkillTopicImage({
  skill,
  domain,
  stage,
  stageIndex,
  guide,
  roleLabel,
  imageLabel,
}: {
  skill: SkillNode
  domain: Domain
  stage: Stage
  stageIndex: number
  guide: DomainGuide
  roleLabel: string
  imageLabel: string
}) {
  const Icon = domainIcons[domain.id]
  const seed = hashString(skill.id)
  const motif = topicMotifs[domain.id]
  const accentX = 58 + (seed % 52)
  const accentY = 42 + ((seed >> 3) % 44)
  const branchY = 116 + ((seed >> 5) % 20)
  const stageProgress = Math.min(1, (stageIndex + 1) / 10)
  const titleWords = skill.title
    .replace(/^[^:]+:\s*/, '')
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')

  return (
    <div className="topic-card" style={{ '--domain-color': domain.color } as CSSProperties}>
      <svg className="topic-art" viewBox="0 0 360 190" role="img" aria-label={imageLabel}>
        <defs>
          <linearGradient id={`topic-bg-${skill.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={domain.color} stopOpacity="0.72" />
            <stop offset="54%" stopColor={domain.color} stopOpacity="0.14" />
            <stop offset="100%" stopColor="#fffefa" stopOpacity="0.96" />
          </linearGradient>
          <pattern id={`topic-grid-${skill.id}`} width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#fffefa" strokeOpacity="0.22" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="360" height="190" rx="18" fill={`url(#topic-bg-${skill.id})`} />
        <rect width="360" height="190" rx="18" fill={`url(#topic-grid-${skill.id})`} />
        <path
          d={`M30 ${branchY} C76 ${74 + (seed % 18)}, 113 ${139 - (seed % 22)}, 156 ${88 + (seed % 16)} S255 ${88 - (seed % 12)}, 326 ${44 + (seed % 28)}`}
          fill="none"
          stroke="#fffefa"
          strokeOpacity="0.84"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={`M34 ${branchY + 12} C86 ${126 - (seed % 16)}, 128 ${152 - (seed % 20)}, 178 ${118 + (seed % 14)} S260 ${132 - (seed % 20)}, 326 ${94 + (seed % 12)}`}
          fill="none"
          stroke={domain.color}
          strokeOpacity="0.46"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="7 10"
        />
        <g transform={`translate(${accentX} ${accentY})`}>
          {motif}
        </g>
        <g transform={`translate(${238 + (seed % 22)} ${54 + ((seed >> 4) % 22)}) rotate(${(seed % 5) * 6 - 12})`}>
          {topicMotifs[skill.generated ? domain.id : 'character']}
        </g>
        <g className="topic-stage-orbit" transform="translate(284 132)">
          <circle r="31" fill="#fffefa" opacity="0.72" />
          <circle r="21" fill="none" stroke={domain.color} strokeOpacity="0.38" strokeWidth="5" />
          <path
            d={describeArc(0, 0, 21, -90, -90 + stageProgress * 330)}
            fill="none"
            stroke={domain.color}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <text y="4" textAnchor="middle" fill="#202820" fontSize="13" fontWeight="900">
            {stageIndex + 1}
          </text>
        </g>
        {guide.imageMotifs.slice(0, 2).map((guideMotif, index) => (
          <g key={`${skill.id}-motif-${index}`} transform={`translate(${78 + index * 104} ${154 - index * 16})`}>
            <circle r="18" fill="#fffefa" opacity="0.74" />
            <circle r="8" fill={domain.color} opacity="0.18" />
            <text y="33" textAnchor="middle" fill="#202820" opacity="0.72" fontSize="9" fontWeight="800">
              {guideMotif}
            </text>
          </g>
        ))}
        <text x="24" y="30" fill="#fffefa" opacity="0.92" fontSize="11" fontWeight="900">
          {stage.age}
        </text>
        <text x="24" y="47" fill="#fffefa" opacity="0.82" fontSize="10" fontWeight="800">
          {roleLabel.toLocaleUpperCase()}
        </text>
      </svg>
      <div className="topic-caption">
        <span>
          <Icon aria-hidden="true" size={16} />
          {titleWords}
        </span>
      </div>
    </div>
  )
}

type SkillLinksProps = {
  title: string
  icon: LucideIcon
  skills: SkillNode[]
  emptyLabel: string
  onSelect: (id: string) => void
}

function SkillLinks({ title, icon: Icon, skills: linkedSkills, emptyLabel, onSelect }: SkillLinksProps) {
  return (
    <div className="detail-section">
      <h3>
        <Icon aria-hidden="true" size={17} />
        {title}
      </h3>
      {linkedSkills.length > 0 ? (
        <div className="link-stack">
          {linkedSkills.map((skill) => (
            <button key={skill.id} type="button" onClick={() => onSelect(skill.id)}>
              <CircleDot aria-hidden="true" size={14} />
              {skill.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="none-copy">{emptyLabel}</p>
      )}
    </div>
  )
}

function relationFor(
  skill: SkillNode,
  selectedSkill: SkillNode,
  state: {
    ancestorIds: Set<string>
    descendantIds: Set<string>
    directPrerequisiteIds: Set<string>
    directUnlockIds: Set<string>
    matchedIds: Set<string>
    normalizedQuery: string
  },
): Relation | undefined {
  if (skill.id === selectedSkill.id) {
    return 'selected'
  }

  if (state.directPrerequisiteIds.has(skill.id)) {
    return 'direct-before'
  }

  if (state.directUnlockIds.has(skill.id)) {
    return 'direct-next'
  }

  if (state.ancestorIds.has(skill.id)) {
    return 'ancestor'
  }

  if (state.descendantIds.has(skill.id)) {
    return 'descendant'
  }

  if (state.normalizedQuery && state.matchedIds.has(skill.id)) {
    return 'matched'
  }

  return undefined
}

function skillMatchesFocus(
  skill: SkillNode,
  state: {
    focusedDomain: DomainFocus
    focusedStage: StageFocus
    matchedIds: Set<string>
    normalizedQuery: string
  },
) {
  const missesSearch = Boolean(state.normalizedQuery) && !state.matchedIds.has(skill.id)
  const outsideDomain = state.focusedDomain !== 'all' && skill.domain !== state.focusedDomain
  const outsideStage = state.focusedStage !== 'all' && skill.stage !== state.focusedStage

  return !missesSearch && !outsideDomain && !outsideStage
}

function isWorldOverviewSkill(skill: SkillNode) {
  return !skill.generated || (skill.aspectId ? worldOverviewAspectIds.has(skill.aspectId) : false)
}

function getViewportTier(): ViewportTier {
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  if (window.innerWidth < 760) {
    return 'mobile'
  }

  if (window.innerWidth < 1180) {
    return 'tablet'
  }

  return 'desktop'
}

function getGraphBudget(viewportTier: ViewportTier, viewMode: ViewMode) {
  if (viewportTier === 'mobile') {
    return viewMode === 'node' ? 32 : 48
  }

  if (viewportTier === 'tablet') {
    return viewMode === 'node' ? 52 : 88
  }

  return viewMode === 'node' ? 90 : 156
}

function getGraphNodeSize(viewportTier: ViewportTier) {
  if (viewportTier === 'mobile') {
    return { width: 188, height: 92 }
  }

  if (viewportTier === 'tablet') {
    return { width: 204, height: 108 }
  }

  return { width: 218, height: 126 }
}

function limitSkillsForViewport(
  skills: SkillNode[],
  budget: number,
  state: {
    completedIds: Set<string>
    directPrerequisiteIds: Set<string>
    directUnlockIds: Set<string>
    graphRoles: Map<string, GraphRole>
    lineageIds: Set<string>
    selectedSkill: SkillNode
  },
) {
  if (skills.length <= budget) {
    return skills
  }

  const skillIds = new Set(skills.map((skill) => skill.id))
  const protectedIds = new Set<string>()

  if (skillIds.has(state.selectedSkill.id)) {
    protectedIds.add(state.selectedSkill.id)
  }

  for (const skill of skills) {
    if (!skill.generated) {
      protectedIds.add(skill.id)
    }
  }

  for (const id of state.directPrerequisiteIds) {
    if (skillIds.has(id)) {
      protectedIds.add(id)
    }
  }

  for (const id of state.directUnlockIds) {
    if (skillIds.has(id)) {
      protectedIds.add(id)
    }
  }

  const indexById = new Map(skills.map((skill, index) => [skill.id, index]))
  const protectedSkills = skills
    .filter((skill) => protectedIds.has(skill.id))
    .sort((a, b) => skillRenderPriority(a, state) - skillRenderPriority(b, state) || (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0))

  if (protectedSkills.length >= budget) {
    return protectedSkills.slice(0, budget)
  }

  const domains = new Set(skills.map((skill) => skill.domain))
  const stages = new Set(skills.map((skill) => skill.stage))
  const groups = new Map<string, SkillNode[]>()

  for (const skill of skills) {
    if (protectedIds.has(skill.id)) {
      continue
    }

    const key =
      domains.size > 1 && stages.size === 1
        ? skill.domain
        : stages.size > 1 && domains.size === 1
          ? skill.stage
          : `${skill.stage}:${skill.domain}`
    const group = groups.get(key) ?? []
    group.push(skill)
    groups.set(key, group)
  }

  for (const group of groups.values()) {
    group.sort(
      (a, b) =>
        skillRenderPriority(a, state) - skillRenderPriority(b, state) ||
        (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0),
    )
  }

  const picked = [...protectedSkills]
  const groupList = Array.from(groups.values())

  while (picked.length < budget) {
    let added = false

    for (const group of groupList) {
      const skill = group.shift()

      if (!skill) {
        continue
      }

      picked.push(skill)
      added = true

      if (picked.length >= budget) {
        break
      }
    }

    if (!added) {
      break
    }
  }

  return picked
}

function skillRenderPriority(
  skill: SkillNode,
  state: {
    completedIds: Set<string>
    directPrerequisiteIds: Set<string>
    directUnlockIds: Set<string>
    graphRoles: Map<string, GraphRole>
    lineageIds: Set<string>
    selectedSkill: SkillNode
  },
) {
  if (skill.id === state.selectedSkill.id) {
    return 0
  }

  if (state.directPrerequisiteIds.has(skill.id) || state.directUnlockIds.has(skill.id)) {
    return 1
  }

  if (!skill.generated) {
    return 2
  }

  if (state.completedIds.has(skill.id)) {
    return 3
  }

  if (state.lineageIds.has(skill.id)) {
    return 4
  }

  const rolePriority: Record<GraphRole, number> = {
    root: 5,
    keystone: 6,
    bridge: 7,
    ordinary: 8,
    leaf: 9,
  }

  return rolePriority[state.graphRoles.get(skill.id) ?? 'ordinary']
}

function isSkillDimmed(
  skill: SkillNode,
  viewMode: ViewMode,
  state: {
    activeFocusCount: number
    focusedDomain: DomainFocus
    focusedStage: StageFocus
    lineageIds: Set<string>
    matchedIds: Set<string>
    normalizedQuery: string
  },
) {
  const outsideLineage = !state.lineageIds.has(skill.id)

  if (!skillMatchesFocus(skill, state)) {
    return true
  }

  if (state.activeFocusCount > 0) {
    return false
  }

  if (viewMode === 'world') {
    return false
  }

  if (viewMode === 'node') {
    return outsideLineage
  }

  return outsideLineage
}

function collectAncestors(id: string, skillById: Map<string, SkillNode>, visited = new Set<string>()) {
  const skill = skillById.get(id)

  if (!skill) {
    return visited
  }

  for (const prerequisiteId of skill.prerequisites) {
    if (!visited.has(prerequisiteId)) {
      visited.add(prerequisiteId)
      collectAncestors(prerequisiteId, skillById, visited)
    }
  }

  return visited
}

function collectDescendants(id: string, unlockMap: Map<string, SkillNode[]>, visited = new Set<string>()) {
  const unlocks = unlockMap.get(id) ?? []

  for (const unlock of unlocks) {
    if (!visited.has(unlock.id)) {
      visited.add(unlock.id)
      collectDescendants(unlock.id, unlockMap, visited)
    }
  }

  return visited
}

function buildGraphRoles(unlockMap: Map<string, SkillNode[]>, skills: SkillNode[]) {
  const roleMap = new Map<string, GraphRole>()

  for (const skill of skills) {
    const unlocks = unlockMap.get(skill.id) ?? []
    const crossesDomain =
      skill.prerequisites.some((id) => {
        const prerequisite = skills.find((candidate) => candidate.id === id)
        return prerequisite && prerequisite.domain !== skill.domain
      }) || unlocks.some((unlock) => unlock.domain !== skill.domain)

    if (skill.prerequisites.length === 0) {
      roleMap.set(skill.id, 'root')
    } else if (unlocks.length >= 3) {
      roleMap.set(skill.id, 'keystone')
    } else if (crossesDomain) {
      roleMap.set(skill.id, 'bridge')
    } else if (unlocks.length === 0) {
      roleMap.set(skill.id, 'leaf')
    } else {
      roleMap.set(skill.id, 'ordinary')
    }
  }

  return roleMap
}

function buildPracticePlan(
  skill: SkillNode,
  guide: DomainGuide,
  prerequisites: SkillNode[],
  stagePracticePrompts: Record<StageId, string[]>,
  ui: UiCopy,
) {
  const stagePrompts = stagePracticePrompts[skill.stage]
  const materials = guide.materials.slice(0, 3).join(', ')
  const observation = guide.observe.slice(0, 3).join(', ')
  const firstOutcome = skill.outcomes[0]?.toLocaleLowerCase(ui.locale) ?? ui.detail.outcomes.toLocaleLowerCase(ui.locale)
  const skillTitle = skill.title.toLocaleLowerCase(ui.locale)
  const prerequisiteText =
    prerequisites.length > 0
      ? ui.practicePlan.startFrom(formatSkillList(prerequisites, ui))
      : ui.practicePlan.rootPrompt(stagePrompts[0])

  return [
    prerequisiteText,
    ui.practicePlan.practiceAround(guide.practiceLoop[0], skillTitle, materials),
    ui.practicePlan.repeatFor(guide.practiceLoop[1], firstOutcome),
    ui.practicePlan.watchFor(observation),
  ]
}

function formatSkillList(list: SkillNode[], ui: UiCopy) {
  const titles = list.slice(0, 3).map((skill) => skill.title.toLocaleLowerCase(ui.locale))

  if (titles.length <= 1) {
    return titles[0] ?? 'the previous skill'
  }

  if (titles.length === 2) {
    return `${titles[0]} ${ui.listAnd} ${titles[1]}`
  }

  return `${titles.slice(0, -1).join(', ')} ${ui.listAnd} ${titles[titles.length - 1]}`
}

async function getLayoutedGraph(
  children: Array<{ id: string; width: number; height: number }>,
  edges: Array<{ id: string; sources: string[]; targets: string[] }>,
) {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js')
  const elk = new ELK()

  return elk.layout({
    id: 'skill-tree',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '48',
      'elk.layered.spacing.nodeNodeBetweenLayers': '88',
      'elk.layered.spacing.edgeNodeBetweenLayers': '42',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children,
    edges,
  })
}

export default App
