export const getFlashcardPrompt = (title: string, content: string) => {
  return `
    Please generate 5 flashcards for the following chapter content.
    For each flashcard, provide a "front" (a question or term) and a "back" (the answer or definition).
    Also, for each flashcard, provide a snippet from the text that contains the answer for the back.

    Chapter Title: ${title}

    Chapter Content:
    ${content}

    Please respond in the following JSON format:
    {
      "flashcards": [
        {
          "front": "...",
          "back": "...",
          "answerLocation": "..."
        }
      ]
    }
  `;
};
