/**
 * Character Generator Module
 * Handles character-related AI generation functions
 */

export interface CharacterContext {
  name?: string
  character?: {
    name?: string
    speechPatterns?: string
    vocabularyLevel?: string
    catchphrases?: string[]
    internalVoice?: string
    role?: string
    backstory?: string
    arc?: string
    flaw?: string
    motivation?: string
    voiceProfile?: {
      vocabularyLevel?: string
      speechPatterns?: string
    }
  }
  character1?: {
    name?: string
    role?: string
    voiceProfile?: {
      vocabularyLevel?: string
      speechPatterns?: string
    }
  }
  character2?: {
    name?: string
    role?: string
    voiceProfile?: {
      vocabularyLevel?: string
      speechPatterns?: string
    }
  }
  specification?: Record<string, unknown>
}

/**
 * Generate basic character profile content
 */
export function generateSampleCharacterContent(context: CharacterContext): string {
  const name = context.name || 'New Character'

  return `Character Profile: ${name}

A complex character with depth and motivation. Their backstory weaves into the larger narrative, creating connections and conflicts with other characters.

This is AI-generated sample content for the character generation feature.`
}

/**
 * Generate a complete character profile with all fields
 */
export function generateCharacterProfile(context: CharacterContext): string {
  const spec = context.specification as {
    genre?: string[]
    themes?: string[]
    setting?: { timePeriod?: string; location?: string }
  } | undefined

  const genre = spec?.genre?.[0] || 'general fiction'
  const themes = spec?.themes || []
  const timePeriod = spec?.setting?.timePeriod || 'contemporary'
  const location = spec?.setting?.location || ''

  // Generate contextual character based on genre and themes
  const archetypes = ['Reluctant Hero', 'Anti-Hero', 'Mastermind', 'Tragic Hero', 'Morally Gray']
  const archetype = archetypes[Math.floor(Math.random() * archetypes.length)]

  const genderOptions = ['Female', 'Male', 'Non-binary']
  const gender = genderOptions[Math.floor(Math.random() * genderOptions.length)]

  const age = 25 + Math.floor(Math.random() * 30) // 25-54

  // Build character profile based on archetype
  let profile: Record<string, unknown> = {
    name: `Character ${Date.now().toString(36).slice(-4)}`,
    role: 'supporting',
    archetype,
    age,
    gender,
    status: 'alive',
  }

  // Add genre-specific elements
  if (genre.toLowerCase().includes('fantasy')) {
    profile = {
      ...profile,
      physicalDescription: 'Weathered features marked by years of travel across the realm, with eyes that hold secrets of ancient magic.',
      personalitySummary: 'A complex soul torn between duty to the old ways and desire for a new path.',
      strengths: ['Arcane knowledge', 'Resilience', 'Strategic thinking'],
      flaws: ['Haunted by past', 'Trust issues', 'Pride'],
      fears: ['Losing control of power', 'Failing those who depend on them'],
      desires: ['Redemption', 'Peace', 'Understanding'],
      needs: ['Acceptance', 'Purpose', 'Connection'],
      misbelief: 'Power always corrupts—including my own.',
      backstory: `Born during a time of great upheaval in ${location || 'the realm'}, they learned early that survival required both cunning and sacrifice. Their path has been marked by loss, but also by unexpected moments of connection.`,
      speechPatterns: 'Formal when guarded, more casual when trust is earned',
      vocabularyLevel: 'Academic',
      characterArc: 'From isolation to belonging',
      arcCatalyst: 'An unexpected alliance challenges their worldview',
    }
  } else if (genre.toLowerCase().includes('mystery') || genre.toLowerCase().includes('thriller')) {
    profile = {
      ...profile,
      physicalDescription: 'Sharp, observant eyes that miss nothing. An unassuming presence that allows them to blend into any crowd.',
      personalitySummary: 'Methodical and perceptive, with a dry wit that masks deeper emotional waters.',
      strengths: ['Deductive reasoning', 'Patience', 'Reading people'],
      flaws: ['Obsessive', 'Emotionally guarded', 'Difficulty with intimacy'],
      fears: ['Missing the crucial detail', 'The truth they might uncover'],
      desires: ['Justice', 'Answers', 'Closure'],
      needs: ['Validation', 'Trust', 'Peace'],
      misbelief: 'Everyone has something to hide—including me.',
      backstory: `A defining case—or crime—shaped their worldview. Since then, they have dedicated themselves to uncovering truths others want buried.`,
      speechPatterns: 'Precise, asks probing questions, rarely volunteers information',
      vocabularyLevel: 'Sophisticated',
      characterArc: 'From detachment to engagement',
      arcCatalyst: 'A case that becomes personal',
    }
  } else if (genre.toLowerCase().includes('romance')) {
    profile = {
      ...profile,
      physicalDescription: 'A presence that commands attention without trying, with features softened by genuine warmth.',
      personalitySummary: 'Guarded heart, open mind. Someone who has loved and lost and is learning to try again.',
      strengths: ['Empathy', 'Loyalty', 'Emotional intelligence'],
      flaws: ['Fear of vulnerability', 'Past relationship baggage', 'Self-sabotage'],
      fears: ['Being hurt again', 'Not being enough', 'Losing independence'],
      desires: ['Real connection', 'To be truly known', 'Partnership'],
      needs: ['Security', 'Acceptance', 'Passion'],
      misbelief: 'Love means losing yourself.',
      backstory: `Past relationships taught them the high cost of opening up. They built walls that served them well—until they started to feel more like a prison.`,
      speechPatterns: 'Warm but deflects with humor when conversations get too personal',
      vocabularyLevel: 'Casual',
      characterArc: 'From guarded to vulnerable',
      arcCatalyst: 'Someone who refuses to give up on them',
    }
  } else {
    // General fiction
    profile = {
      ...profile,
      physicalDescription: 'Carries themselves with a quiet confidence, though observant eyes might catch the tension in their shoulders.',
      personalitySummary: 'A study in contradictions: strong yet vulnerable, certain yet searching.',
      strengths: ['Determination', 'Adaptability', 'Hidden depth'],
      flaws: ['Stubbornness', 'Difficulty asking for help', 'Avoidance'],
      fears: ['Failure', 'Abandonment', 'The past repeating'],
      desires: ['Belonging', 'Success on their terms', 'Peace'],
      needs: ['Recognition', 'Stability', 'Self-acceptance'],
      misbelief: 'I have to handle everything alone.',
      backstory: `Life taught them self-reliance the hard way. Now they must learn that strength sometimes means letting others in.`,
      speechPatterns: 'Direct, occasionally verbose when passionate about something',
      vocabularyLevel: 'Standard',
      characterArc: 'From isolation to community',
      arcCatalyst: 'Circumstances that require them to rely on others',
    }
  }

  // Add theme-related elements
  if (themes.includes('Redemption') || themes.includes('redemption')) {
    profile.misbelief = 'Some mistakes can never be forgiven—especially mine.'
    profile.characterArc = 'From guilt to self-forgiveness'
  }
  if (themes.includes('Identity') || themes.includes('identity')) {
    profile.misbelief = "I don't know who I really am."
    profile.characterArc = 'From confusion to self-discovery'
  }

  return JSON.stringify(profile)
}

/**
 * Generate character dialogue using their voice specifications
 */
export function generateCharacterDialogue(context: CharacterContext): string {
  const character = context.character || {}
  const name = character.name || 'Character'
  const speechPatterns = character.speechPatterns || ''
  const vocabularyLevel = character.vocabularyLevel || 'standard'
  const catchphrases = character.catchphrases || []
  const internalVoice = character.internalVoice || ''

  // Generate dialogue that reflects character voice
  let dialogueStyle = ''
  let vocabulary = ''
  let phrases = ''

  // Apply vocabulary level
  switch (vocabularyLevel.toLowerCase()) {
    case 'formal':
    case 'academic':
    case 'sophisticated':
      vocabulary = 'utilizing sophisticated vocabulary and precise terminology'
      dialogueStyle = 'Speaking with measured eloquence, '
      break
    case 'casual':
    case 'colloquial':
    case 'informal':
      vocabulary = 'using everyday language and relaxed expressions'
      dialogueStyle = 'Speaking casually, '
      break
    case 'street':
    case 'slang':
      vocabulary = 'using slang and street vernacular'
      dialogueStyle = 'Speaking in a street-smart way, '
      break
    default:
      vocabulary = 'using standard vocabulary'
      dialogueStyle = ''
  }

  // Include catchphrases if available
  if (catchphrases.length > 0) {
    phrases = `\nCharacteristic phrases: "${catchphrases.slice(0, 2).join('", "')}"`
  }

  // Build the dialogue output
  let dialogue = `[${name}'s dialogue - ${vocabulary}]${phrases}\n\n`

  if (speechPatterns) {
    dialogue += `Speech pattern note: ${speechPatterns}\n\n`
  }

  dialogue += `${dialogueStyle}${name} speaks:\n\n`

  // Generate sample dialogue based on voice characteristics
  if (vocabularyLevel.toLowerCase().includes('formal') || vocabularyLevel.toLowerCase().includes('academic')) {
    dialogue += `"I must confess, the circumstances before us require considerable deliberation. It would be imprudent to proceed without careful analysis of the potential ramifications."\n\n`
    dialogue += `"Furthermore, I believe our approach should reflect the gravity of this situation. Shall we discuss the matter in greater detail?"`
  } else if (vocabularyLevel.toLowerCase().includes('casual') || vocabularyLevel.toLowerCase().includes('informal')) {
    dialogue += `"Look, here's the thing - we gotta figure this out, you know? It's not like we've got all day."\n\n`
    dialogue += `"So what do you say we just wing it and see what happens? Can't be worse than sitting around doing nothing, right?"`
  } else {
    dialogue += `"I think we should consider our options carefully. There's a lot at stake here."\n\n`
    dialogue += `"What's your take on all this? I'd like to hear your thoughts before we make a decision."`
  }

  if (internalVoice) {
    dialogue += `\n\n[Internal thought pattern: ${internalVoice}]`
  }

  return dialogue
}

/**
 * Add psychological depth to character profile
 */
export function deepenCharacter(context: CharacterContext): string {
  const character = context.character || {}

  const name = character.name || 'The character'
  const role = character.role || 'protagonist'
  const backstory = character.backstory || ''
  const flaw = character.flaw || ''
  const motivation = character.motivation || ''

  let deepened = backstory + '\n\n'

  // Add psychological depth sections
  deepened += `**Hidden Motivations:**\n`
  if (motivation) {
    deepened += `Beneath ${name}'s stated goal of ${motivation.toLowerCase()}, lies a deeper need: the desire to prove their own worth. This stems from early experiences that left them feeling fundamentally inadequate.\n\n`
  } else {
    deepened += `${name} carries an unspoken drive that even they may not fully recognize—a need for validation that shapes their choices in subtle but profound ways.\n\n`
  }

  deepened += `**Psychological Patterns:**\n`
  if (flaw) {
    deepened += `${name}'s ${flaw.toLowerCase()} is not merely a character trait but a defense mechanism, developed in response to past trauma. When under stress, they default to this pattern, often sabotaging the very things they care about most.\n\n`
  } else {
    deepened += `Under pressure, ${name} reveals patterns that hint at unresolved internal conflicts. These moments of vulnerability are when their true character emerges.\n\n`
  }

  deepened += `**Core Wound:**\n`
  deepened += `At the heart of ${name}'s psychology is a foundational belief: that they are somehow not enough. Every major decision can be traced back to this wound, which they either fight against or unconsciously fulfill.\n\n`

  deepened += `**Contradictions:**\n`
  if (role === 'protagonist') {
    deepened += `${name} presents a paradox: they long for connection yet push others away; they desire change but cling to familiar patterns; they seek the truth while being dishonest with themselves.`
  } else if (role === 'antagonist') {
    deepened += `${name} sees themselves as the hero of their own story. Their cruelty stems from conviction, their opposition from genuine belief in their own righteousness.`
  } else {
    deepened += `${name} contains multitudes—capable of great kindness and surprising coldness, driven by impulses they themselves don't fully understand.`
  }

  return deepened
}

/**
 * Generate dialogue/interaction between two characters
 */
export function generateCharacterInteraction(context: CharacterContext): string {
  const char1 = context.character1 || {}
  const char2 = context.character2 || {}

  const name1 = char1.name || 'Character One'
  const name2 = char2.name || 'Character Two'
  const voice1 = char1.voiceProfile || {}
  const voice2 = char2.voiceProfile || {}

  const vocab1 = voice1.vocabularyLevel?.toLowerCase() || 'standard'
  const vocab2 = voice2.vocabularyLevel?.toLowerCase() || 'standard'

  // Determine relationship dynamics
  const role1 = char1.role || 'supporting'
  const role2 = char2.role || 'supporting'

  let dynamicType = 'equals'
  if (role1 === 'protagonist' && role2 === 'antagonist') {
    dynamicType = 'conflict'
  } else if (role1 === 'antagonist' && role2 === 'protagonist') {
    dynamicType = 'conflict'
  } else if (role1 === 'mentor' || role2 === 'mentor') {
    dynamicType = 'guidance'
  }

  // Generate dialogue based on dynamics
  let dialogue = `**Scene: ${name1} and ${name2} in conversation**\n\n`

  if (dynamicType === 'conflict') {
    dialogue += `*The tension between them is palpable.*\n\n`
    dialogue += `**${name1}:** "You know this can't continue. Not the way you're going about it."\n\n`
    dialogue += `**${name2}:** *A cold smile.* "And yet, here we are. Again."\n\n`
    dialogue += `**${name1}:** "I'm trying to—"\n\n`
    dialogue += `**${name2}:** "I know what you're trying to do. The question is whether you understand what you're actually accomplishing."\n\n`
    dialogue += `*Silence stretches between them.*\n\n`
    dialogue += `**${name1}:** "There was a time when we wanted the same things."\n\n`
    dialogue += `**${name2}:** "There was a time when I believed what you believe. I grew past that."\n\n`
  } else if (dynamicType === 'guidance') {
    const mentor = role1 === 'mentor' ? name1 : name2
    const mentee = role1 === 'mentor' ? name2 : name1

    dialogue += `*A moment of teaching, of passing something down.*\n\n`
    dialogue += `**${mentor}:** "You're ready for this. Even if you don't believe it yet."\n\n`
    dialogue += `**${mentee}:** "How can you be so sure?"\n\n`
    dialogue += `**${mentor}:** *A knowing look.* "Because I see something in you that you haven't learned to see in yourself."\n\n`
    dialogue += `*A beat. The weight of those words settling.*\n\n`
    dialogue += `**${mentee}:** "What if I fail?"\n\n`
    dialogue += `**${mentor}:** "Then you'll learn. That's how this works."\n\n`
  } else {
    dialogue += `*A moment of connection between two people navigating the same storm.*\n\n`
    dialogue += `**${name1}:** "I've been thinking about what you said."\n\n`
    dialogue += `**${name2}:** "And?"\n\n`
    dialogue += `**${name1}:** "You were right. About most of it, anyway."\n\n`
    dialogue += `**${name2}:** *A slight smile.* "Only most of it?"\n\n`
    dialogue += `**${name1}:** "I'm not going to give you everything."\n\n`
    dialogue += `*They share a look—understanding passing between them without words.*\n\n`
    dialogue += `**${name2}:** "We're going to get through this."\n\n`
    dialogue += `**${name1}:** "Together?"\n\n`
    dialogue += `**${name2}:** "Together."\n\n`
  }

  // Add voice notes
  dialogue += `---\n\n`
  dialogue += `*Voice Notes:*\n`
  dialogue += `- ${name1}: ${vocab1} vocabulary${voice1.speechPatterns ? `, ${voice1.speechPatterns}` : ''}\n`
  dialogue += `- ${name2}: ${vocab2} vocabulary${voice2.speechPatterns ? `, ${voice2.speechPatterns}` : ''}\n`

  return dialogue
}
