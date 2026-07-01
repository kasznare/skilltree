import type { CSSProperties, FormEvent } from 'react'
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

const defaultSkillId = 'secure-attachment'

const nodeWidth = 218
const nodeHeight = 126

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
  const [focusedStage, setFocusedStage] = useState<StageFocus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('path')
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
  const matchedSkills = useMemo(() => {
    if (!normalizedQuery) {
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

      return haystack.includes(normalizedQuery)
    })
  }, [domainById, normalizedQuery, skills, stageLabelById, ui.locale])

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
    Number(Boolean(normalizedQuery)) + Number(focusedDomain !== 'all') + Number(focusedStage !== 'all')

  useEffect(() => {
    saveLanguage(language)
    document.documentElement.lang = language
    document.title = ui.documentTitle
  }, [language, ui.documentTitle])

  useEffect(() => {
    saveProfiles(profiles)
  }, [profiles])

  useEffect(() => {
    if (!profiles.some((profile) => profile.id === activeProfileId)) {
      setActiveProfileId(profiles[0]?.id ?? 'default-child')
    }
  }, [activeProfileId, profiles])

  useEffect(() => {
    if (normalizedQuery && matchedSkills.length > 0 && !matchedIds.has(selectedId)) {
      setSelectedId(matchedSkills[0].id)
    }
  }, [matchedIds, matchedSkills, normalizedQuery, selectedId])

  useEffect(() => {
    let cancelled = false

    async function layoutGraph() {
      const laidOut = await getLayoutedGraph(
        skills.map((skill) => ({
          id: skill.id,
          width: nodeWidth,
          height: nodeHeight,
        })),
        graphEdges.map(({ from, to }) => ({
          id: `${from.id}->${to.id}`,
          sources: [from.id],
          targets: [to.id],
        })),
      )

      if (cancelled) {
        return
      }

      const nextNodes: Node<SkillNodeData>[] = skills.map((skill) => {
        const layoutNode = laidOut.children?.find((child) => child.id === skill.id)
        const domain = domainById.get(skill.domain) ?? domains[0]
        const stage = stageLabelById.get(skill.stage) ?? stages[0]
        const relation = relationFor(skill, selectedSkill, {
          ancestorIds,
          descendantIds,
          directPrerequisiteIds,
          directUnlockIds,
          matchedIds,
          normalizedQuery,
        })
        const dimmed = isSkillDimmed(skill, viewMode, {
          activeFocusCount,
          focusedDomain,
          focusedStage,
          lineageIds,
          matchedIds,
          normalizedQuery,
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
            compact: viewMode === 'world',
            completed: completedIds.has(skill.id),
            ready: skill.prerequisites.every((id) => completedIds.has(id)),
            unlockCount: unlockMap.get(skill.id)?.length ?? 0,
          },
          selected: selectedSkill.id === skill.id,
          draggable: false,
          style: {
            width: nodeWidth,
            height: nodeHeight,
            '--domain-color': domain.color,
          } as CSSProperties,
        }
      })

      const nextEdges: Edge[] = graphEdges.map(({ from, to }) => {
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
            normalizedQuery,
          }) ||
          isSkillDimmed(to, viewMode, {
            activeFocusCount,
            focusedDomain,
            focusedStage,
            lineageIds,
            matchedIds,
            normalizedQuery,
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
    graphEdges,
    graphRoles,
    lineageIds,
    matchedIds,
    normalizedQuery,
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
    viewMode,
  ])

  useEffect(() => {
    if (nodes.length > 0) {
      window.requestAnimationFrame(() => {
        const focusNodes =
          viewMode === 'world'
            ? undefined
            : viewMode === 'node'
              ? [{ id: selectedSkill.id }]
              : [
                  { id: selectedSkill.id },
                  ...Array.from(directPrerequisiteIds).map((id) => ({ id })),
                  ...Array.from(directUnlockIds).map((id) => ({ id })),
                ]

        void fitView({
          duration: 650,
          maxZoom: viewMode === 'node' ? 1.15 : viewMode === 'path' ? 0.98 : 0.78,
          nodes: focusNodes,
          padding: viewMode === 'node' ? 0.9 : viewMode === 'path' ? 0.52 : 0.16,
        })
      })
    }
  }, [directPrerequisiteIds, directUnlockIds, fitView, nodes.length, selectedSkill.id, viewMode])

  function clearFocus() {
    setQuery('')
    setFocusedDomain('all')
    setFocusedStage('all')
    setViewMode('path')
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
              onClick={() => setFocusedStage('all')}
            >
              {ui.fullTimeline}
            </button>
            {stages.map((stage) => (
              <button
                className="stage-tab"
                type="button"
                key={stage.id}
                aria-pressed={focusedStage === stage.id}
                onClick={() => setFocusedStage(stage.id)}
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
              onClick={() => setFocusedDomain('all')}
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
                  onClick={() => setFocusedDomain(domain.id)}
                  style={{ '--domain-color': domain.color } as CSSProperties}
                >
                  <Icon aria-hidden="true" size={16} />
                  {domain.shortLabel}
                </button>
              )
            })}
          </div>

          <p className="result-count">{ui.resultCount(matchedSkills.length, skills.length)}</p>

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
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d8d0bf" gap={28} size={1} />
              <Controls position="bottom-left" />
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

            <DomainIntroImage
              domain={selectedDomain}
              guide={selectedGuide}
              imageLabel={ui.introImageLabel(selectedDomain.label)}
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
                {selectedGuide.subdomains.map((subdomain) => (
                  <span key={subdomain}>{subdomain}</span>
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
                {selectedSkill.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>

            <div className="detail-section practice-plan">
              <h3>
                <ClipboardCheck aria-hidden="true" size={17} />
                {ui.detail.waysToBuild}
              </h3>
              <ol>
                {selectedPracticePlan.map((step) => (
                  <li key={step}>{step}</li>
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
              {selectedSkill.tags.map((tag) => (
                <button key={tag} type="button" onClick={() => setQuery(tag)}>
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

function DomainIntroImage({ domain, guide, imageLabel }: { domain: Domain; guide: DomainGuide; imageLabel: string }) {
  const Icon = domainIcons[domain.id]

  return (
    <div className="intro-card" style={{ '--domain-color': domain.color } as CSSProperties}>
      <svg className="intro-art" viewBox="0 0 360 180" role="img" aria-label={imageLabel}>
        <defs>
          <linearGradient id={`intro-${domain.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={domain.color} stopOpacity="0.72" />
            <stop offset="58%" stopColor={domain.color} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fffefa" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="360" height="180" rx="18" fill={`url(#intro-${domain.id})`} />
        <path
          d="M36 130 C78 82, 106 112, 145 64 S228 78, 257 42 S316 40, 332 24"
          fill="none"
          stroke="#fffefa"
          strokeOpacity="0.82"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M36 138 C88 116, 130 142, 178 104 S260 132, 326 82"
          fill="none"
          stroke={domain.color}
          strokeOpacity="0.42"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 10"
        />
        {guide.imageMotifs.map((motif, index) => (
          <g key={motif} transform={`translate(${70 + index * 92} ${76 + (index % 2) * 28})`}>
            <circle r="27" fill="#fffefa" opacity="0.78" />
            <circle r="16" fill={domain.color} opacity="0.13" />
            <text y="46" textAnchor="middle" fill="#202820" opacity="0.72" fontSize="10" fontWeight="700">
              {motif}
            </text>
          </g>
        ))}
      </svg>
      <div className="intro-caption">
        <span>
          <Icon aria-hidden="true" size={16} />
          {guide.imageTone}
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
  const missesSearch = Boolean(state.normalizedQuery) && !state.matchedIds.has(skill.id)
  const outsideDomain = state.focusedDomain !== 'all' && skill.domain !== state.focusedDomain
  const outsideStage = state.focusedStage !== 'all' && skill.stage !== state.focusedStage
  const outsideLineage = !state.lineageIds.has(skill.id)

  if (missesSearch || outsideDomain || outsideStage) {
    return true
  }

  if (viewMode === 'world') {
    return false
  }

  if (viewMode === 'node') {
    return outsideLineage
  }

  return state.activeFocusCount === 0 ? outsideLineage : false
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
