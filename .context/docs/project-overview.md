---
type: doc
name: project-overview
description: High-level overview of the project, its purpose, and key components
category: overview
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Taskbolt

Taskbolt é um fork do Planka adaptado para o produto Bolt. Ele mantém a experiência de gestão visual de projetos — projetos, quadros, listas, cartões, tarefas, comentários, anexos, campos personalizados e formulários públicos — e agrega as customizações do fork.

## Componentes principais

- **Cliente:** aplicação React 18 em `client/`, compilada pelo Vite. O estado usa Redux, Redux-ORM e Redux-Saga; a interface fica em `client/src/components/`.
- **Servidor:** API monolítica em Node.js/Sails em `server/`. Controladores, políticas, modelos, hooks e helpers ficam em `server/api/`.
- **Dados:** PostgreSQL acessado via Knex e Sails ORM; migrações e seeds estão em `server/db/`.
- **Arquivos:** anexos, avatares e fundos são geridos pelo hook de file manager, com suporte a armazenamento local ou S3.
- **Tempo real:** o cliente usa `sails.io.js` e o servidor usa Sails sockets para manter a interface sincronizada.

## Execução local

O comando `npm start` na raiz inicia o servidor e o cliente em paralelo. A interface atende em `http://localhost:3000` e encaminha `/api` e `/attachments` para o servidor em `http://localhost:1337`.

Use `docker-compose-dev.yml` para a pilha de desenvolvimento com PostgreSQL. A imagem de produção configurada no fork declara a versão `2.0.0-rc.4` do Planka; o código do fork contém alterações próprias além dessa referência.

## Organização

- `client/`: interface React, testes unitários e de aceitação.
- `server/`: API, regras de negócio, autenticação, integração de arquivos e testes de integração.
- `charts/`: chart Helm para implantação.
- `docker-compose*.yml`: ambientes Docker local e de desenvolvimento.
- `scripts/`: inicialização de banco e automações de implantação.

Consulte [architecture.md](architecture.md), [data-flow.md](data-flow.md) e [development-workflow.md](development-workflow.md) antes de alterar partes transversais da aplicação.
