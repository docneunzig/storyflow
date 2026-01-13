/**
 * Prose generation helper utilities
 * Shared functions for generating narrative prose elements
 */

export interface TenseProseResult {
  description: string
  sampleNarration: string
}

export interface POVProseResult {
  description: string
  sampleNarration: string
}

export interface AudienceGuidelines {
  description: string
  contentGuidelines: string[]
  avoid: string[]
  themes: string[]
}

export interface SettingElements {
  elements: string[]
  vocabulary: string[]
  avoid: string[]
}

/**
 * Get tense-specific prose examples based on narrative tense and POV
 */
export function getTenseProse(tense: string, pov: string): TenseProseResult {
  const tenseLower = (tense || '').toLowerCase()
  const povLower = (pov || '').toLowerCase()

  // Determine POV pronouns
  const isFirstPerson = povLower.includes('first')
  const subject = isFirstPerson ? 'I' : 'She'
  const possessive = isFirstPerson ? 'my' : 'her'

  // Present Tense
  if (tenseLower.includes('present')) {
    return {
      description: 'Present Tense',
      sampleNarration: `${subject} walk${isFirstPerson ? '' : 's'} through the doorway, ${possessive} heart pounding in ${possessive} chest. Something about this place feels wrong—${subject} can sense it in ${possessive} bones. Looking around, ${subject} notice${isFirstPerson ? '' : 's'} the shadows seem to shift. "Hello?" ${subject} call${isFirstPerson ? '' : 's'} out. There is no answer.`
    }
  }

  // Future Tense
  if (tenseLower.includes('future')) {
    return {
      description: 'Future Tense',
      sampleNarration: `${subject} will walk through the doorway, ${possessive} heart will pound in ${possessive} chest. Something about this place will feel wrong. ${subject} will look around, noticing shadows that will seem to shift. "${isFirstPerson ? 'I' : 'She'}'ll call out, 'Hello?'" There will be no answer.`
    }
  }

  // Default - Past Tense
  return {
    description: 'Past Tense',
    sampleNarration: `${subject} walked through the doorway, ${possessive} heart pounding in ${possessive} chest. Something about this place felt wrong—${subject} could sense it in ${possessive} bones. Looking around, ${subject} noticed the shadows seemed to shift. "Hello?" ${subject} called out. There was no answer.`
  }
}

/**
 * Get POV-specific prose examples
 */
export function getPOVProse(pov: string): POVProseResult {
  const povLower = (pov || '').toLowerCase()

  // First Person
  if (povLower.includes('first')) {
    return {
      description: 'First Person (I, me, my)',
      sampleNarration: `I walked through the doorway, my heart pounding in my chest. Something about this place felt wrong—I could sense it in my bones. Looking around, I noticed the shadows seemed to shift whenever I turned my head. "Hello?" I called out, my voice echoing off the walls. There was no answer, but I knew I wasn't alone.`
    }
  }

  // Third Person Limited
  if (povLower.includes('third') && (povLower.includes('limited') || !povLower.includes('omniscient'))) {
    return {
      description: 'Third Person Limited (he, she, they)',
      sampleNarration: `She walked through the doorway, her heart pounding in her chest. Something about this place felt wrong—she could sense it in her bones. Looking around, she noticed the shadows seemed to shift whenever she turned her head. "Hello?" she called out, her voice echoing off the walls. There was no answer, but she knew she wasn't alone.`
    }
  }

  // Third Person Omniscient
  if (povLower.includes('omniscient')) {
    return {
      description: 'Third Person Omniscient (narrator knows all)',
      sampleNarration: `She walked through the doorway, though she didn't know that behind the walls, three others were watching her every move. Her heart pounded in her chest—a fear she couldn't explain but that her watchers understood all too well. The shadows in this place were more than they seemed, ancient things that had witnessed countless others enter, never to leave.`
    }
  }

  // Second Person
  if (povLower.includes('second')) {
    return {
      description: 'Second Person (you, your)',
      sampleNarration: `You walk through the doorway, your heart pounding in your chest. Something about this place feels wrong—you can sense it in your bones. Looking around, you notice the shadows seem to shift whenever you turn your head. "Hello?" you call out, your voice echoing off the walls. There is no answer, but you know you're not alone.`
    }
  }

  // Default - Third Person Limited
  return {
    description: 'Third Person Limited (default)',
    sampleNarration: `They walked through the doorway, uncertain of what lay ahead. The atmosphere was tense, charged with anticipation. Events would soon unfold that would change everything.`
  }
}

/**
 * Get audience-appropriate content guidelines
 */
export function getAudienceGuidelines(audience: string): AudienceGuidelines {
  const audienceLower = (audience || '').toLowerCase()

  // Middle Grade (ages 8-12)
  if (audienceLower.includes('middle grade') || audienceLower.includes('middle-grade') || audienceLower.includes('mg')) {
    return {
      description: 'Middle Grade (ages 8-12)',
      contentGuidelines: [
        'Age-appropriate language and situations',
        'Focus on friendship, family, and self-discovery',
        'Protagonist typically aged 10-13',
        'Positive resolution and hope'
      ],
      avoid: [
        'Graphic violence',
        'Explicit romantic content',
        'Excessive profanity',
        'Overly dark or hopeless themes',
        'Complex adult relationships'
      ],
      themes: ['friendship', 'courage', 'identity', 'belonging', 'adventure', 'discovery']
    }
  }

  // Young Adult (ages 13-18)
  if (audienceLower.includes('young adult') || audienceLower.includes('ya') || audienceLower.includes('teen')) {
    return {
      description: 'Young Adult (ages 13-18)',
      contentGuidelines: [
        'Coming-of-age themes and identity exploration',
        'Protagonist typically aged 15-18',
        'First love and relationship exploration acceptable',
        'Can tackle serious issues with care'
      ],
      avoid: [
        'Gratuitously explicit sexual content',
        'Excessive gore without purpose',
        'Nihilistic endings without redemption'
      ],
      themes: ['identity', 'first love', 'independence', 'rebellion', 'finding oneself', 'justice']
    }
  }

  // New Adult (ages 18-25)
  if (audienceLower.includes('new adult') || audienceLower.includes('na')) {
    return {
      description: 'New Adult (ages 18-25)',
      contentGuidelines: [
        'Post-adolescent challenges and transitions',
        'Protagonist typically aged 18-25',
        'Romantic and sexual content acceptable',
        'Career and life direction themes'
      ],
      avoid: [
        'Content that feels too juvenile',
        'Oversimplified life situations'
      ],
      themes: ['transition', 'independence', 'career', 'relationships', 'self-discovery', 'adulting']
    }
  }

  // Adult
  if (audienceLower.includes('adult') && !audienceLower.includes('young') && !audienceLower.includes('new')) {
    return {
      description: 'Adult (18+)',
      contentGuidelines: [
        'Full range of mature themes acceptable',
        'Complex moral situations',
        'Nuanced character relationships',
        'No content restrictions beyond legal limits'
      ],
      avoid: [],
      themes: ['mortality', 'legacy', 'complex relationships', 'moral ambiguity', 'redemption', 'loss']
    }
  }

  // Children's (ages 5-8)
  if (audienceLower.includes('children') || audienceLower.includes('kids') || audienceLower.includes('chapter book')) {
    return {
      description: "Children's (ages 5-8)",
      contentGuidelines: [
        'Simple, clear language',
        'Short chapters and sentences',
        'Positive, reassuring themes',
        'Protagonist typically aged 6-9'
      ],
      avoid: [
        'Any scary or violent content',
        'Death of main characters',
        'Complex emotional situations',
        'Morally ambiguous situations'
      ],
      themes: ['friendship', 'kindness', 'sharing', 'bravery', 'family', 'imagination']
    }
  }

  // Default - General Audience
  return {
    description: 'General Audience',
    contentGuidelines: [
      'Accessible to a broad readership',
      'Avoid extreme content',
      'Balance complexity with accessibility'
    ],
    avoid: [
      'Excessively graphic content',
      'Highly polarizing themes'
    ],
    themes: ['universal human experiences', 'relationships', 'growth', 'challenges']
  }
}

/**
 * Get setting-appropriate vocabulary and elements
 */
export function getSettingElements(setting: string): SettingElements {
  const settingLower = (setting || '').toLowerCase()

  // Medieval Fantasy
  if (settingLower.includes('medieval') || settingLower.includes('fantasy') || settingLower.includes('sword')) {
    return {
      elements: ['castle', 'kingdom', 'sword', 'magic', 'forest', 'tavern', 'knight', 'dragon', 'throne'],
      vocabulary: ['thou', 'thy', 'hath', 'ere', 'whilst', 'methinks', 'forsooth', 'mayhap'],
      avoid: ['phone', 'computer', 'car', 'electricity', 'internet', 'technology', 'modern']
    }
  }

  // Sci-Fi / Space
  if (settingLower.includes('sci-fi') || settingLower.includes('space') || settingLower.includes('future')) {
    return {
      elements: ['starship', 'planet', 'galaxy', 'warp', 'laser', 'android', 'space station', 'hyperspace'],
      vocabulary: ['quantum', 'neural', 'cyber', 'nano', 'holographic', 'synthetic', 'orbital'],
      avoid: ['horse', 'carriage', 'candle', 'parchment', 'medieval']
    }
  }

  // Victorian / Steampunk
  if (settingLower.includes('victorian') || settingLower.includes('steampunk') || settingLower.includes('19th')) {
    return {
      elements: ['steam engine', 'clockwork', 'gaslight', 'manor', 'airship', 'brass', 'gears', 'fog'],
      vocabulary: ['jolly good', 'indeed', 'splendid', 'frightfully', 'terribly', 'most'],
      avoid: ['smartphone', 'internet', 'television', 'microwave', 'plastic']
    }
  }

  // Modern / Contemporary
  if (settingLower.includes('modern') || settingLower.includes('contemporary') || settingLower.includes('present')) {
    return {
      elements: ['smartphone', 'city', 'office', 'apartment', 'internet', 'car', 'cafe'],
      vocabulary: ['text', 'online', 'social media', 'trending', 'digital'],
      avoid: []
    }
  }

  // Default - return empty to not constrain
  return { elements: [], vocabulary: [], avoid: [] }
}
