import type { DomainId, StageId } from './skillTree'

export type DomainGuide = {
  domain: DomainId
  imageTone: string
  imageMotifs: string[]
  subdomains: string[]
  growthArc: Partial<Record<StageId, string>>
  practiceLoop: string[]
  materials: string[]
  observe: string[]
}

export const domainGuides: Record<DomainId, DomainGuide> = {
  movement: {
    domain: 'movement',
    imageTone: 'Forest movement trail',
    imageMotifs: ['balance beam', 'soft climbing shapes', 'reach paths'],
    subdomains: ['gross motor', 'fine motor', 'balance', 'stamina', 'posture', 'body awareness'],
    growthArc: {
      infancy: 'Sense, reach, roll, sit, crawl, and orient.',
      toddler: 'Walk, climb, carry, squat, stop, and recover.',
      preschool: 'Coordinate jumps, throws, catches, pedaling, and hand control.',
      'early-school': 'Build game movement, stamina, spacing, and safe falling.',
      'middle-childhood': 'Refine endurance, handwriting, tools, and sport foundations.',
      'later-childhood': 'Practice warmups, posture, strength basics, and recovery.',
    },
    practiceLoop: ['Model the movement slowly', 'Let him repeat with playful variation', 'Add one small challenge when it becomes easy'],
    materials: ['floor space', 'balls', 'blocks', 'low climbing surfaces', 'paper and pencils'],
    observe: ['coordination', 'fatigue', 'confidence', 'body control', 'safe risk judgment'],
  },
  care: {
    domain: 'care',
    imageTone: 'Warm daily rhythm scene',
    imageMotifs: ['sunrise routine', 'water cup', 'folded clothes'],
    subdomains: ['sleep', 'food', 'hygiene', 'body signals', 'emotional regulation', 'puberty readiness'],
    growthArc: {
      infancy: 'Build predictable sleep, feeding, comfort, and alert play.',
      toddler: 'Name needs, soothe with help, and participate in simple routines.',
      preschool: 'Practice toilet, washing, brushing, dressing, and body words.',
      'early-school': 'Own morning and bedtime sequences with fewer reminders.',
      'middle-childhood': 'Connect food, sleep, mood, movement, and concentration.',
      'later-childhood': 'Prepare for puberty, laundry, clean clothes, and health questions.',
    },
    practiceLoop: ['Anchor the skill to a real daily routine', 'Use a short visual or verbal checklist', 'Gradually hand over one step at a time'],
    materials: ['mirror', 'timer', 'laundry basket', 'toothbrush', 'water bottle'],
    observe: ['independence', 'body awareness', 'shame-free questions', 'consistency', 'recovery after stress'],
  },
  language: {
    domain: 'language',
    imageTone: 'Teal story table',
    imageMotifs: ['open book', 'speech bubbles', 'pencil lines'],
    subdomains: ['listening', 'speaking', 'vocabulary', 'reading', 'writing', 'evidence'],
    growthArc: {
      infancy: 'Share attention through gaze, sounds, gestures, and turn-taking.',
      toddler: 'Name people and objects, request, and follow simple directions.',
      preschool: 'Tell stories, ask why, and retell events in order.',
      'early-school': 'Connect sounds to letters and write simple messages.',
      'middle-childhood': 'Read to learn, write paragraphs, and explain opinions.',
      'later-childhood': 'Research, cite reasons, and disagree without insults.',
    },
    practiceLoop: ['Talk about what is happening now', 'Invite him to explain it back', 'Add one new word, reason, or sentence structure'],
    materials: ['books', 'labels', 'paper', 'story cards', 'family conversations'],
    observe: ['turn-taking', 'clarity', 'comprehension', 'curiosity', 'precision'],
  },
  reasoning: {
    domain: 'reasoning',
    imageTone: 'Blue problem-solving workshop',
    imageMotifs: ['number tiles', 'pattern blocks', 'map lines'],
    subdomains: ['memory', 'patterns', 'counting', 'math', 'planning', 'systems'],
    growthArc: {
      infancy: 'Explore objects, cause and effect, hiding, and repetition.',
      toddler: 'Sort, stack, match, test, and try alternate solutions.',
      preschool: 'Count small sets, name shapes, and predict patterns.',
      'early-school': 'Add, subtract, tell time, and explain problem steps.',
      'middle-childhood': 'Use multiplication, money, measurement, and maps.',
      'later-childhood': 'Plan larger tasks, estimate consequences, and compare tradeoffs.',
    },
    practiceLoop: ['Start with a concrete object problem', 'Ask what changed or what comes next', 'Let him show the steps with words or drawings'],
    materials: ['coins', 'blocks', 'measuring tape', 'calendar', 'maps'],
    observe: ['strategy', 'persistence', 'estimation', 'pattern recognition', 'explanation'],
  },
  social: {
    domain: 'social',
    imageTone: 'Coral circle of belonging',
    imageMotifs: ['two chairs', 'shared game pieces', 'repair bridge'],
    subdomains: ['attachment', 'emotion words', 'empathy', 'friendship', 'conflict', 'leadership'],
    growthArc: {
      infancy: 'Trust familiar adults, seek comfort, and share attention.',
      toddler: 'Play near peers, practice turns, and repair after conflict.',
      preschool: 'Name feelings, share roles, and solve problems with adult help.',
      'early-school': 'Use fair play, group rules, apologies, and inclusion.',
      'middle-childhood': 'Handle teams, reputation, teasing, pressure, and loyalty.',
      'later-childhood': 'Lead calmly, set boundaries, and keep conscience under pressure.',
    },
    practiceLoop: ['Name the social situation plainly', 'Practice the exact words to use', 'Repair quickly after mistakes'],
    materials: ['turn-taking games', 'emotion cards', 'team chores', 'role-play prompts'],
    observe: ['empathy', 'repair', 'fairness', 'peer pressure', 'calm leadership'],
  },
  practical: {
    domain: 'practical',
    imageTone: 'Olive useful-home workbench',
    imageMotifs: ['small tools', 'folded towel', 'snack plate'],
    subdomains: ['self-feeding', 'chores', 'organization', 'cooking', 'tools', 'resourcefulness'],
    growthArc: {
      infancy: 'Grasp, release, mouth, transfer, and explore safe foods.',
      toddler: 'Use spoon and cup, carry items, and copy small chores.',
      preschool: 'Tidy belongings, set items, water plants, and clean spills.',
      'early-school': 'Pack bags, set tables, fold towels, and prepare snacks.',
      'middle-childhood': 'Use tools, cook simple foods, care for spaces, and organize.',
      'later-childhood': 'Cook, clean, plan, repair, and care for shared resources.',
    },
    practiceLoop: ['Give him a real job with real materials', 'Make the standard visible', 'Let repetition create competence'],
    materials: ['basket', 'cloth', 'safe utensils', 'simple tools', 'labels'],
    observe: ['usefulness', 'sequence memory', 'care for tools', 'initiative', 'cleanup quality'],
  },
  safety: {
    domain: 'safety',
    imageTone: 'Clay boundary map',
    imageMotifs: ['shield marker', 'crosswalk', 'first aid symbol'],
    subdomains: ['body boundaries', 'traffic', 'water', 'fire', 'digital privacy', 'first aid'],
    growthArc: {
      infancy: 'Build protected routines and trusted body signals.',
      toddler: 'Respond to urgent safety words around streets, heat, heights, and water.',
      preschool: 'Learn private body words, consent, and trusted adult rules.',
      'early-school': 'Use traffic, water, fire, address, and emergency basics.',
      'middle-childhood': 'Protect privacy online and navigate community boundaries.',
      'later-childhood': 'Judge risk, identify unsafe pressure, and use first aid basics.',
    },
    practiceLoop: ['Teach the rule before the risky setting', 'Rehearse the exact action', 'Debrief calmly after the situation'],
    materials: ['family safety words', 'emergency card', 'practice phone', 'first aid kit'],
    observe: ['stopping power', 'body boundaries', 'help-seeking', 'privacy', 'risk judgment'],
  },
  creativity: {
    domain: 'creativity',
    imageTone: 'Violet studio of making',
    imageMotifs: ['paper shapes', 'rhythm marks', 'building pieces'],
    subdomains: ['pretend play', 'drawing', 'music', 'building', 'performance', 'creative voice'],
    growthArc: {
      infancy: 'Enjoy rhythm, peekaboo, texture, sounds, and imitation.',
      toddler: 'Pretend daily life with sounds, roles, and objects.',
      preschool: 'Draw, sing, build, move, and make visible ideas.',
      'early-school': 'Finish small creative projects with frustration support.',
      'middle-childhood': 'Revise craft, share with an audience, and learn from models.',
      'later-childhood': 'Develop voice, practice habits, influences, and meaningful work.',
    },
    practiceLoop: ['Offer materials with no single right answer', 'Ask what he is making or trying', 'Help him revise one choice'],
    materials: ['paper', 'blocks', 'music', 'costumes', 'recycled materials'],
    observe: ['originality', 'focus', 'revision', 'taste', 'sharing courage'],
  },
  character: {
    domain: 'character',
    imageTone: 'Slate community compass',
    imageMotifs: ['small compass', 'shared table', 'steady path'],
    subdomains: ['patience', 'truthfulness', 'responsibility', 'courage', 'service', 'self-respect'],
    growthArc: {
      infancy: 'Practice attention, curiosity, recovery, and brief waiting with support.',
      toddler: 'Learn limits and repair mistakes with help.',
      preschool: 'Tell simple truth, wait, try again, and repair small harm.',
      'early-school': 'Keep small commitments and respect shared property.',
      'middle-childhood': 'Own mistakes, attempt hard things, and defend fair rules.',
      'later-childhood': 'Connect strength with integrity, service, humility, and dignity.',
    },
    practiceLoop: ['Name the value in a concrete moment', 'Give a small responsibility with follow-through', 'Review what happened without humiliation'],
    materials: ['family jobs', 'repair script', 'service opportunities', 'reflection questions'],
    observe: ['honesty', 'follow-through', 'repair', 'courage', 'dignity'],
  },
}

export const stagePracticePrompts: Record<StageId, string[]> = {
  infancy: ['Keep it warm, brief, sensory, and caregiver-led', 'Repeat often in ordinary routines'],
  toddler: ['Use simple words and one-step invitations', 'Expect practice, not mastery'],
  preschool: ['Turn the skill into pretend play or a small job', 'Use visible routines and quick repair'],
  'early-school': ['Let him explain the rule or sequence', 'Make the work useful to home, class, or play'],
  'middle-childhood': ['Add responsibility, feedback, and measurable improvement', 'Let him compare strategies'],
  'later-childhood': ['Invite judgment, planning, and reflection', 'Connect the skill to dignity and contribution'],
}
