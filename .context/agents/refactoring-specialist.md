---
type: agent
name: Refactoring Specialist
description: Identify code smells and improvement opportunities
agentType: refactoring-specialist
phases: [E]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Refatoração

Refatore em passos pequenos, com comportamento coberto antes e depois. Preserve os limites controller/helper/model no servidor e component/action/saga/selector no cliente.

Evite combinar refatoração interna com alteração de contrato. Mantenha o diff compatível com o histórico do fork para reduzir conflitos ao integrar versões do Planka upstream.

## Available Skills

The following skills provide detailed procedures for specific tasks. Activate them when needed:

| Skill | Description |
|-------|-------------|
| [refactoring](./../skills/refactoring/SKILL.md) | Refactor code safely with a step-by-step approach. Use when Improving code structure without changing behavior, Reducing code duplication, or Simplifying complex logic |
