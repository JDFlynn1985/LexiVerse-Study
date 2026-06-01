# LexiVerse Explorer

LexiVerse Explorer is an advanced, AI-powered Bible study platform designed for seminary students and biblical scholars. It integrates scripture modules, original language lexicons, and scholarly research tools into a single cohesive environment.

## 🌟 Current Features

### 📖 Digital Library & Lexicon
- **Scripture Access**: Integration with the Free Use Bible API for multiple versions (KJV, NET, WEB, etc.).
- **Semantic Lexicon**: Deep analysis of Greek and Hebrew terms using Strong's numbers, providing morphology, part of speech, and theological classification (Person, Place, Event, Promise, Command).
- **Interactive Verse Explorer**: Real-time passage analysis and contextual AI chat.

### 🤖 Scholar AI Engine
- **AI Study Assistant**: Synthesizes scripture, commentaries, and user-uploaded research into professional academic reports.
- **Multimodal Research Library**: Upload papers and use AI-powered OCR to extract text from primary source images or manuscripts.
- **Translation Comparison**: Compare translational philosophies and nuances across major Bible versions.
- **Custom AI Configuration**: Support for Gemini 2.5 Flash and Pro models, with secure storage for personal API keys.

### ✍️ Scholarly Synthesis
- **Peer-Reviewed Wiki**: A collaborative knowledge base with a formal submission and moderation workflow for scholarly articles.
- **Academic Writing Assistant**: Refine theological drafts for tone, grammar, and academic rigor.
- **Bibliography Management**: Export citations in SBL or Turabian formats, ready for academic submission.

### 🌍 Global & Private
- **Multi-Dialect Localization**: Full support for English (US/UK) and Spanish (Spain/Mexico) with automatic system detection.
- **Privacy First**: Granular cookie consent management and full GDPR/CCPA compliance for data portability and account erasure.
- **Dark Mode**: A scholarly aesthetic designed for long hours of research in any environment.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Genkit](https://firebase.google.com/docs/genkit) with Gemini 2.5 (Flash/Pro)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **APIs**: Free Use Bible API (bible.helloao.org)

## 🛠️ Getting Started

### Prerequisites
- Node.js 20+
- A Firebase Project
- A Google AI Studio API Key

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, etc.
   - `GEMINI_API_KEY` (Optional if using personal keys via app settings)
3. Run the development server:
   ```bash
   npm run dev
   ```

## 🗺️ Future Roadmap
- **RAG Implementation**: Full vector search across the entire research library for semantically cited AI responses.
- **Google Workspace Integration**: Direct sync of research logs to Google Docs and bibliographic metadata to Sheets.
- **Offline Mode**: PWA support for accessing lexicons and saved notes without an active connection.
- **Zotero API Sync**: Automated bibliographic syncing with standard academic citation managers.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
