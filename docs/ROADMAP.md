# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that currently use placeholders, mocks, or simulations and require further development to reach full scholarly production standards.

## ✅ Completed (Recent Build)
- [x] **Real STT (Speech-to-Text)**: Replaced mock with Gemini Multimodal processing in `interact-with-ai.ts`.
- [x] **Audit Dashboard**: Created UI views for `error_logs`, `search_logs`, and `dmca_complaints` in the `/admin/audit` portal.
- [x] **Native Document Parsing**: Implemented local `pdf-parse` and `mammoth` (Docx) logic for scholarly papers.
- [x] **Advanced RAG Engine**: Implemented semantic chunking and relevance ranking for local library documents.
- [x] **Research Workspace Persistence**: Implemented Firestore-backed research session saving for scholars.
- [x] **Universal Export Hub**: Integrated jsPDF and docx for formal scholarly report generation.
- [x] **Translation Comparison Hub**: Fully implemented the AI-driven translation analysis module.
- [x] **Historical Timeline Module**: Implemented a dedicated UI for the timeline flow.
- [x] **Real-Time Discourse Logic**: Implemented functional chat persistence and institutional channels in the Chat Hub.
- [x] **Covert Cross-Reference AI**: Integrated semantic scripture detection in the Writing Hub.
- [x] **Interactive Verse Explorer**: Created a dedicated exegesis view with passage-grounded AI dialogue.
- [x] **Research Analytics**: Integrated Recharts for visual scholarly momentum tracking.

## 📚 Data Integration & API Strategy
- [ ] **Structured Lexicon Fetching**: Replace AI "simulation" of Strong's data with a direct API connector to a verified Greek/Hebrew database (e.g. STEPBible or OpenBible API).
- [ ] **Commentary Aggregator**: Implement a web-scraper or API client for public domain commentaries (JFB, Matthew Henry, etc.) to ground AI synthesis in specific historical texts.
- [ ] **Bible Version Sync**: Expand `bible-api.ts` to support authenticated access to modern translations (NIV, ESV, NASB).

## 🎙️ AI & Multimodal Research
- [ ] **Advanced Vector Search**: Transition from local keyword ranking to Firestore Vector Search for higher semantic accuracy in the Library Hub.
- [ ] **Real-Time Audio Streaming**: Implement a streaming STT interface for the AI Assistant.

## 🛡️ Governance & Administration
- [ ] **Notification Engine**: Implement Firebase Cloud Messaging (FCM) or SendGrid for peer-review and security alerts.
- [ ] **Ollama Streaming Downloads**: Implement streaming for `pullOllamaModel` to prevent Next.js server action timeouts during model installation.

## 📄 Document Management
- [ ] **Zotero Integration**: Enable importing and exporting from standard citation managers.
- [ ] **Google Workspace Deep Integration**: Transition from simple export to full real-time collaboration via Google Docs.
