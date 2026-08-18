---
type: doc
name: security
description: Security policies, authentication, secrets management, and compliance requirements
category: security
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Segurança

## Segredos e configuração

Defina `SECRET_KEY`, credenciais de banco, SMTP, S3 e OIDC somente por variáveis de ambiente ou secrets do orquestrador. `server/.env` é local e não deve conter valores reutilizáveis em produção. Use `BASE_URL` correto para evitar callbacks, links e cookies inconsistentes.

## Autenticação e autorização

O servidor deve ser a autoridade para sessão, escopo e papéis. Controladores precisam manter suas policies e helpers devem validar a associação do usuário ao projeto, quadro ou cartão antes de ler ou alterar dados. Não confie em IDs ou papéis enviados pelo cliente.

## Arquivos e entrada do usuário

Valide tipo, tamanho e nome de arquivo no fluxo de anexos. Preserve proteções contra path traversal no file manager e não exponha caminhos privados. Normalize e valide entrada de texto, URLs, e-mails e IDs antes de construir consultas ou respostas.

## Operação

- Mantenha dependências atualizadas e revise avisos de segurança antes de integrar releases do upstream.
- Não escreva tokens, senhas, cabeçalhos de autorização ou URLs assinadas nos logs.
- Habilite mensagens detalhadas de autenticação apenas com rate limiting adequado.
- Revise CORS, proxy confiável e TLS de acordo com o ambiente de implantação.

Para uma alteração com impacto de segurança, acrescente teste de regressão e revise `server/api/policies/`, `server/api/hooks/file-manager/` e a configuração relacionada.
