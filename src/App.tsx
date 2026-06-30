import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  Brain,
  ChevronRight,
  CircleDot,
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

type DomainFilter = DomainId | 'all'
type StageFilter = StageId | 'all'

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

function App() {
  const [selectedId, setSelectedId] = useState(defaultSkillId)
  const [query, setQuery] = useState('')
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('all')
  const [activeStage, setActiveStage] = useState<StageFilter>('all')

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

  const selectedSkill = skillById.get(selectedId) ?? skillById.get(defaultSkillId) ?? skills[0]
  const selectedUnlocks = unlockMap.get(selectedSkill.id) ?? []
  const selectedPrerequisites = selectedSkill.prerequisites
    .map((id) => skillById.get(id))
    .filter((skill): skill is SkillNode => Boolean(skill))

  const normalizedQuery = query.trim().toLowerCase()

  const visibleSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesDomain = activeDomain === 'all' || skill.domain === activeDomain
      const matchesStage = activeStage === 'all' || skill.stage === activeStage
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

      return matchesDomain && matchesStage && (!normalizedQuery || haystack.includes(normalizedQuery))
    })
  }, [activeDomain, activeStage, normalizedQuery])

  const visibleIds = useMemo(() => new Set(visibleSkills.map((skill) => skill.id)), [visibleSkills])
  const visibleByStage = useMemo(
    () =>
      stages.map((stage) => ({
        stage,
        skills: skills.filter((skill) => skill.stage === stage.id && visibleIds.has(skill.id)),
      })),
    [visibleIds],
  )

  useEffect(() => {
    if (visibleSkills.length > 0 && !visibleIds.has(selectedId)) {
      setSelectedId(visibleSkills[0].id)
    }
  }, [selectedId, visibleIds, visibleSkills])

  const selectedDomain = domainById.get(selectedSkill.domain) ?? domains[0]
  const SelectedDomainIcon = domainIcons[selectedDomain.id]
  const activeFilterCount = Number(Boolean(normalizedQuery)) + Number(activeDomain !== 'all') + Number(activeStage !== 'all')
  const selectedPrerequisiteIds = new Set(selectedSkill.prerequisites)
  const selectedUnlockIds = new Set(selectedUnlocks.map((skill) => skill.id))

  function clearFilters() {
    setQuery('')
    setActiveDomain('all')
    setActiveStage('all')
  }

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
              <strong>{domains.length}</strong>
              domains
            </span>
            <span>
              <strong>{stages.length}</strong>
              stages
            </span>
            <span>
              <strong>{treeMeta.version}</strong>
              version
            </span>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="filters" aria-label="Skill filters">
          <div className="filters__topline">
            <label className="search-box">
              <Search aria-hidden="true" size={18} />
              <span className="sr-only">Search skills</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills, outcomes, tags"
              />
            </label>

            <button className="clear-button" type="button" onClick={clearFilters} disabled={activeFilterCount === 0}>
              <X aria-hidden="true" size={17} />
              Clear
            </button>
          </div>

          <div className="stage-tabs" aria-label="Age stages">
            <button
              className="stage-tab"
              type="button"
              aria-pressed={activeStage === 'all'}
              onClick={() => setActiveStage('all')}
            >
              All stages
            </button>
            {stages.map((stage) => (
              <button
                className="stage-tab"
                type="button"
                key={stage.id}
                aria-pressed={activeStage === stage.id}
                onClick={() => setActiveStage(stage.id)}
              >
                <span>{stage.age}</span>
                {stage.title}
              </button>
            ))}
          </div>

          <div className="domain-strip" aria-label="Skill domains">
            <button
              className="domain-chip"
              type="button"
              aria-pressed={activeDomain === 'all'}
              onClick={() => setActiveDomain('all')}
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
                  aria-pressed={activeDomain === domain.id}
                  onClick={() => setActiveDomain(domain.id)}
                  style={{ '--domain-color': domain.color } as CSSProperties}
                >
                  <Icon aria-hidden="true" size={16} />
                  {domain.shortLabel}
                </button>
              )
            })}
          </div>

          <p className="result-count">
            {visibleSkills.length} of {skills.length} skills visible
          </p>
        </section>

        <section className="tree-layout" aria-label="Skill tree">
          <div className="tree-board">
            <div className="stage-columns">
              {visibleByStage.map(({ stage, skills: stageSkills }) => (
                <section className="stage-column" key={stage.id} aria-labelledby={`${stage.id}-title`}>
                  <div className="stage-header">
                    <span className="stage-age">{stage.age}</span>
                    <h2 id={`${stage.id}-title`}>{stage.title}</h2>
                    <p>{stage.focus}</p>
                  </div>

                  <div className="skill-list">
                    {stageSkills.length > 0 ? (
                      stageSkills.map((skill) => {
                        const domain = domainById.get(skill.domain) ?? domains[0]
                        const isSelected = selectedSkill.id === skill.id
                        const isPrerequisite = selectedPrerequisiteIds.has(skill.id)
                        const isUnlock = selectedUnlockIds.has(skill.id)

                        return (
                          <SkillCard
                            key={skill.id}
                            skill={skill}
                            domain={domain}
                            selected={isSelected}
                            relation={isPrerequisite ? 'Prerequisite' : isUnlock ? 'Unlocks' : undefined}
                            onSelect={() => setSelectedId(skill.id)}
                          />
                        )
                      })
                    ) : (
                      <p className="empty-stage">No skills match this view.</p>
                    )}
                  </div>
                </section>
              ))}
            </div>
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
                <dt>Stage</dt>
                <dd>{stageLabelById.get(selectedSkill.stage)?.title}</dd>
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

type SkillCardProps = {
  skill: SkillNode
  domain: (typeof domains)[number]
  selected: boolean
  relation?: 'Prerequisite' | 'Unlocks'
  onSelect: () => void
}

function SkillCard({ skill, domain, selected, relation, onSelect }: SkillCardProps) {
  const Icon = domainIcons[domain.id]
  const stage = stageLabelById.get(skill.stage)

  return (
    <button
      className="skill-node"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{ '--domain-color': domain.color } as CSSProperties}
    >
      <span className="node-topline">
        <span className="node-domain">
          <Icon aria-hidden="true" size={15} />
          {domain.shortLabel}
        </span>
        {relation && <span className="node-relation">{relation}</span>}
      </span>
      <strong>{skill.title}</strong>
      <span className="node-summary">{skill.summary}</span>
      <span className="node-footer">
        <span>{stage?.age}</span>
        <span>
          <GitBranch aria-hidden="true" size={14} />
          {skill.prerequisites.length}
        </span>
      </span>
    </button>
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

export default App
