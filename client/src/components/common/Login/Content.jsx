/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import isEmail from 'validator/lib/isEmail';
import React, { useCallback, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Form, Grid, Header, Message } from 'semantic-ui-react';
import { useDidUpdate, usePrevious, useToggle } from '../../../lib/hooks';
import { Input } from '../../../lib/custom-ui';

import selectors from '../../../selectors';
import actions from '../../../actions';
import entryActions from '../../../entry-actions';
import { useForm, useNestedRef } from '../../../hooks';
import { isUsername } from '../../../utils/validator';
import AccessTokenSteps from '../../../constants/AccessTokenSteps';
import TotpChallengeModal from './TotpChallengeModal';
import PasswordResetModal from './PasswordResetModal';
import TermsModal from './TermsModal';

import logo from '../../../assets/images/logo.png';

import styles from './Content.module.scss';

const FIELD_ERROR_MESSAGES = [
  'Invalid credentials',
  'Invalid email or username',
  'Invalid password',
];

const createMessage = (error) => {
  if (!error) {
    return error;
  }

  switch (error.message) {
    case 'Invalid credentials':
      return {
        type: 'error',
        content: 'common.invalidCredentials',
      };
    case 'Invalid email or username':
      return {
        type: 'error',
        content: 'common.invalidEmailOrUsername',
      };
    case 'Invalid password':
      return {
        type: 'error',
        content: 'common.invalidPassword',
      };
    case 'Admin login required to initialize instance':
      return {
        type: 'error',
        content: 'common.adminLoginRequiredToInitializeInstance',
      };
    case 'Email already in use':
      return {
        type: 'error',
        content: 'common.emailAlreadyInUse',
      };
    case 'Username already in use':
      return {
        type: 'error',
        content: 'common.usernameAlreadyInUse',
      };
    case 'Active users limit reached':
      return {
        type: 'error',
        content: 'common.activeUsersLimitReached',
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

const Content = React.memo(() => {
  const bootstrap = useSelector(selectors.selectBootstrap);

  const {
    data: defaultData,
    isSubmitting,
    error,
    step,
    termsForm,
    isPasswordResetModalOpen,
  } = useSelector(selectors.selectAuthenticateForm);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const wasSubmitting = usePrevious(isSubmitting);

  const [data, handleFieldChange, setData] = useForm(() => {
    const initialData = {
      emailOrUsername: '',
      password: '',
      ...defaultData,
    };

    if (bootstrap.isDemoMode) {
      const params = new URLSearchParams(window.location.hash.slice(1));

      Object.keys(initialData).forEach((fieldName) => {
        const value = params.get(fieldName);

        if (value !== null) {
          initialData[fieldName] = value;
        }
      });
    }

    return initialData;
  });

  // Field errors render inline on the offending input; only system states
  // (connectivity, limits, instance setup) use the top banner so failures
  // don't shove the form down on every mistype.
  const fieldError = error && FIELD_ERROR_MESSAGES.includes(error.message) ? error : null;
  const message = useMemo(() => (fieldError ? null : createMessage(error)), [error, fieldError]);

  const emailFieldInvalid =
    !!fieldError &&
    (fieldError.message === 'Invalid credentials' ||
      fieldError.message === 'Invalid email or username');
  const passwordFieldInvalid =
    !!fieldError &&
    (fieldError.message === 'Invalid credentials' || fieldError.message === 'Invalid password');
  const showEmailErrorText = emailFieldInvalid && fieldError.message !== 'Invalid credentials';
  const fieldErrorContent = fieldError ? createMessage(fieldError).content : null;

  let emailDescribedBy;
  if (emailFieldInvalid) {
    emailDescribedBy = showEmailErrorText ? 'login-emailOrUsername-error' : 'login-password-error';
  }
  const [focusPasswordFieldState, focusPasswordField] = useToggle();

  const [emailOrUsernameFieldRef, handleEmailOrUsernameFieldRef] = useNestedRef('inputRef');
  const [passwordFieldRef, handlePasswordFieldRef] = useNestedRef('inputRef');

  const handleSubmit = useCallback(() => {
    const cleanData = {
      ...data,
      emailOrUsername: data.emailOrUsername.trim(),
    };

    if (!isEmail(cleanData.emailOrUsername) && !isUsername(cleanData.emailOrUsername)) {
      emailOrUsernameFieldRef.current.select();
      return;
    }

    if (!cleanData.password) {
      passwordFieldRef.current.focus();
      return;
    }

    dispatch(entryActions.authenticate(cleanData));
  }, [dispatch, data, emailOrUsernameFieldRef, passwordFieldRef]);

  const handleMessageDismiss = useCallback(() => {
    dispatch(entryActions.clearAuthenticateError());
  }, [dispatch]);

  const handleForgotPassword = useCallback(() => {
    dispatch(actions.openPasswordResetModal());
  }, [dispatch]);

  useEffect(() => {
    emailOrUsernameFieldRef.current.focus();
  }, [emailOrUsernameFieldRef]);

  useDidUpdate(() => {
    if (wasSubmitting && !isSubmitting && error) {
      switch (error.message) {
        case 'Invalid credentials':
        case 'Invalid email or username':
          emailOrUsernameFieldRef.current.select();

          break;
        case 'Invalid password':
          setData((prevData) => ({
            ...prevData,
            password: '',
          }));
          focusPasswordField();

          break;
        default:
      }
    }
  }, [isSubmitting, wasSubmitting, error]);

  useDidUpdate(() => {
    passwordFieldRef.current.focus();
  }, [focusPasswordFieldState]);

  return (
    <div className={classNames(styles.wrapper, styles.fullHeight)}>
      <Grid verticalAlign="middle" className={styles.grid}>
        <Grid.Column computer={6} tablet={16} mobile={16} className={styles.gridItem}>
          <div className={styles.login}>
            <div className={styles.form}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="Taskbolt" className={styles.logo} />
              </div>
              <Header
                as="h2"
                textAlign="center"
                content={t('common.logIn', {
                  context: 'title',
                })}
                className={styles.formSubtitle}
              />
              {message && (
                <Message
                  {...{
                    [message.type]: true,
                  }}
                  visible
                  role="alert"
                  content={t(message.content)}
                  onDismiss={handleMessageDismiss}
                />
              )}
              <Form size="large" onSubmit={handleSubmit} aria-busy={isSubmitting}>
                <div className={styles.fieldsRow}>
                  <div className={styles.inputWrapper}>
                    <label htmlFor="login-emailOrUsername" className={styles.inputLabel}>
                      {t('common.loginUsername')}
                    </label>
                    <Input
                      fluid
                      id="login-emailOrUsername"
                      ref={handleEmailOrUsernameFieldRef}
                      name="emailOrUsername"
                      type="text"
                      value={data.emailOrUsername}
                      maxLength={256}
                      autoComplete="username"
                      required
                      readOnly={isSubmitting}
                      error={emailFieldInvalid}
                      aria-invalid={emailFieldInvalid}
                      aria-describedby={emailDescribedBy}
                      className={styles.input}
                      onChange={handleFieldChange}
                    />
                    {showEmailErrorText && (
                      <p
                        id="login-emailOrUsername-error"
                        role="alert"
                        className={styles.fieldError}
                      >
                        {t(fieldErrorContent)}
                      </p>
                    )}
                  </div>
                  <div className={styles.inputWrapper}>
                    <label htmlFor="login-password" className={styles.inputLabel}>
                      {t('common.password')}
                    </label>
                    <Input.Password
                      fluid
                      id="login-password"
                      ref={handlePasswordFieldRef}
                      name="password"
                      value={data.password}
                      maxLength={256}
                      autoComplete="current-password"
                      required
                      readOnly={isSubmitting}
                      error={passwordFieldInvalid}
                      aria-invalid={passwordFieldInvalid}
                      aria-describedby={passwordFieldInvalid ? 'login-password-error' : undefined}
                      className={styles.input}
                      onChange={handleFieldChange}
                    />
                    {passwordFieldInvalid && (
                      <p id="login-password-error" role="alert" className={styles.fieldError}>
                        {t(fieldErrorContent)}
                      </p>
                    )}
                  </div>
                </div>
                <div className={styles.forgotWrapper}>
                  <button type="button" onClick={handleForgotPassword}>
                    {t('common.forgotPassword')}
                  </button>
                </div>
                <Form.Button
                  fluid
                  primary
                  content={t('action.logIn')}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                />
              </Form>
            </div>
            <div className={styles.poweredBy}>
              <p className={styles.poweredByText}>
                <Trans i18nKey="common.poweredByPlanka">
                  {'Powered by '}
                  <a href="https://bolt360.com.br" target="_blank" rel="noreferrer">
                    Bolt 360
                  </a>
                </Trans>
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
      {step === AccessTokenSteps.VERIFY_TOTP && <TotpChallengeModal />}
      {step === AccessTokenSteps.ACCEPT_TERMS && termsForm && termsForm.payload && <TermsModal />}
      {isPasswordResetModalOpen && <PasswordResetModal />}
    </div>
  );
});

export default Content;
