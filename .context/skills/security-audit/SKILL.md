---
type: skill
name: Security Audit
description: Audit Taskbolt authentication, authorization, file handling, configuration, and dependency changes for security risks.
skillSlug: security-audit
phases: [R, V]
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Auditoria de segurança

Revise policies e helpers em `server/api/` para garantir que o usuário autenticado tenha acesso ao recurso antes de qualquer leitura ou escrita. Valide IDs, texto, URLs, upload e valores de configuração no servidor.

Inspecione `server/api/hooks/file-manager/` contra path traversal, arquivo público indevido e URLs S3 expostas. Confirme que `SECRET_KEY`, banco, SMTP, S3 e OIDC vêm de ambiente/secrets e não de código ou logs.

Teste fluxos proibidos além do caminho feliz: usuário sem membership, anexo de outro cartão, payload inválido e token/sessão ausente. Priorize correções de alta severidade e adicione regressão automatizada sempre que viável.
