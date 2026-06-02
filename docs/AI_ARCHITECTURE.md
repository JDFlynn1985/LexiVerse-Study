# LexiVerse AI Architecture: The Research Brain

LexiVerse Explorer utilizes **Firebase Genkit (1.x)** as its primary orchestration layer, providing a unified interface for cloud-based synthesis and local-network inference.

## 🤖 The Orchestration Layer (Genkit)
The platform standardizes all AI logic into **Genkit Flows** located in `src/ai/flows/`. This architecture ensures:
- **Consistent Schemas**: All research results follow strict Zod-validated structures.
- **Model Agnostic**: Users can switch between providers (Google, OpenAI, Anthropic, Mistral, DeepSeek, xAI) without changing the underlying exegesis logic.
- **Tool Grounding**: Flows use specialized tools (e.g., `searchBibleVerse`) to fetch real-time scripture text instead of relying on LLM memory.

## 📚 Local RAG (Retrieval-Augmented Generation)
The **Digital Library** enables researchers to ground the AI in their personal research papers without data leaving the client.
1.  **Local Indexing**: Documents (PDF, Docx, TXT) are parsed in the browser and stored in **IndexedDB**.
2.  **Semantic Chunking**: Text is split into 800-character fragments with a 150-character overlap to preserve context.
3.  **TF-IDF Ranking**: Chunks are ranked locally in the browser based on weighted keyword frequency relative to the query.
4.  **Attributed Synthesis**: The top-ranked fragments are sent as temporary context to the LLM. The LLM is instructed to cite these fragments using the filename (e.g., `[Ref: Thesis_Draft.pdf]`).

## 🗺️ Visual Theology Mapper
The **Theological Concept Mapper** uses AI to assign "Influence Scores" (0-100) to historical developments. This data is visualized via `recharts` to create a density map of theological shifts across eras.

## 🎤 Multimodal Integration
- **Voice Hub**: Uses Gemini Multimodal to transcribe audio queries into precise scholarly text, preserving Greek and Hebrew terms.
- **Manuscript Hub**: Uses Gemini Vision to perform paleographic OCR on images of ancient fragments and papyrus.

## 🔒 Local Network Mode (Ollama)
For institutions requiring total air-gapping, LexiVerse supports **Local Network Mode**. All AI inference is routed to an on-premise **Ollama** server, ensuring no data ever touches the public internet.