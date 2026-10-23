# EPIC-05: Comunicação Social: Fórum Estruturado e Chat Realtime

- **Identificador:** `EPIC-05`
- **Status:** Ativo / Homologado
- **Módulo:** Core GamificaEdu

---

## 1. Descrição do Épico

Isola e fornece duas ferramentas de interação social: Fórum de Dúvidas assíncrono categorizado e moderado para fixação de conhecimento, e Chat em Tempo Real via WebSockets (Socket.IO) em salas restritas à turma para engajamento síncrono.

---

## 2. Histórias de Usuário Vinculadas

- [[US-12-forum-moderado-e-categorias-automaticas.md]]
- [[US-13-chat-da-turma-tempo-real.md]]

---

## 3. Critérios Gerais de Sucesso do Épico

- 100% dos fluxos de escrita protegidos com validação de autorização server-side.
- Cobertura de testes unitários e de integração validando os cenários BDD vinculados.
- Rastreabilidade ponta a ponta com as tabelas relacionais do Neon PostgreSQL e portas de arquitetura.
