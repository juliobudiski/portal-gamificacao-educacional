import {
  TEACHER_DOCS_CATEGORIES,
  TEACHER_DOCS_ARTICLES,
  TEACHER_DOCS_FAQS,
  WIZARD_HELP_TO_DOCS_MAP
} from './teacherDocsCatalog.js';
import {
  TeacherDocsSearchEngine,
  sanitizeSearchQueryForTelemetry
} from './TeacherDocsSearchEngine.js';

/**
 * Instância Singleton configurada do motor de conhecimento docente (US-26 / ADR-024).
 * Compartilhada entre TeacherDocsPage, DocsSearchModal, HelpFloatingWidget e HelpModal.
 */
export const teacherDocsEngine = new TeacherDocsSearchEngine({
  categories: TEACHER_DOCS_CATEGORIES,
  articles: TEACHER_DOCS_ARTICLES,
  faqs: TEACHER_DOCS_FAQS,
  wizardMap: WIZARD_HELP_TO_DOCS_MAP
});

export {
  TEACHER_DOCS_CATEGORIES,
  TEACHER_DOCS_ARTICLES,
  TEACHER_DOCS_FAQS,
  WIZARD_HELP_TO_DOCS_MAP,
  TeacherDocsSearchEngine,
  sanitizeSearchQueryForTelemetry
};
