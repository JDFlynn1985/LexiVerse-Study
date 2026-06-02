# LexiVerse: Database Schema & Data Relationships

LexiVerse uses **Firebase Firestore** as its primary real-time database. The structure is designed for high-concurrency scholarly collaboration and strict role-based access control.

## 📂 Primary Collections

### `/users/{userId}`
The core profile for every researcher.
- **Fields**: `uid`, `displayName`, `designation` (Professor, Student, etc.), `institutionId`, `preferences`.
- **Security**: Readable by all authenticated scholars; writable only by the owner or admins.

### `/users/{userId}/sessions/{sessionId}`
Stored research reports from the AI Hub.
- **Fields**: `type` (assistant/lexicon/theology), `title`, `data` (JSON report), `createdAt`.
- **Relationship**: Owned by a specific user; restored via the **Archive Hub**.

### `/messages/{msgId}`
The social discourse stream.
- **Fields**: `content`, `senderUid`, `mode` (global/institutional), `institutionId`, `status` (active/removed_dmca).
- **Security**: Public read for approved scholars; automatic takedown triggers `removed_dmca` status.

### `/wiki_entries/{entryId}`
Peer-reviewed knowledge base articles.
- **Fields**: `title`, `content`, `authorUid`, `status` (pending/approved), `moderatedBy`.
- **Relationship**: Linked to authors and moderators via UIDs.

### `/system/config`
Global environment variables.
- **Fields**: `geminiApiKey`, `apiTiers`, `networkMode` (internet/local-only).
- **Security**: Writable ONLY by root administrators.

## 📊 Logging & Governance

### `/error_logs/{logId}`
Automated capture of runtime and permission errors.
- **Usage**: Used by administrators in the **Governance Audit** to monitor platform stability.

### `/search_logs/{logId}`
Anonymized tracking of research terms.
- **Usage**: Powers the "Scholarly Momentum" chart and informs Wiki commissioning.

### `/dmca_complaints/{compId}`
Formal legal notices.
- **Usage**: Audited by administrators to resolve intellectual property disputes.
