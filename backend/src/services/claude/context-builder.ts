// Build context string from project data for AI generation
export function buildContext(context: Record<string, any>): string {
  const parts: string[] = []

  if (context.specification) {
    const spec = context.specification
    parts.push(`## Novel Specification
- Title: ${spec.workingTitle || 'Untitled'}
- Genre: ${spec.genre?.join(', ') || 'Not specified'}
- Subgenre: ${spec.subgenre?.join(', ') || 'Not specified'}
- Target Audience: ${spec.targetAudience || 'Adult'}
- POV: ${spec.pov || 'Third Limited'}
- Tense: ${spec.tense || 'Past'}
- Tone: ${spec.tone || 'Not specified'}
- Themes: ${spec.themes?.join(', ') || 'Not specified'}
- Word Count Target: ${spec.targetWordCount || 80000}`)
  }

  if (context.characters && context.characters.length > 0) {
    parts.push(`\n## Characters`)
    for (const char of context.characters) {
      parts.push(`### ${char.name} (${char.role || 'Supporting'})
- Age: ${char.age || 'Unknown'}
- Description: ${char.physicalDescription || 'Not described'}
- Personality: ${char.personality?.join(', ') || 'Not specified'}
- Speech Patterns: ${char.speechPatterns || 'Standard'}
- Vocabulary Level: ${char.vocabularyLevel || 'Average'}`)
    }
  }

  if (context.plotBeats && context.plotBeats.length > 0) {
    parts.push(`\n## Plot Beats`)
    for (const beat of context.plotBeats) {
      parts.push(`- ${beat.title}: ${beat.summary || ''}`)
    }
  }

  if (context.scenes && context.scenes.length > 0) {
    parts.push(`\n## Scenes`)
    for (const scene of context.scenes) {
      parts.push(`- ${scene.title}: ${scene.description || ''}`)
    }
  }

  // Story Memory Context
  if (context.storyMemory?.relevantSummaries && context.storyMemory.relevantSummaries.length > 0) {
    parts.push(`\n## Story Memory - Previous Chapter Summaries`)
    for (const summary of context.storyMemory.relevantSummaries) {
      parts.push(`### Chapter ${summary.chapterNumber}${summary.cliffhanger ? ' (ends with cliffhanger)' : ''}
${summary.summary}
- Key events: ${summary.keyEvents?.map((e: any) => typeof e === 'string' ? e : e.event).join('; ') || 'None'}
- Characters present: ${summary.charactersPresent?.join(', ') || 'None'}`)
    }
  }

  if (context.storyMemory?.relevantCharacterStates && context.storyMemory.relevantCharacterStates.length > 0) {
    parts.push(`\n## Character Knowledge States (what characters know/believe)`)
    for (const state of context.storyMemory.relevantCharacterStates) {
      const charName = context.characters?.find((c: any) => c.id === state.characterId)?.name || 'Unknown'
      parts.push(`### ${charName} (as of Chapter ${state.asOfChapterNumber})
- Knows: ${state.knownFacts?.slice(0, 5).join('; ') || 'Nothing tracked'}
- Believes: ${state.beliefs?.slice(0, 3).join('; ') || 'No beliefs tracked'}
- Current goals: ${state.activeGoals?.join('; ') || 'None'}
- Emotional state: ${state.emotionalState || 'Unknown'}`)
    }
  }

  if (context.storyMemory?.relevantFacts && context.storyMemory.relevantFacts.length > 0) {
    parts.push(`\n## Established Facts (maintain these for continuity)`)
    const factsBySubject: Record<string, string[]> = {}
    for (const fact of context.storyMemory.relevantFacts) {
      if (!factsBySubject[fact.subjectId]) {
        factsBySubject[fact.subjectId] = []
      }
      factsBySubject[fact.subjectId].push(fact.assertion)
    }
    for (const [subject, assertions] of Object.entries(factsBySubject)) {
      parts.push(`- ${subject}: ${assertions.join('; ')}`)
    }
  }

  if (context.storyMemory?.activeSubplots && context.storyMemory.activeSubplots.length > 0) {
    parts.push(`\n## Active Subplots (consider weaving these in)`)
    for (const subplot of context.storyMemory.activeSubplots) {
      parts.push(`- ${subplot.name} (${subplot.status}): ${subplot.description || 'No description'}`)
    }
  }

  if (context.storyMemory?.openQuestions && context.storyMemory.openQuestions.length > 0) {
    parts.push(`\n## Reader's Open Questions (maintain these mysteries)
${context.storyMemory.openQuestions.map((q: string) => `- ${q}`).join('\n')}`)
  }

  if (context.storyMemory?.unresolvedSetups && context.storyMemory.unresolvedSetups.length > 0) {
    parts.push(`\n## Foreshadowing/Setups (consider paying off)
${context.storyMemory.unresolvedSetups.map((s: string) => `- ${s}`).join('\n')}`)
  }

  if (context.storyMemory?.povCharacterConstraints) {
    const constraints = context.storyMemory.povCharacterConstraints
    parts.push(`\n## POV Character Constraints`)
    if (constraints.cannotKnow?.length > 0) {
      parts.push(`CANNOT reference (character doesn't know): ${constraints.cannotKnow.join('; ')}`)
    }
    if (constraints.mustRemember?.length > 0) {
      parts.push(`Should remember: ${constraints.mustRemember.join('; ')}`)
    }
    if (constraints.emotionalState) {
      parts.push(`Current emotional context: ${constraints.emotionalState}`)
    }
  }

  if (context.previousContent) {
    parts.push(`\n## Previous Content
${context.previousContent}`)
  }

  if (context.selectedText) {
    parts.push(`\n## Selected Text
${context.selectedText}`)
  }

  if (context.currentChapter) {
    parts.push(`\n## Current Chapter Content
${context.currentChapter}`)
  }

  return parts.join('\n')
}
