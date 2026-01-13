/**
 * Brainstorm Generator Module
 * Handles brainstorming and story foundation AI generation functions
 */

export interface BrainstormContext {
  brainstormText?: string
  answers?: Record<string, string>
}

export interface BrainstormQuestion {
  id: string
  category: string
  questionText: string
  contextQuote: string | null
  priority: number
}

export interface PlotPoint {
  id: string
  title: string
  description: string
  storyPhase: string
  confidence: string
  sourceQuote: string | null
  selected: boolean
}

export interface IdentifiedCharacter {
  id: string
  name: string | null
  workingName: string
  role: string
  knownTraits: string[]
  inferredTraits: string[]
  potentialArc: string
  keyRelationships: string[]
  confidence: string
  sourceQuotes: string[]
  selected: boolean
}

export interface SuggestedScene {
  id: string
  title: string
  description: string
  charactersInvolved: string[]
  emotionalBeat: string
  storyFunction: string
  vividness: string
  sourceQuote: string | null
  selected: boolean
}

/**
 * Analyze brainstorm text and generate clarifying questions
 */
export function analyzeBrainstorm(context: BrainstormContext): string {
  const brainstormText = context.brainstormText || ''

  // Generate questions based on content analysis
  const questions: BrainstormQuestion[] = [
    {
      id: `q-${Date.now()}-1`,
      category: 'Premise',
      questionText: 'What is the central conflict or challenge in your story?',
      contextQuote:
        brainstormText.substring(0, 100) + (brainstormText.length > 100 ? '...' : ''),
      priority: 1,
    },
    {
      id: `q-${Date.now()}-2`,
      category: 'Character',
      questionText: "What does your main character want most, and what's stopping them?",
      contextQuote: null,
      priority: 2,
    },
    {
      id: `q-${Date.now()}-3`,
      category: 'Setting',
      questionText:
        'Where and when does this story take place? What makes this setting unique?',
      contextQuote: null,
      priority: 3,
    },
    {
      id: `q-${Date.now()}-4`,
      category: 'Tone',
      questionText: 'What emotional journey do you want readers to experience?',
      contextQuote: null,
      priority: 4,
    },
    {
      id: `q-${Date.now()}-5`,
      category: 'Stakes',
      questionText: "What happens if the protagonist fails? What's truly at risk?",
      contextQuote: null,
      priority: 5,
    },
  ]

  return JSON.stringify({ questions })
}

/**
 * Generate story foundations based on brainstorm text and Q&A answers
 */
export function generateFoundations(context: BrainstormContext): string {
  const brainstormText = context.brainstormText || ''

  // In production, this would use Claude to deeply analyze the text
  // For now, generate structured foundations based on input

  const plotFoundation = {
    premise:
      brainstormText.length > 50
        ? `A story about ${brainstormText.substring(0, 100)}...`
        : 'A compelling story unfolds with rich characters and meaningful conflicts.',
    centralConflict:
      'The protagonist must overcome both external obstacles and internal doubts to achieve their goal.',
    suggestedStructure: {
      framework: 'Three-Act Structure',
      reasoning:
        'This classic framework provides clear progression while allowing flexibility in pacing.',
    },
    keyPlotPoints: [
      {
        id: `plot-${Date.now()}-1`,
        title: 'The Beginning',
        description: 'Establish the world and introduce the protagonist in their ordinary life.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-2`,
        title: 'The Catalyst',
        description: 'An event that disrupts the status quo and sets the story in motion.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-3`,
        title: 'The Midpoint',
        description:
          "A revelation or event that raises the stakes and changes the protagonist's approach.",
        storyPhase: 'middle',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-4`,
        title: 'The Climax',
        description:
          'The protagonist faces their greatest challenge and must make a crucial choice.',
        storyPhase: 'end',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
    ] as PlotPoint[],
    potentialSubplots: ['Romance subplot', 'Mentor relationship', 'Internal character growth'],
    openQuestions: [
      'What specific events drive the plot forward?',
      "What is the antagonist's motivation?",
    ],
  }

  const characterFoundation = {
    identifiedCharacters: [
      {
        id: `char-${Date.now()}-1`,
        name: null,
        workingName: 'The Protagonist',
        role: 'protagonist',
        knownTraits: [],
        inferredTraits: ['determined', 'flawed', 'relatable'],
        potentialArc:
          'Grows through challenges, learns to trust others, overcomes their fear.',
        keyRelationships: [],
        confidence: 'suggested',
        sourceQuotes: [],
        selected: true,
      },
      {
        id: `char-${Date.now()}-2`,
        name: null,
        workingName: 'The Antagonist',
        role: 'antagonist',
        knownTraits: [],
        inferredTraits: ['complex', 'motivated', 'formidable'],
        potentialArc:
          'Their goals clash with the protagonist, revealing deeper truths about the world.',
        keyRelationships: [],
        confidence: 'suggested',
        sourceQuotes: [],
        selected: true,
      },
    ] as IdentifiedCharacter[],
    relationshipHints: [
      {
        character1: 'The Protagonist',
        character2: 'The Antagonist',
        relationshipType: 'conflict',
        description: 'Their opposing goals create the central conflict.',
        confidence: 'suggested',
      },
    ],
    missingArchetypes: ['Mentor', 'Ally', 'Love Interest', 'Trickster'],
    openQuestions: [
      'Who supports the protagonist on their journey?',
      "What is the antagonist's backstory?",
    ],
  }

  const sceneFoundation = {
    envisionedScenes: [],
    suggestedScenes: [
      {
        id: `scene-${Date.now()}-1`,
        title: 'Opening Scene',
        description:
          'Introduce the protagonist in their ordinary world, hinting at what they lack.',
        charactersInvolved: ['Protagonist'],
        emotionalBeat: 'Curiosity mixed with subtle discontent',
        storyFunction: 'Establish character, setting, and stakes',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `scene-${Date.now()}-2`,
        title: 'The Call to Adventure',
        description: "An event disrupts the protagonist's world and demands a response.",
        charactersInvolved: ['Protagonist'],
        emotionalBeat: 'Shock transitioning to determination',
        storyFunction: 'Launch the main plot',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `scene-${Date.now()}-3`,
        title: 'First Major Confrontation',
        description:
          "The protagonist faces their first real challenge and discovers what they're up against.",
        charactersInvolved: ['Protagonist', 'Antagonist'],
        emotionalBeat: 'Tension and revelation',
        storyFunction: 'Raise stakes and introduce antagonist',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
    ] as SuggestedScene[],
    keyMoments: [
      'The inciting incident',
      'First major setback',
      'The point of no return',
      'Dark night of the soul',
      'The climactic confrontation',
    ],
    settingNotes: [],
    openQuestions: ['Where does the story take place?', 'What makes this world unique?'],
  }

  return JSON.stringify({
    plotFoundation,
    characterFoundation,
    sceneFoundation,
  })
}
