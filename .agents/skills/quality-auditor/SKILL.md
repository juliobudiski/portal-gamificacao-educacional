---
name: quality-auditor
description: >-
  Use this skill when performing independent quality audits, inspecting test coverage and test suite integrity,
  auditing requirement traceability matrices (RTM), evaluating technical debt metrics, and enforcing Quality Gates (DoR/DoD).
---

# Habilidades Essenciais do Auditor de Qualidade de Software (Quality Auditor)

Este guia e conjunto de habilidades reúne os procedimentos e padrões para conduzir auditorias formais e imparciais de qualidade, assegurando a rastreabilidade total de requisitos, conformidade com os Quality Gates e a saúde arquitetural de longo prazo.

---

## 1. Auditoria da Matriz de Rastreabilidade (RTM Audit)

1. **Combate a Requisitos Órfãos:**
   - Auditar periodicamente o backlog (`docs/backlog/user-stories/`) e a matriz (`docs/requirements-matrix/traceability_graph.md`) para verificar se todos os requisitos e histórias possuem ao menos:
     - 1 Porta ou Caso de Uso mapeado.
     - 1 Classe de Domínio ou Serviço implementado.
     - 1 Suíte de Testes automatizados correspondente.
2. **Combate a Código Fantasma (Dead Code / Unmapped Code):**
   - Auditar classes de serviço e controllers na base de código para garantir que todo código implementado responda a um requisito ou história legítima no backlog. Código sem dono deve ser justificado ou removido.
3. **Validação de Links do Obsidian:**
   - Checar se os `[[wikilinks]]` contidos no Frontmatter dos requisitos resolvem para arquivos existentes sem quebras de navegação no grafo.

---

## 2. Auditoria de Cobertura e Pirâmide de Testes

1. **Conformidade da Pirâmide:**
   - Verificar a distribuição dos testes: ampla base de testes unitários rápidos e determinísticos, camada intermediária de testes de integração com transações de banco e topo enxuto de testes E2E.
2. **Integridade de Cobertura (Branch & Mutation):**
   - Garantir que a cobertura não seja artificialmente inflada por testes superficiais ("testes sem asserts").
   - Incentivar testes de mutação para avaliar se a suíte de testes realmente falha quando bugs sutis são introduzidos no código de produção.
3. **Ausência de Mocks Frágeis:**
   - Assegurar que testes unitários mockem apenas dependências externas de infraestrutura (Portas de Saída: banco, rede, e-mail), e nunca a própria lógica interna da classe sob teste.

---

## 3. Gestão de Débito Técnico e Métricas de Confiabilidade

1. **Métricas de Manutenibilidade:**
   - Avaliar métricas SQALE, densidade de comentários redundantes e duplicações acidentais de código.
2. **Acompanhamento de Dívida Técnica:**
   - Catalogar pendências técnicas identificadas durante auditorias no backlog com a tag `#debito-tecnico` para que o Tech Lead reserve capacidade de refatoração no sprint seguinte.

---

## 4. Certificação dos Quality Gates (DoR & DoD)

O Quality Auditor é a autoridade independente responsável por assinar o laudo de conformidade dos portões de qualidade:

### A. Certificação do Definition of Ready (DoR):
- [ ] User story com personas claras e benefício de negócio mensurável.
- [ ] Cenários BDD mapeados nas 4 dimensões (Happy Path, Alternativo, Exceção, Caos).
- [ ] Contratos de interfaces e portas de entrada/saída acordados previamente.
- [ ] Sem violações de privacidade identificadas pelo AppSec.

### B. Certificação do Definition of Done (DoD):
- [ ] 100% dos testes unitários e de integração passando verde.
- [ ] Zero avisos de linter e compilação limpa.
- [ ] Code review do `code-reviewer` aprovado com todos os apontamentos bloqueantes resolvidos.
- [ ] Grafo de Rastreabilidade (`traceability_graph.md`) atualizado e sincronizado.
- [ ] Laudo formal de auditoria emitido e arquivado.
