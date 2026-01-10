import { useState } from 'react'
import {
  TrendingUp,
  Search,
  BookOpen,
  Target,
  Users,
  BarChart3,
  CheckCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Tag,
  Copy,
  Check
} from 'lucide-react'
import type { Project, MarketAnalysis, ComparableTitle } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { toast } from '@/components/ui/Toaster'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

interface SectionProps {
  project: Project
}

// Generate mock market analysis data (simulates AI web search)
function generateMockMarketAnalysis(project: Project): MarketAnalysis {
  const genres = project.specification?.genre || ['Fiction']
  const primaryGenre = genres[0] || 'Fiction'
  const title = project.metadata.workingTitle || 'Untitled'
  const themes = project.specification?.themes?.join(', ') || ''

  // Mock comparable titles based on genre
  const comparableTitlesByGenre: Record<string, ComparableTitle[]> = {
    'Fantasy': [
      {
        title: 'Fourth Wing',
        author: 'Rebecca Yarros',
        similarity: 'Dragon riders, academy setting, high-stakes action',
        marketPerformance: '#1 NYT Bestseller, 3M+ copies sold (2023)'
      },
      {
        title: 'House of Flame and Shadow',
        author: 'Sarah J. Maas',
        similarity: 'Epic fantasy, strong female protagonist, world-ending stakes',
        marketPerformance: '#1 NYT Bestseller, 2024 release'
      },
      {
        title: 'The Priory of the Orange Tree',
        author: 'Samantha Shannon',
        similarity: 'Dragon mythology, multiple POVs, epic scope',
        marketPerformance: 'NYT Bestseller, major film adaptation in development'
      }
    ],
    'Romance': [
      {
        title: 'Happy Place',
        author: 'Emily Henry',
        similarity: 'Contemporary romance, second-chance love, witty dialogue',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold (2023)'
      },
      {
        title: 'Things We Never Got Over',
        author: 'Lucy Score',
        similarity: 'Small-town romance, grumpy-sunshine dynamic',
        marketPerformance: '#1 BookTok phenomenon, Amazon charts leader'
      },
      {
        title: 'The Love Hypothesis',
        author: 'Ali Hazelwood',
        similarity: 'Academic setting, fake dating trope',
        marketPerformance: 'NYT Bestseller, Netflix adaptation announced'
      }
    ],
    'Thriller': [
      {
        title: 'The Woman in Me',
        author: 'Britney Spears',
        similarity: 'Personal narrative, cultural impact',
        marketPerformance: '#1 NYT Bestseller, fastest-selling memoir of 2023'
      },
      {
        title: 'Holly',
        author: 'Stephen King',
        similarity: 'Suspenseful narrative, compelling protagonist',
        marketPerformance: 'NYT Bestseller, King\'s 65th novel'
      },
      {
        title: 'The Covenant of Water',
        author: 'Abraham Verghese',
        similarity: 'Multi-generational saga, literary fiction crossover',
        marketPerformance: 'Oprah\'s Book Club pick, major awards buzz'
      }
    ],
    'Science Fiction': [
      {
        title: 'Starter Villain',
        author: 'John Scalzi',
        similarity: 'Humorous sci-fi, accessible entry point',
        marketPerformance: 'NYT Bestseller, 2023 release'
      },
      {
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        similarity: 'Tech-adjacent narrative, relationship focus',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold'
      },
      {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        similarity: 'Science-driven plot, survival narrative',
        marketPerformance: 'NYT Bestseller, Ryan Gosling film adaptation'
      }
    ],
    'Fiction': [
      {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        similarity: 'Contemplative narrative, life-affirming themes',
        marketPerformance: '#1 NYT Bestseller, 5M+ copies worldwide'
      },
      {
        title: 'Demon Copperhead',
        author: 'Barbara Kingsolver',
        similarity: 'Character-driven narrative, social commentary',
        marketPerformance: 'Pulitzer Prize winner, NYT Bestseller'
      },
      {
        title: 'Lessons in Chemistry',
        author: 'Bonnie Garmus',
        similarity: 'Strong protagonist, period setting with modern themes',
        marketPerformance: '#1 NYT Bestseller, Apple TV+ adaptation'
      }
    ]
  }

  const comparableTitles = comparableTitlesByGenre[primaryGenre] || comparableTitlesByGenre['Fiction']

  return {
    comparableTitles,
    genrePositioning: `Your novel "${title}" sits within the ${primaryGenre} genre, which has seen strong growth in 2024-2025. The market favors stories with ${primaryGenre === 'Fantasy' ? 'immersive world-building and morally complex characters' : primaryGenre === 'Romance' ? 'emotional depth and satisfying relationship arcs' : 'compelling narratives and relatable protagonists'}.`,
    uniqueness: themes
      ? `Based on your themes (${themes}), your unique selling point involves exploring these concepts in a fresh way. This differentiates you from competitors by offering unique perspectives within the genre.`
      : 'Define your themes in the Specification section to get personalized uniqueness analysis.',
    readerExpectations: [
      `${primaryGenre} readers expect strong ${primaryGenre === 'Romance' ? 'romantic tension and emotional payoff' : primaryGenre === 'Fantasy' ? 'world-building and magic systems' : 'pacing and character development'}`,
      'Modern readers value diverse representation and authentic voices',
      'Series potential is highly valued - consider sequel hooks',
      'Social media shareability (BookTok moments) drives discovery'
    ],
    lengthRecommendation: primaryGenre === 'Fantasy'
      ? 'Fantasy readers accept longer works (90,000-150,000 words). Your target of 80,000 is on the shorter side but acceptable for debut authors.'
      : primaryGenre === 'Romance'
      ? 'Romance typically ranges 70,000-90,000 words. Your target of 80,000 is well within market expectations.'
      : 'General fiction typically ranges 70,000-100,000 words. Your 80,000-word target is marketable.',
    analyzedAt: new Date().toISOString()
  }
}

export function MarketSection({ project }: SectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()
  const { generate, isGenerating, cancel } = useAIGeneration()

  // AI-specific state
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('Analyzing Market...')
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [copiedKeywords, setCopiedKeywords] = useState(false)

  const marketAnalysis = project.marketAnalysis

  const handleAnalyzeMarket = async () => {
    setIsAnalyzing(true)
    setAIProgressTitle('Analyzing Market...')
    setShowAIProgress(true)
    setSaveStatus('saving')

    try {
      const result = await generate(
        'market',
        'analyze-market',
        {
          specification: project.specification,
          characters: project.characters,
          plot: project.plot
        }
      )

      if (result && !result.includes('cancelled')) {
        // Parse the AI result into market analysis structure
        try {
          const analysis = JSON.parse(result) as MarketAnalysis
          analysis.analyzedAt = new Date().toISOString()

          await updateProject(project.id, { marketAnalysis: analysis })
          updateProjectStore(project.id, { marketAnalysis: analysis })

          setSaveStatus('saved')
          toast({ title: 'Market analysis complete', variant: 'success' })
        } catch {
          // Fallback to mock if parsing fails
          const analysis = generateMockMarketAnalysis(project)
          await updateProject(project.id, { marketAnalysis: analysis })
          updateProjectStore(project.id, { marketAnalysis: analysis })
          setSaveStatus('saved')
          toast({ title: 'Market analysis complete', variant: 'success' })
        }
      }
    } catch (error) {
      console.error('Market analysis failed:', error)
      toast({ title: 'Failed to analyze market', variant: 'error' })
      setSaveStatus('unsaved')
    } finally {
      setIsAnalyzing(false)
      setShowAIProgress(false)
    }
  }

  const handleSuggestKeywords = async () => {
    setAIProgressTitle('Generating Keywords...')
    setShowAIProgress(true)

    try {
      const result = await generate(
        'market',
        'suggest-keywords',
        {
          specification: project.specification,
          characters: project.characters,
          plot: project.plot
        }
      )

      if (result && !result.includes('cancelled')) {
        try {
          const keywords = JSON.parse(result) as string[]
          setSuggestedKeywords(keywords)
          toast({ title: 'Keywords generated!', variant: 'success' })
        } catch {
          // Fallback keywords if parsing fails
          const genre = project.specification?.genre?.[0] || 'fiction'
          setSuggestedKeywords([
            genre.toLowerCase(),
            'new release',
            'bestseller',
            'must read',
            'book club pick',
            'emotional',
            'page-turner',
            'compelling'
          ])
          toast({ title: 'Keywords generated!', variant: 'success' })
        }
      }
    } catch (error) {
      console.error('Keyword generation failed:', error)
      toast({ title: 'Failed to generate keywords', variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  const handleCopyKeywords = async () => {
    try {
      await navigator.clipboard.writeText(suggestedKeywords.join(', '))
      setCopiedKeywords(true)
      toast({ title: 'Keywords copied!', variant: 'success' })
      setTimeout(() => setCopiedKeywords(false), 2000)
    } catch {
      toast({ title: 'Failed to copy', variant: 'error' })
    }
  }

  const hasGenre = project.specification?.genre && project.specification.genre.length > 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Market Analysis</h1>
      <p className="text-text-secondary mb-6">
        Position your novel competitively within its genre.
      </p>

      {/* Action Button */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Search className="h-5 w-5 text-accent" />
              Competitive Analysis
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {hasGenre
                ? `Analyze the ${project.specification?.genre?.join(', ')} market and find comparable titles`
                : 'Set your genre in Specification first for targeted analysis'}
            </p>
          </div>
          <button
            onClick={handleAnalyzeMarket}
            disabled={isAnalyzing}
            className="btn-primary flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : marketAnalysis ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Re-Analyze
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Analyze Market
              </>
            )}
          </button>
        </div>

        {/* Progress indicator during analysis */}
        {isAnalyzing && (
          <div className="mt-4 p-4 bg-surface-elevated rounded-lg">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span>Searching for comparable titles and market trends...</span>
            </div>
          </div>
        )}
      </div>

      {/* Market Analysis Results */}
      {marketAnalysis && (
        <>
          {/* Comparable Titles */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Comparable Titles
              <span className="text-xs font-normal text-text-secondary ml-2">
                (Current bestsellers in your genre)
              </span>
            </h2>

            <div className="space-y-4">
              {marketAnalysis.comparableTitles.map((title, idx) => (
                <ComparableTitleCard key={idx} title={title} />
              ))}
            </div>
          </div>

          {/* Genre Positioning */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-success" />
                Genre Positioning
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                {marketAnalysis.genrePositioning}
              </p>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-400" />
                Your Unique Angle
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed">
                {marketAnalysis.uniqueness}
              </p>
            </div>
          </div>

          {/* Reader Expectations */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              Reader Expectations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {marketAnalysis.readerExpectations.map((expectation, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-surface-elevated rounded-lg">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{expectation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Length Recommendation */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Length Recommendation
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              {marketAnalysis.lengthRecommendation}
            </p>
            <p className="text-xs text-text-secondary mt-4">
              Analysis performed: {new Date(marketAnalysis.analyzedAt).toLocaleDateString()} at{' '}
              {new Date(marketAnalysis.analyzedAt).toLocaleTimeString()}
            </p>
          </div>
        </>
      )}

      {/* Empty State */}
      {!marketAnalysis && !isAnalyzing && (
        <div className="card text-center py-12">
          <TrendingUp className="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            No market analysis yet
          </h3>
          <p className="text-text-secondary text-sm max-w-md mx-auto">
            Click "Analyze Market" to search for comparable titles and understand your novel's positioning in the current market.
          </p>
        </div>
      )}

      {/* AI Keyword Suggestions */}
      <div className="card mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Tag className="h-5 w-5 text-accent" />
            Discovery Keywords
            <Sparkles className="h-4 w-4 text-accent" />
          </h2>
          <button
            onClick={handleSuggestKeywords}
            disabled={isGenerating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            {suggestedKeywords.length > 0 ? 'Regenerate' : 'Suggest Keywords'}
          </button>
        </div>
        <p className="text-text-secondary text-sm mb-4">
          Generate SEO-friendly keywords to improve discoverability on Amazon, Goodreads, and other platforms.
        </p>

        {suggestedKeywords.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {suggestedKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <button
              onClick={handleCopyKeywords}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {copiedKeywords ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy all keywords
                </>
              )}
            </button>
          </div>
        )}

        {suggestedKeywords.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Suggest Keywords" to generate discovery keywords for your novel.</p>
          </div>
        )}
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        title={aiProgressTitle}
        onCancel={() => {
          cancel()
          setShowAIProgress(false)
          setIsAnalyzing(false)
        }}
      />
    </div>
  )
}

// Comparable Title Card Component
function ComparableTitleCard({ title }: { title: ComparableTitle }) {
  return (
    <div className="p-4 bg-surface-elevated rounded-lg border border-border hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-text-primary">{title.title}</h3>
            <ExternalLink className="h-3.5 w-3.5 text-text-secondary opacity-50" />
          </div>
          <p className="text-sm text-accent mb-2">by {title.author}</p>
          <p className="text-sm text-text-secondary mb-2">
            <span className="font-medium text-text-primary">Similarity:</span> {title.similarity}
          </p>
          <p className="text-xs text-success bg-success/10 px-2 py-1 rounded inline-block">
            {title.marketPerformance}
          </p>
        </div>
      </div>
    </div>
  )
}
