# Guia da API: Projetos, Quadros, Cards, Tarefas e Membros

Este documento apresenta a análise de conformidade do arquivo de coleção do Postman (`PLANKA API.postman_collection.json`) com o código-fonte da aplicação, além da especificação detalhada e exemplos `curl` para criação e gerenciamento de Projetos, Quadros, Listas, Cards, Listas de Tarefas (Checklists), Atribuição de Membros e Datas de Vencimento.

---

## 1. Análise de Atualização da Documentação Postman vs Código

Ao comparar o arquivo `docs/api/PLANKA API.postman_collection.json` com as rotas definidas no backend (`server/config/routes.js` e controllers em `server/api/controllers/`):

- **Status Geral**: **Parcialmente Atualizada (96 endpoints documentados vs 117 rotas no código)**.
- **Módulos Principais (Projetos, Quadros, Listas, Cards, Tarefas, Membros, Comentários, Anexos, Campos Customizados)**:
  - **100% compatíveis e atualizados**: Os endpoints, verbos HTTP, parâmetros de rota e payloads JSON para o ciclo de vida do Kanban correspondem exatamente aos controladores em execução no Sails.js.
- **Endpoints ausentes no Postman Collection**:
  - Módulo de Formulários (`GET/POST /api/forms`, `GET/PATCH/DELETE /api/forms/:id`, `POST /api/forms/:id/publish`, `GET /api/forms/:id/responses`).
  - Módulo de Chamados Públicos (`POST /api/public-tickets/:formId`, `GET /api/public-tickets/:formId`).
  - Gestão de Configuração e SMTP (`PATCH /api/config`, `POST /api/config/test-smtp`, `PATCH /api/_internal/config`).
  - Autenticação Complementar (`GET /api/bootstrap`, `POST /api/access-tokens/verify-totp`).

---

## 2. Autenticação

A API aceita duas formas de autenticação via Headers:

1. **Bearer Token JWT** (Recomendado para sessões):
   ```http
   Authorization: Bearer <SEU_ACCESS_TOKEN>
   ```
2. **API Key** (Recomendado para integrações externas e automações):
   ```http
   X-Api-Key: <SUA_API_KEY>
   ```

### 2.1. Obter Access Token (Login)
- **Endpoint:** `POST /api/access-tokens`
- **Exemplo curl:**
  ```bash
  curl -s -X POST "https://task.bolt360.com.br/api/access-tokens" \
    -H "Content-Type: application/json" \
    -d '{
      "emailOrUsername": "admin@example.com",
      "password": "SuaSenhaSegura123",
      "withHttpOnlyToken": false
    }'
  ```
- **Resposta de Sucesso (200 OK):**
  ```json
  {
    "item": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

## 3. Endpoints e Exemplos cURL

Defina as variáveis no seu terminal para facilitar os testes:

```bash
export BASE_URL="https://task.bolt360.com.br/api"
export TOKEN="SEU_ACCESS_TOKEN_AQUI"
# ou export API_KEY="SUA_API_KEY_AQUI"
```

---

### 3.1. Criar Projeto (`Project`)

Cria um novo projeto. O usuário autenticado se torna automaticamente o gerente do projeto (*Project Manager*).

- **Método:** `POST`
- **Endpoint:** `/api/projects`
- **Campos do Body:**
  - `name` *(string, obrigatório, máx 128)*: Nome do projeto.
  - `type` *(string, obrigatório)*: `private` ou `shared`.
  - `description` *(string, opcional, máx 1024)*: Descrição do projeto.

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/projects" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Projeto Transformação Digital 2026",
    "type": "shared",
    "description": "Projeto estratégico de evolução e automação de processos."
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000001",
    "createdAt": "2026-08-18T16:00:00.000Z",
    "updatedAt": null,
    "name": "Projeto Transformação Digital 2026",
    "type": "shared",
    "description": "Projeto estratégico de evolução e automação de processos.",
    "backgroundType": null,
    "backgroundGradient": null,
    "backgroundImageId": null,
    "isFavorite": false
  },
  "included": {
    "projectManagers": [
      {
        "id": "1679200000000000002",
        "createdAt": "2026-08-18T16:00:00.000Z",
        "updatedAt": null,
        "projectId": "1679200000000000001",
        "userId": "1674169407133189121"
      }
    ]
  }
}
```

---

### 3.2. Criar Quadro (`Board`)

Cria um novo quadro Kanban dentro de um projeto existente.

- **Método:** `POST`
- **Endpoint:** `/api/projects/:projectId/boards`
- **Parâmetros de Rota:**
  - `projectId` *(string, obrigatório)*: ID do projeto pai.
- **Campos do Body:**
  - `name` *(string, obrigatório, máx 128)*: Nome do quadro.
  - `position` *(number, obrigatório, mín 0)*: Posição de ordenação do quadro (ex: `65536`).

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/projects/1679200000000000001/boards" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint Backlog & Operações",
    "position": 65536
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000003",
    "createdAt": "2026-08-18T16:05:00.000Z",
    "updatedAt": null,
    "projectId": "1679200000000000001",
    "type": "kanban",
    "position": 65536,
    "name": "Sprint Backlog & Operações"
  },
  "included": {
    "boardMemberships": [
      {
        "id": "1679200000000000004",
        "boardId": "1679200000000000003",
        "userId": "1674169407133189121",
        "role": "editor",
        "canComment": true
      }
    ]
  }
}
```

---

### 3.3. Criar Lista / Coluna no Quadro (`List`)

> **Nota:** No Planka, um Card pertence obrigatoriamente a uma Lista (coluna) do Quadro.

- **Método:** `POST`
- **Endpoint:** `/api/boards/:boardId/lists`
- **Parâmetros de Rota:**
  - `boardId` *(string, obrigatório)*: ID do quadro.
- **Campos do Body:**
  - `name` *(string, obrigatório, máx 128)*: Nome da coluna (ex: "A Fazer", "Em Andamento", "Concluído").
  - `type` *(string, obrigatório)*: `active` ou `closed`.
  - `position` *(number, obrigatório, mín 0)*: Posição de ordenação da coluna (ex: `65536`).

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/boards/1679200000000000003/lists" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Em Andamento",
    "type": "active",
    "position": 65536
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000005",
    "createdAt": "2026-08-18T16:10:00.000Z",
    "updatedAt": null,
    "boardId": "1679200000000000003",
    "type": "active",
    "position": 65536,
    "name": "Em Andamento",
    "isCollapsed": false
  }
}
```

---

### 3.4. Criar Card com Data de Vencimento (`Card`)

Cria um card em uma lista. A data de vencimento (`dueDate`) pode ser informada diretamente no momento da criação.

- **Método:** `POST`
- **Endpoint:** `/api/lists/:listId/cards`
- **Parâmetros de Rota:**
  - `listId` *(string, obrigatório)*: ID da lista (coluna).
- **Campos do Body:**
  - `name` *(string, obrigatório, máx 1024)*: Título do card.
  - `type` *(string, obrigatório)*: `project` ou `story`.
  - `position` *(number, obrigatório, mín 0)*: Posição de ordenação do card na lista (ex: `65536`).
  - `description` *(string, opcional, máx 1048576)*: Conteúdo descritivo detalhado (suporta Markdown).
  - `dueDate` *(string ISO 8601, opcional)*: Data e hora de vencimento (ex: `"2026-08-30T18:00:00.000Z"`).
  - `isDueCompleted` *(boolean, opcional)*: Indica se o prazo foi marcado como concluído (`false` por padrão).

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/lists/1679200000000000005/cards" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Implementar Integração via Webhooks",
    "type": "story",
    "position": 65536,
    "description": "Desenvolver os endpoints de sincronização assíncrona para clientes corporativos.",
    "dueDate": "2026-08-30T18:00:00.000Z",
    "isDueCompleted": false
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000006",
    "createdAt": "2026-08-18T16:15:00.000Z",
    "updatedAt": null,
    "boardId": "1679200000000000003",
    "listId": "1679200000000000005",
    "creatorUserId": "1674169407133189121",
    "type": "story",
    "position": 65536,
    "name": "Implementar Integração via Webhooks",
    "description": "Desenvolver os endpoints de sincronização assíncrona para clientes corporativos.",
    "dueDate": "2026-08-30T18:00:00.000Z",
    "isDueCompleted": false,
    "stopwatch": null,
    "commentsTotal": 0,
    "isClosed": false
  }
}
```

---

### 3.5. Atualizar ou Definir Data de Vencimento (`Update Card Due Date`)

Para alterar, marcar como concluído ou remover o prazo de um card já existente:

- **Método:** `PATCH`
- **Endpoint:** `/api/cards/:id`
- **Parâmetros de Rota:**
  - `id` *(string, obrigatório)*: ID do card.
- **Campos do Body:**
  - `dueDate` *(string ISO 8601 ou `null`)*: Nova data de vencimento (ou `null` para remover o prazo).
  - `isDueCompleted` *(boolean, opcional)*: `true` se concluído dentro/fora do prazo, `false` caso contrário.

#### Exemplo cURL (Atualizar Prazo)
```bash
curl -s -X PATCH "${BASE_URL}/cards/1679200000000000006" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dueDate": "2026-09-15T23:59:59.000Z",
    "isDueCompleted": false
  }'
```

#### Exemplo cURL (Remover Prazo)
```bash
curl -s -X PATCH "${BASE_URL}/cards/1679200000000000006" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dueDate": null
  }'
```

---

### 3.6. Criar Lista de Tarefas no Card (`TaskList` / Checklist)

Cria um grupo/bloco de checklist associado ao card.

- **Método:** `POST`
- **Endpoint:** `/api/cards/:cardId/task-lists`
- **Parâmetros de Rota:**
  - `cardId` *(string, obrigatório)*: ID do card.
- **Campos do Body:**
  - `name` *(string, obrigatório, máx 128)*: Título da lista de tarefas (ex: "Critérios de Aceite", "Checklist de Deploy").
  - `position` *(number, obrigatório, mín 0)*: Posição da lista no card (ex: `65536`).
  - `showOnFrontOfCard` *(boolean, opcional)*: Se exibe a contagem/progresso na capa do card.
  - `hideCompletedTasks` *(boolean, opcional)*: Se oculta as tarefas concluídas.

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/cards/1679200000000000006/task-lists" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Critérios de Aceitação",
    "position": 65536,
    "showOnFrontOfCard": true,
    "hideCompletedTasks": false
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000007",
    "createdAt": "2026-08-18T16:20:00.000Z",
    "updatedAt": null,
    "cardId": "1679200000000000006",
    "position": 65536,
    "name": "Critérios de Aceitação",
    "showOnFrontOfCard": true,
    "hideCompletedTasks": false
  }
}
```

---

### 3.7. Criar Tarefa / Item no Checklist (`Task`)

Cria um item individual dentro de uma Lista de Tarefas (`TaskList`).

- **Método:** `POST`
- **Endpoint:** `/api/task-lists/:taskListId/tasks`
- **Parâmetros de Rota:**
  - `taskListId` *(string, obrigatório)*: ID da lista de tarefas pai.
- **Campos do Body:**
  - `name` *(string, obrigatório se não houver linkedCardId, máx 1024)*: Texto da tarefa.
  - `position` *(number, obrigatório, mín 0)*: Posição da tarefa na lista (ex: `65536`).
  - `isCompleted` *(boolean, opcional)*: Status de conclusão (`false` por padrão).
  - `linkedCardId` *(string, opcional)*: ID de outro card para vincular como subtarefa.

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/task-lists/1679200000000000007/tasks" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Escrever testes de integração para autenticação JWT",
    "position": 65536,
    "isCompleted": false
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000008",
    "createdAt": "2026-08-18T16:22:00.000Z",
    "updatedAt": null,
    "taskListId": "1679200000000000007",
    "cardId": "1679200000000000006",
    "position": 65536,
    "name": "Escrever testes de integração para autenticação JWT",
    "isCompleted": false
  }
}
```

---

### 3.8. Atribuir Membro ao Card (`CardMembership`)

Associa um usuário como membro responsável/atribuído ao card.

> **Importante:** O usuário deve ser previamente membro do Quadro (`BoardMember`).

- **Método:** `POST`
- **Endpoint:** `/api/cards/:cardId/card-memberships`
- **Parâmetros de Rota:**
  - `cardId` *(string, obrigatório)*: ID do card.
- **Campos do Body:**
  - `userId` *(string, obrigatório)*: ID do usuário a ser atribuído.

#### Exemplo cURL
```bash
curl -s -X POST "${BASE_URL}/cards/1679200000000000006/card-memberships" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "1674169407133189121"
  }'
```

#### Resposta de Sucesso (200 OK)
```json
{
  "item": {
    "id": "1679200000000000009",
    "createdAt": "2026-08-18T16:25:00.000Z",
    "updatedAt": null,
    "cardId": "1679200000000000006",
    "userId": "1674169407133189121"
  }
}
```

---

### 3.9. Remover Membro do Card (`Delete CardMembership`)

Remove a atribuição de um usuário no card.

- **Método:** `DELETE`
- **Endpoint:** `/api/cards/:cardId/card-memberships/userId::userId`
- **Sintaxe da Rota:** O caminho é composto pelo prefixo `userId:` seguido do ID do usuário.

#### Exemplo cURL
```bash
curl -s -X DELETE "${BASE_URL}/cards/1679200000000000006/card-memberships/userId:1674169407133189121" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

### 3.10. Consultar Card Completo com Tarefas e Membros (`Get Card Details`)

Recupera todos os dados detalhados do card e seus objetos relacionados (*included*).

- **Método:** `GET`
- **Endpoint:** `/api/cards/:id`

#### Exemplo cURL
```bash
curl -s -X GET "${BASE_URL}/cards/1679200000000000006" \
  -H "Authorization: Bearer ${TOKEN}"
```

#### Resumo da Resposta:
Retorna o objeto `item` (dados do card) e `included` contendo:
- `cardMemberships`: Lista de associações de membros ao card.
- `taskLists`: Listas de tarefas do card.
- `tasks`: Itens/subtarefas do card.
- `cardLabels`: Etiquetas atribuídas.
- `attachments`: Arquivos anexados.
- `customFieldValues`: Valores de campos personalizados.
- `users`: Informações de perfil dos usuários envolvidos.

---

## 4. Tabela Resumo dos Endpoints

| Ação | Método | Rota | Permissão Requerida |
| :--- | :---: | :--- | :--- |
| **Login / Obter Token** | `POST` | `/api/access-tokens` | Pública |
| **Criar Projeto** | `POST` | `/api/projects` | Admin ou Project Owner |
| **Criar Quadro (Board)** | `POST` | `/api/projects/:projectId/boards` | Gerente do Projeto (Project Manager) |
| **Criar Lista (Coluna)** | `POST` | `/api/boards/:boardId/lists` | Editor do Quadro (Board Editor) |
| **Criar Card** | `POST` | `/api/lists/:listId/cards` | Editor do Quadro (Board Editor) |
| **Atualizar Card / Vencimento** | `PATCH` | `/api/cards/:id` | Editor do Quadro (Board Editor) |
| **Criar Lista de Tarefas** | `POST` | `/api/cards/:cardId/task-lists` | Editor do Quadro (Board Editor) |
| **Criar Tarefa (Item)** | `POST` | `/api/task-lists/:taskListId/tasks` | Editor do Quadro (Board Editor) |
| **Atribuir Membro ao Card** | `POST` | `/api/cards/:cardId/card-memberships` | Editor do Quadro (Board Editor) |
| **Remover Membro do Card** | `DELETE` | `/api/cards/:cardId/card-memberships/userId::userId` | Editor do Quadro (Board Editor) |
| **Consultar Detalhes do Card** | `GET` | `/api/cards/:id` | Membro do Quadro / Admin |
