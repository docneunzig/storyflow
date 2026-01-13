/**
 * Chapter Generator Module
 * Handles chapter-related AI generation functions
 */

import {
  getSettingElements,
  getPOVProse,
  getTenseProse,
  getAudienceGuidelines,
} from '../utilities/prose-helpers.js'

export interface ChapterContext {
  title?: string
  synopsis?: string
  specification?: {
    settingType?: string[]
    pov?: string
    tense?: string
    targetAudience?: string
    themes?: string[]
    tone?: string
  }
  setting?: string
  worldSetting?: string
  pov?: string
  pointOfView?: string
  tense?: string
  narrativeTense?: string
  audience?: string
  targetAudience?: string
  themes?: string[]
  tone?: string
  characters?:
    | Array<{ id?: string; name?: string }>
    | { main?: Array<{ name?: string }>; supporting?: Array<{ name?: string }> }
  plotBeats?: Array<{ title?: string; summary?: string }>
  previousChapters?: Array<{ number?: number; title?: string; summary?: string }>
  wikiContext?: Array<{ name?: string; category?: string; description?: string }>
  chapterTitle?: string
  chapterNumber?: number
  scenes?: Array<{
    id?: string
    povCharacterId?: string
    summary?: string
    detailedOutline?: string
    conflictType?: string
    tone?: string
  }>
  previousChapterContent?: string
  currentContent?: string
}

/**
 * Generate sample chapter content with settings and guidelines
 */
export function generateSampleChapterContent(context: ChapterContext): string {
  const title = context.title || 'Untitled Chapter'
  const synopsis = context.synopsis || 'A new chapter begins.'

  // Extract settings from full specification if available
  const spec = context.specification || {}
  const setting = context.setting || context.worldSetting || spec.settingType?.join(', ') || ''
  const pov = context.pov || context.pointOfView || spec.pov || ''
  const tense = context.tense || context.narrativeTense || spec.tense || 'past'
  const audience = context.audience || context.targetAudience || spec.targetAudience || ''
  const themes = spec.themes || context.themes || []
  const tone = spec.tone || context.tone || ''

  // Get character names for reference
  // Handle both array format and object format { main: [...], supporting: [...] }
  let charactersArray: Array<{ name?: string }> = []
  if (Array.isArray(context.characters)) {
    charactersArray = context.characters
  } else if (context.characters && typeof context.characters === 'object') {
    // Combine main and supporting characters from object format
    charactersArray = [
      ...(context.characters.main || []),
      ...(context.characters.supporting || []),
    ]
  }
  const characterNames = charactersArray.map((c) => c.name).filter(Boolean)

  // Get plot beats for reference
  const plotBeats = context.plotBeats || []

  // Get previous chapter summaries for continuity
  const previousChapters = context.previousChapters || []

  // Get world-building context
  const wikiContext = context.wikiContext || []

  const settingElements = getSettingElements(setting)
  const povProse = getPOVProse(pov)
  const tenseProse = getTenseProse(tense, pov)
  const audienceGuidelines = getAudienceGuidelines(audience)

  let chapterContent = `Chapter: ${title}\n\n`
  chapterContent += `[Setting: ${setting || 'Not specified'}]\n`
  chapterContent += `[POV: ${povProse.description}]\n`
  chapterContent += `[Tense: ${tenseProse.description}]\n`
  chapterContent += `[Target Audience: ${audienceGuidelines.description}]\n\n`
  chapterContent += `${synopsis}\n\n`

  // Include POV and tense-appropriate sample narration
  chapterContent += `--- Sample Narrative (${povProse.description}, ${tenseProse.description}) ---\n\n`
  chapterContent += `${tenseProse.sampleNarration}\n\n`
  chapterContent += `--- End Sample ---\n\n`

  // Include setting-appropriate prose
  if (settingElements.elements.length > 0) {
    const randomElements = settingElements.elements.slice(0, 3).join(', ')
    chapterContent += `The story unfolds amidst ${randomElements} and other elements characteristic of this setting.\n\n`
  }

  chapterContent += `The narrative continues with developments and revelations appropriate to the ${setting || 'story'} setting, maintaining consistent ${povProse.description} perspective throughout.\n\n`

  // Note about setting compliance
  if (settingElements.avoid.length > 0) {
    chapterContent += `[Note: Generated content avoids anachronistic elements like: ${settingElements.avoid.join(', ')}]\n\n`
  }

  // Audience-specific content guidelines
  chapterContent += `--- Target Audience: ${audienceGuidelines.description} ---\n\n`
  chapterContent += `Content Guidelines:\n`
  audienceGuidelines.contentGuidelines.forEach((guideline) => {
    chapterContent += `• ${guideline}\n`
  })
  chapterContent += `\n`

  if (audienceGuidelines.avoid.length > 0) {
    chapterContent += `Content to Avoid:\n`
    audienceGuidelines.avoid.forEach((item) => {
      chapterContent += `• ${item}\n`
    })
    chapterContent += `\n`
  }

  chapterContent += `Recommended Themes for ${audienceGuidelines.description}:\n`
  chapterContent += `${audienceGuidelines.themes.join(', ')}\n\n`

  // Add character references if available
  if (characterNames.length > 0) {
    chapterContent += `--- Characters Referenced ---\n`
    chapterContent += `The following characters are available for this chapter:\n`
    characterNames.slice(0, 8).forEach((name) => {
      chapterContent += `• ${name}\n`
    })
    if (characterNames.length > 8) {
      chapterContent += `• ...and ${characterNames.length - 8} more\n`
    }
    chapterContent += `\n`
  }

  // Add plot beat references if available
  if (plotBeats.length > 0) {
    chapterContent += `--- Plot Beats for Context ---\n`
    chapterContent += `Current story arc includes:\n`
    plotBeats.slice(0, 5).forEach((beat) => {
      chapterContent += `• ${beat.title}: ${beat.summary?.substring(0, 80) || 'No summary'}${beat.summary && beat.summary.length > 80 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add previous chapter context for continuity
  if (previousChapters.length > 0) {
    chapterContent += `--- Previous Chapters (for continuity) ---\n`
    previousChapters.forEach((ch) => {
      chapterContent += `• Chapter ${ch.number}: "${ch.title}" - ${ch.summary?.substring(0, 100) || 'No summary'}${ch.summary && ch.summary.length > 100 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add world-building context if available
  if (wikiContext.length > 0) {
    chapterContent += `--- World-Building Reference ---\n`
    wikiContext.slice(0, 5).forEach((w) => {
      chapterContent += `• ${w.name} (${w.category}): ${w.description?.substring(0, 60) || ''}${w.description && w.description.length > 60 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add themes if specified
  if (themes.length > 0) {
    chapterContent += `--- Story Themes ---\n`
    chapterContent += `This story explores: ${themes.join(', ')}\n\n`
  }

  // Add tone if specified
  if (tone) {
    chapterContent += `[Tone: ${tone}]\n\n`
  }

  chapterContent += `The chapter would include:\n`
  chapterContent += `- Narrative written in ${povProse.description}\n`
  chapterContent += `- Scene descriptions and atmosphere consistent with ${setting || 'the story'} setting\n`
  chapterContent += `- Character dialogue and interactions appropriate for ${audienceGuidelines.description}\n`
  chapterContent += `- Plot advancement aligned with story beats\n`
  chapterContent += `- Thematic elements (${themes.length > 0 ? themes.slice(0, 3).join(', ') : 'general themes'}) woven naturally\n`
  chapterContent += `- Continuity with previous chapter events\n\n`
  chapterContent += `[End of generated sample content]`

  return chapterContent
}

/**
 * Continue writing from current content
 */
export function continueWriting(context: ChapterContext): string {
  const currentContent = context.currentContent || ''
  const characters = Array.isArray(context.characters) ? context.characters : []
  const scenes = context.scenes || []

  // Get character names for use in continuation
  const characterNames = characters.map((c) => c.name).filter(Boolean)
  const mainCharacter = characterNames[0] || 'the protagonist'

  // Generate continuation
  let continuation = ''

  if (scenes.length > 0) {
    // If there are scene outlines, use them to guide continuation
    const currentScene = scenes[0]
    continuation = `The story continues as ${mainCharacter} navigates the challenges ahead.

${currentScene.summary ? `${currentScene.summary.split('.')[0]}. ` : ''}The path forward was uncertain, but there was no turning back now.

"We need to move," ${mainCharacter} said, the words carrying more weight than their simplicity suggested.

The others exchanged glances, a silent acknowledgment passing between them. Whatever came next, they would face it together.`
  } else {
    // Generic continuation
    continuation = `The moment stretched between heartbeats, pregnant with possibility.

${mainCharacter} took a breath, steadying themselves against what was to come. The world around them seemed to wait, patient and expectant.

"There's something you should know," they began, the words falling into the silence like stones into still water.

The response came not in words, but in the subtle shift of the air itself—an acknowledgment that nothing would be quite the same after this.`
  }

  return continuation
}

/**
 * Generate a complete chapter draft from scene outlines
 */
export function generateChapterDraft(context: ChapterContext): string {
  const chapterTitle = context.chapterTitle || 'Untitled Chapter'
  const chapterNumber = context.chapterNumber || 1
  const spec = context.specification || {}
  const scenes = context.scenes || []
  const characters = Array.isArray(context.characters) ? context.characters : []
  const previousChapterContent = context.previousChapterContent || ''

  const pov = spec.pov || 'Third Person Limited'
  const tense = spec.tense || 'Past'
  const audience = spec.targetAudience || 'Adult'

  // Build the chapter draft
  let draft = `# Chapter ${chapterNumber}: ${chapterTitle}\n\n`

  // Opening hook
  if (previousChapterContent) {
    draft += `The echoes of what had come before still lingered in the air as ${chapterTitle.toLowerCase()} began.\n\n`
  }

  // Generate content for each scene
  if (scenes.length > 0) {
    scenes.forEach((scene, index) => {
      const povCharacter = characters.find((c) => c.id === scene.povCharacterId)
      const povName = povCharacter?.name || 'the protagonist'

      // Scene header (optional, can be removed)
      draft += `---\n\n`

      // Scene content based on outline
      if (scene.detailedOutline) {
        draft += `${scene.detailedOutline}\n\n`
      } else if (scene.summary) {
        // Expand summary into prose
        draft += `${povName} found themselves at a crossroads. ${scene.summary}\n\n`
        draft += `The weight of the moment pressed in from all sides. There would be no easy answers, no simple solutions to what lay ahead.\n\n`
      }

      // Add scene-specific elements based on metadata
      if (scene.conflictType) {
        draft += `The ${scene.conflictType.toLowerCase()} tension filled the space between them, unspoken but undeniable.\n\n`
      }

      if (scene.tone) {
        draft += `The ${scene.tone.toLowerCase()} atmosphere colored everything that followed.\n\n`
      }

      // Transition to next scene (except for last scene)
      if (index < scenes.length - 1) {
        draft += `And as one moment ended, another was already beginning...\n\n`
      }
    })
  } else {
    // No scenes - generate a basic chapter structure
    draft += `[No scene outlines provided - generating basic chapter structure]\n\n`
    draft += `The chapter begins with an establishing moment, grounding the reader in time and place.\n\n`
    draft += `Rising action builds through the middle portion, with characters making choices that will have consequences.\n\n`
    draft += `The chapter concludes with a hook that propels the reader forward, eager to discover what comes next.\n\n`
  }

  // Chapter closing
  draft += `---\n\n`
  draft += `[Draft generated with ${pov}, ${tense} tense, targeting ${audience} readers]\n`
  draft += `[Word count: ~${draft.split(/\s+/).length} words - expand scenes for full chapter]`

  return draft
}
