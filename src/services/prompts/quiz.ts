export const getQuizPrompt = (title: string, content: string) => {
  return `
    Please generate a quiz with 5 questions for the following chapter content.
    For each question, provide 4 multiple-choice options, with one correct answer.
    Also, for each question, provide a snippet from the text that contains the answer.

    Chapter Title: ${title}

    Chapter Content:
    ${content}

    Please respond in the following JSON format:
    {
      "questions": [
        {
          "question": "...",
          "options": ["...", "...", "...", "..."],
          "correctAnswerIndex": 0,
          "answerLocation": "..."
        }
      ]
    }
  `;
};
