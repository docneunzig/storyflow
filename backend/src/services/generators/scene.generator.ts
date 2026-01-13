/**
 * Scene Generator Module
 * Handles scene-related AI generation functions
 */

import { getSettingElements, getAudienceGuidelines } from '../utilities/prose-helpers.js'

export interface SceneContext {
  location?: string
  setting?: string
  worldSetting?: string
  audience?: string
  targetAudience?: string
  selectedText?: string
  specification?: {
    tone?: string
    tense?: string
    pov?: string
    targetAudience?: string
  }
  characters?: Array<{ id?: string; name?: string }>
  scene?: {
    openingEmotion?: string
    closingEmotion?: string
    timeInStory?: string
    weatherAtmosphere?: string
    detailedOutline?: string
    summary?: string
    conflictType?: string
    conflictDescription?: string
    sceneGoal?: string
    pacing?: string
    tone?: string
  }
  povCharacter?: { name?: string }
  charactersPresent?: Array<{ name?: string }>
}

/**
 * Generate sample scene content based on location and setting
 */
export function generateSampleSceneContent(context: SceneContext): string {
  const location = context.location || 'an unknown location'
  const setting = context.setting || context.worldSetting || ''
  const audience = context.audience || context.targetAudience || ''
  const settingElements = getSettingElements(setting)
  const audienceGuidelines = getAudienceGuidelines(audience)

  let sceneContent = `The scene unfolds at ${location}.\n\n`
  sceneContent += `[Target Audience: ${audienceGuidelines.description}]\n\n`

  // Add setting-appropriate atmosphere
  if (settingElements.elements.length > 0) {
    const element = settingElements.elements[Math.floor(Math.random() * settingElements.elements.length)]
    sceneContent += `The atmosphere is rich with the presence of ${element} and other elements of this ${setting || 'story'} world.\n\n`
  }

  sceneContent += `Characters interact and events transpire, moving the story forward. The atmosphere is palpable as tensions rise and fall.\n\n`

  if (settingElements.avoid.length > 0) {
    sceneContent += `[Setting-compliant: Avoiding modern anachronisms]\n`
  }

  // Add audience guidelines
  if (audienceGuidelines.avoid.length > 0) {
    sceneContent += `[Audience-appropriate: Content avoids ${audienceGuidelines.avoid.slice(0, 2).join(', ')}]\n`
  }

  sceneContent += `[Recommended themes: ${audienceGuidelines.themes.slice(0, 3).join(', ')}]\n`

  sceneContent += `\nThis is AI-generated sample content for the scene generation feature.`

  return sceneContent
}

/**
 * Generate prose from a scene outline
 */
export function generateSceneProse(context: SceneContext): string {
  const scene = context.scene || {}
  const povCharacter = context.povCharacter || {}
  const charactersPresent = context.charactersPresent || []
  const spec = context.specification || {}

  const pov = spec.pov || 'Third Person Limited'
  const tense = spec.tense || 'Past'
  const isFirstPerson = pov.toLowerCase().includes('first')
  const isPresentTense = tense.toLowerCase().includes('present')

  // Build character names for dialogue
  const povName = povCharacter.name || 'the protagonist'
  const otherCharacters = charactersPresent.map((c) => c.name).filter(Boolean)

  // Build the prose
  let prose = ''

  // Opening based on opening emotion
  const openingEmotions: Record<string, string> = {
    'tense anticipation': `The air ${isPresentTense ? 'crackles' : 'crackled'} with tension as ${isFirstPerson ? 'I' : povName} ${isPresentTense ? 'enters' : 'entered'} the space.`,
    'curious determination': `Something ${isPresentTense ? 'stirs' : 'stirred'} in ${isFirstPerson ? 'my' : 'their'} chest—a hunger to understand, to know.`,
    'guarded vulnerability': `${isFirstPerson ? 'I keep' : povName + ' kept'} ${isFirstPerson ? 'my' : 'their'} guard up, though beneath it, something fragile ${isPresentTense ? 'waits' : 'waited'}.`,
    'shocked revelation': `The truth ${isPresentTense ? 'hits' : 'hit'} like a physical blow.`,
    'hopeful connection': `For the first time in what ${isPresentTense ? 'feels' : 'felt'} like forever, something like hope ${isPresentTense ? 'begins' : 'began'} to bloom.`,
  }

  const openingEmotion = scene.openingEmotion?.toLowerCase() || ''
  prose += openingEmotions[openingEmotion] || `The scene ${isPresentTense ? 'unfolds' : 'unfolded'} with ${scene.openingEmotion || 'quiet intensity'}.`
  prose += '\n\n'

  // Time and atmosphere
  if (scene.timeInStory) {
    prose += `${scene.timeInStory}. `
  }
  if (scene.weatherAtmosphere) {
    prose += `${scene.weatherAtmosphere} `
  }
  prose += '\n\n'

  // Main content from summary or outline
  if (scene.detailedOutline) {
    prose += scene.detailedOutline + '\n\n'
  } else if (scene.summary) {
    // Expand summary into prose
    prose += `${scene.summary}\n\n`

    // Add some dialogue if there are characters present
    if (otherCharacters.length > 0) {
      const otherChar = otherCharacters[0]
      prose += `"${isFirstPerson ? 'I' : povName} ${isPresentTense ? 'need' : 'needed'} to understand," ${isFirstPerson ? 'I say' : povName + ' said'}, the words carrying more weight than ${isFirstPerson ? 'I' : 'they'} ${isPresentTense ? 'intend' : 'intended'}.\n\n`
      prose += `${otherChar} ${isPresentTense ? 'pauses' : 'paused'}, something shifting behind ${otherChar}'s eyes. "And what makes you think you're ready for that?"\n\n`
    }
  }

  // Conflict development
  if (scene.conflictType) {
    prose += `The ${scene.conflictType.toLowerCase()} conflict ${isPresentTense ? 'intensifies' : 'intensified'}, `
    if (scene.conflictDescription) {
      prose += `as ${scene.conflictDescription.toLowerCase()}\n\n`
    } else {
      prose += `pressing in from all sides.\n\n`
    }
  }

  // Scene goal progression
  if (scene.sceneGoal) {
    prose += `Every moment ${isPresentTense ? 'brings' : 'brought'} ${isFirstPerson ? 'me' : 'them'} closer to what ${isPresentTense ? 'matters' : 'mattered'} most: ${scene.sceneGoal.toLowerCase()}.\n\n`
  }

  // Pacing-appropriate action
  if (scene.pacing === 'Fast' || scene.pacing === 'Intense') {
    prose += `Events ${isPresentTense ? 'cascade' : 'cascaded'} forward with breathless momentum. There ${isPresentTense ? 'is' : 'was'} no time for hesitation, no room for doubt.\n\n`
  } else if (scene.pacing === 'Slow') {
    prose += `Time ${isPresentTense ? 'stretches' : 'stretched'} like honey, each moment given space to breathe, to be felt.\n\n`
  }

  // Closing based on closing emotion
  const closingEmotions: Record<string, string> = {
    'shocked revelation': `And then ${isFirstPerson ? 'I understand' : 'understanding dawned'}—a truth that ${isPresentTense ? 'changes' : 'changed'} everything.`,
    'unsettled realization': `Something ${isPresentTense ? "doesn't" : "didn't"} feel right. The implications ${isPresentTense ? 'settle' : 'settled'} into ${isFirstPerson ? 'my' : 'their'} bones like a chill.`,
    'hopeful connection': `For the first time, something like hope ${isPresentTense ? 'feels' : 'felt'} possible.`,
    'tense anticipation': `This ${isPresentTense ? "isn't" : "wasn't"} over. Not even close.`,
    'satisfied resolution': `It ${isPresentTense ? 'is' : 'was'} enough. For now.`,
  }

  const closingEmotion = scene.closingEmotion?.toLowerCase() || ''
  prose += '\n' + (closingEmotions[closingEmotion] || `The scene ${isPresentTense ? 'concludes' : 'concluded'} with ${scene.closingEmotion || 'quiet resolution'}.`)

  // Add tone marker
  if (scene.tone) {
    prose += `\n\n[Tone: ${scene.tone}]`
  }

  return prose
}

/**
 * Expand selected text with more detail
 */
export function expandSelection(context: SceneContext): string {
  const selectedText = context.selectedText || ''
  const spec = context.specification || {}
  const characters = context.characters || []

  // Simulate expanding the text with more detail
  const expanded = `${selectedText}

The moment stretched, each second laden with unspoken meaning. ${
    characters.length > 0
      ? `${characters[0].name || 'The protagonist'} felt the weight of the decision pressing down upon them.`
      : 'The weight of the decision pressed down upon all present.'
  }

The air itself seemed to thicken, charged with anticipation. Every detail came into sharp focus—the subtle shift of shadows, the distant echo of sounds, the way time itself seemed to hold its breath.

${spec.tone ? `The ${spec.tone.toLowerCase()} atmosphere deepened.` : 'The atmosphere intensified.'}`

  return expanded
}

/**
 * Condense selected text to be more concise
 */
export function condenseSelection(context: SceneContext): string {
  const selectedText = context.selectedText || ''

  // Simulate condensing - in production, AI would intelligently summarize
  const words = selectedText.split(/\s+/)
  if (words.length <= 10) {
    return selectedText // Already short
  }

  // Simulate a condensed version (roughly 50% of original)
  const targetLength = Math.max(10, Math.floor(words.length * 0.5))
  const condensed = words.slice(0, targetLength).join(' ') + '...'

  return `${condensed.replace('...', '')}. The moment passed, leaving its mark.`
}

/**
 * Rewrite selected text with different phrasing
 */
export function rewriteSelection(context: SceneContext): string {
  const selectedText = context.selectedText || ''
  const spec = context.specification || {}

  // Simulate a rewrite with different phrasing
  const tense = spec.tense?.toLowerCase() || 'past'
  const isPresentTense = tense.includes('present')

  // Generate a rewritten version with different structure
  const sentences = selectedText.split(/[.!?]+/).filter((s: string) => s.trim())

  if (sentences.length === 0) return selectedText

  // Rewrite each sentence with variation
  const rewritten = sentences.map((sentence: string) => {
    const trimmed = sentence.trim()
    if (!trimmed) return ''

    // Add variety to sentence starts
    const starters = [
      isPresentTense ? 'Now, ' : 'Then, ',
      'In that moment, ',
      '',
      'Suddenly, ',
      '',
    ]
    const starter = starters[Math.floor(Math.random() * starters.length)]

    return `${starter}${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`
  }).filter(Boolean).join('. ')

  return rewritten + '.'
}

/**
 * Generate 3 alternative versions of selected text
 */
export function generateAlternatives(context: SceneContext): string {
  const selectedText = context.selectedText || ''

  // Generate 3 distinct alternatives
  const alternatives = [
    // Alternative 1: More dramatic
    `With a surge of emotion, the moment crystallized into something unforgettable. ${selectedText.split('.')[0]}—but with an intensity that left no one unchanged.`,

    // Alternative 2: More introspective
    `A quiet understanding settled over the scene. What had been said, what had happened—it all took on new meaning. ${selectedText.split('.')[0]}, though perhaps not in the way anyone expected.`,

    // Alternative 3: More action-oriented
    `There was no time to hesitate. ${selectedText.split('.')[0]}—and with that, everything shifted into motion, consequences rippling outward like waves.`,
  ]

  // Return as JSON array
  return JSON.stringify(alternatives)
}
