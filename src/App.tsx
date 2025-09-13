import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Upload, BookOpen, Brain, FileText, Loader2, Network, Trash2, List, ChevronUp, HelpCircle, PencilLine } from 'lucide-react';
import { EpubProcessor, type ChapterData } from './services/epubProcessor';
import { PdfProcessor } from './services/pdfProcessor';
import { AIService } from './services/geminiService';
import { CacheService } from './services/cacheService';
import { ConfigDialog } from './components/project/ConfigDialog';
import type { MindElixirData, MindElixirInstance } from 'mind-elixir';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { MarkdownCard } from './components/MarkdownCard';
import { MindMapCard } from './components/MindMapCard';
import { QuizCard } from './components/QuizCard';
import { FlashcardCard } from './components/FlashcardCard';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { scrollToTop, openInMindElixir } from './utils';
import { downloadMindMap, downloadContent } from './utils/downloadUtils';
import { useAIConfig, useProcessingOptions, useConfigStore } from './stores/configStore';

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
  id: string;
  title: string;
  content: string;
  summary?: string;
  mindMap?: MindElixirData;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  processed: boolean;
}

interface BookOutput<T> {
  title: string;
  author: string;
  chapters: T[];
}

const cacheService = new CacheService();

function App() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [extractingChapters, setExtractingChapters] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const [bookResult, setBookResult] = useState<BookOutput<Chapter> | null>(null);
  
  const [extractedChapters, setExtractedChapters] = useState<ChapterData[] | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [bookData, setBookData] = useState<{ title: string; author: string } | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const mindElixirInstanceRef = useRef<MindElixirInstance | null>(null);

  const aiConfig = useAIConfig();
  const processingOptions = useProcessingOptions();
  const { apiKey } = aiConfig;
  const { processingMode, bookType, useSmartDetection, skipNonEssentialChapters, maxSubChapterDepth, outputLanguage } = processingOptions;

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && (selectedFile.name.endsWith('.epub') || selectedFile.name.endsWith('.pdf'))) {
      setFile(selectedFile);
      setExtractedChapters(null);
      setSelectedChapters(new Set());
      setBookData(null);
      setBookResult(null);
    } else {
      toast.error(t('upload.invalidFile'), { duration: 3000, position: 'top-center' });
    }
  }, [t]);

  const handleChapterSelect = useCallback((chapterId: string, checked: boolean) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(chapterId);
      else newSet.delete(chapterId);
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!extractedChapters) return;
    setSelectedChapters(checked ? new Set(extractedChapters.map(chapter => chapter.id)) : new Set());
  }, [extractedChapters]);

  const extractChapters = useCallback(async () => {
    if (!file) {
        toast.error(t('upload.pleaseSelectFile'), { duration: 3000, position: 'top-center' });
        return;
    }
    setExtractingChapters(true);
    setCurrentStep(t('progress.extractingChapters'));
    try {
        let chapters: ChapterData[];
        let bookInfo: { title: string; author: string };
        if (file.name.endsWith('.epub')) {
            const processor = new EpubProcessor();
            const book = await processor.parseEpub(file);
            chapters = await processor.extractChapters(book.book, useSmartDetection, skipNonEssentialChapters, maxSubChapterDepth);
            bookInfo = { title: book.title, author: book.author };
        } else {
            const processor = new PdfProcessor();
            const pdfData = await processor.parsePdf(file);
            chapters = await processor.extractChapters(file, useSmartDetection, skipNonEssentialChapters, maxSubChapterDepth);
            bookInfo = { title: pdfData.title, author: pdfData.author };
        }
        setBookData(bookInfo);
        setExtractedChapters(chapters);
        setSelectedChapters(new Set(chapters.map(c => c.id)));
        toast.success(`${t('progress.successfullyExtracted', { count: chapters.length })}`);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : t('progress.extractionError'));
    } finally {
        setExtractingChapters(false);
        setCurrentStep('');
    }
  }, [file, useSmartDetection, skipNonEssentialChapters, maxSubChapterDepth, t]);
  
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
    setBookResult(null);

    try {
      const aiService = new AIService(() => useConfigStore.getState().aiConfig);
      const chaptersToProcess = extractedChapters.filter(chapter => selectedChapters.has(chapter.id));
      const processedChapters: Chapter[] = [];

      for (const [index, chapter] of chaptersToProcess.entries()) {
        setCurrentStep(`${t('progress.processingChapter', { current: index + 1, total: chaptersToProcess.length, title: chapter.title })}`);
        
        let processedChapter: Chapter = { ...chapter, processed: true };

        switch (processingMode) {
          case 'summary':
            processedChapter.summary = await aiService.summarizeChapter(chapter.title, chapter.content, bookType, outputLanguage, customPrompt);
            break;
          case 'mindmap':
            processedChapter.mindMap = await aiService.generateChapterMindMap(chapter.content, outputLanguage, customPrompt);
            break;
          case 'quiz':
            const quizData = await aiService.generateChapterQuiz(chapter.title, chapter.content, outputLanguage, customPrompt);
            processedChapter.quiz = quizData.questions;
            break;
          case 'flashcard':
            const flashcardData = await aiService.generateChapterFlashcards(chapter.title, chapter.content, outputLanguage, customPrompt);
            processedChapter.flashcards = flashcardData.flashcards;
            break;
        }
        processedChapters.push(processedChapter);
        setProgress( (index + 1) / chaptersToProcess.length * 100);
      }
      
      setBookResult({ title: bookData.title, author: bookData.author, chapters: processedChapters });
      setCurrentStep(t('progress.completed'));

    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('progress.processingError'));
      setCurrentStep(t('progress.processingError'));
    } finally {
      setProcessing(false);
    }
  }, [extractedChapters, bookData, apiKey, selectedChapters, processingMode, bookType, customPrompt, outputLanguage, t]);


  const renderResults = () => {
    if (!bookResult) return null;

    switch (processingMode) {
      case 'summary':
        return (
          <Card>
            <CardHeader><CardTitle>{t('results.summaryTitle', { title: bookResult.title })}</CardTitle></CardHeader>
            <CardContent>
              {bookResult.chapters.map((chapter, index) => (
                <MarkdownCard key={chapter.id} id={chapter.id} title={chapter.title} content={chapter.content} markdownContent={chapter.summary || ''} index={index} />
              ))}
            </CardContent>
          </Card>
        );
      case 'mindmap':
        return (
            <Card>
                <CardHeader><CardTitle>{t('results.summaryTitle', { title: bookResult.title })}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookResult.chapters.map((chapter, index) => (
                        <MindMapCard 
                            key={chapter.id} 
                            id={chapter.id}
                            title={chapter.title} 
                            content={chapter.content} 
                            mindMapData={chapter.mindMap} 
                            index={index}
                            onDownloadMindMap={(instance, title, format) => downloadMindMap(instance, title, format)}
                            onOpenInMindElixir={openInMindElixir}
                        />
                    ))}
                </CardContent>
            </Card>
        );
      case 'quiz':
        return <QuizCard title={t('results.quizTitle', { title: bookResult.title })} quizData={bookResult.chapters.flatMap(c => c.quiz || [])} />;
      case 'flashcard':
        return <FlashcardCard title={t('results.flashcardTitle', { title: bookResult.title })} flashcardData={bookResult.chapters.flatMap(c => c.flashcards || [])} />;
      default:
        return null;
    }
  }

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
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('upload.selectedFile')}: {file?.name || t('upload.noFileSelected')}
              </div>
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
              <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id="select-all" onCheckedChange={(checked) => handleSelectAll(checked as boolean)} checked={selectedChapters.size === extractedChapters.length && extractedChapters.length > 0} />
                  <Label htmlFor="select-all">{t('chapters.selectAll')}</Label>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {extractedChapters.map(chapter => (
                  <div key={chapter.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={chapter.id}
                      checked={selectedChapters.has(chapter.id)}
                      onCheckedChange={(checked) => handleChapterSelect(chapter.id, checked as boolean)}
                    />
                    <Label htmlFor={chapter.id} className="truncate cursor-pointer">{chapter.title}</Label>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="custom-prompt">{t('chapters.customPrompt')}</Label>
                <Textarea 
                  id="custom-prompt"
                  placeholder={t('chapters.customPromptPlaceholder')} 
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                />
              </div>
              <Button onClick={processEbook} disabled={processing || selectedChapters.size === 0} className="w-full mt-4">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                {t('chapters.startProcessing')}
              </Button>
            </CardContent>
          </Card>
        )}

        {(processing || extractingChapters) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-1">
                  <span>{currentStep}</span>
                  <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>
        )}
        
        {renderResults()}

      </div>
        {showBackToTop && (
            <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700"
            size="icon"
            aria-label={t('common.backToTop')}
            >
            <ChevronUp className="h-6 w-6" />
            </Button>
        )}
    </div>
  )
}

export default App
