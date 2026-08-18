---
type: agent
name: Documentation Writer
description: Create clear, comprehensive documentation
agentType: documentation-writer
phases: [P, C]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Documentação

Documente comportamento observado no código, não suposições. Mantenha `.context/docs/` consistente com os scripts em `package.json`, a configuração Docker e os limites entre cliente e servidor.

Ao mudar endpoint, variável de ambiente, migração ou fluxo de usuário, atualize o documento relacionado e use caminhos reais do repositório. Não registre segredos ou detalhes operacionais sensíveis.

## Available Skills

The following skills provide detailed procedures for specific tasks. Activate them when needed:

| Skill | Description |
|-------|-------------|
| [commit-message](./../skills/commit-message/SKILL.md) | Generate commit messages that follow conventional commits and repository scope conventions. Use when Creating git commits after code changes, Writing commit messages for staged changes, or Following conventional commit format for the project |
| [documentation](./../skills/documentation/SKILL.md) | Generate and update technical documentation. Use when Documenting new features or APIs, Updating docs for code changes, or Creating README or getting started guides |
