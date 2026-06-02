
# LexiVerse AI Architecture: The Research Brain

LexiVerse Explorer utilizes **Firebase Genkit (1.x)** as its primary orchestration layer, providing a unified interface for cloud-based synthesis and local-network inference.

## 🤖 Grounded Intelligence Layer
The platform standardizes all AI logic into **Genkit Flows** located in `src/ai/flows/`. To ensure academic integrity, the engine uses **Grounded Tool Calling**:

- **`searchBibleVerse`**: Fetches real-time scripture text instead of relying on LLM memory.
- **`fetchStrongsData`**: Retrieves 100% verified linguistic data for Strong's numbers from the LexiVerse registry.
- **`aggregateCommentary`**: Specifically searches and synthesizes from primary historical works (JFB, Matthew Henry).

## 📚 Local RAG (Retrieval-Augmented Generation)
The **Digital Library** enables researchers to ground the AI in their personal research papers without data leaving the client.
1.  **Local Indexing**: Documents are parsed and stored in **IndexedDB**.
2.  **TF-IDF Ranking**: Chunks are ranked locally using a weighted keyword frequency algorithm.
3.  **Attributed Synthesis**: The top-ranked fragments are sent as context. The LLM is instructed to cite these using bracketed references (e.g., `[Ref: Thesis_Draft.pdf]`).

## 🗺️ Visual Analytics Hub
- **Theology Mapper**: Uses AI to assign "Influence Scores" (0-100) to historical eras, visualized via density scatter charts.
- **Research Pulse**: A real-time institutional dashboard that visualizes search momentum across all scholarly modules.

## 🎤 Multimodal Transcription
- **Voice Research**: Uses Gemini Multimodal to transcribe audio queries, preserving Greek and Hebrew terms with high precision.
- **Manuscript OCR**: Uses Gemini Vision to perform paleographic OCR on images of ancient fragments and papyrus.

## 🔒 Local Network Mode (Ollama)
For air-gapped institutions, administrators can manage an on-premise **Ollama** server through the System Control Panel, allowing for remote "pulling" and deletion of local models.
