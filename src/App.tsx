import type { CSSProperties } from 'react'
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
  ChevronRight,
  CircleDot,
  Compass,
  Filter,
  GitBranch,
  Handshake,
  HeartPulse,
  MessageCircle,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react'
import './App.css'
import headerImage from './assets/skill-tree-header.png'
import {
  domains,
  skills,
  stages,
  treeMeta,
  type DomainId,
  type SkillNode,
  type StageId,
} from './data/skillTree'

type DomainFocus = DomainId | 'all'
type StageFocus = StageId | 'all'
type ViewMode = 'world' | 'path' | 'node'
type Relation = 'selected' | 'direct-before' | 'direct-next' | 'ancestor' | 'descendant' | 'matched'
type GraphRole = 'root' | 'keystone' | 'bridge' | 'leaf' | 'ordinary'

type SkillNodeData = {
  skill: SkillNode
  domain: (typeof domains)[number]
  stage: (typeof stages)[number]
  relation?: Relation
  role: GraphRole
  dimmed: boolean
  compact: boolean
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

const stageLabelById = new Map(stages.map((stage) => [stage.id, stage]))
const domainById = new Map(domains.map((domain) => [domain.id, domain]))
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
  const [selectedId, setSelectedId] = useState(defaultSkillId)
  const [query, setQuery] = useState('')
  const [focusedDomain, setFocusedDomain] = useState<DomainFocus>('all')
  const [focusedStage, setFocusedStage] = useState<StageFocus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('path')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SkillNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const { fitView } = useReactFlow()

  const skillById = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [])

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
  }, [])

  const graphEdges = useMemo(() => {
    return skills.flatMap((skill) =>
      skill.prerequisites
        .map((prerequisiteId) => {
          const prerequisite = skillById.get(prerequisiteId)
          return prerequisite ? { from: prerequisite, to: skill } : undefined
        })
        .filter((edge): edge is { from: SkillNode; to: SkillNode } => Boolean(edge)),
    )
  }, [skillById])

  const selectedSkill = skillById.get(selectedId) ?? skillById.get(defaultSkillId) ?? skills[0]
  const selectedDomain = domainById.get(selectedSkill.domain) ?? domains[0]
  const SelectedDomainIcon = domainIcons[selectedDomain.id]
  const selectedUnlocks = useMemo(() => unlockMap.get(selectedSkill.id) ?? [], [selectedSkill.id, unlockMap])
  const selectedPrerequisites = useMemo(
    () =>
      selectedSkill.prerequisites
        .map((id) => skillById.get(id))
        .filter((skill): skill is SkillNode => Boolean(skill)),
    [selectedSkill.prerequisites, skillById],
  )

  const normalizedQuery = query.trim().toLowerCase()
  const matchedSkills = useMemo(() => {
    if (!normalizedQuery) {
      return skills
    }

    return skills.filter((skill) => {
      const haystack = [
        skill.title,
        skill.summary,
        skill.domain,
        skill.stage,
        ...skill.outcomes,
        ...skill.tags,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery])

  const matchedIds = useMemo(() => new Set(matchedSkills.map((skill) => skill.id)), [matchedSkills])
  const ancestorIds = useMemo(() => collectAncestors(selectedSkill.id, skillById), [selectedSkill.id, skillById])
  const descendantIds = useMemo(() => collectDescendants(selectedSkill.id, unlockMap), [selectedSkill.id, unlockMap])
  const directPrerequisiteIds = useMemo(() => new Set(selectedSkill.prerequisites), [selectedSkill.prerequisites])
  const directUnlockIds = useMemo(() => new Set(selectedUnlocks.map((skill) => skill.id)), [selectedUnlocks])
  const lineageIds = useMemo(
    () => new Set([selectedSkill.id, ...ancestorIds, ...descendantIds]),
    [ancestorIds, descendantIds, selectedSkill.id],
  )
  const graphRoles = useMemo(() => buildGraphRoles(unlockMap), [unlockMap])
  const activeFocusCount =
    Number(Boolean(normalizedQuery)) + Number(focusedDomain !== 'all') + Number(focusedStage !== 'all')

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
            dimmed,
            compact: viewMode === 'world',
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
    descendantIds,
    directPrerequisiteIds,
    directUnlockIds,
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
    unlockMap,
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

  const selectedRole = graphRoles.get(selectedSkill.id) ?? 'ordinary'

  return (
    <div className="app-shell">
      <header className="masthead">
        <img className="masthead__image" src={headerImage} alt="" />
        <div className="masthead__shade" />
        <div className="masthead__content">
          <p className="eyebrow">{treeMeta.profile}</p>
          <h1>Skill tree from baby to age 10</h1>
          <p className="masthead__copy">{treeMeta.stance}</p>
          <div className="metrics" aria-label="Tree summary">
            <span>
              <strong>{skills.length}</strong>
              skills
            </span>
            <span>
              <strong>{graphEdges.length}</strong>
              links
            </span>
            <span>
              <strong>{domains.length}</strong>
              domains
            </span>
            <span>
              <strong>{stages.length}</strong>
              age bands
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="focus-bar" aria-label="Tree focus controls">
          <div className="focus-bar__topline">
            <label className="search-box">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">Search skills</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find skills, outcomes, tags"
              />
            </label>

            <div className="view-switch" aria-label="Map view">
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
              Clear
            </button>
          </div>

          <div className="focus-row" aria-label="Age focus">
            <button
              className="stage-tab"
              type="button"
              aria-pressed={focusedStage === 'all'}
              onClick={() => setFocusedStage('all')}
            >
              Full timeline
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

          <div className="focus-row" aria-label="Domain focus">
            <button
              className="domain-chip"
              type="button"
              aria-pressed={focusedDomain === 'all'}
              onClick={() => setFocusedDomain('all')}
            >
              <Filter aria-hidden="true" size={16} />
              All domains
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

          <p className="result-count">
            {matchedSkills.length} search match{matchedSkills.length === 1 ? '' : 'es'} in {skills.length} skills
          </p>
        </section>

        <section className="tree-layout" aria-label="Skill tree">
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
                  return data.dimmed ? '#d7d0c3' : data.domain.color
                }}
              />
              <Panel position="top-left" className="map-panel">
                <div className="map-panel__title">
                  <Compass aria-hidden="true" size={18} />
                  Growth atlas
                </div>
                <p>
                  {viewMode === 'world' && 'World view shows the whole capability map with compact nodes.'}
                  {viewMode === 'path' && 'Path view highlights the selected skill, its roots, and its future branches.'}
                  {viewMode === 'node' && 'Node view moves close to one skill and keeps its direct links loud.'}
                </p>
              </Panel>
              <Panel position="top-right" className="legend-panel">
                <span>
                  <i className="legend-dot legend-dot--root" />
                  Root
                </span>
                <span>
                  <i className="legend-dot legend-dot--keystone" />
                  Keystone
                </span>
                <span>
                  <i className="legend-dot legend-dot--bridge" />
                  Bridge
                </span>
              </Panel>
            </ReactFlow>
          </div>

          <aside className="detail-panel" aria-label="Selected skill">
            <div className="detail-kicker" style={{ '--domain-color': selectedDomain.color } as CSSProperties}>
              <span className="detail-icon">
                <SelectedDomainIcon aria-hidden="true" size={18} />
              </span>
              {selectedDomain.label}
            </div>

            <h2>{selectedSkill.title}</h2>
            <p className="detail-summary">{selectedSkill.summary}</p>

            <dl className="detail-meta">
              <div>
                <dt>Age</dt>
                <dd>{stageLabelById.get(selectedSkill.stage)?.age}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{roleLabels[selectedRole]}</dd>
              </div>
              <div>
                <dt>Lineage</dt>
                <dd>{ancestorIds.size + descendantIds.size + 1} nodes</dd>
              </div>
              <div>
                <dt>Unlocks</dt>
                <dd>{selectedUnlocks.length}</dd>
              </div>
            </dl>

            <div className="detail-section">
              <h3>
                <Sparkles aria-hidden="true" size={17} />
                Outcomes
              </h3>
              <ul className="outcome-list">
                {selectedSkill.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>

            <SkillLinks title="Before this" icon={GitBranch} skills={selectedPrerequisites} onSelect={setSelectedId} />
            <SkillLinks title="Unlocks next" icon={ChevronRight} skills={selectedUnlocks} onSelect={setSelectedId} />

            <div className="tag-row" aria-label="Tags">
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

function SkillMapNode({ data, selected }: NodeProps<Node<SkillNodeData>>) {
  const Icon = domainIcons[data.domain.id]
  const relationLabel = data.relation ? relationLabels[data.relation] : roleLabels[data.role]

  return (
    <div
      className={[
        'skill-map-node',
        selected ? 'skill-map-node--selected' : '',
        data.dimmed ? 'skill-map-node--dimmed' : '',
        data.compact ? 'skill-map-node--compact' : '',
        data.relation ? `skill-map-node--${data.relation}` : '',
        `skill-map-node--role-${data.role}`,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--domain-color': data.domain.color } as CSSProperties}
    >
      <Handle className="skill-handle" type="target" position={Position.Left} />
      <div className="node-orb" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div className="node-copy">
        <span className="node-kicker">
          {data.domain.shortLabel}
          <span>{data.stage.age}</span>
        </span>
        <strong>{data.skill.title}</strong>
        {!data.compact && <p>{data.skill.summary}</p>}
      </div>
      <span className="node-badge">{relationLabel}</span>
      <span className="node-count">
        <GitBranch aria-hidden="true" size={13} />
        {data.unlockCount}
      </span>
      <Handle className="skill-handle" type="source" position={Position.Right} />
    </div>
  )
}

type SkillLinksProps = {
  title: string
  icon: LucideIcon
  skills: SkillNode[]
  onSelect: (id: string) => void
}

function SkillLinks({ title, icon: Icon, skills: linkedSkills, onSelect }: SkillLinksProps) {
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
        <p className="none-copy">No linked skills yet.</p>
      )}
    </div>
  )
}

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'world', label: 'World' },
  { id: 'path', label: 'Path' },
  { id: 'node', label: 'Node' },
]

const relationLabels: Record<Relation, string> = {
  selected: 'Selected',
  'direct-before': 'Before',
  'direct-next': 'Next',
  ancestor: 'Root path',
  descendant: 'Branch',
  matched: 'Match',
}

const roleLabels: Record<GraphRole, string> = {
  root: 'Root',
  keystone: 'Keystone',
  bridge: 'Bridge',
  leaf: 'Leaf',
  ordinary: 'Skill',
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

function buildGraphRoles(unlockMap: Map<string, SkillNode[]>) {
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
