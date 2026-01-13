/**
 * Wiki Generator Module
 * Handles world-building wiki-related AI generation functions
 */

export interface WikiContext {
  chapters?: Array<{ content?: string }>
  existingEntries?: string[]
  specification?: {
    genre?: string[]
  }
  genre?: string[]
  entry?: {
    name?: string
    category?: string
    description?: string
  }
}

export interface WikiElement {
  name: string
  category: string
  description: string
}

/**
 * Extract wiki elements from chapters based on genre
 */
export function extractWikiElements(context: WikiContext): string {
  const existingEntries = context.existingEntries || []
  const spec = context.specification || {}

  const genre = spec.genre?.[0] || 'fiction'

  // Generate sample extracted elements based on genre
  const elements: WikiElement[] = []

  if (genre.toLowerCase().includes('fantasy')) {
    elements.push(
      {
        name: 'The Whispering Woods',
        category: 'locations',
        description: 'An ancient forest where magic lingers in the air and trees seem to speak to those who listen.',
      },
      {
        name: 'Binding Ritual',
        category: 'magicTechnology',
        description: 'A ceremonial practice that creates an unbreakable magical bond between participants.',
      },
      {
        name: 'The Silver Order',
        category: 'culturesFactions',
        description: 'A secretive organization dedicated to preserving ancient knowledge and artifacts.',
      }
    )
  } else if (genre.toLowerCase().includes('sci')) {
    elements.push(
      {
        name: 'Quantum Drive',
        category: 'magicTechnology',
        description: 'The propulsion system that allows faster-than-light travel through folded space.',
      },
      {
        name: 'Nexus Station',
        category: 'locations',
        description: 'The central hub of interstellar commerce and diplomacy.',
      },
      {
        name: 'The Collective',
        category: 'culturesFactions',
        description: 'A post-human civilization that has merged consciousness into a shared network.',
      }
    )
  } else if (genre.toLowerCase().includes('mystery') || genre.toLowerCase().includes('thriller')) {
    elements.push(
      {
        name: 'The Blackwood Estate',
        category: 'locations',
        description: 'A sprawling Victorian mansion with a history of mysterious deaths.',
      },
      {
        name: 'The Cipher',
        category: 'objects',
        description: 'A coded message that holds the key to unlocking the central mystery.',
      },
      {
        name: 'Protocol Seven',
        category: 'terminology',
        description: 'A clandestine operation referenced in classified documents.',
      }
    )
  } else {
    elements.push(
      {
        name: 'Maple Street',
        category: 'locations',
        description: 'The quiet neighborhood where much of the story takes place.',
      },
      {
        name: 'The Family Recipe',
        category: 'objects',
        description: 'A treasured heirloom that carries generations of meaning.',
      },
      {
        name: 'The Incident',
        category: 'timeline',
        description: 'A pivotal event that changed everything for the main characters.',
      }
    )
  }

  // Filter out elements that already exist
  const filtered = elements.filter(
    (e) =>
      !existingEntries.some(
        (existing: string) => existing.toLowerCase() === e.name.toLowerCase()
      )
  )

  return JSON.stringify(filtered)
}

/**
 * Expand a wiki entry with more detail based on category
 */
export function expandWikiEntry(context: WikiContext): string {
  const entry = context.entry || {}

  const name = entry.name || 'Unknown'
  const category = entry.category || 'terminology'
  const description = entry.description || ''

  let expanded = description + '\n\n'

  // Add category-specific details
  if (category === 'locations') {
    expanded += `**Geography & Layout:**\n${name} occupies a strategic position within the story's world. Its physical characteristics reflect its history and purpose.\n\n`
    expanded += `**Atmosphere:**\nThe overall feeling of ${name} is one that immediately affects visitors. The environment tells a story of its own.\n\n`
    expanded += `**Significance:**\n${name} plays a crucial role in the narrative, serving as both a physical location and a symbolic space.`
  } else if (category === 'characters') {
    expanded += `**Background:**\nThe full history of this character reveals layers of complexity that inform their current motivations.\n\n`
    expanded += `**Relationships:**\nTheir connections to other characters create a web of loyalties, conflicts, and dependencies.\n\n`
    expanded += `**Arc:**\nThis character undergoes significant development throughout the story.`
  } else if (category === 'magicTechnology') {
    expanded += `**How It Works:**\nThe underlying principles that make this possible are rooted in the story's internal logic.\n\n`
    expanded += `**Limitations:**\nNo power comes without cost or constraint. These limitations create dramatic tension.\n\n`
    expanded += `**History:**\nThe origins and development of this capability inform how characters view and use it.`
  } else if (category === 'culturesFactions') {
    expanded += `**Values & Beliefs:**\nThe core principles that guide this group shape their actions and reactions.\n\n`
    expanded += `**Structure:**\nInternal organization determines how power flows and decisions are made.\n\n`
    expanded += `**Conflicts:**\nTensions with other groups or internal divisions create narrative opportunities.`
  } else {
    expanded += `**Details:**\nFurther examination reveals additional layers of meaning and significance.\n\n`
    expanded += `**Connections:**\nThis element connects to multiple aspects of the story, creating thematic resonance.\n\n`
    expanded += `**Impact:**\nThe presence of ${name} shapes how events unfold and characters respond.`
  }

  return expanded
}
