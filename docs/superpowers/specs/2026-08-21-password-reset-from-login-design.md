# Password Reset from Login

## Goal

Allow a user who forgot their password to recover access by:

1. Clicking **"Esqueci minha senha"** on the login screen.
2. Entering their email into a modal that sends a reset link.
3. Receiving an email with a link to `/reset-password?token=…`.
4. On that page, entering and confirming a new password.

The reset email is only sent when the email belongs to an **active** user (not deactivated, not the default admin, not in demo mode). Backend always returns success on the request endpoint to prevent user enumeration.

## Status of Existing Work

A prior commit already shipped the bulk of the wiring. Reuse it; do not rewrite.

Already in place:
- `server/api/controllers/password-resets/request.js` — POST `/api/password-resets/request`, anti-enumeration, SMTP check, JWT (1h) link.
- `server/api/controllers/password-resets/reset.js` — POST `/api/password-resets/reset`, bcrypt hash update, session invalidation, blocks default admin and demo mode.
- `server/config/routes.js` (lines 134-135) and `server/config/policies.js` (lines 32-33) — both endpoints registered as public.
- `client/src/api/password-resets.js` — `requestPasswordReset` and `resetPassword` http wrappers.
- `client/src/api/index.js` — spreads `passwordResets` into the default export.
- `client/src/constants/ActionTypes.js` and `EntryActionTypes.js` — all `PASSWORD_RESET_*` action types.
- `client/src/actions/login.js` and `client/src/entry-actions/login.js` — action creators for `requestPasswordReset`, `resetPassword`, `clearPasswordResetRequestError`, `clearPasswordResetError`.
- `client/src/reducers/ui/authenticate-form.js` — state shape `passwordResetRequestForm` and `passwordResetForm` (isSubmitting/error).
- `client/src/sagas/login/services/login.js` — sagas `requestPasswordReset`, `resetPassword`, `clearPasswordResetRequestError`, `clearPasswordResetError`.
- `client/src/sagas/login/watchers/login.js` — `takeEvery` for the four entry actions.
- `client/src/components/common/Login/PasswordResetModal.jsx` and `.module.scss` — modal UI with email input + post-submit confirmation screen; reads `selectAuthenticateForm` for both form states.

Gaps to close:
1. Modal is never rendered (no open state, no wiring in `Content.jsx`).
2. No "Forgot password?" link in `Content.jsx`.
3. No `/reset-password` page; the `resetPassword` saga has no UI consumer.
4. No public route registered for `/reset-password` in `Root.jsx`; no entry in `constants/Paths.js`.
5. No `OPEN_PASSWORD_RESET_MODAL` / `CLOSE_PASSWORD_RESET_MODAL` actions or state.
6. Translations missing in every locale (the modal references `common.resetPassword_title`, `common.resetPasswordIntro`, `common.resetPasswordEmailSent`, `common.smtpNotConfigured`, `common.invalidResetToken`, `common.invalidEmail`, `action.sendResetLink`, `action.cancelAndClose`).

## Architecture

### State

Add to `client/src/reducers/ui/authenticate-form.js` initial state:
```js
isPasswordResetModalOpen: false,
```

Two new action types in `client/src/constants/ActionTypes.js`:
```js
OPEN_PASSWORD_RESET_MODAL: `${PREFIX}/OPEN_PASSWORD_RESET_MODAL`,
CLOSE_PASSWORD_RESET_MODAL: `${PREFIX}/CLOSE_PASSWORD_RESET_MODAL`,
```

Reducer cases:
- `OPEN_PASSWORD_RESET_MODAL` → `isPasswordResetModalOpen: true`
- `CLOSE_PASSWORD_RESET_MODAL` → `isPasswordResetModalOpen: false`

(The close path also clears reset errors by piggy-backing on the existing `PASSWORD_RESET_REQUEST_ERROR_CLEAR` and `PASSWORD_RESET_ERROR_CLEAR` action types dispatched from `PasswordResetModal.handleClose`.)

Action creators (both files `client/src/actions/login.js` and `client/src/entry-actions/login.js`):
```js
const openPasswordResetModal = () => ({ type: ActionTypes.OPEN_PASSWORD_RESET_MODAL, payload: {} });
const closePasswordResetModal = () => ({ type: ActionTypes.CLOSE_PASSWORD_RESET_MODAL, payload: {} });
```

Selectors are unchanged — `selectAuthenticateForm` already returns the full slice.

### Backend

No changes. The two controllers and routes are final.

### UI

#### `client/src/components/common/Login/Content.jsx`

Add:
- `import PasswordResetModal from './PasswordResetModal';`
- `import entryActions from '../../../entry-actions';` (already present)
- Read `isPasswordResetModalOpen` from `selectAuthenticateForm`.
- Render `{isPasswordResetModalOpen && <PasswordResetModal />}` next to `{step === AccessTokenSteps.VERIFY_TOTP && <TotpChallengeModal />}`.
- Inside the form, after the `Input.Password` wrapper, add a "forgot password" link:
  ```jsx
  <div className={styles.forgotWrapper}>
    <Link onClick={handleForgotPassword}>{t('common.forgotPassword')}</Link>
  </div>
  ```
- `handleForgotPassword` dispatches `entryActions.openPasswordResetModal()`.
- Need `Link` import from `semantic-ui-react`.

#### `client/src/components/common/Login/Content.module.scss`

Add `.forgotWrapper` (text-align right, margin-top 4px, font-size 13px, color via CSS var token).

#### `client/src/components/common/Login/PasswordResetModal.jsx`

Adjustments:
- Read `isPasswordResetModalOpen` from selector.
- Bind Modal `open={isPasswordResetModalOpen}`.
- Add `onClose` to Modal calling `handleClose`.
- In `handleClose`, dispatch `entryActions.closePasswordResetModal()` in addition to the existing error clears.

#### `client/src/pages/ResetPassword/ResetPassword.jsx` (new file)

Standalone public page. Reuses `authenticateForm.passwordResetForm` for submission state. Behavior:

1. On mount, read `token` from `URLSearchParams(window.location.search)`.
2. If missing → render error screen with "Voltar para o login" link (uses `Paths.LOGIN`).
3. Otherwise render form with two password fields (`password`, `passwordConfirm`) and a submit button "Alterar senha".
4. Client-side validation: both fields non-empty, match each other, pass `isPassword` validator from `client/src/utils/validator.js`.
5. Submit dispatches `entryActions.resetPassword({ token, password })`.
6. While `passwordResetForm.isSubmitting`, disable fields and show loading button.
7. On `passwordResetForm.error`:
   - `message === 'Invalid or expired token'` → render full-screen error with "Solicitar novo link" (dispatches open modal would not help here — link directly to `/login` with state reset, or call `requestPasswordReset` only after user re-enters email). Simplest: render the same error screen with a "Voltar para o login" link.
   - any other → inline `Message error`.
8. On `passwordResetForm.isSubmitting` transitioning false without error → render success screen with "Ir para o login" link to `/login`.

Use the same visual language as `Login/Content.jsx` (Grid two-column with cover, logo, gold accent tokens). Create `client/src/pages/ResetPassword/ResetPassword.module.scss` mirroring `Content.module.scss`.

`client/src/pages/ResetPassword/index.js`:
```js
import ResetPassword from './ResetPassword';
export default ResetPassword;
```

#### `client/src/components/common/Root.jsx`

Add a route before the catch-all:
```jsx
<Route path={Paths.RESET_PASSWORD} element={<ResetPassword />} />
```
Import `ResetPassword` from `../../pages/ResetPassword`.

#### `client/src/constants/Paths.js`

Add (between `OIDC_CALLBACK` and `PROJECTS`):
```js
const RESET_PASSWORD = `${Config.BASE_PATH}/reset-password`;
```
And export it.

#### `client/src/sagas/login/services/router.js`

The existing `handleLocationChange` only redirects unknown paths to `/login` and waits for `LOGIN_INITIALIZE`. Add a case so that when `pathsMatch.pattern.path === Paths.RESET_PASSWORD`, the saga does NOT redirect away and does NOT trigger `LOGIN_INITIALIZE`.

Pattern:
```js
switch (pathsMatch.pattern.path) {
  case Paths.RESET_PASSWORD:
    // public page; do nothing
    return;
  case Paths.ROOT:
  case Paths.PROJECTS:
  case Paths.BOARDS:
  case Paths.CARDS:
    yield call(goToLogin);
    break;
  default:
}
```

(`handleLocationChange` runs while unauthenticated; once authenticated, `core/services/router.js` takes over.)

### Translations

Add to **`client/src/locales/en-US/login.js`**:
```js
forgotPassword: 'Forgot password?',
resetPassword_title: 'Reset Password',
resetPasswordIntro: 'Enter your email address and we will send you a link to reset your password.',
resetPasswordEmailSent: 'If the email exists in our system, a reset link has been sent. Check your inbox.',
resetPasswordNewPassword: 'New password',
resetPasswordConfirmPassword: 'Confirm new password',
resetPasswordSubmit: 'Change password',
resetPasswordSuccess: 'Your password has been changed successfully.',
resetPasswordBackToLogin: 'Back to login',
resetPasswordInvalidToken: 'The reset link is invalid or has expired. Please request a new one.',
smtpNotConfigured: 'Email is not configured on the server. Please contact your administrator.',
invalidResetToken: 'Invalid or expired reset link.',
invalidEmail: 'Invalid email address.',
```

Add equivalent entries to **`client/src/locales/pt-BR/login.js`** (Portuguese is the user's language — full translations):
```js
forgotPassword: 'Esqueci minha senha',
resetPassword_title: 'Redefinir senha',
resetPasswordIntro: 'Informe seu e-mail e enviaremos um link para redefinir sua senha.',
resetPasswordEmailSent: 'Se o e-mail existir no sistema, um link de redefinição foi enviado. Verifique sua caixa de entrada.',
resetPasswordNewPassword: 'Nova senha',
resetPasswordConfirmPassword: 'Confirmar nova senha',
resetPasswordSubmit: 'Alterar senha',
resetPasswordSuccess: 'Sua senha foi alterada com sucesso.',
resetPasswordBackToLogin: 'Voltar para o login',
resetPasswordInvalidToken: 'O link de redefinição é inválido ou expirou. Solicite um novo.',
smtpNotConfigured: 'O e-mail não está configurado no servidor. Contate o administrador.',
invalidResetToken: 'Link de redefinição inválido ou expirado.',
invalidEmail: 'Endereço de e-mail inválido.',
```

Other locales (`es-ES`, `fr-FR`, `de-DE`, etc.) — leave unchanged. i18next falls back to `en-US` when a key is missing, so the modal/page works in every language with English fallback strings. Adding 18 locales × 10 keys is out of scope; revisit if i18n completeness becomes a requirement.

### Error handling matrix

| Surface | Source | UI |
|---|---|---|
| Modal request | `Invalid email` | inline `Message error` `common.invalidEmail` |
| Modal request | `SMTP is not configured` | inline `Message warning` `common.smtpNotConfigured` |
| Modal request | network failure | inline `Message warning` `common.unknownError` |
| Reset page | `Invalid or expired token` | full-screen error + "Voltar para o login" |
| Reset page | missing `token` query param | full-screen error + "Voltar para o login" |
| Reset page | password mismatch / weak password | inline validation message, block submit |
| Reset page | success | full-screen success + "Ir para o login" |

### Security

Reuses protections already in `server/api/controllers/password-resets/request.js` and `reset.js`:
- JWT with 1-hour expiry (`60 * 60` in `createJwtToken`).
- `request` returns 200 with empty body regardless of email existence, existence of active user, or SMTP outcome from the caller's perspective (errors at SMTP level still surface as `smtpNotConfigured`; user-enumeration is prevented because missing/deactivated users get the same "ok" response with no email sent).
- `reset` blocks the default admin email and `sails.config.custom.demoMode` users.
- `reset` invalidates every `Session` row for the user after a successful change.

No additional security work required.

## File-level change list

Edit:
- `client/src/components/common/Login/Content.jsx` — forgot link, render `PasswordResetModal`.
- `client/src/components/common/Login/Content.module.scss` — `.forgotWrapper`.
- `client/src/components/common/Login/PasswordResetModal.jsx` — `open`/`onClose`, dispatch `closePasswordResetModal`.
- `client/src/reducers/ui/authenticate-form.js` — `isPasswordResetModalOpen`, two cases.
- `client/src/constants/ActionTypes.js` — two new types.
- `client/src/actions/login.js` — two new action creators.
- `client/src/entry-actions/login.js` — two new action creators.
- `client/src/constants/Paths.js` — `RESET_PASSWORD`.
- `client/src/sagas/login/services/router.js` — skip redirect for `RESET_PASSWORD`.
- `client/src/components/common/Root.jsx` — register `<Route>` for `RESET_PASSWORD`.
- `client/src/locales/en-US/login.js` — 10 new keys.
- `client/src/locales/pt-BR/login.js` — 10 new keys (translated).

Create:
- `client/src/pages/ResetPassword/ResetPassword.jsx`
- `client/src/pages/ResetPassword/ResetPassword.module.scss`
- `client/src/pages/ResetPassword/index.js`

## Verification

Manual end-to-end:
1. `cd server && npm run start:dev` and `cd client && npm run start`. Visit `/login`.
2. Confirm "Esqueci minha senha" link appears under the password field.
3. Click → modal opens. Submit an existing active user's email → backend sends email → modal flips to "email enviado" state. Confirm console shows 200 from `/api/password-resets/request`.
4. Submit a non-existent email → same 200, modal flips to the same "email enviado" state (no enumeration leak).
5. Submit with `SMTP` not configured → modal shows the `smtpNotConfigured` warning.
6. Click the link in the email → lands on `/reset-password?token=…` → form renders.
7. Submit mismatched passwords → inline validation blocks submit.
8. Submit valid passwords → success screen → click "Ir para o login" → log in with the new password.
9. Open the link with a tampered/expired token → page shows the error screen with "Voltar para o login" link.
10. Open `/reset-password` with no `token` query → same error screen.

Backend-only smoke (no UI):
- `curl -X POST localhost:1337/api/password-resets/request -H 'Content-Type: application/json' -d '{"email":"x@y.com"}'` → 200 with `{"item":{}}`.

Build sanity:
- `cd client && npm run lint` clean.
- `cd client && npm run build` succeeds.
