# LexiVerse AI Architecture: The Research Brain

LexiVerse Explorer utilizes **Firebase Genkit (1.x)** as its primary orchestration layer, providing a unified interface for cloud-based synthesis and local-network inference.

## 🤖 Multi-Provider Intelligence Hub
The platform allows scholars to select their preferred reasoning engine. Supported providers include:
- **Google AI (Gemini)**: Primary foundation for multimodal transcription and exegesis.
- **OpenAI / Anthropic**: Alternatives for high-end synthesis.
- **Ollama**: Local-network isolated research for air-gapped institutions.
- **DeepSeek / xAI**: Emerging models for specialized theological reasoning.

## 📚 Local RAG (Retrieval-Augmented Generation)
The **Digital Library** enables researchers to ground the AI in their personal research papers without data leaving the client.
1.  **Local Indexing**: Documents are parsed and stored in **IndexedDB**.
2.  **Semantic Chunking**: Text is split into overlapping fragments.
3.  **Vector Search**: Optional cloud-indexing for high-dimensional semantic retrieval.
4.  **Attributed Synthesis**: The LLM is instructed to cite local papers using bracketed references (e.g., `[Ref: Thesis_Draft.pdf]`).

## 🗺️ Visual & Auditory Analytics
- **Theology Mapper**: Assigns "Influence Scores" (0-100) to historical eras.
- **Audio Hub (TTS)**: Converts reports into scholarly audio using Gemini 2.5 Flash.
- **Scholarly Dialogues**: Simulates dialectic theology between historical figures.

## 🎤 Multimodal Transcription
- **Voice Research**: Uses Gemini Multimodal to transcribe audio queries, preserving Greek and Hebrew terms with high precision.
- **Manuscript OCR**: Uses Gemini Vision to perform paleographic OCR on images of ancient papyrus.
