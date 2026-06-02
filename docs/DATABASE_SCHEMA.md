# LexiVerse: Database Schema & Data Relationships

LexiVerse uses **Firebase Firestore** as its primary real-time database. The structure is designed for high-concurrency scholarly collaboration and strict role-based access control.

## 📂 Primary Collections

### `/users/{userId}`
The core profile for every researcher.
- **Fields**: 
  - `uid`: string (Primary Key)
  - `displayName`: string
  - `email`: string
  - `birthday`: string (Used for Clause 1.1 compliance)
  - `designation`: enum (Professor, Student, etc.)
  - `institutionId`: string (Reference to institution)
  - `isAdmin`: boolean
  - `preferences`: object (Contains AI provider selection and encrypted keys)
- **Security**: Readable by all authenticated scholars; writable only by the owner or admins.

### `/users/{userId}/sessions/{sessionId}`
Stored research reports from the AI Hub.
- **Fields**: `type` (assistant/lexicon/theology), `title`, `data` (JSON report), `createdAt`.
- **Relationship**: Owned by a specific user; restored via the **Archive Hub**.

### `/users/{userId}/chunks/{chunkId}`
Vector-ready fragments of the user's research papers.
- **Fields**: `content`, `embedding` (array), `docName`, `createdAt`.

### `/messages/{msgId}`
The social discourse stream.
- **Fields**: `content`, `senderUid`, `mode` (global/institutional), `status` (active/removed_dmca).

### `/wiki_entries/{entryId}`
Peer-reviewed knowledge base articles.
- **Fields**: `title`, `content`, `authorUid`, `status` (pending/approved).

### `/system/config`
Global environment variables and AI governance.
- **Fields**: `geminiApiKey`, `apiTiers`, `networkMode` (internet/local-only), `ssoConfig`.

## 📊 Logging & Governance

### `/error_logs/{logId}`
Automated capture of runtime and permission errors.

### `/search_logs/{logId}`
Anonymized tracking of research terms to inform Wiki commissioning.

### `/dmca_complaints/{compId}`
Formal legal notices audited by administrators to resolve intellectual property disputes.
