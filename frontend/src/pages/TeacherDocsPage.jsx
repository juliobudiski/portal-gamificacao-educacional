import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  HelpCircle,
  Search,
  Rocket,
  Compass,
  Brain,
  Sparkles,
  Trophy,
  BarChart2,
  Clock,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  ExternalLink,
  Menu,
  X,
  List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useAnalytics from '../hooks/useAnalytics';
import CodeBlockViewer from '../components/common/CodeBlockViewer';
import DocsSearchModal from '../components/docs/DocsSearchModal';
import { teacherDocsEngine } from '../domain/teacherDocs';

const CATEGORY_ICONS = {
  Rocket,
  Compass,
  Brain,
  Sparkles,
  Trophy,
  BarChart2
};

const CALLOUT_STYLES = {
  tip: {
    icon: Lightbulb,
    border: 'border-accent-teal',
    bg: 'bg-accent-teal/10',
    badgeColor: 'text-accent-teal'
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-accent-yellow',
    bg: 'bg-accent-yellow/10',
    badgeColor: 'text-accent-yellow'
  },
  important: {
    icon: Sparkles,
    border: 'border-accent-purple',
    bg: 'bg-accent-purple/10',
    badgeColor: 'text-accent-purple'
  },
  note: {
    icon: Info,
    border: 'border-cyan-500',
    bg: 'bg-cyan-500/10',
    badgeColor: 'text-cyan-500'
  }
};

/**
 * @component TeacherDocsPage
 * @description
 * Central de Documentação Docente & FAQ Interativo inspirada no Overleaf Learn (US-26 / RF-16).
 * Arquitetura em 3 colunas responsivas:
 * 1. Árvore Taxonômica Diátaxis (Esquerda / Mobile Drawer);
 * 2. Leitor Estruturado de Artigos ou Central de FAQ Filtrável (Centro);
 * 3. Sumário Âncora "Nesta Página" + Ações Contextuais + FAQs Relacionadas (Direita).
 */
export default function TeacherDocsPage() {
  const { categorySlug, articleSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logEvent, startTimer, stopTimer } = useAnalytics('teacher_docs', user?.token);

  const activeView = searchParams.get('tab') === 'faq' ? 'faq' : 'docs';
  const highlightedFaqId = searchParams.get('faqId') || null;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [faqInlineQuery, setFaqInlineQuery] = useState('');
  const [expandedFaqIds, setExpandedFaqIds] = useState(() =>
    highlightedFaqId ? { [highlightedFaqId]: true } : {}
  );
  const [helpfulVotes, setHelpfulVotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`gamifica_docs_votes_${user?.id || 'anon'}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const categories = useMemo(() => teacherDocsEngine.getCategories(), []);
  const defaultArticle = useMemo(() => teacherDocsEngine.getDefaultArticle(), []);

  const resolvedState = useMemo(() => {
    if (!categorySlug && !articleSlug) {
      return { article: defaultArticle, isNotFound: false };
    }
    const found = teacherDocsEngine.getArticleBySlugs(categorySlug, articleSlug);
    if (!found) {
      return { article: defaultArticle, isNotFound: true };
    }
    return { article: found, isNotFound: false };
  }, [categorySlug, articleSlug, defaultArticle]);

  const currentArticle = resolvedState.article;

  const tableOfContents = useMemo(
    () => teacherDocsEngine.buildTableOfContents(currentArticle),
    [currentArticle]
  );

  const adjacentArticles = useMemo(
    () =>
      currentArticle
        ? teacherDocsEngine.getAdjacentArticles(currentArticle.categorySlug, currentArticle.slug)
        : { previous: null, next: null },
    [currentArticle]
  );

  const relatedFaqs = useMemo(
    () => teacherDocsEngine.getFaqsByIds(currentArticle?.relatedFaqIds || []),
    [currentArticle]
  );

  const filteredFaqList = useMemo(() => {
    if (faqInlineQuery.trim()) {
      return teacherDocsEngine.search(faqInlineQuery, {
        limit: 30,
        categorySlug: faqCategoryFilter
      }).faqs;
    }
    return teacherDocsEngine.getFaqs({ categorySlug: faqCategoryFilter });
  }, [faqInlineQuery, faqCategoryFilter]);

  const handleTelemetry = useCallback(
    (action, details = {}) => {
      logEvent(action, details, 'teacher_docs');
    },
    [logEvent]
  );

  // Rastreia tempo de leitura por artigo e rola suavemente até âncoras (#section)
  useEffect(() => {
    if (activeView === 'docs' && currentArticle) {
      startTimer(`teacher_docs:${currentArticle.slug}`);
      handleTelemetry('article_view', {
        category_slug: currentArticle.categorySlug,
        article_slug: currentArticle.slug
      });
    }
    return () => {
      if (currentArticle) {
        stopTimer(`teacher_docs:${currentArticle.slug}`);
      }
    };
  }, [activeView, currentArticle, startTimer, stopTimer, handleTelemetry]);

  useEffect(() => {
    if (!location.hash) return;
    const anchorId = location.hash.replace('#', '');
    const timer = setTimeout(() => {
      const targetEl = document.getElementById(anchorId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.hash, currentArticle]);

  useEffect(() => {
    if (highlightedFaqId) {
      setExpandedFaqIds((prev) => ({ ...prev, [highlightedFaqId]: true }));
    }
  }, [highlightedFaqId]);

  // Atalho de teclado Ctrl+K / Cmd+K na própria página
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleFaqAccordion = (faqId) => {
    setExpandedFaqIds((prev) => {
      const nextOpen = !prev[faqId];
      if (nextOpen) {
        handleTelemetry('faq_item_expanded', { faq_id: faqId });
      }
      return { ...prev, [faqId]: nextOpen };
    });
  };

  const handleVoteHelpful = (isHelpful) => {
    if (!currentArticle) return;
    const updated = { ...helpfulVotes, [currentArticle.id]: isHelpful ? 'yes' : 'no' };
    setHelpfulVotes(updated);
    try {
      localStorage.setItem(`gamifica_docs_votes_${user?.id || 'anon'}`, JSON.stringify(updated));
    } catch {
      // Ignora erro de quota de localStorage silenciosamente
    }
    handleTelemetry('article_helpful_vote', {
      category_slug: currentArticle.categorySlug,
      article_slug: currentArticle.slug,
      helpful: isHelpful
    });
  };

  const switchViewTab = (tabName) => {
    if (tabName === 'faq') {
      setSearchParams({ tab: 'faq' });
    } else {
      setSearchParams({});
    }
  };

  const currentCategoryObj = categories.find((c) => c.slug === currentArticle?.categorySlug);
  const currentVote = currentArticle ? helpfulVotes[currentArticle.id] : null;

  return (
    <div className="min-h-screen text-primary-text">
      <DocsSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onLogTelemetry={handleTelemetry}
      />

      {/* TOP BAR ESTILO OVERLEAF LEARN */}
      <header className="mb-6 pb-6 border-b border-border-color">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/15 border border-accent-teal/30 text-accent-teal text-xs font-extrabold uppercase tracking-wider">
              <BookOpen size={14} />
              Documentação Oficial do Professor • GamificaEdu Learn
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-primary-text">
              Central de Conhecimento &amp; FAQ Docente
            </h1>
            <p className="text-sm text-secondary-text max-w-2xl">
              Guias passo a passo, fundamentação científica (Hexad, Motor MDC, SWEBOK) e respostas rápidas para planejar e avaliar trilhas gamificadas com segurança.
            </p>
          </div>

          {/* Ações Rápidas Superiores: Barra Ctrl+K + Alternador Guia/FAQ */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl bg-primary-bg border border-border-color hover:border-accent-teal/60 text-secondary-text hover:text-primary-text transition-all shadow-inner min-w-[250px]"
              aria-label="Abrir busca rápida na documentação"
            >
              <span className="flex items-center gap-2 text-xs sm:text-sm">
                <Search size={16} className="text-accent-teal" />
                Buscar guia ou dúvida...
              </span>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-secondary-bg border border-border-color text-secondary-text">
                Ctrl K
              </kbd>
            </button>

            <div className="inline-flex p-1 rounded-xl bg-primary-bg border border-border-color">
              <button
                type="button"
                onClick={() => switchViewTab('docs')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeView === 'docs'
                    ? 'bg-accent-teal text-gray-950 shadow-sm'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                <BookOpen size={14} />
                Manuais &amp; Guias
              </button>
              <button
                type="button"
                onClick={() => switchViewTab('faq')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all ${
                  activeView === 'faq'
                    ? 'bg-accent-purple text-white shadow-sm'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                <HelpCircle size={14} />
                FAQ Completo ({teacherDocsEngine.getFaqs().length})
              </button>
            </div>
          </div>
        </div>

        {/* Botão Mobile para abrir Árvore de Tópicos */}
        {activeView === 'docs' && (
          <div className="mt-4 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-primary-bg border border-border-color text-sm font-bold text-primary-text"
            >
              <span className="flex items-center gap-2">
                {isMobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                Índice de Módulos da Documentação
              </span>
              <ChevronDown
                size={16}
                className={`transition-transform ${isMobileSidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        )}
      </header>

      {/* AVISO DE FALLBACK SEGURO CASO SLUG NÃO EXISTA (Cenário BDD de Exceção) */}
      {resolvedState.isNotFound && activeView === 'docs' && (
        <div className="mb-6 p-4 rounded-2xl bg-accent-yellow/10 border border-accent-yellow/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-accent-yellow shrink-0 mt-0.5" size={20} />
            <div>
              <h2 className="text-sm font-bold text-primary-text">
                O endereço solicitado foi movido ou não existe.
              </h2>
              <p className="text-xs text-secondary-text">
                Carregamos automaticamente o guia inicial para você continuar sua consulta sem interrupções.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-accent-yellow text-gray-950 text-xs font-extrabold shrink-0"
          >
            Pesquisar Tópico
          </button>
        </div>
      )}

      {/* =====================================================================
          VISÃO 1: LEITOR EM 3 COLUNAS ESTILO OVERLEAF LEARN (MANUAIS & GUIAS)
         ===================================================================== */}
      {activeView === 'docs' && currentArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUNA ESQUERDA (3 cols): Árvore Taxonômica Diátaxis */}
          <aside
            aria-label="Navegação de capítulos da documentação"
            className={`lg:col-span-3 bg-primary-bg/70 border border-border-color rounded-2xl p-4 lg:sticky lg:top-6 space-y-5 ${
              isMobileSidebarOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            {categories.map((cat) => {
              const CatIcon = CATEGORY_ICONS[cat.iconName] || BookOpen;
              const catArticles = teacherDocsEngine.getArticlesByCategory(cat.slug);
              const isCurrentCat = cat.slug === currentArticle.categorySlug;

              return (
                <div key={cat.slug} className="space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span
                      className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider ${
                        isCurrentCat ? 'text-accent-teal' : 'text-secondary-text'
                      }`}
                    >
                      <CatIcon size={15} />
                      {cat.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary-bg border border-border-color text-secondary-text font-semibold">
                      {cat.badge}
                    </span>
                  </div>

                  <ul className="space-y-1 border-l-2 border-border-color ml-3 pl-2.5">
                    {catArticles.map((art) => {
                      const isActive =
                        art.categorySlug === currentArticle.categorySlug &&
                        art.slug === currentArticle.slug;
                      return (
                        <li key={art.id}>
                          <Link
                            to={`/professor/documentacao/${art.categorySlug}/${art.slug}`}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`block px-3 py-2 rounded-xl text-xs leading-snug transition-all ${
                              isActive
                                ? 'bg-accent-teal/15 text-accent-teal font-extrabold border border-accent-teal/30 shadow-sm'
                                : 'text-secondary-text hover:text-primary-text hover:bg-secondary-bg/70 font-medium'
                            }`}
                          >
                            {art.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </aside>

          {/* COLUNA CENTRAL (6 cols): Artigo Estruturado Rico */}
          <article className="lg:col-span-6 bg-primary-bg/60 border border-border-color rounded-3xl p-5 sm:p-8 shadow-lg space-y-8">
            {/* Breadcrumb + Metadados */}
            <div className="space-y-3 border-b border-border-color pb-6">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-secondary-text">
                <span>Documentação</span>
                <ChevronRight size={13} />
                <span className="text-accent-teal font-semibold">
                  {currentCategoryObj?.title}
                </span>
                <ChevronRight size={13} />
                <span className="font-bold text-primary-text">{currentArticle.title}</span>
              </nav>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-text leading-tight">
                {currentArticle.title}
              </h2>
              <p className="text-sm sm:text-base text-secondary-text leading-relaxed">
                {currentArticle.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-secondary-text">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-bg border border-border-color font-semibold">
                  <Clock size={13} className="text-accent-yellow" />
                  {currentArticle.readingTimeMinutes} min de leitura
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-purple/10 border border-accent-purple/30 text-accent-purple font-bold">
                  {currentArticle.diataxis}
                </span>
                <span>Revisão {currentArticle.lastUpdated}</span>
              </div>
            </div>

            {/* Seções Estruturadas do Capítulo */}
            <div className="space-y-8">
              {currentArticle.sections.map((sec) => {
                const calloutStyle = sec.callout
                  ? CALLOUT_STYLES[sec.callout.type] || CALLOUT_STYLES.note
                  : null;
                const CalloutIcon = calloutStyle?.icon;

                return (
                  <section key={sec.id} id={sec.id} className="scroll-mt-24 space-y-4">
                    <h3 className="text-lg sm:text-xl font-extrabold text-primary-text border-l-4 border-accent-teal pl-3">
                      {sec.heading}
                    </h3>

                    {(sec.paragraphs || []).map((p, idx) => (
                      <p
                        key={idx}
                        className="text-sm sm:text-base text-primary-text/90 leading-relaxed"
                      >
                        {p}
                      </p>
                    ))}

                    {/* Passo a Passo Numerado */}
                    {Array.isArray(sec.steps) && sec.steps.length > 0 && (
                      <ol className="space-y-3 pt-1">
                        {sec.steps.map((step, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-secondary-bg/80 border border-border-color"
                          >
                            <span className="w-7 h-7 rounded-xl bg-accent-teal text-gray-950 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-primary-text">
                                {step.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-secondary-text leading-relaxed mt-0.5">
                                {step.detail}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Tabela de Referência */}
                    {sec.table && (
                      <div className="overflow-x-auto rounded-2xl border border-border-color shadow-sm">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-secondary-bg border-b border-border-color">
                              {sec.table.headers.map((header, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="px-4 py-3 font-extrabold text-primary-text"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-color">
                            {sec.table.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-secondary-bg/40 transition-colors">
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className={`px-4 py-3 align-top leading-relaxed ${
                                      cIdx === 0
                                        ? 'font-bold text-accent-teal whitespace-nowrap'
                                        : 'text-secondary-text'
                                    }`}
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Bloco de Código / Markdown */}
                    {sec.codeBlock && (
                      <CodeBlockViewer
                        code={sec.codeBlock.code}
                        language={sec.codeBlock.language}
                      />
                    )}

                    {/* Callout Pedagógico */}
                    {sec.callout && calloutStyle && CalloutIcon && (
                      <div
                        className={`p-4 rounded-2xl border-l-4 ${calloutStyle.border} ${calloutStyle.bg} space-y-1`}
                      >
                        <div
                          className={`flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide ${calloutStyle.badgeColor}`}
                        >
                          <CalloutIcon size={15} />
                          {sec.callout.title}
                        </div>
                        <p className="text-xs sm:text-sm text-primary-text leading-relaxed">
                          {sec.callout.text}
                        </p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* FAQs Contextuais deste Artigo */}
            {relatedFaqs.length > 0 && (
              <div className="pt-6 border-t border-border-color space-y-3">
                <h3 className="text-base font-extrabold text-primary-text flex items-center gap-2">
                  <HelpCircle size={18} className="text-accent-purple" />
                  Dúvidas Frequentes sobre este Tópico
                </h3>
                <div className="space-y-2">
                  {relatedFaqs.map((faq) => {
                    const isExpanded = Boolean(expandedFaqIds[faq.id]);
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl bg-secondary-bg/80 border border-border-color overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaqAccordion(faq.id)}
                          className="w-full p-3.5 text-left flex items-start justify-between gap-3 hover:bg-primary-bg/40 transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-bold text-primary-text">
                            {faq.question}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`shrink-0 mt-0.5 text-secondary-text transition-transform ${
                              isExpanded ? 'rotate-180 text-accent-teal' : ''
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-border-color/50 text-xs sm:text-sm text-secondary-text leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Micro-Feedback Científico (EventLog) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-secondary-bg border border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-primary-text">
                  Este guia esclareceu sua dúvida?
                </h4>
                <p className="text-xs text-secondary-text">
                  Sua avaliação anônima ajuda a aprimorar continuamente a documentação docente.
                </p>
              </div>
              {currentVote ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-accent-teal/15 border border-accent-teal/30 text-accent-teal text-xs font-extrabold">
                  <CheckCircle2 size={15} />
                  Obrigado pelo seu feedback!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-bg hover:bg-accent-teal/15 border border-border-color hover:border-accent-teal/50 text-xs font-bold text-primary-text transition-all"
                  >
                    <ThumbsUp size={14} className="text-accent-teal" />
                    Sim, ajudou
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoteHelpful(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-bg hover:bg-accent-yellow/15 border border-border-color hover:border-accent-yellow/50 text-xs font-bold text-primary-text transition-all"
                  >
                    <ThumbsDown size={14} className="text-accent-yellow" />
                    Ainda tenho dúvida
                  </button>
                </div>
              )}
            </div>

            {/* Navegação Paginada Anterior / Próximo */}
            <nav
              aria-label="Paginação entre capítulos"
              className="pt-4 border-t border-border-color grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {adjacentArticles.previous ? (
                <Link
                  to={`/professor/documentacao/${adjacentArticles.previous.categorySlug}/${adjacentArticles.previous.slug}`}
                  className="p-4 rounded-2xl bg-secondary-bg/70 hover:bg-secondary-bg border border-border-color hover:border-accent-teal/40 transition-all group"
                >
                  <span className="text-[11px] font-bold uppercase text-secondary-text flex items-center gap-1">
                    <ArrowLeft size={12} /> Capítulo Anterior
                  </span>
                  <span className="text-sm font-extrabold text-primary-text group-hover:text-accent-teal block mt-1">
                    {adjacentArticles.previous.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {adjacentArticles.next && (
                <Link
                  to={`/professor/documentacao/${adjacentArticles.next.categorySlug}/${adjacentArticles.next.slug}`}
                  className="p-4 rounded-2xl bg-secondary-bg/70 hover:bg-secondary-bg border border-border-color hover:border-accent-teal/40 transition-all text-left sm:text-right group"
                >
                  <span className="text-[11px] font-bold uppercase text-secondary-text inline-flex items-center gap-1">
                    Próximo Capítulo <ArrowRight size={12} />
                  </span>
                  <span className="text-sm font-extrabold text-primary-text group-hover:text-accent-teal block mt-1">
                    {adjacentArticles.next.title}
                  </span>
                </Link>
              )}
            </nav>
          </article>

          {/* COLUNA DIREITA (3 cols): Sumário "Nesta Página" + Atalhos Práticos */}
          <aside
            aria-label="Sumário da página atual e atalhos"
            className="lg:col-span-3 space-y-4 lg:sticky lg:top-6"
          >
            {/* On This Page TOC */}
            <div className="bg-primary-bg/70 border border-border-color rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-secondary-text flex items-center gap-1.5">
                <List size={14} className="text-accent-teal" />
                Nesta Página
              </h3>
              <ul className="space-y-2 border-l border-border-color pl-3">
                {tableOfContents.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-xs text-secondary-text hover:text-accent-teal font-medium block leading-snug transition-colors"
                    >
                      {item.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações Diretas na Plataforma */}
            {Array.isArray(currentArticle.actionLinks) && currentArticle.actionLinks.length > 0 && (
              <div className="bg-gradient-to-br from-accent-teal/10 to-accent-purple/10 border border-accent-teal/30 rounded-2xl p-4 space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary-text">
                  Praticar Agora no Portal
                </h3>
                <div className="space-y-2">
                  {currentArticle.actionLinks.map((act, idx) => (
                    <Link
                      key={idx}
                      to={act.to}
                      className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all ${
                        act.variant === 'primary'
                          ? 'bg-accent-teal text-gray-950 hover:bg-accent-teal/90 shadow-sm'
                          : 'bg-secondary-bg text-primary-text border border-border-color hover:border-accent-teal/40'
                      }`}
                    >
                      <span>{act.label}</span>
                      <ExternalLink size={13} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Canal de Suporte Acadêmico */}
            <div className="bg-primary-bg/70 border border-border-color rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-primary-text">
                Não encontrou seu caso de uso?
              </h4>
              <p className="text-[11px] text-secondary-text leading-relaxed">
                Consulte o índice completo de perguntas frequentes ou envie sua questão diretamente à equipe.
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => switchViewTab('faq')}
                  className="text-left text-xs font-bold text-accent-purple hover:underline"
                >
                  → Abrir todas as {teacherDocsEngine.getFaqs().length} FAQs
                </button>
                <Link
                  to="/contact?subject=Suporte%20Docente%20GamificaEdu"
                  className="text-xs font-bold text-accent-teal hover:underline"
                >
                  → Falar com o Suporte Técnico
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* =====================================================================
          VISÃO 2: CENTRAL CONSOLIDADA DE PERGUNTAS FREQUENTES (FAQ DOCENTE)
         ===================================================================== */}
      {activeView === 'faq' && (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Barra de Filtro & Busca Instantânea do FAQ */}
          <div className="bg-primary-bg/70 border border-border-color rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
            <div className="relative">
              <Search
                className="absolute left-4 top-3.5 text-accent-teal"
                size={18}
              />
              <input
                type="text"
                maxLength={120}
                value={faqInlineQuery}
                onChange={(e) => setFaqInlineQuery(e.target.value)}
                placeholder="Filtrar perguntas frequentes (ex.: rascunho IA, prazo vencido, XP vs moedas, código turma, LGPD)..."
                className="w-full pl-11 pr-20 py-3 rounded-2xl bg-secondary-bg border border-border-color focus:border-accent-teal focus:outline-none text-sm text-primary-text placeholder-secondary-text"
              />
              {faqInlineQuery && (
                <button
                  type="button"
                  onClick={() => setFaqInlineQuery('')}
                  className="absolute right-3.5 top-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-bg text-secondary-text hover:text-primary-text"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFaqCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  faqCategoryFilter === 'all'
                    ? 'bg-accent-teal text-gray-950 border-accent-teal'
                    : 'bg-secondary-bg text-secondary-text border-border-color hover:text-primary-text'
                }`}
              >
                Todas as Categorias ({teacherDocsEngine.getFaqs().length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setFaqCategoryFilter(cat.slug)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    faqCategoryFilter === cat.slug
                      ? 'bg-accent-teal text-gray-950 border-accent-teal'
                      : 'bg-secondary-bg text-secondary-text border-border-color hover:text-primary-text'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Sanfona de Perguntas e Respostas */}
          <div className="space-y-3">
            {filteredFaqList.length > 0 ? (
              filteredFaqList.map((faq) => {
                const isOpen = Boolean(expandedFaqIds[faq.id]);
                const isHighlighted = highlightedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    id={faq.id}
                    className={`rounded-2xl bg-primary-bg/70 border transition-all overflow-hidden ${
                      isHighlighted
                        ? 'border-accent-teal ring-2 ring-accent-teal/30'
                        : 'border-border-color hover:border-accent-teal/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaqAccordion(faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 hover:bg-secondary-bg/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="self-start text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/30 shrink-0">
                          {faq.badge}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-primary-text leading-snug">
                          {faq.question}
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 mt-1 text-secondary-text transition-transform ${
                          isOpen ? 'rotate-180 text-accent-teal' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 border-t border-border-color/60 bg-secondary-bg/30 space-y-3">
                        <p className="text-sm text-secondary-text leading-relaxed">
                          {faq.answer}
                        </p>
                        {faq.relatedArticleSlug && (
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/professor/documentacao/${faq.relatedArticleSlug}`)
                              }
                              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-accent-teal hover:underline"
                            >
                              <BookOpen size={13} />
                              Ler capítulo completo no Manual Docente →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-10 rounded-3xl bg-primary-bg/60 border border-border-color text-center space-y-3">
                <p className="text-base font-bold text-primary-text">
                  Nenhuma pergunta encontrada para &ldquo;{faqInlineQuery}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFaqInlineQuery('');
                    setFaqCategoryFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-accent-teal text-gray-950 text-xs font-extrabold"
                >
                  Restaurar Todas as Perguntas
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
