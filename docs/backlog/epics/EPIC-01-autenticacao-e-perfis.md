# EPIC-01: Autenticação, Autorização e Perfis Acadêmicos

- **Identificador:** `EPIC-01`
- **Status:** Ativo / Homologado
- **Módulo:** Core GamificaEdu

---

## 1. Descrição do Épico

Engloba os fluxos de cadastro, login com JWT, recuperação de credenciais, controle de acesso baseado em papéis (RBAC para Professores, Alunos e Administradores) e coleta de metadados psicográficos/demográficos para pesquisa científica sob a LGPD.

---

## 2. Histórias de Usuário Vinculadas

- [[US-01-login-e-recuperacao-senha.md]]
- [[US-02-perfil-e-coleta-demografica-pesquisa.md]]

---

## 3. Critérios Gerais de Sucesso do Épico

- 100% dos fluxos de escrita protegidos com validação de autorização server-side.
- Cobertura de testes unitários e de integração validando os cenários BDD vinculados.
- Rastreabilidade ponta a ponta com as tabelas relacionais do Neon PostgreSQL e portas de arquitetura.
