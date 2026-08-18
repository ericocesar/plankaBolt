---
type: agent
name: Database Specialist
description: Design and optimize database schemas
agentType: database-specialist
phases: [P, E]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Banco de dados

Modele mudanças em PostgreSQL através de migrações em `server/db/migrations/`; mantenha modelos em `server/api/models/` e índices alinhados às consultas frequentes.

Planeje rollback e compatibilidade com dados existentes. Evite operações destrutivas sem migração segura, valide relacionamentos de projeto/quadro/cartão e cubra o fluxo em testes de integração.
