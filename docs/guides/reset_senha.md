# Guia: Como Resetar a Senha de um Usuário no Servidor de Produção

Existem diferentes maneiras de resetar a senha de um usuário no servidor de produção, dependendo do tipo de acesso que você possui:

---

## Opção 1: Pela Interface Web (Painel de Administração)
*Recomendado caso você tenha acesso a uma conta com privilégios de Administrador.*

1. Faça login como **Administrador** na aplicação.
2. Clique no seu avatar no canto superior direito e selecione **Administração / Usuários**.
3. Localize o usuário desejado na lista e clique em **Editar**.
4. Defina a nova senha no campo correspondente e salve as alterações.

> **Nota:** Administradores podem atualizar a senha de outros usuários sem a necessidade de informar a senha anterior do usuário.

---

## Opção 2: Resetar a Conta de Administrador via Variáveis de Ambiente (Docker)
*Ideal se você perdeu a senha do administrador padrão e gerencia o servidor via Docker Compose.*

1. No arquivo `docker-compose.yml` (ou no arquivo `.env` / stack de produção), defina ou atualize as variáveis:
   ```yaml
   environment:
     - DEFAULT_ADMIN_EMAIL=admin@seudominio.com
     - DEFAULT_ADMIN_PASSWORD=SuaNovaSenhaForte123!
   ```
2. Reinicie o container da aplicação:
   ```bash
   docker compose up -d
   ```
   *(Durante o boot do container, o script de seed inicializa e atualiza automaticamente o hash da senha no banco de dados).*

---

## Opção 3: Executar o Script Interativo no Container Docker
*Ideal para criar ou atualizar interativamente um usuário administrador diretamente pelo terminal do servidor.*

Execute no terminal do servidor:
```bash
docker compose exec -it planka node db/create-admin-user.js
```
O script solicitará interativamente: `Email`, `Password`, `Name` e `Username`. Ao informar o e-mail de um usuário existente, os dados e a senha serão atualizados.

---

## Opção 4: Script Node.js via Terminal (Para Qualquer Usuário sem reiniciar)
*Permite resetar a senha de qualquer usuário (comum ou admin) diretamente dentro do container Node.js.*

Execute no terminal do servidor (substitua o e-mail e a nova senha):
```bash
docker compose exec -it planka node -e "
const bcrypt = require('bcryptjs');
const initKnex = require('knex');
const knex = initKnex(require('./db/knexfile'));

(async () => {
  const email = 'usuario@seudominio.com';
  const newPassword = 'NovaSenhaForte123!';

  const hash = await bcrypt.hash(newPassword, 10);
  const updated = await knex('user_account')
    .where('email', email.toLowerCase())
    .update({
      password: hash,
      password_changed_at: new Date()
    });

  if (updated) {
    console.log('✅ Senha atualizada com sucesso para:', email);
  } else {
    console.error('❌ Usuário não encontrado!');
  }
  await knex.destroy();
})();
"
```

---

## Opção 5: Diretamente no Banco de Dados PostgreSQL
*Se preferir executar diretamente via SQL no PostgreSQL.*

1. **Gere o hash bcrypt (10 rounds)** da nova senha:
   ```bash
   docker compose exec -it planka node -e "require('bcryptjs').hash('NovaSenhaForte123!', 10).then(console.log)"
   ```
2. **Execute o `UPDATE` no banco PostgreSQL** (`psql`):
   ```sql
   UPDATE user_account
   SET password = '<hash_gerado_no_passo_1>',
       password_changed_at = NOW()
   WHERE email = 'usuario@seudominio.com';
   ```

---

## Desativação de Autenticação em Duas Etapas (2FA / TOTP)
Se o usuário estiver bloqueado pelo 2FA (TOTP) e perdeu acesso aos códigos de recuperação e ao aplicativo autenticador, execute no banco PostgreSQL:
```sql
UPDATE user_account
SET is_totp_enabled = false, totp_secret = NULL, totp_recovery_codes = NULL
WHERE email = 'usuario@seudominio.com';
```
