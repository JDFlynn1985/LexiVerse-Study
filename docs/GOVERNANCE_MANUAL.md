# LexiVerse Governance Manual: Institutional Oversight

This document details the procedures and tools available for platform administrators to maintain scholarly integrity and platform stability.

## 👤 Role-Based Access Control (RBAC)
Governance is managed through `UserStudyProfile` flags in Firestore:
- **isAdmin**: Grants access to the System Control Panel, API Provisioning, and Institutional Registry.
- **isModerator**: Grants access to the Wiki Peer-Review portal and DMCA Resolution.

## ✍️ Wiki Moderation Flow
All contributions to the **Scholarly Wiki** undergo a formal review:
1.  **Proposal**: A researcher submits an article draft with SBL-style works cited.
2.  **Review**: Moderators review the content for academic rigor and citation accuracy in the `admin/wiki` portal.
3.  **Action**: 
    - **Approval**: Entry status changes to `approved` and is published globally.
    - **Rejection**: Entry is flagged for revision.
4.  **Notification**: The author receives an automated in-app alert via the **Notification Center** upon status change.

## 🛡️ DMCA & Takedown Procedures
LexiVerse features an automated copyright compliance system:
- **Reporting**: Any researcher can file a formal DMCA notice via the `DMCADialog`.
- **Automatic Takedown**: Upon submission, the flagged content (Wiki or Chat) is immediately hidden from public view.
- **Resolution**: Administrators review the formal log in the **Governance Audit** and can either permanently delete the content or restore it if the complaint is found to be invalid.

## 📊 Institutional Analytics
The **Governance Audit** provides real-time oversight:
- **Research Pulse**: Aggregated search trends (7-day window) to identify high-demand scholarly topics.
- **Stability Logs**: Automated capture of runtime exceptions and permission errors.
- **API Monitoring**: Oversight of external token usage to prevent resource exhaustion.

## ⚙️ System Configuration
Administrators can dynamically control the platform environment:
- **Network Mode**: Toggle between "Internet" and "Local-Only" (air-gapped) modes.
- **Module Control**: Enable or disable specific research tools (e.g., Theology Map, Social Hub) in real-time across the entire platform.