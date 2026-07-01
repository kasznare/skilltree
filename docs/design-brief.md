# Skill Tree Design Brief

## Product Idea

This app should feel like a growth atlas: a map of human capability unfolding over time. It is not a checklist, a curriculum table, or a database search page. The first track is male, ages 0-10, but early development is mostly shared human development and should stay expandable for future tracks.

## Research Anchors

- CDC developmental milestones frame childhood skills as how children "play, learn, speak, act, and move." That argues for observable capabilities, not abstract labels.
- Head Start ELOF groups early development into central domains such as approaches to learning, social-emotional development, language and literacy, cognition, and perceptual/motor/physical development. That supports broad domains, but not isolated silos.
- NAEYC states that developmental domains support and are supported by each other. That means cross-domain edges are central to the visual experience.
- React Flow provides the browser interaction layer for graph views: pan, zoom, minimap, controls, custom nodes, and edges.
- ELK layered layout is suited to directed node-link diagrams where edges imply progression. The skill tree is a DAG, not a strict single-parent tree.

Sources:

- https://www.cdc.gov/act-early/milestones/index.html
- https://headstart.gov/interactive-head-start-early-learning-outcomes-framework-ages-birth-five
- https://www.naeyc.org/resources/position-statements/dap/principles
- https://reactflow.dev/
- https://reactflow.dev/examples/layout/elkjs
- https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html

## Design Principles

1. Tree first, filters second.
   The default screen must show dependency shape. Search and domain controls should focus or highlight the map, not turn it into disconnected result cards.

2. Ages are progression, not containers.
   Age bands should act as a temporal horizon. Skills can be grouped by age, but dependencies should be allowed to cross domains and stages.

3. Domains are ecosystems, not tabs.
   Domains are colored territories in the map. They help orientation, but the actual meaning comes from the links between them.

4. Show less text until asked.
   The map should use compact nodes with icons, status, and short labels. Longer outcomes and explanations belong in the selected skill panel.

5. Clicking a node should tell a story.
   Selection should reveal ancestors, direct prerequisites, downstream unlocks, bridge edges, and why the skill matters.

6. Some skills are structurally special.
   Nodes should expose graph roles:
   - root: no prerequisites
   - keystone: unlocks many future nodes
   - bridge: prerequisites or unlocks cross domains
   - leaf: currently has no unlocks in this data set

## Interaction Model

### World View

The whole map is visible enough to understand progression from infancy to later childhood. Users can pan, zoom, and use a minimap. Age bands and domain colors provide orientation.

### Path View

When a skill is selected, its ancestry and descendants become prominent. Direct prerequisites and direct unlocks receive stronger treatment than the rest of the lineage. Everything unrelated fades, but remains spatially present.

### Node View

The detail panel explains the selected skill:

- domain
- age stage
- graph role
- outcomes
- direct prerequisites
- direct unlocks
- tags

## Implementation Direction

Use React Flow and ELK:

- React Flow renders custom skill nodes, edges, controls, minimap, and fit-view behavior.
- ELK computes the left-to-right DAG layout from prerequisites.
- The local data file remains the source of truth.
- Derived graph metadata should be computed in React, not stored by hand.

The first production-quality pass does not need a perfect final art direction. It does need a strong graph foundation that can support more creative visual layers later.
