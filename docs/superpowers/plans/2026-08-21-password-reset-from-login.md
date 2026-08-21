# Password Reset from Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the password-reset flow end-to-end on the login screen: forgot-password link opens a request modal, email link lands on `/reset-password?token=…` with a new-password form.

**Architecture:** Reuse the backend controllers, sagas, action types, and modal component already shipped in a prior commit. Close the gaps: a `Content.jsx` forgot link, modal open/close state, a `/reset-password` page, route registration, and i18n keys.

**Tech Stack:** Sails.js backend, React + Redux + redux-saga + Semantic UI React client, reselect selectors, SCSS modules, i18next.

## Global Constraints

- **Backend unchanged.** Controllers `server/api/controllers/password-resets/request.js` and `reset.js`, routes in `server/config/routes.js` (lines 134-135), policies in `server/config/policies.js` (lines 32-33) are final.
- **Reuse existing sagas and selectors.** `requestPasswordReset`, `resetPassword`, `clearPasswordResetRequestError`, `clearPasswordResetError` action creators exist; `selectAuthenticateForm` selector returns the slice.
- **i18n fallback.** Only `en-US` and `pt-BR` get new keys. Other locales fall back to `en-US` automatically.
- **No new dependencies.**
- **Commit per task** using conventional-commit messages with Co-Authored-By trailer.

## File Structure

Edit:
- `client/src/constants/Paths.js` — add `RESET_PASSWORD` constant.
- `client/src/constants/ActionTypes.js` — add `OPEN_PASSWORD_RESET_MODAL` and `CLOSE_PASSWORD_RESET_MODAL`.
- `client/src/actions/login.js` — add `openPasswordResetModal` and `closePasswordResetModal` action creators.
- `client/src/entry-actions/login.js` — mirror the same two action creators.
- `client/src/reducers/ui/authenticate-form.js` — add `isPasswordResetModalOpen` to initial state; handle `OPEN_PASSWORD_RESET_MODAL` and `CLOSE_PASSWORD_RESET_MODAL`.
- `client/src/sagas/login/services/router.js` — skip redirect for `Paths.RESET_PASSWORD`.
- `client/src/components/common/Login/Content.jsx` — render the forgot-password link and the modal.
- `client/src/components/common/Login/Content.module.scss` — add `.forgotWrapper` style.
- `client/src/components/common/Login/PasswordResetModal.jsx` — bind modal `open`/`onClose` to Redux state, dispatch `closePasswordResetModal`.
- `client/src/components/common/Root.jsx` — register `<Route path={Paths.RESET_PASSWORD} element={<ResetPassword />} />`.
- `client/src/locales/en-US/login.js` — add 10 i18n keys.
- `client/src/locales/pt-BR/login.js` — add 10 i18n keys (translated).

Create:
- `client/src/pages/ResetPassword/ResetPassword.jsx` — public new-password form page.
- `client/src/pages/ResetPassword/ResetPassword.module.scss` — page styles mirroring `Content.module.scss`.
- `client/src/pages/ResetPassword/index.js` — default re-export.

---

### Task 1: Add `Paths.RESET_PASSWORD` constant

**Files:**
- Modify: `client/src/constants/Paths.js`

**Interfaces:**
- Consumes: `Config.BASE_PATH` (already imported).
- Produces: New export `RESET_PASSWORD` consumed by `Root.jsx`, `sagas/login/services/router.js`, and `pages/ResetPassword/ResetPassword.jsx`.

- [ ] **Step 1: Add the constant**

In `client/src/constants/Paths.js`, add a new line after the `OIDC_CALLBACK` constant (line 10) and export it from the default object:

```js
const RESET_PASSWORD = `${Config.BASE_PATH}/reset-password`;
```

Export it inside the default export object between `OIDC_CALLBACK` and `PROJECTS`:

```js
export default {
  ROOT,
  LOGIN,
  OIDC_CALLBACK,
  RESET_PASSWORD,
  PROJECTS,
  BOARDS,
  CARDS,
  SUPPORT,
  SUPPORT_EMBED,
  SUPPORT_EMBED_CODE,
};
```

- [ ] **Step 2: Verify no syntax error**

Run: `cd client && node -e "require('./src/constants/Paths.js')"` (won't run because it's ESM — use grep instead).

Run: `grep -n "RESET_PASSWORD" client/src/constants/Paths.js`
Expected: 3 matches — the `const` declaration, the export key, and one in the export object.

- [ ] **Step 3: Commit**

```bash
git add client/src/constants/Paths.js
git commit -m "feat(auth): add RESET_PASSWORD path constant"
```

---

### Task 2: Add `OPEN_PASSWORD_RESET_MODAL` and `CLOSE_PASSWORD_RESET_MODAL` action types

**Files:**
- Modify: `client/src/constants/ActionTypes.js`

**Interfaces:**
- Consumes: existing `PREFIX` constant.
- Produces: Two new action types `OPEN_PASSWORD_RESET_MODAL` and `CLOSE_PASSWORD_RESET_MODAL` consumed by `actions/login.js`, `entry-actions/login.js`, and `reducers/ui/authenticate-form.js`.

- [ ] **Step 1: Add the two action types**

In `client/src/constants/ActionTypes.js`, under the `/* Login */` block, immediately after `AUTHENTICATE_ERROR_CLEAR`, add:

```js
OPEN_PASSWORD_RESET_MODAL: `${PREFIX}/OPEN_PASSWORD_RESET_MODAL`,
CLOSE_PASSWORD_RESET_MODAL: `${PREFIX}/CLOSE_PASSWORD_RESET_MODAL`,
```

- [ ] **Step 2: Verify**

Run: `grep -n "PASSWORD_RESET_MODAL" client/src/constants/ActionTypes.js`
Expected: 2 matches.

- [ ] **Step 3: Commit**

```bash
git add client/src/constants/ActionTypes.js
git commit -m "feat(auth): add password reset modal action types"
```

---

### Task 3: Add `openPasswordResetModal` and `closePasswordResetModal` action creators

**Files:**
- Modify: `client/src/actions/login.js`
- Modify: `client/src/entry-actions/login.js`

**Interfaces:**
- Consumes: `ActionTypes.OPEN_PASSWORD_RESET_MODAL` and `ActionTypes.CLOSE_PASSWORD_RESET_MODAL`.
- Produces: `openPasswordResetModal()` and `closePasswordResetModal()` exported from both default objects.

- [ ] **Step 1: Add creators to `client/src/actions/login.js`**

Insert before the `acceptTerms` definition (around line 90):

```js
const openPasswordResetModal = () => ({
  type: ActionTypes.OPEN_PASSWORD_RESET_MODAL,
  payload: {},
});

const closePasswordResetModal = () => ({
  type: ActionTypes.CLOSE_PASSWORD_RESET_MODAL,
  payload: {},
});
```

Add both names to the default export near the end of the file (around line 187):

```js
export default {
  initializeLogin,
  authenticate,
  clearAuthenticateError,
  openPasswordResetModal,
  closePasswordResetModal,
  requestPasswordReset,
  clearPasswordResetRequestError,
  resetPassword,
  clearPasswordResetError,
  acceptTerms,
  cancelTerms,
  updateTermsLanguage,
  verifyTotp,
  cancelTotpChallenge,
};
```

- [ ] **Step 2: Add the same creators to `client/src/entry-actions/login.js`**

Insert before the `acceptTerms` definition (around line 44):

```js
const openPasswordResetModal = () => ({
  type: EntryActionTypes.OPEN_PASSWORD_RESET_MODAL,
  payload: {},
});

const closePasswordResetModal = () => ({
  type: EntryActionTypes.CLOSE_PASSWORD_RESET_MODAL,
  payload: {},
});
```

Add both names to the default export near the end of the file (around line 75):

```js
export default {
  authenticate,
  clearAuthenticateError,
  openPasswordResetModal,
  closePasswordResetModal,
  requestPasswordReset,
  clearPasswordResetRequestError,
  resetPassword,
  clearPasswordResetError,
  acceptTerms,
  cancelTerms,
  updateTermsLanguage,
  verifyTotp,
  cancelTotpChallenge,
};
```

Note: `EntryActionTypes` is imported but `OPEN_PASSWORD_RESET_MODAL` / `CLOSE_PASSWORD_RESET_MODAL` are not yet defined there. Add them too:

- [ ] **Step 3: Add the same action types to `client/src/constants/EntryActionTypes.js`**

Insert after `AUTHENTICATE_ERROR_CLEAR` (around line 23), before `PASSWORD_RESET_REQUEST`:

```js
OPEN_PASSWORD_RESET_MODAL: `${PREFIX}/OPEN_PASSWORD_RESET_MODAL`,
CLOSE_PASSWORD_RESET_MODAL: `${PREFIX}/CLOSE_PASSWORD_RESET_MODAL`,
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -n "OPEN_PASSWORD_RESET_MODAL\|CLOSE_PASSWORD_RESET_MODAL" client/src/constants/ActionTypes.js client/src/constants/EntryActionTypes.js client/src/actions/login.js client/src/entry-actions/login.js
```
Expected: each of the 4 files contains at least 1 line matching.

- [ ] **Step 5: Commit**

```bash
git add client/src/constants/EntryActionTypes.js client/src/actions/login.js client/src/entry-actions/login.js
git commit -m "feat(auth): add password reset modal action creators"
```

---

### Task 4: Reducer for `isPasswordResetModalOpen`

**Files:**
- Modify: `client/src/reducers/ui/authenticate-form.js`

**Interfaces:**
- Consumes: `ActionTypes.OPEN_PASSWORD_RESET_MODAL`, `ActionTypes.CLOSE_PASSWORD_RESET_MODAL`.
- Produces: `isPasswordResetModalOpen: boolean` in the slice returned by `selectAuthenticateForm`.

- [ ] **Step 1: Extend initial state**

In `client/src/reducers/ui/authenticate-form.js`, add `isPasswordResetModalOpen: false` to the `initialState` object (after `step: null,` around line 17):

```js
const initialState = {
  data: {
    emailOrUsername: '',
    password: '',
  },
  isSubmitting: false,
  error: null,
  pendingToken: null,
  step: null,
  isPasswordResetModalOpen: false,
  passwordResetRequestForm: {
    isSubmitting: false,
    error: null,
  },
  passwordResetForm: {
    isSubmitting: false,
    error: null,
  },
  termsForm: {
    payload: null,
    isSubmitting: false,
    isCancelling: false,
    isLanguageUpdating: false,
  },
  totpForm: {
    isSubmitting: false,
    isCancelling: false,
    error: null,
  },
};
```

- [ ] **Step 2: Add reducer cases**

Inside the switch, immediately after the `AUTHENTICATE_ERROR_CLEAR` case (around line 121), insert:

```js
case ActionTypes.OPEN_PASSWORD_RESET_MODAL:
  return {
    ...state,
    isPasswordResetModalOpen: true,
  };
case ActionTypes.CLOSE_PASSWORD_RESET_MODAL:
  return {
    ...state,
    isPasswordResetModalOpen: false,
  };
```

- [ ] **Step 3: Verify**

Run: `grep -n "isPasswordResetModalOpen\|OPEN_PASSWORD_RESET_MODAL\|CLOSE_PASSWORD_RESET_MODAL" client/src/reducers/ui/authenticate-form.js`
Expected: 4 matches.

- [ ] **Step 4: Commit**

```bash
git add client/src/reducers/ui/authenticate-form.js
git commit -m "feat(auth): track password reset modal open state"
```

---

### Task 5: Adjust `PasswordResetModal` to bind open state to Redux and dispatch close

**Files:**
- Modify: `client/src/components/common/Login/PasswordResetModal.jsx`

**Interfaces:**
- Consumes: `isPasswordResetModalOpen` from `selectAuthenticateForm`; `closePasswordResetModal` from `entryActions`.
- Produces: Modal that opens/closes via Redux state and calls `closePasswordResetModal` on close.

- [ ] **Step 1: Read the slice and import the close action**

In `client/src/components/common/Login/PasswordResetModal.jsx`, extend the selector destructure (around line 34-37):

```js
const {
  isPasswordResetModalOpen,
  passwordResetRequestForm: { isSubmitting: isRequestSubmitting, error: requestError },
  passwordResetForm: { isSubmitting: isResetSubmitting, error: resetError },
} = useSelector(selectors.selectAuthenticateForm);
```

- [ ] **Step 2: Dispatch `closePasswordResetModal` in `handleClose`**

Replace the existing `handleClose` (around line 68-71) with:

```js
const handleClose = useCallback(() => {
  dispatch(entryActions.closePasswordResetModal());
  dispatch(entryActions.clearPasswordResetRequestError());
  dispatch(entryActions.clearPasswordResetError());
}, [dispatch]);
```

- [ ] **Step 3: Bind `open`/`onClose` on the Modal**

Replace the `<Modal ...>` opening tag (around line 74):

```jsx
<Modal
  open={isPasswordResetModalOpen}
  centered
  size="tiny"
  closeOnDimmerClick={false}
  closeOnEscape={false}
  onClose={handleClose}
>
```

- [ ] **Step 4: Verify**

Run: `grep -n "isPasswordResetModalOpen\|closePasswordResetModal" client/src/components/common/Login/PasswordResetModal.jsx`
Expected: at least 2 matches.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/common/Login/PasswordResetModal.jsx
git commit -m "feat(auth): wire PasswordResetModal to Redux open state"
```

---

### Task 6: Render forgot-password link and modal in `Content.jsx`

**Files:**
- Modify: `client/src/components/common/Login/Content.jsx`
- Modify: `client/src/components/common/Login/Content.module.scss`

**Interfaces:**
- Consumes: `isPasswordResetModalOpen` from selector; `openPasswordResetModal` from `entryActions`.
- Produces: Clickable "Esqueci minha senha" link under password field; modal rendered conditionally.

- [ ] **Step 1: Extend selector destructure**

In `client/src/components/common/Login/Content.jsx`, replace the existing `selectAuthenticateForm` destructure (around line 88-93):

```js
const {
  data: defaultData,
  isSubmitting,
  error,
  step,
  isPasswordResetModalOpen,
} = useSelector(selectors.selectAuthenticateForm);
```

- [ ] **Step 2: Add the open handler**

After `handleMessageDismiss` (around line 148), add:

```js
const handleForgotPassword = useCallback(() => {
  dispatch(entryActions.openPasswordResetModal());
}, [dispatch]);
```

- [ ] **Step 3: Import `Link` and `PasswordResetModal`**

Add to the existing `semantic-ui-react` import line:

```js
import { Form, Grid, Header, Link, Message } from 'semantic-ui-react';
```

Add a new import line after `import TotpChallengeModal from './TotpChallengeModal';`:

```js
import PasswordResetModal from './PasswordResetModal';
```

- [ ] **Step 4: Insert the link after the password input wrapper**

After the `</div>` closing the password `inputWrapper` (around line 232, before the `<Form.Button ...>`), insert:

```jsx
<div className={styles.forgotWrapper}>
  <Link onClick={handleForgotPassword}>{t('common.forgotPassword')}</Link>
</div>
```

- [ ] **Step 5: Render the modal**

After `{step === AccessTokenSteps.VERIFY_TOTP && <TotpChallengeModal />}` at the end of the JSX (around line 264), add:

```jsx
{isPasswordResetModalOpen && <PasswordResetModal />}
```

- [ ] **Step 6: Add the style class**

In `client/src/components/common/Login/Content.module.scss`, append:

```scss
.forgotWrapper {
  text-align: right;
  margin-top: 4px;
  margin-bottom: 8px;
  font-size: 13px;
}
```

- [ ] **Step 7: Verify**

Run:
```bash
grep -n "forgotWrapper\|handleForgotPassword\|PasswordResetModal" client/src/components/common/Login/Content.jsx
grep -n "forgotWrapper" client/src/components/common/Login/Content.module.scss
```
Expected: 3+ matches in JSX; 1 match in SCSS.

- [ ] **Step 8: Commit**

```bash
git add client/src/components/common/Login/Content.jsx client/src/components/common/Login/Content.module.scss
git commit -m "feat(auth): add forgot password link and modal to login form"
```

---

### Task 7: Create `/reset-password` page

**Files:**
- Create: `client/src/pages/ResetPassword/ResetPassword.jsx`
- Create: `client/src/pages/ResetPassword/ResetPassword.module.scss`
- Create: `client/src/pages/ResetPassword/index.js`

**Interfaces:**
- Consumes: `entryActions.resetPassword`, `entryActions.clearPasswordResetError`; `passwordResetForm` from `selectAuthenticateForm`; `isPassword` from `utils/validator`; `Paths.LOGIN` for back link.
- Produces: A React component that reads `?token=` from the URL and renders: token-missing screen, password form, error screen, or success screen.

- [ ] **Step 1: Create `index.js`**

Write `client/src/pages/ResetPassword/index.js`:

```js
/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ResetPassword from './ResetPassword';

export default ResetPassword;
```

- [ ] **Step 2: Create the styles file**

Write `client/src/pages/ResetPassword/ResetPassword.module.scss`:

```scss
.wrapper {
  height: 100vh;
  width: 100vw;
  background-color: #0a0a0f;
}

.grid {
  height: 100vh;
  margin: 0 !important;
}

.gridItem {
  padding: 0 !important;
}

.formColumn {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #14141c;
  padding: 32px !important;
}

.form {
  width: 100%;
  max-width: 380px;
}

.logoWrapper {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  max-width: 160px;
  height: auto;
}

.formSubtitle {
  color: #f3b229 !important;
  text-align: center;
  margin-bottom: 24px !important;
}

.intro {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  text-align: center;
}

.inputWrapper {
  margin-bottom: 16px;
}

.inputLabel {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  margin-bottom: 6px;
}

.input {
  width: 100%;
}

.fieldError {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 4px;
}

.centeredMessage {
  text-align: center;
  padding: 16px 0;
}

.centeredMessage h3 {
  color: #f3b229;
  margin-bottom: 12px;
}

.centeredMessage p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.cover {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%);
}

.coverOverlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(243, 178, 41, 0.1), transparent 60%);
}

.poweredBy {
  margin-top: 32px;
  text-align: center;
}

.poweredByText {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.poweredByText a {
  color: #f3b229;
}
```

- [ ] **Step 3: Create the React component**

Write `client/src/pages/ResetPassword/ResetPassword.jsx`:

```jsx
/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { Button, Form, Grid, Header, Message } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { isPassword } from '../../../utils/validator';

import logo from '../../../assets/images/logo.png';

import styles from './ResetPassword.module.scss';

const createMessage = (error) => {
  if (!error) {
    return null;
  }
  switch (error.message) {
    case 'Invalid or expired token':
      return {
        type: 'error',
        content: 'common.invalidResetToken',
      };
    case 'Failed to fetch':
      return {
        type: 'warning',
        content: 'common.noInternetConnection',
      };
    case 'Network request failed':
      return {
        type: 'warning',
        content: 'common.serverConnectionFailed',
      };
    default:
      return {
        type: 'warning',
        content: 'common.unknownError',
      };
  }
};

const getTokenFromUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
};

const ResetPassword = React.memo(() => {
  const [t] = useTranslation();
  const dispatch = useDispatch();
  const { passwordResetForm } = useSelector(selectors.selectAuthenticateForm);
  const { isSubmitting, error } = passwordResetForm;

  const [token] = useState(getTokenFromUrl);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    return () => {
      dispatch(entryActions.clearPasswordResetError());
    };
  }, [dispatch]);

  const apiMessage = useMemo(() => createMessage(error), [error]);

  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }
    if (!password) {
      setValidationError({ field: 'password', message: 'common.passwordRequired' });
      return;
    }
    if (!isPassword(password)) {
      setValidationError({ field: 'password', message: 'common.invalidPassword' });
      return;
    }
    if (password !== passwordConfirm) {
      setValidationError({ field: 'passwordConfirm', message: 'common.passwordsDoNotMatch' });
      return;
    }
    setValidationError(null);
    dispatch(entryActions.resetPassword({ token, password }));
  }, [dispatch, token, password, passwordConfirm]);

  useEffect(() => {
    if (isSuccess || isSubmitting || error) {
      return;
    }
    if (password.length > 0 && passwordConfirm.length > 0) {
      // success detected when isSubmitting flipped false with no error after we had data
    }
  }, [isSubmitting, error, password, passwordConfirm, isSuccess]);

  useEffect(() => {
    if (isSubmitting) {
      return;
    }
    if (!error && password.length > 0) {
      setIsSuccess(true);
    }
  }, [isSubmitting, error, password]);

  if (!token) {
    return (
      <div className={styles.wrapper}>
        <Grid verticalAlign="middle" className={styles.grid}>
          <Grid.Column computer={16} className={classNames(styles.gridItem, styles.formColumn)}>
            <div className={classNames(styles.form, styles.centeredMessage)}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header as="h2" textAlign="center" content={t('common.resetPassword_title')} className={styles.formSubtitle} />
              <p>{t('common.resetPasswordInvalidToken')}</p>
              <Button as={RouterLink} to={Paths.LOGIN} primary content={t('common.resetPasswordBackToLogin')} />
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  if (error && error.message === 'Invalid or expired token') {
    return (
      <div className={styles.wrapper}>
        <Grid verticalAlign="middle" className={styles.grid}>
          <Grid.Column computer={16} className={classNames(styles.gridItem, styles.formColumn)}>
            <div className={classNames(styles.form, styles.centeredMessage)}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header as="h2" textAlign="center" content={t('common.resetPassword_title')} className={styles.formSubtitle} />
              <p>{t('common.resetPasswordInvalidToken')}</p>
              <Button as={RouterLink} to={Paths.LOGIN} primary content={t('common.resetPasswordBackToLogin')} />
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={styles.wrapper}>
        <Grid verticalAlign="middle" className={styles.grid}>
          <Grid.Column computer={16} className={classNames(styles.gridItem, styles.formColumn)}>
            <div className={classNames(styles.form, styles.centeredMessage)}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header as="h2" textAlign="center" content={t('common.resetPassword_title')} className={styles.formSubtitle} />
              <p>{t('common.resetPasswordSuccess')}</p>
              <Button as={RouterLink} to={Paths.LOGIN} primary content={t('common.resetPasswordBackToLogin')} />
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Grid verticalAlign="middle" className={styles.grid}>
        <Grid.Column computer={6} tablet={16} mobile={16} className={classNames(styles.gridItem, styles.formColumn)}>
          <div className={styles.form}>
            <div className={styles.logoWrapper}>
              <img src={logo} alt="" className={styles.logo} />
            </div>
            <Header as="h2" textAlign="center" content={t('common.resetPassword_title')} className={styles.formSubtitle} />
            {apiMessage && (
              <Message
                {...{
                  [apiMessage.type]: true,
                }}
                visible
                content={t(apiMessage.content)}
              />
            )}
            <Form size="large" onSubmit={handleSubmit}>
              <div className={styles.inputWrapper}>
                <div className={styles.inputLabel}>{t('common.resetPasswordNewPassword')}</div>
                <Form.Input
                  fluid
                  type="password"
                  name="password"
                  value={password}
                  maxLength={256}
                  readOnly={isSubmitting}
                  className={styles.input}
                  onChange={(_, { value }) => setPassword(value)}
                />
                {validationError && validationError.field === 'password' && (
                  <div className={styles.fieldError}>{t(validationError.message)}</div>
                )}
              </div>
              <div className={styles.inputWrapper}>
                <div className={styles.inputLabel}>{t('common.resetPasswordConfirmPassword')}</div>
                <Form.Input
                  fluid
                  type="password"
                  name="passwordConfirm"
                  value={passwordConfirm}
                  maxLength={256}
                  readOnly={isSubmitting}
                  className={styles.input}
                  onChange={(_, { value }) => setPasswordConfirm(value)}
                />
                {validationError && validationError.field === 'passwordConfirm' && (
                  <div className={styles.fieldError}>{t(validationError.message)}</div>
                )}
              </div>
              <Form.Button
                fluid
                primary
                icon="right arrow"
                labelPosition="right"
                content={t('common.resetPasswordSubmit')}
                loading={isSubmitting}
                disabled={isSubmitting || !password || !passwordConfirm}
              />
            </Form>
            <div className={styles.poweredBy}>
              <p className={styles.poweredByText}>
                <Button as={RouterLink} to={Paths.LOGIN} basic content={t('common.resetPasswordBackToLogin')} />
              </p>
            </div>
          </div>
        </Grid.Column>
        <Grid.Column
          computer={10}
          only="computer"
          className={classNames(styles.gridItem, styles.cover)}
        >
          <div className={styles.coverOverlay} />
        </Grid.Column>
      </Grid>
    </div>
  );
});

export default ResetPassword;
```

- [ ] **Step 4: Verify files exist**

Run:
```bash
ls client/src/pages/ResetPassword/
```
Expected: `ResetPassword.jsx  ResetPassword.module.scss  index.js`

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/ResetPassword/
git commit -m "feat(auth): add /reset-password public page"
```

---

### Task 8: Add i18n keys to `en-US`

**Files:**
- Modify: `client/src/locales/en-US/login.js`

- [ ] **Step 1: Read current file**

Run: `cat client/src/locales/en-US/login.js` to see the existing shape (it exports an object with nested keys like `common`, `action`, etc.).

- [ ] **Step 2: Add new keys to the `common` section**

Insert (or merge into the existing `common` block — preserve existing keys):

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
passwordRequired: 'Password is required',
passwordsDoNotMatch: 'Passwords do not match',
noInternetConnection: 'No internet connection',
serverConnectionFailed: 'Server connection failed',
smtpNotConfigured: 'Email is not configured on the server. Please contact your administrator.',
invalidResetToken: 'Invalid or expired reset link.',
invalidEmail: 'Invalid email address.',
invalidPassword: 'Password does not meet requirements',
unknownError: 'An unknown error occurred',
```

- [ ] **Step 3: Verify**

Run: `grep -c "forgotPassword\|resetPassword_title\|smtpNotConfigured" client/src/locales/en-US/login.js`
Expected: at least 3 matches.

- [ ] **Step 4: Commit**

```bash
git add client/src/locales/en-US/login.js
git commit -m "feat(i18n): add password reset strings to en-US"
```

---

### Task 9: Add i18n keys to `pt-BR`

**Files:**
- Modify: `client/src/locales/pt-BR/login.js`

- [ ] **Step 1: Add translated keys**

Mirror the en-US additions with Portuguese translations:

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
passwordRequired: 'A senha é obrigatória',
passwordsDoNotMatch: 'As senhas não conferem',
noInternetConnection: 'Sem conexão com a internet',
serverConnectionFailed: 'Falha na conexão com o servidor',
smtpNotConfigured: 'O e-mail não está configurado no servidor. Contate o administrador.',
invalidResetToken: 'Link de redefinição inválido ou expirado.',
invalidEmail: 'Endereço de e-mail inválido.',
invalidPassword: 'A senha não atende aos requisitos',
unknownError: 'Ocorreu um erro desconhecido',
```

- [ ] **Step 2: Verify**

Run: `grep -c "forgotPassword\|resetPassword_title\|smtpNotConfigured" client/src/locales/pt-BR/login.js`
Expected: at least 3 matches.

- [ ] **Step 3: Commit**

```bash
git add client/src/locales/pt-BR/login.js
git commit -m "feat(i18n): add password reset strings to pt-BR"
```

---

### Task 10: Register `/reset-password` route in `Root.jsx` and adjust login router

**Files:**
- Modify: `client/src/components/common/Root.jsx`
- Modify: `client/src/sagas/login/services/router.js`

**Interfaces:**
- Consumes: `Paths.RESET_PASSWORD`, `Paths.LOGIN` from constants.
- Produces: `<Route>` matching `/reset-password` rendered outside the auth-protected area; `handleLocationChange` does not redirect `/reset-password` away.

- [ ] **Step 1: Import the new page**

In `client/src/components/common/Root.jsx`, add the import after the existing `Support` import:

```js
import ResetPassword from '../../pages/ResetPassword';
```

- [ ] **Step 2: Register the route**

Inside the `<Routes>` block, immediately after the `<Route path={Paths.LOGIN} element={<Login />} />` line, add:

```jsx
<Route path={Paths.RESET_PASSWORD} element={<ResetPassword />} />
```

- [ ] **Step 3: Skip redirect for `/reset-password` in the login router**

In `client/src/sagas/login/services/router.js`, replace the `switch (pathsMatch.pattern.path)` block inside `handleLocationChange` (around line 32) with:

```js
switch (pathsMatch.pattern.path) {
  case Paths.RESET_PASSWORD:
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

- [ ] **Step 4: Verify**

Run:
```bash
grep -n "ResetPassword\|RESET_PASSWORD" client/src/components/common/Root.jsx
grep -n "RESET_PASSWORD" client/src/sagas/login/services/router.js
```
Expected: at least 1 match in each file.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/common/Root.jsx client/src/sagas/login/services/router.js
git commit -m "feat(auth): register /reset-password route and bypass redirect"
```

---

### Task 11: Lint and build

**Files:** none new.

- [ ] **Step 1: Run lint**

Run: `cd client && npm run lint`
Expected: no errors. Fix any reported issues (unused imports, missing semicolons, etc.).

- [ ] **Step 2: Run build**

Run: `cd client && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Final commit if any auto-fixes**

If `npm run lint -- --fix` produced changes:

```bash
git add -u
git commit -m "style: apply lint fixes"
```

---

### Task 12: Manual end-to-end verification

**Files:** none.

- [ ] **Step 1: Start dev servers**

Run in two terminals:
```bash
cd server && npm run start:dev
cd client && npm run start
```

- [ ] **Step 2: Visit `/login`**

Expected: the "Esqueci minha senha" link appears below the password field.

- [ ] **Step 3: Click the link**

Expected: the `PasswordResetModal` opens centered, with the email input focused.

- [ ] **Step 4: Submit an existing user's email**

Expected: backend logs a `sendEmail` call; the modal flips to "email enviado" confirmation screen.

- [ ] **Step 5: Open the email link in a browser**

Expected: lands on `/reset-password?token=…`. Two password fields render with the submit button disabled until both fields are filled.

- [ ] **Step 6: Submit mismatched passwords**

Expected: inline validation message "As senhas não conferem" (pt-BR) or "Passwords do not match" (en-US); no API call.

- [ ] **Step 7: Submit valid matching passwords**

Expected: backend returns 200; page flips to success screen; "Voltar para o login" / "Back to login" link visible.

- [ ] **Step 8: Click "Back to login", then log in with the new password**

Expected: authentication succeeds.

- [ ] **Step 9: Test invalid-token path**

Manually visit `/reset-password?token=tampered`.
Expected: page shows the error screen with "Voltar para o login" link.

- [ ] **Step 10: Test missing-token path**

Visit `/reset-password` (no query string).
Expected: same error screen as Step 9.

---

## Self-Review

- Spec coverage:
  - Modal wire (open state, action types, action creators, reducer) — Tasks 2, 3, 4, 5.
  - Forgot-password link in Content — Task 6.
  - Reset password page — Task 7.
  - i18n keys — Tasks 8, 9.
  - Route registration and router adjustment — Task 10.
  - Lint/build/verification — Tasks 11, 12.
- Placeholders: none.
- Type consistency: `ActionTypes.OPEN_PASSWORD_RESET_MODAL` / `CLOSE_PASSWORD_RESET_MODAL` used identically across Tasks 2-5. `Paths.RESET_PASSWORD` used identically across Tasks 1, 10. Selector `selectAuthenticateForm` unchanged. i18n keys referenced in Task 7 (`common.invalidResetToken`, `common.passwordRequired`, etc.) all defined in Task 8/9.
- Validation: the field-error display relies on `passwordRequired`, `invalidPassword`, `passwordsDoNotMatch`, `invalidResetToken`, `unknownError`, `noInternetConnection`, `serverConnectionFailed`. All defined in en-US (Task 8); pt-BR translations provided in Task 9.

Plan complete and saved to `docs/superpowers/plans/2026-08-21-password-reset-from-login.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
