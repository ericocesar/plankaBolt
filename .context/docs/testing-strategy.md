---
type: doc
name: testing-strategy
description: Test frameworks, patterns, coverage requirements, and quality gates
category: testing
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Estratégia de testes

## Pirâmide de testes

- **Servidor:** testes Mocha em `server/test/integration/` e `server/test/utils/`, executados com Supertest quando há fluxo HTTP.
- **Cliente:** testes Jest próximos a `client/src/` e mocks em `client/src/utils/__mocks__/`.
- **Aceitação:** cenários Cucumber em `client/tests/acceptance/`, executados com Playwright.

## Regras de alteração

Adicione teste de regressão para correções. Para uma mudança de API, cubra autorização, validação e resposta HTTP; para interface, cubra a ação, o estado e o resultado visível. Uma mudança de esquema exige migração e testes que exercitem o novo comportamento sobre um banco limpo.

## Comandos

```sh
npm run server:test
npm run client:test
npm run client:lint
npm run server:lint
```

Use testes de aceitação para jornadas críticas que atravessam cliente e servidor. Evite mocks que escondam políticas ou formato de resposta incorretos; prefira exercitar o contrato real nos testes de integração.
