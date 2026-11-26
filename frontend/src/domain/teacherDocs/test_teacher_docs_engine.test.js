/**
 * Suíte de Testes Unitários OO & BDD — US-26 / RF-16 / RNF-11
 * Verifica a integridade Diátaxis do catálogo, resolução das 9 chaves do Wizard,
 * latência de busca < 16ms e blindagem AppSec/LGPD contra ReDoS, XSS e vazamento de PII.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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

describe('US-26 / RF-16: Central de Documentação Docente & FAQ (Domínio Puro OO & Motor de Busca)', () => {
  const engine = new TeacherDocsSearchEngine({
    categories: TEACHER_DOCS_CATEGORIES,
    articles: TEACHER_DOCS_ARTICLES,
    faqs: TEACHER_DOCS_FAQS,
    wizardMap: WIZARD_HELP_TO_DOCS_MAP
  });

  it('1. Integridade Estrutural & Diátaxis: Deve validar catálogo sem IDs duplicados ou referências órfãs', () => {
    const report = engine.validateCatalogIntegrity();
    assert.equal(report.isValid, true, `Erros de integridade encontrados: ${report.errors.join('; ')}`);
    assert.ok(TEACHER_DOCS_CATEGORIES.length >= 6, 'Deve possuir ao menos 6 módulos Diátaxis');
    assert.ok(TEACHER_DOCS_ARTICLES.length >= 10, 'Deve possuir ao menos 10 artigos detalhados estilo Overleaf Learn');
    assert.ok(TEACHER_DOCS_FAQS.length >= 20, 'Deve possuir ao menos 20 perguntas frequentes docentes');
  });

  it('2. Mapeamento Bidirecional do Wizard (9 Chaves): Todas as chaves do HelpModal devem resolver para artigos válidos', () => {
    const requiredHelpKeys = [
      'analise_preliminar',
      'cenario_desejado',
      'planejamento_atividade',
      'perfil_jogador',
      'elementos_jogos',
      'tabuleiro_progressao',
      'recompensas_oferecidas',
      'acoes_recompensadas',
      'regras_gamificacao'
    ];

    for (const key of requiredHelpKeys) {
      const resolved = engine.resolveWizardHelpLink(key);
      assert.ok(resolved, `A chave "${key}" do Wizard deve possuir rota mapeada`);
      assert.match(resolved.url, /^\/professor\/documentacao\/[a-z0-9-]+\/[a-z0-9-]+/);
      const article = engine.getArticleBySlugs(resolved.categorySlug, resolved.articleSlug);
      assert.ok(article, `Artigo alvo não encontrado para a chave "${key}": ${resolved.url}`);
    }
  });

  it('3. Caminho Feliz (Happy Path): Navegação sequencial Anterior/Próximo e Sumário "Nesta Página" (TOC)', () => {
    const defaultArticle = engine.getDefaultArticle();
    assert.ok(defaultArticle);
    const toc = engine.buildTableOfContents(defaultArticle);
    assert.ok(Array.isArray(toc) && toc.length >= 2, 'Cada artigo deve gerar sumário lateral de seções H2');

    const neighbors = engine.getAdjacentArticles(defaultArticle.categorySlug, defaultArticle.slug);
    assert.equal(neighbors.previous, null, 'O primeiro artigo não deve ter anterior');
    assert.ok(neighbors.next, 'O primeiro artigo deve possuir próximo guia na trilha');
  });

  it('4. Caminho Alternativo: Busca instantânea sem acentos, case-insensitive, ranqueada e < 16ms (RNF-11)', () => {
    const start = performance.now();
    const results = engine.search('veto pedagogico dark side hexad');
    const elapsedMs = performance.now() - start;

    assert.ok(elapsedMs < 16, `A busca local excedeu o orçamento RNF-11 de 16ms: ${elapsedMs.toFixed(2)}ms`);
    assert.ok(results.totalHits > 0, 'Deve retornar resultados mesmo sem acentuação');
    assert.ok(
      results.articles.some((a) => a.slug.includes('veto') || a.slug.includes('hexad')),
      'Deve ranquear os artigos do Motor MDC/Hexad no topo'
    );

    const faqResults = engine.search('xp vitalicio moedas');
    assert.ok(faqResults.faqs.length > 0 || faqResults.articles.length > 0);
  });

  it('5. Cenário de Exceção: Slugs inexistentes e buscas vazias/sem correspondência retornam fallbacks seguros', () => {
    const missing = engine.getArticleBySlugs('modulo-fantasma', 'artigo-inexistente');
    assert.equal(missing, null);

    const unknownWizard = engine.resolveWizardHelpLink('chave_inexistente_xyz');
    assert.equal(unknownWizard, null);

    const noHit = engine.search('zzzz_termo_impossivel_99999');
    assert.equal(noHit.totalHits, 0);
    assert.deepEqual(noHit.articles, []);
    assert.deepEqual(noHit.faqs, []);
  });

  it('6. Chaos Monkey & AppSec (STRIDE / LGPD): Resistência a ReDoS, XSS e mascaramento de PII na telemetria', () => {
    const maliciousInputs = [
      null,
      undefined,
      12345,
      {},
      '((((((((((a+)+)+)+)+)+)+)+)+)+!',
      '<script>alert("xss")</script><img src=x onerror=alert(1)>',
      '['.repeat(500) + '.*+?^${}()|[]\\'
    ];

    for (const payload of maliciousInputs) {
      assert.doesNotThrow(() => {
        const res = engine.search(payload);
        assert.ok(res && Array.isArray(res.articles) && Array.isArray(res.faqs));
      });
    }

    // Verificação de sanitização LGPD antes do EventLog
    const sanitized = sanitizeSearchQueryForTelemetry(
      'Dúvida sobre aluno joao.silva@escola.edu.br CPF 123.456.789-00 <script>evil()</script>'
    );
    assert.ok(!sanitized.includes('joao.silva@escola.edu.br'), 'Não deve vazar e-mail nos logs');
    assert.ok(!sanitized.includes('123.456.789-00'), 'Não deve vazar CPF nos logs');
    assert.ok(!sanitized.includes('<script>'), 'Não deve conter tags HTML cruas');
    assert.ok(sanitized.includes('[EMAIL_REDACTED]'));
    assert.ok(sanitized.includes('[CPF_REDACTED]'));
  });
});
