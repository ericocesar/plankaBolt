---
type: skill
name: Bug Investigation
description: Investigate Taskbolt defects by tracing a user flow through React state, the Sails API, and PostgreSQL.
skillSlug: bug-investigation
phases: [E, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Investigação de bugs

1. Reproduza com usuário, projeto, quadro e cartão mínimos quando o problema depender de permissões.
2. Localize a origem no componente e siga a action, saga e chamada em `client/src/api/`.
3. Siga o controlador, policy, helper e model correspondente em `server/api/`.
4. Verifique resposta HTTP, evento Socket.IO e dados persistidos antes de atribuir a causa ao frontend.
5. Corrija a causa raiz e adicione teste de regressão no nível mais próximo do defeito.

Cheque com atenção campos ausentes em payloads, escopo de membership, ordenação de listas/cartões e acesso a anexos. Não deixe logs contendo tokens, e-mails ou URLs assinadas.
