# Guia de Configuração OIDC (SSO) no Planka

Este guia descreve como configurar a autenticação via OpenID Connect (OIDC) no Planka, com foco especial na integração com o **Authentik**.

## 1. Variáveis de Ambiente Necessárias

Para habilitar o OIDC, você deve configurar as seguintes variáveis de ambiente no seu arquivo `docker-compose.yml` ou no ambiente do servidor Planka:

| Variável | Descrição | Exemplo / Padrão |
| :--- | :--- | :--- |
| `BASE_URL` | URL base pública do seu Planka | `https://planka.exemplo.com` |
| `OIDC_ISSUER` | URL do emissor (Issuer) do OIDC | `https://auth.exemplo.com/application/o/planka/` |
| `OIDC_CLIENT_ID` | Client ID gerado pelo provedor | `seu-client-id` |
| `OIDC_CLIENT_SECRET` | Client Secret gerado pelo provedor | `seu-client-secret` |
| `OIDC_SCOPES` | Escopos solicitados | `openid email profile` |
| `OIDC_ENFORCED` | Forçar login via OIDC (desabilita login local) | `false` (padrão) |
| `OIDC_ADMIN_ROLES` | Grupos/Roles que terão permissão de admin | `admin` |
| `OIDC_ROLES_ATTRIBUTE` | Atributo no token que contém os grupos | `groups` (padrão) |
| `OIDC_EMAIL_ATTRIBUTE` | Atributo no token que contém o e-mail | `email` (padrão) |
| `OIDC_NAME_ATTRIBUTE` | Atributo no token que contém o nome | `name` (padrão) |
| `OIDC_USERNAME_ATTRIBUTE`| Atributo no token para o nome de usuário | `preferred_username` |

## 2. Configuração no Authentik

Siga estes passos para configurar o Planka como uma aplicação no Authentik:

### Passo 1: Criar o Provider
1. No painel do Authentik, vá em **Resources** -> **Providers**.
2. Clique em **Create**.
3. Selecione **OAuth2/OpenID Provider**.
4. Configure os seguintes campos:
   - **Name**: Planka
   - **Authentication flow**: Selecione seu fluxo de autenticação (ex: `default-authentication-flow`).
   - **Authorization flow**: Selecione seu fluxo de autorização (ex: `default-provider-authorization-explicit-consent`).
   - **Client Type**: `Confidential`.
   - **Redirect URIs**: Adicione a URI de redirecionamento do Planka (veja a seção abaixo).
   - **Signing Key**: Selecione uma chave de assinatura válida.

### Passo 2: Criar a Application
1. Vá em **Resources** -> **Applications**.
2. Clique em **Create**.
3. Configure:
   - **Name**: Planka
   - **Slug**: `planka`
   - **Provider**: Selecione o provider "Planka" criado no passo anterior.

### Passo 3: Mapeamento de Grupos (Opcional)
Se desejar que o Authentik envie os grupos do usuário para o Planka:
1. Certifique-se de que o escopo `groups` está configurado ou que o provider inclui os grupos no token.
2. No Planka, a variável `OIDC_ROLES_ATTRIBUTE` deve corresponder ao nome do atributo enviado pelo Authentik (geralmente `groups`).

## 3. URI de Redirecionamento (Redirect URI)

A URI de redirecionamento principal que deve ser configurada no Authentik (ou em qualquer outro provedor OIDC) é a seguinte:

```text
https://<SUA_URL_DO_PLANKA>/oidc-callback
```

**Importante:**
- O Planka utiliza apenas a rota `/oidc-callback` para processar o retorno do provedor de identidade.
- **Não** é necessário configurar uma `logout-callback` (como `/api/auth/oidc/logout-callback`). O Planka gerencia o encerramento da sessão internamente e redireciona para o provedor de identidade conforme necessário, sem exigir uma rota de retorno específica de logout no código do Planka.

**Exemplo:**
Se o seu Planka está acessível em `https://planka.empresa.com.br`, a Redirect URI será:
`https://planka.empresa.com.br/oidc-callback`

---

## Notas Adicionais
- Certifique-se de que a `BASE_URL` está configurada corretamente, pois ela é usada para construir a URI de redirecionamento internamente.
- Se você estiver usando HTTP em vez de HTTPS (não recomendado), certifique-se de que o provedor OIDC permite redirecionamentos inseguros.

## Troubleshooting

### Redirect URI Error no Authentik
Se o Authentik mostrar **Redirect URI Error**, verifique:
- Se a `BASE_URL` está exatamente igual à URL pública do Planka (mesmo host e protocolo).
- Se a `BASE_URL` não termina com `/` (barra no final), para evitar `//oidc-callback`.
- Se no Authentik o campo **Redirect URIs** contém exatamente `https://<SUA_URL_DO_PLANKA>/oidc-callback`.
