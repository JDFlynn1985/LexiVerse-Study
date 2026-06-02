
# Contributing to LexiVerse Explorer

Thank you for contributing to the scholarly advancement of LexiVerse! We welcome contributions from both developers and biblical scholars.

## 🎓 Scholarly Contributions

If you are a student or scholar, you can contribute directly through the **Scholarly Wiki** within the app. Propose new articles or improvements to existing ones. All entries undergo a peer-review process managed by our moderation committee.

## 💻 Technical Contributions

### Modular Architecture
LexiVerse Explorer uses a modular view system. Before starting development on a new feature, please review the [Module Development Guide](docs/MODULE_GUIDE.md).

### Documentation Standards
All code contributions MUST include full **JSDoc-compliant** documentation. This is critical for our automated SDK and API generation tools. 

- **Files**: Every new file should begin with a `@fileOverview` block.
- **Functions**: Use `@param`, `@returns`, and `@throws` where applicable.
- **Types**: Document all interfaces and types explaining their role in the research ecosystem.
- **AI Flows**: Clearly document the input/output schemas and the prompt logic.

Example:
```typescript
/**
 * Analyzes a specific scripture fragment for linguistic nuances.
 * 
 * @param fragment - The raw text of the scripture.
 * @param originalLanguage - The source language (Greek/Hebrew).
 * @returns A promise resolving to the morphological breakdown.
 */
export async function analyzeFragment(fragment: string, originalLanguage: 'greek' | 'hebrew') {
  // ...
}
```

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
- **Localization**: All UI text must be added to the dialect-specific files in `src/lib/locales/`.

## 🌍 Accessibility
LexiVerse is committed to **WCAG 2.1 AAA standards**. All UI contributions MUST:
- Provide descriptive ARIA labels for all interactive elements.
- Maintain high contrast ratios for text and iconography.
- Support full keyboard navigation across complex research tools.
- Ensure compatibility with screen readers used in academic environments.

## 📄 License
By contributing, you agree that your contributions will be licensed under the project's MIT License.
