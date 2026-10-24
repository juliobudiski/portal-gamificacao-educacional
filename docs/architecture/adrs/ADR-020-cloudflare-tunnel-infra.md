# ADR-020: Abandono do Ngrok em Favor do Cloudflare Tunnel

- **Status:** Aceito
- **Data:** 2025-11-25
- **Categoria:** Infraestrutura e Ferramentas
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

Durante a realização de testes com escolas parceiras e bancas de demonstração da tese, a ferramenta ngrok (utilizada para expor o servidor local à internet) apresentava limitações severas na versão gratuita: URLs efêmeras que mudavam a cada reinicialização, telas intermediárias de aviso de segurança ('ngrok warning') e bloqueio arbitrário de requisições de API via fetch/axios.

---

## 2. Decisão

Migrar toda a camada de tunelamento e demonstração externa para o Cloudflare Tunnel (`cloudflared`). O túnel conecta o backend diretamente à rede edge da Cloudflare com domínio fixo com certificado SSL/TLS nativo, sem limites de requisições e sem páginas intermediárias de bloqueio.

---

## 3. Consequências

- **Positiva:** Conexão ultraestável com baixa latência e domínio customizado fixo para demonstrações.
- **Positiva:** Zero telas de aviso ou interferências em chamadas REST e conexões WebSocket.
- **Positiva:** Criptografia ponta a ponta e proteção contra ataques DDoS fornecida pela Cloudflare.
- **Negativa/Trade-off:** Requer instalação do binário `cloudflared` e autenticação com token de túnel no host de teste.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
