---
name: appsec-security
description: >-
  Use this skill when conducting application security audits, threat modeling (STRIDE),
  configuring security scanners (SAST, DAST, SCA, Secrets), remediating OWASP Top 10 vulnerabilities, and enforcing data privacy (LGPD/GDPR).
---

# Habilidades Essenciais do Engenheiro AppSec / SecOps

Este guia e conjunto de habilidades reúne os procedimentos e padrões operacionais para identificar, remediar e prevenir vulnerabilidades de segurança no ciclo de vida de desenvolvimento de software (SSDLC).

---

## 1. Cultura Shift-Left e Esteiras de Segurança Automatizadas (DevSecOps)

1. **Camadas de Varredura Automatizada:**
   - **Secret Scanning (Pre-commit & CI):** Bloquear commits contendo chaves privadas, senhas, tokens de API ou certificados usando ferramentas como Gitleaks ou TruffleHog.
   - **SCA (Software Composition Analysis):** Mapear e atualizar dependências vulneráveis (CVEs conhecidas) no ecossistema (ex.: `npm audit`, `pip-audit`, Snyk, Trivy).
   - **SAST (Static Application Security Testing):** Análise estática do código-fonte procurando padrões inseguros (Semgrep, SonarQube, Bandit) sem necessidade de executar a aplicação.
   - **DAST (Dynamic Application Security Testing):** Testes em tempo de execução simulando ataques reais contra endpoints HTTP expostos (OWASP ZAP).

2. **Quality Gates de Segurança no Pipeline:**
   - Quebrar a esteira de build caso sejam detectadas vulnerabilidades de severidade **Crítica** ou **Alta** sem mitigação aprovada.

---

## 2. Mitigação Pragmática do OWASP Top 10

1. **A01: Quebra de Controle de Acesso (Broken Access Control / BOLA):**
   - Nunca confiar exclusivamente em IDs passados na URL (ex.: `/api/users/123/profile`). Sempre validar se o usuário autenticado na sessão/JWT é o legítimo proprietário do recurso acessado.
   - Aplicar o princípio do menor privilégio (*Least Privilege*) e controle de acesso baseado em papéis (*RBAC*) centralizado.

2. **A02: Falhas Criptográficas:**
   - Proibir o uso de algoritmos obsoletos (MD5, SHA1, DES).
   - Utilizar funções de hash lentas com salt para armazenamento de senhas (bcrypt, Argon2, PBKDF2).
   - Forçar HTTPS com TLS 1.3 e cabeçalhos de segurança obrigatórios: `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `X-Content-Type-Options: nosniff`.

3. **A03: Injeções (SQL, NoSQL, OS Command):**
   - Utilizar exclusivamente consultas parametrizadas (*Prepared Statements*) ou ORMs consolidados.
   - Nunca concatenar strings de entrada de usuário diretamente em comandos de shell (`subprocess(..., shell=True)` é proibido).

4. **A07: Falhas de Identificação e Autenticação:**
   - Implementar proteção contra ataques de força bruta com limitação de taxa (*Rate Limiting* por IP e por conta).
   - Gerenciar sessões com cookies seguros (`HttpOnly`, `Secure`, `SameSite=Lax/Strict`).

---

## 3. Modelagem de Ameaças (Threat Modeling com STRIDE)

Para cada nova arquitetura, integração ou módulo crítico, avaliar os seis vetores do STRIDE:
- **S**poofing (Falsificação de identidade): É possível se passar por outro usuário ou serviço?
- **T**ampering (Adulteração de dados): Alguém pode alterar parâmetros de payload, valores em trânsito ou registros no banco?
- **R**epudiation (Repúdio): Há logs e trilhas de auditoria imutáveis comprovando quem realizou ações críticas?
- **I**nformation Disclosure (Vazamento de informação): Mensagens de erro de exceção ou stack traces revelam dados sensíveis ou detalhes de arquitetura?
- **D**enial of Service (Negação de serviço): O sistema é vulnerável a exaustão de memória, payloads gigantes ou ataques de concorrência?
- **E**levation of Privilege (Elevação de privilégio): Um usuário regular consegue acessar rotas administrativas modificando um token ou header?

---

## 4. Proteção de Dados e Privacidade (LGPD / GDPR)

1. **Minimização de Dados (Privacy by Default):**
   - Coletar apenas os dados estritamente necessários para a finalidade da funcionalidade.
2. **Sanitização de Logs e Telemetria:**
   - Proibir expressamente o registro de senhas, CPFs, e-mails, números de cartão de crédito e tokens de acesso nos arquivos de log e dashboards de métricas.
3. **Direito ao Esquecimento e Retenção Controlada:**
   - Implementar mecanismos de exclusão permanente ou anonimização irreversível de dados a pedido do titular ou após o término do período de retenção legal.
