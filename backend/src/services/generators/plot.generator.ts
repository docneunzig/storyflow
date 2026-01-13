/**
 * Plot Generator Module
 * Handles plot-related AI generation functions
 */

export interface PlotContext {
  beat?: {
    title?: string
    summary?: string
    emotionalArc?: string
    stakes?: string
  }
  existingBeats?: Array<{ title?: string; summary?: string }>
  characters?: Array<{ name?: string }>
  specification?: {
    genre?: string[]
    themes?: string[]
  }
  genre?: string[]
  themes?: string[]
  currentThemes?: string[]
  tone?: string
  targetAudience?: string
  title?: string
}

export interface ExpandedScene {
  title: string
  summary: string
}

/**
 * Expand a plot beat into 3-5 detailed scenes
 */
export function expandBeat(context: PlotContext): string {
  const beat = context.beat || {}
  const characters = context.characters || []

  const beatTitle = beat.title || 'Untitled Beat'
  const beatSummary = beat.summary || ''
  const emotionalArc = beat.emotionalArc || 'tension rising'

  // Generate 3-5 scenes from this beat
  const scenes: ExpandedScene[] = []

  // Scene 1: Opening/Setup
  scenes.push({
    title: `${beatTitle}: Opening`,
    summary: `Establish the situation at the start of this beat. ${beatSummary.split('.')[0]}. Characters are positioned and stakes are made clear.`,
  })

  // Scene 2: Development
  if (characters.length > 0) {
    const charName = characters[0].name || 'The protagonist'
    scenes.push({
      title: `${beatTitle}: Confrontation`,
      summary: `${charName} faces the central challenge of this beat. Conflict intensifies as obstacles emerge. The emotional arc shifts toward ${emotionalArc}.`,
    })
  } else {
    scenes.push({
      title: `${beatTitle}: Rising Action`,
      summary: `The situation escalates. Complications arise that make the goal harder to achieve. Characters must adapt their approach.`,
    })
  }

  // Scene 3: Turning Point
  scenes.push({
    title: `${beatTitle}: Turning Point`,
    summary: `A critical moment changes the trajectory. ${beat.stakes ? `The stakes (${beat.stakes}) become undeniably real.` : 'Stakes become personal.'} Nothing can be the same after this.`,
  })

  // Scene 4: Aftermath (if beat is substantial)
  if (beatSummary.length > 100) {
    scenes.push({
      title: `${beatTitle}: Aftermath`,
      summary: `Characters process what happened. New understanding emerges. The path forward becomes clearer, though perhaps not easier.`,
    })
  }

  return JSON.stringify(scenes)
}

/**
 * Suggest plot twists based on genre and story context
 */
export function suggestTwists(context: PlotContext): string {
  const beat = context.beat || {}
  const existingBeats = context.existingBeats || []
  const spec = context.specification || {}

  const genre = spec.genre?.[0] || 'fiction'
  const themes = spec.themes || ['conflict', 'growth']

  // Generate contextual twists based on the story
  const twists: string[] = []

  // Betrayal twist
  twists.push(
    `A character thought to be an ally has been working against the protagonist all along, motivated by ${themes[0] || 'hidden desires'}.`
  )

  // Revelation twist
  twists.push(
    `The true nature of ${beat.title || 'this situation'} is revealed: what seemed like ${beat.stakes || 'the main problem'} is actually a symptom of something much larger.`
  )

  // Role reversal twist
  if (existingBeats.length > 2) {
    twists.push(
      `The antagonist's methods prove to be the only solution, forcing the protagonist to adopt the very approach they opposed.`
    )
  } else {
    twists.push(
      `The mentor figure has been testing the protagonist with false information, and the real truth changes everything.`
    )
  }

  // Genre-specific twist
  if (genre.toLowerCase().includes('romance')) {
    twists.push(
      `The love interest has a hidden connection to the protagonist's past that complicates their relationship.`
    )
  } else if (genre.toLowerCase().includes('thriller') || genre.toLowerCase().includes('mystery')) {
    twists.push(
      `The evidence pointing to the obvious suspect was planted—the real culprit is the person who seemed most helpful.`
    )
  } else if (genre.toLowerCase().includes('fantasy') || genre.toLowerCase().includes('sci-fi')) {
    twists.push(
      `The power/technology that seemed like salvation has a terrible cost that was hidden until now.`
    )
  } else {
    twists.push(
      `The goal the protagonist has been pursuing would actually make things worse—they've been wrong about what they truly need.`
    )
  }

  return JSON.stringify(twists)
}

/**
 * Suggest novel titles based on genre and themes
 */
export function suggestTitles(context: PlotContext): string {
  const genre = context.genre?.[0] || 'fiction'
  const themes = context.themes || []

  const titles: string[] = []

  // Genre-inspired title
  if (genre.toLowerCase().includes('fantasy')) {
    titles.push('The Crown of Shadows')
    titles.push('Kingdoms of Ash and Light')
    titles.push('The Last Spellweaver')
  } else if (genre.toLowerCase().includes('romance')) {
    titles.push('The Heart Remembers')
    titles.push('Second Chances at Sunrise')
    titles.push('Where Love Finds You')
  } else if (genre.toLowerCase().includes('mystery') || genre.toLowerCase().includes('thriller')) {
    titles.push('The Silent Witness')
    titles.push('What She Knew')
    titles.push('The Truth Behind the Lies')
  } else if (genre.toLowerCase().includes('sci')) {
    titles.push('Beyond the Last Star')
    titles.push('The Quantum Protocol')
    titles.push('Echoes of Tomorrow')
  } else {
    titles.push('The Weight of Words')
    titles.push('Between the Lines')
    titles.push('What Remains')
  }

  // Theme-inspired adjustments
  if (themes.includes('Redemption')) {
    titles.push('The Road Back Home')
  }
  if (themes.includes('Love')) {
    titles.push("The Heart's True North")
  }
  if (themes.includes('Power')) {
    titles.push('The Price of Ambition')
  }

  // Return first 3 titles
  return JSON.stringify(titles.slice(0, 3))
}

/**
 * Suggest narrative tones based on genre
 */
export function suggestTones(context: PlotContext): string {
  const genre = context.genre?.[0] || 'fiction'

  const tones: string[] = []

  // Genre-appropriate tones
  if (genre.toLowerCase().includes('fantasy')) {
    tones.push('Epic and sweeping with moments of intimate wonder')
    tones.push('Dark and atmospheric with threads of hope')
    tones.push('Whimsical yet grounded in emotional truth')
  } else if (genre.toLowerCase().includes('romance')) {
    tones.push('Warm and witty with emotional depth')
    tones.push('Passionate and dramatic with tender moments')
    tones.push('Light-hearted with an undercurrent of genuine connection')
  } else if (genre.toLowerCase().includes('thriller')) {
    tones.push('Tense and propulsive with psychological depth')
    tones.push('Gritty and realistic with moments of moral ambiguity')
    tones.push('Suspenseful and twisty with unreliable perspectives')
  } else if (genre.toLowerCase().includes('mystery')) {
    tones.push('Atmospheric and puzzling with elegant reveals')
    tones.push('Cozy yet intriguing with quirky charm')
    tones.push('Noir-influenced with sharp dialogue and shadows')
  } else {
    tones.push('Lyrical and contemplative with emotional resonance')
    tones.push('Spare and precise with powerful understatement')
    tones.push('Rich and immersive with vivid sensory detail')
  }

  return JSON.stringify(tones.slice(0, 3))
}

/**
 * Suggest thematic elements for the story
 */
export function suggestThemes(context: PlotContext): string {
  const currentThemes = context.currentThemes || []

  const allThemes = [
    'The cost of keeping secrets',
    'Finding belonging after loss',
    'The gap between truth and perception',
    'Inheritance—what we receive and what we leave behind',
    'The masks we wear and who we are beneath them',
    'The tension between duty and desire',
    'Rebuilding after destruction',
    'The search for authentic connection',
    'Coming to terms with the past',
    'The price of power',
    'Memory as both burden and gift',
    'The courage to be vulnerable',
    'Confronting inherited trauma',
    'The nature of forgiveness',
    'Finding hope in darkness',
  ]

  // Filter out current themes
  const available = allThemes.filter(t =>
    !currentThemes.some((ct: string) =>
      t.toLowerCase().includes(ct.toLowerCase()) ||
      ct.toLowerCase().includes(t.toLowerCase())
    )
  )

  // Shuffle and take 3
  const shuffled = available.sort(() => Math.random() - 0.5)

  return JSON.stringify(shuffled.slice(0, 3))
}
