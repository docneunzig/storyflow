// Active generation tracking for cancellation support
const activeGenerations = new Map<string, { cancelled: boolean }>()

export function registerGeneration(id: string): void {
  activeGenerations.set(id, { cancelled: false })
}

export function cancelGeneration(id: string): void {
  const gen = activeGenerations.get(id)
  if (gen) gen.cancelled = true
}

export function cleanupGeneration(id: string): void {
  activeGenerations.delete(id)
}

export function isGenerationCancelled(id: string): boolean {
  return activeGenerations.get(id)?.cancelled ?? false
}
