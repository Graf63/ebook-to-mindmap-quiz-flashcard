# eBook to Study Tools

An intelligent ebook analysis tool based on AI technology, which supports converting EPUB and PDF format ebooks into structured mind maps, quizzes, and flashcards.

## ✨ Features

### 📚 Multi-format Support
- **EPUB Files**: Full support for parsing and processing EPUB format ebooks.
- **PDF Files**: Intelligent parsing of PDF documents, supporting chapter extraction based on table of contents and smart detection.

### 🤖 AI-driven Content Processing
- **Multiple AI Services**: Supports Google Gemini and OpenAI GPT models.
- **Three Processing Modes**:
  - 📝 **Mind Map Mode**: Generates a mind map for each chapter or for the entire book.
  - 🧠 **Quiz Mode**: Creates multiple-choice quizzes for each chapter with answers and source locations.
  - 🌐 **Flashcard Mode**: Generates flashcards with questions/terms and answers, including source locations.

### 🎯 Intelligent Chapter Processing
- **Smart Chapter Detection**: Automatically identifies and extracts the book's chapter structure.
- **Chapter Filtering**: Supports skipping non-core content such as forewords, table of contents, and acknowledgments.
- **Flexible Selection**: Users can freely choose the chapters to be processed.
- **Sub-chapter Support**: Configurable depth for extracting sub-chapters.

### 💾 Efficient Caching Mechanism
- **Smart Caching**: Automatically caches AI processing results to avoid redundant computations.
- **Cache Management**: Supports clearing the cache by mode to save storage space.
- **Offline Viewing**: Processed content can be viewed offline.

### 🎨 Modern Interface
- **Responsive Design**: Adapts to various screen sizes.
- **Real-time Progress**: Visualized processing with real-time display of the current step.
- **Interactive Outputs**:
    - **Mind Maps**: Supports zooming, dragging, and node expansion/collapse.
    - **Quizzes**: Interactive questions and answers.
    - **Flashcards**: Flippable cards for active recall.
- **Content Preview**: Supports viewing the original chapter content.
- **Versatile Downloads**: Export mind maps as images, and quizzes/flashcards as interactive HTML, printable PDF, or JSON/CSV data.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Clone the project
git clone <repository-url>
cd ebook-to-study-tools

# Install dependencies
pnpm install
# or
npm install
```

Starting the Development Server
```bash

pnpm dev
# or
npm run dev
```
Access http://localhost:5173 to start using the application.

📖 User Guide
1. Configure AI Service
On first use, you need to configure the AI service:

Click the "Configuration" button in the upper right corner.

Choose an AI service provider:

Google Gemini (recommended): Requires a Gemini API Key.

OpenAI GPT: Requires an OpenAI API Key and API URL.

Enter the corresponding API Key.

Select a model (optional, the default model is sufficient).

2. Upload an eBook File
Click the "Select EPUB or PDF file" button.

Choose the ebook file to process.

Supported formats: .epub, .pdf.

3. Configure Processing Options
Set the processing parameters in the configuration dialog:

Processing Mode
Mind Map Mode: Ideal for visual summaries and structure.

Quiz Mode: Best for self-assessment and checking comprehension.

Flashcard Mode: Perfect for memorizing key terms and concepts.

4. Extract Chapters
Click the "Extract Chapters" button.

The system will automatically parse the file and extract the chapter structure.

Once extraction is complete, the chapter list will be displayed.

You can select the chapters you want to process (all are selected by default).

5. Start Processing
Confirm your chapter selection.

Click the "Start Processing" button.

The system will show the processing progress and the current step.

The results will be displayed upon completion.

6. View and Download Results
Depending on the chosen processing mode, you can view different types of results and download them in various formats, including interactive HTML and printable PDF for quizzes and flashcards.

This project is licensed under the MIT License. See the LICENSE file for details.
