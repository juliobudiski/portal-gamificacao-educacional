---
name: product-design
description: >-
  Use this skill when conducting user research (UX research), structuring information architecture,
  designing UI flows and high-fidelity mockups/prototypes, running usability tests, and maintaining accessible design systems (WCAG).
---

# Habilidades Essenciais do Product Designer (UI/UX) & UX Researcher

Este guia e conjunto de habilidades consolida os métodos e práticas para conduzir descoberta contínua, desenhar interfaces intuitivas e acessíveis e governar sistemas de design consistentes.

---

## 1. Descoberta Contínua (Product Discovery) e Pesquisa de Usuário

1. **Métodos de Investigação:**
   - **Pesquisa Qualitativa:** Entrevistas contextuais para entender motivações, bloqueios mentais e sentimentos dos usuários.
   - **Pesquisa Quantitativa:** Pesquisas de satisfação (CSAT, CES, SUS - System Usability Scale) e análise de funis de conversão/abandono de fluxo.
   - **Testes de Usabilidade:** Sessões com tarefas guiadas observando tempo de conclusão, caminhos percorridos, pontos de hesitação e erros cometidos.

2. **Mapeamento de Experiência:**
   - Construir Mapas de Jornada do Usuário (*User Journey Maps*) evidenciando:
     - Etapa da jornada $\rightarrow$ Ação executada $\rightarrow$ Pensamento/expectativa $\rightarrow$ Ponto de atrito $\rightarrow$ Oportunidade de melhoria de design.

---

## 2. Arquitetura de Informação e Design de Fluxos

1. **Hierarquia e Navegação Lógica:**
   - Agrupar e rotular conteúdos utilizando a linguagem natural do usuário (evitar termos internos técnicos).
   - Validar árvores de menu e taxonomia por meio de *Card Sorting* (aberto/fechado) e *Tree Testing*.

2. **Design de Estados de Interface (UI States):**
   - Garantir que cada tela e componente contemple todos os estados possíveis:
     - **Estado Ideal (Ideal State):** Interface populada com dados ricos.
     - **Estado Vazio (Empty State):** Primeira utilização ou ausência de dados, com orientação clara e convite para ação (*Call to Action*).
     - **Estado de Carregamento (Loading State):** Esqueletos (*Skeleton screens*) ou indicadores de progresso contextualizados para reduzir percepção de espera.
     - **Estado de Erro (Error State):** Mensagens compreensíveis, acionáveis e humanizadas, orientando o usuário sobre como se recuperar da falha.
     - **Estado Parcial:** Listagens truncadas, filtros sem resultados.

---

## 3. UI Design e Prototipagem de Alta Fidelidade

1. **Princípios de Design Visual e Gestalt:**
   - **Proximidade e Agrupamento:** Elementos relacionados agrupados visualmente com espaçamento coerente.
   - **Hierarquia Tipográfica:** Uso intencional de escalas modulares de tamanho e peso para guiar a leitura (Títulos, Subtítulos, Corpo de texto, Legendas).
   - **Uso Semântico da Cor:** Cores de status funcionais (sucesso, alerta, erro, neutro) com significado inequívoco e independente apenas da tonalidade.

2. **Prototipagem Interativa e Microinterações:**
   - Transições suaves que transmitem continuidade física aos olhos do usuário.
   - Feedbacks visuais e hápticos imediatos para interações (cliques, toques, submissões de formulário).

---

## 4. Design Systems e Acessibilidade Digital (WCAG 2.1 / 2.2 AA)

1. **Design Tokens:**
   - Padronizar variáveis fundamentais: paleta de cores (primárias, superfícies, textos), escalas de espaçamento (base 4px/8px), raios de borda e níveis de elevação (sombras).
   - Garantir sincronização transparente entre tokens no design e variáveis CSS/Tailwind no código frontend.

2. **Acessibilidade Universal Obrigatória:**
   - **Contraste de Cores:** Mínimo de $4.5:1$ para texto normal e $3:1$ para texto grande ou componentes interativos fundamentais.
   - **Navegabilidade por Teclado:** Ordem lógica de foco (tab order) e indicadores visuais claros de foco (*focus visible outline*).
   - **Semântica e Leitores de Tela:** Uso correto de tags HTML semânticas (`<nav>`, `<main>`, `<article>`, `<button>`, `<fieldset>`) e atributos ARIA somente quando estritamente necessários.
   - **Tamanho de Alvos de Toque (Touch Targets):** Mínimo de 44x44px em interfaces sensíveis ao toque (mobile).
