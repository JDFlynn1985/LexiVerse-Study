
# LexiVerse Governance Manual: Institutional Oversight

This document details the procedures and tools available for platform administrators to maintain scholarly integrity and platform stability.

## 👤 Role-Based Access Control (RBAC)
Governance is managed through `UserStudyProfile` flags in Firestore:
- **isAdmin**: Grants access to the System Control Panel, API Provisioning, and Institutional Registry.
- **isModerator**: Grants access to the Wiki Peer-Review portal and DMCA Resolution.

## 🔐 Institutional SSO (SAML/OIDC)
Administrators can enable enterprise-grade authentication:
1.  **Configuration**: Navigate to `System Control > Authentication`.
2.  **Provider ID**: Enter the Provider ID configured in the Firebase Console.
3.  **Protocol**: Toggle between **SAML** (for Azure AD/Okta) and **OIDC**.
4.  **Label**: Define the text for the institutional login button (e.g., "Sign in with Harvard ID").

## ✍️ Wiki Moderation Flow
All contributions to the **Scholarly Wiki** undergo a formal review:
1.  **Proposal**: A researcher submits an article draft with SBL-style works cited.
2.  **Review**: Moderators review the content for academic rigor and citation accuracy.
3.  **Action**: Approval triggers global publication and an automated author notification.

## 🛡️ DMCA & Takedown Procedures
LexiVerse features an automated copyright compliance system:
- **Reporting**: Any researcher can file a formal DMCA notice via the `DMCADialog` (available in Wiki and Chat).
- **Automatic Takedown**: Upon submission, the flagged content is immediately hidden from public view.
- **Resolution**: Administrators review the formal log in the **Governance Audit** and can permanently delete or restore content.

## 📊 Institutional Analytics
The **Governance Audit** provides real-time oversight:
- **Research Pulse**: Aggregated search trends (7-day window) to identify high-demand scholarly topics.
- **Stability Logs**: Automated capture of runtime exceptions and permission errors.
- **API Monitoring**: Oversight of external token usage (`lv_`) to prevent resource exhaustion.
