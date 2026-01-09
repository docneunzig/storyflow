import { useMemo } from 'react'
import { Check, User, Film, AlertTriangle, Users, UserX } from 'lucide-react'
import type { Scene, Character } from '@/types/project'

// Issue thresholds
const OVERCROWDED_THRESHOLD = 6 // More than 6 characters in a scene is considered overcrowded
const KEY_CHARACTER_ROLES = ['protagonist', 'antagonist'] // Roles that should appear regularly

interface SceneIssue {
  type: 'overcrowded' | 'missing_key_character'
  severity: 'warning' | 'error'
  message: string
  details?: string
}

interface SceneCharacterMatrixProps {
  scenes: Scene[]
  characters: Character[]
  onSceneClick?: (scene: Scene) => void
  onCharacterClick?: (character: Character) => void
}

export function SceneCharacterMatrix({
  scenes,
  characters,
  onSceneClick,
  onCharacterClick,
}: SceneCharacterMatrixProps) {
  // Filter to characters that appear in at least one scene
  const activeCharacters = useMemo(() => {
    const characterIdsInScenes = new Set<string>()

    scenes.forEach(scene => {
      if (scene.povCharacterId) {
        characterIdsInScenes.add(scene.povCharacterId)
      }
      scene.charactersPresent?.forEach(id => characterIdsInScenes.add(id))
    })

    // Include all characters but prioritize those that appear in scenes
    const active = characters.filter(c => characterIdsInScenes.has(c.id))
    const inactive = characters.filter(c => !characterIdsInScenes.has(c.id))

    // Return active characters first, then inactive ones
    return [...active, ...inactive]
  }, [scenes, characters])

  // Check if a character appears in a scene
  const isCharacterInScene = (scene: Scene, characterId: string): boolean => {
    return scene.povCharacterId === characterId ||
           (scene.charactersPresent?.includes(characterId) ?? false)
  }

  // Check if character is POV in scene
  const isPovInScene = (scene: Scene, characterId: string): boolean => {
    return scene.povCharacterId === characterId
  }

  // Count appearances per character
  const characterAppearanceCounts = useMemo(() => {
    const counts = new Map<string, number>()
    characters.forEach(char => {
      const count = scenes.filter(s => isCharacterInScene(s, char.id)).length
      counts.set(char.id, count)
    })
    return counts
  }, [scenes, characters])

  // Count characters per scene
  const sceneCharacterCounts = useMemo(() => {
    const counts = new Map<string, number>()
    scenes.forEach(scene => {
      const count = characters.filter(c => isCharacterInScene(scene, c.id)).length
      counts.set(scene.id, count)
    })
    return counts
  }, [scenes, characters])

  // Get key characters (protagonists and antagonists)
  const keyCharacters = useMemo(() => {
    return characters.filter(c => KEY_CHARACTER_ROLES.includes(c.role))
  }, [characters])

  // Detect issues for each scene
  const sceneIssues = useMemo(() => {
    const issues = new Map<string, SceneIssue[]>()

    scenes.forEach(scene => {
      const sceneIssueList: SceneIssue[] = []
      const characterCount = sceneCharacterCounts.get(scene.id) || 0

      // Check for overcrowded scene
      if (characterCount > OVERCROWDED_THRESHOLD) {
        sceneIssueList.push({
          type: 'overcrowded',
          severity: 'warning',
          message: `Scene has ${characterCount} characters`,
          details: `Scenes with more than ${OVERCROWDED_THRESHOLD} characters can be hard to follow. Consider splitting the scene or reducing character count.`
        })
      }

      issues.set(scene.id, sceneIssueList)
    })

    return issues
  }, [scenes, sceneCharacterCounts])

  // Detect issues for key characters (e.g., protagonist missing from multiple consecutive scenes)
  const characterIssues = useMemo(() => {
    const issues = new Map<string, SceneIssue[]>()

    keyCharacters.forEach(character => {
      const characterIssueList: SceneIssue[] = []
      const appearances = characterAppearanceCounts.get(character.id) || 0

      // If a protagonist/antagonist appears in less than 20% of scenes, warn
      if (scenes.length >= 5 && appearances < Math.ceil(scenes.length * 0.2)) {
        characterIssueList.push({
          type: 'missing_key_character',
          severity: 'warning',
          message: `${character.name} appears in only ${appearances} of ${scenes.length} scenes`,
          details: `As a ${character.role}, this character may need more screen time to develop their arc.`
        })
      }

      if (characterIssueList.length > 0) {
        issues.set(character.id, characterIssueList)
      }
    })

    return issues
  }, [keyCharacters, characterAppearanceCounts, scenes.length])

  // Get all unique issues for display
  const allIssues = useMemo(() => {
    const issueList: { sceneId?: string; characterId?: string; issue: SceneIssue }[] = []

    sceneIssues.forEach((issues, sceneId) => {
      issues.forEach(issue => {
        issueList.push({ sceneId, issue })
      })
    })

    characterIssues.forEach((issues, characterId) => {
      issues.forEach(issue => {
        issueList.push({ characterId, issue })
      })
    })

    return issueList
  }, [sceneIssues, characterIssues])

  if (scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <Film className="h-12 w-12 mb-4" />
        <p>No scenes to display in the matrix.</p>
      </div>
    )
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <User className="h-12 w-12 mb-4" />
        <p>No characters to display in the matrix.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Issues Summary Panel */}
      {allIssues.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-warning">
              {allIssues.length} Issue{allIssues.length !== 1 ? 's' : ''} Detected
            </h3>
          </div>
          <div className="space-y-2">
            {allIssues.map((item, idx) => {
              const scene = item.sceneId ? scenes.find(s => s.id === item.sceneId) : null
              const character = item.characterId ? characters.find(c => c.id === item.characterId) : null

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 bg-background/50 rounded-md"
                >
                  {item.issue.type === 'overcrowded' ? (
                    <Users className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  ) : (
                    <UserX className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-text-primary">
                      {scene && <span className="font-medium">"{scene.title}": </span>}
                      {character && <span className="font-medium">{character.name}: </span>}
                      {item.issue.message}
                    </p>
                    {item.issue.details && (
                      <p className="text-xs text-text-secondary mt-0.5">{item.issue.details}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full border-collapse min-w-max">
          {/* Header row with character names */}
          <thead>
            <tr className="bg-surface-elevated">
              {/* Empty corner cell */}
              <th className="p-3 text-left font-semibold text-text-primary border-b border-r border-border sticky left-0 bg-surface-elevated z-10 min-w-[200px]">
                Scene / Character
              </th>
              {activeCharacters.map(character => {
                const charIssues = characterIssues.get(character.id) || []
                const hasCharIssues = charIssues.length > 0

                return (
                <th
                  key={character.id}
                  className={`p-2 text-center border-b border-border min-w-[80px] cursor-pointer hover:bg-surface transition-colors ${
                    hasCharIssues ? 'bg-warning/10' : ''
                  }`}
                  onClick={() => onCharacterClick?.(character)}
                  title={hasCharIssues ? `${character.name} (${character.role})\n⚠ ${charIssues.map(i => i.message).join('\n')}` : `${character.name} (${character.role})`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium relative ${
                      character.role === 'protagonist' ? 'bg-accent/20 text-accent' :
                      character.role === 'antagonist' ? 'bg-error/20 text-error' :
                      character.role === 'supporting' ? 'bg-success/20 text-success' :
                      'bg-text-secondary/20 text-text-secondary'
                    }`}>
                      {character.name.charAt(0).toUpperCase()}
                      {hasCharIssues && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-normal max-w-[70px] truncate ${hasCharIssues ? 'text-warning' : 'text-text-secondary'}`}>
                      {character.name.split(' ')[0]}
                    </span>
                    <span className={`text-xs ${hasCharIssues ? 'text-warning/80' : 'text-text-secondary/60'}`}>
                      ({characterAppearanceCounts.get(character.id) || 0})
                    </span>
                  </div>
                </th>
              )})}
              {/* Total column */}
              <th className="p-2 text-center border-b border-l border-border bg-surface min-w-[60px]">
                <span className="text-xs font-medium text-text-secondary">Total</span>
              </th>
            </tr>
          </thead>

          {/* Body rows with scenes */}
          <tbody>
            {scenes.map((scene, sceneIndex) => {
              const issues = sceneIssues.get(scene.id) || []
              const hasIssues = issues.length > 0

              return (
              <tr
                key={scene.id}
                className={`${sceneIndex % 2 === 0 ? 'bg-background' : 'bg-surface'} ${hasIssues ? 'ring-1 ring-warning/50' : ''} hover:bg-surface-elevated transition-colors`}
              >
                {/* Scene title cell */}
                <td
                  className={`p-3 border-r border-border sticky left-0 z-10 cursor-pointer ${
                    sceneIndex % 2 === 0 ? 'bg-background' : 'bg-surface'
                  } ${hasIssues ? 'bg-warning/5' : ''} hover:bg-surface-elevated`}
                  onClick={() => onSceneClick?.(scene)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      hasIssues ? 'bg-warning/20 text-warning' : 'bg-accent/20 text-accent'
                    }`}>
                      {sceneIndex + 1}
                    </span>
                    <span className="font-medium text-text-primary truncate max-w-[160px]" title={scene.title}>
                      {scene.title}
                    </span>
                    {hasIssues && (
                      <div className="flex items-center gap-1" title={issues.map(i => i.message).join('\n')}>
                        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Character appearance cells */}
                {activeCharacters.map(character => {
                  const inScene = isCharacterInScene(scene, character.id)
                  const isPov = isPovInScene(scene, character.id)

                  return (
                    <td
                      key={character.id}
                      className="p-2 text-center border-border"
                      title={inScene ? (isPov ? `${character.name} (POV)` : character.name) : ''}
                    >
                      {inScene ? (
                        <div className="flex items-center justify-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isPov
                              ? 'bg-accent text-white'
                              : 'bg-success/20 text-success'
                          }`}>
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-secondary/30">-</span>
                      )}
                    </td>
                  )
                })}

                {/* Total cell */}
                <td className={`p-2 text-center border-l border-border ${
                  (sceneCharacterCounts.get(scene.id) || 0) > OVERCROWDED_THRESHOLD
                    ? 'bg-warning/20'
                    : 'bg-surface/50'
                }`}>
                  <span className={`text-sm font-medium ${
                    (sceneCharacterCounts.get(scene.id) || 0) > OVERCROWDED_THRESHOLD
                      ? 'text-warning'
                      : 'text-text-primary'
                  }`}>
                    {sceneCharacterCounts.get(scene.id) || 0}
                    {(sceneCharacterCounts.get(scene.id) || 0) > OVERCROWDED_THRESHOLD && (
                      <span className="ml-1">⚠</span>
                    )}
                  </span>
                </td>
              </tr>
            )})}
          </tbody>

          {/* Footer row with totals */}
          <tfoot>
            <tr className="bg-surface-elevated border-t border-border">
              <td className="p-3 font-semibold text-text-primary border-r border-border sticky left-0 bg-surface-elevated z-10">
                Appearances
              </td>
              {activeCharacters.map(character => (
                <td key={character.id} className="p-2 text-center">
                  <span className="text-sm font-medium text-text-primary">
                    {characterAppearanceCounts.get(character.id) || 0}
                  </span>
                </td>
              ))}
              <td className="p-2 text-center border-l border-border">
                <span className="text-sm font-bold text-accent">
                  {scenes.reduce((sum, s) => sum + (sceneCharacterCounts.get(s.id) || 0), 0)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span>POV Character</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="h-3 w-3 text-success" />
          </div>
          <span>Present in Scene</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary/30">-</span>
          <span>Not in Scene</span>
        </div>
      </div>
    </div>
  )
}
