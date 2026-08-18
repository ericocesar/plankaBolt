---
name: test-generation
description: Add Taskbolt unit, integration, and acceptance tests for new behavior or bug regressions.
---

# Geração de testes

Escolha o menor nível que prova o risco:

- Use Mocha e Supertest em `server/test/integration/` para controllers, policies, helpers e persistência.
- Use Jest no cliente para reducers, selectors, modelos, sagas e componentes isolados.
- Use Cucumber/Playwright em `client/tests/acceptance/` para jornadas que dependem de cliente e servidor juntos.

Cubra sucesso, validação, autorização e regressão. Use fixtures previsíveis e mocks somente em integrações externas; mantenha o formato de resposta real da API nos testes de cliente. Execute o teste focado antes de ampliar para lint e suítes do pacote afetado.
