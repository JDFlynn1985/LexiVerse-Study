
# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that currently use placeholders, mocks, or simulations and require further development to reach full scholarly production standards.

## ✅ Completed (Recent Build)
- [x] **Real STT (Speech-to-Text)**: Replaced mock with Gemini Multimodal processing in `interact-with-ai.ts`.
- [x] **Audit Dashboard**: Created UI views for `error_logs`, `search_logs`, and `dmca_complaints` in the `/admin/audit` portal.
- [x] **DMCA Resolution Workflow**: Implemented the "Report" and "Takedown" mechanism.
- [x] **Native Document Parsing**: Implemented local `pdf-parse` and `mammoth` (Docx) logic for scholarly papers.
- [x] **Audit Resolution Actions**: Added UI buttons in the Audit portal to formally "Resolve" or "Dismiss" logs.
- [x] **Neuromorphic Analysis**: Implemented actual linguistic heuristic logic in the Study Assistant.
- [x] **Selective RAG Phase 1**: Transitioned from "All-in-Prompt" context to a semantic chunking and selection logic (`rag-engine.ts`).
- [x] **Translation Comparison Hub**: Fully implemented the AI-driven translation analysis module.
- [x] **Archaeology Site Analyzer**: Promoted boilerplate tool to a functional biblical archaeology module.
- [x] **Historical Timeline Module**: Implemented a dedicated UI for the timeline flow.
- [x] **Module Inter-Connectivity**: Bridged the Manuscript transcription results to the Writing Hub via shared state.

## 🎙️ AI & Multimodal Research
- [ ] **Advanced Vector Search**: Transition from local keyword ranking to Firestore Vector Search for higher semantic accuracy in the Library Hub.
- [ ] **Real-Time Audio Streaming**: Implement a streaming STT interface for the AI Assistant.

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
