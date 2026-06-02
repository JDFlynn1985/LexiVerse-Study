
# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that currently use placeholders, mocks, or simulations and require further development to reach full scholarly production standards.

## 🎙️ AI & Multimodal Research
- [ ] **Real STT (Speech-to-Text)**: Replace the `whisperTranscribe` mock in `interact-with-ai.ts` with Gemini Multimodal or Whisper API.
- [ ] **Neuromorphic Analysis**: Implement actual `brain.js` logic in the Study Assistant to replace `brainJsSimulatedInsight` placeholders.
- [ ] **Advanced RAG**: Transition from "All-in-Prompt" context to a Vector Database (Firestore Vector Search) for the Library Hub.

## 📚 Data Integration
- [ ] **Structured Lexicon Fetching**: Replace AI "simulation" of Strong's data with a direct API connector to a verified Greek/Hebrew database.
- [ ] **Commentary Aggregator**: Implement a web-scraper or API client for public domain commentaries (JFB, Matthew Henry, etc.) to ground AI synthesis.
- [ ] **Bible Version Sync**: Expand `bible-api.ts` to support authenticated access to modern translations (NIV, ESV, NASB).

## 🛡️ Governance & Administration
- [ ] **Audit Dashboard**: Create UI views for `error_logs` and `search_logs` in the `/admin` portal.
- [ ] **DMCA Resolution Workflow**: Add an "Appeal" system for users whose content was automatically taken down by a complaint.
- [ ] **Notification Engine**: Implement Firebase Cloud Messaging (FCM) or SendGrid for peer-review and security alerts.

## ⚙️ Local Engine (Ollama)
- [ ] **Streaming Downloads**: Implement streaming for `pullOllamaModel` to prevent Next.js server action timeouts.
- [ ] **Resource Monitoring**: Add a dashboard component to monitor local CPU/GPU usage when Ollama is the active engine.

## 📄 Document Management
- [ ] **Binary Parsing**: Implement local `pdf-parse` or `mammoth` (Docx) logic for scholarly papers, reducing reliance on OCR Vision for text files.
- [ ] **Zotero Integration**: Enable importing and exporting from standard citation managers.
