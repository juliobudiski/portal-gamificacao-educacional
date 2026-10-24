# ADR-022: Stack de Produção Cloud: Vercel, Render e Neon PostgreSQL

- **Status:** Aceito
- **Data:** 2026-01-27
- **Categoria:** Infraestrutura e Ferramentas
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A estratégia inicial de hospedar a solução completa no Vercel falhou porque o ambiente Serverless do Vercel encerra conexões efêmeras, sendo tecnicamente incapaz de manter WebSockets bidirecionais contínuos (necessários para o Chat da Turma e notificações da roleta). Além disso, o SQLite não suporta múltiplos acessos concorrentes em nuvem.

---

## 2. Decisão

Adotar uma arquitetura de nuvem híbrida desacoplada: 1) Frontend: hospedado no Vercel como Single Page Application estática de alta velocidade (CDN global Edge); 2) Backend: hospedado no Render.com como Web Service persistente em container Linux, garantindo execução contínua de workers Gunicorn com `gevent` e suporte a conexões long-polling/WebSocket via Flask-SocketIO; 3) Banco de Dados: Neon Serverless PostgreSQL na região São Paulo (AWS `sa-east-1`), oferecendo alta disponibilidade, pool de conexões e latência ultrabaixa para o Brasil.

---

## 3. Consequências

- **Positiva:** Suporte nativo a comunicação síncrona em tempo real (Chat/Socket.IO) sem restrições de serverless.
- **Positiva:** Banco de dados PostgreSQL corporativo gerenciado com backups automáticos e replicação.
- **Positiva:** Deploy contínuo e escalabilidade com custo zero no plano free/acadêmico.
- **Negativa/Trade-off:** Backend no Render pode apresentar delay de 'cold start' (50s) após períodos longos de inatividade no plano gratuito.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
