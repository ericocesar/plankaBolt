/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { Button, Form, Grid, Header, Message } from 'semantic-ui-react';

import selectors from '../../selectors';
import entryActions from '../../entry-actions';
import Paths from '../../constants/Paths';
import { isPassword } from '../../utils/validator';

import logo from '../../assets/images/logo.png';

import styles from './ResetPassword.module.scss';

const createMessage = (error) => {
  if (!error) {
    return null;
  }
  const message = typeof error === 'string' ? error : error.message;
  switch (message) {
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
      setValidationError({
        field: 'password',
        message: 'common.passwordRequired',
      });
      return;
    }
    if (!isPassword(password)) {
      setValidationError({
        field: 'password',
        message: 'common.invalidPassword',
      });
      return;
    }
    if (password !== passwordConfirm) {
      setValidationError({
        field: 'passwordConfirm',
        message: 'common.passwordsDoNotMatch',
      });
      return;
    }
    setValidationError(null);
    dispatch(entryActions.resetPassword({ token, password }));
  }, [dispatch, token, password, passwordConfirm]);

  // Track whether we have a pending submit so we can detect success vs initial render
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (isSubmitting) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current && !error && !isSuccess) {
      setIsSuccess(true);
    }
  }, [isSubmitting, error, isSuccess]);

  if (!token) {
    return (
      <div className={styles.wrapper}>
        <Grid verticalAlign="middle" className={styles.grid}>
          <Grid.Column computer={16} className={classNames(styles.gridItem, styles.formColumn)}>
            <div className={classNames(styles.form, styles.centeredMessage)}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header
                as="h2"
                textAlign="center"
                content={t('common.resetPassword_title')}
                className={styles.formSubtitle}
              />
              <p>{t('common.resetPasswordInvalidToken')}</p>
              <Button
                as={RouterLink}
                to={Paths.LOGIN}
                primary
                content={t('common.resetPasswordBackToLogin')}
              />
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  if (error && (typeof error === 'string' ? error : error.message) === 'Invalid or expired token') {
    return (
      <div className={styles.wrapper}>
        <Grid verticalAlign="middle" className={styles.grid}>
          <Grid.Column computer={16} className={classNames(styles.gridItem, styles.formColumn)}>
            <div className={classNames(styles.form, styles.centeredMessage)}>
              <div className={styles.logoWrapper}>
                <img src={logo} alt="" className={styles.logo} />
              </div>
              <Header
                as="h2"
                textAlign="center"
                content={t('common.resetPassword_title')}
                className={styles.formSubtitle}
              />
              <p>{t('common.resetPasswordInvalidToken')}</p>
              <Button
                as={RouterLink}
                to={Paths.LOGIN}
                primary
                content={t('common.resetPasswordBackToLogin')}
              />
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
              <Header
                as="h2"
                textAlign="center"
                content={t('common.resetPassword_title')}
                className={styles.formSubtitle}
              />
              <p>{t('common.resetPasswordSuccess')}</p>
              <Button
                as={RouterLink}
                to={Paths.LOGIN}
                primary
                content={t('common.resetPasswordBackToLogin')}
              />
            </div>
          </Grid.Column>
        </Grid>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Grid verticalAlign="middle" className={styles.grid}>
        <Grid.Column
          computer={6}
          tablet={16}
          mobile={16}
          className={classNames(styles.gridItem, styles.formColumn)}
        >
          <div className={styles.form}>
            <div className={styles.logoWrapper}>
              <img src={logo} alt="" className={styles.logo} />
            </div>
            <Header
              as="h2"
              textAlign="center"
              content={t('common.resetPassword_title')}
              className={styles.formSubtitle}
            />
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
                <Button
                  as={RouterLink}
                  to={Paths.LOGIN}
                  basic
                  content={t('common.resetPasswordBackToLogin')}
                />
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
