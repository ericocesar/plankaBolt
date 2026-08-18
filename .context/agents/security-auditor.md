---
type: agent
name: Security Auditor
description: Identify security vulnerabilities
agentType: security-auditor
phases: [R, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Auditoria de segurança

Revise autenticação, policies, memberships, validação de IDs e acesso a anexos. Inspecione `server/api/hooks/file-manager/` contra path traversal, exposição de arquivo privado e confiança indevida no cliente.

Confirme que secrets não aparecem em código, logs ou documentação; revise CORS, proxy e TLS na configuração de implantação. Para falhas encontradas, proponha correção e teste de regressão sem expor detalhes exploráveis desnecessários.

## Available Skills

The following skills provide detailed procedures for specific tasks. Activate them when needed:

| Skill | Description |
|-------|-------------|
| [security-audit](./../skills/security-audit/SKILL.md) | Review code and infrastructure for security weaknesses. Use when Reviewing code for security vulnerabilities, Assessing authentication/authorization, or Checking for OWASP top 10 issues |
