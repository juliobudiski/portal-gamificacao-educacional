#!/bin/bash

# --- Cores ANSI ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# --- Configurações (Verifique se os caminhos estão corretos) ---
# O script assume que está na raiz do projeto 'portal-gamificacao-educacional'.
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
ENV_FILE="$FRONTEND_DIR/.env"
VITE_CONFIG_FILE="$FRONTEND_DIR/vite.config.js"
ENV_VAR_NAME="VITE_API_URL"

# --- TRAP para Graceful Shutdown ---
trap 'cleanup' SIGINT SIGTERM

cleanup() {
    echo -e "\n${RED}🔴 Recebido sinal de interrupção. Encerrando processos (Graceful Shutdown)...${NC}"
    # Mata os processos se eles existirem
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    [ -n "$FLASK_PID" ] && kill $FLASK_PID 2>/dev/null
    [ -n "$VITE_PID" ] && kill $VITE_PID 2>/dev/null
    echo -e "${GREEN}✅ Todos os processos foram encerrados corretamente.${NC}"
    exit 0
}

# --- Início do Script ---
echo -e "${CYAN}🚀 Iniciando ambiente de desenvolvimento completo...${NC}"
echo "---"

# Limpa logs antigos para garantir que não estamos lendo URLs velhas
rm -f backend_tunnel.log frontend_tunnel.log

# Verifica se cloudflared está instalado no sistema
HAS_CLOUDFLARED=false
if command -v cloudflared &> /dev/null; then
    HAS_CLOUDFLARED=true
fi

if [ "$HAS_CLOUDFLARED" = true ]; then
    echo -e "${BLUE}1. Iniciando túneis do Cloudflare em segundo plano...${NC}"
    cloudflared tunnel --url http://localhost:5000 > backend_tunnel.log 2>&1 &
    BACKEND_PID=$!

    cloudflared tunnel --url http://localhost:5173 > frontend_tunnel.log 2>&1 &
    FRONTEND_PID=$!

    echo -e "${YELLOW}2. Aguardando a geração das URLs (aprox. 15 segundos)...${NC}"
    sleep 15

    # --- Extração e Formatação das URLs ---
    echo -e "${BLUE}3. Extraindo e formatando as URLs dos logs...${NC}"

    # Regex aprimorada para capturar URLs do Cloudflare (ex: https://xxx.trycloudflare.com)
    BACKEND_URL_FULL=$(grep -oE 'https?://[a-zA-Z0-9.-]+\.trycloudflare\.com' backend_tunnel.log 2>/dev/null | head -n 1)
    FRONTEND_URL_FULL=$(grep -oE 'https?://[a-zA-Z0-9.-]+\.trycloudflare\.com' frontend_tunnel.log 2>/dev/null | head -n 1)
fi

# Fallback gracioso para Localhost caso o Cloudflare não esteja instalado ou falhe
if [ -z "$BACKEND_URL_FULL" ] || [ -z "$FRONTEND_URL_FULL" ]; then
    echo -e "${YELLOW}⚠️ [AVISO] Túnel Cloudflare indisponível ou URLs não geradas.${NC}"
    if [ "$HAS_CLOUDFLARED" = false ]; then
        echo -e "${YELLOW}ℹ️  Motivo: binário 'cloudflared' não encontrado no PATH.${NC}"
    else
        echo -e "${YELLOW}ℹ️  Verifique backend_tunnel.log e frontend_tunnel.log para detalhes.${NC}"
    fi
    echo -e "${GREEN}🔄 Operando em modo de Fallback (Ambiente Local):${NC}"
    BACKEND_URL_FULL="http://localhost:5000"
    FRONTEND_URL_FULL="http://localhost:5173"
    FRONTEND_HOSTNAME="localhost"
else
    # Remove o protocolo para obter o hostname para o vite.config.js
    FRONTEND_HOSTNAME=$(echo "$FRONTEND_URL_FULL" | sed -E 's|https?://||')
fi

echo -e "${GREEN}✅ URL API (Backend): $BACKEND_URL_FULL${NC}"
echo -e "${GREEN}✅ Hostname (Frontend): $FRONTEND_HOSTNAME${NC}"

# --- Atualização dos Arquivos ---
echo -e "${BLUE}4. Atualizando arquivos de configuração...${NC}"

# Cria ou atualiza o .env no frontend
if [ ! -f "$ENV_FILE" ]; then
    echo "$ENV_VAR_NAME=$BACKEND_URL_FULL" > "$ENV_FILE"
elif grep -q "^$ENV_VAR_NAME=" "$ENV_FILE"; then
    sed -i.bak "s#^$ENV_VAR_NAME=.*#$ENV_VAR_NAME=$BACKEND_URL_FULL#" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
else
    echo "$ENV_VAR_NAME=$BACKEND_URL_FULL" >> "$ENV_FILE"
fi

# Atualiza allowedHosts no vite.config.js se o arquivo existir
if [ -f "$VITE_CONFIG_FILE" ]; then
    if grep -q "allowedHosts:" "$VITE_CONFIG_FILE"; then
        sed -i.bak "s#allowedHosts:.*#allowedHosts: true,#" "$VITE_CONFIG_FILE"
        rm -f "$VITE_CONFIG_FILE.bak"
    fi
fi

echo -e "${GREEN}✅ Configurações sincronizadas com sucesso.${NC}"

# --- Iniciando Servidores ---
echo -e "${BLUE}5. Verificando dependências e iniciando os servidores (Frontend & Backend)...${NC}"

# Backend: Verifica e ativa o ambiente virtual
echo -e "${GREEN}🟢 Preparando e iniciando Backend...${NC}"
(
    cd "$BACKEND_DIR" || exit 1
    if [ -x "venv/bin/python3" ]; then
        exec venv/bin/python3 run.py
    elif [ -x ".venv/bin/python3" ]; then
        exec .venv/bin/python3 run.py
    elif [ -f "venv/bin/activate" ]; then
        # shellcheck disable=SC1091
        . venv/bin/activate
        exec python3 run.py
    elif [ -f ".venv/bin/activate" ]; then
        # shellcheck disable=SC1091
        . .venv/bin/activate
        exec python3 run.py
    else
        echo -e "${YELLOW}⚠️ Ambiente virtual não encontrado em venv/.venv. Criando novo venv...${NC}"
        python3 -m venv venv && venv/bin/pip install -r requirements.txt
        exec venv/bin/python3 run.py
    fi
) &
FLASK_PID=$!

# Frontend: Garante node_modules antes de iniciar o Vite
echo -e "${CYAN}🔵 Preparando e iniciando Frontend...${NC}"
(
    cd "$FRONTEND_DIR" || exit 1
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then
        echo -e "${YELLOW}⚠️ Dependências do frontend não encontradas. Executando npm install (--legacy-peer-deps)...${NC}"
        npm install --legacy-peer-deps
    fi
    exec npm run dev
) &
VITE_PID=$!

echo -e "${GREEN}✅ Processo concluído! Os servidores estão rodando em background.${NC}"
echo -e "${YELLOW}⚠️ Pressione Ctrl+C para encerrar todos os processos e fechar os túneis.${NC}"
echo "---"

# Aguarda os processos (Mantém o terminal aberto e ativo)
wait $FLASK_PID $VITE_PID
