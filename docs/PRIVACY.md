# LexiVerse Explorer: Privacy Standards & Data Rights (v2.0)

LexiVerse Explorer is built on the principle of **Scholarly Autonomy**. We believe that researchers should maintain absolute control over their data, their sources, and their digital footprint.

## 🛡️ Privacy by Design

### 1. Age Restriction (Clause 1.1)
LexiVerse Explorer enforces a strict **15+ age requirement** for all users. In accordance with international data protection standards and our commitment to a professional research environment, access to scholarly resources and profile creation is restricted to individuals 15 years of age or older.

**Verification Policy**: During registration, we collect and store your date of birth solely to verify compliance with this clause. This measure is mandatory to ensure full compliance with global regulations and international data privacy laws regarding the processing of young adults' personal information. Accounts created with birth dates indicating the user is under 15 will be blocked or terminated upon discovery to safeguard minors and maintain the integrity of the scholarly community.

### 2. Local-First Research (RAG Isolation)
The most sensitive data a researcher handles—unpublished papers, draft manuscripts, and institutional PDFs—is stored using **IndexedDB** in the user's browser.
- **Zero Cloud Exposure**: These documents are parsed and stored locally. They never touch LexiVerse or Google servers by default.
- **Semantic Indexing**: If a researcher chooses to enable "Cloud Sync" for a document, it is semantically chunked and indexed into a private Firestore sub-collection using high-dimensional vector embeddings, protected by strict Rule-Based Access Control (RBAC).

### 3. Minimal Data Collection & Age Policy
We follow the principle of data minimization:
- **Identity**: We store basic profile data (Name, Email, Photo URL) and **Date of Birth** to enforce the mandatory **15+ age requirement** for scholarly registration and global regulatory compliance.
- **Academic Context**: Designation and Institution are stored to facilitate peer-review attribution and institutional seminar filtering.

### 4. Data Ownership & Licensing
- **Personal Library**: You retain 100% ownership of your private research library and direct messages.
- **Public Contributions**: Content submitted to the **Scholarly Wiki** or **Social Chat Hub** is licensed under **CC BY 4.0**. This ensures your scholarly work remains available to the global community while guaranteeing you receive proper attribution.

### 5. Compliance (GDPR & CCPA)
LexiVerse Explorer fully respects international privacy regulations:
- **Right to Access**: Researchers can view their entire study history and profile data in the Profile Settings.
- **Right to Erasure**: Users can trigger a "Permanent Takedown" of their account. This deletes all Firestore records and removes their name from the Wiki.
- **Consent Control**: Researchers can adjust their functional and marketing cookie preferences at any time via the built-in **Cookie Consent** manager.

## 🔌 Third-Party Integrations
- **AI Engines**: Research queries are processed via Google Gemini, OpenAI, or Anthropic depending on your choice.
- **API Keys**: User-provided keys are stored in an encrypted format within your private Firestore profile.
- **Ollama**: For maximum privacy, researchers can toggle to **Local Network Mode**, routing all AI inference to a server within their own intranet.

For privacy inquiries, please contact Joshua Flynn at [joshuaflynn040@gmail.com](mailto:joshuaflynn040@gmail.com).
