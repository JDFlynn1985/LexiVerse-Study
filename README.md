# LexiVerse Explorer

LexiVerse Explorer is an advanced, AI-powered Bible study platform designed for seminary students and biblical scholars. It integrates scripture modules, original language lexicons, and scholarly research tools into a single cohesive environment.

## 🌟 Features

- **Digital Library**: Access multiple Bible versions via the Free Use Bible API.
- **Semantic Lexicon**: Deep analysis of Greek and Hebrew terms using Strong's numbers and morphological data.
- **Scholar AI Engine**: A Genkit-powered assistant that synthesizes scripture, commentaries, and your own research.
- **Research Paper Integration**: Upload PDF, Word, and Text documents to create a custom knowledge base for the AI.
- **Google Workspace Sync**: Export notes to Google Keep, research logs to Google Docs, and bibliographies to Google Sheets.
- **Personal Study Suite**: Highlight-to-note capture and academic bibliography management.
- **Dark Mode Support**: A scholarly aesthetic that respects your environment.

## 🚀 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Genkit](https://firebase.google.com/docs/genkit) with Gemini 2.5
- **Backend**: [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **APIs**: Free Use Bible API (bible.helloao.org)

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- A Firebase Project
- A Google Cloud Project (for Gemini API and Google Workspace scopes)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lexiverse-explorer.git
   cd lexiverse-explorer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory based on the template in `src/app-config.ts`.

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🌍 Accessibility

LexiVerse is committed to WCAG 2.1 AAA standards, ensuring a robust experience for scholars using assistive technologies.
