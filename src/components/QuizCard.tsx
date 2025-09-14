import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadContentButton } from './DownloadContentButton';

export const QuizCard = ({ title, quizData }: { title: any, quizData: any[] }) => {
  const [showAnswers, setShowAnswers] = useState<any>({});

  const toggleAnswer = (index: number) => {
    setShowAnswers((prev: any) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Quiz: {title}</span>
          <DownloadContentButton 
            title={title} 
            processingMode="quiz" 
            data={quizData} 
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quizData.map((q: any, index: number) => (
          <div key={index} className="mb-4">
            <p><strong>{index + 1}. {q.question}</strong></p>
            <div className="ml-4">
              {q.options.map((opt: any, i: number) => (
                <p key={i} className={i === q.correctAnswerIndex && showAnswers[index] ? 'text-green-600' : ''}>
                  {opt}
                </p>
              ))}
            </div>
            <Button onClick={() => toggleAnswer(index)} variant="outline" size="sm" className="mt-2">
              {showAnswers[index] ? 'Hide' : 'Show'} Answer
            </Button>
            {showAnswers[index] && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <p><strong>Answer:</strong> {q.options[q.correctAnswerIndex]}</p>
                <p><em>Source: "{q.answerLocation}"</em></p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
