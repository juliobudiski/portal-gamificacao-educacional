# EPIC-03: Gestão de Turmas, Matrículas e Agendamento

- **Identificador:** `EPIC-03`
- **Status:** Ativo / Homologado
- **Módulo:** Core GamificaEdu

---

## 1. Descrição do Épico

Responsável pela administração de turmas com código único alfanumérico, matrícula de estudantes em múltiplas turmas, formação de equipes e regras estritas de agendamento com bloqueio automático de submissões pós-prazo.

---

## 2. Histórias de Usuário Vinculadas

- [[US-05-gestao-de-turmas-e-codigo-ingresso.md]]
- [[US-06-agendamento-e-bloqueio-pos-prazo.md]]

---

## 3. Critérios Gerais de Sucesso do Épico

- 100% dos fluxos de escrita protegidos com validação de autorização server-side.
- Cobertura de testes unitários e de integração validando os cenários BDD vinculados.
- Rastreabilidade ponta a ponta com as tabelas relacionais do Neon PostgreSQL e portas de arquitetura.
