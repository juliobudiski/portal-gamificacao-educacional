#!/bin/bash
# Script para configurar os Git Hooks do repositório
set -e

HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ Erro: Diretório .git/hooks não encontrado. Certifique-se de executar na raiz do repositório."
    exit 1
fi

cat << 'HOOK_EOF' > "$HOOKS_DIR/pre-push"
#!/bin/bash
# Pre-push hook: impede git push se a bateria de testes e build falhar

echo "=================================================="
echo " 🛡️  GAMIFICAEDU PRE-PUSH QUALITY GATE"
echo "=================================================="

# 1. Checagem Frontend
echo "📦 [1/2] Verificando build do Frontend..."
(
    cd frontend || exit 1
    if [ ! -d "node_modules" ]; then
        echo "⚠️  node_modules ausente no frontend. Executando npm install..."
        npm install || exit 1
    fi
    npm run build > /dev/null 2>&1
)
FRONTEND_STATUS=$?

if [ $FRONTEND_STATUS -ne 0 ]; then
    echo "❌ FALHA: O build do Frontend falhou!"
    echo "💡 Dica: Rode 'cd frontend && npm run build' para ver os erros antes de enviar o commit."
    exit 1
fi
echo "✅ Frontend build: OK"

# 2. Checagem Backend
echo "🐍 [2/2] Verificando testes rápidos do Backend..."
if [ -x "backend/venv/bin/python" ]; then
    PYTHON_EXEC="backend/venv/bin/python"
elif [ -x ".venv_e2e/bin/python" ]; then
    PYTHON_EXEC=".venv_e2e/bin/python"
else
    PYTHON_EXEC="python3"
fi

if $PYTHON_EXEC -c "import flask" 2>/dev/null; then
    $PYTHON_EXEC backend/test_contact_api.py > /dev/null 2>&1
    BACKEND_STATUS=$?
    if [ $BACKEND_STATUS -ne 0 ]; then
        echo "❌ FALHA: Testes do Backend falharam!"
        echo "💡 Dica: Rode '$PYTHON_EXEC backend/test_contact_api.py' para ver o erro."
        exit 1
    fi
    echo "✅ Backend tests: OK"
else
    echo "ℹ️  Ambiente Python sem Flask detectado localmente; validação remota no GitHub Actions cuidará disso."
fi

echo "=================================================="
echo "🎉 Todos os gates locais passaram! Permitindo push."
echo "=================================================="
exit 0
HOOK_EOF

chmod +x "$HOOKS_DIR/pre-push"
echo "✅ Git hook 'pre-push' instalado com sucesso em $HOOKS_DIR/pre-push"
