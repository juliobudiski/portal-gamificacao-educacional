---
id: US-13
title: "Chat da Turma em Tempo Real via WebSockets (Socket.IO)"
epic: "[[EPIC-05-comunicacao-forum-e-chat]]"
type: user-story
status: implemented
priority: medium
tags: [requisito, agile, bdd, swebok, gamificacao]
ports: ["[[ISendChatMessageUseCase]]", "[[IChatRepositoryPort]]"]
classes: ["[[ChatMessage]]", "[[Conversation]]", "[[SocketChatNamespace]]"]
tables: ["[[chat_message]]", "[[conversation]]", "[[conversation_participants]]"]
tests: ["[[test_api_contracts_bdd.py]]"]
---

# US-13: Chat da Turma em Tempo Real via WebSockets (Socket.IO)

- **Épico Vinculado:** [[EPIC-05-comunicacao-forum-e-chat]]
- **Prioridade (MoSCoW):** `MEDIUM`
- **Status de Homologação:** `implemented`

---

## 1. Descrição e Proposta de Valor

**Como** Estudante e Professor,  
**Quero** conversar em tempo real com meus colegas de turma dentro da atividade,  
**Para que** possamos tirar dúvidas rápidas e coordenar trabalhos em equipe com agilidade.

---

## 2. Critérios de Aceite em BDD (Quádrupla Cobertura Obrigatória)

### 2.1 Caminho Feliz (Happy Path)
```gherkin
Cenário: Envio e recebimento instantâneo de mensagem de chat
  Dado que dois estudantes estão conectados na sala virtual da atividade "Atividade 1"
  Quando o estudante A digita "Alguém conseguiu resolver o nó 3?" e clica em enviar
  Então a mensagem é transmitida via evento WebSocket "send_message"
  E persistida na tabela "chat_message"
  E transmitida instantaneamente ("broadcast") para todos os clientes conectados na sala sem recarregar a tela
```

### 2.2 Caminho Alternativo (Alternative Path)
```gherkin
Cenário: Denúncia de mensagem ofensiva (Moderação)
  Dado que um usuário envia conteúdo inadequado no chat
  Quando outro aluno clica em "Denunciar Mensagem"
  Então um registro na tabela "message_report" é criado com status "pending" para auditoria do docente
```

### 2.3 Fluxo de Exceção (Exception Flow)
```gherkin
Cenário: Tentativa de enviar mensagem para sala da qual o usuário não é membro
  Dado que um estudante não está matriculado na turma B
  Quando ele tenta emitir um evento de socket para a sala da turma B
  Então o manipulador de eventos verifica a autorização e desconecta o cliente da sala com erro de autorização
```

### 2.4 Teste Destrutivo / Caos (Chaos Monkey)
```gherkin
Cenário: Queda e reconexão espontânea de rede móvel (Resiliência)
  Dado que a conexão do aluno sofre oscilação temporária de internet
  Quando o cliente Socket.IO perde o heartbeat
  Então o cliente entra em modo de reconexão automática com backoff exponencial
  E ao restabelecer conexão reintegra a sala e busca as últimas mensagens persistidas
```

---

## 3. Rastreabilidade Arquitetural (Hexagonal Ports & Adapters)

- **Portas de Entrada / Casos de Uso:** "[[ISendChatMessageUseCase]]", "[[IChatRepositoryPort]]"
- **Classes de Domínio e Entidades:** "[[ChatMessage]]", "[[Conversation]]", "[[SocketChatNamespace]]"
- **Tabelas Relacionais (Neon PostgreSQL):** "[[chat_message]]", "[[conversation]]", "[[conversation_participants]]"
- **Suíte de Testes Automatizados:** "[[test_api_contracts_bdd.py]]"

---

## 4. Referências Cruzadas
- **Visão Geral do Backlog:** [[docs/backlog/README.md]]
- **Diagramas de Arquitetura:** [[docs/architecture/c4_context_container_diagrams.md]]
- **Modelo de Dados:** [[docs/architecture/data_model_erd.md]]
