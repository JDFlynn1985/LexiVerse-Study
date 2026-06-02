# LexiVerse Explorer: Security Policy & Governance

This document outlines the multi-layered security architecture of LexiVerse Explorer, designed to safeguard scholarly research and maintain platform integrity.

## 🛡️ Defense in Depth

### 1. Authentication & Identity
- **Provider**: Firebase Authentication (Google OIDC).
- **Session Security**: Authenticated sessions are managed via secure, signed JWT tokens.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions based on `UserStudyProfile` designations. Administrative portals (/admin/*) are strictly guarded by `isAdmin` flags checked at both the UI and Firestore Rule level.

### 2. Data Authorization (Firestore Rules)
- **Deny-by-Default**: Our security rules follow a strict "zero-trust" model. No data is accessible unless an explicit rule allows it.
- **Path Isolation**: Researchers can only read/write their own profiles.
- **Governance Rules**: 
  - `wiki_entries`: Publicly readable once "approved", but only writable by the author or moderators.
  - `system_config`: Only writable by verified System Administrators.
  - `api_keys`: Restricted to the key owner.

### 3. API & External Integration
- **Tiered Rate Limiting**: External research tokens (`lv_`) are governed by usage quotas (Basic, Scholar, Institution) to prevent resource exhaustion and DoS attacks.
- **Revocation**: Administrators can instantly revoke API tokens through the **API Management** portal.

### 4. AI Governance
- **Prompt Sanitization**: System prompts are architected to prevent prompt injection and ensure a formal theological tone.
- **API Key Handling**: User-provided Gemini keys are stored either in Firestore (encrypted) or Browser LocalStorage, depending on the user's "Network Mode" preference.

### 5. Audit & Oversight
- **Error Logging**: Every runtime exception and permission violation is caught and persisted to `error_logs`.
- **Governance Audit**: Administrators have a dedicated dashboard to monitor system health and investigate legal (DMCA) complaints in real-time.

## 🚀 Reporting Vulnerabilities
If you discover a security vulnerability, please do not disclose it publicly. Email **Joshua Flynn** at **joshuaflynn040@gmail.com**. We aim to acknowledge and address critical issues within 48 hours.
