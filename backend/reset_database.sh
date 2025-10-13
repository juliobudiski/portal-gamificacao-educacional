#!/bin/bash

# ====================================================================================
# SCRIPT DE RESET COMPLETO PARA O BANCO DE DADOS DA APLICAÇÃO GAMIFICAEDU
#
# Autor: Gemini AI
# Descrição: Este script automatiza o processo de deletar, recriar e migrar
#            a base de dados PostgreSQL. Ele foi projetado para ser seguro,
#            pedindo confirmação e parando em caso de erros.
#
# Uso:
# 1. Navegue até a pasta 'backend' do seu projeto.
# 2. Dê permissão de execução: chmod +x reset_database.sh
# 3. Execute o script: ./reset_database.sh
# ====================================================================================

# --- CONFIGURAÇÃO ---
DB_NAME="gamificacao_db"
DB_USER="postgres"
PG_PASSWORD="iM+ujWF;8#3NGt#" # Sua senha do PostgreSQL

# --- CORES PARA O TERMINAL ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem Cor

# --- FUNÇÃO DE TRATAMENTO DE ERRO ---
handle_error() {
    echo -e "\n${RED}ERRO: O comando anterior falhou. Abortando o script.${NC}"
    # Limpa a variável de senha por segurança
    unset PGPASSWORD
    exit 1
}

# Define que o script deve parar se qualquer comando falhar
trap 'handle_error' ERR

# ====================================================================================
# INÍCIO DO SCRIPT
# ====================================================================================

echo -e "${YELLOW}--- INICIANDO PROCESSO DE RESET DO BANCO DE DADOS ---${NC}"

# PASSO 0: CONFIRMAÇÃO DE SEGURANÇA
echo -e "\n${RED}ATENÇÃO: Este script irá DELETAR PERMANENTEMENTE o banco de dados '${DB_NAME}'.${NC}"
read -p "Você tem certeza que deseja continuar? (s/n) " -n 1 -r
echo # Move para a próxima linha

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
    exit 1
fi

# PASSO 1: Limpar o histórico de migrações local
echo -e "\n${GREEN}==> PASSO 1 de 4: Limpando histórico de migrações antigo...${NC}"
if [ -d "migrations" ]; then
    rm -rf migrations
    echo "Diretório 'migrations' removido com sucesso."
else
    echo "Diretório 'migrations' não encontrado, pulando."
fi

# PASSO 2: Deletar e recriar o banco de dados no PostgreSQL
echo -e "\n${GREEN}==> PASSO 2 de 4: Deletando e recriando o banco de dados '${DB_NAME}'...${NC}"

# Exporta a senha de forma segura para o psql não pedi-la interativamente
export PGPASSWORD=$PG_PASSWORD

# Usa um "here document" para passar os comandos SQL para o psql
psql -U "$DB_USER" -d postgres <<-EOF
    -- Usamos IF EXISTS para não dar erro se o banco já tiver sido deletado
    DROP DATABASE IF EXISTS ${DB_NAME};
    CREATE DATABASE ${DB_NAME};
EOF

# Limpa a variável de senha do ambiente assim que não for mais necessária
unset PGPASSWORD

echo "Banco de dados '${DB_NAME}' recriado com sucesso."

# PASSO 3: Gerar um novo histórico de migrações limpo
echo -e "\n${GREEN}==> PASSO 3 de 4: Gerando novo histórico de migrações...${NC}"
flask db init
flask db migrate -m "Criação da estrutura inicial a partir dos modelos"
echo "Novo histórico de migrações criado."

# PASSO 4: Aplicar a migração para criar as tabelas
echo -e "\n${GREEN}==> PASSO 4 de 4: Aplicando migrações para criar as tabelas...${NC}"
flask db upgrade
echo "Tabelas criadas com sucesso no banco de dados."

# --- CONCLUSÃO ---
echo -e "\n${GREEN}--- SUCESSO! ---${NC}"
echo "O banco de dados foi completamente reiniciado."
echo -e "Próximos passos recomendados:"
echo "1. Crie seu usuário administrador/professor."
echo "2. Popule os dados iniciais necessários (ex: medalhas)."
echo "3. Inicie os servidores do backend e frontend."

