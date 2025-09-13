import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadContentButton } from './DownloadContentButton';

export const FlashcardCard = ({ title, flashcardData }) => {
    const handleDownload = (downloadTitle, format, data) => {
        // Implement download logic or pass it down as a prop
    };

    return (
    <Card>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Flashcards: {title}</span>
                <DownloadContentButton 
                    title={title} 
                    processingMode="flashcard" 
                    data={flashcardData} 
                    downloadHandler={handleDownload} 
                />
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcardData.map((card, index) => (
            <div key={index} className="flashcard-container">
                <div className="flashcard">
                    <div className="front p-4 border rounded shadow">
                        {card.front}
                    </div>
                    <div className="back p-4 border rounded shadow bg-gray-50">
                        <p>{card.back}</p>
                        <p className="text-xs text-gray-500 mt-2"><em>Source: "{card.answerLocation}"</em></p>
                    </div>
                </div>
            </div>
        ))}
        </CardContent>
    </Card>
    );
};
