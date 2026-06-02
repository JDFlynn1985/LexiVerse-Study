# LexiVerse Explorer: Technical Roadmap

## ✅ Completed (Production Foundation)
- [x] **Attributed Multi-Document RAG**: Citing specific papers in AI synthesis using filename references.
- [x] **Notification Engine**: Real-time peer-review alerts and system-wide scholarly status updates.
- [x] **Voice Research Hub**: Multimodal voice transcription for dictated theological queries via Gemini.
- [x] **Visual Theology Mapper**: Influence density scatter charts and chronological development tracking.
- [x] **Google Workspace Integration**: Direct multi-format export to Google Drive and Google Docs.
- [x] **Research Archive Hub**: Firestore-backed session recovery and management portal.
- [x] **Governance Audit Dashboard**: Live institutional research trends and stability monitoring.
- [x] **Dual-Layer Sanitization**: Client and server-side XSS protection for all user-controllable text.
- [x] **BibTeX / Zotero Export**: Pro-grade citation manager integration for synthesized results.

## 📚 Data Integration (High Priority - Missing)
- [ ] **Structured Lexicon Fetching**: Transition from AI-simulated Strong's data to a direct API connector (e.g., STEPBible or OpenBible) to ensure 100% linguistic accuracy.
- [ ] **Commentary Aggregator**: Implement a verified commentary database (e.g., JFB, Keil & Delitzsch) to replace LLM-generated summaries with primary scholarly works.
- [ ] **Bible Version Licensing**: Add an authentication flow for licensed modern translations (NIV, ESV, NASB) beyond the current public domain versions.

## 📄 Document Management (Advanced RAG)
- [ ] **Firestore Vector Search**: Migrate from browser-side keyword-overlap ranking to server-side vector embeddings for semantic precision and "Deep RAG" capabilities.
- [ ] **OCR Layout Preservation**: Enhance the Manuscript Hub to handle multi-column papyrus fragments and complex epigraphic layouts.
- [ ] **Zotero Bidirectional Sync**: Full API integration for collections, moving beyond the current one-way BibTeX export.

## 🧪 Advanced Infrastructure
- [ ] **Ollama Progress Streaming**: Implement WebSockets for real-time download progress of local models to prevent atomic action timeouts.
- [ ] **Institutional SSO**: OIDC/SAML integration for seminary-wide single sign-on, moving beyond the personal Google account restriction.
- [ ] **Offline PWA Sync**: Service worker optimization for weak network environments, allowing local exegesis to buffer and sync when reconnected.

---
*Last Audit: February 2024. This roadmap serves as the primary development directive for the LexiVerse Engineering Team.*
