import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, RotateCcw, Sparkles, X, Sword, Search, Rocket, Heart, Brain, Users, Save, Folder, Trash2, type LucideIcon } from 'lucide-react'
import type { Project, NovelSpecification, TargetAudience, POV, Tense, NovelLanguage, ChildrensAgeCategory } from '@/types/project'
import { useLanguageStore } from '@/stores/languageStore'
import {
  updateProject as updateProjectInDb,
  getAllSpecificationPresets,
  createSpecificationPreset,
  deleteSpecificationPreset,
  type SpecificationPreset,
} from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { toast } from '@/components/ui/Toaster'
import { NextStepBanner, type ValidationStatus } from '@/components/ui/NextStepBanner'

interface SectionProps {
  project: Project
}

// Genre options from spec
const GENRES = [
  'Fantasy', 'Science Fiction', 'Mystery', 'Thriller', 'Romance',
  'Horror', 'Literary Fiction', 'Historical Fiction', 'Contemporary Fiction',
  'Young Adult', 'Middle Grade', "Children's"
]

const SUBGENRES: Record<string, string[]> = {
  'Fantasy': ['Epic Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Portal Fantasy'],
  'Science Fiction': ['Space Opera', 'Cyberpunk', 'Hard SF', 'Dystopian', 'Post-Apocalyptic'],
  'Mystery': ['Cozy Mystery', 'Police Procedural', 'Amateur Sleuth', 'Noir'],
  'Thriller': ['Psychological Thriller', 'Legal Thriller', 'Medical Thriller', 'Techno-Thriller'],
  'Romance': ['Contemporary Romance', 'Historical Romance', 'Paranormal Romance', 'Romantic Suspense', 'Romantic Comedy'],
  'Horror': ['Supernatural Horror', 'Psychological Horror', 'Gothic Horror', 'Body Horror', 'Cosmic Horror'],
  'Literary Fiction': ['Coming of Age', 'Family Drama', 'Upmarket Fiction', 'Southern Gothic', 'Magical Realism'],
}

const TARGET_AUDIENCES: TargetAudience[] = ['Children', 'Middle Grade', 'YA', 'New Adult', 'Adult']

// Audiences that show age category selector
const YOUTH_AUDIENCES: TargetAudience[] = ['Children', 'Middle Grade', 'YA']

const NOVEL_LANGUAGES: NovelLanguage[] = ['en', 'de', 'fr', 'es', 'it']

const AGE_CATEGORIES: ChildrensAgeCategory[] = ['4-6', '7-10', '11-14', '15-18']

const POVS: POV[] = ['First Person', 'Third Limited', 'Third Omniscient', 'Second Person', 'Multiple POV']

const TENSES: Tense[] = ['Past', 'Present']

const SETTING_TYPES = [
  'Contemporary', 'Historical', 'Futuristic', 'Fantasy World',
  'Alternate History', 'Post-Apocalyptic', 'Space', 'Urban', 'Rural'
]

const THEMES = [
  'Love', 'Redemption', 'Power', 'Identity', 'Family', 'Loss', 'Survival',
  'Good vs Evil', 'Coming of Age', 'Justice', 'Freedom', 'Sacrifice'
]

const STYLE_AUTHORS = [
  // Classic
  'Hemingway', 'Fitzgerald', 'Austen', 'Dickens', 'C. Bronte', 'E. Bronte',
  'Tolstoy', 'Dostoevsky', 'Woolf', 'Joyce', 'Faulkner', 'Steinbeck',
  'Twain', 'Melville', 'Hawthorne',
  // Contemporary Literary
  'Atwood', 'Morrison', 'McCarthy', 'Ishiguro', 'Murakami', 'Tartt',
  'Franzen', 'Eugenides', 'Lahiri', 'Adichie', 'Mantel', 'McEwan',
  'Toibin', 'Ferrante',
  // Genre Masters
  'King', 'Christie', 'Asimov', 'Le Guin', 'Patterson', 'Nora Roberts',
  'Gaiman', 'Sanderson', 'Child', 'Grisham', 'Clancy', 'Koontz',
  'Steel', 'Kellerman',
  // Voice/Style Distinctive
  'Pratchett', 'Adams', 'Palahniuk', 'Welsh', 'Vonnegut', 'Thompson',
  'Rowling', 'Martin', 'Rothfuss', 'Butcher'
]

// Genre templates with pre-filled defaults
type TemplateId = 'epicFantasy' | 'cozyMystery' | 'spaceOpera' | 'contemporaryRomance' | 'psychologicalThriller' | 'yaComingOfAge'

interface GenreTemplate {
  id: TemplateId
  icon: LucideIcon
  color: string
  popular?: boolean
  defaults: Partial<NovelSpecification>
}

const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    id: 'epicFantasy',
    icon: Sword,
    color: 'from-purple-500 to-indigo-600',
    popular: true,
    defaults: {
      genre: ['Fantasy'],
      subgenre: ['Epic Fantasy'],
      targetAudience: 'Adult',
      writingStyle: { reference: 'Sanderson', custom: '' },
      pov: 'Multiple POV',
      tense: 'Past',
      targetWordCount: 120000,
      targetChapterCount: 40,
      chapterLengthRange: { min: 3000, max: 6000 },
      settingType: ['Fantasy World'],
      themes: ['Good vs Evil', 'Power', 'Redemption'],
      pacing: 5,
      complexity: 8,
    }
  },
  {
    id: 'cozyMystery',
    icon: Search,
    color: 'from-amber-500 to-orange-600',
    defaults: {
      genre: ['Mystery'],
      subgenre: ['Cozy Mystery'],
      targetAudience: 'Adult',
      writingStyle: { reference: 'Christie', custom: '' },
      pov: 'First Person',
      tense: 'Past',
      targetWordCount: 65000,
      targetChapterCount: 20,
      chapterLengthRange: { min: 2500, max: 4000 },
      settingType: ['Contemporary', 'Rural'],
      themes: ['Justice', 'Family'],
      pacing: 5,
      complexity: 4,
    }
  },
  {
    id: 'spaceOpera',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-600',
    defaults: {
      genre: ['Science Fiction'],
      subgenre: ['Space Opera'],
      targetAudience: 'Adult',
      writingStyle: { reference: '', custom: 'cinematic, adventurous' },
      pov: 'Third Limited',
      tense: 'Past',
      targetWordCount: 100000,
      targetChapterCount: 30,
      chapterLengthRange: { min: 3000, max: 5000 },
      settingType: ['Space', 'Futuristic'],
      themes: ['Survival', 'Freedom', 'Power'],
      pacing: 7,
      complexity: 6,
    }
  },
  {
    id: 'contemporaryRomance',
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    popular: true,
    defaults: {
      genre: ['Romance'],
      subgenre: ['Contemporary Romance'],
      targetAudience: 'Adult',
      writingStyle: { reference: '', custom: 'warm, emotionally engaging' },
      pov: 'First Person',
      tense: 'Present',
      targetWordCount: 75000,
      targetChapterCount: 25,
      chapterLengthRange: { min: 2000, max: 4000 },
      settingType: ['Contemporary', 'Urban'],
      themes: ['Love', 'Identity', 'Family'],
      pacing: 6,
      complexity: 4,
    }
  },
  {
    id: 'psychologicalThriller',
    icon: Brain,
    color: 'from-gray-500 to-slate-600',
    defaults: {
      genre: ['Thriller'],
      subgenre: ['Psychological Thriller'],
      targetAudience: 'Adult',
      writingStyle: { reference: '', custom: 'tense, unreliable perspective' },
      pov: 'First Person',
      tense: 'Present',
      targetWordCount: 85000,
      targetChapterCount: 30,
      chapterLengthRange: { min: 2000, max: 4000 },
      settingType: ['Contemporary'],
      themes: ['Identity', 'Loss', 'Justice'],
      pacing: 8,
      complexity: 7,
    }
  },
  {
    id: 'yaComingOfAge',
    icon: Users,
    color: 'from-green-500 to-teal-600',
    popular: true,
    defaults: {
      genre: ['Young Adult'],
      subgenre: [],
      targetAudience: 'YA',
      writingStyle: { reference: 'Rowling', custom: '' },
      pov: 'First Person',
      tense: 'Past',
      targetWordCount: 70000,
      targetChapterCount: 25,
      chapterLengthRange: { min: 2000, max: 4000 },
      settingType: ['Contemporary'],
      themes: ['Coming of Age', 'Identity', 'Family'],
      pacing: 6,
      complexity: 4,
    }
  },
]

const defaultSpecification: NovelSpecification = {
  genre: [],
  subgenre: [],
  targetAudience: 'Adult',
  novelLanguage: 'en',
  writingStyle: { reference: '', custom: '' },
  tone: '',
  pov: 'Third Limited',
  tense: 'Past',
  targetWordCount: 80000,
  targetChapterCount: 25,
  chapterLengthRange: { min: 2000, max: 5000 },
  settingType: [],
  timePeriod: 'Present day',
  themes: [],
  pacing: 5,
  complexity: 5,
}

// Accordion section component for collapsible form sections
interface AccordionSectionProps {
  title: string
  id: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ title, id, isExpanded, onToggle, children }: AccordionSectionProps) {
  return (
    <section className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        )}
      </button>
      {isExpanded && (
        <div id={`${id}-content`} className="px-6 pb-6">
          {children}
        </div>
      )}
    </section>
  )
}

export function SpecificationSection({ project }: SectionProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const { updateProject, setSaveStatus } = useProjectStore()
  const t = useLanguageStore((state) => state.t)

  const [workingTitle, setWorkingTitle] = useState(project.metadata?.workingTitle || 'Untitled Novel')
  const [authorName, setAuthorName] = useState(project.metadata?.authorName || '')
  const [spec, setSpec] = useState<NovelSpecification>(
    project.specification || defaultSpecification
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Accordion state - all sections expanded by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    language: true,
    templates: true,
    presets: true,
    genre: true,
    audience: true,
    style: true,
    narrative: true,
    length: true,
    setting: true,
    themes: true,
    pacing: true,
  })

  // Check if audience requires age category selection
  const showAgeCategory = YOUTH_AUDIENCES.includes(spec.targetAudience)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  // AI Generation
  const { generate, isGenerating, progress, message, status, cancel, reset: resetAI } = useAIGeneration()
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('Generating Suggestions')
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Validation for NextStepBanner
  const validationStatus = useMemo((): ValidationStatus => {
    const warnings: string[] = []
    const errors: string[] = []

    // Required fields (errors)
    if (!workingTitle.trim() || workingTitle === 'Untitled Novel') {
      errors.push(t.validation.titleRequired)
    }

    // Recommended fields (warnings)
    if (!spec?.genre || spec.genre.length === 0) {
      warnings.push(t.validation.genreRecommended)
    }

    if (!spec?.targetWordCount || spec.targetWordCount < 10000) {
      warnings.push(t.validation.wordCountRecommended)
    }

    if (!spec?.targetAudience) {
      warnings.push(t.validation.audienceRecommended)
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    }
  }, [workingTitle, spec, t])
  const [suggestionType, setSuggestionType] = useState<'title' | 'tone' | 'theme' | null>(null)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)

  // Preset state
  const [presets, setPresets] = useState<SpecificationPreset[]>([])
  const [showSavePresetModal, setShowSavePresetModal] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null)

  // Load presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      const savedPresets = await getAllSpecificationPresets()
      setPresets(savedPresets)
    }
    loadPresets()
  }, [])

  // Save preset handler
  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return

    try {
      await createSpecificationPreset(newPresetName.trim(), spec)
      const updatedPresets = await getAllSpecificationPresets()
      setPresets(updatedPresets)
      setShowSavePresetModal(false)
      setNewPresetName('')
      toast({ title: t.specification.presetSaved, variant: 'success' })
    } catch (error) {
      console.error('Failed to save preset:', error)
      toast({ title: 'Failed to save preset', variant: 'error' })
    }
  }

  // Load preset handler
  const handleLoadPreset = (preset: SpecificationPreset) => {
    setSpec(preset.specification)
    setHasChanges(true)
    toast({ title: t.specification.presetLoaded, variant: 'success' })
  }

  // Delete preset handler
  const handleDeletePreset = async (presetId: string) => {
    try {
      await deleteSpecificationPreset(presetId)
      const updatedPresets = await getAllSpecificationPresets()
      setPresets(updatedPresets)
      setPresetToDelete(null)
      toast({ title: t.specification.presetDeleted, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete preset:', error)
      toast({ title: 'Failed to delete preset', variant: 'error' })
    }
  }

  // Generate title suggestions
  const handleSuggestTitles = async () => {
    setAIProgressTitle('Generating Title Ideas')
    setSuggestionType('title')
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'specification',
        action: 'suggest-titles',
        context: {
          genre: spec.genre,
          themes: spec.themes,
          tone: spec.tone,
          targetAudience: spec.targetAudience,
          currentTitle: workingTitle,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setSuggestions(parsed)
          } else {
            setSuggestions([
              'The Untold Story',
              'Shadows of Tomorrow',
              'Whispers in the Wind',
            ])
          }
        } catch {
          setSuggestions([
            'Beyond the Horizon',
            'The Last Chapter',
            'Echoes of the Heart',
          ])
        }
        setShowSuggestionsModal(true)
      }
    } catch (error) {
      console.error('Failed to generate title suggestions:', error)
      toast({ title: 'Failed to generate suggestions', variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Generate tone suggestions
  const handleSuggestTones = async () => {
    setAIProgressTitle('Generating Tone Ideas')
    setSuggestionType('tone')
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'specification',
        action: 'suggest-tones',
        context: {
          genre: spec.genre,
          themes: spec.themes,
          targetAudience: spec.targetAudience,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setSuggestions(parsed)
          } else {
            setSuggestions([
              'Dark and atmospheric with moments of hope',
              'Witty and fast-paced with emotional depth',
              'Lyrical and contemplative, slowly building tension',
            ])
          }
        } catch {
          setSuggestions([
            'Suspenseful with underlying warmth',
            'Gritty and realistic with dry humor',
            'Dreamlike and surreal with grounded emotions',
          ])
        }
        setShowSuggestionsModal(true)
      }
    } catch (error) {
      console.error('Failed to generate tone suggestions:', error)
      toast({ title: 'Failed to generate suggestions', variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Generate theme suggestions
  const handleSuggestThemes = async () => {
    setAIProgressTitle('Generating Theme Ideas')
    setSuggestionType('theme')
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'specification',
        action: 'suggest-themes',
        context: {
          genre: spec.genre,
          currentThemes: spec.themes,
          targetAudience: spec.targetAudience,
          title: workingTitle,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setSuggestions(parsed)
          } else {
            setSuggestions([
              'The cost of ambition',
              'Finding home after displacement',
              'The weight of secrets',
            ])
          }
        } catch {
          setSuggestions([
            'Redemption through sacrifice',
            'The masks we wear',
            'Memory and identity',
          ])
        }
        setShowSuggestionsModal(true)
      }
    } catch (error) {
      console.error('Failed to generate theme suggestions:', error)
      toast({ title: 'Failed to generate suggestions', variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Apply selected suggestion
  const handleApplySuggestion = (suggestion: string) => {
    if (suggestionType === 'title') {
      handleTitleChange(suggestion)
    } else if (suggestionType === 'tone') {
      updateSpec('tone', suggestion)
    } else if (suggestionType === 'theme') {
      // Add theme if not already in list
      if (!spec.themes.includes(suggestion)) {
        updateSpec('themes', [...spec.themes, suggestion])
      }
    }
    setShowSuggestionsModal(false)
    setSuggestions([])
    setSuggestionType(null)
    toast({ title: 'Suggestion applied', variant: 'success' })
  }

  // Validation function for numeric fields
  const validateNumericField = (
    _field: string,
    value: number,
    min: number,
    max: number,
    label: string
  ): string | null => {
    if (value < min) {
      return `${label} must be at least ${min.toLocaleString()}`
    }
    if (value > max) {
      return `${label} must be at most ${max.toLocaleString()}`
    }
    return null
  }

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return

    // Validate title is required
    if (!workingTitle.trim()) {
      setErrors(prev => ({ ...prev, workingTitle: 'Title is required' }))
      setSaveStatus('unsaved')
      return
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.workingTitle
        return newErrors
      })
    }

    setSaveStatus('saving')

    const updates: Partial<Project> = {
      metadata: {
        ...project.metadata,
        workingTitle,
        authorName,
        lastModified: new Date().toISOString(),
      },
      specification: spec,
      updatedAt: new Date().toISOString(),
    }

    try {
      await updateProjectInDb(project.id, updates)
      updateProject(project.id, updates)
      setSaveStatus('saved')
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save:', error)
      setSaveStatus('unsaved')
    }
  }, [project.id, project.metadata, workingTitle, authorName, spec, hasChanges, updateProject, setSaveStatus])

  // Auto-save when changes occur
  useEffect(() => {
    if (!hasChanges) return

    const timeout = setTimeout(saveChanges, 1000)
    return () => clearTimeout(timeout)
  }, [hasChanges, saveChanges])

  // Listen for manual save trigger (Cmd+S)
  useEffect(() => {
    const handleManualSave = () => {
      saveChanges()
    }
    window.addEventListener('storyflow:save', handleManualSave)
    return () => window.removeEventListener('storyflow:save', handleManualSave)
  }, [saveChanges])

  const handleTitleChange = (value: string) => {
    setWorkingTitle(value)
    setHasChanges(true)
  }

  const handleAuthorChange = (value: string) => {
    setAuthorName(value)
    setHasChanges(true)
  }

  const updateSpec = <K extends keyof NovelSpecification>(
    key: K,
    value: NovelSpecification[K]
  ) => {
    // Validate numeric fields
    let error: string | null = null
    if (key === 'targetWordCount') {
      error = validateNumericField('targetWordCount', value as number, 10000, 300000, 'Word count')
    } else if (key === 'targetChapterCount') {
      error = validateNumericField('targetChapterCount', value as number, 5, 100, 'Chapter count')
    }

    if (error) {
      setErrors(prev => ({ ...prev, [key]: error! }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }

    setSpec(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const applyTemplate = (template: GenreTemplate) => {
    setSpec(prev => ({
      ...prev,
      ...template.defaults,
    }))
    setHasChanges(true)
  }

  const handleReset = () => {
    // Reset specification to defaults, keeping the title and author
    setSpec(defaultSpecification)
    setErrors({})
    setHasChanges(true)
  }

  const availableSubgenres = spec.genre.flatMap(g => SUBGENRES[g] || [])

  return (
    <div className="max-w-4xl pb-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-text-primary">{t.specification.title}</h1>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          title={t.specification.resetToDefaults}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t.specification.resetToDefaults}
        </button>
      </div>
      <p className="text-text-secondary mb-8">
        {t.specification.subtitle}
      </p>

      <div className="space-y-4">
        {/* Basic Information */}
        <AccordionSection
          title={t.specification.basicInfo}
          id="basic"
          isExpanded={expandedSections.basic}
          onToggle={() => toggleSection('basic')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.workingTitle} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workingTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  aria-invalid={errors.workingTitle ? 'true' : undefined}
                  aria-describedby={errors.workingTitle ? 'title-error' : undefined}
                  className={`flex-1 px-3 py-2 bg-surface border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none ${
                    errors.workingTitle ? 'border-error' : 'border-border'
                  }`}
                  placeholder={t.placeholders.enterTitle}
                />
                <button
                  onClick={handleSuggestTitles}
                  disabled={isGenerating}
                  className="px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                  title={t.placeholders.suggestTitles}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
              {errors.workingTitle && (
                <p id="title-error" className="text-xs text-error mt-1" role="alert">{errors.workingTitle}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.authorName}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder={t.placeholders.penName}
              />
            </div>
          </div>
        </AccordionSection>

        {/* Quick Start Templates */}
        <AccordionSection
          title={t.specification.quickStartTemplates}
          id="templates"
          isExpanded={expandedSections.templates}
          onToggle={() => toggleSection('templates')}
        >
          <p className="text-sm text-text-secondary mb-4">
            {t.specification.templatesDescription}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {GENRE_TEMPLATES.map(template => {
              const IconComponent = template.icon
              const templateName = t.templates[template.id]
              const templateDesc = t.templates[`${template.id}Desc` as keyof typeof t.templates]
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="relative p-4 text-left bg-surface-elevated border border-border rounded-lg hover:border-accent hover:shadow-md transition-all group overflow-hidden"
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${template.color}`} />

                  {/* Popular badge */}
                  {template.popular && (
                    <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                      {t.templates.popular}
                    </span>
                  )}

                  <div className="flex items-start gap-3 mt-1">
                    {/* Icon with gradient background */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center shadow-sm`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                        {templateName}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                        {templateDesc}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </AccordionSection>

        {/* My Presets */}
        <AccordionSection
          title={t.specification.myPresets}
          id="presets"
          isExpanded={expandedSections.presets}
          onToggle={() => toggleSection('presets')}
        >
          <div className="space-y-4">
            {/* Save current settings button */}
            <button
              onClick={() => setShowSavePresetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Save className="h-4 w-4" />
              {t.specification.saveCurrentSettings}
            </button>

            {/* List of presets */}
            {presets.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <Folder className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="font-medium">{t.specification.noPresetsYet}</p>
                <p className="text-sm mt-1">{t.specification.noPresetsDescription}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className="p-4 bg-surface-elevated border border-border rounded-lg hover:border-accent transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary truncate">{preset.name}</h3>
                        <p className="text-xs text-text-secondary mt-1">
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors"
                          title={t.specification.loadPreset}
                        >
                          <Folder className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPresetToDelete(preset.id)}
                          className="p-1.5 text-text-secondary hover:text-error hover:bg-error/10 rounded transition-colors"
                          title={t.specification.deletePreset}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {/* Preview of key settings */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preset.specification.genre?.slice(0, 2).map(g => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-text-secondary">
                          {g}
                        </span>
                      ))}
                      {preset.specification.targetAudience && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-surface rounded text-text-secondary">
                          {preset.specification.targetAudience}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Genre Selection */}
        <AccordionSection
          title={t.specification.genre}
          id="genre"
          isExpanded={expandedSections.genre}
          onToggle={() => toggleSection('genre')}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.specification.primaryGenres}
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => updateSpec('genre', toggleArrayItem(spec.genre, genre))}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    spec.genre.includes(genre)
                      ? 'bg-accent text-white'
                      : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {availableSubgenres.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.specification.subgenres}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSubgenres.map(subgenre => (
                  <button
                    key={subgenre}
                    onClick={() => updateSpec('subgenre', toggleArrayItem(spec.subgenre, subgenre))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      spec.subgenre.includes(subgenre)
                        ? 'bg-accent/80 text-white'
                        : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                    }`}
                  >
                    {subgenre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AccordionSection>

        {/* Target Audience */}
        <AccordionSection
          title={t.specification.targetAudience}
          id="audience"
          isExpanded={expandedSections.audience}
          onToggle={() => toggleSection('audience')}
        >
          <div className="flex flex-wrap gap-2">
            {TARGET_AUDIENCES.map(audience => (
              <button
                key={audience}
                onClick={() => updateSpec('targetAudience', audience)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  spec.targetAudience === audience
                    ? 'bg-accent text-white'
                    : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                }`}
              >
                {audience}
              </button>
            ))}
          </div>

          {/* Age Category - shown only for youth audiences */}
          {showAgeCategory && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.ageCategories.label}
              </label>
              <p className="text-xs text-text-secondary mb-3">
                {t.ageCategories.description}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {AGE_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => updateSpec('childrensAgeCategory', spec.childrensAgeCategory === category ? undefined : category)}
                    className={`p-3 rounded-lg text-sm transition-colors text-left ${
                      spec.childrensAgeCategory === category
                        ? 'bg-accent text-white'
                        : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                    }`}
                  >
                    <span className="block font-medium">{t.ageCategories.options[category]}</span>
                    <span className={`block text-xs mt-0.5 ${
                      spec.childrensAgeCategory === category ? 'text-white/80' : 'text-text-secondary'
                    }`}>
                      {t.ageCategories.options[`${category}-desc` as keyof typeof t.ageCategories.options]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </AccordionSection>

        {/* Novel Language */}
        <AccordionSection
          title={t.novelLanguage.label}
          id="language"
          isExpanded={expandedSections.language}
          onToggle={() => toggleSection('language')}
        >
          <p className="text-sm text-text-secondary mb-3">
            {t.novelLanguage.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {NOVEL_LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => updateSpec('novelLanguage', lang)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  spec.novelLanguage === lang
                    ? 'bg-accent text-white'
                    : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                }`}
              >
                {t.novelLanguage.options[lang]}
              </button>
            ))}
          </div>
        </AccordionSection>

        {/* Writing Style */}
        <AccordionSection
          title={t.specification.writingStyle}
          id="style"
          isExpanded={expandedSections.style}
          onToggle={() => toggleSection('style')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.styleReference}
              </label>
              <SearchableSelect
                options={STYLE_AUTHORS}
                value={spec.writingStyle.reference}
                onChange={(value) => updateSpec('writingStyle', { ...spec.writingStyle, reference: value })}
                placeholder={t.placeholders.selectAuthor}
                searchPlaceholder={t.placeholders.searchAuthors}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.customStyleNotes}
              </label>
              <input
                type="text"
                value={spec.writingStyle.custom}
                onChange={(e) => updateSpec('writingStyle', { ...spec.writingStyle, custom: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder={t.placeholders.styleNotes}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t.specification.tone}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={spec.tone}
                onChange={(e) => updateSpec('tone', e.target.value)}
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder={t.placeholders.tone}
              />
              <button
                onClick={handleSuggestTones}
                disabled={isGenerating}
                className="px-3 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                title={t.placeholders.suggestTone}
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </AccordionSection>

        {/* Narrative Structure */}
        <AccordionSection
          title={t.specification.narrativeStructure}
          id="narrative"
          isExpanded={expandedSections.narrative}
          onToggle={() => toggleSection('narrative')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.specification.pointOfView}
              </label>
              <div className="flex flex-wrap gap-2">
                {POVS.map(pov => (
                  <button
                    key={pov}
                    onClick={() => updateSpec('pov', pov)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      spec.pov === pov
                        ? 'bg-accent text-white'
                        : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                    }`}
                  >
                    {pov}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.specification.tense}
              </label>
              <div className="flex gap-2">
                {TENSES.map(tense => (
                  <button
                    key={tense}
                    onClick={() => updateSpec('tense', tense)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      spec.tense === tense
                        ? 'bg-accent text-white'
                        : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                    }`}
                  >
                    {t.tenseOptions[tense === 'Past' ? 'past' : 'present']}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Length Targets */}
        <AccordionSection
          title={t.specification.lengthTargets}
          id="length"
          isExpanded={expandedSections.length}
          onToggle={() => toggleSection('length')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.targetWordCount}
              </label>
              <input
                type="number"
                value={spec.targetWordCount}
                onChange={(e) => updateSpec('targetWordCount', parseInt(e.target.value) || 0)}
                min={10000}
                max={300000}
                step={5000}
                className={`w-full px-3 py-2 bg-surface border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none ${
                  errors.targetWordCount ? 'border-error' : 'border-border'
                }`}
              />
              {errors.targetWordCount ? (
                <p className="text-xs text-error mt-1">{errors.targetWordCount}</p>
              ) : (
                <p className="text-xs text-text-secondary mt-1">{t.placeholders.typicalWordCount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.targetChapterCount}
              </label>
              <input
                type="number"
                value={spec.targetChapterCount}
                onChange={(e) => updateSpec('targetChapterCount', parseInt(e.target.value) || 0)}
                min={5}
                max={100}
                className={`w-full px-3 py-2 bg-surface border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none ${
                  errors.targetChapterCount ? 'border-error' : 'border-border'
                }`}
              />
              {errors.targetChapterCount && (
                <p className="text-xs text-error mt-1">{errors.targetChapterCount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.minChapterLength}
              </label>
              <input
                type="number"
                value={spec.chapterLengthRange.min}
                onChange={(e) => updateSpec('chapterLengthRange', { ...spec.chapterLengthRange, min: parseInt(e.target.value) || 0 })}
                min={500}
                max={10000}
                step={500}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                {t.specification.maxChapterLength}
              </label>
              <input
                type="number"
                value={spec.chapterLengthRange.max}
                onChange={(e) => updateSpec('chapterLengthRange', { ...spec.chapterLengthRange, max: parseInt(e.target.value) || 0 })}
                min={1000}
                max={20000}
                step={500}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              />
            </div>
          </div>
        </AccordionSection>

        {/* Setting */}
        <AccordionSection
          title={t.specification.setting}
          id="setting"
          isExpanded={expandedSections.setting}
          onToggle={() => toggleSection('setting')}
        >
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t.specification.settingTypes}
            </label>
            <div className="flex flex-wrap gap-2">
              {SETTING_TYPES.map(setting => (
                <button
                  key={setting}
                  onClick={() => updateSpec('settingType', toggleArrayItem(spec.settingType, setting))}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    spec.settingType.includes(setting)
                      ? 'bg-accent text-white'
                      : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                  }`}
                >
                  {setting}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {t.specification.timePeriod}
            </label>
            <input
              type="text"
              value={spec.timePeriod}
              onChange={(e) => updateSpec('timePeriod', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder={t.placeholders.timePeriod}
            />
          </div>
        </AccordionSection>

        {/* Themes */}
        <AccordionSection
          title={t.specification.themes}
          id="themes"
          isExpanded={expandedSections.themes}
          onToggle={() => toggleSection('themes')}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">{t.specification.themesDescription}</p>
            <button
              onClick={handleSuggestThemes}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
              title={t.specification.suggestThemes}
            >
              <Sparkles className="h-4 w-4" />
              {t.specification.suggestThemes}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.map(theme => (
              <button
                key={theme}
                onClick={() => updateSpec('themes', toggleArrayItem(spec.themes, theme))}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  spec.themes.includes(theme)
                    ? 'bg-accent text-white'
                    : 'bg-surface-elevated border border-border text-text-secondary hover:border-accent'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </AccordionSection>

        {/* Pacing & Complexity */}
        <AccordionSection
          title={t.specification.pacingComplexity}
          id="pacing"
          isExpanded={expandedSections.pacing}
          onToggle={() => toggleSection('pacing')}
        >
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>{t.specification.pacing}</span>
                <span>{spec.pacing}/10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-20">{t.specification.slowBurn}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={spec.pacing}
                  onChange={(e) => updateSpec('pacing', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="text-xs text-text-secondary w-20 text-right">{t.specification.fastPaced}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>{t.specification.complexity}</span>
                <span>{spec.complexity}/10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-20">{t.specification.simpleLinear}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={spec.complexity}
                  onChange={(e) => updateSpec('complexity', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="text-xs text-text-secondary w-20 text-right">{t.specification.complex}</span>
              </div>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={() => {
          setShowAIProgress(false)
          resetAI()
        }}
        onCancel={cancel}
        status={status}
        title={aiProgressTitle}
        progress={progress}
        message={message}
      />

      {/* Suggestions Modal */}
      {showSuggestionsModal && suggestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSuggestionsModal(false)
              setSuggestions([])
              setSuggestionType(null)
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {suggestionType === 'title' ? 'Title Suggestions' :
                   suggestionType === 'tone' ? 'Tone Suggestions' :
                   'Theme Suggestions'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowSuggestionsModal(false)
                  setSuggestions([])
                  setSuggestionType(null)
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-4">
                Click on a suggestion to apply it:
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplySuggestion(suggestion)}
                    className="w-full p-3 text-left bg-surface-elevated border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors group"
                  >
                    <p className="text-sm text-text-primary group-hover:text-accent transition-colors">
                      {suggestion}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  setShowSuggestionsModal(false)
                  setSuggestions([])
                  setSuggestionType(null)
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSavePresetModal(false)
              setNewPresetName('')
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t.specification.savePreset}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowSavePresetModal(false)
                  setNewPresetName('')
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t.specification.presetName}
              </label>
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={t.specification.presetNamePlaceholder}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSavePreset()
                }}
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSavePresetModal(false)
                  setNewPresetName('')
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!newPresetName.trim()}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {t.actions.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Preset Confirmation Modal */}
      {presetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPresetToDelete(null)}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-error/10 rounded-full">
                  <Trash2 className="h-5 w-5 text-error" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {t.specification.confirmDeletePreset}
                </h2>
              </div>
              <p className="text-sm text-text-secondary">
                {presets.find(p => p.id === presetToDelete)?.name}
              </p>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setPresetToDelete(null)}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={() => handleDeletePreset(presetToDelete)}
                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
              >
                {t.actions.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Step Navigation */}
      {projectId && (
        <NextStepBanner
          currentSection="specification"
          projectId={projectId}
          project={project}
          validationStatus={validationStatus}
        />
      )}
    </div>
  )
}
