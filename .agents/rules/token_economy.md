---
trigger: always_on
description: Diretrizes de eficiência máxima, model tiering e economia de tokens para agentes e subagentes.
---

# Diretrizes de Eficiência e Economia de Tokens (Token Economy)

Estas diretrizes aplicam-se a todos os agentes e subagentes para preservar a janela de contexto e reduzir consumo de cotas de tokens.

---

## 1. Estratégia de Tiering de Modelos (`invoke_subagent`)

Ao delegar tarefas a subagentes via ferramenta `invoke_subagent`, respeite rigorosamente o tiering de modelos:

| Tipo de Tarefa | Modelo Recomendado (`Model`) | Justificativa |
| :--- | :--- | :--- |
| **Exploração e Leitura** | `flash_lite` / `flash` | Tarefas de busca em arquivos, inspeção de repositório e mapeamento de dependências. |
| **Auditoria e Linters** | `flash_lite` / `flash` | Verificação de conformidade sintática, cobertura de testes e execução de scripts de validação. |
| **Testes Unitários / TDD Red**| `flash` | Escrita de testes reprodutores delimitados. |
| **Desenvolvimento Crítico** | `pro` / `inherit` | Refatoração arquitetural, algoritmos complexos, POO avançada e segurança ofensiva/defensiva. |

> **Regra de Ouro:** Nunca instancie subagentes de leitura ou exploração com `Model: pro` ou `Model: inherit` quando `flash_lite` ou `flash` atender à demanda.

---

## 2. Topologia Enxuta de Agentes (Lean Swarms)

1. **Evitar Mega-Enxames:** Limitar a criação concorrente a no máximo **2 a 3 subagentes** por ciclo de trabalho.
2. **Reaproveitamento de Sessão:** Sempre que uma tarefa for uma continuação natural de uma etapa anterior, envie uma mensagem para o subagente existente via `send_message` em vez de criar um novo subagente.
3. **Compartilhamento de Workspace:** Utilize `Workspace: share` ou `Workspace: inherit` para evitar clonagens desnecessárias de armazenamento.

---

## 3. Higiene de I/O em Ferramentas

1. **Inspeção Cirúrgica de Código:**
   - Nunca leia arquivos extensos (> 200 linhas) de uma só vez com `view_file` sem necessidade.
   - Utilize fatiamento preciso com `StartLine` e `EndLine`.
   - Utilize `grep_search` com `MatchPerLine: false` para localizar primeiro a lista de arquivos antes de inspecionar linhas individuais.
2. **Saídas Concisas em Comandos de Terminal (`run_command`):**
   - Execute suítes de teste com flags enxutas: `pytest -q --tb=short`.
   - Verifique estado do Git com `git status -s` ou `git diff --stat`.
   - Builds e compiladores com flag silenciosa: `npm run build --silent`.

---

## 4. Comunicação Direta e Não-Redundante

1. **Eliminar Ecos de Contexto:** Não repita para o usuário conteúdos inteiros de artefatos que já foram salvos e exibidos na interface.
2. **Respostas Focadas em Ação:** Priorize respostas diretas, estruturadas e com links diretos (`file://`) para os símbolos e arquivos manipulados.
