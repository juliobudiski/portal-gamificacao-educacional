#!/bin/bash

# ====================================================================================
# SCRIPT DE SUBSTITUIÇÃO EM MASSA DE EXTENSÕES NO CÓDIGO-FONTE
#
# Autor: Gemini AI
# Descrição: Este script varre todo o projeto (frontend e backend) em busca de
#            referências a arquivos '.png' e as substitui por '.webp'.
#            Ele cria backups (.bak) de todos os arquivos modificados por segurança.
#
# Uso: Execute este script a partir da raiz do seu projeto.
# ====================================================================================

# --- CORES PARA O TERMINAL ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem Cor

# --- FUNÇÃO DE TRATAMENTO DE ERRO ---
handle_error() {
    echo -e "\n${RED}ERRO: O comando anterior falhou. Abortando o script.${NC}"
    exit 1
}

# Define que o script deve parar se qualquer comando falhar
trap 'handle_error' ERR

# ====================================================================================
# INÍCIO DO SCRIPT
# ====================================================================================

echo -e "${YELLOW}--- INICIANDO VARREDURA E SUBSTITUIÇÃO DE '.png' PARA '.webp' ---${NC}"

# PASSO 0: CONFIRMAÇÃO DE SEGURANÇA
echo -e "\n${RED}ATENÇÃO: Este script irá modificar arquivos de código em todo o projeto.${NC}"
echo "Backups (.bak) serão criados para cada arquivo alterado."
read -p "Você tem certeza que deseja continuar? (s/n) " -n 1 -r
echo # Move para a próxima linha

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
    exit 1
fi

# PASSO 1: ENCONTRAR E SUBSTITUIR
echo -e "\n${GREEN}==> PASSO 1 de 2: Procurando e substituindo referências...${NC}"

# O comando 'find' localiza os arquivos.
# O comando 'sed' faz a substituição, criando um backup (.bak).
# Excluímos pastas que não contêm código-fonte relevante.
find . -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.py" \) \
! -path "./frontend/node_modules/*" \
! -path "./frontend/dist/*" \
! -path "./backend/venv/*" \
! -path "./backend/__pycache__/*" \
! -path "./backend/migrations/*" \
-exec sed -i.bak 's/\.png/\.webp/g' {} +

echo "Varredura e substituição concluídas."

# PASSO 2: RELATÓRIO DE ARQUIVOS MODIFICADOS
echo -e "\n${GREEN}==> PASSO 2 de 2: Gerando relatório de modificações...${NC}"
modified_files=$(find . -type f -name "*.bak")
count=$(echo "$modified_files" | wc -l)

if [ "$count" -eq 0 ]; then
    echo -e "${YELLOW}Nenhum arquivo com referências a '.png' foi encontrado para modificar.${NC}"
else
    echo -e "${GREEN}Total de arquivos modificados: ${count}${NC}"
    echo "----------------------------------"
    echo "Lista de arquivos alterados (backups .bak foram criados):"
    echo "$modified_files" | sed 's/\.bak$//'
    echo "----------------------------------"
    echo -e "\n${YELLOW}IMPORTANTE: Verifique as alterações e, quando estiver satisfeito, você pode remover os backups com o comando:${NC}"
    echo "find . -type f -name \"*.bak\" -delete"
fi

# --- CONCLUSÃO ---
echo -e "\n${GREEN}--- SUCESSO! ---${NC}"
echo "Todas as referências a '.png' no código-fonte foram substituídas."
echo -e "O próximo passo recomendado é rodar o script ${YELLOW}./reset_database.sh${NC} para garantir que o banco de dados também esteja 100% limpo e sincronizado."

