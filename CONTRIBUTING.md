
# Contributing to LexiVerse Explorer

Thank you for contributing to the scholarly advancement of LexiVerse! We welcome contributions from both developers and biblical scholars.

## 🎓 Scholarly Contributions

If you are a student or scholar, you can contribute directly through the **Scholarly Wiki** within the app. Propose new articles or improvements to existing ones. All entries undergo a peer-review process managed by our moderation committee.

## 💻 Technical Contributions

### Modular Architecture
LexiVerse Explorer uses a modular view system. Before starting development on a new feature, please review the [Module Development Guide](docs/MODULE_GUIDE.md).

### Code of Conduct
By participating, you agree to maintain a professional and respectful environment suitable for academic collaboration.

### How to Contribute
1. **Report Bugs**: Use the GitHub issue tracker with detailed reproduction steps.
2. **Suggest Features**: We are particularly interested in tools that enhance theological synthesis or linguistic precision.
3. **Pull Requests**:
   - Create a feature branch from `main`.
   - Ensure all code is typed with TypeScript.
   - Follow the established UI patterns using ShadCN and Tailwind.
   - If adding a new AI Flow, ensure it follows the expert-to-seminary-student persona.

### Style Guide
- **Tone**: Formal, academic, and rigorous.
- **Components**: Use Radix-based ShadCN components located in `src/components/ui/`.
- **Icons**: Use `lucide-react`.
- **Localization**: All UI text must be added to the dialect-specific files in `src/lib/locales/`.

## 🌍 Accessibility
LexiVerse is committed to WCAG 2.1 AAA standards. Please ensure all UI changes include proper ARIA labels and maintain high contrast ratios.

## 📄 License
By contributing, you agree that your contributions will be licensed under the project's MIT License.
