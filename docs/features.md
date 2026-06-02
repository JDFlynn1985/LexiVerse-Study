# LexiVerse Explorer: Feature Catalog

LexiVerse Explorer is an integrated research environment designed for biblical scholars, seminary students, and theological researchers. This document catalogs all currently implemented features and modules.

---

## 🤖 AI Research Hub (The Brain)

The platform leverages a multi-engine AI orchestration layer (Firebase Genkit) to synthesize theological and linguistic data.

### 1. AI Study Assistant
- **Synthesized Reports**: Combines scripture, lexicons, and historical commentaries into a cohesive academic paper.
- **RAG Integration**: Automatically incorporates excerpts from your locally stored research papers to ground the AI's reasoning.
- **Bibiliographic Integrity**: Generates SBL-style bibliographies with clickable URLs for all synthesized data.

### 2. Interactive Verse Explorer
- **Deep Exegesis**: Engage in a real-time dialogue with the AI focused on a specific scripture reference.
- **Scripture Grounding**: The AI automatically quotes and analyzes the specific passage using the Free Use Bible API.

### 3. Lexicon Explorer
- **Original Languages**: Perform deep morphological analysis using Strong’s Greek and Hebrew concordance numbers.
- **Commentary Synthesis**: Trigger "Deep Commentary Analysis" to pull insights from historical works like JFB and Keil & Delitzsch.

### 4. Theological Concept Mapper
- **Historical Development**: Visualizes the evolution of theological terms (e.g., *Justification*, *Atonement*) from the Patristic era to the modern day.
- **Scriptural Anchors**: Identifies the primary biblical foundations for systemic concepts.

---

## 🏛️ Specialized Research Hubs

### 5. Translation Comparison Hub
- **Grounded Audits**: Compare verse renderings across multiple versions (KJV, NIV, ESV, etc.) using live data.
- **Linguistic Nuance**: The AI analyzes differences in translational philosophy (Formal vs. Functional equivalence).

### 6. Manuscript Hub (Paleography OCR)
- **OCR Transcription**: Uses Gemini Vision to extract text from images of ancient manuscripts, papyrus, or scholarly fragments.
- **Transcription Bridge**: Transferred transcribed text directly to the Writing Hub for refinement.

### 7. Historical Timeline Mapper
- **Chronological Visualization**: Maps the timeline of biblical events alongside archaeological and extra-biblical milestones.
- **Scholarly Verification**: Distinguishes between narrative events and external historical verification.

### 8. Biblical Geography Hub
- **Spatial Narratives**: Analyzes the topographical significance of biblical locations and movements.
- **Site Coordinates**: Provides approximate coordinates and archaeological status for biblical sites.

### 9. Archaeology Hub
- **Excavation Analysis**: Deep site reports focusing on significant discoveries, cultural context, and bibliographic references.

---

## ✍️ Academic Synthesis (The Writing Hub)

A specialized workspace for refining scholarly drafts and ensuring academic integrity.

- **Tone Refinement**: Adjusts drafts for academic, pastoral, or concise tones.
- **Integrity Scanner**: Scans text for "scholarly echoes"—phrasing that requires attribution—and suggests citations.
- **Covert Cross-Reference AI**: Identifies semantic allusions to scripture that aren't explicitly named.
- **Bibliography Formatter**: Converts raw source lists into professional styles (SBL, Turabian, Chicago).

---

## 📚 Data & Privacy (Local-First)

### 10. Digital Library
- **Network Isolation**: Research papers (PDF/Docx) are stored locally in the browser’s IndexedDB. Your sensitive data never touches the cloud.
- **Semantic Indexing**: Files are parsed locally to power the platform's RAG (Retrieval-Augmented Generation) capabilities.

### 11. Scholarly Wiki
- **Peer-Reviewed Knowledge**: A collaborative archive of theological articles.
- **Governance Flow**: Proposals are submitted by researchers and reviewed by the moderation committee before publication.

---

## 💬 Scholarly Discourse

### 12. Social Chat Hub
- **Global & Institutional**: Real-time dialogue channels for general academic discussion or specific institutional seminars.
- **Governance**: Integrated DMCA reporting and automatic takedown tools to protect intellectual property.

---

## 🛡️ Governance & Administration

### 13. System Control Panel
- **AI Orchestration**: Manage cloud API keys and local Ollama models (pull, delete, status).
- **Network Topology**: Toggle between "Internet" and "Local-Only" modes to air-gap the platform.

### 14. API Portal (Tiered Access)
- **Credential Provisioning**: Researchers generate their own Bearer tokens (`lv_`) for external tool integration.
- **Rate Limiting**: Usage is governed by tiered quotas (Basic, Scholar, Institution).

### 15. Governance Audit
- **Stability Monitoring**: Real-time feed of runtime errors and permission violations.
- **Research Trends**: Visual analytics using Recharts to identify high-demand scholarly topics.

### 16. Module Governance
- **Dynamic Controls**: Administrators can enable or disable specific research modules in real-time across the platform.
