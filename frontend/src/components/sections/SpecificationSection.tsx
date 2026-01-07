import { useState, useEffect, useCallback } from 'react'
import type { Project, NovelSpecification, TargetAudience, POV, Tense } from '@/types/project'
import { updateProject as updateProjectInDb } from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'

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
interface GenreTemplate {
  name: string
  description: string
  defaults: Partial<NovelSpecification>
}

const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    name: 'Epic Fantasy',
    description: 'Grand worldbuilding, multiple POVs, complex plots',
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
    name: 'Cozy Mystery',
    description: 'Light-hearted, amateur sleuth, small community',
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
    name: 'Space Opera',
    description: 'Grand space adventures, alien civilizations',
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
    name: 'Contemporary Romance',
    description: 'Modern love stories, emotional depth',
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
    name: 'Psychological Thriller',
    description: 'Mind games, unreliable narrators, suspense',
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
    name: 'YA Coming of Age',
    description: 'Teen protagonists, first experiences, growth',
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

export function SpecificationSection({ project }: SectionProps) {
  const { updateProject, setSaveStatus } = useProjectStore()

  const [workingTitle, setWorkingTitle] = useState(project.metadata?.workingTitle || 'Untitled Novel')
  const [authorName, setAuthorName] = useState(project.metadata?.authorName || '')
  const [spec, setSpec] = useState<NovelSpecification>(
    project.specification || defaultSpecification
  )
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation function for numeric fields
  const validateNumericField = (
    field: string,
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

  const availableSubgenres = spec.genre.flatMap(g => SUBGENRES[g] || [])

  return (
    <div className="max-w-4xl pb-12">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Novel Specification</h1>
      <p className="text-text-secondary mb-8">
        Define all parameters that shape your novel before writing begins.
      </p>

      <div className="space-y-8">
        {/* Basic Information */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Working Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={workingTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder="Enter your novel's title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => handleAuthorChange(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder="Your name or pen name"
              />
            </div>
          </div>
        </section>

        {/* Quick Start Templates */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Quick Start Templates</h2>
          <p className="text-sm text-text-secondary mb-4">
            Choose a template to pre-fill settings for your genre. You can customize everything afterward.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {GENRE_TEMPLATES.map(template => (
              <button
                key={template.name}
                onClick={() => applyTemplate(template)}
                className="p-4 text-left bg-surface-elevated border border-border rounded-lg hover:border-accent hover:bg-surface transition-colors group"
              >
                <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                  {template.name}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {template.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Genre Selection */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Genre</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Primary Genre(s)
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
                Subgenre(s)
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
        </section>

        {/* Target Audience */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Target Audience</h2>

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
        </section>

        {/* Writing Style */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Writing Style</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Style Reference (Famous Author)
              </label>
              <select
                value={spec.writingStyle.reference}
                onChange={(e) => updateSpec('writingStyle', { ...spec.writingStyle, reference: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              >
                <option value="">Select an author...</option>
                {STYLE_AUTHORS.map(author => (
                  <option key={author} value={author}>{author}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Custom Style Notes
              </label>
              <input
                type="text"
                value={spec.writingStyle.custom}
                onChange={(e) => updateSpec('writingStyle', { ...spec.writingStyle, custom: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                placeholder="e.g., sparse but evocative"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Tone
            </label>
            <input
              type="text"
              value={spec.tone}
              onChange={(e) => updateSpec('tone', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="e.g., Dark and gritty with moments of dark humor"
            />
          </div>
        </section>

        {/* Narrative Structure */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Narrative Structure</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Point of View
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
                Tense
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
                    {tense}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Length Targets */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Length Targets</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Target Word Count
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
                <p className="text-xs text-text-secondary mt-1">Typical: 50,000 - 120,000 words</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Target Chapter Count
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
                Min Chapter Length (words)
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
                Max Chapter Length (words)
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
        </section>

        {/* Setting */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Setting</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Setting Type(s)
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
              Time Period
            </label>
            <input
              type="text"
              value={spec.timePeriod}
              onChange={(e) => updateSpec('timePeriod', e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none"
              placeholder="e.g., Present day, Victorian era, 2150 AD"
            />
          </div>
        </section>

        {/* Themes */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Themes</h2>

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
        </section>

        {/* Pacing & Complexity */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Pacing & Complexity</h2>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Pacing</span>
                <span>{spec.pacing}/10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-20">Slow burn</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={spec.pacing}
                  onChange={(e) => updateSpec('pacing', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="text-xs text-text-secondary w-20 text-right">Fast-paced</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>Complexity</span>
                <span>{spec.complexity}/10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-20">Simple/Linear</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={spec.complexity}
                  onChange={(e) => updateSpec('complexity', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <span className="text-xs text-text-secondary w-20 text-right">Complex</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
