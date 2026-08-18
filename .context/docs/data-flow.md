---
type: doc
name: data-flow
description: How data moves through the system and external integrations
category: data-flow
generated: 2026-08-18
status: filled
scaffoldVersion: "2.0.0"
---

# Fluxo de dados e integrações

## Fluxo principal

1. O React renderiza um domínio a partir do estado Redux-ORM.
2. Uma ação dispara uma saga em `client/src/sagas/`.
3. A saga chama `client/src/api/`, usando o proxy Vite em desenvolvimento ou a URL pública em produção.
4. Um controlador Sails valida a solicitação, aplica políticas e delega a operação para helpers e modelos.
5. O servidor grava ou consulta PostgreSQL e devolve a entidade normalizada.
6. A saga atualiza o store; eventos Socket.IO propagam alterações relevantes a clientes conectados.

## Arquivos

Uploads passam por controladores de anexos e pelo hook `server/api/hooks/file-manager/`. O backend valida o arquivo, guarda os metadados no banco e grava o conteúdo no armazenamento local ou S3. Downloads e pré-visualizações continuam sujeitos às permissões do cartão, projeto ou formulário associado.

## Integrações externas

- **PostgreSQL:** fonte de verdade do domínio.
- **S3 (opcional):** configurado por `S3_*` para anexos, avatares e imagens.
- **SMTP (opcional):** configurado por `SMTP_*` para notificações por e-mail.
- **OIDC (opcional, sujeito à versão do upstream):** parâmetros `OIDC_*` habilitam autenticação federada quando suportada pela versão em uso.
- **Gravatar (opcional):** pode ser configurado por `GRAVATAR_BASE_URL`; avalie o impacto de privacidade antes de habilitá-lo.

## Falhas e observabilidade

Erros devem ser devolvidos pelos formatos de resposta do servidor, registrados sem segredos e tratados no cliente com notificações apropriadas. Para diagnosticar fluxos, comece pelo controlador, siga o helper e o modelo correspondente, e confirme a ação/saga que inicia a chamada.

Veja também [architecture.md](architecture.md) e [security.md](security.md).
