# Telas Públicas, Autenticação e Onboarding

> **Status:** Ativo & Atualizado  
> **Escopo:** Fluxos abertos a visitantes, autenticação JWT, Google OAuth, perfil do usuário e recuperação de conta  

---

## 1. Landing Page (`HomePage.jsx`)

- **Rota:** `/`
- **Acesso:** Aberto (Público)
- **Objetivo:** Apresentar o Portal GamificaEdu, demonstrar seus pilares pedagógicos e engajar novos professores e estudantes.
- **Componentes e Integrações:**
  - **Métricas da Plataforma:** Consome o endpoint `/api/public/stats` exibindo contadores de usuários ativos, turmas criadas e atividades concluídas.
  - **Header e Footer Institucionais:** Exibe links de navegação para login, cadastro, sobre nós e contato.
  - **Botão Flutuante de Tema:** [`ThemeToggleButton.jsx`](../../frontend/src/components/ThemeToggleButton.jsx) para alternar entre Dark e Light mode com persistência.
  - **CTA (Call to Action):** Direciona novos usuários para `/cadastro` e usuários recorrentes para `/login`.

---

## 2. Autenticação e Entrada (`LoginPage.jsx`)

- **Rota:** `/login`
- **Acesso:** Público (redireciona para o dashboard correspondente se já autenticado via `useAuth`)
- **Objetivo:** Identificar o usuário no sistema via credenciais próprias ou OAuth.
- **Mecanismos e Segurança:**
  - **Formulário Tradicional:** Campos de e-mail e senha com validação inline e sanitização WAF.
  - **Login Social (Google OAuth):** Integrado via `@react-oauth/google` com o hook [`useGoogleSignIn.js`](../../frontend/src/hooks/useGoogleSignIn.js).
  - **Armazenamento de Sessão:** Token JWT persistido com segurança no `localStorage` e carregado no cabeçalho `Authorization: Bearer <token>`.
  - **Tratamento de Bloqueios:** Exibe avisos caso a conta esteja inativa (`status !== 'ACTIVE'`).
  - **Links Rápidos:** Atalho para recuperação de senha (`/recuperar-senha`) e novo cadastro (`/cadastro`).

---

## 3. Cadastro de Novos Usuários (`RegisterPage.jsx`)

- **Rota:** `/cadastro`
- **Acesso:** Público
- **Objetivo:** Permitir o auto-registro de alunos e professores.
- **Regras de Negócio e Validações:**
  - **Seleção de Perfil:** O usuário escolhe entre `aluno` e `professor`.
  - **Validação de Código de Professor:** Se o perfil for `professor`, o formulário exige o *Código de Acesso Institucional* (ex: `GAMIFICA_PROF_2026` ou chave emitida pelo Admin).
  - **Prevenção de Escalação de Privilégios (VULN-02):** Apenas papéis autorizados são aceitos pelo backend; o frontend bloqueia envio inconsistente.
  - **Validação de Força de Senha:** Exige mínimo de caracteres e confirmação de senha idêntica.
  - **Termos de Uso:** Checkbox obrigatório acionando o modal [`TermsOfUseModal.jsx`](../../frontend/src/components/TermsOfUseModal.jsx).

---

## 4. Recuperação de Credenciais

### 4.1 Solicitação de Redefinição (`ForgotPasswordPage.jsx`)
- **Rota:** `/recuperar-senha`
- **Acesso:** Público
- **Funcionamento:** O usuário informa seu e-mail cadastrado. O sistema dispara uma requisição POST para `/api/auth/forgot-password`. Em resposta bem-sucedida, exibe mensagem confirmando envio das instruções sem confirmar existência de e-mail (anti-enumeração de usuários).

### 4.2 Definição de Nova Senha (`ResetPasswordPage.jsx`)
- **Rota:** `/reset-password/:token`
- **Acesso:** Público (com token temporal de uso único)
- **Funcionamento:** Lê o token nos parâmetros de rota, valida expiração e apresenta campos para nova senha e confirmação.

---

## 5. Perfil do Usuário e Dados de Pesquisa (`UserProfilePage.jsx`)

- **Rotas:** `/perfil` e `/profile`
- **Acesso:** Privado (Aluno, Professor ou Admin)
- **Funcionalidades:**
  - **Edição de Dados Básicos:** Atualização de nome (formatado automaticamente em Title Case), avatar global equipado e bio.
  - **Coleta Demográfica para Pesquisa Científica (DSR):**
    - Idade, gênero, preferências de aprendizagem e estilos de jogo (Hexad).
    - Instituição de ensino de vínculo e área disciplinar.
  - **Integração de Chaves de IA Pessoais:** Permite ao professor registrar sua própria chave Gemini (`gemini_api_key`) ou OpenAI (`openai_api_key`) caso deseje utilizar cotas próprias.
  - **Exclusão de Conta:** Acionamento de confirmação em duas etapas via [`DeleteAccountModal.jsx`](../../frontend/src/components/DeleteAccountModal.jsx) em conformidade com o direito de eliminação de dados (LGPD).

---

## 6. Página Institucional Sobre Nós (`AboutUsPage.jsx`)

- **Rota:** `/sobre-nos`
- **Acesso:** Público
- **Conteúdo e Equipe:**
  - Histórico do projeto acadêmico de Doutorado em Gamificação Educacional.
  - **Prof. Dr. Armando Toda:** Foto de perfil oficial (`frontend/public/team/armando.jpeg`), biografia acadêmica e contribuições na área de Informática na Educação.
  - **Júlio Budiski:** Foto de perfil oficial (`frontend/public/team/julio.jpeg`), biografia, escopo de pesquisa de Doutorado e engenharia de software da plataforma.

---

## 7. Canal de Contato e Ouvidoria (`ContactPage.jsx`)

- **Rota:** `/contact`
- **Acesso:** Público (com preenchimento automático de nome e e-mail se o usuário estiver autenticado)
- **Funcionamento:** Formulário para envio de dúvidas, sugestões e suporte.
- **Segurança (VULN-17):** Mensagens sanitizadas com tratamento de erros que não expõe detalhes de infraestrutura ou banco de dados. Mensagens são enviadas para triagem administrativa em `/admin/messages`.
