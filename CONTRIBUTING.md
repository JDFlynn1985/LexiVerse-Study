
# Contributing to LexiVerse Explorer

Thank you for contributing to the scholarly advancement of LexiVerse! We welcome contributions from both developers and biblical scholars.

## 🎓 Scholarly Contributions

If you are a student or scholar, you can contribute directly through the **Scholarly Wiki** within the app. Propose new articles or improvements to existing ones. All entries undergo a peer-review process managed by our moderation committee.

## 💻 Technical Contributions

### Open Source & Licensing
All code contributions to LexiVerse Explorer MUST be open-source. To maintain the integrity of our scholarly ecosystem, we require:
- **License**: All new files and modules must be licensed under **CC BY-NC-SA 4.0** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International) or a more permissive scholarly license.
- **File Headers**: Every new file created must include a clear license declaration and copyright notice at the very top, preceding the `@fileOverview` block. Use the official LexiVerse header found in existing source files.

### Modular Architecture
LexiVerse Explorer uses a modular view system. Before starting development on a new feature, please review the [Module Development Guide](docs/MODULE_GUIDE.md).

### Documentation Standards
All code contributions MUST include full **JSDoc-compliant** documentation. This is critical for our automated SDK and API generation tools. 

- **License Header**: (Required) Declaration of CC BY-NC-SA 4.0 or equivalent.
- **Files**: Every new file should begin with a `@fileOverview` block.
- **Functions**: Use `@param`, `@returns`, and `@throws` where applicable.
- **Types**: Document all interfaces and types explaining their role in the research ecosystem.
- **AI Flows**: Clearly document the input/output schemas and the prompt logic.

### 🌍 Localization (i18n)
LexiVerse supports multiple dialects. When adding new features or language support:
1. **New Keys**: Add translation keys to all files in `src/lib/locales/`.
2. **New Languages**: To add support for a new language, copy `src/lib/locales/template.ts` to a new file (e.g., `fr-FR.ts`), provide the translations, and register it in `src/lib/locales.ts`.
3. **Consistency**: Ensure terminology matches the scholarly and formal tone of the platform.

### Code of Conduct
By participating, you agree to maintain a professional and respectful environment suitable for academic collaboration.

### How to Contribute
1. **Report Bugs**: Use the GitHub issue tracker with detailed reproduction steps.
2. **Suggest Features**: We are particularly interested in tools that enhance theological synthesis or linguistic precision.
3. **Pull Requests**:
   - Create a feature branch from `main`.
   - Ensure all code is typed with TypeScript.
   - **Ensure all public APIs and components have JSDoc comments.**
   - Follow the established UI patterns using ShadCN and Tailwind.
   - If adding a new AI Flow, ensure it follows the expert-to-seminary-student persona.

### Style Guide
- **Tone**: Formal, academic, and rigorous.
- **Components**: Use Radix-based ShadCN components located in `src/components/ui/`.
- **Icons**: Use `lucide-react`.

## ♿ Accessibility
LexiVerse is committed to **WCAG 2.1 AAA standards**. All UI contributions MUST:
- Provide descriptive ARIA labels for all interactive elements.
- Maintain high contrast ratios for text and iconography.
- Support full keyboard navigation across complex research tools.
- Ensure compatibility with screen readers used in academic environments.

## 📄 License
By contributing, you agree that your contributions will be licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license.
