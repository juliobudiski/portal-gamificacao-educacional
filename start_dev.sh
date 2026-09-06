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

echo -e "${BLUE}1. Iniciando túneis do Cloudflare em segundo plano...${NC}"
cloudflared tunnel --url http://localhost:5000 > backend_tunnel.log 2>&1 &
BACKEND_PID=$!

cloudflared tunnel --url http://localhost:5173 > frontend_tunnel.log 2>&1 &
FRONTEND_PID=$!

echo -e "${YELLOW}2. Aguardando a geração das URLs (aprox. 15 segundos)...${NC}"
sleep 15

# --- Extração e Formatação das URLs ---
echo -e "${BLUE}3. Extraindo e formatando as URLs dos logs...${NC}"

# Encontra a linha que contém "trycloudflare.com" e extrai a URL completa.
BACKEND_URL_FULL=$(grep 'trycloudflare.com' backend_tunnel.log | sed -n 's/.*\(https*:\/\/[-a-zA-Z0-9.]*\.trycloudflare\.com\).*/\1/p' | head -n 1)
FRONTEND_URL_FULL=$(grep 'trycloudflare.com' frontend_tunnel.log | sed -n 's/.*\(https*:\/\/[-a-zA-Z0-9.]*\.trycloudflare\.com\).*/\1/p' | head -n 1)

# Validação para garantir que as URLs foram capturadas
if [ -z "$BACKEND_URL_FULL" ] || [ -z "$FRONTEND_URL_FULL" ]; then
    echo -e "${RED}❌ Erro Crítico: Não foi possível obter as URLs dos túneis.${NC}"
    echo "Verifique os arquivos backend_tunnel.log e frontend_tunnel.log para mais detalhes."
    cleanup
fi

# Remove o "https://" para obter apenas o hostname para o vite.config.js
FRONTEND_HOSTNAME=$(echo $FRONTEND_URL_FULL | sed 's|https://||')

echo -e "${GREEN}✅ URL para .env (Backend): $BACKEND_URL_FULL${NC}"
echo -e "${GREEN}✅ Hostname para vite.config.js (Frontend): $FRONTEND_HOSTNAME${NC}"

# --- Atualização dos Arquivos ---
echo -e "${BLUE}4. Atualizando arquivos de configuração...${NC}"

# Atualiza o .env
sed -i.bak "s#^$ENV_VAR_NAME=.*#$ENV_VAR_NAME=$BACKEND_URL_FULL#" $ENV_FILE

# Atualiza o vite.config.js
sed -i.bak "s#allowedHosts: \[ *'.*' *\]#allowedHosts: [ '*' ]#" $VITE_CONFIG_FILE

# Remove os arquivos de backup criados pelo sed
rm -f "$ENV_FILE.bak" "$VITE_CONFIG_FILE.bak"

echo -e "${GREEN}✅ Arquivos atualizados.${NC}"

# --- Iniciando Servidores ---
echo -e "${BLUE}5. Iniciando os servidores (Frontend & Backend) na mesma janela...${NC}"

# Backend
echo -e "${GREEN}🟢 Iniciando Backend...${NC}"
(cd $BACKEND_DIR && source venv/bin/activate && exec python3 run.py) &
FLASK_PID=$!

# Frontend
echo -e "${CYAN}🔵 Iniciando Frontend...${NC}"
(cd $FRONTEND_DIR && exec npm run dev) &
VITE_PID=$!

echo -e "${GREEN}✅ Processo concluído! Os servidores estão rodando em background.${NC}"
echo -e "${YELLOW}⚠️ Pressione Ctrl+C para encerrar todos os processos e fechar os túneis.${NC}"
echo "---"

# Aguarda os processos (Mantém o terminal aberto e ativo)
wait $FLASK_PID $VITE_PID
