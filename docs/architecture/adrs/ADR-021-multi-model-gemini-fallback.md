# ADR-021: Estratégia Multi-Modelo com Fallback de Cotas no Google Gemini

- **Status:** Aceito
- **Data:** 2025-12-05
- **Categoria:** Infraestrutura e Ferramentas
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

A funcionalidade de assistência pedagógica por IA (geração de roteiros, diálogos socráticos e questões de quiz) realiza múltiplas chamadas encadeadas à API generativa. O uso de um único modelo na camada gratuita resultava em frequentes bloqueios de taxa de limite (HTTP 429 - Rate Limit / Quota Exceeded), paralisando o trabalho do professor durante a criação de atividades.

---

## 2. Decisão

Implementar uma arquitetura de cascata hierárquica multi-modelo utilizando o Google GenAI SDK. O serviço `ai_service.py` dispara requisições obedecendo a seguinte ordem de fallback: 1) `gemini-2.5-flash-lite` (modelo de alta velocidade e cotas generosas); 2) `gemini-2.5-flash` (caso o Lite esteja instável); 3) `gemini-flash-latest` (legado de contingência); 4) Caso todos os modelos em nuvem atinjam cota, o sistema aciona um gerador heurístico sintético local baseado em templates sem quebrar o fluxo da UI.

---

## 3. Consequências

- **Positiva:** Resiliência absoluta contra erros 429: o professor nunca fica bloqueado no meio da criação.
- **Positiva:** Aproveitamento das cotas gratuitas independentes de cada família de modelos do Google AI Studio.
- **Positiva:** Degradação graciosa e transparente para o usuário final.
- **Negativa/Trade-off:** Diferenças sutis no estilo de escrita entre os modelos em caso de fallback.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
