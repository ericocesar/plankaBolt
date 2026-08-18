#!/usr/bin/env bash
# file: scripts/deployportainer.sh

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<EOF
Uso:
  ./scripts/deployportainer.sh <AMBIENTE>

Exemplos:
  ./scripts/deployportainer.sh dev
  ./scripts/deployportainer.sh prod

A tag da imagem é lida automaticamente de:
  $REPO_ROOT/docs/builds/latest-tag

Arquivos obrigatórios:
  dev:
    $REPO_ROOT/.github/infra/stack-dev.yml
    $REPO_ROOT/.github/infra/portainer.dev.env

  prod:
    $REPO_ROOT/.github/infra/stack-prod.yml
    $REPO_ROOT/.github/infra/portainer.prod.env

Formato do arquivo .env:
  PORTAINER_URL=https://portainer.exemplo.com
  PORTAINER_API_KEY=seu_token
  PORTAINER_ENDPOINT_ID=1
  STACK_NAME=nome-da-stack              # opcional

Imagem publicada pelo build:
  ghcr.io/ericocesar/plankabolt:sha-<commit>

Opcionalmente, defina IMAGE_NAME para usar outro repositório:
  IMAGE_NAME=ghcr.io/organizacao/repositorio

Dependências:
  curl
  jq
  python3
EOF
}

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  echo "Erro: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "comando obrigatório não encontrado: $1"
}

http_json() {
  local method="$1"
  local url="$2"
  local payload="${3:-}"

  if [ -n "$payload" ]; then
    curl -sS -w '\n%{http_code}' \
      -X "$method" \
      -H "X-API-Key: $PORTAINER_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "$url"
  else
    curl -sS -w '\n%{http_code}' \
      -X "$method" \
      -H "X-API-Key: $PORTAINER_API_KEY" \
      "$url"
  fi
}

parse_http_response() {
  local raw="$1"
  HTTP_CODE="$(printf '%s\n' "$raw" | tail -n1)"
  RESPONSE_BODY="$(printf '%s\n' "$raw" | sed '$d')"
}

select_environment() {
  local env_name="$1"

  case "$env_name" in
    dev)
      STACK_FILE="$REPO_ROOT/.github/infra/stack-dev.yml"
      ENV_FILE="$REPO_ROOT/.github/infra/portainer.dev.env"
      ;;
    prod)
      STACK_FILE="$REPO_ROOT/.github/infra/stack-prod.yml"
      ENV_FILE="$REPO_ROOT/.github/infra/portainer.prod.env"
      ;;
    *)
      fail "ambiente inválido: '$env_name'. Use 'dev' ou 'prod'"
      ;;
  esac
}

validate_required_files() {
  if [ ! -f "$STACK_FILE" ]; then
    cat >&2 <<EOF
Erro: arquivo da stack não encontrado.

Ambiente: $ENVIRONMENT
Caminho esperado: $STACK_FILE

Salve o compose da stack exatamente nesse caminho e execute novamente.
EOF
    exit 1
  fi

  if [ ! -f "$ENV_FILE" ]; then
    cat >&2 <<EOF
Erro: arquivo de variáveis não encontrado.

Ambiente: $ENVIRONMENT
Caminho esperado: $ENV_FILE

Salve as variáveis do Portainer exatamente nesse caminho e execute novamente.

Exemplo:
PORTAINER_URL=https://portainer.exemplo.com
PORTAINER_API_KEY=seu_token
PORTAINER_ENDPOINT_ID=1
EOF
    exit 1
  fi
}

load_env_file() {
  [ -f "$ENV_FILE" ] || fail "arquivo .env não encontrado: $ENV_FILE"

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"

    case "$line" in
      ''|'#'*)
        continue
        ;;
    esac

    if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    if [[ "$value" =~ ^\".*\"$ ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "$value" =~ ^\'.*\'$ ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "$key=$value"
  done < "$ENV_FILE"

  [ -n "${PORTAINER_URL:-}" ] || fail "PORTAINER_URL não definido em $ENV_FILE"
  [ -n "${PORTAINER_API_KEY:-}" ] || fail "PORTAINER_API_KEY não definido em $ENV_FILE"
  [ -n "${PORTAINER_ENDPOINT_ID:-}" ] || fail "PORTAINER_ENDPOINT_ID não definido em $ENV_FILE"
}

validate_image_tag() {
  local image_tag="$1"
  [[ "$image_tag" =~ ^[A-Za-z0-9._-]+$ ]] || {
    fail "IMAGE_TAG inválida: '$image_tag'"
  }
}

sanitize_component() {
  printf '%s' "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's#^[^a-z0-9]+##; s#[^a-z0-9._-]+#-#g; s#-+#-#g; s#[-._]+$##'
}

detect_image_name() {
  local remote_url repository namespace

  if [ -n "${IMAGE_NAME:-}" ]; then
    printf '%s' "${IMAGE_NAME%:}"
    return
  fi

  remote_url="$(git -C "$REPO_ROOT" config --get remote.origin.url 2>/dev/null || true)"
  repository="$(printf '%s' "$remote_url" | sed -E 's#\.git$##; s#^.*/##' || true)"
  namespace="$(printf '%s' "$remote_url" | sed -E 's#(git@|https?://|ssh://git@)?[^/:]+[:/]([^/]+)/.*#\2#' || true)"

  [ -n "$repository" ] || repository="$(basename "$REPO_ROOT")"
  [ -n "$namespace" ] || namespace="$(id -un)"

  printf '%s/%s/%s' "${REGISTRY:-ghcr.io}" "$(sanitize_component "$namespace")" "$(sanitize_component "$repository")"
}

load_latest_image_tag() {
  local tag_file="$REPO_ROOT/docs/builds/latest-tag"

  [ -f "$tag_file" ] || fail "tag da imagem não encontrada: $tag_file. Execute o build antes do deploy."

  IMAGE_TAG="$(tr -d '\r' < "$tag_file" | awk '{$1=$1; print}')"
  [ -n "$IMAGE_TAG" ] || fail "arquivo de tag vazio: $tag_file"
  validate_image_tag "$IMAGE_TAG"
}

extract_stack_name_from_compose() {
  local stack_file="$1"

  STACK_FILE_TO_PARSE="$stack_file" python3 - <<'PY'
import os
import re
from pathlib import Path

content = Path(os.environ["STACK_FILE_TO_PARSE"]).read_text(encoding="utf-8")

match = re.search(r'^\s*image:\s*([^\s#]+)', content, re.MULTILINE)
if not match:
    print("", end="")
    raise SystemExit(0)

image_ref = match.group(1).strip()
image_ref = image_ref.split("@", 1)[0]
image_ref = image_ref.split(":", 1)[0]
stack_name = image_ref.rsplit("/", 1)[-1].strip()

print(stack_name, end="")
PY
}

render_stack_content() {
  local stack_file="$1"
  local image_tag="$2"

  local image_name="$3"

  IMAGE_NAME_VALUE="$image_name" IMAGE_TAG_VALUE="$image_tag" STACK_FILE_RENDER="$stack_file" python3 - <<'PY'
import os
import re
from pathlib import Path

stack_file = Path(os.environ["STACK_FILE_RENDER"])
image_name = os.environ["IMAGE_NAME_VALUE"]
image_tag = os.environ["IMAGE_TAG_VALUE"]

content = stack_file.read_text(encoding="utf-8")
image_reference = f"{image_name}:{image_tag}"

# A aplicação é o primeiro serviço da stack. Substituímos somente sua imagem;
# imagens auxiliares, como redis, continuam sendo controladas pelo compose.
pattern = re.compile(r"^(\s*image:\s*)[^\s#]+", re.MULTILINE)
content, replacements = pattern.subn(lambda match: f"{match.group(1)}{image_reference}", content, count=1)
if replacements != 1:
    raise SystemExit(f"não foi encontrada uma linha image: em {stack_file}")

print(content, end="")
PY
}

show_rendered_image_lines() {
  local rendered="$1"

  log "linhas image: renderizadas:"
  printf '%s\n' "$rendered" | awk '
    /^[[:space:]]*image:[[:space:]]*/ { print "  " $0 }
  '
}

get_swarm_id() {
  local raw
  local url="${PORTAINER_URL%/}/api/endpoints/${PORTAINER_ENDPOINT_ID}/docker/swarm"

  raw="$(http_json GET "$url")"
  parse_http_response "$raw"

  [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] || {
    echo "$RESPONSE_BODY" >&2
    fail "falha ao consultar Swarm no endpoint $PORTAINER_ENDPOINT_ID (HTTP $HTTP_CODE)"
  }

  local swarm_id
  swarm_id="$(printf '%s' "$RESPONSE_BODY" | jq -r '.ID // empty')"
  [ -n "$swarm_id" ] || fail "não foi possível obter o Swarm ID"

  printf '%s' "$swarm_id"
}

find_stack_id() {
  local stack_name="$1"
  local raw
  local url="${PORTAINER_URL%/}/api/stacks"

  raw="$(
    curl -sS -G -w '\n%{http_code}' \
      -H "X-API-Key: $PORTAINER_API_KEY" \
      --data-urlencode "filters={\"name\":\"${stack_name}\"}" \
      "$url"
  )"

  parse_http_response "$raw"

  [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] || {
    echo "$RESPONSE_BODY" >&2
    fail "falha ao listar stacks (HTTP $HTTP_CODE)"
  }

  printf '%s' "$RESPONSE_BODY" | jq -e 'type == "array"' >/dev/null 2>&1 || {
    echo "$RESPONSE_BODY" >&2
    fail "resposta inesperada ao listar stacks"
  }

  printf '%s' "$RESPONSE_BODY" | jq -r --arg name "$stack_name" '.[] | select(.Name == $name) | .Id' | head -n1
}

create_stack() {
  local stack_name="$1"
  local stack_content="$2"
  local swarm_id="$3"

  local payload
  payload="$(
    jq -n \
      --arg name "$stack_name" \
      --arg content "$stack_content" \
      --arg swarm_id "$swarm_id" \
      '{
        name: $name,
        stackFileContent: $content,
        swarmID: $swarm_id,
        env: [],
        fromAppTemplate: false
      }'
  )"

  local raw
  local url="${PORTAINER_URL%/}/api/stacks/create/swarm/string?endpointId=${PORTAINER_ENDPOINT_ID}"

  raw="$(http_json POST "$url" "$payload")"
  parse_http_response "$raw"

  [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] || {
    echo "$RESPONSE_BODY" >&2
    fail "erro ao criar stack '$stack_name' (HTTP $HTTP_CODE)"
  }

  log "stack criada com sucesso: $stack_name"
  echo "$RESPONSE_BODY"
}

update_stack() {
  local stack_id="$1"
  local stack_name="$2"
  local stack_content="$3"

  local payload
  payload="$(
    jq -n \
      --arg content "$stack_content" \
      '{
        stackFileContent: $content,
        env: [],
        prune: true,
        pullImage: true
      }'
  )"

  local raw
  local url="${PORTAINER_URL%/}/api/stacks/${stack_id}?endpointId=${PORTAINER_ENDPOINT_ID}"

  raw="$(http_json PUT "$url" "$payload")"
  parse_http_response "$raw"

  [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] || {
    echo "$RESPONSE_BODY" >&2
    fail "erro ao atualizar stack '$stack_name' (HTTP $HTTP_CODE)"
  }

  log "stack atualizada com sucesso: $stack_name (ID ${stack_id})"
  echo "$RESPONSE_BODY"
}

main() {
  require_cmd curl
  require_cmd jq
  require_cmd python3

  if [ $# -ne 1 ]; then
    usage
    exit 1
  fi

  ENVIRONMENT="$1"

  [ -n "$ENVIRONMENT" ] || fail "parâmetro AMBIENTE é obrigatório"

  select_environment "$ENVIRONMENT"
  load_latest_image_tag
  validate_required_files
  load_env_file

  local stack_name_var="STACK_NAME_$(printf '%s' "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')"
  local stack_name="${!stack_name_var:-${STACK_NAME:-}}"
  stack_name="${stack_name:-$(extract_stack_name_from_compose "$STACK_FILE")}"
  [ -n "$stack_name" ] || fail "não foi possível descobrir o nome da stack pelo image: do arquivo $STACK_FILE"

  local image_name
  image_name="$(detect_image_name)"

  local stack_content
  stack_content="$(render_stack_content "$STACK_FILE" "$IMAGE_TAG" "$image_name")"

  log "repo root: $REPO_ROOT"
  log "ambiente: $ENVIRONMENT"
  log "stack: $stack_name"
  log "imagem: ${image_name}:${IMAGE_TAG}"
  log "image tag: $IMAGE_TAG"
  log "arquivo stack: $STACK_FILE"
  log "arquivo env: $ENV_FILE"
  log "portainer: $PORTAINER_URL"
  log "endpoint: $PORTAINER_ENDPOINT_ID"

  show_rendered_image_lines "$stack_content"

  local stack_id
  stack_id="$(find_stack_id "$stack_name")"

  if [ -n "$stack_id" ]; then
    log "stack encontrada, iniciando atualização"
    update_stack "$stack_id" "$stack_name" "$stack_content"
  else
    log "stack não encontrada, iniciando criação"
    local swarm_id
    swarm_id="$(get_swarm_id)"
    log "swarm ID: $swarm_id"
    create_stack "$stack_name" "$stack_content" "$swarm_id"
  fi
}

main "$@"
