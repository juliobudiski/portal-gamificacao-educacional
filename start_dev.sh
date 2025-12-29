#!/bin/bash

# --- Configurações (Verifique se os caminhos estão corretos) ---
# O script assume que está na raiz do projeto 'portal-gamificacao-educacional'.
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
ENV_FILE="$FRONTEND_DIR/.env"
VITE_CONFIG_FILE="$FRONTEND_DIR/vite.config.js"
ENV_VAR_NAME="VITE_API_URL"

# --- Início do Script ---

echo "🚀 Iniciando ambiente de desenvolvimento completo..."
# --- NOVO: Backup automático dos dados do WakaTime ---
echo "0. Verificando e salvando histórico do WakaTime..."
python3 save_wakatime.py 
echo "---"
# --------------------------------------------------------
# Limpa logs antigos para garantir que não estamos lendo URLs velhas
rm -f backend_tunnel.log frontend_tunnel.log

echo "1. Iniciando túneis do Cloudflare em segundo plano..."
# Inicia os túneis e redireciona a saída para os logs
cloudflared tunnel --url http://localhost:5000 > backend_tunnel.log 2>&1 &
BACKEND_PID=$!

cloudflared tunnel --url http://localhost:5173 > frontend_tunnel.log 2>&1 &
FRONTEND_PID=$!

echo "2. Aguardando a geração das URLs (aprox. 8 segundos)..."
# Um tempo de espera é necessário para o cloudflared conectar e gerar a URL.
# Se falhar, você pode aumentar este valor (ex: sleep 10).
sleep 15

# --- Extração e Formatação das URLs ---

echo "3. Extraindo e formatando as URLs dos logs..."

# Encontra a linha que contém "trycloudflare.com" e extrai a URL completa.
BACKEND_URL_FULL=$(grep 'trycloudflare.com' backend_tunnel.log | sed -n 's/.*\(https*:\/\/[-a-zA-Z0-9.]*\.trycloudflare\.com\).*/\1/p' | head -n 1)
FRONTEND_URL_FULL=$(grep 'trycloudflare.com' frontend_tunnel.log | sed -n 's/.*\(https*:\/\/[-a-zA-Z0-9.]*\.trycloudflare\.com\).*/\1/p' | head -n 1)

# Validação para garantir que as URLs foram capturadas
if [ -z "$BACKEND_URL_FULL" ] || [ -z "$FRONTEND_URL_FULL" ]; then
    echo "❌ Erro Crítico: Não foi possível obter as URLs dos túneis."
    echo "Verifique os arquivos backend_tunnel.log e frontend_tunnel.log para mais detalhes."
    # Mata os processos em background para não ficarem "zumbis"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

# Remove o "https://" para obter apenas o hostname para o vite.config.js
FRONTEND_HOSTNAME=$(echo $FRONTEND_URL_FULL | sed 's|https://||')

echo "✅ URL para .env (Backend): $BACKEND_URL_FULL"
echo "✅ Hostname para vite.config.js (Frontend): $FRONTEND_HOSTNAME"

# --- Atualização dos Arquivos ---

echo "4. Atualizando arquivos de configuração..."

# Atualiza o .env
sed -i.bak "s#^$ENV_VAR_NAME=.*#$ENV_VAR_NAME=$BACKEND_URL_FULL#" $ENV_FILE

# Atualiza o vite.config.js
#sed -i.bak "s#allowedHosts: \[ *'.*' *\]#allowedHosts: [ '$FRONTEND_HOSTNAME' ]#" $VITE_CONFIG_FILE
sed -i.bak "s#allowedHosts: \[ *'.*' *\]#allowedHosts: [ '*' ]#" $VITE_CONFIG_FILE

# Remove os arquivos de backup criados pelo sed
rm -f "$ENV_FILE.bak" "$VITE_CONFIG_FILE.bak"

echo "✅ Arquivos atualizados."

# --- Iniciando Servidores em Novos Terminais ---

echo "5. Abrindo novos terminais e iniciando os servidores..."

# Comando para o terminal do BACKEND
# 1. cd backend
# 2. source venv/bin/activate
# 3. flask run
# 4. exec bash (mantém o terminal aberto após o comando)
CMD_BACKEND="cd $BACKEND_DIR && source venv/bin/activate && echo '✅ Ambiente virtual ativado.' && python3 run.py; exec bash"

# Comando para o terminal do FRONTEND
# 1. cd frontend
# 2. npm run dev
# 3. exec bash
CMD_FRONTEND="cd $FRONTEND_DIR && npm run dev; exec bash"

# Abre os terminais. Use o que estiver instalado no seu sistema.
# Opção 1: gnome-terminal (Padrão do Ubuntu)
gnome-terminal --title="Backend Server" -- /bin/bash -c "$CMD_BACKEND"
gnome-terminal --title="Frontend Server" -- /bin/bash -c "$CMD_FRONTEND"

# Opção 2: konsole (Padrão do KDE)
# konsole --new-tab -e /bin/bash -c "$CMD_BACKEND"
# konsole --new-tab -e /bin/bash -c "$CMD_FRONTEND"

# Opção 3: x-terminal-emulator (Alternativa genérica)
# x-terminal-emulator -e /bin/bash -c "$CMD_BACKEND" &
# x-terminal-emulator -e /bin/bash -c "$CMD_FRONTEND" &


echo "✅ Processo concluído! Os servidores devem estar iniciando em novas janelas."
echo "---"
echo "Os túneis do Cloudflare estão rodando em segundo plano. Para pará-los, use o comando:"
echo "kill $BACKEND_PID $FRONTEND_PID"
