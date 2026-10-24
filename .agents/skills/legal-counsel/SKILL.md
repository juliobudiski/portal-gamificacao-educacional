---
name: legal-counsel
description: >-
  Use this skill when analyzing legal compliance for software systems, drafting Terms of Service (Termos de Uso) and Privacy Policies (LGPD/GDPR), advising on corporate entity requirements (CNPJ, MEI vs ME), tax obligations with Receita Federal (Carnê-Leão vs Simples Nacional), and software copyright/registration (INPI).
---

# Habilidades Essenciais do Advogado Especialista em Software & SaaS

Este guia e conjunto de habilidades consolida as diretrizes jurídicas, tributárias e regulatórias aplicáveis a produtos digitais (Software as a Service - SaaS) no Brasil, assegurando conformidade estrita com a legislação civil, consumerista, de dados e fiscal.

---

## 1. Enquadramento Fiscal e Tributário (Receita Federal)

### A. Quando Começar a Pagar Impostos?
- **Regra Fundamental:** Toda e qualquer receita financeira proveniente de prestação de serviços ou licenciamento de software deve ser tributada **desde o 1º real faturado (1º usuário pagante)**. Não existe faixa de isenção de faturamento operacional.

### B. Pessoa Física (CPF) vs. Pessoa Jurídica (CNPJ)

1. **Fase Inicial / MVP (Recebimento na Pessoa Física via Carnê-Leão):**
   - **Mecanismo:** Declaração mensal obrigatória no sistema **Carnê-Leão Web** da Receita Federal.
   - **Tabela Progressiva:** O imposto de renda da PF incide com alíquotas que variam de 0% a **27,5%**, acrescido de contribuição previdenciária (INSS de 20% sobre o rendimento como autônomo).
   - **Inviabilidade Econômica:** Faturando valores acima de R$ 2.826,65/mês, a alíquota já atinge 15% a 27,5%, tornando o recebimento via CPF altamente desvantajoso.

2. **Fase Profissionalizada (Abertura de Pessoa Jurídica - CNPJ):**
   - **Atenção ao MEI (Microempreendedor Individual):** O desenvolvimento e licenciamento de software customizável ou SaaS **NÃO é permitido como MEI** (vedação do art. 17 da LC 123/2006 para atividades intelectuais e de informática sob o CNAE 6202-3/00 e 6203-1/00).
   - **Modelo Recomendado (Microempresa - ME no Simples Nacional):**
     - **CNAE 62.03-1/00:** Desenvolvimento e licenciamento de programas de computador não-customizáveis (SaaS padrão).
     - **Tributação (Anexo III do Simples Nacional):** Alíquota inicial de apenas **6,0%** sobre o faturamento bruto mensal até R$ 180.000,00/ano (com Fator R adequado via pró-labore), gerando enorme economia tributária em comparação aos 27,5% da Pessoa Física.
   - **Gatilho Prático para CNPJ:** Recomenda-se abrir a ME (ou SLU - Sociedade Limitada Unipessoal) assim que o faturamento recorrente superar **R$ 2.000,00 a R$ 3.000,00/mês**, ou imediatamente caso o intermediador de pagamentos (Mercado Pago / Asaas / Stripe) exija conta jurídica para volume ou emissão automática de NF-e (Nota Fiscal de Serviços Eletrônica).

---

## 2. Proteção de Dados e Privacidade (LGPD - Lei nº 13.709/2018)

Para aplicações de software e produtos digitais multi-usuário:

1. **Princípios Mandatórios:**
   - **Minimização de Dados (Art. 6º, III):** Coletar estritamente o necessário (Identificador único, e-mail institucional e telemetria básica anti-fraude). Proibir armazenamento desnecessário de dados de geolocalização contínua (apenas conferência momentânea em memória quando estritamente necessária).
   - **Base Legal Adequada (Art. 7º):**
     - Para o Usuário Pagante/Contratante: *Execução de Contrato* (Art. 7º, V) e *Cumprimento de Obrigação Legal/Fiscal* (Art. 7º, II).
     - Para Usuários Finais/Consumidores: *Legítimo Interesse* (Art. 7º, IX) ou *Execução de Procedimentos Vinculados à Prestação de Serviços*.
   - **Segurança da Informação (Art. 46):** Emprego de criptografia em trânsito (TLS 1.3), tokens efêmeros de autenticação (JWT assinado com HS256/RS256) e algoritmo RFC 6238 para duplo fator de autenticação.

2. **Direitos dos Titulares (Art. 18):**
   - Disponibilizar mecanismo para o titular solicitar confirmação de tratamento, acesso, retificação de dados incorretos e exclusão de cadastros inativos.

---

## 3. Elaboração de Termos de Uso e Política de Privacidade

Todo software que efetua cobrança e intermediação de dados deve possuir termos aceitos no primeiro acesso:

1. **Cláusulas Indispensáveis nos Termos de Aceite:**
   - **Licenciamento de Uso (SaaS):** Concessão de licença de uso limitada, revogável, não-exclusiva e intransferível.
   - **Assinatura e Renovação:** Detalhamento explícito das modalidades oferecidas pelo produto:
     - Assinatura Mensal Recorrente (ex.: renovação automática com cancelamento simples).
     - Acesso Avulso / Pré-pago (ex.: período determinado sem renovação automática).
     - Planos Periódicos com Desconto (ex.: Semestral ou Anual).
   - **Política de Reembolso e Cancelamento:** Conformidade com o Art. 49 do Código de Defesa do Consumidor (direito de arrependimento em até 7 dias da primeira contratação online).
   - **Disponibilidade e Isenção de Responsabilidade (SLA):** Esclarecimento de que a plataforma opera sob padrão comercial de melhor esforço (*best efforts*), isentando-se de responsabilidade por instabilidades de conexão do usuário ou falhas em dispositivos locais.
   - **Propriedade Intelectual:** Proteção do código-fonte, layout, marcas e mecânicas proprietárias nos termos da Lei do Software (Lei nº 9.609/1998) e Lei de Direitos Autorais (Lei nº 9.610/1998).

---

## 4. Registro de Software no INPI (Instituto Nacional da Propriedade Industrial)

- **Obrigatoriedade:** O registro de software **não é obrigatório** para comercialização ou cobrança no Brasil (o direito nasce automaticamente com a criação do código, conforme o Art. 2º da Lei 9.609/98).
- **Quando Fazer o Registro:** Recomenda-se registrar o código no INPI (gerando o hash criptográfico do código-fonte) quando:
  - O produto atingir validação de mercado e escala comercial relevante.
  - Houver captação de investimento externo, editais governamentais ou parcerias institucionais.
  - O criador desejar presunção absoluta de anterioridade jurídica contra plágio de concorrentes.
