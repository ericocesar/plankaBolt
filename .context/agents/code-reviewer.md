---
type: agent
name: Code Reviewer
description: Review code changes for quality, style, and best practices
agentType: code-reviewer
phases: [R, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Revisão de código

Revise contratos entre `client/src/api/` e `server/api/controllers/`, autorização, validação de entrada, migrações e compatibilidade de sockets. Confirme que o Redux-ORM e as sagas continuam coerentes com a resposta do servidor.

Exija lint e testes relevantes. Dê prioridade a regressões de permissão, dados perdidos, anexos expostos e divergência com o upstream em vez de observações puramente estilísticas.

## Available Skills

The following skills provide detailed procedures for specific tasks. Activate them when needed:

| Skill | Description |
|-------|-------------|
| [code-review](./../skills/code-review/SKILL.md) | Review code quality, patterns, and best practices. Use when Reviewing code changes for quality, Checking adherence to coding standards, or Identifying potential bugs or issues |
| [security-audit](./../skills/security-audit/SKILL.md) | Review code and infrastructure for security weaknesses. Use when Reviewing code for security vulnerabilities, Assessing authentication/authorization, or Checking for OWASP top 10 issues |
