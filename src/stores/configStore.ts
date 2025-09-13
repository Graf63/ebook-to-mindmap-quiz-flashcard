import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SupportedLanguage } from '../services/prompts/utils'

// AI
interface AIConfig {
  provider: 'gemini' | 'openai'
  apiKey: string
  apiUrl: string
  model: string
  temperature: number
}

// Processing options
interface ProcessingOptions {
  processingMode: 'summary' | 'mindmap' | 'quiz' | 'flashcard'
  bookType: 'fiction' | 'non-fiction'
  useSmartDetection: boolean
  skipNonEssentialChapters: boolean
  maxSubChapterDepth: number
  outputLanguage: SupportedLanguage
}

// Config store state
interface ConfigState {
  aiConfig: AIConfig
  setAiProvider: (provider: 'gemini' | 'openai') => void
  setApiKey: (apiKey: string) => void
  setApiUrl: (apiUrl: string) => void
  setModel: (model: string) => void
  setTemperature: (temperature: number) => void
  
  processingOptions: ProcessingOptions
  setProcessingMode: (mode: 'summary' | 'mindmap' | 'quiz' | 'flashcard') => void
  setBookType: (type: 'fiction' | 'non-fiction') => void
  setUseSmartDetection: (enabled: boolean) => void
  setSkipNonEssentialChapters: (enabled: boolean) => void
  setMaxSubChapterDepth: (depth: number) => void
  setOutputLanguage: (language: SupportedLanguage) => void
}

// Defaults
const defaultAIConfig: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1',
  model: 'gemini-1.5-flash',
  temperature: 0.7
}

const defaultProcessingOptions: ProcessingOptions = {
  processingMode: 'mindmap',
  bookType: 'non-fiction',
  useSmartDetection: false,
  skipNonEssentialChapters: true,
  maxSubChapterDepth: 0,
  outputLanguage: 'en'
}

// Store creation
export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      aiConfig: defaultAIConfig,
      setAiProvider: (provider) => set((state) => ({ aiConfig: { ...state.aiConfig, provider } })),
      setApiKey: (apiKey) => set((state) => ({ aiConfig: { ...state.aiConfig, apiKey } })),
      setApiUrl: (apiUrl) => set((state) => ({ aiConfig: { ...state.aiConfig, apiUrl } })),
      setModel: (model) => set((state) => ({ aiConfig: { ...state.aiConfig, model } })),
      setTemperature: (temperature) => set((state) => ({ aiConfig: { ...state.aiConfig, temperature } })),
      
      processingOptions: defaultProcessingOptions,
      setProcessingMode: (processingMode) => set((state) => ({ processingOptions: { ...state.processingOptions, processingMode } })),
      setBookType: (bookType) => set((state) => ({ processingOptions: { ...state.processingOptions, bookType } })),
      setUseSmartDetection: (useSmartDetection) => set((state) => ({ processingOptions: { ...state.processingOptions, useSmartDetection } })),
      setSkipNonEssentialChapters: (skipNonEssentialChapters) => set((state) => ({ processingOptions: { ...state.processingOptions, skipNonEssentialChapters } })),
      setMaxSubChapterDepth: (maxSubChapterDepth) => set((state) => ({ processingOptions: { ...state.processingOptions, maxSubChapterDepth } })),
      setOutputLanguage: (outputLanguage) => set((state) => ({ processingOptions: { ...state.processingOptions, outputLanguage } }))
    }),
    {
      name: 'ebook-study-tools-config',
      partialize: (state) => ({
        aiConfig: state.aiConfig,
        processingOptions: state.processingOptions
      })
    }
  )
)

export const useAIConfig = () => useConfigStore((state) => state.aiConfig)
export const useProcessingOptions = () => useConfigStore((state) => state.processingOptions)
