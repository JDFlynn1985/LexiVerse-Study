# LexiVerse Explorer: Technical Stack & Dependency Manual

This document provides a detailed breakdown of the technologies, frameworks, and libraries that power LexiVerse Explorer, ensuring transparency for institutional partners and developers.

---

## 🏛️ Core Frameworks

### 1. Next.js 15 (App Router)
- **Role**: Primary application framework.
- **Usage**: Handles routing, server-side rendering for SEO-optimized wiki entries, and **Server Actions** for secure processing of sensitive metadata.

### 2. React 19
- **Role**: User Interface library.
- **Usage**: Powers the reactive dashboard, real-time chat components, and modular research views.

---

## 🤖 AI & Research Orchestration

### 3. Firebase Genkit (1.x)
- **Role**: AI Framework.
- **Usage**: Standardizes the integration between the UI and LLMs. It handles prompt templating via Handlebars and manages flows for term analysis, synthesis, and OCR.

### 4. Google Gemini (1.5 / 2.5)
- **Role**: Cloud LLM Engine.
- **Usage**: Provides high-level synthesis, theological reasoning, and multimodal capabilities (Vision/Audio).

### 5. Ollama
- **Role**: Local LLM Bridge.
- **Usage**: Enables researchers to switch to "Local Network Mode," routing AI queries to an on-premise server (e.g., Llama 3) for maximum privacy.

---

## 🔥 Backend & Database

### 6. Firebase Firestore
- **Role**: Real-time NoSQL Database.
- **Usage**: Stores user profiles, public wiki articles, system governance logs (errors/search/DMCA), and the social chat stream.

### 7. Firebase Authentication
- **Role**: Identity Provider.
- **Usage**: Secure Google OIDC integration for scholarly credentials and role-based access control.

---

## 🎨 UI & Design System

### 8. Tailwind CSS
- **Role**: Utility-first CSS.
- **Usage**: Custom theme implementation (Desaturated Parchment) and responsive layout design.

### 9. ShadCN UI (Radix Primitives)
- **Role**: Accessible Component Suite.
- **Usage**: Provides WCAG-compliant UI elements like Dialogs, Tabs, and Navbars, ensuring inclusivity for all scholars.

### 10. Lucide React
- **Role**: Iconography.
- **Usage**: Standardized scholarly visual language across the platform.

---

## 📚 Specialized Research Libraries

### 11. PDF.js (pdfjs-dist)
- **Role**: Client-side PDF Parsing.
- **Usage**: Extracts text from research papers locally in the browser to power the RAG (Retrieval-Augmented Generation) engine.

### 12. Mammoth.js
- **Role**: Docx to Text Converter.
- **Usage**: Enables the Library Hub to process Microsoft Word research papers locally.

### 13. jsPDF & docx
- **Role**: Document Generation.
- **Usage**: Powers the Export Hub, allowing researchers to download AI-synthesized reports as portable PDF or Word files.

### 14. IndexedDB
- **Role**: Local Browser Storage.
- **Usage**: Persists the user's private research library on their device, ensuring sensitive data never touches the cloud.

---

## 🧪 DevOps & Governance

### 15. GitHub Actions
- **Role**: CI/CD Pipeline.
- **Usage**: Automates linting, type-checking, and build validation for every scholarly contribution.

### 16. Dependabot
- **Role**: Dependency Management.
- **Usage**: Monitors and updates project libraries to ensure security and compatibility.
