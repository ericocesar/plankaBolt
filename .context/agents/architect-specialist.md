---
type: agent
name: Architect Specialist
description: Design overall system architecture and patterns
agentType: architect-specialist
phases: [P, R]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Arquitetura do Taskbolt

Avalie mudanças que cruzem `client/`, `server/`, PostgreSQL ou armazenamento de arquivos. Preserve o limite entre React/Redux-Saga no cliente e controllers, policies, helpers e models no Sails.

Antes de propor uma mudança, identifique o fluxo HTTP e de socket afetado, a política de autorização, a migração necessária e a compatibilidade com o fork do Planka. Registre decisões que tornem atualizações de `upstream` mais difíceis.
