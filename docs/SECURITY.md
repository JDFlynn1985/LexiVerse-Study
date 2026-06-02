# LexiVerse Explorer: Security Policy & Measures

This document outlines the security architecture and data protection protocols implemented within LexiVerse Explorer to safeguard scholarly research and maintain academic integrity.

## 🛡️ Core Security Measures

### 1. Authentication & Identity
- **Provider**: Firebase Authentication (Google OIDC).
- **Session Management**: Secure, signed tokens managed client-side.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions based on `UserStudyProfile` designations (e.g., Professor, Student, Admin).

### 2. Authorization (Firestore Rules)
- **Deny-by-Default**: No data is accessible unless an explicit rule allows it.
- **Path Isolation**: Users can only read/write their own profiles.
- **Administrative Guardianship**: Only verified Admins can modify system configuration or module registries.
- **Audit Trails**: Security rule violations are caught by the `FirebaseErrorListener` and logged to `error_logs` for review.

### 3. Data Privacy & RAG Isolation
- **Local-First Storage**: Sensitive research papers uploaded for AI context are stored exclusively in the user's browser via **IndexedDB**.
- **Network Awareness**: These documents never touch the cloud, preventing data leakage and maintaining institutional confidentiality.
- **Encrypted Transmission**: All cloud communication is handled over SSL/TLS (HTTPS).

### 4. API Security
- **Tiered Access**: External research tokens (`lv_`) are tiered to prevent resource exhaustion.
- **Revocation**: Administrators can revoke API keys instantly through the **API Management** portal.
- **Rate Limiting**: Integrated usage counters monitor and enforce daily request quotas.

### 5. AI Governance
- **API Key Management**: Researchers can provide their own Gemini API keys, which are handled as sensitive environment variables or local-only storage.
- **Prompt Isolation**: System prompts are sanitized to prevent prompt injection and ensure scholarly tone.

## 🚀 Reporting Vulnerabilities
If you discover a security vulnerability within LexiVerse, please do not disclose it publicly. Email **Joshua Flynn** at **joshuaflynn040@gmail.com** with a detailed report. We aim to acknowledge and address critical issues within 48 hours.

## ⚖️ Compliance
- **GDPR/CCPA**: Users maintain the right to export and delete their data via the Profile Settings.
- **Academic Integrity**: Integrated scanners identify uncredited scholarly phrasing to support institutional plagiarism policies.
