---
type: skill
name: Commit Message
description: Write concise conventional commit messages for focused Taskbolt changes after reviewing the staged diff.
skillSlug: commit-message
phases: [E, C]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Mensagens de commit

Inspecione o diff preparado e descreva a alteração, não a intenção vaga. Use o formato `type(scope): resumo` quando houver um tipo claro, por exemplo:

```text
fix(attachments): reject traversal paths before storage lookup
feat(forms): add public ticket status filter
chore(deps): update server dependencies
```

Use escopos do domínio ou pacote afetado, como `client`, `server`, `cards`, `boards`, `forms` ou `docker`. Mantenha a primeira linha curta e no imperativo. Não misture atualização do upstream, refatoração ampla e funcionalidade nova no mesmo commit quando puder separá-las.
