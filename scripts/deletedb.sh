#!/bin/bash

# Script para apagar um banco de dados PostgreSQL
# Uso: ./deletedb.sh <nome_do_banco> [usuario_postgres]

# Verifica se o nome do banco foi fornecido
if [ $# -eq 0 ]; then
    echo -e "❌ Erro: Por favor, forneça o nome do banco de dados"
    echo "Uso: $0 <nome_do_banco> [usuario_postgres]"
    echo "Exemplo: $0 meubanco"
    echo "Exemplo: $0 meubanco ericocesar"
    exit 1
fi

DB_NAME=$1
POSTGRES_USER=${2:-"ericocesar"}  # Usa 'ericocesar' (superuser) como padrão

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗑️  Apagando banco de dados PostgreSQL...${NC}"
echo -e "${BLUE}   Nome do banco: ${DB_NAME}${NC}"
echo -e "${BLUE}   Usuário PostgreSQL: ${POSTGRES_USER}${NC}"
echo ""

# Comando para dropar o banco
DROP_DB_CMD="DROP DATABASE IF EXISTS ${DB_NAME};"

# Confirmação antes de deletar
echo -e "${YELLOW}⚠️  ATENÇÃO: Você está prestes a excluir PERMANENTEMENTE o banco de dados '${DB_NAME}'.${NC}"
read -p "Tem certeza que deseja continuar? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

# Comando para terminar conexões existentes
KILL_CONNS_CMD="SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Executa os comandos PostgreSQL
echo -e "${YELLOW}🔌 Encerrando conexões ativas com o banco '${DB_NAME}'...${NC}"
psql -h localhost -U "${POSTGRES_USER}" -d postgres -c "${KILL_CONNS_CMD}" > /dev/null 2>&1

echo -e "${BLUE}🗑️  Apagando banco de dados...${NC}"
if psql -h localhost -U "${POSTGRES_USER}" -d postgres -c "${DROP_DB_CMD}"; then
    echo -e "${GREEN}✅ Banco de dados '${DB_NAME}' removido com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao apagar banco de dados '${DB_NAME}'${NC}"
    exit 1
fi
