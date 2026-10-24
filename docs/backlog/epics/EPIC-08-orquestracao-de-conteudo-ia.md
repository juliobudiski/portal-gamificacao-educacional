# EPIC-08: Orquestração de Inteligência Artificial e Grounding

- **Identificador:** `EPIC-08`
- **Status:** Ativo / Homologado
- **Módulo:** Core GamificaEdu

---

## 1. Descrição do Épico

Pipeline automatizado de assistência por IA utilizando a família Google Gemini com rotação de cotas (Multi-Model Fallback), enriquecimento conceitual via YouTube Data API e governança estrita de revisão por professores através do estado isDraft.

---

## 2. Histórias de Usuário Vinculadas

- [[US-15-geracao-rascunhos-ia-gemini.md]]

---

## 3. Critérios Gerais de Sucesso do Épico

- 100% dos fluxos de escrita protegidos com validação de autorização server-side.
- Cobertura de testes unitários e de integração validando os cenários BDD vinculados.
- Rastreabilidade ponta a ponta com as tabelas relacionais do Neon PostgreSQL e portas de arquitetura.
