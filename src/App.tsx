import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Upload, BookOpen, Brain, FileText, Loader2, Network, Trash2, List, ChevronUp, HelpCircle, PencilLine } from 'lucide-react'
import { EpubProcessor, type ChapterData } from './services/epubProcessor'
import { PdfProcessor } from './services/pdfProcessor'
import { AIService } from './services/geminiService'
import { CacheService } from './services/cacheService'
import { ConfigDialog } from './components/project/ConfigDialog'
import type { MindElixirData } from 'mind-elixir'
import type { Summary } from 'node_modules/mind-elixir/dist/types/summary'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { MarkdownCard } from './components/MarkdownCard'
import { MindMapCard } from './components/MindMapCard'
import { QuizCard } from './components/QuizCard'
import { FlashcardCard } from './components/FlashcardCard'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { scrollToTop, openInMindElixir, downloadMindMap, handleDownload } from './utils'
import { useAIConfig, useProcessingOptions, useConfigStore } from './stores/configStore'

const options = { direction: 1, alignment: 'nodes' } as const

// --- Interfaces ---
interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  answerLocation: string;
}

interface Flashcard {
  front: string;
  back: string;
  answerLocation: string;
}

interface Chapter {
  id: string
  title: string
  content: string
  summary?: string
  mindMap?: MindElixirData
  quiz?: QuizQuestion[]
  flashcards?: Flashcard[]
  processed: boolean
}

interface BookSummary {
  title: string
  author: string
  chapters: Chapter[]
  connections: string
  overallSummary: string
}

interface BookMindMap {
  title: string
  author: string
  chapters: Chapter[]
  combinedMindMap: MindElixirData | null
}

interface BookQuiz {
  title: string;
  author: string;
  chapters: Chapter[];
}

interface BookFlashcards {
  title: string;
  author: string;
  chapters: Chapter[];
}

const cacheService = new CacheService()

function App() {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [extractingChapters, setExtractingChapters] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [bookSummary, setBookSummary] = useState<BookSummary | null>(null)
  const [bookMindMap, setBookMindMap] = useState<BookMindMap | null>(null)
  const [bookQuiz, setBookQuiz] = useState<BookQuiz | null>(null);
  const [bookFlashcards, setBookFlashcards] = useState<BookFlashcards | null>(null);
  const [extractedChapters, setExtractedChapters] = useState<ChapterData[] | null>(null)
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set())
  const [bookData, setBookData] = useState<{ title: string; author: string } | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)

  const aiConfig = useAIConfig()
  const processingOptions = useProcessingOptions()
  const { apiKey } = aiConfig
  const { processingMode, bookType, useSmartDetection, skipNonEssentialChapters } = processingOptions

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && (selectedFile.name.endsWith('.epub') || selectedFile.name.endsWith('.pdf'))) {
      setFile(selectedFile)
      setExtractedChapters(null)
      setSelectedChapters(new Set())
      setBookData(null)
      setBookSummary(null)
      setBookMindMap(null)
      setBookQuiz(null)
      setBookFlashcards(null)
    } else {
      toast.error(t('upload.invalidFile'), { duration: 3000, position: 'top-center' })
    }
  }, [t])

  const clearChapterCache = (chapterId: string) => {
    if (!file) return
    const type = processingMode === 'summary' ? 'summary' : processingMode
    if (cacheService.clearChapterCache(file.name, chapterId, type as any)) {
      toast.success('Cache for this chapter cleared.', { duration: 3000, position: 'top-center' })
    }
  }

  const handleChapterSelect = useCallback((chapterId: string, checked: boolean) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev)
      if (checked) newSet.add(chapterId)
      else newSet.delete(chapterId)
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!extractedChapters) return
    if (checked) {
      setSelectedChapters(new Set(extractedChapters.map(chapter => chapter.id)))
    } else {
      setSelectedChapters(new Set())
    }
  }, [extractedChapters])

  const extractChapters = useCallback(async () => {
    if (!file) {
        toast.error(t('upload.pleaseSelectFile'), { duration: 3000, position: 'top-center' });
        return;
    }
    setExtractingChapters(true);
    try {
        let chapters: ChapterData[];
        let bookInfo: { title: string; author: string };
        if (file.name.endsWith('.epub')) {
            const processor = new EpubProcessor();
            const book = await processor.parseEpub(file);
            chapters = await processor.extractChapters(book.book, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth);
            bookInfo = { title: book.title, author: book.author };
        } else {
            const processor = new PdfProcessor();
            const pdfData = await processor.parsePdf(file);
            chapters = await processor.extractChapters(file, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth);
            bookInfo = { title: pdfData.title, author: pdfData.author };
        }
        setBookData(bookInfo);
        setExtractedChapters(chapters);
        setSelectedChapters(new Set(chapters.map(c => c.id)));
        toast.success(`Successfully extracted ${chapters.length} chapters.`);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : t('progress.extractionError'));
    } finally {
        setExtractingChapters(false);
    }
  }, [file, useSmartDetection, skipNonEssentialChapters, processingOptions.maxSubChapterDepth, t]);
  
  const processEbook = useCallback(async () => {
    if (!extractedChapters || !bookData || !apiKey) {
      toast.error(t('chapters.extractAndApiKey'));
      return;
    }
    if (selectedChapters.size === 0) {
      toast.error(t('chapters.selectAtLeastOne'));
      return;
    }

    setProcessing(true);
    setBookSummary(null);
    setBookMindMap(null);
    setBookQuiz(null);
    setBookFlashcards(null);

    try {
      const aiService = new AIService(() => useConfigStore.getState().aiConfig);
      const chaptersToProcess = extractedChapters.filter(chapter => selectedChapters.has(chapter.id));
      const processedChapters: Chapter[] = [];

      for (const [index, chapter] of chaptersToProcess.entries()) {
        setCurrentStep(`Processing chapter ${index + 1}/${chaptersToProcess.length}: ${chapter.title}`);
        
        let processedChapter: Chapter = { ...chapter, processed: true };

        switch (processingMode) {
          case 'summary':
            processedChapter.summary = await aiService.summarizeChapter(chapter.title, chapter.content, bookType, processingOptions.outputLanguage, customPrompt);
            break;
          case 'mindmap':
            processedChapter.mindMap = await aiService.generateChapterMindMap(chapter.content, processingOptions.outputLanguage, customPrompt);
            break;
          case 'quiz':
            const quizData = await aiService.generateChapterQuiz(chapter.title, chapter.content, processingOptions.outputLanguage, customPrompt);
            processedChapter.quiz = quizData.questions;
            break;
          case 'flashcard':
            const flashcardData = await aiService.generateChapterFlashcards(chapter.title, chapter.content, processingOptions.outputLanguage, customPrompt);
            processedChapter.flashcards = flashcardData.flashcards;
            break;
        }
        processedChapters.push(processedChapter);
        setProgress( (index + 1) / chaptersToProcess.length * 100);
      }

      switch (processingMode) {
        case 'summary':
          setBookSummary({ title: bookData.title, author: bookData.author, chapters: processedChapters, connections: '', overallSummary: '' });
          break;
        case 'mindmap':
          setBookMindMap({ title: bookData.title, author: bookData.author, chapters: processedChapters, combinedMindMap: null });
          break;
        case 'quiz':
          setBookQuiz({ title: bookData.title, author: bookData.author, chapters: processedChapters });
          break;
        case 'flashcard':
          setBookFlashcards({ title: bookData.title, author: bookData.author, chapters: processedChapters });
          break;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.processingError'));
    } finally {
      setProcessing(false);
    }
  }, [extractedChapters, bookData, apiKey, selectedChapters, processingMode, bookType, customPrompt, processingOptions.outputLanguage, t]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            {t('app.title')}
          </h1>
          <p className="text-gray-600">{t('app.description')}</p>
          <LanguageSwitcher />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t('upload.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">{t('upload.selectFile')}</Label>
              <Input id="file" type="file" accept=".epub,.pdf" onChange={handleFileChange} disabled={processing || extractingChapters} />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">{t('upload.selectedFile')}: {file?.name || t('upload.noFileSelected')}</div>
              <ConfigDialog processing={processing || extractingChapters} />
            </div>
            <Button onClick={extractChapters} disabled={!file || extractingChapters || processing} className="w-full">
              {extractingChapters ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <List className="mr-2 h-4 w-4" />}
              {extractingChapters ? t('upload.extractingChapters') : t('upload.extractChapters')}
            </Button>
          </CardContent>
        </Card>

        {extractedChapters && (
          <Card>
            <CardHeader>
              <CardTitle>{t('chapters.title')}</CardTitle>
              <div className="flex items-center space-x-2">
                  <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAll(checked as boolean)} />
                  <Label htmlFor="select-all">{t('chapters.selectAll')}</Label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extractedChapters.map(chapter => (
                  <div key={chapter.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapters.has(chapter.id)}
                      onCheckedChange={(checked) => handleChapterSelect(chapter.id, checked as boolean)}
                    />
                    <Label htmlFor={chapter.id} className="truncate">{chapter.title}</Label>
                  </div>
                ))}
              </div>
              <Textarea 
                placeholder={t('chapters.customPromptPlaceholder')} 
                value={customPrompt} 
                onChange={(e) => setCustomPrompt(e.target.value)} 
                className="mt-4"
              />
              <Button onClick={processEbook} disabled={processing || selectedChapters.size === 0} className="w-full mt-4">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                {t('chapters.startProcessing')}
              </Button>
            </CardContent>
          </Card>
        )}

        {processing && (
          <Card>
            <CardContent className="p-4">
              <Progress value={progress} />
              <p className="text-center text-sm mt-2">{currentStep}</p>
            </CardContent>
          </Card>
        )}

        {/* --- Results Display --- */}
        {bookSummary && processingMode === 'summary' && (
            <MarkdownCard
                id="summary-card"
                title={t('results.summaryTitle', { title: bookSummary.title })}
                content={bookSummary.chapters.map(c => c.summary).join('\n\n')}
                markdownContent={bookSummary.chapters.map(c => `## ${c.title}\n${c.summary}`).join('\n\n')}
                index={0}
            />
        )}
        {bookMindMap && processingMode === 'mindmap' && (
             <MindMapCard
                id="mindmap-card"
                title={t('results.summaryTitle', { title: bookMindMap.title })}
                content={""}
                mindMapData={bookMindMap.combinedMindMap}
                index={0}
                onDownloadMindMap={downloadMindMap}
             />
        )}
        {bookQuiz && processingMode === 'quiz' && (
          <QuizCard
            title={t('results.quizTitle', { title: bookQuiz.title })}
            quizData={bookQuiz.chapters.flatMap(c => c.quiz || [])}
          />
        )}
        {bookFlashcards && processingMode === 'flashcard' && (
          <FlashcardCard
            title={t('results.flashcardTitle', { title: bookFlashcards.title })}
            flashcardData={bookFlashcards.chapters.flatMap(c => c.flashcards || [])}
          />
        )}

      </div>
    </div>
  )
}

export default App
