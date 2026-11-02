---
id: US-21
epic: EP-04-UX-UI-ENHANCEMENT
title: "Implementação da Segunda Rodada de Melhorias Estratégicas de UI/UX (Lote 21-40)"
status: Concluído
priority: Alta
skills_involved:
  - ux-instructional-design
  - product-owner
  - requirements-engineering
  - senior-development
  - code-reviewer
  - qa-sdet
  - appsec-security
  - critical-peer-review
---

# User Story: US-21 — Implementação da Segunda Rodada de Melhorias de UI/UX (Lote 21 a 40)

## 1. Descrição (Formato INVEST)
**Como** docente ou estudante engajado em atividades gamificadas no portal Gamefica.Edu,  
**Quero** ter acesso a justificativas pedagógicas detalhadas em quizzes, timer suave circular, proteção contra respostas em branco, histórico consultável de diálogos narrativos, visão em lista linear acessível do tabuleiro, simulador/clonagem rápida no banco de atividades, indicador de densidade cognitiva no wizard, modo sala de aula no ranking e comparativo explícito de moedas na loja,  
**Para que** a experiência de ensino-aprendizagem seja inclusiva, metacognitiva, transparente e psicometricamente robusta, sem fricção de interface ou frustração por decisões acidentais.

---

## 2. Critérios de Aceitação BDD (Gherkin 4D)

### 2.1 Caminho Feliz (Happy Path)
#### Cenário 1: Card de Justificativa Pedagógica Expandido no Quiz (Melhoria 21)
- **Dado** que o discente responde a uma questão e o gabarito é revelado,
- **Quando** o card de feedback abre com a resposta,
- **Então** um bloco destacado exibe a justificativa pedagógica da questão (`justification` ou `explanation`) com janela de leitura ampliada para 3,5 segundos antes da transição.

#### Cenário 2: Timer Circular Não Agressivo em Quizzes (Melhoria 20/Expanded)
- **Dado** que um quiz com tempo limite é iniciado,
- **Quando** os segundos restantes são contabilizados,
- **Então** um indicador circular SVG com transição suave de cor (ciano -> amarelo -> vermelho) exibe o tempo sem piscar agressivamente ou induzir pânico.

### 2.2 Caminho Alternativo (Alternative Path)
#### Cenário 3: Modo Lista Linear Acessível no Tabuleiro (Melhoria 18)
- **Dado** que um discente utiliza leitor de tela ou prefere baixo estímulo visual,
- **Quando** ele clica em "Modo Lista Acessível" no visualizador do tabuleiro,
- **Então** os nós do mapa gráfico são substituídos por uma lista sequencial de passos com alto contraste, ícones de status claros e acionadores diretos.

#### Cenário 4: Clonagem e Experimentação Rápida no Banco de Atividades (Melhoria 05 & 42)
- **Dado** que um professor consulta atividades públicas no Banco de Atividades,
- **Quando** ele clica em "Experimentar Modelo",
- **Então** o sistema cria imediatamente uma cópia editável e o redireciona ao fluxo de edição com feedback de sucesso.

### 2.3 Tratamento de Exceção (Exception)
#### Cenário 5: Bloqueio Preventivo de Respostas em Branco (Melhoria 27)
- **Dado** que o aluno não selecionou nenhuma alternativa,
- **Quando** o botão de confirmar resposta estiver em foco,
- **Então** o botão permanece desabilitado e um aviso explicativo amarelo alerta que é necessário escolher uma alternativa antes de prosseguir.

#### Cenário 6: Saldo Insuficiente na Loja Virtual (Melhoria 58)
- **Dado** que o aluno visita a Loja Virtual sem saldo suficiente para um item,
- **Quando** ele visualiza o card do item,
- **Então** o botão de compra exibe claramente "Faltam X 🪙" e a transação é bloqueada de forma preventiva sem gerar erro 400.

### 2.4 Cenário de Caos e Teste Adversarial (Chaos / Adversarial)
#### Cenário 7: Exibição Segura Coletiva sob Modo Sala de Aula (Melhoria 51)
- **Dado** que o professor projeta o ranking da turma em sala de aula física,
- **Quando** cliques múltiplos e concorrentes alternam o "Modo Sala de Aula",
- **Então** os nomes reais dos alunos permanecem estritamente mascarados sob codinomes sem vazamento de PII no DOM.

#### Cenário 8: Histórico de Diálogos com Cliques Acelerados (Melhoria 30)
- **Dado** que o discente clica repetidas vezes no balão de fala narrativo para avançar a cena rapidamente,
- **Quando** ele abre o gaveteiro de Histórico de Diálogos,
- **Então** todas as falas passadas até o índice atual estão íntegras, sem repetições corrompidas ou falhas de estado.

---

## 3. Matriz de Rastreabilidade Técnica

| Item do Catálogo | Melhoria | Componente Modificado | Linhas Principais |
| :--- | :--- | :--- | :--- |
| **#21** | Justificativa Pedagógica Expandida | `QuizTab.jsx` | L250-267 |
| **#20** | Timer Visual Suave em SVG | `QuizTab.jsx` | L287-320 |
| **#27** | Prevenção de Respostas em Branco | `QuizTab.jsx` | L370-380 |
| **#30** | Histórico de Falas Narrativas | `NarrativeTab.jsx` | L178-218 |
| **#18** | Visualização Linear Acessível do Tabuleiro | `GameBoardViewer.jsx` | L65-155 |
| **#05 / #42** | Clonagem / Experimentação Instantânea | `ActivityBankPage.jsx` | L280-295 |
| **#37** | Medidor de Densidade/Complexidade | `ActivityCreationHeader.jsx` | L15-38, L49-55 |
| **#40** | Modal de Prévia Rápida do Aluno | `ActivityCreationHeader.jsx` | L100-170 |
| **#46** | Tags Interativas no Filtro de Alunos | `StudentPerformancePage.jsx` | L90, L225-250, L355-375 |
| **#51** | Modo Sala de Aula (Anonimização) | `LeaderboardTab.jsx` | L55-75, L85-105 |
| **#58** | Indicador de Faltam X Moedas | `ItemCard.jsx` | L45-70 |
| **#60** | Silhueta e Dica de Desbloqueio | `MedalDetailModal.jsx` | L38-65 |
