import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Sparkles,
  CornerDownLeft
} from 'lucide-react';
import {
  teacherDocsEngine,
  sanitizeSearchQueryForTelemetry
} from '../../domain/teacherDocs';

/**
 * @component DocsSearchModal
 * @description
 * Command Palette de busca instantânea (< 16ms) inspirada no Overleaf Learn / Algolia DocSearch (Ctrl+K).
 * Permite pesquisar simultaneamente guias estruturados Diátaxis e perguntas frequentes (FAQ)
 * com suporte completo a navegação por teclado (Setas, Enter, Escape) e telemetria sanitizada LGPD.
 *
 * Rastreabilidade: US-26 | RF-16 | RNF-09 | RNF-11
 */
export default function DocsSearchModal({ isOpen, onClose, onLogTelemetry }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        query: '',
        articles: teacherDocsEngine.getCategories().map((cat) => {
          const firstArticle = teacherDocsEngine.getArticlesByCategory(cat.slug)[0];
          return firstArticle;
        }).filter(Boolean),
        faqs: teacherDocsEngine.getFaqs().slice(0, 4),
        isSuggestions: true
      };
    }
    return {
      ...teacherDocsEngine.search(query, { limit: 6 }),
      isSuggestions: false
    };
  }, [query]);

  const flatItems = useMemo(() => {
    const articleItems = searchResults.articles.map((art) => ({
      type: 'article',
      key: `art-${art.id}`,
      title: art.title,
      subtitle: art.snippet || art.subtitle,
      badge: art.diataxis,
      to: `/professor/documentacao/${art.categorySlug}/${art.slug}`
    }));

    const faqItems = searchResults.faqs.map((faq) => ({
      type: 'faq',
      key: `faq-${faq.id}`,
      title: faq.question,
      subtitle: faq.answer,
      badge: `FAQ • ${faq.badge}`,
      to: `/professor/documentacao?tab=faq&faqId=${encodeURIComponent(faq.id)}`
    }));

    return [...articleItems, ...faqItems];
  }, [searchResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Debounce de telemetria para registrar termos pesquisados sem flood (STRIDE Anti-DoS + LGPD)
  useEffect(() => {
    if (!isOpen || !query.trim() || query.trim().length < 3 || !onLogTelemetry) {
      return;
    }
    const timer = setTimeout(() => {
      const safeQuery = sanitizeSearchQueryForTelemetry(query);
      if (safeQuery) {
        onLogTelemetry('docs_search_executed', {
          query: safeQuery,
          hits: searchResults.articles.length + searchResults.faqs.length
        });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query, isOpen, onLogTelemetry, searchResults.articles.length, searchResults.faqs.length]);

  const handleSelectItem = (item) => {
    if (!item) return;
    if (onLogTelemetry) {
      onLogTelemetry('docs_search_result_selected', {
        result_type: item.type,
        target: item.to
      });
    }
    setQuery('');
    onClose();
    navigate(item.to);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectItem(flatItems[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="docs-command-search-title"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl bg-secondary-bg text-primary-text rounded-2xl shadow-2xl border border-accent-teal/40 overflow-hidden flex flex-col max-h-[82vh] animate-fade-in"
      >
        {/* Barra Superior de Busca */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-color bg-primary-bg/60">
          <Search className="text-accent-teal shrink-0" size={20} />
          <label htmlFor="docs-command-input" id="docs-command-search-title" className="sr-only">
            Pesquisar na Documentação e FAQ do Professor
          </label>
          <input
            id="docs-command-input"
            ref={inputRef}
            type="text"
            maxLength={120}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar guias, Hexad, MDC, IA Gemini, XP, prazos ou dúvidas..."
            className="flex-1 bg-transparent text-sm sm:text-base text-primary-text placeholder-secondary-text focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-secondary-text hover:text-primary-text px-2 py-1 rounded-lg hover:bg-primary-bg"
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors"
            aria-label="Fechar busca"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-text flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent-yellow" />
              {searchResults.isSuggestions
                ? 'Tópicos Essenciais Recomendados'
                : `${flatItems.length} resultado(s) instantâneo(s)`}
            </span>
            <span className="text-[11px] text-secondary-text hidden sm:inline">
              Busca sem acentos ativa
            </span>
          </div>

          {flatItems.length > 0 ? (
            <ul className="space-y-1.5" role="listbox">
              {flatItems.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const Icon = item.type === 'article' ? BookOpen : HelpCircle;
                return (
                  <li key={item.key} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-accent-teal/15 border-accent-teal/50 shadow-sm'
                          : 'bg-primary-bg/50 border-border-color/60 hover:border-accent-teal/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            item.type === 'article'
                              ? 'bg-accent-teal/15 text-accent-teal'
                              : 'bg-accent-purple/15 text-accent-purple'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-secondary-bg border border-border-color text-secondary-text">
                              {item.badge}
                            </span>
                            <span className="text-sm font-bold text-primary-text truncate">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={16}
                        className={`shrink-0 mt-2 transition-transform ${
                          isSelected ? 'text-accent-teal translate-x-0.5' : 'text-secondary-text'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-10 px-4 text-center space-y-3">
              <p className="text-sm font-semibold text-primary-text">
                Nenhum guia ou FAQ encontrado para &ldquo;{query}&rdquo;.
              </p>
              <p className="text-xs text-secondary-text max-w-md mx-auto">
                Tente palavras-chave mais amplas como <strong>wizard</strong>, <strong>hexad</strong>, <strong>moedas</strong>, <strong>prazo</strong> ou <strong>gemini</strong>, ou fale com nossa equipe.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-accent-teal text-gray-950 hover:bg-accent-teal/90"
                >
                  Ver Guias Principais
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/contact?subject=D%C3%BAvida%20Docente%20na%20Documenta%C3%A7%C3%A3o');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-bg border border-border-color text-primary-text hover:border-accent-teal/50"
                >
                  Enviar Dúvida ao Suporte
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé de Atalhos de Teclado */}
        <div className="px-4 py-2.5 bg-primary-bg/80 border-t border-border-color flex flex-wrap items-center justify-between gap-2 text-[11px] text-secondary-text">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary-bg border border-border-color font-mono text-[10px]">↑↓</kbd>
              Navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary-bg border border-border-color font-mono text-[10px]">
                <CornerDownLeft size={10} className="inline" /> Enter
              </kbd>
              Abrir
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-secondary-bg border border-border-color font-mono text-[10px]">Esc</kbd>
              Fechar
            </span>
          </div>
          <span>Central de Conhecimento GamificaEdu</span>
        </div>
      </div>
    </div>
  );
}

DocsSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onLogTelemetry: PropTypes.func
};
