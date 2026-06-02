# LexiVerse Explorer: Technical Roadmap & Pending Functionalities

This document outlines the features and components that require further development to reach full scholarly production standards.

## ✅ Completed (Production Polish Build)
- [x] **Attributed Multi-Document Synthesis**: Integrated citation logic for library-grounded AI synthesis.
- [x] **Live Research Trends**: Implemented real-time popularity analytics in the Governance Audit portal.
- [x] **Voice Research Hub**: Integrated real-time voice transcription into the primary research engine via Gemini Multimodal.
- [x] **Visual Theology Mapper**: Developed a scatter-plot density map using Recharts to visualize concept evolution.
- [x] **Advanced BibTeX Export**: Implemented Zotero-compliant citation exports with abstract and metadata.
- [x] **Google Workspace Deep Integration**: Real-time research export to Google Drive and Google Docs.
- [x] **Notification Engine**: Implemented an in-app Notification Center for status changes and peer review alerts.
- [x] **Wiki Moderation Flow**: Automated triggers for author alerts upon article approval/rejection.
- [x] **Native Document Parsing**: Local `pdf-parse` and `mammoth` integration.
- [x] **Research Archive Hub**: CentralizedFirestore-backed session recovery.
- [x] **TF-IDF RAG Refinement**: Improved semantic ranking for local document fragments.

## 📚 Data Integration & API Strategy (Underdeveloped - Count: 7)
- [ ] **Structured Lexicon Fetching**: Replace AI "simulation" of Strong's data with a direct API connector to a verified Greek/Hebrew database (e.g. STEPBible or OpenBible API).
- [ ] **Commentary Aggregator**: Ground AI synthesis in specific historical commentary texts (JFB, Henry) via direct API.
- [ ] **Bible Version Sync**: Expand `bible-api.ts` to support modern translation auth (NIV, ESV).
- [ ] **Advanced Vector Search**: Transition from keyword ranking to Firestore Vector Search for semantic accuracy.
- [ ] **Ollama Streaming Downloads**: Implement streaming for `pullOllamaModel` to prevent action timeouts.
- [ ] **Institutional Single Sign-On (SSO)**: SAML/OIDC integration for seminaries.
- [ ] **Zotero Deep Sync**: Bidirectional sync with Zotero collections via API.

## 📄 Document Management
- [ ] **OCR Layout Preservation**: Improve manuscript OCR to handle multi-column papyrus fragments.
