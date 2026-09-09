/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Message, Modal } from 'semantic-ui-react';
import { Input } from '../../../lib/custom-ui';
import { useDidUpdate } from '../../../lib/hooks';

import selectors from '../../../selectors';
import actions from '../../../actions';
import entryActions from '../../../entry-actions';
import { useNestedRef } from '../../../hooks';

import styles from './PasswordResetModal.module.scss';

const createMessage = (error) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  if (message === 'SMTP is not configured') {
    return { type: 'warning', content: 'common.smtpNotConfigured' };
  }
  if (message === 'Invalid or expired token') {
    return { type: 'error', content: 'common.invalidResetToken' };
  }
  if (message === 'Invalid email') {
    return { type: 'error', content: 'common.invalidEmail' };
  }
  return { type: 'warning', content: 'common.unknownError' };
};

const PasswordResetModal = React.memo(() => {
  const {
    isPasswordResetModalOpen,
    passwordResetRequestForm: { isSubmitting: isRequestSubmitting, error: requestError },
    passwordResetForm: { isSubmitting: isResetSubmitting },
  } = useSelector(selectors.selectAuthenticateForm);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [email, setEmail] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [emailFieldRef, handleEmailFieldRef] = useNestedRef('inputRef');

  const requestMessage = useMemo(() => createMessage(requestError), [requestError]);

  const handleEmailChange = useCallback((_, { value }) => {
    setEmail(value);
  }, []);

  const handleRequestSubmit = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      if (emailFieldRef.current) emailFieldRef.current.focus();
      return;
    }
    dispatch(entryActions.requestPasswordReset({ email: trimmed }));
  }, [dispatch, email, emailFieldRef]);

  useDidUpdate(() => {
    if (!isRequestSubmitting && !requestError) {
      setIsRequestSent(true);
    }
  }, [isRequestSubmitting, requestError]);

  useEffect(() => {
    if (isPasswordResetModalOpen) {
      setEmail('');
      setIsRequestSent(false);
    }
  }, [isPasswordResetModalOpen]);

  const handleClose = useCallback(() => {
    dispatch(actions.closePasswordResetModal());
    dispatch(entryActions.clearPasswordResetRequestError());
    dispatch(entryActions.clearPasswordResetError());
  }, [dispatch]);

  const handleResend = useCallback(() => {
    setIsRequestSent(false);
  }, []);

  useDidUpdate(() => {
    if (!isRequestSent && emailFieldRef.current) {
      emailFieldRef.current.focus();
    }
  }, [isRequestSent]);

  return (
    <Modal
      open={isPasswordResetModalOpen}
      centered
      size="tiny"
      className="epicModal"
      closeOnDimmerClick={false}
      closeOnEscape={!isRequestSubmitting && !isResetSubmitting}
      onClose={handleClose}
    >
      <Modal.Header>{t('common.resetPassword_title')}</Modal.Header>
      <Modal.Content>
        {!isRequestSent ? (
          <>
            <p className={styles.intro}>{t('common.resetPasswordIntro')}</p>
            {requestMessage && (
              <Message
                {...{
                  [requestMessage.type]: true,
                }}
                role="alert"
                content={t(requestMessage.content)}
              />
            )}
            <Form onSubmit={handleRequestSubmit}>
              <Form.Field>
                <label htmlFor="password-reset-email" className={styles.fieldLabel}>
                  {t('common.email')}
                </label>
                <Input
                  fluid
                  autoFocus
                  id="password-reset-email"
                  ref={handleEmailFieldRef}
                  value={email}
                  type="email"
                  inputMode="email"
                  maxLength={256}
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                  aria-invalid={!!requestMessage}
                  readOnly={isRequestSubmitting}
                  className={styles.emailInput}
                  onChange={handleEmailChange}
                />
              </Form.Field>
            </Form>
          </>
        ) : (
          <p className={styles.intro}>{t('common.resetPasswordEmailSent')}</p>
        )}
      </Modal.Content>
      <Modal.Actions>
        <Button
          content={t('action.cancelAndClose')}
          floated="left"
          disabled={isRequestSubmitting || isResetSubmitting}
          onClick={handleClose}
        />
        {!isRequestSent && (
          <Button
            positive
            content={t('action.sendResetLink')}
            loading={isRequestSubmitting}
            disabled={isRequestSubmitting || !email.trim()}
            onClick={handleRequestSubmit}
          />
        )}
        {isRequestSent && (
          <Button
            positive
            content={t('action.sendResetLink')}
            disabled={isRequestSubmitting}
            onClick={handleResend}
          />
        )}
      </Modal.Actions>
    </Modal>
  );
});

export default PasswordResetModal;
