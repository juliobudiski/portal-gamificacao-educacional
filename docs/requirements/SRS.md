# Especificação de Requisitos de Software (SRS) — Portal GamificaEdu
**Norma de Referência:** ISO/IEC/IEEE 29148:2018  
**Projeto:** Portal de Gamificação Educacional (GamificaEdu)  
**Versão:** 1.0 — Especificação Baseline Consolidada  
**Status:** Aprovado / Homologado  

---

## 1. Introdução

### 1.1 Propósito
Este documento define a **Especificação de Requisitos de Software (SRS)** formal do **Portal GamificaEdu**, ambiente gamificado e Sistema de Apoio à Decisão (SAD) concebido para potencializar a prática pedagógica docente por meio de trilhas interativas de aprendizagem, tabuleiros gamificados e orquestração assistida por Inteligência Artificial (Google Gemini).

### 1.2 Escopo do Sistema
O GamificaEdu provê:
- Gestão acadêmica de turmas, matrículas por código de ingresso e atribuição de atividades.
- Motor de Recomendação Contextual (MDC/MUI) fundamentado em evidências bibliométricas (SWEBOK, Bloom, Teoria da Autodeterminação e Hexad).
- Criação estruturada de atividades pedagógicas via Wizard em 8 etapas com validação determinística de vetos.
- Execução imersiva pelo aluno em tabuleiro gamificado com navegação passo a passo.
- Economia dupla de gamificação separando XP Vitalício (nível acadêmico) e Moedas (poder de compra na Loja e Roleta da Sorte).
- Fórum pedagógico moderado e Chat de turma em tempo real via WebSocket.
- Orquestração resiliente de rascunhos de atividades via IA generativa com fallback multi-modelo.

### 1.3 Definições, Acrônimos e Abreviações
- **SRS:** Software Requirements Specification (ISO/IEC/IEEE 29148).
- **RTM:** Requirements Traceability Matrix.
- **MDC / MUI:** Motor de Recomendação Contextual / Matriz de Usabilidade e Impacto Pedagógico.
- **SAD:** Sistema de Apoio à Decisão.
- **RBAC:** Role-Based Access Control (Controle de Acesso Baseado em Papéis).
- **XP:** Pontos de Experiência vitalícios que definem o nível e progresso do discente.
- **Moedas (Coins):** Moeda virtual transacional utilizada para aquisição de cosméticos na loja e giros na roleta.

---

## 2. Descrição Geral e Classes de Usuários

### 2.1 Atores do Sistema

| Ator | Descrição e Responsabilidades |
| :--- | :--- |
| **Estudante (`student`)** | Participa de turmas, executa atividades no tabuleiro, responde questionários, acumula XP/moedas, adquire cosméticos na loja, gira a roleta diária e interage via fórum e chat. |
| **Professor (`professor`)** | Cria e administra turmas, elabora atividades pelo Wizard ou via IA, monitora o engajamento e telemetria dos estudantes e modera publicações no fórum. |
| **Administrador (`admin`)** | Realiza a governança global da plataforma, auditoria de segurança, monitoramento de logs de telemetria e gestão de usuários. |
| **Orquestrador de IA (`llm_agent`)** | Serviço externo (Google Gemini) acionado sob demanda para geração automatizada de rascunhos pedagógicos e dinâmicas de jogo. |

---

## 3. Requisitos Funcionais do Sistema (RF)

### [RF-01] Autenticação e Gestão Segura de Sessão
- **Descrição:** O sistema deve permitir o cadastro e login de usuários mediante credenciais locais (e-mail e senha criptografada com Argon2/Bcrypt) ou via Single Sign-On (Google OAuth 2.0), emitindo tokens JWT assinados para autenticação de requisições subsequentes.
- **Entradas:** E-mail, senha ou token ID do Google.
- **Processamento:** Validação de formato, verificação de hash criptográfico, conferência de status ativo e emissão de JWT.
- **Saídas:** Token JWT, payload de perfil (id, role, xp, moedas) ou código de erro 401/422.
- **Prioridade:** Essencial (Must Have).

### [RF-02] Perfil do Usuário e Metadados Psicográficos (LGPD)
- **Descrição:** O sistema deve manter o perfil do usuário e permitir a coleta consentida de dados psicográficos e demográficos (tipos de jogador Hexad, faixa etária) para fins de pesquisa acadêmica, com garantia de revogação de consentimento sob as diretrizes da LGPD.
- **Entradas:** Dados cadastrais, formulário demográfico, consentimento explícito.
- **Processamento:** Persistência relacional com mascaramento de identificadores sensíveis.
- **Saídas:** Dados de perfil consolidados e status de consentimento.
- **Prioridade:** Importante (Should Have).

### [RF-03] Wizard de Criação de Atividades em 8 Etapas
- **Descrição:** O sistema deve guiar o docente através de um assistente estruturado em 8 etapas (Metadados, Mecânicas de Gamificação, Passos de Conteúdo, Questionários, Roleta, Loja, Feedback e Revisão Geral), validando a completude dos dados antes da publicação.
- **Entradas:** Dados preenchidos em cada etapa do assistente.
- **Processamento:** Validação de transição de passos no frontend e validação do payload completo no backend.
- **Saídas:** Atividade persistida em modo rascunho (`draft`) ou publicada (`published`).
- **Prioridade:** Essencial (Must Have).

### [RF-04] Motor de Recomendação Contextual e Vetos Pedagógicos (MDC/MUI)
- **Descrição:** O sistema deve calcular automaticamente a sinergia dos elementos de jogo selecionados no Wizard contra os objetivos educacionais (Taxonomia de Bloom e SWEBOK), emitindo alertas pedagógicos e vetos determinísticos que impeçam configurações prejudiciais à aprendizagem (*Dark Side* da gamificação).
- **Entradas:** Objetivos pedagógicos, nível dos alunos e elementos de jogo escolhidos.
- **Processamento:** Avaliação da matriz matemática de impacto e cálculo de índice de risco.
- **Saídas:** Score de recomendação pedagógica, lista de sinergias e eventuais vetos impeditivos.
- **Prioridade:** Essencial (Must Have).

### [RF-05] Gestão de Turmas e Matrícula via Código de Ingresso
- **Descrição:** O docente deve poder criar turmas gerando um código alfanumérico único de ingresso (ex: `GAM-7X9K`). Estudantes autenticados devem matricular-se na turma informando esse código.
- **Entradas:** Nome da turma, período letivo, código de ingresso.
- **Processamento:** Geração de código não colidente e associação atômica `UserClass`.
- **Saídas:** Turma criada ou matrícula confirmada com sucesso.
- **Prioridade:** Essencial (Must Have).

### [RF-06] Agendamento Temporal e Bloqueio Pós-Prazo
- **Descrição:** O sistema deve permitir configurar datas de início e término para disponibilização de atividades, bloqueando automaticamente novas submissões de estudantes após o encerramento do prazo estipulado.
- **Entradas:** `available_from`, `deadline`, flag de tolerância pós-prazo.
- **Processamento:** Comparação do timestamp UTC do servidor com os limites configurados.
- **Saídas:** Acesso liberado ou bloqueio com mensagem informativa de encerramento de prazo.
- **Prioridade:** Importante (Should Have).

### [RF-07] Execução Gamificada no Tabuleiro por Passos
- **Descrição:** O estudante deve percorrer a atividade através de uma interface visual de tabuleiro interativo, avançando nó a nó conforme conclui os conteúdos pedagógicos e questionários associados a cada passo (`stepId`).
- **Entradas:** Interação com nós do tabuleiro, envio de respostas dos exercícios.
- **Processamento:** Registro granular de progresso (`Progress`), validação de respostas e cálculo de acertos.
- **Saídas:** Atualização da posição no tabuleiro, liberação do próximo nó e concessão de recompensas.
- **Prioridade:** Essencial (Must Have).

### [RF-08] Economia Dupla: XP Vitalício e Moedas Transacionais
- **Descrição:** O sistema deve implementar estritamente a segregação entre Experiência Vitalícia (XP) — que nunca diminui e rege os níveis de maturidade — e Moedas (Coins) — moeda transacional debitável na compra de itens da loja e participações na roleta.
- **Entradas:** Eventos de conclusão de passos, acertos em quizzes e transações de débito.
- **Processamento:** Incremento monotônico de `total_xp_earned` e atualização atômica de saldo de moedas com validação de saldo não negativo.
- **Saídas:** Saldo de moedas e nível de XP atualizados.
- **Prioridade:** Essencial (Must Have).

### [RF-09] Loja de Itens Cosméticos e Efeitos Visuais Backend-Driven
- **Descrição:** O sistema deve disponibilizar um catálogo de itens cosméticos (avatares, bordas, títulos, temas e efeitos temporários), permitindo a compra mediante débito de moedas e a ativação de itens pelo discente.
- **Entradas:** ID do item do catálogo, ação de compra ou ativação.
- **Processamento:** Verificação de saldo de moedas, inserção no inventário do discente e persistência do item ativo.
- **Saídas:** Item adicionado ao inventário, saldo deduzido e visual do perfil atualizado.
- **Prioridade:** Importante (Should Have).

### [RF-10] Concessão Automatizada de Medalhas e Conquistas
- **Descrição:** O sistema deve avaliar eventos de telemetria e conceder automaticamente medalhas do catálogo oficial (20 medalhas distribuídas em 4 categorias pedagógicas) quando o discente atinge critérios preestabelecidos (ex: conclusão de primeira atividade, sequência de acertos).
- **Entradas:** Eventos de progresso e métricas acumuladas do estudante.
- **Processamento:** Avaliação das regras de gatilho do `MedalService` e registro atômico de conquista.
- **Saídas:** Notificação em tempo real de conquista desbloqueada e inclusão na vitrine de medalhas.
- **Prioridade:** Importante (Should Have).

### [RF-11] Roleta Diária da Sorte com Cooldown
- **Descrição:** O sistema deve fornecer um mecanismo de engajamento diário (Roleta da Sorte) com probabilidades balanceadas de recompensas em moedas ou bônus, aplicando um cooldown determinístico de 24 horas por estudante.
- **Entradas:** Solicitação de giro pelo estudante autenticado.
- **Processamento:** Validação do timestamp da última utilização (`last_spin_at`), sorteio ponderado e persistência da recompensa.
- **Saídas:** Recompensa sorteada, animação no canvas frontend e reinício do cronômetro de cooldown.
- **Prioridade:** Desejável (Could Have).

### [RF-12] Fórum Pedagógico com Categorização Automática
- **Descrição:** O sistema deve disponibilizar um espaço de discussão assíncrona com tópicos vinculados automaticamente a cada atividade e turma, permitindo respostas encadeadas, votos da comunidade e moderação pelo docente.
- **Entradas:** Criação de tópicos, mensagens de resposta, votos positivos.
- **Processamento:** Vinculação relacional à turma/atividade, validação de texto e registro de autoria.
- **Saídas:** Tópicos e respostas exibidos com destaque para respostas validadas pelo docente.
- **Prioridade:** Importante (Should Have).

### [RF-13] Chat da Turma em Tempo Real via WebSocket
- **Descrição:** O sistema deve prover comunicação instantânea entre alunos e professor de uma mesma turma utilizando WebSocket (Socket.IO), garantindo isolamento estrito de mensagens por sala (`room`) de turma.
- **Entradas:** Eventos `join_room`, `send_message`, `leave_room`.
- **Processamento:** Autenticação no handshake, despacho restrito aos clientes conectados na mesma sala.
- **Saídas:** Difusão imediata da mensagem com timestamp e identificação do autor.
- **Prioridade:** Importante (Should Have).

### [RF-14] Painel de Telemetria e Analytics de Desempenho Docente
- **Descrição:** O sistema deve agregar dados de progresso, taxa de acerto em questionários, tempo de permanência e engajamento dos discentes, apresentando relatórios gráficos para intervenção pedagógica docente com opção de anonimização no ranking público.
- **Entradas:** Registros de telemetria (`EventLog`), respostas de atividades e notas.
- **Processamento:** Agregações SQL e mascaramento de nomes de alunos em rankings competitivos.
- **Saídas:** Gráficos de dispersão, taxa de conclusão e tabelas analíticas para download/visualização.
- **Prioridade:** Importante (Should Have).

### [RF-15] Orquestração de Rascunhos Pedagógicos com IA Generativa
- **Descrição:** O sistema deve permitir que o docente solicite a geração automatizada de rascunhos completos de atividades educacionais informando tema, série e objetivos, com streaming de progresso via WebSocket e validação contra alucinações.
- **Entradas:** Prompt pedagógico (tema, nível de ensino, habilidades BNCC/Bloom).
- **Processamento:** Sanitização de entradas contra prompt injection, acionamento em cascata com fallback multi-modelo (`gemini-3.1-flash-lite` -> `gemini-2.5-flash` -> `gemini-2.5-pro`) com timeout de 45 segundos.
- **Saídas:** Estrutura completa da atividade gerada (narrativa, passos, quizzes e gabarito) pronta para revisão no Wizard.
- **Prioridade:** Importante (Should Have).

---

## 4. Requisitos Não-Funcionais (RNF) — ISO/IEC 25010

| ID | Categoria (ISO 25010) | Especificação Técnica e Meta de Engenharia |
| :--- | :--- | :--- |
| **[RNF-01]** | **Segurança da Informação** | Todas as senhas devem ser tratadas com algoritmo de derivação seguro (Bcrypt/Argon2); tokens de sessão devem ser JWT assinados com HMAC-SHA256 (chave >= 32 bytes); comunicação externa estritamente sob TLS/HTTPS e WSS. |
| **[RNF-02]** | **Isolamento de Ambiente (VPS)** | A aplicação deve operar sob usuário Linux restrito sem privilégios de root, em contêineres Docker com rede interna isolada (`internal: true`), prevenindo qualquer possibilidade de movimentação lateral para serviços vizinhos no VPS compartilhado. |
| **[RNF-03]** | **Desempenho & Latência** | 95% das requisições REST de leitura e escrita devem responder em menos de 200 ms sob carga nominal. Requisições analíticas agregadas não devem exceder 1.500 ms. |
| **[RNF-04]** | **Concorrência & Tempo Real** | O subsistema de WebSocket deve suportar no mínimo 100 conexões ativas simultâneas por turma sem degradação na entrega de eventos do chat e telemetria. |
| **[RNF-05]** | **Integridade Transacional (ACID)** | Toda operação financeira/gamificada de débito ou crédito de moedas e concessão de XP deve ser executada em transações atômicas com bloqueio otimista ou pessimista no PostgreSQL. |
| **[RNF-06]** | **Tolerância a Falhas & SRE** | O pipeline de IA deve implementar resiliência com Circuit Breaker, timeout rigoroso de 45s e failover sequencial automático em 3 camadas de modelos, sem que falhas da IA derrubem o backend. |
| **[RNF-07]** | **Privacidade e Conformidade LGPD** | O sistema não deve expor dados pessoais sensíveis em rankings públicos (anonymization por padrão); deve permitir exclusão de conta e coleta de dados condicionada a opt-in explícito. |
| **[RNF-08]** | **Manutenibilidade & Arquitetura** | O backend deve seguir estritamente o padrão de Arquitetura Hexagonal (Ports & Adapters) e Application Factory, separando regras de domínio de adaptadores de infraestrutura e frameworks. |
| **[RNF-09]** | **Usabilidade e Acessibilidade** | A interface frontend deve ser responsiva (desktop e dispositivos móveis) e seguir diretrizes de contraste e navegabilidade por teclado baseadas no padrão WCAG 2.1 nível AA. |
| **[RNF-10]** | **Testabilidade & CI/CD** | 100% dos requisitos funcionais devem possuir testes herméticos automatizados (Pytest/Jest), com gates de qualidade obrigatórios bloqueando deploys na branch `main` caso haja falhas. |

---

## 5. Regras de Negócio Globais (RN)

- **[RN-01] Princípio da Não-Degradação de XP:** O XP acumulado pelo discente representa seu histórico acadêmico vitalício e sob nenhuma hipótese pode ser reduzido, confiscado ou gasto em compras.
- **[RN-02] Não-Negatividade de Moedas:** O saldo de moedas de um usuário nunca pode ficar negativo. Qualquer tentativa de transação cujo valor supere o saldo disponível deve ser rejeitada com código HTTP 400.
- **[RN-03] Veto Pedagógico do MDC:** Se o índice de risco pedagógico calculado pelo Motor de Recomendação for superior ao limite seguro (geração de frustração ou desmotivação pelo excesso de mecânicas punitivas), a publicação da atividade fica sumariamente bloqueada no Wizard.
- **[RN-04] Janela de Cooldown da Roleta:** Cada estudante tem direito a no máximo 1 (um) giro na roleta diária a cada período de 24 horas consecutivas.
- **[RN-05] Proteção de Anonimato em Rankings:** No ranking público de turmas com estudantes menores de idade, os identificadores de estudantes que não optaram pela visibilidade pública devem ser exibidos anonimizados (ex: `Aluno #1482`).
