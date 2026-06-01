/**
 * @fileOverview Centralized dictionary for application localization.
 */

export const locales = {
  en: {
    nav: {
      dashboard: "Dashboard",
      ai_hub: "AI Research Hub",
      study_assistant: "AI Study Assistant",
      verse_explorer: "Verse Explorer",
      translation_compare: "Translation Compare",
      library: "Library & Research",
      lexicon: "Lexicon",
      dictionaries: "Dictionaries",
      commentaries: "Commentaries",
      wiki: "Scholarly Wiki",
      synthesis: "Academic Synthesis",
      theology_map: "Theology Map",
      timeline: "Historical Timeline",
      writing_editor: "Writing Editor",
      integrity: "Academic Integrity",
      support: "Scholar Support",
      settings: "Settings",
      help: "Help Center",
      logout: "Logout",
      login_google: "Link Google"
    },
    dashboard: {
      title: "Research Workspace",
      subtitle: "Integrated AI tools for biblical scholarship.",
      toolbox: "Academic Toolbox",
      toolbox_desc: "Direct access to core scholarly resources.",
      history: "Search History",
      no_history: "No history logged.",
      documents: "Recent Documents",
      no_documents: "No papers uploaded.",
      spotlight: "Research Spotlight",
      spotlight_desc: "Partner with LexiVerse Explorer to support the global community.",
      stats_title: "Bibliographic Overview",
      wiki_articles: "Wiki Articles",
      logs: "Analytic Logs",
      upload_paper: "Upload Paper"
    },
    settings: {
      title: "Scholar Preferences & Settings",
      subtitle: "Configure your academic environment and AI tools.",
      ai_config: "AI Engine Configuration",
      ai_desc: "Select your preferred reasoning engine and manage API access.",
      scripture_prefs: "Scripture Preferences",
      scripture_desc: "Default translations and academic settings for primary sources.",
      interface_prefs: "Interface Preferences",
      interface_desc: "Customize how you interact with the platform.",
      language: "Interface Language",
      bible_version: "Preferred Bible Version",
      api_key: "Google AI API Key",
      save: "Save All Preferences"
    },
    common: {
      search_placeholder: "Lexicon (G3056) or AI query...",
      loading: "Loading...",
      search: "Search",
      submit: "Submit",
      cancel: "Cancel",
      back: "Back"
    }
  },
  es: {
    nav: {
      dashboard: "Tablero",
      ai_hub: "Centro de Investigación IA",
      study_assistant: "Asistente de Estudio IA",
      verse_explorer: "Explorador de Versículos",
      translation_compare: "Comparar Traducciones",
      library: "Biblioteca e Investigación",
      lexicon: "Léxico",
      dictionaries: "Diccionarios",
      commentaries: "Comentarios",
      wiki: "Wiki Erudita",
      synthesis: "Síntesis Académica",
      theology_map: "Mapa Teológico",
      timeline: "Línea de Tiempo",
      writing_editor: "Editor de Escritura",
      integrity: "Integridad Académica",
      support: "Soporte Académico",
      settings: "Configuración",
      help: "Centro de Ayuda",
      logout: "Cerrar Sesión",
      login_google: "Vincular Google"
    },
    dashboard: {
      title: "Espacio de Trabajo",
      subtitle: "Herramientas de IA integradas para la erudición bíblica.",
      toolbox: "Caja de Herramientas",
      toolbox_desc: "Acceso directo a recursos académicos básicos.",
      history: "Historial de Búsqueda",
      no_history: "Sin historial registrado.",
      documents: "Documentos Recientes",
      no_documents: "No hay documentos cargados.",
      spotlight: "Destacado de Investigación",
      spotlight_desc: "Colabore con LexiVerse para apoyar a la comunidad global.",
      stats_title: "Resumen Bibliográfico",
      wiki_articles: "Artículos Wiki",
      logs: "Registros Analíticos",
      upload_paper: "Subir Documento"
    },
    settings: {
      title: "Preferencias del Erudito",
      subtitle: "Configure su entorno académico y herramientas de IA.",
      ai_config: "Configuración del Motor de IA",
      ai_desc: "Seleccione su motor de razonamiento preferido y gestione el acceso API.",
      scripture_prefs: "Preferencias de Escritura",
      scripture_desc: "Traducciones predeterminadas y ajustes académicos.",
      interface_prefs: "Preferencias de Interfaz",
      interface_desc: "Personalice cómo interactúa con la plataforma.",
      language: "Idioma de la Interfaz",
      bible_version: "Versión Bíblica Preferida",
      api_key: "Clave API de Google AI",
      save: "Guardar Todas las Preferencias"
    },
    common: {
      search_placeholder: "Léxico (G3056) o consulta IA...",
      loading: "Cargando...",
      search: "Buscar",
      submit: "Enviar",
      cancel: "Cancelar",
      back: "Volver"
    }
  }
};

export type LocaleType = keyof typeof locales;
