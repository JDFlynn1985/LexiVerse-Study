# Contributing to LexiVerse Explorer

Thank you for contributing to the scholarly advancement of LexiVerse! We welcome contributions from both developers and biblical scholars.

## 🎓 Scholarly Contributions

If you are a student or scholar, you can contribute directly through the **Scholarly Wiki** or the **Social Chat Hub** within the app. 

### Licensing for Scholarly Content
To ensure that academic knowledge remains an open resource for the global community, all scholarly contributions (Wiki articles and Chat insights) are licensed under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**. 
- **Attribution**: You will receive full credit for your work.
- **Open Access**: Your research remains available for others to study and adapt with proper credit.

## 💻 Technical Contributions

### Open Source & Licensing
All code contributions to LexiVerse Explorer MUST be open-source. To maintain the integrity of our scholarly ecosystem, we require:
- **License**: All new source code files and modules must be licensed under **CC BY-NC-SA 4.0** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).
- **File Headers**: Every new file created must include a clear license declaration and copyright notice at the very top. Use the official LexiVerse header found in existing source files.

### Modular Architecture
LexiVerse Explorer uses a modular view system. Before starting development on a new feature, please review the [Module Development Guide](docs/MODULE_GUIDE.md).

### Documentation Standards
All code contributions MUST include full **JSDoc-compliant** documentation. This is critical for our automated SDK and API generation tools. 

- **Functions**: Use `@param`, `@returns`, and `@throws` where applicable.
- **Types**: Document all interfaces explaining their role in the research ecosystem.
- **AI Flows**: Clearly document the input/output schemas and the prompt logic in the `@fileOverview`.

### Style Guide
- **Tone**: Formal, academic, and rigorous.
- **Components**: Use Radix-based ShadCN components located in `src/components/ui/`.
- **Icons**: Use `lucide-react`.

## ♿ Accessibility
LexiVerse is committed to **WCAG 2.1 AAA standards**. All UI contributions MUST:
- Provide descriptive ARIA labels for all interactive elements.
- Maintain high contrast ratios for text and iconography.
- Support full keyboard navigation across complex research tools.

## 📄 License
By contributing code, you agree that your contributions will be licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license. Scholarly content contributions are subject to **CC BY 4.0**.
