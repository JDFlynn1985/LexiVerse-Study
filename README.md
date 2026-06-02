
# LexiVerse Explorer

LexiVerse Explorer is an advanced, AI-powered Bible study platform designed for seminary students and biblical scholars. It integrates scripture modules, original language lexicons, and scholarly research tools into a single cohesive environment.

## 🌟 Current Features

### 📖 Digital Library & Lexicon
- **Scripture Access**: Integration with the Free Use Bible API for multiple versions (KJV, NET, WEB, etc.).
- **Semantic Lexicon**: Deep analysis of Greek and Hebrew terms using Strong's numbers, providing morphology, part of speech, and theological classification.
- **Persistent Library**: Local document storage via IndexedDB for privacy and high-speed manuscript analysis.

### 🤖 Scholar AI Engine
- **Multimodal Research**: AI-powered OCR for extracting text from ancient manuscripts and voice transcription for hands-free research queries.
- **Cross-Reference Engine**: Advanced algorithms to detect both overt (explicit) and covert (semantic) theological links across texts.
- **RAG Synthesis**: Synthesizes scripture, commentaries, and user-uploaded papers into structured scholarly reports.

### ✍️ Scholarly Synthesis & Export
- **Dynamic Highlighting**: Highlight key insights in your research; these are preserved across all export formats.
- **Multi-Channel Export**: Generate PDF, Word (.docx), Markdown (Obsidian-ready), RTF, and Plain Text files with one click.
- **Google Workspace Sync**: Direct export to Google Drive and Google Docs with structured links to all references.

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Configure Environment
Run the interactive installer to set up your API keys and analytics:
```bash
npm run setup
```
This will prompt you for your Firebase, Gemini, and Analytics keys and create your `.env` file automatically.

### 3. Development
Run the development server:
```bash
npm run dev
```

## 🌍 Accessibility & Privacy
LexiVerse is committed to WCAG 2.1 AAA standards and GDPR/CCPA compliance. Users maintain full control over their data, with granular cookie consent and a "Right to Erasure" built directly into the settings.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
