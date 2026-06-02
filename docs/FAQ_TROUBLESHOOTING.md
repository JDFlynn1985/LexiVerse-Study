# LexiVerse Explorer: FAQ & Troubleshooting

This guide addresses common technical hurdles encountered by scholars and administrators when setting up or using the LexiVerse platform.

---

## 🔌 AI & Connectivity

### 1. Ollama Server Unreachable
**Issue**: The "Local Ollama" tab in the System Control Panel shows "SERVER UNREACHABLE" even though Ollama is running.
**Solution**: This is usually a CORS (Cross-Origin Resource Sharing) issue. By default, Ollama only listens to local requests. 
- **Fix**: Set the `OLLAMA_ORIGINS` environment variable to allow your LexiVerse domain (e.g., `http://localhost:9002` or your production URL) and restart the Ollama service.
- **Check**: Ensure the server is listening on `0.0.0.0` if accessing from a remote network.

### 2. API Key Not Working
**Issue**: "AI Hub Configuration Required" error despite pasting a key.
**Solution**: 
- **Visibility**: Ensure the key matches the selected provider (e.g., don't paste an OpenAI key into the Google Gemini field).
- **Persistence**: If you are in "Local-Only" network mode, keys are stored in your browser's LocalStorage. If you clear your browser cache, you must re-enter your keys.

---

## 📄 Document Management (RAG)

### 3. PDF Parsing Fails
**Issue**: An error occurs when uploading a specific PDF paper.
**Solution**: LexiVerse uses a client-side parser (`pdfjs-dist`). 
- **Cause**: The PDF might be an image-only scan without an OCR layer. 
- **Fix**: Use the **Manuscript Hub** to perform OCR on individual pages of a scanned document, then copy the text to the **Writing Hub**.

### 4. RAG Insights are Irrelevant
**Issue**: The AI isn't using the content of my uploaded papers.
**Solution**: 
- **Context Limit**: The system ranks fragments by keyword frequency. Ensure your research term (the query) actually appears in your uploaded documents.
- **Indexing**: Check the **Library Hub** to ensure the document status is "Context Active."

---

## 🔐 Authentication & Workspace

### 5. Google Drive Export Fails
**Issue**: "Auth Required" or "Scope Denied" when exporting to Google Docs.
**Solution**: 
- **Scopes**: LexiVerse requires `drive.file` and `documents` permissions to create research files. 
- **Fix**: Sign out and sign back in using the **Link Google** button to refresh your OAuth tokens with the necessary scholarly permissions.

### 6. Session Not Found in Archive
**Issue**: I saved a session but it's not appearing in the Research Archive.
**Solution**: 
- **Sync Status**: Ensure you were signed in when you clicked "Save to Workspace." Guest sessions are not persisted to the cloud and are lost upon refresh.

---

## 📊 Administrative Oversight

### 7. Module Hidden for Admins
**Issue**: An administrative module (like Governance Audit) is missing from the sidebar.
**Solution**: 
- **Permission Check**: Verify that your `UserStudyProfile` in Firestore has `isAdmin: true`.
- **Registry**: Check the **Module Governance** panel to ensure the module hasn't been disabled globally.

---
*For further technical support, please contact [engineering@lexiverse.app](mailto:engineering@lexiverse.app).*
