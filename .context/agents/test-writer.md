---
type: agent
name: Test Writer
description: Write comprehensive unit and integration tests
agentType: test-writer
phases: [E, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Testes

Escolha o nível mais próximo do risco: Mocha/Supertest em `server/test/` para API e regras de domínio, Jest para estado e componentes em `client/`, Cucumber/Playwright para jornadas completas.

Cubra sucesso, validação, autorização e regressão. Use dados previsíveis e mocks apenas nos limites externos; não mascare o contrato real entre cliente, servidor e banco.

## Available Skills

The following skills provide detailed procedures for specific tasks. Activate them when needed:

| Skill | Description |
|-------|-------------|
| [test-generation](./../skills/test-generation/SKILL.md) | Generate comprehensive test cases for code. Use when Writing tests for new functionality, Adding tests for bug fixes (regression tests), or Improving test coverage for existing code |
