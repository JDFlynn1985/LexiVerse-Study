# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that require further development to reach full scholarly production standards.

## ✅ Completed (Recent Build)
- [x] **Voice Research Hub**: Integrated real-time voice transcription into the primary research engine via Gemini Multimodal.
- [x] **Visual Theology Mapper**: Developed a scatter-plot density map using Recharts to visualize concept evolution.
- [x] **Advanced BibTeX Export**: Implemented Zotero-compliant citation exports with abstract and abstract metadata.
- [x] **Grounded Synthesis Hub**: Integrated Digital Library RAG into the Writing Hub for integrity scans and tone refinement.
- [x] **Codebase Sanitization**: Removed obsolete boilerplate templates and duplicate AI flows.
- [x] **Notification Engine**: Implemented an in-app Notification Center for status changes and peer review alerts.
- [x] **Wiki Moderation Flow**: Automated triggers for author alerts upon article approval/rejection.
- [x] **Real STT (Speech-to-Text)**: Replaced mock with Gemini Multimodal processing.
- [x] **Audit Dashboard**: Created UI views for system governance monitoring.
- [x] **Native Document Parsing**: Local `pdf-parse` and `mammoth` integration.
- [x] **Advanced RAG Engine**: Semantic chunking and local relevance ranking.
- [x] **Universal Export Hub**: Integrated jsPDF and docx for scholarly reports.

## 📚 Data Integration & API Strategy
- [ ] **Structured Lexicon Fetching**: Replace AI "simulation" of Strong's data with a direct API connector to a verified Greek/Hebrew database (e.g. STEPBible or OpenBible API).
- [ ] **Commentary Aggregator**: Ground AI synthesis in specific historical commentary texts (JFB, Henry) via direct API.
- [ ] **Bible Version Sync**: Expand `bible-api.ts` to support modern translation auth (NIV, ESV).

## 🎙️ AI & Multimodal Research
- [ ] **Advanced Vector Search**: Transition from keyword ranking to Firestore Vector Search for semantic accuracy.
- [ ] **Multi-Document Synthesis**: Allow the RAG engine to combine multiple library papers into a single synthesized summary.

## 🛡️ Governance & Administration
- [ ] **Ollama Streaming Downloads**: Implement streaming for `pullOllamaModel` to prevent action timeouts.
- [ ] **Institutional Single Sign-On (SSO)**: SAML/OIDC integration for seminaries.

## 📄 Document Management
- [ ] **Zotero Deep Sync**: Bidirectional sync with Zotero collections via API.
- [ ] **Google Workspace Deep Integration**: Real-time collaboration via Google Docs embedding.