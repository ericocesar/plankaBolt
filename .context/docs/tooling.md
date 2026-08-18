---
type: doc
name: tooling
description: Scripts, IDE settings, automation, and developer productivity tips
category: tooling
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Ferramentas

## Runtime e pacotes

O projeto requer Node.js 18 ou superior. A raiz coordena os pacotes `client/` e `server/`; cada pacote mantém seus próprios scripts e dependências. O servidor cria um ambiente Python durante o pós-install para utilitários de notificação.

## Comandos úteis

```sh
npm start                 # servidor e cliente
npm run lint              # lint dos dois pacotes
npm test                  # testes dos dois pacotes
npm run client:build      # bundle Vite
npm run server:build      # build do servidor
npm run server:db:init    # inicialização do banco
```

## Contêineres

`docker-compose-dev.yml` monta os diretórios de cliente e servidor e inicia Vite, Sails e PostgreSQL. `docker-compose.yml` usa a imagem publicada do Planka e expõe a aplicação na porta 3000.

## Convenções

ESLint combina Airbnb e Prettier com largura de 100 colunas, aspas simples e vírgula final. Mantenha mudanças formatadas pelo lint do pacote afetado. Consulte também [development-workflow.md](development-workflow.md) e [testing-strategy.md](testing-strategy.md).
