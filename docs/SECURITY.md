# LexiVerse Explorer: Security Policy & Governance

This document outlines the multi-layered security architecture of LexiVerse Explorer, designed to safeguard scholarly research and maintain platform integrity.

## 🛡️ Defense in Depth

### 1. Authentication & Identity
- **Provider**: Firebase Authentication (Google OIDC / Email & Password).
- **Age Verification**: Mandatory **15+ age requirement** enforced via server-side birthday validation to comply with global data protection regulations.
- **Password Policy**: LexiVerse enforces a strict non-predictability policy. Passwords cannot contain the user's name, email, or birthday components.
- **Verification**: Dual-layer verification (Client-side AJAX and Server Action) ensures all credentials meet scholarly security standards before storage.
- **Salting & Hashing**: Passwords are never stored in plain text; they are hashed and salted using industrial-grade scrypt/argon2 algorithms via Firebase Auth.

### 2. Data Authorization (Firestore Rules)
- **Deny-by-Default**: Our security rules follow a strict "zero-trust" model. No data is accessible unless an explicit rule allows it.
- **Path Isolation**: Researchers can only read/write their own profiles and private library indices.
- **Governance Rules**: 
  - `wiki_entries`: Publicly readable once "approved", but only writable by the author or moderators.
  - `system_config`: Only writable by verified System Administrators.
  - `api_keys`: Restricted to the key owner.

### 3. API & External Integration
- **Tiered Rate Limiting**: External research tokens (`lv_`) are governed by usage quotas (Basic, Scholar, Institution) to prevent resource exhaustion and DoS attacks.
- **Revocation**: Administrators can instantly revoke API tokens through the **API Management** portal.

### 4. AI Governance
- **Multi-Provider Support**: Scholars can provide their own API keys for Google, OpenAI, Anthropic, etc. These keys are stored encrypted in the user's private Firestore profile.
- **Network Mode**: Supports "Local Network Only" mode to air-gap research from the public internet.

### 5. Audit & Oversight
- **Error Logging**: Every runtime exception and permission violation is caught and persisted to `error_logs` for administrative review.
- **Governance Audit**: Administrators have a dedicated dashboard to monitor system health and investigate legal (DMCA) complaints in real-time.

## 🚀 Reporting Vulnerabilities
If you discover a security vulnerability, please do not disclose it publicly. Email **Joshua Flynn** at **joshuaflynn040@gmail.com**. We aim to acknowledge and address critical issues within 48 hours.
