#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${1:-.env.dev}
ENVIRONMENT=${2:-develop}

if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo $ENV_FILE não encontrado"
  exit 1
fi

# Define o repositório alvo
REPO="ericocesar/plankaBolt"

# Garante que o ambiente exista para aceitar secrets
if ! gh api "repos/$REPO/environments/$ENVIRONMENT" >/dev/null 2>&1; then
  echo "Criando ambiente '$ENVIRONMENT' em $REPO..."
  gh api -X PUT "repos/$REPO/environments/$ENVIRONMENT" \
    -H "Accept: application/vnd.github+json" \
    --input - >/dev/null <<'JSON'
{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
  echo "Ambiente '$ENVIRONMENT' criado."
else
  # Garante política de branch custom ativada mesmo se já existir
  gh api -X PUT "repos/$REPO/environments/$ENVIRONMENT" \
    -H "Accept: application/vnd.github+json" \
    --input - >/dev/null <<'JSON'
{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
fi

# Garante política permitindo deploy da branch 'bolt/develop'
if ! gh api "repos/$REPO/environments/$ENVIRONMENT/deployment-branch-policies" -q '.branch_policies[].name' | grep -qx "bolt/develop"; then
  gh api -X POST "repos/$REPO/environments/$ENVIRONMENT/deployment-branch-policies" \
    -H "Accept: application/vnd.github+json" \
    -f name="bolt/develop" -f type="branch" >/dev/null
fi

while IFS= read -r line; do
  [ -z "$line" ] && continue
  [[ "$line" =~ ^# ]] && continue
  [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
  key=${line%%=*}
  value=${line#*=}
  if [ "$key" = "DOCKER_USERNAME" ] || [ "$key" = "DOCKER_TOKEN" ]; then
    gh secret set "$key" --repo "$REPO" --body "$value"
  else
    gh secret set "$key" --repo "$REPO" --env "$ENVIRONMENT" --body "$value"
    gh secret set "$key" --repo "$REPO" --body "$value"
  fi
done < "$ENV_FILE"
