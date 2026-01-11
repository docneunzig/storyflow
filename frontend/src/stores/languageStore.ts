import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Language, getTranslations, type Translations } from '@/lib/i18n'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  t: Translations
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      t: getTranslations('en'),
      setLanguage: (language: Language) =>
        set({
          language,
          t: getTranslations(language),
        }),
    }),
    {
      name: 'storyflow-language',
      // Only persist the language, not the translations object
      partialize: (state) => ({ language: state.language }),
      // Merge stored state with initial state, recalculating t
      merge: (persistedState, currentState) => {
        const stored = persistedState as { language?: Language }
        const language = stored?.language || currentState.language
        return {
          ...currentState,
          language,
          t: getTranslations(language),
        }
      },
    }
  )
)

// Hook for easy access to translations
export function useTranslations() {
  return useLanguageStore((state) => state.t)
}

// Hook for language switching
export function useLanguage() {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  return { language, setLanguage }
}
