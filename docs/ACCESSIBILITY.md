# LexiVerse Explorer: Accessibility Standards (WCAG 2.1 AA)

LexiVerse Explorer is committed to providing a digitally inclusive environment for all biblical scholars and students, regardless of physical or cognitive ability. Our platform is engineered to meet **WCAG 2.1 AA** standards.

## ♿ Core Accessibility Measures

### 1. Robust UI Foundations
We utilize **Radix UI** as the foundation for our ShadCN components. These primitives are built with accessibility as a first-class citizen, providing:
- **Focus Management**: Automatic focus trapping in dialogs and proper focus restoration.
- **Keyboard Navigation**: Full support for `Tab`, `Enter`, `Space`, and `Arrow` keys across all complex tools (e.g., Lexicon, Theology Map).
- **ARIA Attributes**: Standardized roles and states (e.g., `aria-expanded`, `aria-controls`) are baked into every interactive element.

### 2. Visual Clarity & Contrast
- **Parchment Theme**: Our primary "Desaturated Parchment" theme is specifically calibrated to provide high text-to-background contrast (exceeding 4.5:1) while reducing eye strain during long-form research sessions.
- **Typography**: We use a dual-font strategy:
  - **Literata (Serif)**: Optimized for scholarly headlines and readability.
  - **Inter (Sans-Serif)**: A high-legibility font for body text and navigation.
- **Dynamic Sizing**: The UI utilizes relative units (`rem`) to ensure that browser zoom settings do not break the layout.

### 3. Screen Reader Optimization
- **Semantic HTML**: We strictly use semantic tags (`header`, `main`, `footer`, `nav`) to provide logical landmarks for assistive technologies.
- **Skip Links**: A hidden "Skip to Main Content" link is available for keyboard users to bypass navigation.
- **Alt Text**: All meaningful images and iconography include descriptive alternative text or ARIA labels.

### 4. Interactive Components
- **Toasts & Notifications**: All error messages are announced using `aria-live="assertive"` to ensure urgent feedback is communicated immediately.
- **Forms**: Every input is explicitly associated with a label using `id` and `htmlFor` attributes.

## 🛠️ Continuous Improvement
Accessibility is a journey. We perform regular audits using:
- **Lighthouse**: For automated performance and accessibility scoring.
- **VoiceOver / NVDA**: Manual testing with industry-standard screen readers.
- **Keyboard-Only Traversal**: Ensuring every feature is reachable without a pointing device.

If you encounter an accessibility barrier, please contact our engineering team at [engineering@lexiverse.app](mailto:engineering@lexiverse.app).
