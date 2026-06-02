# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that currently use placeholders, mocks, or simulations and require further development to reach full scholarly production standards.

## ✅ Completed (Recent Build)
- [x] **Real STT (Speech-to-Text)**: Replaced mock with Gemini Multimodal processing in `interact-with-ai.ts`.
- [x] **Audit Dashboard**: Created UI views for `error_logs`, `search_logs`, and `dmca_complaints` in the `/admin/audit` portal.
- [x] **DMCA Resolution Workflow**: Implemented the "Report" and "Takedown" mechanism.
- [x] **Native Document Parsing**: Implemented local `pdf-parse` and `mammoth` (Docx) logic for scholarly papers, reducing reliance on OCR Vision for text files.
- [x] **Audit Resolution Actions**: Added UI buttons in the Audit portal to formally "Resolve" or "Dismiss" logs.

## 🎙️ AI & Multimodal Research
- [ ] **Neuromorphic Analysis**: Implement actual `brain.js` logic in the Study Assistant to replace `brainJsSimulatedInsight` placeholders.
- [ ] **Advanced RAG**: Transition from "All-in-Prompt" context to a Vector Database (Firestore Vector Search) for the Library Hub.

## 📚 Data Integration
- [ ] **Structured Lexicon Fetching**: Replace AI "simulation" of Strong's data with a direct API connector to a verified Greek/Hebrew database.
- [ ] **Commentary Aggregator**: Implement a web-scraper or API client for public domain commentaries (JFB, Matthew Henry, etc.) to ground AI synthesis.
- [ ] **Bible Version Sync**: Expand `bible-api.ts` to support authenticated access to modern translations (NIV, ESV, NASB).

## 🛡️ Governance & Administration
- [ ] **Notification Engine**: Implement Firebase Cloud Messaging (FCM) or SendGrid for peer-review and security alerts.

## ⚙️ Local Engine (Ollama)
- [ ] **Streaming Downloads**: Implement streaming for `pullOllamaModel` to prevent Next.js server action timeouts.
- [ ] **Resource Monitoring**: Add a dashboard component to monitor local CPU/GPU usage when Ollama is the active engine.

## 📄 Document Management
- [ ] **Zotero Integration**: Enable importing and exporting from standard citation managers.
