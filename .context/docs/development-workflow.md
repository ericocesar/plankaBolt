---
type: doc
name: development-workflow
description: Day-to-day engineering processes, branching, and contribution guidelines
category: workflow
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Fluxo de desenvolvimento

## Branches e upstream

O repositório local usa `origin` para o fork Bolt e `upstream` para `plankanban/planka`. O trabalho ativo fica em `bolt/main`; trate a integração de releases do upstream como uma atualização deliberada, revisando conflitos e regressões das customizações do fork.

## Ambiente local

```sh
npm install
npm start

# Ou a pilha Docker de desenvolvimento
docker compose -f docker-compose-dev.yml up --build
```

A interface fica na porta 3000, a API na 1337 e o PostgreSQL do compose usa a porta interna 5432. Copie e ajuste `server/.env.sample` somente para configurações locais; nunca versione segredos.

## Verificações

```sh
npm run lint
npm test
npm run client:build
npm run server:build
```

Rode testes focados no pacote afetado durante a implementação e o conjunto apropriado antes de integrar. Testes do servidor usam Mocha/Supertest; o cliente usa Jest e testes de aceitação Cucumber/Playwright.

## Revisão

Mantenha mudanças de cliente e servidor coerentes, inclua migração quando o modelo persistido mudar e atualize documentação/configuração quando novas variáveis de ambiente, rotas ou fluxos forem introduzidos. Não reescreva mudanças locais de outros colaboradores.
