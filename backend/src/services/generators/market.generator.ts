/**
 * Market Generator Module
 * Handles market analysis and publishing-related AI generation functions
 */

export interface MarketContext {
  specification?: {
    title?: string
    genre?: string[]
    targetWordCount?: number
    themes?: string[]
    tone?: string
    setting?: string
    logline?: string
  }
  characters?: Array<{
    name?: string
    role?: string
    backstory?: string
    motivation?: string
    flaw?: string
    arc?: string
  }>
  plot?: {
    selectedStructure?: string
    beats?: Array<{
      title?: string
      summary?: string
    }>
  }
  length?: 'elevator' | 'one-page' | 'two-page'
}

export interface ComparableTitle {
  title: string
  author: string
  similarity: string
  marketPerformance: string
}

/**
 * Generate a synopsis at various lengths
 */
export function generateSynopsis(context: MarketContext): string {
  const spec = context.specification || {}
  const plot = context.plot || {}
  const characters = context.characters || []
  const length = context.length || 'one-page'

  const title = spec.title || 'Untitled'
  const genre = spec.genre?.[0] || 'fiction'
  const protagonist = characters.find((c) => c.role === 'protagonist')
  const protName = protagonist?.name || 'the protagonist'
  const antagonist = characters.find((c) => c.role === 'antagonist')

  // Get plot structure info
  const beats = plot.beats || []
  const climaxBeat = beats.find((b) => b.title?.toLowerCase().includes('climax'))
  const resolutionBeat = beats.find((b) => b.title?.toLowerCase().includes('resolution'))

  if (length === 'elevator') {
    // 2-3 sentence elevator pitch
    return `${title.toUpperCase()} is a ${genre} novel about ${protName}, who must face impossible odds to ${protagonist?.motivation?.toLowerCase() || 'achieve their deepest desire'}. When ${antagonist ? antagonist.name + ' threatens everything' : 'dark forces emerge'}, ${protName} discovers that the greatest battles are fought within—and that sometimes, the only way forward is to become someone new.`
  }

  if (length === 'one-page') {
    let synopsis = `${title.toUpperCase()}\n\n`
    synopsis += `${genre.charAt(0).toUpperCase() + genre.slice(1)} | ${spec.targetWordCount ? Math.round(spec.targetWordCount / 1000) + 'K words' : 'Novel'}\n\n`

    synopsis += `---\n\n`

    // Opening
    synopsis += `In a world where ${spec.setting || 'nothing is as it seems'}, ${protName}${protagonist?.backstory ? ` (${protagonist.backstory.split('.')[0]})` : ''} wants nothing more than ${protagonist?.motivation?.toLowerCase() || 'to find their place'}.\n\n`

    // Inciting incident
    synopsis += `But when ${antagonist ? antagonist.name + ' appears' : 'an unexpected crisis strikes'}, ${protName}'s carefully ordered life shatters. Now, facing ${protagonist?.flaw ? 'their own ' + protagonist.flaw.toLowerCase() : 'inner demons'} and external threats alike, they must choose: retreat into safety, or risk everything for a chance at something more.\n\n`

    // Rising action
    synopsis += `As ${protName} navigates a web of ${genre.includes('thriller') ? 'danger and deception' : genre.includes('romance') ? 'complicated feelings and past wounds' : 'challenges and revelations'}, they form unexpected alliances and discover hidden truths. Each step forward demands a piece of who they were—and forces them to confront who they might become.\n\n`

    // Climax
    synopsis += `At the story's turning point, ${protName} faces an impossible choice: ${climaxBeat?.summary?.toLowerCase() || 'sacrifice everything they love, or betray everything they believe'}. In this crucible moment, the truth about ${antagonist ? antagonist.name : 'their greatest enemy'} is finally revealed—and it changes everything.\n\n`

    // Resolution
    synopsis += `${title.toUpperCase()} is a story about ${spec.themes?.[0]?.toLowerCase() || 'transformation'}, ${spec.themes?.[1]?.toLowerCase() || 'connection'}, and the courage it takes to become who we're meant to be.`

    return synopsis
  }

  // Two-page synopsis
  let synopsis = `${title.toUpperCase()}\n`
  synopsis += `by [Author Name]\n\n`
  synopsis += `${genre.charAt(0).toUpperCase() + genre.slice(1)} | ${spec.targetWordCount ? Math.round(spec.targetWordCount / 1000) + 'K words' : 'Novel'}\n\n`
  synopsis += `---\n\n`

  // Setup (expanded)
  synopsis += `**THE WORLD**\n\n`
  synopsis += `${spec.setting || 'The story takes place in a world'} where ${spec.tone ? 'the atmosphere is ' + spec.tone.toLowerCase() + ' and' : ''} nothing is quite as it appears on the surface. This is a place where ${spec.themes?.[0]?.toLowerCase() || 'truth and deception'} shape every interaction.\n\n`

  // Protagonist introduction
  synopsis += `**${protName?.toUpperCase() || 'THE PROTAGONIST'}**\n\n`
  synopsis += `${protName}${protagonist?.backstory ? ' ' + protagonist.backstory : ' carries a past that has shaped them in profound ways'}. Their greatest desire is to ${protagonist?.motivation?.toLowerCase() || 'find meaning and purpose'}. But their ${protagonist?.flaw?.toLowerCase() || 'deepest flaw'} threatens to undermine everything they hope to achieve.\n\n`

  // The catalyst
  synopsis += `**THE INCITING INCIDENT**\n\n`
  const firstBeat = beats[0]
  synopsis += `${firstBeat?.summary || 'When crisis strikes'}, ${protName}'s world is turned upside down. ${antagonist ? antagonist.name + ', ' + (antagonist.backstory?.split('.')[0] || 'a formidable force') + ', emerges as the central threat.' : 'Forces beyond their control begin to move.'} Suddenly, the life ${protName} knew is no longer possible.\n\n`

  // Rising action
  synopsis += `**THE JOURNEY**\n\n`
  synopsis += `Determined to ${protagonist?.motivation?.toLowerCase() || 'reclaim what was lost'}, ${protName} embarks on a path that will test everything they believe. Along the way, they encounter allies and enemies—and discover that the line between them isn't always clear.\n\n`

  // Add character dynamics
  const supporting = characters.filter((c) => c.role === 'supporting').slice(0, 2)
  if (supporting.length > 0) {
    synopsis += `${supporting.map((c) => c.name).join(' and ')} ${supporting.length > 1 ? 'become' : 'becomes'} crucial to ${protName}'s journey, each bringing their own secrets and agendas. Relationships deepen and complicate. Trust becomes both weapon and vulnerability.\n\n`
  }

  // Midpoint/dark night
  synopsis += `**THE CRISIS**\n\n`
  synopsis += `At the story's midpoint, ${protName} faces a devastating revelation that challenges everything they thought they knew. Their ${protagonist?.flaw?.toLowerCase() || 'greatest weakness'} leads to a catastrophic mistake, and for a moment, all seems lost. In this dark night of the soul, ${protName} must decide whether to continue fighting or surrender to despair.\n\n`

  // Climax
  synopsis += `**THE CLIMAX**\n\n`
  synopsis += `${climaxBeat?.summary || 'In the final confrontation'}, ${protName} faces ${antagonist ? antagonist.name : 'their greatest challenge'} in a battle that will determine everything. But the true victory isn't external—it's the transformation within. ${protName} finally embraces ${protagonist?.arc ? 'their arc: ' + protagonist.arc.toLowerCase() : 'who they were always meant to become'}.\n\n`

  // Resolution
  synopsis += `**THE RESOLUTION**\n\n`
  synopsis += `${resolutionBeat?.summary || 'In the aftermath'}, ${protName} emerges changed. The world around them has shifted too—nothing can go back to exactly what it was. But there is hope. There is possibility. And there is the promise that the journey has only begun.\n\n`

  // Themes
  synopsis += `---\n\n`
  synopsis += `${title.toUpperCase()} explores themes of ${spec.themes?.slice(0, 3).map((t: string) => t.toLowerCase()).join(', ') || 'transformation, connection, and the courage to change'}. It is a story that will resonate with readers who love ${genre} that challenges as much as it entertains.`

  return synopsis
}

/**
 * Generate a query letter template
 */
export function generateQueryLetter(context: MarketContext): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const title = spec.title || 'UNTITLED'
  const genre = spec.genre?.[0] || 'fiction'
  const wordCount = spec.targetWordCount || 80000
  const protagonist = characters.find((c) => c.role === 'protagonist')
  const protName = protagonist?.name || 'the protagonist'

  let letter = `Dear [Agent Name],\n\n`

  // Hook
  letter += `I am seeking representation for ${title.toUpperCase()}, a ${genre} novel complete at ${Math.round(wordCount / 1000)},000 words.\n\n`

  // Story paragraph
  letter += `${protName}${protagonist?.backstory ? ` ${protagonist.backstory.split('.')[0].toLowerCase()}` : ' has always lived in the shadows of expectation'}. When ${spec.setting ? 'in ' + spec.setting : 'their world'} is turned upside down, ${protName} must face ${protagonist?.flaw ? 'their ' + protagonist.flaw.toLowerCase() : 'their deepest fears'} and discover whether they have what it takes to ${protagonist?.motivation?.toLowerCase() || 'become who they were meant to be'}.\n\n`

  letter += `Navigating a world of ${genre.includes('thriller') ? 'danger and deception' : genre.includes('romance') ? 'complicated feelings' : 'challenges and revelations'}, ${protName} learns that the greatest battles are fought within. With ${spec.themes?.[0]?.toLowerCase() || 'themes of transformation'} at its core, ${title.toUpperCase()} explores what it means to ${spec.themes?.[1]?.toLowerCase() || 'find connection in unexpected places'}.\n\n`

  // Comp titles placeholder
  letter += `${title.toUpperCase()} will appeal to readers of [COMP TITLE 1] and [COMP TITLE 2], combining [ELEMENT 1] with [ELEMENT 2].\n\n`

  // Bio placeholder
  letter += `[Author bio: Include relevant writing credentials, publications, and any platform or expertise relevant to this book.]\n\n`

  // Close
  letter += `Thank you for your time and consideration. I would be happy to send the full manuscript at your request.\n\n`
  letter += `Best regards,\n`
  letter += `[Your Name]\n`
  letter += `[Email]\n`
  letter += `[Website/Social Media (optional)]`

  return letter
}

/**
 * Generate a book description (back-cover copy)
 */
export function generateBookDescription(context: MarketContext): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const title = spec.title || 'Untitled'
  const genre = spec.genre?.[0] || 'fiction'
  const protagonist = characters.find((c) => c.role === 'protagonist')
  const protName = protagonist?.name || 'The protagonist'
  const antagonist = characters.find((c) => c.role === 'antagonist')

  let description = ``

  // Tagline
  description += `*${spec.logline || 'Some secrets are worth any price. Others cost everything.'}*\n\n`

  // Hook paragraph
  description += `${protName} has always known ${protagonist?.flaw ? 'their ' + protagonist.flaw.toLowerCase() + ' would catch up with them' : 'that nothing comes easy'}. But when ${antagonist ? antagonist.name + ' enters their life' : 'an unexpected crisis strikes'}, everything changes. Now, trapped between ${genre.includes('thriller') ? 'dangerous enemies' : genre.includes('romance') ? 'past and present' : 'impossible choices'}, ${protName} must find the courage to face what they've been running from.\n\n`

  // Raising the stakes
  description += `In a world where ${spec.setting ? spec.setting : 'nothing is as it seems'}, ${protName} discovers that ${spec.themes?.[0]?.toLowerCase() || 'the truth'} comes with a price. As secrets unravel and loyalties are tested, ${protName} realizes that the only way forward is through—even if it means losing everything they thought they wanted.\n\n`

  // The choice/emotional hook
  description += `With ${genre.includes('romance') ? 'their heart' : 'time'} running out, ${protName} faces an impossible decision: ${protagonist?.motivation ? protagonist.motivation.toLowerCase() : 'fight for what matters'}, or watch it slip away forever.\n\n`

  // Closing hook
  description += `${title.toUpperCase()} is a ${spec.tone?.toLowerCase() || 'compelling'} ${genre} that explores ${spec.themes?.slice(0, 2).map((t: string) => t.toLowerCase()).join(' and ') || 'the resilience of the human spirit'}. Perfect for readers who love ${genre.includes('thriller') ? 'edge-of-your-seat suspense' : genre.includes('romance') ? 'emotionally rich love stories' : 'unforgettable characters and powerful storytelling'}.\n\n`

  // Review placeholder
  description += `---\n\n`
  description += `"[Placeholder for a quote or advance praise]" — [Reviewer/Author Name]\n\n`

  // Author note
  description += `---\n\n`
  description += `*Note: Customize the bracketed sections and adjust the emotional hooks to match your specific story beats.*`

  return description
}

/**
 * Analyze market and generate comparable titles
 */
export function analyzeMarket(context: MarketContext): string {
  const spec = context.specification || {}

  const genre = spec.genre?.[0] || 'Fiction'
  const title = spec.title || 'Untitled'
  const themes = spec.themes || []

  // Genre-specific comparable titles
  const comparableTitlesByGenre: Record<string, ComparableTitle[]> = {
    Fantasy: [
      {
        title: 'Fourth Wing',
        author: 'Rebecca Yarros',
        similarity: 'Dragon riders, academy setting, high-stakes action',
        marketPerformance: '#1 NYT Bestseller, 3M+ copies sold (2023)',
      },
      {
        title: 'House of Flame and Shadow',
        author: 'Sarah J. Maas',
        similarity: 'Epic fantasy, strong female protagonist, world-ending stakes',
        marketPerformance: '#1 NYT Bestseller, 2024 release',
      },
      {
        title: 'The Priory of the Orange Tree',
        author: 'Samantha Shannon',
        similarity: 'Dragon mythology, multiple POVs, epic scope',
        marketPerformance: 'NYT Bestseller, major film adaptation in development',
      },
    ],
    Romance: [
      {
        title: 'Happy Place',
        author: 'Emily Henry',
        similarity: 'Contemporary romance, second-chance love, witty dialogue',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold (2023)',
      },
      {
        title: 'Things We Never Got Over',
        author: 'Lucy Score',
        similarity: 'Small-town romance, grumpy-sunshine dynamic',
        marketPerformance: '#1 BookTok phenomenon, Amazon charts leader',
      },
      {
        title: 'The Love Hypothesis',
        author: 'Ali Hazelwood',
        similarity: 'Academic setting, fake dating trope',
        marketPerformance: 'NYT Bestseller, Netflix adaptation announced',
      },
    ],
    Thriller: [
      {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        similarity: 'Psychological suspense, unreliable narrator',
        marketPerformance: '#1 NYT Bestseller, 8M+ copies worldwide',
      },
      {
        title: 'The Last Thing He Told Me',
        author: 'Laura Dave',
        similarity: 'Family secrets, propulsive mystery',
        marketPerformance: 'NYT Bestseller, Apple TV+ adaptation',
      },
      {
        title: 'None of This Is True',
        author: 'Lisa Jewell',
        similarity: 'Dark obsession, twisty narrative',
        marketPerformance: 'NYT Bestseller, 2023 psychological thriller hit',
      },
    ],
    'Science Fiction': [
      {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        similarity: 'Science-driven plot, survival narrative',
        marketPerformance: 'NYT Bestseller, Ryan Gosling film adaptation',
      },
      {
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        similarity: 'Hard science fiction, cosmic scale',
        marketPerformance: 'Hugo Award winner, Netflix series',
      },
      {
        title: 'Starter Villain',
        author: 'John Scalzi',
        similarity: 'Humorous sci-fi, accessible entry point',
        marketPerformance: 'NYT Bestseller, 2023 release',
      },
    ],
    Fiction: [
      {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        similarity: 'Contemplative narrative, life-affirming themes',
        marketPerformance: '#1 NYT Bestseller, 5M+ copies worldwide',
      },
      {
        title: 'Lessons in Chemistry',
        author: 'Bonnie Garmus',
        similarity: 'Strong protagonist, period setting with modern themes',
        marketPerformance: '#1 NYT Bestseller, Apple TV+ adaptation',
      },
      {
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        similarity: 'Relationship focus, creative industry setting',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold',
      },
    ],
  }

  const comparableTitles = comparableTitlesByGenre[genre] || comparableTitlesByGenre['Fiction']

  const marketAnalysis = {
    comparableTitles,
    genrePositioning: `Your novel "${title}" positions well within the ${genre} genre, which has shown strong performance in 2024-2025. Current market trends favor ${
      genre === 'Fantasy'
        ? 'immersive world-building, morally complex characters, and romantic subplots'
        : genre === 'Romance'
          ? 'emotional depth, witty banter, and satisfying HEAs (happily ever afters)'
          : genre === 'Thriller'
            ? 'psychological depth, unreliable narrators, and twist endings'
            : genre === 'Science Fiction'
              ? 'accessible science concepts, hopeful futures, and strong characterization'
              : 'compelling narratives and relatable protagonists'
    }.`,
    uniqueness:
      themes.length > 0
        ? `Your exploration of ${themes.slice(0, 2).map((t: string) => t.toLowerCase()).join(' and ')} offers a fresh angle in the ${genre} space. This thematic focus can differentiate your work from competitors while still appealing to core genre readers.`
        : 'Define your themes in the Specification section to receive personalized uniqueness analysis.',
    readerExpectations: [
      `${genre} readers expect strong ${
        genre === 'Romance'
          ? 'romantic tension and emotional payoff'
          : genre === 'Fantasy'
            ? 'world-building and magic systems'
            : genre === 'Thriller'
              ? 'pacing and suspense'
              : 'pacing and character development'
      }`,
      'Modern readers value diverse representation and authentic voices',
      'Series potential is highly valued by publishers - consider sequel hooks',
      'Social media shareability (BookTok/Bookstagram moments) drives discovery',
      'Audio book compatibility is increasingly important for acquisition',
    ],
    lengthRecommendation:
      genre === 'Fantasy'
        ? 'Fantasy readers accept longer works (90,000-150,000 words). Debut fantasy under 100K is more marketable.'
        : genre === 'Romance'
          ? 'Romance typically ranges 70,000-90,000 words. Category romance runs shorter (50-70K).'
          : genre === 'Thriller'
            ? 'Thrillers typically range 80,000-100,000 words. Pacing is more important than length.'
            : 'General fiction typically ranges 70,000-100,000 words for debut authors.',
    analyzedAt: new Date().toISOString(),
  }

  return JSON.stringify(marketAnalysis)
}

/**
 * Suggest keywords for discoverability
 */
export function suggestKeywords(context: MarketContext): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const genre = spec.genre?.[0] || 'fiction'
  const themes = spec.themes || []
  const tone = spec.tone || ''
  const protagonist = characters.find((c) => c.role === 'protagonist')

  // Base genre keywords
  const genreKeywords: Record<string, string[]> = {
    Fantasy: [
      'fantasy',
      'epic fantasy',
      'sword and sorcery',
      'magic',
      'dragons',
      'quest',
      'chosen one',
      'dark fantasy',
    ],
    Romance: [
      'romance',
      'love story',
      'contemporary romance',
      'slow burn',
      'enemies to lovers',
      'second chance romance',
      'happily ever after',
    ],
    Thriller: [
      'thriller',
      'suspense',
      'psychological thriller',
      'mystery',
      'crime',
      'detective',
      'twisty',
      'page-turner',
    ],
    'Science Fiction': [
      'sci-fi',
      'science fiction',
      'space opera',
      'dystopian',
      'future',
      'technology',
      'first contact',
    ],
    Fiction: [
      'literary fiction',
      'contemporary fiction',
      'book club',
      "women's fiction",
      'family drama',
      'coming of age',
    ],
  }

  const keywords: string[] = []

  // Add genre keywords
  const baseKeywords = genreKeywords[genre] || genreKeywords['Fiction']
  keywords.push(...baseKeywords.slice(0, 4))

  // Add theme-based keywords
  themes.forEach((theme: string) => {
    const themeLower = theme.toLowerCase()
    if (themeLower.includes('secret')) keywords.push('dark secrets', 'family secrets')
    if (themeLower.includes('love')) keywords.push('love', 'emotional')
    if (themeLower.includes('betrayal')) keywords.push('betrayal', 'trust')
    if (themeLower.includes('identity')) keywords.push('identity', 'self-discovery')
    if (themeLower.includes('power')) keywords.push('power', 'ambition')
    if (themeLower.includes('redemption')) keywords.push('redemption', 'second chances')
    if (themeLower.includes('family')) keywords.push('family saga', 'family drama')
  })

  // Add protagonist-based keywords
  if (protagonist) {
    if (protagonist.role === 'protagonist') {
      keywords.push('strong protagonist')
    }
  }

  // Add tone-based keywords
  if (tone) {
    const toneLower = tone.toLowerCase()
    if (toneLower.includes('dark')) keywords.push('dark', 'atmospheric')
    if (toneLower.includes('wit')) keywords.push('witty', 'humorous')
    if (toneLower.includes('tense')) keywords.push('tense', 'gripping')
    if (toneLower.includes('emotional')) keywords.push('emotional', 'heartfelt')
  }

  // Add general marketable keywords
  keywords.push('new release')
  keywords.push('must read')
  keywords.push('2025 books')

  // Remove duplicates and limit
  const uniqueKeywords = [...new Set(keywords)].slice(0, 15)

  return JSON.stringify(uniqueKeywords)
}
