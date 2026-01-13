// Internationalization (i18n) system for StoryFlow

export type Language = 'en' | 'de'

export interface Translations {
  // Navigation groups
  nav: {
    plan: string
    build: string
    write: string
    publish: string
  }
  // Navigation items
  navItems: {
    specification: string
    brainstorm: string
    plot: string
    characters: string
    scenes: string
    wiki: string
    draft: string
    review: string
    stats: string
    export: string
    market: string
  }
  // Project switcher
  projectSwitcher: {
    project: string
    allProjects: string
    recent: string
  }
  // Phase progress
  phases: {
    specification: string
    plotting: string
    characters: string
    scenes: string
    writing: string
    revision: string
    complete: string
  }
  phaseProgress: {
    phase: string
    nextMilestone: string
  }
  // Star tooltip
  starTooltip: {
    title: string
    description: string
  }
  // Lock tooltip
  lockTooltip: {
    locked: string
    completeToUnlock: string
    progress: string
    requirements: {
      specification: string
      plot: string
      characters: string
      scenes: string
      write: string
      review: string
    }
  }
  // Common actions
  actions: {
    save: string
    cancel: string
    delete: string
    edit: string
    create: string
    generate: string
    close: string
    apply: string
    reset: string
    expand: string
    collapse: string
  }
  // Specification section
  specification: {
    title: string
    subtitle: string
    resetToDefaults: string
    basicInfo: string
    workingTitle: string
    authorName: string
    quickStartTemplates: string
    templatesDescription: string
    genre: string
    primaryGenres: string
    subgenres: string
    targetAudience: string
    writingStyle: string
    styleReference: string
    customStyleNotes: string
    tone: string
    narrativeStructure: string
    pointOfView: string
    tense: string
    lengthTargets: string
    targetWordCount: string
    targetChapterCount: string
    minChapterLength: string
    maxChapterLength: string
    setting: string
    settingTypes: string
    timePeriod: string
    themes: string
    themesDescription: string
    suggestThemes: string
    pacingComplexity: string
    pacing: string
    complexity: string
    slowBurn: string
    fastPaced: string
    simpleLinear: string
    complex: string
    // Presets
    presets: string
    savePreset: string
    loadPreset: string
    deletePreset: string
    presetName: string
    presetNamePlaceholder: string
    presetSaved: string
    presetLoaded: string
    presetDeleted: string
    noPresetsYet: string
    noPresetsDescription: string
    confirmDeletePreset: string
    saveCurrentSettings: string
    myPresets: string
  }
  // Genre templates
  templates: {
    epicFantasy: string
    epicFantasyDesc: string
    cozyMystery: string
    cozyMysteryDesc: string
    spaceOpera: string
    spaceOperaDesc: string
    contemporaryRomance: string
    contemporaryRomanceDesc: string
    psychologicalThriller: string
    psychologicalThrillerDesc: string
    yaComingOfAge: string
    yaComingOfAgeDesc: string
    popular: string
  }
  // Audiences
  audiences: {
    children: string
    middleGrade: string
    ya: string
    newAdult: string
    adult: string
  }
  // Novel language options
  novelLanguage: {
    label: string
    description: string
    options: {
      en: string
      de: string
      fr: string
      es: string
      it: string
    }
  }
  // Children's age categories
  ageCategories: {
    label: string
    description: string
    options: {
      '4-6': string
      '4-6-desc': string
      '7-10': string
      '7-10-desc': string
      '11-14': string
      '11-14-desc': string
      '15-18': string
      '15-18-desc': string
    }
  }
  // POV options
  povOptions: {
    firstPerson: string
    thirdLimited: string
    thirdOmniscient: string
    secondPerson: string
    multiplePov: string
  }
  // Tense options
  tenseOptions: {
    past: string
    present: string
  }
  // Settings
  settings: {
    language: string
    german: string
    english: string
  }
  // Empty states
  emptyStates: {
    noChapters: string
    startWriting: string
    selectChapter: string
  }
  // Status
  status: {
    outline: string
    draft: string
    revision: string
    final: string
    locked: string
  }
  // Placeholders
  placeholders: {
    enterTitle: string
    penName: string
    selectAuthor: string
    searchAuthors: string
    styleNotes: string
    tone: string
    suggestTone: string
    suggestTitles: string
    timePeriod: string
    typicalWordCount: string
    searchCharacters: string
    searchScenes: string
    searchPlot: string
  }
  // Characters section
  characters: {
    title: string
    cards: string
    relationships: string
    relationshipMap: string
    voiceDna: string
    allRoles: string
    allStatuses: string
    sort: string
    noCharactersYet: string
    noMatchingCharacters: string
    needMoreCharacters: string
    noRelationshipsYet: string
    createFirstCharacter: string
    adjustFilters: string
    addMoreCharacters: string
    createRelationship: string
    chooseCharacter: string
    deleteConfirm: string
    characterRelationships: string
    addDepth: string
    editCharacter: string
    deleteCharacter: string
    editRelationship: string
    deleteRelationship: string
    firstAppearance: string
    strengths: string
    flaws: string
    approach: string
    analyzeDialogue: string
    roles: {
      protagonist: string
      antagonist: string
      supporting: string
      minor: string
    }
    statuses: {
      alive: string
      deceased: string
      unknown: string
    }
  }
  // Plot section
  plot: {
    title: string
    timeline: string
    storyBeats: string
    subplots: string
    canvas: string
    addBeat: string
    noBeatYet: string
    createFirstBeat: string
    beatTypes: {
      hook: string
      incitingIncident: string
      plotPoint1: string
      pinch1: string
      midpoint: string
      pinch2: string
      plotPoint2: string
      climax: string
      resolution: string
    }
  }
  // Scenes section
  scenes: {
    title: string
    subtitle: string
    list: string
    timeline: string
    cards: string
    chapters: string
    matrix: string
    noScenesYet: string
    createFirstScene: string
    sceneGoal: string
    sceneConflict: string
    sceneOutcome: string
    characters: string
    location: string
    timeOfDay: string
    wordCount: string
    estimatedWords: string
    newScene: string
    generate3Options: string
    aiGeneratedSuggestions: string
    noScenesToDisplay: string
    createScenesAssignChapters: string
    unassignedScenes: string
    totalEstimatedWords: string
    sceneOrderUpdated: string
    failedToReorderScenes: string
    sceneUpdated: string
    sceneCreated: string
    failedToSaveScene: string
    sceneDeleted: string
    failedToDeleteScene: string
    chooseSceneApproach: string
    selectSceneApproach: string
    conflict: string
    tone: string
    emotionArc: string
    generatedProse: string
    proseSavedTo: string
    failedToGenerateProse: string
    failedToSaveProse: string
    saveToScene: string
    words: string
    generatingProse: string
    generatingSceneOptions: string
    setsUp: string
    paysOff: string
    start: string
    end: string
    pov: string
    generateProse: string
  }
  // Write section
  write: {
    title: string
    selectChapter: string
    noChaptersYet: string
    createFirstChapter: string
    wordCount: string
    targetWords: string
    progress: string
    autoSave: string
    lastSaved: string
    generate: string
    regenerate: string
  }
  // Brainstorm section
  brainstorm: {
    title: string
    ideas: string
    mindMap: string
    noIdeasYet: string
    addIdea: string
    generateIdeas: string
    brainstormMode: string
    writeFreely: string
    hidePrompts: string
    showPrompts: string
    needInspiration: string
    optionalTags: string
    startWritingPlaceholder: string
    words: string
    analyzeAndGenerateQuestions: string
    analyzingBrainstorm: string
    findingElements: string
    clarifyVision: string
    answerQuestions: string
    questionOf: string
    complete: string
    fromYourBrainstorm: string
    yourThoughts: string
    skipQuestion: string
    nextQuestion: string
    storyFoundations: string
    reviewSelect: string
    plotFoundation: string
    characterFoundation: string
    sceneFoundation: string
    premise: string
    centralConflict: string
    keyPlotPoints: string
    identifiedCharacters: string
    suggestedArchetypes: string
    envisionedScenes: string
    keyMoments: string
    backToBrainstorm: string
    finalizeAndContinue: string
    brainstormComplete: string
    foundationsPrepared: string
    seedsReady: string
    returnToAddMore: string
    tags: {
      character: string
      setting: string
      plot: string
      theme: string
      scene: string
      question: string
      inspiration: string
    }
    prompts: {
      coreStory: string
      mainPeople: string
      clearScenes: string
      readerFeeling: string
      inspiration: string
      ownQuestions: string
    }
  }
  // Review section
  review: {
    title: string
    critique: string
    readerSimulator: string
    continuity: string
    analyze: string
    noChaptersToReview: string
  }
  // Wiki section
  wiki: {
    title: string
    subtitle: string
    entries: string
    categories: string
    noEntriesYet: string
    createEntry: string
    searchEntries: string
    addEntry: string
    extractFromChapters: string
    extractFromChaptersDesc: string
    noChapterContent: string
    extractingElements: string
    expandingEntry: string
    noMatchingEntries: string
    clearFilters: string
    autoLinkedFrom: string
    clickToViewCharacters: string
    expandWithAI: string
    editEntry: string
    deleteEntry: string
    sources: string
    related: string
    more: string
    extractedElements: string
    foundPotentialEntries: string
    addAllToWiki: string
    createFirstEntry: string
    startBuildingWorld: string
    allCategories: string
    locations: string
    characters: string
    timeline: string
    magicTechnology: string
    culturesFactions: string
    objects: string
    terminology: string
    rules: string
    wikiEntryUpdated: string
    wikiEntryCreated: string
    failedToSaveEntry: string
    wikiEntryDeleted: string
    failedToDeleteEntry: string
    addedEntries: string
    failedToAddEntries: string
    expandedEntry: string
    failedToExpandEntry: string
    failedToExtract: string
  }
  // Stats section
  stats: {
    title: string
    overview: string
    progress: string
    wordCountHistory: string
    dailyGoal: string
    totalWords: string
    chaptersCompleted: string
    averageWordsPerDay: string
  }
  // Export section
  export: {
    title: string
    format: string
    options: string
    exportNow: string
    formats: {
      pdf: string
      epub: string
      docx: string
      markdown: string
      json: string
    }
    subtitle: string
    jsonBackup: string
    fullProjectExport: string
    jsonDescription: string
    exportJson: string
    plainTextManuscript: string
    markdownDescription: string
    exportMarkdown: string
    importProject: string
    restoreFromBackup: string
    importDescription: string
    importJson: string
    professionalFormats: string
    docxExport: string
    professionalManuscript: string
    docxDescription: string
    formatPreset: string
    exportDocx: string
    selected: string
    aiPublishingTools: string
    aiToolsDescription: string
    synopsis: string
    storySummaryForAgents: string
    synopsisDescription: string
    elevatorPitch: string
    onePageSynopsis: string
    twoPageSynopsis: string
    queryLetter: string
    industryStandardFormat: string
    queryLetterDescription: string
    generateQueryLetter: string
    bookDescription: string
    backCoverCopy: string
    bookDescriptionDescription: string
    generateDescription: string
    copyToClipboard: string
    copied: string
    close: string
    projectExportedJson: string
    projectExportedMarkdown: string
    exportedDocxFormat: string
    failedExport: string
    failedExportDocx: string
    projectImported: string
    failedImport: string
    generating: string
    synopsisGenerated: string
    queryLetterGenerated: string
    bookDescriptionGenerated: string
    failedGenerateSynopsis: string
    failedGenerateQueryLetter: string
    failedGenerateBookDescription: string
    copiedToClipboard: string
    failedCopyClipboard: string
  }
  // Market section
  market: {
    title: string
    subtitle: string
    analysis: string
    comparables: string
    positioning: string
    runAnalysis: string
    competitiveAnalysis: string
    analyzeGenreMarket: string
    setGenreFirst: string
    analyzing: string
    reAnalyze: string
    analyzeMarket: string
    searchingComparables: string
    currentBestsellers: string
    genrePositioning: string
    yourUniqueAngle: string
    readerExpectations: string
    lengthRecommendation: string
    analysisPerformed: string
    noAnalysisYet: string
    noAnalysisDescription: string
    discoveryKeywords: string
    regenerate: string
    suggestKeywords: string
    keywordDescription: string
    clickSuggestKeywords: string
    keywordsGenerated: string
    keywordsCopied: string
    failedToCopy: string
    copyAllKeywords: string
    copied: string
    marketAnalysisComplete: string
    failedToAnalyzeMarket: string
    similarity: string
    by: string
  }
  // Common UI elements
  common: {
    search: string
    filter: string
    sortBy: string
    ascending: string
    descending: string
    loading: string
    error: string
    success: string
    confirm: string
    selected: string
    all: string
    none: string
    add: string
    remove: string
    back: string
    next: string
    previous: string
    page: string
    of: string
    items: string
    noResults: string
    tryAgain: string
  }
  // Toast messages
  toasts: {
    saveSuccess: string
    saveError: string
    deleteSuccess: string
    deleteError: string
    generateSuccess: string
    generateError: string
    saved: string
    saving: string
    allChangesSaved: string
    savingChanges: string
    focusMode: string
    normalMode: string
    focusModeExit: string
    sidebarRestored: string
  }
  // Dialog strings
  dialogs: {
    deleteScene: string
    deleteCharacter: string
    deletePlotBeat: string
    deleteSubplot: string
    deleteRelationship: string
    confirmDelete: string
    cannotBeUndone: string
  }
  // Sidebar milestones
  milestones: {
    completeSpecification: string
    definePlotStructure: string
    createCharacters: string
    createScenes: string
    writeChapterContent: string
    completeReview: string
  }
  // Aria labels
  ariaLabels: {
    closeDialog: string
    closeModal: string
    expandInspector: string
    collapseInspector: string
    editCharacter: string
    deleteCharacter: string
    editScene: string
    deleteScene: string
    navigation: string
    mainNavigation: string
    mainHeader: string
    mainContent: string
  }
}

const en: Translations = {
  nav: {
    plan: 'PLAN',
    build: 'BUILD',
    write: 'WRITE',
    publish: 'PUBLISH',
  },
  navItems: {
    specification: 'Specification',
    brainstorm: 'Brainstorm',
    plot: 'Plot',
    characters: 'Characters',
    scenes: 'Scenes',
    wiki: 'Wiki',
    draft: 'Draft',
    review: 'Review',
    stats: 'Stats',
    export: 'Export',
    market: 'Market',
  },
  projectSwitcher: {
    project: 'Project',
    allProjects: 'All Projects',
    recent: 'Recent',
  },
  phases: {
    specification: 'Specification',
    plotting: 'Plotting',
    characters: 'Characters',
    scenes: 'Scenes',
    writing: 'Writing',
    revision: 'Revision',
    complete: 'Complete',
  },
  phaseProgress: {
    phase: 'Phase',
    nextMilestone: 'Next',
  },
  starTooltip: {
    title: 'Recommended Next',
    description: 'Based on your progress, this section will help you move forward most effectively.',
  },
  lockTooltip: {
    locked: 'Locked',
    completeToUnlock: 'Complete to unlock:',
    progress: 'Progress',
    requirements: {
      specification: 'Complete your novel specification first',
      plot: 'Add at least 3 plot beats to unlock',
      characters: 'Create at least 2 characters to unlock',
      scenes: 'Add at least 5 scenes to unlock',
      write: 'Complete scene planning to unlock writing',
      review: 'Write at least one chapter to unlock review',
    },
  },
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    generate: 'Generate',
    close: 'Close',
    apply: 'Apply',
    reset: 'Reset',
    expand: 'Expand',
    collapse: 'Collapse',
  },
  specification: {
    title: 'Novel Specification',
    subtitle: 'Define all parameters that shape your novel before writing begins.',
    resetToDefaults: 'Reset to Defaults',
    basicInfo: 'Basic Information',
    workingTitle: 'Working Title',
    authorName: 'Author Name',
    quickStartTemplates: 'Quick Start Templates',
    templatesDescription: 'Choose a template to pre-fill settings for your genre. You can customize everything afterward.',
    genre: 'Genre',
    primaryGenres: 'Primary Genre(s)',
    subgenres: 'Subgenre(s)',
    targetAudience: 'Target Audience',
    writingStyle: 'Writing Style',
    styleReference: 'Style Reference (Famous Author)',
    customStyleNotes: 'Custom Style Notes',
    tone: 'Tone',
    narrativeStructure: 'Narrative Structure',
    pointOfView: 'Point of View',
    tense: 'Tense',
    lengthTargets: 'Length Targets',
    targetWordCount: 'Target Word Count',
    targetChapterCount: 'Target Chapter Count',
    minChapterLength: 'Min Chapter Length (words)',
    maxChapterLength: 'Max Chapter Length (words)',
    setting: 'Setting',
    settingTypes: 'Setting Type(s)',
    timePeriod: 'Time Period',
    themes: 'Themes',
    themesDescription: 'Select themes that resonate with your story',
    suggestThemes: 'Suggest Themes',
    pacingComplexity: 'Pacing & Complexity',
    pacing: 'Pacing',
    complexity: 'Complexity',
    slowBurn: 'Slow burn',
    fastPaced: 'Fast-paced',
    simpleLinear: 'Simple/Linear',
    complex: 'Complex',
    // Presets
    presets: 'Presets',
    savePreset: 'Save Preset',
    loadPreset: 'Load Preset',
    deletePreset: 'Delete Preset',
    presetName: 'Preset Name',
    presetNamePlaceholder: 'My Fantasy Setup',
    presetSaved: 'Preset saved',
    presetLoaded: 'Preset loaded',
    presetDeleted: 'Preset deleted',
    noPresetsYet: 'No saved presets yet',
    noPresetsDescription: 'Save your current specification settings as a preset to quickly apply them to future projects.',
    confirmDeletePreset: 'Delete this preset?',
    saveCurrentSettings: 'Save Current Settings',
    myPresets: 'My Presets',
  },
  templates: {
    epicFantasy: 'Epic Fantasy',
    epicFantasyDesc: 'Grand worldbuilding, multiple POVs, complex plots',
    cozyMystery: 'Cozy Mystery',
    cozyMysteryDesc: 'Light-hearted, amateur sleuth, small community',
    spaceOpera: 'Space Opera',
    spaceOperaDesc: 'Grand space adventures, alien civilizations',
    contemporaryRomance: 'Contemporary Romance',
    contemporaryRomanceDesc: 'Modern love stories, emotional depth',
    psychologicalThriller: 'Psychological Thriller',
    psychologicalThrillerDesc: 'Mind games, unreliable narrators, suspense',
    yaComingOfAge: 'YA Coming of Age',
    yaComingOfAgeDesc: 'Teen protagonists, first experiences, growth',
    popular: 'Popular',
  },
  audiences: {
    children: 'Children',
    middleGrade: 'Middle Grade',
    ya: 'YA',
    newAdult: 'New Adult',
    adult: 'Adult',
  },
  novelLanguage: {
    label: 'Novel Language',
    description: 'The language your novel will be written in. This affects AI-generated content.',
    options: {
      en: 'English',
      de: 'German (Deutsch)',
      fr: 'French (Français)',
      es: 'Spanish (Español)',
      it: 'Italian (Italiano)',
    },
  },
  ageCategories: {
    label: 'Age Category',
    description: 'Select the specific age range for your target readers',
    options: {
      '4-6': '4-6 Years',
      '4-6-desc': 'Picture Books, Early Readers',
      '7-10': '7-10 Years',
      '7-10-desc': 'Chapter Books, Early Middle Grade',
      '11-14': '11-14 Years',
      '11-14-desc': 'Middle Grade, Tween Fiction',
      '15-18': '15-18 Years',
      '15-18-desc': 'Young Adult, Teen Fiction',
    },
  },
  povOptions: {
    firstPerson: 'First Person',
    thirdLimited: 'Third Limited',
    thirdOmniscient: 'Third Omniscient',
    secondPerson: 'Second Person',
    multiplePov: 'Multiple POV',
  },
  tenseOptions: {
    past: 'Past',
    present: 'Present',
  },
  settings: {
    language: 'Language',
    german: 'Deutsch',
    english: 'English',
  },
  emptyStates: {
    noChapters: 'No chapters yet',
    startWriting: 'Start Writing',
    selectChapter: 'Select a Chapter',
  },
  status: {
    outline: 'Outline',
    draft: 'Draft',
    revision: 'Revision',
    final: 'Final',
    locked: 'Locked',
  },
  placeholders: {
    enterTitle: "Enter your novel's title",
    penName: 'Your name or pen name',
    selectAuthor: 'Select an author...',
    searchAuthors: 'Search authors...',
    styleNotes: 'e.g., sparse but evocative',
    tone: 'e.g., Dark and gritty with moments of dark humor',
    suggestTone: 'Get AI tone suggestions',
    suggestTitles: 'Get AI title suggestions',
    timePeriod: 'e.g., Present day, Victorian era, 2150 AD',
    typicalWordCount: 'Typical: 50,000 - 120,000 words',
    searchCharacters: 'Search characters...',
    searchScenes: 'Search scenes...',
    searchPlot: 'Search plot points...',
  },
  characters: {
    title: 'Characters',
    cards: 'Character Cards',
    relationships: 'Relationships List',
    relationshipMap: 'Relationship Map',
    voiceDna: 'Voice DNA Analysis',
    allRoles: 'All Roles',
    allStatuses: 'All Statuses',
    sort: 'Sort',
    noCharactersYet: 'No characters yet',
    noMatchingCharacters: 'No matching characters',
    needMoreCharacters: 'Need more characters',
    noRelationshipsYet: 'No relationships yet',
    createFirstCharacter: 'Create your first character to get started',
    adjustFilters: 'Try adjusting your filters or search query',
    addMoreCharacters: 'Add at least 2 characters to create relationships',
    createRelationship: 'Create a relationship between characters',
    chooseCharacter: 'Choose Your Character',
    deleteConfirm: 'Delete character(s)?',
    characterRelationships: 'Character Relationships',
    addDepth: 'Add psychological depth with AI',
    editCharacter: 'Edit character',
    deleteCharacter: 'Delete character',
    editRelationship: 'Edit relationship',
    deleteRelationship: 'Delete relationship',
    firstAppearance: 'First appearance',
    strengths: 'Strengths',
    flaws: 'Flaws',
    approach: 'Approach',
    analyzeDialogue: 'Analyze dialogue patterns across characters',
    roles: {
      protagonist: 'Protagonist',
      antagonist: 'Antagonist',
      supporting: 'Supporting',
      minor: 'Minor',
    },
    statuses: {
      alive: 'Alive',
      deceased: 'Deceased',
      unknown: 'Unknown',
    },
  },
  plot: {
    title: 'Plot',
    timeline: 'Timeline',
    storyBeats: 'Story Beats',
    subplots: 'Subplots',
    canvas: 'Canvas',
    addBeat: 'Add Beat',
    noBeatYet: 'No story beats yet',
    createFirstBeat: 'Create your first story beat',
    beatTypes: {
      hook: 'Hook',
      incitingIncident: 'Inciting Incident',
      plotPoint1: 'Plot Point 1',
      pinch1: 'Pinch Point 1',
      midpoint: 'Midpoint',
      pinch2: 'Pinch Point 2',
      plotPoint2: 'Plot Point 2',
      climax: 'Climax',
      resolution: 'Resolution',
    },
  },
  scenes: {
    title: 'Scenes',
    subtitle: 'Build detailed scene blueprints with timeline and chapter views.',
    list: 'Scene List',
    timeline: 'Timeline',
    cards: 'Cards',
    chapters: 'Chapters',
    matrix: 'Matrix',
    noScenesYet: 'No scenes yet',
    createFirstScene: 'Create First Scene',
    sceneGoal: 'Goal',
    sceneConflict: 'Conflict',
    sceneOutcome: 'Outcome',
    characters: 'Characters',
    location: 'Location',
    timeOfDay: 'Time of Day',
    wordCount: 'Word Count',
    estimatedWords: 'estimated words',
    newScene: 'New Scene',
    generate3Options: 'Generate 3 Options',
    aiGeneratedSuggestions: 'AI-generated scene suggestions',
    noScenesToDisplay: 'No scenes to display. Create scenes and assign them to chapters.',
    createScenesAssignChapters: 'Start building your story by creating scene blueprints.',
    unassignedScenes: 'Unassigned Scenes',
    totalEstimatedWords: 'Total Estimated Words',
    sceneOrderUpdated: 'Scene order updated',
    failedToReorderScenes: 'Failed to reorder scenes',
    sceneUpdated: 'Scene updated',
    sceneCreated: 'Scene created',
    failedToSaveScene: 'Failed to save scene',
    sceneDeleted: 'Scene deleted',
    failedToDeleteScene: 'Failed to delete scene',
    chooseSceneApproach: 'Choose a Scene Approach',
    selectSceneApproach: 'Select one of the following scene approaches to create your new scene:',
    conflict: 'Conflict',
    tone: 'Tone',
    emotionArc: 'Emotion Arc',
    generatedProse: 'Generated Prose',
    proseSavedTo: 'Prose saved to',
    failedToGenerateProse: 'Failed to generate prose',
    failedToSaveProse: 'Failed to save prose',
    saveToScene: 'Save to Scene',
    words: 'words',
    generatingProse: 'Generating Prose',
    generatingSceneOptions: 'Generating Scene Options',
    setsUp: 'Sets up:',
    paysOff: 'Pays off:',
    start: 'Start',
    end: 'End',
    pov: 'POV',
    generateProse: 'Generate prose from outline',
  },
  write: {
    title: 'Write',
    selectChapter: 'Select a chapter',
    noChaptersYet: 'No chapters yet',
    createFirstChapter: 'Create your first chapter',
    wordCount: 'Words',
    targetWords: 'Target',
    progress: 'Progress',
    autoSave: 'Auto-save',
    lastSaved: 'Last saved',
    generate: 'Generate',
    regenerate: 'Regenerate',
  },
  brainstorm: {
    title: 'Brainstorm',
    ideas: 'Ideas',
    mindMap: 'Mind Map',
    noIdeasYet: 'No ideas yet',
    addIdea: 'Add Idea',
    generateIdeas: 'Generate Ideas',
    brainstormMode: 'Brainstorm Mode',
    writeFreely: "Write freely about your story. Don't worry about structure—just capture your ideas.",
    hidePrompts: 'Hide prompts',
    showPrompts: 'Show prompts',
    needInspiration: 'Need inspiration? Consider:',
    optionalTags: 'Optional tags:',
    startWritingPlaceholder: 'Start writing your ideas here... What\'s the story about? Who are the characters? What scenes do you imagine? Just let it flow...',
    words: 'words',
    analyzeAndGenerateQuestions: 'Analyze & Generate Questions',
    analyzingBrainstorm: 'Analyzing your brainstorm...',
    findingElements: 'Finding story elements, themes, and potential questions',
    clarifyVision: "Let's Clarify Your Vision",
    answerQuestions: 'Answer these questions to help shape your story. Skip any you\'re not sure about.',
    questionOf: 'Question {current} of {total}',
    complete: 'complete',
    fromYourBrainstorm: 'From your brainstorm:',
    yourThoughts: 'Your thoughts...',
    skipQuestion: 'Skip this question',
    nextQuestion: 'Next Question',
    storyFoundations: 'Your Story Foundations',
    reviewSelect: 'Review and select the elements you want to develop further. Selected items will be sent to Plot, Characters, and Scenes.',
    plotFoundation: 'Plot Foundation',
    characterFoundation: 'Character Foundation',
    sceneFoundation: 'Scene Foundation',
    premise: 'Premise',
    centralConflict: 'Central Conflict',
    keyPlotPoints: 'Key Plot Points',
    identifiedCharacters: 'Identified Characters',
    suggestedArchetypes: 'Suggested Archetypes to Add',
    envisionedScenes: 'Envisioned Scenes',
    keyMoments: 'Key Moments',
    backToBrainstorm: 'Back to Brainstorm',
    finalizeAndContinue: 'Finalize & Continue to Development',
    brainstormComplete: 'Brainstorm Complete!',
    foundationsPrepared: 'Your foundations have been prepared. Continue to Plot, Characters, or Scenes to develop them further.',
    seedsReady: 'seeds ready',
    returnToAddMore: 'Return to Brainstorm to Add More',
    tags: {
      character: 'Character',
      setting: 'Setting',
      plot: 'Plot',
      theme: 'Theme',
      scene: 'Scene',
      question: 'Question',
      inspiration: 'Inspiration',
    },
    prompts: {
      coreStory: "What's the core story you want to tell?",
      mainPeople: 'Who are the main people in this story?',
      clearScenes: 'What scenes do you already see clearly?',
      readerFeeling: 'What feeling do you want readers to have?',
      inspiration: 'What inspired this idea?',
      ownQuestions: 'What questions do you have about your own story?',
    },
  },
  review: {
    title: 'Review',
    critique: 'AI Critique',
    readerSimulator: 'Reader Simulator',
    continuity: 'Continuity Check',
    analyze: 'Analyze',
    noChaptersToReview: 'No chapters to review',
  },
  wiki: {
    title: 'Worldbuilding Wiki',
    subtitle: 'Maintain internal consistency with organized worldbuilding details.',
    entries: 'Entries',
    categories: 'Categories',
    noEntriesYet: 'No wiki entries yet',
    createEntry: 'Create Entry',
    searchEntries: 'Search entries...',
    addEntry: 'Add Entry',
    extractFromChapters: 'Extract from Chapters',
    extractFromChaptersDesc: 'Scan chapters for locations, terms, and items',
    noChapterContent: 'No chapter content to analyze',
    extractingElements: 'Extracting Wiki Elements from Chapters',
    expandingEntry: 'Expanding',
    noMatchingEntries: 'No matching entries found',
    clearFilters: 'Clear Filters',
    autoLinkedFrom: 'auto-linked from Characters',
    clickToViewCharacters: 'Click to view in Characters',
    expandWithAI: 'Expand with AI-generated details',
    editEntry: 'Edit entry',
    deleteEntry: 'Delete entry',
    sources: 'Sources:',
    related: 'Related:',
    more: 'more',
    extractedElements: 'Extracted Wiki Elements',
    foundPotentialEntries: 'Found potential wiki entries from your chapters:',
    addAllToWiki: 'Add All to Wiki',
    createFirstEntry: 'Create First Entry',
    startBuildingWorld: 'Start building your world by documenting locations, items, and lore.',
    allCategories: 'All Categories',
    locations: 'Locations',
    characters: 'Characters',
    timeline: 'Timeline',
    magicTechnology: 'Magic/Technology',
    culturesFactions: 'Cultures/Factions',
    objects: 'Objects',
    terminology: 'Terminology',
    rules: 'Rules',
    wikiEntryUpdated: 'Wiki entry updated',
    wikiEntryCreated: 'Wiki entry created',
    failedToSaveEntry: 'Failed to save wiki entry',
    wikiEntryDeleted: 'Wiki entry deleted',
    failedToDeleteEntry: 'Failed to delete wiki entry',
    addedEntries: 'Added wiki entries',
    failedToAddEntries: 'Failed to add entries',
    expandedEntry: 'Expanded',
    failedToExpandEntry: 'Failed to expand entry',
    failedToExtract: 'Failed to extract elements',
  },
  stats: {
    title: 'Statistics',
    overview: 'Overview',
    progress: 'Progress',
    wordCountHistory: 'Word Count History',
    dailyGoal: 'Daily Goal',
    totalWords: 'Total Words',
    chaptersCompleted: 'Chapters Completed',
    averageWordsPerDay: 'Average Words/Day',
  },
  export: {
    title: 'Export',
    format: 'Format',
    options: 'Options',
    exportNow: 'Export Now',
    formats: {
      pdf: 'PDF Document',
      epub: 'EPUB eBook',
      docx: 'Word Document',
      markdown: 'Markdown',
      json: 'JSON Backup',
    },
    subtitle: 'Export your manuscript in professional formats or backup your project.',
    jsonBackup: 'JSON Backup',
    fullProjectExport: 'Full project export',
    jsonDescription: 'Export your entire project including all characters, scenes, chapters, and settings. Use this for backup or to transfer between devices.',
    exportJson: 'Export JSON',
    plainTextManuscript: 'Plain text manuscript',
    markdownDescription: 'Export your manuscript as a Markdown file. Great for reading on any device or converting to other formats.',
    exportMarkdown: 'Export Markdown',
    importProject: 'Import Project',
    restoreFromBackup: 'Restore from backup',
    importDescription: 'Import a previously exported JSON backup. This will create a new project with all your data restored.',
    importJson: 'Import JSON',
    professionalFormats: 'Professional Formats',
    docxExport: 'DOCX Export',
    professionalManuscript: 'Professional manuscript format',
    docxDescription: 'Export your manuscript as a DOCX file with professional formatting. Choose a preset that matches your needs.',
    formatPreset: 'Format Preset',
    exportDocx: 'Export DOCX',
    selected: 'Selected',
    aiPublishingTools: 'AI Publishing Tools',
    aiToolsDescription: 'Generate professional publishing materials using AI assistance.',
    synopsis: 'Synopsis',
    storySummaryForAgents: 'Story summary for agents',
    synopsisDescription: 'Generate a synopsis of your novel at different lengths for query submissions.',
    elevatorPitch: 'Elevator Pitch (2-3 sentences)',
    onePageSynopsis: 'One-Page Synopsis',
    twoPageSynopsis: 'Two-Page Synopsis',
    queryLetter: 'Query Letter',
    industryStandardFormat: 'Industry-standard format',
    queryLetterDescription: 'Generate a professional query letter to pitch your novel to literary agents.',
    generateQueryLetter: 'Generate Query Letter',
    bookDescription: 'Book Description',
    backCoverCopy: 'Back-cover copy',
    bookDescriptionDescription: 'Generate compelling back-cover copy that hooks readers and sells your story.',
    generateDescription: 'Generate Description',
    copyToClipboard: 'Copy to Clipboard',
    copied: 'Copied!',
    close: 'Close',
    projectExportedJson: 'Project exported as JSON',
    projectExportedMarkdown: 'Project exported as Markdown',
    exportedDocxFormat: 'Exported as DOCX with {format} format',
    failedExport: 'Failed to export project',
    failedExportDocx: 'Failed to export DOCX',
    projectImported: 'Project "{title}" imported successfully',
    failedImport: 'Failed to import project. Make sure the file is a valid Storyflow JSON export.',
    generating: 'Generating {type}',
    synopsisGenerated: '{type} generated!',
    queryLetterGenerated: 'Query letter generated!',
    bookDescriptionGenerated: 'Book description generated!',
    failedGenerateSynopsis: 'Failed to generate synopsis',
    failedGenerateQueryLetter: 'Failed to generate query letter',
    failedGenerateBookDescription: 'Failed to generate book description',
    copiedToClipboard: 'Content copied to clipboard',
    failedCopyClipboard: 'Failed to copy to clipboard',
  },
  market: {
    title: 'Market Analysis',
    subtitle: 'Position your novel competitively within its genre.',
    analysis: 'Analysis',
    comparables: 'Comparable Titles',
    positioning: 'Positioning',
    runAnalysis: 'Run Analysis',
    competitiveAnalysis: 'Competitive Analysis',
    analyzeGenreMarket: 'Analyze the {genre} market and find comparable titles',
    setGenreFirst: 'Set your genre in Specification first for targeted analysis',
    analyzing: 'Analyzing...',
    reAnalyze: 'Re-Analyze',
    analyzeMarket: 'Analyze Market',
    searchingComparables: 'Searching for comparable titles and market trends...',
    currentBestsellers: 'Current bestsellers in your genre',
    genrePositioning: 'Genre Positioning',
    yourUniqueAngle: 'Your Unique Angle',
    readerExpectations: 'Reader Expectations',
    lengthRecommendation: 'Length Recommendation',
    analysisPerformed: 'Analysis performed',
    noAnalysisYet: 'No market analysis yet',
    noAnalysisDescription: 'Click "Analyze Market" to search for comparable titles and understand your novel\'s positioning in the current market.',
    discoveryKeywords: 'Discovery Keywords',
    regenerate: 'Regenerate',
    suggestKeywords: 'Suggest Keywords',
    keywordDescription: 'Generate SEO-friendly keywords to improve discoverability on Amazon, Goodreads, and other platforms.',
    clickSuggestKeywords: 'Click "Suggest Keywords" to generate discovery keywords for your novel.',
    keywordsGenerated: 'Keywords generated!',
    keywordsCopied: 'Keywords copied!',
    failedToCopy: 'Failed to copy',
    copyAllKeywords: 'Copy all keywords',
    copied: 'Copied!',
    marketAnalysisComplete: 'Market analysis complete',
    failedToAnalyzeMarket: 'Failed to analyze market',
    similarity: 'Similarity',
    by: 'by',
  },
  common: {
    search: 'Search',
    filter: 'Filter',
    sortBy: 'Sort by',
    ascending: 'Ascending',
    descending: 'Descending',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    selected: 'selected',
    all: 'All',
    none: 'None',
    add: 'Add',
    remove: 'Remove',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    page: 'Page',
    of: 'of',
    items: 'items',
    noResults: 'No results found',
    tryAgain: 'Try again',
  },
  toasts: {
    saveSuccess: 'Saved successfully',
    saveError: 'Failed to save',
    deleteSuccess: 'Deleted successfully',
    deleteError: 'Failed to delete',
    generateSuccess: 'Generated successfully',
    generateError: 'Failed to generate',
    saved: 'Saved',
    saving: 'Saving...',
    allChangesSaved: 'All changes are saved',
    savingChanges: 'Saving your changes',
    focusMode: 'Focus Mode',
    normalMode: 'Normal Mode',
    focusModeExit: 'Press F11 or Escape to exit',
    sidebarRestored: 'Sidebar and footer restored',
  },
  dialogs: {
    deleteScene: 'Delete Scene',
    deleteCharacter: 'Delete Character',
    deletePlotBeat: 'Delete Plot Beat',
    deleteSubplot: 'Delete Subplot',
    deleteRelationship: 'Delete Relationship',
    confirmDelete: 'Are you sure you want to delete this?',
    cannotBeUndone: 'This action cannot be undone.',
  },
  milestones: {
    completeSpecification: 'Complete specification',
    definePlotStructure: 'Define plot structure',
    createCharacters: 'Create 2+ characters',
    createScenes: 'Create 3+ scenes',
    writeChapterContent: 'Write chapter content',
    completeReview: 'Complete a review',
  },
  ariaLabels: {
    closeDialog: 'Close dialog',
    closeModal: 'Close modal',
    expandInspector: 'Expand inspector',
    collapseInspector: 'Collapse inspector',
    editCharacter: 'Edit character',
    deleteCharacter: 'Delete character',
    editScene: 'Edit scene',
    deleteScene: 'Delete scene',
    navigation: 'Navigation',
    mainNavigation: 'Main navigation',
    mainHeader: 'Main header',
    mainContent: 'Main content',
  },
}

const de: Translations = {
  nav: {
    plan: 'PLANEN',
    build: 'AUFBAUEN',
    write: 'SCHREIBEN',
    publish: 'VERÖFFENTLICHEN',
  },
  navItems: {
    specification: 'Spezifikation',
    brainstorm: 'Brainstorming',
    plot: 'Handlung',
    characters: 'Charaktere',
    scenes: 'Szenen',
    wiki: 'Wiki',
    draft: 'Entwurf',
    review: 'Überarbeitung',
    stats: 'Statistiken',
    export: 'Export',
    market: 'Markt',
  },
  projectSwitcher: {
    project: 'Projekt',
    allProjects: 'Alle Projekte',
    recent: 'Zuletzt verwendet',
  },
  phases: {
    specification: 'Spezifikation',
    plotting: 'Handlungsplanung',
    characters: 'Charaktere',
    scenes: 'Szenen',
    writing: 'Schreiben',
    revision: 'Überarbeitung',
    complete: 'Abgeschlossen',
  },
  phaseProgress: {
    phase: 'Phase',
    nextMilestone: 'Nächster Schritt',
  },
  starTooltip: {
    title: 'Empfohlen',
    description: 'Basierend auf deinem Fortschritt ist dieser Bereich als nächstes am sinnvollsten.',
  },
  lockTooltip: {
    locked: 'Gesperrt',
    completeToUnlock: 'Zum Freischalten erforderlich:',
    progress: 'Fortschritt',
    requirements: {
      specification: 'Vervollständige zuerst die Roman-Spezifikation',
      plot: 'Füge mindestens 3 Handlungspunkte hinzu',
      characters: 'Erstelle mindestens 2 Charaktere',
      scenes: 'Füge mindestens 5 Szenen hinzu',
      write: 'Schließe die Szenenplanung ab',
      review: 'Schreibe mindestens ein Kapitel',
    },
  },
  actions: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    create: 'Erstellen',
    generate: 'Generieren',
    close: 'Schließen',
    apply: 'Anwenden',
    reset: 'Zurücksetzen',
    expand: 'Erweitern',
    collapse: 'Einklappen',
  },
  specification: {
    title: 'Roman-Spezifikation',
    subtitle: 'Definiere alle Parameter, die deinen Roman formen, bevor du mit dem Schreiben beginnst.',
    resetToDefaults: 'Auf Standard zurücksetzen',
    basicInfo: 'Grundinformationen',
    workingTitle: 'Arbeitstitel',
    authorName: 'Autorenname',
    quickStartTemplates: 'Schnellstart-Vorlagen',
    templatesDescription: 'Wähle eine Vorlage, um Einstellungen für dein Genre vorzufüllen. Du kannst alles später anpassen.',
    genre: 'Genre',
    primaryGenres: 'Hauptgenre(s)',
    subgenres: 'Subgenre(s)',
    targetAudience: 'Zielgruppe',
    writingStyle: 'Schreibstil',
    styleReference: 'Stil-Referenz (bekannter Autor)',
    customStyleNotes: 'Eigene Stil-Notizen',
    tone: 'Tonfall',
    narrativeStructure: 'Erzählstruktur',
    pointOfView: 'Erzählperspektive',
    tense: 'Zeitform',
    lengthTargets: 'Längenziele',
    targetWordCount: 'Ziel-Wortanzahl',
    targetChapterCount: 'Ziel-Kapitelanzahl',
    minChapterLength: 'Min. Kapitellänge (Wörter)',
    maxChapterLength: 'Max. Kapitellänge (Wörter)',
    setting: 'Schauplatz',
    settingTypes: 'Schauplatz-Art(en)',
    timePeriod: 'Zeitraum',
    themes: 'Themen',
    themesDescription: 'Wähle Themen, die zu deiner Geschichte passen',
    suggestThemes: 'Themen vorschlagen',
    pacingComplexity: 'Tempo & Komplexität',
    pacing: 'Tempo',
    complexity: 'Komplexität',
    slowBurn: 'Langsam aufbauend',
    fastPaced: 'Schnelles Tempo',
    simpleLinear: 'Einfach/Linear',
    complex: 'Komplex',
    // Vorlagen
    presets: 'Vorlagen',
    savePreset: 'Vorlage speichern',
    loadPreset: 'Vorlage laden',
    deletePreset: 'Vorlage löschen',
    presetName: 'Vorlagenname',
    presetNamePlaceholder: 'Mein Fantasy-Setup',
    presetSaved: 'Vorlage gespeichert',
    presetLoaded: 'Vorlage geladen',
    presetDeleted: 'Vorlage gelöscht',
    noPresetsYet: 'Noch keine gespeicherten Vorlagen',
    noPresetsDescription: 'Speichere deine aktuellen Spezifikationseinstellungen als Vorlage, um sie schnell auf zukünftige Projekte anzuwenden.',
    confirmDeletePreset: 'Diese Vorlage löschen?',
    saveCurrentSettings: 'Aktuelle Einstellungen speichern',
    myPresets: 'Meine Vorlagen',
  },
  templates: {
    epicFantasy: 'Epische Fantasy',
    epicFantasyDesc: 'Große Weltenbau, mehrere Perspektiven, komplexe Handlung',
    cozyMystery: 'Gemütlicher Krimi',
    cozyMysteryDesc: 'Leichtherzig, Hobbydetektiv, kleine Gemeinschaft',
    spaceOpera: 'Space Opera',
    spaceOperaDesc: 'Große Weltraumabenteuer, außerirdische Zivilisationen',
    contemporaryRomance: 'Zeitgenössische Romanze',
    contemporaryRomanceDesc: 'Moderne Liebesgeschichten, emotionale Tiefe',
    psychologicalThriller: 'Psychothriller',
    psychologicalThrillerDesc: 'Psychospiele, unzuverlässige Erzähler, Spannung',
    yaComingOfAge: 'Jugendroman',
    yaComingOfAgeDesc: 'Jugendliche Protagonisten, erste Erfahrungen, Wachstum',
    popular: 'Beliebt',
  },
  audiences: {
    children: 'Kinder',
    middleGrade: 'Mittelstufe',
    ya: 'Jugendliche',
    newAdult: 'Junge Erwachsene',
    adult: 'Erwachsene',
  },
  novelLanguage: {
    label: 'Romansprache',
    description: 'Die Sprache, in der dein Roman geschrieben wird. Dies beeinflusst KI-generierte Inhalte.',
    options: {
      en: 'Englisch (English)',
      de: 'Deutsch',
      fr: 'Französisch (Français)',
      es: 'Spanisch (Español)',
      it: 'Italienisch (Italiano)',
    },
  },
  ageCategories: {
    label: 'Alterskategorie',
    description: 'Wähle die Altersgruppe deiner Zielleser',
    options: {
      '4-6': '4-6 Jahre',
      '4-6-desc': 'Bilderbücher, Erstleser',
      '7-10': '7-10 Jahre',
      '7-10-desc': 'Kinderbücher, Frühe Mittelstufe',
      '11-14': '11-14 Jahre',
      '11-14-desc': 'Mittelstufe, Tween-Literatur',
      '15-18': '15-18 Jahre',
      '15-18-desc': 'Jugendbücher, Young Adult',
    },
  },
  povOptions: {
    firstPerson: 'Ich-Perspektive',
    thirdLimited: 'Dritte Person (begrenzt)',
    thirdOmniscient: 'Dritte Person (allwissend)',
    secondPerson: 'Du-Perspektive',
    multiplePov: 'Mehrere Perspektiven',
  },
  tenseOptions: {
    past: 'Vergangenheit',
    present: 'Gegenwart',
  },
  settings: {
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
  },
  emptyStates: {
    noChapters: 'Noch keine Kapitel',
    startWriting: 'Schreiben beginnen',
    selectChapter: 'Kapitel auswählen',
  },
  status: {
    outline: 'Gliederung',
    draft: 'Entwurf',
    revision: 'Überarbeitung',
    final: 'Final',
    locked: 'Gesperrt',
  },
  placeholders: {
    enterTitle: 'Gib den Titel deines Romans ein',
    penName: 'Dein Name oder Pseudonym',
    selectAuthor: 'Autor auswählen...',
    searchAuthors: 'Autoren suchen...',
    styleNotes: 'z.B. sparsam aber ausdrucksstark',
    tone: 'z.B. Düster und rau mit Momenten schwarzen Humors',
    suggestTone: 'KI-Tonfall-Vorschläge',
    suggestTitles: 'KI-Titelvorschläge',
    timePeriod: 'z.B. Gegenwart, Viktorianisches Zeitalter, 2150 n.Chr.',
    typicalWordCount: 'Typisch: 50.000 - 120.000 Wörter',
    searchCharacters: 'Charaktere suchen...',
    searchScenes: 'Szenen suchen...',
    searchPlot: 'Handlungspunkte suchen...',
  },
  characters: {
    title: 'Charaktere',
    cards: 'Charakterkarten',
    relationships: 'Beziehungsliste',
    relationshipMap: 'Beziehungskarte',
    voiceDna: 'Stimm-DNA-Analyse',
    allRoles: 'Alle Rollen',
    allStatuses: 'Alle Status',
    sort: 'Sortieren',
    noCharactersYet: 'Noch keine Charaktere',
    noMatchingCharacters: 'Keine passenden Charaktere',
    needMoreCharacters: 'Mehr Charaktere benötigt',
    noRelationshipsYet: 'Noch keine Beziehungen',
    createFirstCharacter: 'Erstelle deinen ersten Charakter',
    adjustFilters: 'Versuche die Filter oder Suche anzupassen',
    addMoreCharacters: 'Füge mindestens 2 Charaktere hinzu, um Beziehungen zu erstellen',
    createRelationship: 'Erstelle eine Beziehung zwischen Charakteren',
    chooseCharacter: 'Wähle deinen Charakter',
    deleteConfirm: 'Charakter(e) löschen?',
    characterRelationships: 'Charakterbeziehungen',
    addDepth: 'Psychologische Tiefe mit KI hinzufügen',
    editCharacter: 'Charakter bearbeiten',
    deleteCharacter: 'Charakter löschen',
    editRelationship: 'Beziehung bearbeiten',
    deleteRelationship: 'Beziehung löschen',
    firstAppearance: 'Erster Auftritt',
    strengths: 'Stärken',
    flaws: 'Schwächen',
    approach: 'Ansatz',
    analyzeDialogue: 'Dialogmuster zwischen Charakteren analysieren',
    roles: {
      protagonist: 'Protagonist',
      antagonist: 'Antagonist',
      supporting: 'Nebenrolle',
      minor: 'Kleinrolle',
    },
    statuses: {
      alive: 'Lebend',
      deceased: 'Verstorben',
      unknown: 'Unbekannt',
    },
  },
  plot: {
    title: 'Handlung',
    timeline: 'Zeitstrahl',
    storyBeats: 'Handlungspunkte',
    subplots: 'Nebenhandlungen',
    canvas: 'Leinwand',
    addBeat: 'Punkt hinzufügen',
    noBeatYet: 'Noch keine Handlungspunkte',
    createFirstBeat: 'Erstelle deinen ersten Handlungspunkt',
    beatTypes: {
      hook: 'Aufhänger',
      incitingIncident: 'Auslösendes Ereignis',
      plotPoint1: 'Wendepunkt 1',
      pinch1: 'Druckpunkt 1',
      midpoint: 'Mittelpunkt',
      pinch2: 'Druckpunkt 2',
      plotPoint2: 'Wendepunkt 2',
      climax: 'Höhepunkt',
      resolution: 'Auflösung',
    },
  },
  scenes: {
    title: 'Szenen',
    subtitle: 'Erstelle detaillierte Szenen-Blaupausen mit Zeitstrahl- und Kapitelansichten.',
    list: 'Szenenliste',
    timeline: 'Zeitstrahl',
    cards: 'Karten',
    chapters: 'Kapitel',
    matrix: 'Matrix',
    noScenesYet: 'Noch keine Szenen',
    createFirstScene: 'Erste Szene erstellen',
    sceneGoal: 'Ziel',
    sceneConflict: 'Konflikt',
    sceneOutcome: 'Ergebnis',
    characters: 'Charaktere',
    location: 'Ort',
    timeOfDay: 'Tageszeit',
    wordCount: 'Wortanzahl',
    estimatedWords: 'geschätzte Wörter',
    newScene: 'Neue Szene',
    generate3Options: '3 Optionen generieren',
    aiGeneratedSuggestions: 'KI-generierte Szenenvorschläge',
    noScenesToDisplay: 'Keine Szenen anzuzeigen. Erstelle Szenen und weise sie Kapiteln zu.',
    createScenesAssignChapters: 'Beginne deine Geschichte mit Szenen-Blaupausen zu entwickeln.',
    unassignedScenes: 'Nicht zugewiesene Szenen',
    totalEstimatedWords: 'Geschätzte Gesamtwörter',
    sceneOrderUpdated: 'Szenenreihenfolge aktualisiert',
    failedToReorderScenes: 'Szenenreihenfolge konnte nicht geändert werden',
    sceneUpdated: 'Szene aktualisiert',
    sceneCreated: 'Szene erstellt',
    failedToSaveScene: 'Szene konnte nicht gespeichert werden',
    sceneDeleted: 'Szene gelöscht',
    failedToDeleteScene: 'Szene konnte nicht gelöscht werden',
    chooseSceneApproach: 'Wähle einen Szenenansatz',
    selectSceneApproach: 'Wähle einen der folgenden Szenenansätze, um deine neue Szene zu erstellen:',
    conflict: 'Konflikt',
    tone: 'Tonfall',
    emotionArc: 'Emotionsbogen',
    generatedProse: 'Generierter Prosa-Text',
    proseSavedTo: 'Prosa gespeichert in',
    failedToGenerateProse: 'Prosa konnte nicht generiert werden',
    failedToSaveProse: 'Prosa konnte nicht gespeichert werden',
    saveToScene: 'In Szene speichern',
    words: 'Wörter',
    generatingProse: 'Generiere Prosa',
    generatingSceneOptions: 'Generiere Szenenoptionen',
    setsUp: 'Bereitet vor:',
    paysOff: 'Zahlt aus:',
    start: 'Start',
    end: 'Ende',
    pov: 'POV',
    generateProse: 'Prosa aus Gliederung generieren',
  },
  write: {
    title: 'Schreiben',
    selectChapter: 'Kapitel auswählen',
    noChaptersYet: 'Noch keine Kapitel',
    createFirstChapter: 'Erstelle dein erstes Kapitel',
    wordCount: 'Wörter',
    targetWords: 'Ziel',
    progress: 'Fortschritt',
    autoSave: 'Automatisch speichern',
    lastSaved: 'Zuletzt gespeichert',
    generate: 'Generieren',
    regenerate: 'Neu generieren',
  },
  brainstorm: {
    title: 'Brainstorming',
    ideas: 'Ideen',
    mindMap: 'Mindmap',
    noIdeasYet: 'Noch keine Ideen',
    addIdea: 'Idee hinzufügen',
    generateIdeas: 'Ideen generieren',
    brainstormMode: 'Brainstorming-Modus',
    writeFreely: 'Schreibe frei über deine Geschichte. Mach dir keine Sorgen um die Struktur—halte einfach deine Ideen fest.',
    hidePrompts: 'Tipps ausblenden',
    showPrompts: 'Tipps anzeigen',
    needInspiration: 'Brauchst du Inspiration? Überlege:',
    optionalTags: 'Optionale Tags:',
    startWritingPlaceholder: 'Beginne hier deine Ideen aufzuschreiben... Worum geht es in der Geschichte? Wer sind die Charaktere? Welche Szenen stellst du dir vor? Lass es einfach fließen...',
    words: 'Wörter',
    analyzeAndGenerateQuestions: 'Analysieren & Fragen generieren',
    analyzingBrainstorm: 'Analysiere dein Brainstorming...',
    findingElements: 'Finde Story-Elemente, Themen und mögliche Fragen',
    clarifyVision: 'Lass uns deine Vision klären',
    answerQuestions: 'Beantworte diese Fragen, um deine Geschichte zu formen. Überspringe alle, bei denen du unsicher bist.',
    questionOf: 'Frage {current} von {total}',
    complete: 'abgeschlossen',
    fromYourBrainstorm: 'Aus deinem Brainstorming:',
    yourThoughts: 'Deine Gedanken...',
    skipQuestion: 'Diese Frage überspringen',
    nextQuestion: 'Nächste Frage',
    storyFoundations: 'Deine Story-Grundlagen',
    reviewSelect: 'Überprüfe und wähle die Elemente aus, die du weiterentwickeln möchtest. Ausgewählte Elemente werden an Handlung, Charaktere und Szenen gesendet.',
    plotFoundation: 'Handlungs-Grundlage',
    characterFoundation: 'Charakter-Grundlage',
    sceneFoundation: 'Szenen-Grundlage',
    premise: 'Prämisse',
    centralConflict: 'Zentraler Konflikt',
    keyPlotPoints: 'Wichtige Handlungspunkte',
    identifiedCharacters: 'Identifizierte Charaktere',
    suggestedArchetypes: 'Vorgeschlagene Archetypen zum Hinzufügen',
    envisionedScenes: 'Vorgestellte Szenen',
    keyMoments: 'Schlüsselmomente',
    backToBrainstorm: 'Zurück zum Brainstorming',
    finalizeAndContinue: 'Abschließen & zur Entwicklung fortfahren',
    brainstormComplete: 'Brainstorming abgeschlossen!',
    foundationsPrepared: 'Deine Grundlagen wurden vorbereitet. Fahre mit Handlung, Charakteren oder Szenen fort, um sie weiterzuentwickeln.',
    seedsReady: 'Ideen bereit',
    returnToAddMore: 'Zurück zum Brainstorming, um mehr hinzuzufügen',
    tags: {
      character: 'Charakter',
      setting: 'Schauplatz',
      plot: 'Handlung',
      theme: 'Thema',
      scene: 'Szene',
      question: 'Frage',
      inspiration: 'Inspiration',
    },
    prompts: {
      coreStory: 'Was ist die zentrale Geschichte, die du erzählen möchtest?',
      mainPeople: 'Wer sind die Hauptpersonen in dieser Geschichte?',
      clearScenes: 'Welche Szenen siehst du bereits klar vor dir?',
      readerFeeling: 'Welches Gefühl sollen die Leser haben?',
      inspiration: 'Was hat diese Idee inspiriert?',
      ownQuestions: 'Welche Fragen hast du über deine eigene Geschichte?',
    },
  },
  review: {
    title: 'Überarbeitung',
    critique: 'KI-Kritik',
    readerSimulator: 'Leser-Simulator',
    continuity: 'Kontinuitätsprüfung',
    analyze: 'Analysieren',
    noChaptersToReview: 'Keine Kapitel zum Überprüfen',
  },
  wiki: {
    title: 'Weltenbau-Wiki',
    subtitle: 'Halte interne Konsistenz mit organisierten Weltenbau-Details aufrecht.',
    entries: 'Einträge',
    categories: 'Kategorien',
    noEntriesYet: 'Noch keine Wiki-Einträge',
    createEntry: 'Eintrag erstellen',
    searchEntries: 'Einträge suchen...',
    addEntry: 'Eintrag hinzufügen',
    extractFromChapters: 'Aus Kapiteln extrahieren',
    extractFromChaptersDesc: 'Kapitel nach Orten, Begriffen und Gegenständen durchsuchen',
    noChapterContent: 'Kein Kapitelinhalt zum Analysieren',
    extractingElements: 'Wiki-Elemente aus Kapiteln extrahieren',
    expandingEntry: 'Erweitere',
    noMatchingEntries: 'Keine passenden Einträge gefunden',
    clearFilters: 'Filter löschen',
    autoLinkedFrom: 'automatisch von Charakteren verknüpft',
    clickToViewCharacters: 'Klicken, um in Charakteren anzuzeigen',
    expandWithAI: 'Mit KI-generierten Details erweitern',
    editEntry: 'Eintrag bearbeiten',
    deleteEntry: 'Eintrag löschen',
    sources: 'Quellen:',
    related: 'Verwandt:',
    more: 'mehr',
    extractedElements: 'Extrahierte Wiki-Elemente',
    foundPotentialEntries: 'Wiki-Einträge aus deinen Kapiteln gefunden:',
    addAllToWiki: 'Alle zum Wiki hinzufügen',
    createFirstEntry: 'Ersten Eintrag erstellen',
    startBuildingWorld: 'Beginne deine Welt aufzubauen, indem du Orte, Gegenstände und Wissen dokumentierst.',
    allCategories: 'Alle Kategorien',
    locations: 'Orte',
    characters: 'Charaktere',
    timeline: 'Zeitstrahl',
    magicTechnology: 'Magie/Technologie',
    culturesFactions: 'Kulturen/Fraktionen',
    objects: 'Gegenstände',
    terminology: 'Begriffe',
    rules: 'Regeln',
    wikiEntryUpdated: 'Wiki-Eintrag aktualisiert',
    wikiEntryCreated: 'Wiki-Eintrag erstellt',
    failedToSaveEntry: 'Wiki-Eintrag konnte nicht gespeichert werden',
    wikiEntryDeleted: 'Wiki-Eintrag gelöscht',
    failedToDeleteEntry: 'Wiki-Eintrag konnte nicht gelöscht werden',
    addedEntries: 'Wiki-Einträge hinzugefügt',
    failedToAddEntries: 'Einträge konnten nicht hinzugefügt werden',
    expandedEntry: 'Erweitert',
    failedToExpandEntry: 'Eintrag konnte nicht erweitert werden',
    failedToExtract: 'Elemente konnten nicht extrahiert werden',
  },
  stats: {
    title: 'Statistiken',
    overview: 'Übersicht',
    progress: 'Fortschritt',
    wordCountHistory: 'Wortzahl-Verlauf',
    dailyGoal: 'Tagesziel',
    totalWords: 'Gesamtwörter',
    chaptersCompleted: 'Kapitel abgeschlossen',
    averageWordsPerDay: 'Durchschnitt Wörter/Tag',
  },
  export: {
    title: 'Exportieren',
    format: 'Format',
    options: 'Optionen',
    exportNow: 'Jetzt exportieren',
    formats: {
      pdf: 'PDF-Dokument',
      epub: 'EPUB eBook',
      docx: 'Word-Dokument',
      markdown: 'Markdown',
      json: 'JSON-Backup',
    },
    subtitle: 'Exportiere dein Manuskript in professionellen Formaten oder sichere dein Projekt.',
    jsonBackup: 'JSON-Backup',
    fullProjectExport: 'Vollständiger Projektexport',
    jsonDescription: 'Exportiere dein gesamtes Projekt inklusive aller Charaktere, Szenen, Kapitel und Einstellungen. Nutze dies für Backups oder zum Transfer zwischen Geräten.',
    exportJson: 'JSON exportieren',
    plainTextManuscript: 'Klartext-Manuskript',
    markdownDescription: 'Exportiere dein Manuskript als Markdown-Datei. Ideal zum Lesen auf jedem Gerät oder zur Konvertierung in andere Formate.',
    exportMarkdown: 'Markdown exportieren',
    importProject: 'Projekt importieren',
    restoreFromBackup: 'Aus Backup wiederherstellen',
    importDescription: 'Importiere ein zuvor exportiertes JSON-Backup. Dies erstellt ein neues Projekt mit allen wiederhergestellten Daten.',
    importJson: 'JSON importieren',
    professionalFormats: 'Professionelle Formate',
    docxExport: 'DOCX-Export',
    professionalManuscript: 'Professionelles Manuskriptformat',
    docxDescription: 'Exportiere dein Manuskript als DOCX-Datei mit professioneller Formatierung. Wähle eine Vorlage, die zu deinen Bedürfnissen passt.',
    formatPreset: 'Format-Vorlage',
    exportDocx: 'DOCX exportieren',
    selected: 'Ausgewählt',
    aiPublishingTools: 'KI-Veröffentlichungstools',
    aiToolsDescription: 'Generiere professionelle Veröffentlichungsmaterialien mit KI-Unterstützung.',
    synopsis: 'Synopsis',
    storySummaryForAgents: 'Geschichte-Zusammenfassung für Agenten',
    synopsisDescription: 'Generiere eine Synopsis deines Romans in verschiedenen Längen für Query-Einreichungen.',
    elevatorPitch: 'Elevator Pitch (2-3 Sätze)',
    onePageSynopsis: 'Einseitige Synopsis',
    twoPageSynopsis: 'Zweiseitige Synopsis',
    queryLetter: 'Query-Brief',
    industryStandardFormat: 'Branchenstandard-Format',
    queryLetterDescription: 'Generiere einen professionellen Query-Brief, um deinen Roman bei Literaturagenten vorzustellen.',
    generateQueryLetter: 'Query-Brief generieren',
    bookDescription: 'Buchbeschreibung',
    backCoverCopy: 'Klappentext',
    bookDescriptionDescription: 'Generiere einen fesselnden Klappentext, der Leser begeistert und deine Geschichte verkauft.',
    generateDescription: 'Beschreibung generieren',
    copyToClipboard: 'In Zwischenablage kopieren',
    copied: 'Kopiert!',
    close: 'Schließen',
    projectExportedJson: 'Projekt als JSON exportiert',
    projectExportedMarkdown: 'Projekt als Markdown exportiert',
    exportedDocxFormat: 'Als DOCX mit {format}-Format exportiert',
    failedExport: 'Export fehlgeschlagen',
    failedExportDocx: 'DOCX-Export fehlgeschlagen',
    projectImported: 'Projekt "{title}" erfolgreich importiert',
    failedImport: 'Import fehlgeschlagen. Stelle sicher, dass die Datei ein gültiger Storyflow-JSON-Export ist.',
    generating: '{type} wird generiert',
    synopsisGenerated: '{type} generiert!',
    queryLetterGenerated: 'Query-Brief generiert!',
    bookDescriptionGenerated: 'Buchbeschreibung generiert!',
    failedGenerateSynopsis: 'Synopsis-Generierung fehlgeschlagen',
    failedGenerateQueryLetter: 'Query-Brief-Generierung fehlgeschlagen',
    failedGenerateBookDescription: 'Buchbeschreibungs-Generierung fehlgeschlagen',
    copiedToClipboard: 'Inhalt in Zwischenablage kopiert',
    failedCopyClipboard: 'Kopieren in Zwischenablage fehlgeschlagen',
  },
  market: {
    title: 'Marktanalyse',
    subtitle: 'Positioniere deinen Roman wettbewerbsfähig in seinem Genre.',
    analysis: 'Analyse',
    comparables: 'Vergleichstitel',
    positioning: 'Positionierung',
    runAnalysis: 'Analyse starten',
    competitiveAnalysis: 'Wettbewerbsanalyse',
    analyzeGenreMarket: 'Analysiere den {genre}-Markt und finde vergleichbare Titel',
    setGenreFirst: 'Lege zuerst dein Genre in der Spezifikation fest',
    analyzing: 'Analysiere...',
    reAnalyze: 'Erneut analysieren',
    analyzeMarket: 'Markt analysieren',
    searchingComparables: 'Suche nach vergleichbaren Titeln und Markttrends...',
    currentBestsellers: 'Aktuelle Bestseller in deinem Genre',
    genrePositioning: 'Genre-Positionierung',
    yourUniqueAngle: 'Dein Alleinstellungsmerkmal',
    readerExpectations: 'Lesererwartungen',
    lengthRecommendation: 'Längenempfehlung',
    analysisPerformed: 'Analyse durchgeführt',
    noAnalysisYet: 'Noch keine Marktanalyse',
    noAnalysisDescription: 'Klicke auf "Markt analysieren", um vergleichbare Titel zu finden und die Positionierung deines Romans zu verstehen.',
    discoveryKeywords: 'Entdeckungs-Schlüsselwörter',
    regenerate: 'Neu generieren',
    suggestKeywords: 'Schlüsselwörter vorschlagen',
    keywordDescription: 'Generiere SEO-freundliche Schlüsselwörter für bessere Auffindbarkeit auf Amazon, Goodreads und anderen Plattformen.',
    clickSuggestKeywords: 'Klicke auf "Schlüsselwörter vorschlagen", um Entdeckungs-Schlüsselwörter für deinen Roman zu generieren.',
    keywordsGenerated: 'Schlüsselwörter generiert!',
    keywordsCopied: 'Schlüsselwörter kopiert!',
    failedToCopy: 'Kopieren fehlgeschlagen',
    copyAllKeywords: 'Alle Schlüsselwörter kopieren',
    copied: 'Kopiert!',
    marketAnalysisComplete: 'Marktanalyse abgeschlossen',
    failedToAnalyzeMarket: 'Marktanalyse fehlgeschlagen',
    similarity: 'Ähnlichkeit',
    by: 'von',
  },
  common: {
    search: 'Suchen',
    filter: 'Filtern',
    sortBy: 'Sortieren nach',
    ascending: 'Aufsteigend',
    descending: 'Absteigend',
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    confirm: 'Bestätigen',
    selected: 'ausgewählt',
    all: 'Alle',
    none: 'Keine',
    add: 'Hinzufügen',
    remove: 'Entfernen',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Zurück',
    page: 'Seite',
    of: 'von',
    items: 'Einträge',
    noResults: 'Keine Ergebnisse gefunden',
    tryAgain: 'Erneut versuchen',
  },
  toasts: {
    saveSuccess: 'Erfolgreich gespeichert',
    saveError: 'Speichern fehlgeschlagen',
    deleteSuccess: 'Erfolgreich gelöscht',
    deleteError: 'Löschen fehlgeschlagen',
    generateSuccess: 'Erfolgreich generiert',
    generateError: 'Generierung fehlgeschlagen',
    saved: 'Gespeichert',
    saving: 'Speichern...',
    allChangesSaved: 'Alle Änderungen gespeichert',
    savingChanges: 'Speichere deine Änderungen',
    focusMode: 'Fokus-Modus',
    normalMode: 'Normaler Modus',
    focusModeExit: 'Drücke F11 oder Escape zum Beenden',
    sidebarRestored: 'Seitenleiste und Fußzeile wiederhergestellt',
  },
  dialogs: {
    deleteScene: 'Szene löschen',
    deleteCharacter: 'Charakter löschen',
    deletePlotBeat: 'Handlungspunkt löschen',
    deleteSubplot: 'Nebenhandlung löschen',
    deleteRelationship: 'Beziehung löschen',
    confirmDelete: 'Möchtest du das wirklich löschen?',
    cannotBeUndone: 'Diese Aktion kann nicht rückgängig gemacht werden.',
  },
  milestones: {
    completeSpecification: 'Spezifikation ausfüllen',
    definePlotStructure: 'Handlungsstruktur definieren',
    createCharacters: '2+ Charaktere erstellen',
    createScenes: '3+ Szenen erstellen',
    writeChapterContent: 'Kapitelinhalt schreiben',
    completeReview: 'Überarbeitung abschließen',
  },
  ariaLabels: {
    closeDialog: 'Dialog schließen',
    closeModal: 'Modal schließen',
    expandInspector: 'Inspektor erweitern',
    collapseInspector: 'Inspektor einklappen',
    editCharacter: 'Charakter bearbeiten',
    deleteCharacter: 'Charakter löschen',
    editScene: 'Szene bearbeiten',
    deleteScene: 'Szene löschen',
    navigation: 'Navigation',
    mainNavigation: 'Hauptnavigation',
    mainHeader: 'Kopfzeile',
    mainContent: 'Hauptinhalt',
  },
}

export const translations: Record<Language, Translations> = {
  en,
  de,
}

export function getTranslations(language: Language): Translations {
  return translations[language]
}
