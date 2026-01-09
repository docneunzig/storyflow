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
  ExternalLink
} from 'lucide-react'
import type { Project, MarketAnalysis, ComparableTitle } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { toast } from '@/components/ui/Toaster'

interface SectionProps {
  project: Project
}

// Generate mock market analysis data (simulates AI web search)
function generateMockMarketAnalysis(project: Project): MarketAnalysis {
  const genres = project.specification?.genre || ['Fiction']
  const primaryGenre = genres[0] || 'Fiction'
  const title = project.specification?.title || 'Untitled'
  const premise = project.specification?.premise || ''

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
    uniqueness: premise
      ? `Based on your premise, your unique selling point appears to be: ${premise.slice(0, 100)}${premise.length > 100 ? '...' : ''}. This differentiates you from competitors by offering fresh perspectives within the genre.`
      : 'Define your premise in the Specification section to get personalized uniqueness analysis.',
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

  const marketAnalysis = project.marketAnalysis

  const handleAnalyzeMarket = async () => {
    setIsAnalyzing(true)
    setSaveStatus('saving')

    try {
      // Simulate web search delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      const analysis = generateMockMarketAnalysis(project)

      await updateProject(project.id, { marketAnalysis: analysis })
      updateProjectStore(project.id, { marketAnalysis: analysis })

      setSaveStatus('saved')
      toast({ title: 'Market analysis complete', variant: 'success' })
    } catch (error) {
      console.error('Market analysis failed:', error)
      toast({ title: 'Failed to analyze market', variant: 'error' })
      setSaveStatus('unsaved')
    } finally {
      setIsAnalyzing(false)
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
