import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  getFictionChapterSummaryPrompt,
  getNonFictionChapterSummaryPrompt,
  getChapterConnectionsAnalysisPrompt,
  getOverallSummaryPrompt,
  getTestConnectionPrompt,
  getChapterMindMapPrompt,
  getMindMapArrowPrompt,
  getQuizPrompt,
  getFlashcardPrompt,
} from './prompts'
import type { MindElixirData } from 'mind-elixir'
import { getLanguageInstruction, type SupportedLanguage } from './prompts/utils'

interface Chapter {
  id: string
  title: string
  content: string
  summary?: string
}

interface AIConfig {
  provider: 'gemini' | 'openai'
  apiKey: string
  apiUrl?: string // For OpenAI compatible APIs
  model?: string
  temperature?: number
}

export class AIService {
  private config: AIConfig | (() => AIConfig)
  private genAI?: GoogleGenerativeAI
  private model: any

  constructor(config: AIConfig | (() => AIConfig)) {
    this.config = config
    
    const currentConfig = typeof config === 'function' ? config() : config
    
    if (currentConfig.provider === 'gemini') {
      this.genAI = new GoogleGenerativeAI(currentConfig.apiKey)
      this.model = this.genAI.getGenerativeModel({ 
        model: currentConfig.model || 'gemini-1.5-flash'
      })
    } else if (currentConfig.provider === 'openai') {
      this.model = {
        apiUrl: currentConfig.apiUrl || 'https://api.openai.com/v1',
        apiKey: currentConfig.apiKey,
        model: currentConfig.model || 'gpt-3.5-turbo'
      }
    }
  }

  private getCurrentConfig(): AIConfig {
    return typeof this.config === 'function' ? this.config() : this.config
  }

  async summarizeChapter(title: string, content: string, bookType: 'fiction' | 'non-fiction' = 'non-fiction', outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<string> {
    try {
      let prompt = bookType === 'fiction'
        ? getFictionChapterSummaryPrompt(title, content)
        : getNonFictionChapterSummaryPrompt(title, content)

      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`
      }

      const summary = await this.generateContent(prompt, outputLanguage)

      if (!summary || summary.trim().length === 0) {
        throw new Error('AI returned an empty summary.')
      }

      return summary.trim()
    } catch (error) {
      throw new Error(`Chapter summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async analyzeConnections(chapters: Chapter[], outputLanguage: SupportedLanguage = 'en'): Promise<string> {
    try {
      const chapterSummaries = chapters.map((chapter) => 
        `${chapter.title}:\n${chapter.summary || 'No summary'}`
      ).join('\n\n')

      const prompt = getChapterConnectionsAnalysisPrompt(chapterSummaries)

      const connections = await this.generateContent(prompt, outputLanguage)

      if (!connections || connections.trim().length === 0) {
        throw new Error('AI returned empty connection analysis.')
      }

      return connections.trim()
    } catch (error) {
      throw new Error(`Chapter connection analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateOverallSummary(
    bookTitle: string, 
    chapters: Chapter[], 
    connections: string,
    outputLanguage: SupportedLanguage = 'en'
  ): Promise<string> {
    try {
      const chapterInfo = chapters.map((chapter, index) => 
        `Chapter ${index + 1}: ${chapter.title}, Content: ${chapter.summary || 'No summary'}`
      ).join('\n')

      const prompt = getOverallSummaryPrompt(bookTitle, chapterInfo, connections)

      const summary = await this.generateContent(prompt, outputLanguage)

      if (!summary || summary.trim().length === 0) {
        throw new Error('AI returned an empty overall summary.')
      }

      return summary.trim()
    } catch (error) {
      throw new Error(`Overall summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  async generateChapterQuiz(title: string, content: string, outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<any> {
    try {
        let prompt = getQuizPrompt(title, content);

        if (customPrompt && customPrompt.trim()) {
            prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`;
        }

        const quizJson = await this.generateContent(prompt, outputLanguage);
        return JSON.parse(quizJson);
    } catch (error) {
        throw new Error(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateChapterFlashcards(title: string, content: string, outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<any> {
      try {
          let prompt = getFlashcardPrompt(title, content);

          if (customPrompt && customPrompt.trim()) {
              prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`;
          }

          const flashcardsJson = await this.generateContent(prompt, outputLanguage);
          return JSON.parse(flashcardsJson);
      } catch (error) {
          throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
  }
  
  async generateChapterMindMap(content: string, outputLanguage: SupportedLanguage = 'en', customPrompt?: string): Promise<MindElixirData> {
    try {
      const basePrompt = getChapterMindMapPrompt()
      let prompt = basePrompt + `Chapter content:\n${content}`

      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`
      }

      const mindMapJson = await this.generateContent(prompt, outputLanguage)

      if (!mindMapJson || mindMapJson.trim().length === 0) {
        throw new Error('AI returned empty mind map data.')
      }
      
      try {
        return JSON.parse(mindMapJson.trim())
      } catch {
        const jsonMatch = mindMapJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch {
            throw new Error('AI returned incorrectly formatted mind map data.')
          }
        }
        throw new Error('AI returned incorrectly formatted mind map data.')
      }
    } catch (error) {
      throw new Error(`Chapter mind map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateMindMapArrows(combinedMindMapData: any, outputLanguage: SupportedLanguage = 'en'): Promise<any> {
    try {
      const basePrompt = getMindMapArrowPrompt()
      const prompt = basePrompt + `\n\nCurrent mind map data:\n${JSON.stringify(combinedMindMapData, null, 2)}`

      const arrowsJson = await this.generateContent(prompt, outputLanguage)

      if (!arrowsJson || arrowsJson.trim().length === 0) {
        throw new Error('AI returned empty arrow data.')
      }

      try {
        return JSON.parse(arrowsJson.trim())
      } catch {
        const jsonMatch = arrowsJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch {
            throw new Error('AI returned incorrectly formatted arrow data.')
          }
        }
        throw new Error('AI returned incorrectly formatted arrow data.')
      }
    } catch (error) {
      throw new Error(`Mind map arrow generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateCombinedMindMap(bookTitle: string, chapters: Chapter[], customPrompt?: string): Promise<MindElixirData> {
    try {
      const basePrompt = getChapterMindMapPrompt()
      const chaptersContent = chapters.map(item=>item.content).join('\n\n ------------- \n\n')
      let prompt = `${basePrompt}
        Please generate a complete mind map for the entire book "${bookTitle}", integrating the content of all chapters.
        Chapter content:\n${chaptersContent}`

      if (customPrompt && customPrompt.trim()) {
        prompt += `\n\nAdditional instructions: ${customPrompt.trim()}`
      }

      const mindMapJson = await this.generateContent(prompt, 'en')

      if (!mindMapJson || mindMapJson.trim().length === 0) {
        throw new Error('AI returned empty mind map data.')
      }
      
      try {
        return JSON.parse(mindMapJson.trim())
      } catch {
        const jsonMatch = mindMapJson.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1].trim())
          } catch {
            throw new Error('AI returned incorrectly formatted mind map data.')
          }
        }
        throw new Error('AI returned incorrectly formatted mind map data.')
      }
    } catch (error) {
      throw new Error(`Full book mind map generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async generateContent(prompt: string, outputLanguage?: SupportedLanguage): Promise<string> {
    const config = this.getCurrentConfig()
    const language = outputLanguage || 'en'
    const systemPrompt = getLanguageInstruction(language)
    
    if (config.provider === 'gemini') {
      const finalPrompt = `${prompt}\n\n**${systemPrompt}**`
      const result = await this.model.generateContent(finalPrompt, {
        generationConfig: {
          temperature: config.temperature || 0.7
        }
      })
      const response = await result.response
      return response.text()
    } else if (config.provider === 'openai') {
      const messages: Array<{role: 'system' | 'user', content: string}> = [
        {
          role: 'user',
          content: prompt + '\n\n' + systemPrompt
        }
      ]
      
      const response = await fetch(`${this.model.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.model.apiKey}`
        },
        body: JSON.stringify({
          model: this.model.model,
          messages,
          temperature: config.temperature || 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    }
    
    throw new Error('Unsupported AI provider')
  }

  async testConnection(): Promise<boolean> {
    try {
      const text = await this.generateContent(getTestConnectionPrompt())
      return text.includes('Connection successful') || text.includes('successful')
    } catch {
      return false
    }
  }
}

// For backward compatibility
export class GeminiService extends AIService {
  constructor(apiKey: string) {
    super({ provider: 'gemini', apiKey })
  }
}
