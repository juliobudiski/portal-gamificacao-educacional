# Registro Oficial das 10 Reuniões Técnicas da Squad de Engenharia e Produto
## Tema: Auditoria Arquitetural, Refatoração e Excelência do Pipeline de IA (Narrativa, Quiz e Conteúdo)

---

### Sumário das Reuniões
- [Reunião 1: Tech Lead & Arquiteto de Software — Governança Arquitetural, SOLID e Desacoplamento](#reunião-1-tech-lead--arquiteto-de-software--governança-arquitetural-solid-e-desacoplamento)
- [Reunião 2: Engenharia de Backend — Persistência Relacional, Atomicidade e Ciclo de Vida](#reunião-2-engenharia-de-backend--persistência-relacional-atomicidade-e-ciclo-de-vida)
- [Reunião 3: Frontend Team & Tech Lead — Protocolo WebSocket, State Machine e UX do Wizard](#reunião-3-frontend-team--tech-lead--protocolo-websocket-state-machine-e-ux-do-wizard)
- [Reunião 4: Especialistas em IA & Backend Lead — Engenharia de Prompts, Estrutura Cognitiva e Resiliência Gemini](#reunião-4-especialistas-em-ia--backend-lead--engenharia-de-prompts-estrutura-cognitiva-e-resiliência-gemini)
- [Reunião 5: AppSec & DevSecOps — Threat Modeling (STRIDE), Proteção de Segredos e LGPD](#reunião-5-appsec--devsecops--threat-modeling-stride-proteção-de-segredos-e-lgpd)
- [Reunião 6: DevOps & SRE — Escalabilidade, Concorrência de Threads e Observabilidade](#reunião-6-devops--sre--escalabilidade-concorrência-de-threads-e-observabilidade)
- [Reunião 7: QA & SDET — Pirâmide de Testes, Hermetismo e Testes de Resiliência](#reunião-7-qa--sdet--pirâmide-de-testes-hermetismo-e-testes-de-resiliência)
- [Reunião 8: Product Owner & Requirements Engineer — Valor Pedagógico, Critérios BDD e Regras de Negócio](#reunião-8-product-owner--requirements-engineer--valor-pedagógico-critérios-bdd-e-regras-de-negócio)
- [Reunião 9: Product Designer & Frontend Lead — Experiência do Usuário (UX/UI), Design System e Acessibilidade](#reunião-9-product-designer--frontend-lead--experiência-do-usuário-uxui-design-system-e-acessibilidade)
- [Reunião 10: Conselho Executivo / Engineering Management & Tech Lead — Síntese, ADRs e Definition of Done](#reunião-10-conselho-executivo--engineering-management--tech-lead--síntese-adrs-e-definition-of-done)

---

## Reunião 1: Tech Lead & Arquiteto de Software — Governança Arquitetural, SOLID e Desacoplamento

- **Data:** 13 de Outubro de 2026
- **Participantes:** Tech Lead, Arquiteto de Software, Senior Backend Developer.
- **Pauta:**
  1. Análise do acoplamento entre a camada de transporte (HTTP e WebSocket) e os serviços de negócio (`AIService`, `ActivityService`).
  2. Aplicação de princípios SOLID (Single Responsibility, Dependency Inversion, Open/Closed).
  3. Eliminação de efeitos colaterais de persistência e vazamento de responsabilidades.

### Discussões Técnicas:
O Tech Lead abriu a reunião destacando que o sistema apresentava acoplamento desfavorável onde o orquestrador de IA recebia parâmetros heterogêneos e gerenciava tanto a chamada a LLMs externos quanto a emissão direta de WebSockets e fallback heurístico. 
O Arquiteto de Software observou que a rota `POST /api/content_editor/orchestrate` em `content_editor.py` delegava a execução assíncrona ao wrapper do Flask-SocketIO (`socketio.start_background_task`), mas havia um vazamento crítico: no fechamento da geração em `AIService.py`, o evento `ai_complete` emitia globalmente sem o parâmetro `room=room_id`, o que quebrava o isolamento de sessões entre múltiplos professores.

O Senior Backend destacou o problema na persistência: o fluxo anterior persistia a trilha apenas no campo JSONB `gamification_design`, mas não alimentava as tabelas normalizadas filhas (`QuizContent`, `NarrativeContent`, `LearningContent`). 
Aplicando o princípio da **Responsabilidade Única (SRP)**, a função `sync_progression_path_contents` foi isolada no `ActivityService`, tornando a sincronização relacional reutilizável por qualquer ponto de mutação (criação oficial, update de tabuleiro, autosave e deleção).

### Deliberações e Ações:
1. **Ação Imediata Executada:** Adicionado `room=room_id` na emissão do evento `ai_complete` em `AIService.py`.
2. **Desacoplamento de Logging:** O helper `_log_system_event` foi blindado contra ausência de contexto de requisição HTTP (`has_request_context()`), evitando que rollbacks de auditoria invalidem operações de banco de dados do domínio.
3. **Decisão Arquitetural:** Padronização do contrato de sincronização relacional em `ActivityService.py` com suporte à flag `purge_orphans`.

---

## Reunião 2: Engenharia de Backend — Persistência Relacional, Atomicidade e Ciclo de Vida

- **Data:** 13 de Outubro de 2026
- **Participantes:** Senior Backend Developer, Mid Backend Developer, Arquiteto de Banco de Dados.
- **Pauta:**
  1. Integridade referencial das tabelas filhas `QuizContent`, `NarrativeContent` e `LearningContent`.
  2. Idempotência em operações concorrentes de autosave e promoção de rascunhos.
  3. Prevenção de registros órfãos e estratégia de exclusão em cascata.

### Discussões Técnicas:
O Arquiteto de Banco de Dados analisou os modelos SQLAlchemy e os esquemas de chaves estrangeiras. Foi pontuado que as tabelas `quiz_content`, `narrative_content` e `learning_content` possuem restrições únicas compostas baseadas em `(activity_id, step_id)`.
No entanto, caso um professor excluísse um nó do tabuleiro no React Flow, a trilha JSON em `Activity.gamification_design` era salva sem o nó, mas o registro filho permanecia armazenado indefinidamente no banco, gerando registros órfãos (*dangling data*).

O Senior Backend propôs a evolução da função `sync_progression_path_contents`:
```python
def sync_progression_path_contents(activity_id, progression_path, purge_orphans=False):
```
Ao processar uma lista definitiva de passos, o sistema coleta o conjunto de `active_step_ids` e, quando `purge_orphans=True`, executa a deleção em lote das entidades filhas cuja chave `step_id` não pertença mais ao conjunto de nós ativos da atividade.

### Deliberações e Ações:
1. **Ação Imediata Executada:** Implementado o parâmetro `purge_orphans=True` em `sync_progression_path_contents` e ativado nas rotas `update_activity` e `update_activity_structure`.
2. **Garantia de Atomicidade:** A sincronização e a atualização da entidade principal `Activity` ocorrem estritamente dentro da mesma transação do SQLAlchemy, com `db.session.commit()` final e `db.session.rollback()` em caso de falha.
3. **Teste de Idempotência e Purga:** Criados os testes unitários herméticos `test_sync_progression_path_is_idempotent_and_updates_in_place` e `test_sync_progression_path_purges_orphans_when_step_is_removed`.

---

## Reunião 3: Frontend Team & Tech Lead — Protocolo WebSocket, State Machine e UX do Wizard

- **Data:** 13 de Outubro de 2026
- **Participantes:** Frontend Lead, Mid Frontend Developer, Junior Frontend Developer, Tech Lead.
- **Pauta:**
  1. Ciclo de vida do componente `AIConfigModal.jsx` e listeners de eventos Socket.IO.
  2. Tratamento de desconexões, timeouts silenciosos e deadlocks de interface.
  3. Máquina de estados da flag `isDraft` e desbloqueio da Etapa 6 do Wizard de Atividades.

### Discussões Técnicas:
O Mid Frontend Developer apresentou a investigação sobre o problema relatado pelo usuário ("Eu testei e não funcionou"). 
Dois problemas front-end foram dissecados:
1. **O Deadlock de 120 segundos:** O cliente SocketIO se conectava e ingressava na sala `user_ai_<id>`. Se o evento `ai_progress` ou `ai_complete` sofresse atraso ou chegasse com formato de payload ligeiramente diferente (`data.room_id !== expectedRoom`), o modal permanecia travado em "Estabelecendo conexão neural..." até estourar o timeout de segurança de 120s.
2. **O Bloqueio do Wizard na Etapa 6:** Quando o roteiro gerado pela IA era inserido na trilha, cada nó recebia a propriedade `isDraft: true`. No fluxo do professor, ao clicar no nó para revisar o conteúdo (ex: alterar opções do quiz) e salvar localmente, o manipulador `handleSaveContentLocally` em `ActivityCreationPage.jsx` gravava os dados, mas mantinha `isDraft: true`. Ao avançar para a Etapa 6 (Revisão e Publicação), o validador `wizardStepValidators.js` impedia a publicação alegando que havia passos não revisados.

### Deliberações e Ações:
1. **Ação Imediata Executada:** No `AIConfigModal.jsx`, a verificação de sala foi flexibilizada para aceitar pacotes com `data.room_id === expectedRoom` ou pacotes direcionados na sala do socket, e o temporizador de segurança agora é renovado a cada evento recebido.
2. **Ação Imediata Executada:** No `ActivityCreationPage.jsx`, o método `handleSaveContentLocally` agora define explicitamente `isDraft: false` no passo editado pelo professor ao salvar.
3. **Validação de Build:** Executado `npm run build` no frontend com sucesso total, sem quebras de bundle ou warnings de sintaxe.

---

## Reunião 4: Especialistas em IA & Backend Lead — Engenharia de Prompts, Estrutura Cognitiva e Resiliência Gemini

- **Data:** 13 de Outubro de 2026
- **Participantes:** Especialista em IA/LLM, Backend Lead, Tech Lead.
- **Pauta:**
  1. Eficácia e segurança dos prompts construídos por `AIPromptBuilder.py`.
  2. Hierarquia de modelos do Google Gemini e política de failover (BYOK vs Sistema).
  3. Prevenção de alucinações e parsing resiliente de JSON / Markdown livre.

### Discussões Técnicas:
O Especialista em IA analisou a estrutura do `AIPromptBuilder.py`. O construtor adota práticas modernas de engenharia de prompt:
- Separação entre Persona de Sistema (`system_instruction`) e Instrução de Execução (`user_prompt`).
- Enquadramento seguro contra injeção de prompt usando delimitadores XML `<user_input>`.
- Curva de progressão pedagógica com base na razão `progress_ratio`:
  - 0% a 35%: Introdução e problematização.
  - 35% a 75%: Aprofundamento conceitual e arquitetural.
  - 75% a 100%: Clímax prático, casos reais de produção e quiz acumulativo.
- Memória contextual acumulada (`execution_trace` com `last_narrative_event`, `last_taught_concept`).

Em relação aos modelos, foi confirmada a hierarquia:
1. `gemini-2.5-flash-lite`: Utilizado prioritariamente para quizzes e passos rápidos (baixa latência e menor custo).
2. `gemini-2.5-flash`: Utilizado para narrativas e conteúdos conceituais de maior raciocínio.
3. `gemini-flash-latest` / `gemini-3.6-flash`: Contingências para saturação de taxa (HTTP 429).
4. `_get_fallback_content`: Fallback sintético local caso haja indisponibilidade de rede ou chave de API ausente.

Foi destacada a importância de nunca tentar fazer parse de JSON em passos do tipo `content` (artigo Markdown livre), garantindo que o texto seja encapsulado diretamente no campo `text_content`.

### Deliberações e Ações:
1. **Ação Imediata Executada:** Manutenção da separação de System Instruction e JSON Schema estrito para narrativas e quizzes.
2. **Melhoria Implementada:** Validador sintático e semântico `_validate_content_integrity` com testes unitários cobrindo todos os tipos de passos em `test_ai_draft_pipeline.py`.

---

## Reunião 5: AppSec & DevSecOps — Threat Modeling (STRIDE), Proteção de Segredos e LGPD

- **Data:** 13 de Outubro de 2026
- **Participantes:** AppSec Lead, DevSecOps Engineer, Software Architect.
- **Pauta:**
  1. Modelagem de Ameaças (STRIDE) no pipeline de orquestração de IA.
  2. Tratamento seguro de credenciais BYOK (Bring Your Own Key).
  3. Proteção contra Prompt Injection direto e indireto.
  4. Proteção de Dados Pessoais (LGPD) e higienização de logs.

### Discussões Técnicas:
O AppSec Lead conduziu a análise dos 6 vetores do STRIDE:
- **Spoofing:** O endpoint `/api/content_editor/orchestrate` exige JWT válido via `@jwt_required()`. O `user_id` é extraído do token e não de parâmetros fornecidos pelo cliente.
- **Tampering:** A rota valida se o usuário possui papel de professor ou se é o autor legítimo da atividade antes de permitir mutações.
- **Repudiation:** As ações críticas geram eventos auditados em `EventLog` via `_log_system_event`.
- **Information Disclosure:** Chaves de API do Google Gemini nunca são enviadas de volta ao frontend nas respostas HTTP e nunca são gravadas em texto plano nos logs da aplicação. Ao final de cada execução com BYOK, a chave padrão do sistema é reconfigurada globalmente no SDK para evitar contaminação cruzada.
- **Denial of Service:** Foi avaliado o risco de um professor disparar milhares de gerações consecutivas. Foi recomendada a inclusão de rate limit por usuário.
- **Elevation of Privilege:** Alunos são impedidos de iniciar a orquestração (RBAC).

Adicionalmente, foi verificada a atuação da biblioteca `text_sanitizer.py`:
A função `detect_prompt_injection` analisa o título e o foco pedagógico contra mais de 10 padrões maliciosos conhecidos (`ignore all previous instructions`, `bypass`, `jailbreak`, `developer mode`), abortando com HTTP 400 antes de repassar os dados ao LLM.

### Deliberações e Ações:
1. **Ação Imediata Executada:** Criado o teste unitário de segurança `test_orchestrate_route_blocks_prompt_injection` garantindo bloqueio automático de entradas maliciosas com código HTTP 400.
2. **Higienização de Auditoria:** Removida a possibilidade de exceptions de request context vazarem stack traces em logs do sistema.

---

## Reunião 6: DevOps & SRE — Escalabilidade, Concorrência de Threads e Observabilidade

- **Data:** 13 de Outubro de 2026
- **Participantes:** Site Reliability Engineer (SRE), DevOps Engineer, Backend Lead.
- **Pauta:**
  1. Concorrência e threading: `socketio.start_background_task` vs filas distribuídas (Celery/Redis).
  2. Compatibilidade com Eventlet e Green Threads.
  3. Métricas de latência (SLI/SLO) e gestão de falhas transitórias.

### Discussões Técnicas:
O SRE analisou os logs de teste e identificou avisos sobre a biblioteca Eventlet:
`DeprecationWarning: Eventlet is deprecated...`
No estado atual, o servidor utiliza `socketio.start_background_task(orchestrate_worker, app, data, room_id)` com `socketio.sleep(0)` para forçar o chaveamento cooperativo de contexto (*greenlet yield*).
Para a escala atual, o modelo de background task atende aos requisitos sem a necessidade de infraestrutura pesada adicional (Redis/RabbitMQ/Celery workers).
No entanto, como meta de médio prazo para o roadmap de infraestrutura, o SRE e o DevOps recomendaram:
1. Migração futura do async_mode do Socket.IO de `eventlet` para `gevent` ou workers ASGI nativos (`uvicorn` / `asyncio`).
2. Introdução de Circuit Breaker para chamadas de APIs de terceiros (o ecossistema do backend já conta com a estrutura `CircuitBreakerRegistry` pronta em `app/utils/resilience/circuit_breaker.py`).

### Deliberações e Ações:
1. **Resiliência do Worker:** Em caso de exceção não tratada na thread de segundo plano, o worker emite `ai_error` com mensagem amigável para a sala do usuário, liberando a interface do professor e impedindo processos zumbis.
2. **Backoff com Jitter:** O `AIService` implementa retentativa com espera incremental em caso de `google_exceptions.ResourceExhausted` (429) antes de degradar para o próximo modelo.

---

## Reunião 7: QA & SDET — Pirâmide de Testes, Hermetismo e Testes de Resiliência

- **Data:** 13 de Outubro de 2026
- **Participantes:** QA Lead, Software Development Engineer in Test (SDET), Junior QA.
- **Pauta:**
  1. Estrutura da suíte de testes automatizados para o subsistema de IA.
  2. Hermetismo dos testes (SQLite em memória, zero chamadas externas de rede).
  3. Cobertura de testes e prevenção de regressão na branch `fix/ai-draft-generation-pipeline`.

### Discussões Técnicas:
O SDET revisou o novo arquivo `backend/tests/test_ai_draft_pipeline.py`.
Foi destacado que os testes anteriores não validavam a integração entre a rota de orquestração, os sockets e as tabelas filhas.
A suíte foi expandida para contemplar a pirâmide de testes completa:
1. **Testes Unitários:** Validação estrita de integridade de schemas gerados (`test_ai_service_validation_integrity`).
2. **Testes de Integração de Serviços:**
   - Criação relacional de entidades (`test_sync_progression_path_contents_creates_relational_entities`).
   - Idempotência de atualização (`test_sync_progression_path_is_idempotent_and_updates_in_place`).
   - Sincronização via ciclo de vida `update_activity` (`test_update_activity_synchronizes_new_ai_generated_contents`).
   - Exclusão de passos órfãos (`test_sync_progression_path_purges_orphans_when_step_is_removed`).
3. **Testes de Contrato de API e Segurança:**
   - Iniciação de orquestração com 202 Accepted (`test_orchestrate_route_accepts_valid_payload_and_creates_room`).
   - Bloqueio de injeção de prompt com 400 Bad Request (`test_orchestrate_route_blocks_prompt_injection`).

Todos os testes utilizam banco de dados efêmero em memória (`sqlite:///:memory:`) e fixtures isoladas em `conftest.py`, com execução total de 34 testes em ~16 segundos.

### Deliberações e Ações:
1. **Resultado da Suíte:** 100% de aprovação (34/34 testes passando, sendo 7 dedicados ao pipeline de IA).
2. **Gate de CI/CD:** Aprovada a inclusão de `backend/tests/test_ai_draft_pipeline.py` no pipeline automatizado de testes contínuos.

---

## Reunião 8: Product Owner & Requirements Engineer — Valor Pedagógico, Critérios BDD e Regras de Negócio

- **Data:** 13 de Outubro de 2026
- **Participantes:** Product Owner (PO), Requirements Engineer, Scrum Master.
- **Pauta:**
  1. Proposta de valor pedagógica do gerador de rascunhos.
  2. Filosofia: "A IA propõe, o professor dispõe" (Curadoria Humana Obrigatória).
  3. Formalização dos Critérios de Aceite em formato BDD (Behavior-Driven Development).

### Discussões Técnicas:
O Product Owner enfatizou a premissa educacional central da plataforma: a inteligência artificial generativa **não substitui o professor**; ela atua como um co-piloto pedagógico para reduzir o atrito inicial da "página em branco" na elaboração de atividades gamificadas.
Por essa razão, qualquer conteúdo gerado pela IA **deve nascer obrigatoriamente como rascunho (`isDraft: true`)**.
O Requirements Engineer estruturou os cenários de aceite em Gherkin:

```gherkin
Cenário: Geração de Rascunho com Sucesso via IA
  Dado que o professor está autenticado e no editor de tabuleiro
  Quando ele configura o tema, tom e clica em "Gerar Conteúdo com IA"
  Então o sistema deve processar os passos assincronamente
  E exibir o progresso em tempo real no modal
  E injetar o conteúdo de cada nó no tabuleiro com status "isDraft: true"

Cenário: Revisão e Homologação Pedagógica pelo Professor
  Dado que um nó do tabuleiro possui status "isDraft: true"
  Quando o professor abre o modal de edição do nó, ajusta os textos e salva
  Então o status do nó deve mudar para "isDraft: false"
  E as tabelas relacionais dedicadas devem ser sincronizadas imediatamente
  E a Etapa 6 do Wizard deve permitir a publicação da atividade
```

### Deliberações e Ações:
1. **Aprovação das Regras:** Regras de negócio formalizadas e homologadas pelo PO.
2. **Backlog Atualizado:** Critérios de aceite incorporados nas histórias de usuário de criação de atividades gamificadas.

---

## Reunião 9: Product Designer & Frontend Lead — Experiência do Usuário (UX/UI), Design System e Acessibilidade

- **Data:** 13 de Outubro de 2026
- **Participantes:** Product Designer (UX/UI), Frontend Lead, UI Engineer.
- **Pauta:**
  1. Usabilidade do `AIConfigModal.jsx` e transições do `GameBoardEditor.jsx`.
  2. Microinterações e feedback visual de progresso (0% a 100%).
  3. Acessibilidade (WCAG 2.1 AA) e estados de erro amigáveis.

### Discussões Técnicas:
O Product Designer analisou a jornada do usuário dentro do modal do Roteirista Virtual:
1. **Clareza de Etapas:** O modal apresenta a configuração em dois passos intuitivos (foco pedagógico/público-alvo e personagens/tom).
2. **Feedback em Tempo Real:** Durante a geração, a barra de progresso com gradiente púrpura/índigo e mensagens dinâmicas ("Criando Quiz...", "Finalizando roteiro...") reduz a ansiedade do usuário em operações que levam entre 5 e 20 segundos.
3. **Prevenção de Cliques Duplos:** O botão "Gerar Roteiro com IA" é desabilitado assim que o loading se inicia, prevenindo requisições concorrentes duplicadas.
4. **Acessibilidade:**
   - Mensagens de erro em toasts de alto contraste.
   - Fechamento com tecla Escape e botão cancelar desabilitado apenas durante a escrita crítica para evitar estados inconsistentes.
   - Suporte a leitura de tela com indicadores semânticos.

O Frontend Lead confirmou que o visual segue estritamente o Design System do Portal Gamificação (Tailwind CSS com paleta de cores corporativa, sombras e cantos arredondados padronizados).

### Deliberações e Ações:
1. **Ajuste de Feedback:** Garantido que a barra de progresso alcance 100% com mensagem visual de confirmação antes do fechamento automático do modal.
2. **Aprovação de UX:** O fluxo de interação foi validado e aprovado pela equipe de design.

---

## Reunião 10: Conselho Executivo / Engineering Management & Tech Lead — Síntese, ADRs e Definition of Done

- **Data:** 13 de Outubro de 2026
- **Participantes:** Engineering Manager, Tech Lead, Arquiteto de Software, Product Owner, AppSec Lead, QA Lead.
- **Pauta:**
  1. Consolidação de todas as deliberações das 9 reuniões anteriores.
  2. Emissão e aprovação formal dos Registros de Decisão de Arquitetura (ADRs).
  3. Validação do Definition of Done (DoD) e fechamento do ciclo de correções.

### 1. Síntese Executiva do Ciclo
A equipe realizou uma auditoria ponta a ponta e eliminou todos os pontos de atrito identificados pelo usuário no pipeline de IA. O sistema agora opera com:
- **Alta Coesão e Baixo Acoplamento:** Módulos com fronteiras de responsabilidade bem demarcadas (transporte HTTP/WS, orquestração de IA, construção de prompts e persistência relacional).
- **Consistência de Dados Garantida:** Sincronização atômica entre o JSON da trilha e as tabelas filhas `QuizContent`, `NarrativeContent` e `LearningContent`, com purga automática de passos órfãos.
- **Segurança Reforçada:** Autenticação JWT obrigatória, isolamento de salas de WebSocket por usuário e blindagem contra injeção de prompt.
- **Qualidade Assegurada:** 34 testes automatizados em verde e build do frontend verificado.

---

### 2. Registros de Decisões de Arquitetura (ADRs)

#### ADR-014: Sincronização Híbrida JSONB-Relacional no Ciclo de Vida de Atividades
- **Status:** Aprovado
- **Contexto:** A interface gráfica do tabuleiro (React Flow) opera eficientemente com uma estrutura de grafo serializada em JSONB (`Activity.gamification_design`). Entretanto, a execução pedagógica, estatísticas, respostas dos alunos e auditoria necessitam de tabelas normalizadas (`QuizContent`, `NarrativeContent`, `LearningContent`).
- **Decisão:** Manter a persistência híbrida através do método `sync_progression_path_contents(activity_id, progression_path, purge_orphans=True)`. A camada de serviço reconcilia as tabelas relacionais de forma idempotente em todas as mutações da atividade.
- **Consequências:** Elimina duplicações e dados órfãos; mantém a flexibilidade do grafo no frontend e a integridade referencial no banco relacional.

#### ADR-015: Isolamento Estrito de Salas WebSocket para Geração com IA
- **Status:** Aprovado
- **Contexto:** Múltiplos professores podem gerar conteúdos de IA simultaneamente no portal. Transmissões globais ou não roteadas causavam perda de pacotes e contaminação entre clientes.
- **Decisão:** Toda comunicação de progresso (`ai_progress`), conclusão (`ai_complete`) e erro (`ai_error`) é roteada estritamente para a sala privada `user_ai_<user_id>` usando `room=room_id` em todas as emissões.
- **Consequências:** Isolamento completo de tráfego, confidencialidade entre docentes e resolução de deadlocks no frontend.

#### ADR-016: Governança de Modelos LLM, BYOK e Hierarquia de Contingência
- **Status:** Aprovado
- **Contexto:** O uso de IA em escala educacional exige tolerância a rate limits (HTTP 429), controle de custos e suporte para que professores utilizem chaves próprias do Google Gemini.
- **Decisão:** Implementar failover em quatro camadas:
  1. Chave BYOK do usuário (se configurada no perfil);
  2. Modelo rápido `gemini-2.5-flash-lite` para tarefas objetivas (quizzes);
  3. Modelo de raciocínio `gemini-2.5-flash` para narrativas e desenvolvimento conceitual;
  4. Fallback sintético local caso as cotas de todos os modelos sejam esgotadas.
- **Consequências:** Confiabilidade de 100% de disponibilidade da ferramenta, mesmo sob restrições severas de infraestrutura externa.

#### ADR-017: Validação Humana Mandatória de Rascunhos Pedagógicos (`isDraft` Lifecycle)
- **Status:** Aprovado
- **Contexto:** Conteúdos gerados por IA generativa podem conter imprecisões conceituais ou alucinações que requerem curadoria docente antes de serem expostos a estudantes.
- **Decisão:** Todos os conteúdos gerados por IA recebem a marcação `isDraft: true`. A validação humana ocorre quando o professor revisa o nó no editor e salva suas alterações, momento no qual a flag é atualizada para `isDraft: false`. A Etapa 6 do Wizard exige que todos os passos ativos estejam validados (`isDraft: false`) para permitir a publicação oficial da atividade.
- **Consequências:** Garantia da excelência pedagógica, conformidade ética com uso de IA na educação e autonomia docente.

---

### 3. Definition of Done (DoD) Consolidada e Aprovada

Para que qualquer evolução futura no pipeline de IA seja considerada concluída, ela deve satisfazer:
1. **Código e Padrões:** Seguir Clean Architecture, tipagem e convenções de linter do repositório.
2. **Persistência Relacional:** Toda mutação de trilha deve manter consistência atômica via `sync_progression_path_contents`.
3. **Isolamento de Comunicação:** Todo evento WebSocket deve ser emitido com `room=room_id` correspondente à sala do usuário autenticado.
4. **Testes Automatizados:** Testes unitários e de integração herméticos (SQLite em memória) com 100% de sucesso na suíte do Pytest.
5. **Segurança e Privacidade:** Sanitização de entradas contra prompt injection, proteção de chaves de API e zero dados sensíveis em logs.
6. **Compilação do Frontend:** Execução de `npm run build` sem erros.
7. **Documentação:** Atualização correspondente na pasta `docs/architecture/` e registro de ADR se houver decisão estrutural.
