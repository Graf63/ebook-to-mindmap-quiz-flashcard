import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { downloadMethodList } from '@mind-elixir/export-mindmap';
import type { MindElixirInstance } from 'mind-elixir';

const generateQuizHTML = (title: any, quizData: any[]) => {
    let questionsHTML = '';
    quizData.forEach((q: any, index: number) => {
      const optionsHTML = q.options.map((opt: any, i: number) => `
        <div class="option ${i === q.correctAnswerIndex ? 'correct' : ''}">${opt}</div>
      `).join('');
  
      questionsHTML += `
        <div class="question">
          <h3>Question ${index + 1}: ${q.question}</h3>
          <div class="options">${optionsHTML}</div>
          <button onclick="this.nextElementSibling.style.display='block'">Voir la réponse</button>
          <div class="answer" style="display:none;">
            <p><strong>Réponse :</strong> ${q.options[q.correctAnswerIndex]}</p>
            <p><em>Source : "${q.answerLocation}"</em></p>
          </div>
        </div>
      `;
    });
  
    return `
      <html>
        <head>
          <title>Quiz: ${title}</title>
          <style>
            body { font-family: sans-serif; margin: 2em; }
            .question { margin-bottom: 2em; border-bottom: 1px solid #ccc; padding-bottom: 1em; }
            .options { display: flex; flex-direction: column; gap: 0.5em; margin: 1em 0; }
            .option { padding: 0.5em; border: 1px solid #eee; border-radius: 5px; }
            .correct { background-color: #e0ffe0; }
            button { padding: 0.5em 1em; cursor: pointer; }
            .answer { margin-top: 1em; padding: 1em; background: #f0f0f0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Quiz: ${title}</h1>
          ${questionsHTML}
        </body>
      </html>
    `;
  };
  
  const generateFlashcardHTML = (title: any, flashcardData: any[]) => {
      let cardsHTML = '';
      flashcardData.forEach((card: any) => {
          cardsHTML += `
        <div class="flashcard" onclick="this.classList.toggle('flipped')">
          <div class="front">
            <p>${card.front}</p>
          </div>
          <div class="back">
            <p>${card.back}</p>
            <p><em>Source : "${card.answerLocation}"</em></p>
          </div>
        </div>
      `;
      });
  
      return `
      <html>
        <head>
          <title>Flashcards: ${title}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 1em; padding: 1em; }
            .flashcard { width: 300px; height: 200px; perspective: 1000px; cursor: pointer; }
            .front, .back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; justify-content: center; align-items: center; padding: 1em; box-sizing: border-box; border: 1px solid #ccc; border-radius: 10px; transition: transform 0.6s; }
            .front { background: #fff; }
            .back { background: #f9f9f9; transform: rotateY(180deg); }
            .flashcard.flipped .front { transform: rotateY(180deg); }
            .flashcard.flipped .back { transform: rotateY(0deg); }
          </style>
        </head>
        <body>
          ${cardsHTML}
        </body>
      </html>
    `;
  };

export const downloadMindMap = async (instance: MindElixirInstance, title: any, format: any) => {
    try {
        const method = downloadMethodList.find((item) => item.type === format);
        if (!method) {
            throw new Error(`Unsupported format: ${format}`);
        }
        await method.download(instance);
        toast.success(`${title} has been successfully exported as ${format}.`);
    } catch (error) {
        toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const downloadContent = (title: any, format: any, data: any[], processingMode: any) => {
    const filename = `${title}.${format.toLowerCase()}`;
    let content = '';
    let mimeType = '';

    if (format === 'HTML') {
        content = processingMode === 'quiz' ? generateQuizHTML(title, data) : generateFlashcardHTML(title, data);
        mimeType = 'text/html';
    } else if (format === 'PDF') {
        const htmlContent = processingMode === 'quiz' ? generateQuizHTML(title, data) : generateFlashcardHTML(title, data);
        const element = document.createElement('div');
        element.innerHTML = htmlContent;
        document.body.appendChild(element);

        html2canvas(element).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgProps= pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);
            document.body.removeChild(element);
        });
        return;
    } else if (format === 'JSON') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    } else if (format === 'CSV') {
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((item: any) => Object.values(item).map(val => `"${val}"`).join(',')).join('\n');
        content = `${headers}\n${rows}`;
        mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
