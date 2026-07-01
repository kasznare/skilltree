import type { StageId } from '../data/skillTree'

export type KidProfile = {
  id: string
  name: string
  ageBand: StageId
  completedSkillIds: string[]
  createdAt: string
}

const storageKey = 'skilltree:kid-profiles:v1'

const defaultProfile: KidProfile = {
  id: 'default-child',
  name: 'First child',
  ageBand: 'infancy',
  completedSkillIds: [],
  createdAt: new Date(0).toISOString(),
}

export function loadProfiles() {
  if (typeof window === 'undefined') {
    return [defaultProfile]
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return [defaultProfile]
    }

    const parsed = JSON.parse(raw) as KidProfile[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [defaultProfile]
    }

    return parsed.map((profile) => ({
      ...defaultProfile,
      ...profile,
      completedSkillIds: Array.isArray(profile.completedSkillIds) ? profile.completedSkillIds : [],
    }))
  } catch {
    return [defaultProfile]
  }
}

export function saveProfiles(profiles: KidProfile[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(profiles))
}

export function createProfile(name: string, ageBand: StageId): KidProfile {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32)

  return {
    id: `${slug || 'child'}-${Date.now().toString(36)}`,
    name,
    ageBand,
    completedSkillIds: [],
    createdAt: new Date().toISOString(),
  }
}
