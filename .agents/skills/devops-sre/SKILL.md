---
name: devops-sre
description: >-
  Use this skill when designing infrastructure as code (IaC), configuring CI/CD pipelines, containerizing applications,
  implementing zero-downtime deployments, setting up observability (SLIs/SLOs, Prometheus, OpenTelemetry), and managing site reliability.
---

# Habilidades Essenciais do Engenheiro DevOps / SRE

Este guia e conjunto de habilidades define os procedimentos e padrões operacionais para provisionar infraestrutura segura, gerenciar esteiras automatizadas de entrega contínua e garantir a confiabilidade e resiliência de serviços em produção.

---

## 1. Infraestrutura como Código (IaC) e Imutabilidade

1. **Práticas com Terraform / OpenTofu:**
   - **Módulos Reutilizáveis:** Estruturar infraestrutura em módulos isolados com entradas e saídas tipadas.
   - **Estado Remoto Seguro:** Armazenar o `terraform.tfstate` em backend remoto com trava de concorrência (ex.: AWS S3 + DynamoDB locking ou equivalente) e criptografia em repouso.
   - **Infraestrutura Imutável:** Nunca realizar alterações manuais (*drift*) diretamente no console de nuvem ou em instâncias em execução.

2. **Containerização Segura e Otimizada:**
   - **Multi-Stage Builds:** Separar a etapa de compilação/build da imagem final para manter a imagem enxuta e livre de compiladores ou ferramentas desnecessárias.
   - **Imagens Não-Root:** Nunca executar processos dentro de containers como usuário `root`.
   - **Defesa de Vulnerabilidades:** Integrar scanners estáticos (ex.: Trivy, Grype) antes de publicar imagens nos registries.

---

## 2. Automação de CI/CD e Estratégias de Deploy

1. **Pipelines Eficientes e Paralelas:**
   - Executar verificações de linter, segurança estática e testes unitários de forma paralela para acelerar o ciclo de feedback da equipe.
   - Utilizar cache eficiente de camadas de dependências (npm, pip, docker layers).

2. **Estratégias de Deploy com Zero Downtime:**
   - **Rolling Update:** Atualização gradual de réplicas garantindo capacidade operacional durante o processo.
   - **Blue-Green Deployment:** Dois ambientes idênticos em paralelo; a alternância de tráfego ocorre no balanceador/roteador após validação dos testes de fumaça (*smoke tests*).
   - **Canary Release:** Liberação do novo release para uma pequena porcentagem do tráfego (ex.: 5%), monitorando métricas de erro antes da liberação total.
   - **Rollback Imediato:** Mecanismo automatizado de reversão acionado caso o percentual de erros 5xx ou latência p99 ultrapasse o limite acordado.

---

## 3. Práticas SRE, Observabilidade e Gestão de Incidentes

1. **Engenharia de Confiabilidade (SLI, SLO e Error Budget):**
   - **SLI (Indicador):** Métrica quantitativa de qualidade (ex.: taxa de requisições HTTP bem-sucedidas respondidas em menos de 300ms).
   - **SLO (Objetivo):** Alvo acordado (ex.: 99.5% das requisições atendendo ao SLI em uma janela de 30 dias).
   - **Error Budget (Orçamento de Erro):** A margem de falha tolerada ($100\% - 99.5\% = 0.5\%$). Quando o orçamento esgota, novos deploys de features são congelados para priorizar estabilidade.

2. **Os Três Pilares da Observabilidade na Prática:**
   - **Métricas:** Prometheus, Grafana ou Datadog para consumo de recursos, taxas de erro e latência.
   - **Logs Centralizados:** Formato estruturado (JSON), correlacionados por Trace ID e indexados com retenção planejada.
   - **Tracing Distribuído:** Instrumentação OpenTelemetry (OTel) para rastrear o caminho das requisições entre microsserviços e banco de dados.

3. **Alertas Acionáveis (*Actionable Alerts*):**
   - Alertas devem ser disparados apenas sobre sintomas que impactam o usuário (ex.: taxa de erros em alta ou SLO ameaçado), e nunca sobre causas efêmeras sem ação imediata necessária (ex.: pico temporário de CPU que logo normalizou).

---

## 4. Segurança Operacional (DevSecOps) e Continuidade de Negócios

1. **Gestão de Segredos:**
   - Proibição estrita de credenciais, chaves de API e senhas no código-fonte.
   - Injeção em tempo de execução via gerenciadores de segredos dedicados (Vault, Doppler, AWS Secrets Manager).

2. **Plano de Recuperação de Desastres (Disaster Recovery):**
   - Políticas automatizadas de backup periódico de bancos de dados.
   - Rotina regular de testes de restauração (RTO - Recovery Time Objective e RPO - Recovery Point Objective mensurados na prática).
