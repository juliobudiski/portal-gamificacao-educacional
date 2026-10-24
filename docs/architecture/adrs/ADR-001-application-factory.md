# ADR-001: Adoção do Padrão Application Factory

- **Status:** Aceito
- **Data:** 2025-08-15
- **Categoria:** Backend e Persistência
- **Decisores:** Squad de Arquitetura e Engenharia do Portal GamificaEdu
- **Contexto da Pesquisa:** Tese de Doutorado em Ciência da Computação / DSR

---

## 1. Contexto e Forças

O backend Flask originalmente inicializava a aplicação e suas extensões diretamente no escopo global de execução (`app = Flask(__name__)`). Conforme o sistema cresceu com a inclusão de modelos relacionais, rotas REST e migrações de banco, surgiram problemas severos de importações circulares e travamentos durante comandos CLI essenciais, como `flask db migrate` e testes automatizados com runners isolados.

---

## 2. Decisão

Reestruturar a inicialização do backend Flask adotando o padrão de projeto Application Factory. Toda a criação da instância do Flask, configuração de variáveis de ambiente, inicialização de extensões (SQLAlchemy, Migrate, JWTManager, CORS, SocketIO) e registro de Blueprints modulares é centralizada exclusivamente dentro da função `create_app(config_name=None)`.

---

## 3. Consequências

- **Positiva:** Eliminação definitiva de importações circulares entre modelos, rotas e instâncias de banco.
- **Positiva:** Possibilidade de instanciar aplicações com diferentes configurações (testes em memória SQLite vs banco PostgreSQL de desenvolvimento/produção).
- **Positiva:** Compatibilidade plena com migrações Alembic e runners de testes Pytest.
- **Negativa/Trade-off:** Necessidade de acessar a aplicação ou extensões via `current_app` ou injeção explícita de contexto.

---

## 4. Conformidade e Rastreabilidade

- **Mapeamento de Requisitos:** [[docs/backlog/README.md]]
- **Diagramas Arquiteturais:** [[docs/architecture/c4_context_container_diagrams.md]] e [[docs/architecture/c4_component_hexagonal_backend.md]]
- **Modelo de Dados Afetado:** [[docs/architecture/data_model_erd.md]]
