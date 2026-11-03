---
id: US-21
title: "Implementação do Lote 2 de Melhorias UI/UX (Melhorias #36 a #70)"
status: "Completed"
priority: "High"
type: "Frontend Enhancement"
sprint: "Sprint 4 - UI/UX Refinement & Accessibility"
author: "Squad ChamadaE"
date: "2026-11-03"
tags:
  - ui-ux
  - wcag-2-2
  - accessibility
  - gamification
  - storytelling
  - edtech
---

# User Story: Implementação do Lote 2 de Melhorias UI/UX (#36 a #70)

Como **aluno e professor do GamificaEdu**,
Eu quero **ter uma experiência imersiva, inclusiva e acessível (com alto contraste, ajuste de fonte, filtros para daltonismo, controle de zoom/áudio no tabuleiro, provador de avatares e dashboards analíticos avançados)**,
Para que **o engajamento pedagógico seja maximizado, barreiras de acessibilidade sejam eliminadas e a tomada de decisão docente seja ágil e fundamentada em dados**.

---

## 1. Escopo das 35 Novas Melhorias Entregues

1. **Acessibilidade Universal & WCAG 2.2 (#65, #66, #67, #69, #70, #72):**
   - Barra de acessibilidade flutuante permanente (`AccessibilityBar.jsx`).
   - Modo de Alto Contraste estrito com paleta `#000000` / `#FFFF00` (`[data-a11y-contrast="high"]`).
   - Escalador dinâmico de fonte (100%, 115%, 130%) com persistência em `localStorage`.
   - Filtros de Daltonismo SVG/CSS (Protanopia, Deuteranopia, Tritanopia).
   - Pausa global de animações e transições para redução de carga vestibular.
   - Navegação por foco visual ampliado com outline `4px solid #69e8cb`.

2. **Feedback Gamificado & Conquistas (#63):**
   - Toast Dourado de Conquista Épica (`ToastGoldAchieve.jsx`) com moldura cintilante e badge 3D.

3. **Mecânicas de Quiz e Desafio (#22, #24, #26):**
   - Power-up 50/50 em `QuizTab.jsx` eliminando 2 alternativas incorretas com tachado animado.
   - Marcador "Revisar Mais Tarde" para permitir ao aluno sinalizar questões para revisão antes de submeter.
   - Renderizador de blocos de código com destaque de sintaxe, numeração de linhas e cópia (`CodeBlockViewer.jsx`).

4. **Narrativas & Storytelling Imersivo (#29, #31, #34, #35, #36):**
   - Balão de fala dinâmico com realce de mentor e glossário técnico inline com tooltips.
   - Ramificação cosmética de diálogos com escolhas do aluno.
   - Efeito parallax suave e transição cinematográfica entre falas.

5. **Tabuleiro Imersivo & Economia Gamificada (#10, #11, #13, #14, #55, #56, #62):**
   - Controles flutuantes de Zoom (+, -, 100%) e botão de áudio mudo persistente em `VilaDaAventuraTheme.jsx`.
   - Provador Virtual de Avatar em `ItemCard.jsx` para prévia do cosmético antes da compra.
   - Confirmação em 2 etapas para itens raros/caros (&ge; 150 moedas).
   - Suavização de física na desaceleração da Roleta em `RouletteTab.jsx`.

6. **Wizard Docente & Gestão de Atividades (#38, #41, #45, #54):**
   - Indicador de complexidade cognitiva e atalhos rápidos de teclado (`Ctrl+Z` / `Ctrl+Y`) em `ActivityCreationHeader.jsx`.
   - Alternância entre visão em Grade (Cards) e Lista Compacta em `ActivityBankPage.jsx`.

7. **Analytics Docente & Desempenho (#47, #48, #49, #50, #52, #53):**
   - Pílulas de resumo semanal de engajamento no painel principal do professor (`TeacherDashboardPage.jsx`).
   - Alerta visual em banner para alunos com dificuldade recorrente.
   - Botão de exportação instantânea em 1-clique para formato CSV em `StudentPerformancePage.jsx`.

---

## 2. Cenários BDD (Gherkin)

```gherkin
Funcionalidade: Barra de Acessibilidade Flutuante
  Cenário: Ativação do modo de alto contraste
    Dado que o usuário está em qualquer tela do portal
    Quando ele clica no botão "Alto Contraste" da barra de acessibilidade
    Então o atributo data-a11y-contrast="high" é aplicado ao elemento html
    E a preferência é persistida no localStorage do navegador

  Cenário: Alternância do tamanho da fonte
    Dado que a fonte está em 100%
    Quando o usuário clica no botão "A+"
    Então o atributo data-font-scale="medium" é aplicado
    E a tipografia base é escalada em 115%

Funcionalidade: Power-up 50/50 no Quiz
  Cenário: Uso do 50/50 para eliminar alternativas erradas
    Dado que o aluno está respondendo a uma questão com 4 alternativas
    Quando ele clica no botão "50/50"
    Então exatamente 2 alternativas incorretas são desabilitadas e riscadas
    E o botão de 50/50 fica desabilitado para esta pergunta

Funcionalidade: Provador Virtual na Loja
  Cenário: Aluno testa o avatar antes de comprar
    Dado que o aluno visualiza um item do tipo "avatar" na loja
    Quando ele clica em "👁️ Provar"
    Então um card de prévia renderiza o avatar simulado em seu perfil
```
