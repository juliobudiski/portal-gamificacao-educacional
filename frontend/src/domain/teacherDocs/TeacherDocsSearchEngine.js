/**
 * TeacherDocsSearchEngine.js
 *
 * Motor orientado a objetos de indexação, busca instantânea determinística (< 16ms),
 * validação de integridade referencial, construção de sumário (TOC) e sanitização LGPD/AppSec
 * para a Central de Documentação Docente & FAQ do GamificaEdu.
 *
 * Princípios Arquiteturais:
 * - Domínio Puro (Clean/Hexagonal): Zero acoplamento a React, DOM ou APIs de navegador.
 * - Segurança Shift-Left (STRIDE): Busca linear tokenizada livre de RegExp dinâmico (imune a ReDoS)
 *   e sanitizador anti-PII/XSS antes de despacho de telemetria para EventLog.
 *
 * Rastreabilidade: US-26 | RF-16 | RNF-01 | RNF-07 | RNF-11 | ADR-024
 */

const MAX_QUERY_LENGTH = 120;

/**
 * Normaliza texto removendo diacríticos (acentos), convertendo para minúsculas
 * e colapsando espaços extras para busca tolerante a digitação rápida.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
  if (typeof value !== 'string') return '';
  return value
    .slice(0, 5000)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitiza consultas de busca antes de enviar metadados analíticos ao backend (EventLog),
 * prevenindo vazamento acidental de PII (e-mails, CPFs, sequências numéricas longas) e tags HTML.
 * @param {unknown} rawQuery
 * @returns {string}
 */
export function sanitizeSearchQueryForTelemetry(rawQuery) {
  if (typeof rawQuery !== 'string') return '';
  return rawQuery
    .slice(0, MAX_QUERY_LENGTH)
    // Remove tags HTML/scripts
    .replace(/<[^>]*>/g, ' ')
    // Mascara endereços de e-mail (LGPD)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    // Mascara padrão de CPF com ou sem pontuação (LGPD)
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF_REDACTED]')
    // Mascara sequências numéricas longas genéricas (ex.: telefone/matrícula >= 8 dígitos)
    .replace(/\b\d{8,}\b/g, '[NUM_REDACTED]')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrai tokens significativos com stem leve de plural em português para ampliar recall sem perda de precisão.
 * @param {string} normalizedQuery
 * @returns {string[]}
 */
function tokenizeQuery(normalizedQuery) {
  if (!normalizedQuery) return [];
  const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'para', 'com', 'por', 'um', 'uma', 'os', 'as', 'que', 'se', 'ao']);
  const rawTokens = normalizedQuery.split(' ').filter((t) => t.length >= 2 && !stopWords.has(t));
  return Array.from(new Set(rawTokens)).slice(0, 12);
}

export class TeacherDocsSearchEngine {
  #categories;
  #articles;
  #faqs;
  #wizardMap;
  #articleIndex;
  #faqIndex;

  /**
   * @param {Object} params
   * @param {Array} params.categories
   * @param {Array} params.articles
   * @param {Array} params.faqs
   * @param {Object} params.wizardMap
   */
  constructor({ categories = [], articles = [], faqs = [], wizardMap = {} } = {}) {
    this.#categories = Array.isArray(categories) ? categories : [];
    this.#articles = Array.isArray(articles) ? articles : [];
    this.#faqs = Array.isArray(faqs) ? faqs : [];
    this.#wizardMap = wizardMap && typeof wizardMap === 'object' ? wizardMap : {};

    this.#articleIndex = this.#buildArticleIndex();
    this.#faqIndex = this.#buildFaqIndex();
  }

  #buildArticleIndex() {
    return this.#articles.map((article) => {
      const sectionHeadings = (article.sections || []).map((s) => s.heading || '').join(' ');
      const sectionBodies = (article.sections || [])
        .map((s) => {
          const paragraphs = (s.paragraphs || []).join(' ');
          const callout = s.callout ? `${s.callout.title} ${s.callout.text}` : '';
          const steps = (s.steps || []).map((st) => `${st.title} ${st.detail}`).join(' ');
          const tableRows = s.table ? s.table.rows.flat().join(' ') : '';
          return `${paragraphs} ${callout} ${steps} ${tableRows}`;
        })
        .join(' ');

      return {
        article,
        normTitle: normalizeSearchText(article.title),
        normSubtitle: normalizeSearchText(article.subtitle),
        normKeywords: normalizeSearchText((article.keywords || []).join(' ')),
        normHeadings: normalizeSearchText(sectionHeadings),
        normBody: normalizeSearchText(sectionBodies),
        plainBodyPreview: sectionBodies.replace(/\s+/g, ' ').trim()
      };
    });
  }

  #buildFaqIndex() {
    return this.#faqs.map((faq) => ({
      faq,
      normQuestion: normalizeSearchText(faq.question),
      normAnswer: normalizeSearchText(faq.answer),
      normBadge: normalizeSearchText(faq.badge)
    }));
  }

  getCategories() {
    return [...this.#categories];
  }

  getArticlesByCategory(categorySlug) {
    if (typeof categorySlug !== 'string') return [];
    return this.#articles.filter((a) => a.categorySlug === categorySlug);
  }

  getDefaultArticle() {
    return this.#articles[0] || null;
  }

  getArticleBySlugs(categorySlug, articleSlug) {
    if (typeof categorySlug !== 'string' || typeof articleSlug !== 'string') return null;
    return (
      this.#articles.find(
        (a) => a.categorySlug === categorySlug.trim() && a.slug === articleSlug.trim()
      ) || null
    );
  }

  getFaqs({ categorySlug = 'all' } = {}) {
    if (!categorySlug || categorySlug === 'all') {
      return [...this.#faqs];
    }
    return this.#faqs.filter((f) => f.categorySlug === categorySlug);
  }

  getFaqsByIds(faqIds = []) {
    if (!Array.isArray(faqIds) || faqIds.length === 0) return [];
    const idSet = new Set(faqIds);
    return this.#faqs.filter((f) => idSet.has(f.id));
  }

  /**
   * Gera o sumário lateral ("Nesta Página" / On This Page) para navegação por âncora.
   * @param {Object} article
   * @returns {Array<{id: string, heading: string}>}
   */
  buildTableOfContents(article) {
    if (!article || !Array.isArray(article.sections)) return [];
    return article.sections.map((section) => ({
      id: section.id,
      heading: section.heading
    }));
  }

  /**
   * Retorna os artigos imediatamente anterior e seguinte na trilha completa Diátaxis.
   */
  getAdjacentArticles(categorySlug, articleSlug) {
    const idx = this.#articles.findIndex(
      (a) => a.categorySlug === categorySlug && a.slug === articleSlug
    );
    if (idx === -1) {
      return { previous: null, next: null };
    }
    return {
      previous: idx > 0 ? this.#articles[idx - 1] : null,
      next: idx < this.#articles.length - 1 ? this.#articles[idx - 1 + 2] : null
    };
  }

  /**
   * Resolve uma chave de ajuda contextual do Wizard (helpContent.jsx) para sua URL canônica na documentação.
   * @param {string} helpKey
   * @returns {null | {categorySlug: string, articleSlug: string, sectionAnchor: string, label: string, url: string}}
   */
  resolveWizardHelpLink(helpKey) {
    if (typeof helpKey !== 'string' || !Object.prototype.hasOwnProperty.call(this.#wizardMap, helpKey)) {
      return null;
    }
    const entry = this.#wizardMap[helpKey];
    if (!entry) return null;
    const anchorSuffix = entry.sectionAnchor ? `#${entry.sectionAnchor}` : '';
    return {
      ...entry,
      url: `/professor/documentacao/${entry.categorySlug}/${entry.articleSlug}${anchorSuffix}`
    };
  }

  /**
   * Executa busca determinística ponderada em artigos e FAQs em tempo linear O(N * T),
   * imune a Catastrophic Backtracking (ReDoS).
   * @param {unknown} rawQuery
   * @param {Object} options
   * @returns {{query: string, articles: Array, faqs: Array, totalHits: number}}
   */
  search(rawQuery, { limit = 10, categorySlug = 'all' } = {}) {
    if (typeof rawQuery !== 'string') {
      return { query: '', articles: [], faqs: [], totalHits: 0 };
    }

    const boundedQuery = rawQuery.slice(0, MAX_QUERY_LENGTH);
    const normQuery = normalizeSearchText(boundedQuery);
    const tokens = tokenizeQuery(normQuery);

    if (!normQuery || tokens.length === 0) {
      return { query: normQuery, articles: [], faqs: [], totalHits: 0 };
    }

    const scoredArticles = [];
    for (const entry of this.#articleIndex) {
      if (categorySlug !== 'all' && entry.article.categorySlug !== categorySlug) {
        continue;
      }

      let score = 0;
      let matchedTokens = 0;

      if (entry.normTitle.includes(normQuery)) score += 25;
      if (entry.normKeywords.includes(normQuery)) score += 20;

      for (const token of tokens) {
        const stem = token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token;
        let tokenMatched = false;

        if (entry.normTitle.includes(stem)) {
          score += 10;
          tokenMatched = true;
        }
        if (entry.normKeywords.includes(stem)) {
          score += 8;
          tokenMatched = true;
        }
        if (entry.normHeadings.includes(stem)) {
          score += 6;
          tokenMatched = true;
        }
        if (entry.normSubtitle.includes(stem)) {
          score += 5;
          tokenMatched = true;
        }
        if (entry.normBody.includes(stem)) {
          score += 2;
          tokenMatched = true;
        }

        if (tokenMatched) matchedTokens += 1;
      }

      if (score > 0 && matchedTokens >= Math.min(1, tokens.length)) {
        // Bônus quando casa todos os tokens pesquisados
        if (matchedTokens === tokens.length) {
          score += 12;
        }
        scoredArticles.push({
          ...entry.article,
          score,
          snippet: this.#extractSafeSnippet(entry.plainBodyPreview, entry.article.subtitle)
        });
      }
    }

    const scoredFaqs = [];
    for (const entry of this.#faqIndex) {
      if (categorySlug !== 'all' && entry.faq.categorySlug !== categorySlug) {
        continue;
      }

      let score = 0;
      let matchedTokens = 0;

      if (entry.normQuestion.includes(normQuery)) score += 22;

      for (const token of tokens) {
        const stem = token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token;
        let tokenMatched = false;

        if (entry.normQuestion.includes(stem)) {
          score += 9;
          tokenMatched = true;
        }
        if (entry.normBadge.includes(stem)) {
          score += 6;
          tokenMatched = true;
        }
        if (entry.normAnswer.includes(stem)) {
          score += 3;
          tokenMatched = true;
        }

        if (tokenMatched) matchedTokens += 1;
      }

      if (score > 0 && matchedTokens >= Math.min(1, tokens.length)) {
        if (matchedTokens === tokens.length) {
          score += 10;
        }
        scoredFaqs.push({
          ...entry.faq,
          score
        });
      }
    }

    scoredArticles.sort((a, b) => b.score - a.score);
    scoredFaqs.sort((a, b) => b.score - a.score);

    const topArticles = scoredArticles.slice(0, limit);
    const topFaqs = scoredFaqs.slice(0, limit);

    return {
      query: normQuery,
      articles: topArticles,
      faqs: topFaqs,
      totalHits: topArticles.length + topFaqs.length
    };
  }

  #extractSafeSnippet(plainBody, fallbackSubtitle) {
    if (!plainBody) return fallbackSubtitle || '';
    return plainBody.length > 165 ? `${plainBody.slice(0, 162)}...` : plainBody;
  }

  /**
   * Audita a integridade referencial de todo o catálogo Docs-as-Code (Quality Gate).
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateCatalogIntegrity() {
    const errors = [];
    const categorySlugs = new Set();
    const articleIds = new Set();
    const articleCompositeSlugs = new Set();
    const faqIds = new Set();

    for (const cat of this.#categories) {
      if (!cat.slug || !cat.title) {
        errors.push(`Categoria inválida sem slug ou title: ${JSON.stringify(cat)}`);
      }
      if (categorySlugs.has(cat.slug)) {
        errors.push(`Categoria duplicada: ${cat.slug}`);
      }
      categorySlugs.add(cat.slug);
    }

    for (const faq of this.#faqs) {
      if (!faq.id || !faq.question || !faq.answer) {
        errors.push(`FAQ incompleta: ${faq.id || 'sem-id'}`);
      }
      if (faqIds.has(faq.id)) {
        errors.push(`FAQ com ID duplicado: ${faq.id}`);
      }
      if (!categorySlugs.has(faq.categorySlug)) {
        errors.push(`FAQ "${faq.id}" referencia categoria inexistente "${faq.categorySlug}"`);
      }
      faqIds.add(faq.id);
    }

    for (const art of this.#articles) {
      const composite = `${art.categorySlug}/${art.slug}`;
      if (articleIds.has(art.id)) {
        errors.push(`Artigo com ID duplicado: ${art.id}`);
      }
      if (articleCompositeSlugs.has(composite)) {
        errors.push(`Artigo com rota duplicada: ${composite}`);
      }
      if (!categorySlugs.has(art.categorySlug)) {
        errors.push(`Artigo "${art.id}" referencia categoria inexistente "${art.categorySlug}"`);
      }
      if (!Array.isArray(art.sections) || art.sections.length === 0) {
        errors.push(`Artigo "${art.id}" não possui seções de conteúdo`);
      }
      for (const relFaqId of art.relatedFaqIds || []) {
        if (!faqIds.has(relFaqId)) {
          errors.push(`Artigo "${art.id}" referencia FAQ inexistente "${relFaqId}"`);
        }
      }
      articleIds.add(art.id);
      articleCompositeSlugs.add(composite);
    }

    for (const faq of this.#faqs) {
      if (faq.relatedArticleSlug && !articleCompositeSlugs.has(faq.relatedArticleSlug)) {
        errors.push(`FAQ "${faq.id}" aponta para artigo inexistente "${faq.relatedArticleSlug}"`);
      }
    }

    for (const [helpKey, mapping] of Object.entries(this.#wizardMap)) {
      const targetComposite = `${mapping.categorySlug}/${mapping.articleSlug}`;
      if (!articleCompositeSlugs.has(targetComposite)) {
        errors.push(`Chave Wizard "${helpKey}" aponta para artigo inexistente "${targetComposite}"`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const defaultTeacherDocsEngine = new TeacherDocsSearchEngine();
