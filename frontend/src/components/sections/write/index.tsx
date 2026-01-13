import { useState, useMemo, useCallback } from 'react'
import type { Project, Chapter } from '@/types/project'
import { ChapterModal } from '@/components/ui/ChapterModal'
import { WikiAutoExtractModal } from '@/components/ui/WikiAutoExtractModal'
import { GuidedGenerationPanel } from '@/components/ui/GuidedGenerationPanel'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { InlineAIToolbar, AIOptionsModal } from '@/components/write/InlineAIToolbar'

// Local components
import { ChapterList } from './ChapterList'
import { ChapterHeader } from './ChapterHeader'
import { ChapterScenes } from './ChapterScenes'
import { ChapterContent } from './ChapterContent'
import { RevisionHistoryModal } from './RevisionHistoryModal'
import { EmptyState } from './EmptyState'

// Hooks
import { useChapterSave } from './hooks/useChapterSave'
import { useInlineAI } from './hooks/useInlineAI'
import { useChapterGeneration } from './hooks/useChapterGeneration'

interface WriteSectionProps {
  project: Project
}

export function WriteSection({ project }: WriteSectionProps) {
  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [isScenesExpanded, setIsScenesExpanded] = useState(true)
  const [isContentExpanded, setIsContentExpanded] = useState(true)
  const [showWikiExtract, setShowWikiExtract] = useState(false)
  const [showRevisionHistory, setShowRevisionHistory] = useState(false)

  // Chapter save hook
  const {
    lastSavedChapter,
    setLastSavedChapter,
    handleSaveChapter,
    handleDeleteChapter,
    handleAddWikiEntries,
  } = useChapterSave({
    project,
    onChapterSaved: () => setShowWikiExtract(true),
  })

  // Chapter generation hook
  const {
    showAIProgress,
    setShowAIProgress,
    aiProgressTitle,
    isGenerating,
    handleContinueWriting,
    handleGenerateChapterDraft,
    handleUpdateChapterContent,
    guidedMode,
    setGuidedMode,
    voiceDNA,
    generationResults,
    currentCheckpoint,
    generatingSceneId,
    handleGenerateScene,
    handleApproveGeneration,
    handleRejectGeneration,
    handleRegenerateScene,
    handleSkipScene,
    handleFinalizeGeneration,
  } = useChapterGeneration({
    project,
    selectedChapterId,
    onSaveChapter: handleSaveChapter,
  })

  // Inline AI hook
  const {
    selectedText,
    selectionRect,
    handleTextSelection,
    handleClearSelection,
    aiStatus,
    aiProgress,
    aiMessage,
    cancelGeneration,
    resetAI,
    showAIProgress: showInlineAIProgress,
    setShowAIProgress: setShowInlineAIProgress,
    aiProgressTitle: inlineAIProgressTitle,
    showAlternatives,
    setShowAlternatives,
    alternatives,
    setAlternatives,
    handleAIExpand,
    handleAICondense,
    handleAIRewrite,
    handleAIAlternatives,
    handleSelectAlternative,
  } = useInlineAI({
    project,
    selectedChapterId,
    onUpdateChapterContent: handleUpdateChapterContent,
  })

  // Computed values
  const chapters = project.chapters || []
  const scenes = project.scenes || []
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0)
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.number)) + 1
    : 1

  const selectedChapter = selectedChapterId
    ? chapters.find(c => c.id === selectedChapterId)
    : null

  const chapterScenes = selectedChapterId
    ? scenes.filter(s => s.chapterId === selectedChapterId)
    : []
  const scenesWordCount = chapterScenes.reduce((acc, s) => acc + s.estimatedWordCount, 0)

  const chapterRevisions = useMemo(() => {
    if (!selectedChapterId) return []
    return (project.revisions || [])
      .filter(r => r.chapterId === selectedChapterId)
      .sort((a, b) => b.revisionNumber - a.revisionNumber)
  }, [project.revisions, selectedChapterId])

  const latestQualityScore = useMemo(() => {
    if (!selectedChapterId) return null
    const scores = (project.qualityScores || [])
      .filter(qs => qs.chapterId === selectedChapterId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return scores[0]?.overallScore || null
  }, [project.qualityScores, selectedChapterId])

  // Handlers
  const handleOpenModal = (chapter?: Chapter) => {
    setEditingChapter(chapter || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingChapter(null)
  }

  const handleDelete = async (chapterId: string) => {
    const result = await handleDeleteChapter(chapterId, selectedChapterId)
    if (result.success) {
      setDeleteConfirmId(null)
      if (result.clearSelection) {
        setSelectedChapterId(null)
      }
    }
  }

  // Handle voice fix - replace dialogue in chapter content
  const handleFixDialogue = useCallback(async (
    lineNumber: number,
    originalDialogue: string,
    fixedDialogue: string
  ) => {
    if (!selectedChapter) return

    const lines = selectedChapter.content?.split('\n') || []
    const lineIndex = lineNumber - 1

    if (lineIndex >= 0 && lineIndex < lines.length) {
      // Replace the original dialogue with the fixed dialogue
      lines[lineIndex] = lines[lineIndex].replace(
        `"${originalDialogue}"`,
        `"${fixedDialogue}"`
      )
      const newContent = lines.join('\n')
      await handleUpdateChapterContent(selectedChapter, newContent)
    }
  }, [selectedChapter, handleUpdateChapterContent])

  // Determine which progress modal to show
  const currentShowAIProgress = showAIProgress || showInlineAIProgress
  const currentAIProgressTitle = showAIProgress ? aiProgressTitle : inlineAIProgressTitle

  return (
    <div className="h-full flex">
      {/* Chapter List Sidebar */}
      <ChapterList
        chapters={chapters}
        selectedChapterId={selectedChapterId}
        deleteConfirmId={deleteConfirmId}
        totalWords={totalWords}
        onSelectChapter={setSelectedChapterId}
        onCreateChapter={() => handleOpenModal()}
        onEditChapter={handleOpenModal}
        onDeleteChapter={handleDelete}
        onConfirmDelete={setDeleteConfirmId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedChapter ? (
          <>
            {/* Chapter Header */}
            <ChapterHeader
              chapter={selectedChapter}
              chapterScenes={chapterScenes}
              scenesWordCount={scenesWordCount}
              isGenerating={isGenerating}
              guidedMode={guidedMode}
              onEdit={() => handleOpenModal(selectedChapter)}
              onShowRevisionHistory={() => setShowRevisionHistory(true)}
              onContinueWriting={handleContinueWriting}
              onGenerateChapterDraft={handleGenerateChapterDraft}
              onToggleGuidedMode={() => setGuidedMode(!guidedMode)}
            />

            {/* Chapter Scenes - Collapsible */}
            <ChapterScenes
              projectId={project.id}
              scenes={chapterScenes}
              isExpanded={isScenesExpanded}
              onToggleExpanded={() => setIsScenesExpanded(!isScenesExpanded)}
            />

            {/* Guided Generation Panel or Chapter Content */}
            {guidedMode ? (
              <div className="flex-1 overflow-y-auto">
                <GuidedGenerationPanel
                  chapter={selectedChapter}
                  scenes={chapterScenes}
                  characters={project.characters || []}
                  voiceDNA={voiceDNA}
                  generationResults={generationResults}
                  currentCheckpoint={currentCheckpoint}
                  onGenerateScene={handleGenerateScene}
                  onApproveGeneration={handleApproveGeneration}
                  onRejectGeneration={handleRejectGeneration}
                  onRegenerateScene={handleRegenerateScene}
                  onSkipScene={handleSkipScene}
                  onFinalize={handleFinalizeGeneration}
                  isGenerating={isGenerating}
                  generatingSceneId={generatingSceneId}
                />
              </div>
            ) : (
              <ChapterContent
                chapter={selectedChapter}
                wikiEntries={project.worldbuildingEntries || []}
                characters={project.characters || []}
                voiceDNA={voiceDNA}
                isExpanded={isContentExpanded}
                onToggleExpanded={() => setIsContentExpanded(!isContentExpanded)}
                onTextSelection={handleTextSelection}
                onEditChapter={() => handleOpenModal(selectedChapter)}
                onFixDialogue={handleFixDialogue}
              />
            )}
          </>
        ) : (
          <EmptyState
            hasChapters={chapters.length > 0}
            onCreateChapter={() => handleOpenModal()}
          />
        )}
      </div>

      {/* Chapter Modal */}
      <ChapterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChapter}
        editChapter={editingChapter}
        nextChapterNumber={nextChapterNumber}
        project={project}
      />

      {/* Wiki Auto-Extraction Modal */}
      {lastSavedChapter && (
        <WikiAutoExtractModal
          isOpen={showWikiExtract}
          onClose={() => {
            setShowWikiExtract(false)
            setLastSavedChapter(null)
          }}
          onAddEntries={handleAddWikiEntries}
          chapter={lastSavedChapter}
          existingWikiEntries={project.worldbuildingEntries || []}
          existingCharacters={project.characters || []}
        />
      )}

      {/* Revision History Modal */}
      {selectedChapter && (
        <RevisionHistoryModal
          isOpen={showRevisionHistory}
          chapter={selectedChapter}
          revisions={chapterRevisions}
          latestQualityScore={latestQualityScore}
          onClose={() => setShowRevisionHistory(false)}
        />
      )}

      {/* Inline AI Toolbar */}
      <InlineAIToolbar
        selectedText={selectedText}
        selectionRect={selectionRect}
        onExpand={handleAIExpand}
        onCondense={handleAICondense}
        onRewrite={handleAIRewrite}
        onAlternatives={handleAIAlternatives}
        onClose={handleClearSelection}
        isGenerating={isGenerating}
      />

      {/* AI Progress Modal */}
      {currentShowAIProgress && (
        <AIProgressModal
          isOpen={currentShowAIProgress}
          onClose={() => {
            setShowAIProgress(false)
            setShowInlineAIProgress(false)
            resetAI()
          }}
          onCancel={() => {
            cancelGeneration()
            setShowAIProgress(false)
            setShowInlineAIProgress(false)
            resetAI()
          }}
          title={currentAIProgressTitle}
          status={aiStatus}
          progress={aiProgress}
          message={aiMessage}
        />
      )}

      {/* AI Alternatives Modal */}
      <AIOptionsModal
        isOpen={showAlternatives}
        onClose={() => {
          setShowAlternatives(false)
          setAlternatives([])
          resetAI()
        }}
        title="Choose an Alternative"
        options={alternatives}
        onSelect={handleSelectAlternative}
        isLoading={isGenerating && alternatives.length === 0}
      />
    </div>
  )
}
