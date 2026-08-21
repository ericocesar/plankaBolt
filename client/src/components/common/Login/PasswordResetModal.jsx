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
import entryActions from '../../../entry-actions';
import { useNestedRef } from '../../../hooks';

import styles from './PasswordResetModal.module.scss';

const createMessage = (error) => {
  if (!error) return null;
  if (error.message === 'SMTP is not configured') {
    return { type: 'warning', content: 'common.smtpNotConfigured' };
  }
  if (error.message === 'Invalid or expired token') {
    return { type: 'error', content: 'common.invalidResetToken' };
  }
  if (error.message === 'Invalid email') {
    return { type: 'error', content: 'common.invalidEmail' };
  }
  return { type: 'warning', content: 'common.unknownError' };
};

const PasswordResetModal = React.memo(() => {
  const {
    isPasswordResetModalOpen,
    passwordResetRequestForm: { isSubmitting: isRequestSubmitting, error: requestError },
    passwordResetForm: { isSubmitting: isResetSubmitting, error: resetError },
  } = useSelector(selectors.selectAuthenticateForm);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [email, setEmail] = useState('');
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [emailFieldRef, handleEmailFieldRef] = useNestedRef('inputRef');

  const requestMessage = useMemo(() => createMessage(requestError), [requestError]);
  const resetMessage = useMemo(() => createMessage(resetError), [resetError]);

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
    dispatch(entryActions.closePasswordResetModal());
    dispatch(entryActions.clearPasswordResetRequestError());
    dispatch(entryActions.clearPasswordResetError());
  }, [dispatch]);

  return (
    <Modal
      open={isPasswordResetModalOpen}
      centered
      size="tiny"
      closeOnDimmerClick={false}
      closeOnEscape={false}
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
                content={t(requestMessage.content)}
              />
            )}
            <Form onSubmit={handleRequestSubmit}>
              <Form.Field>
                <Input
                  fluid
                  autoFocus
                  ref={handleEmailFieldRef}
                  value={email}
                  maxLength={256}
                  placeholder="email@example.com"
                  autoComplete="email"
                  readOnly={isRequestSubmitting}
                  className={styles.emailInput}
                  onChange={handleEmailChange}
                />
              </Form.Field>
            </Form>
          </>
        ) : (
          <>
            <p className={styles.intro}>{t('common.resetPasswordEmailSent')}</p>
            {resetMessage && (
              <Message
                {...{
                  [resetMessage.type]: true,
                }}
                content={t(resetMessage.content)}
              />
            )}
          </>
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
            disabled={isRequestSubmitting || !email}
            onClick={handleRequestSubmit}
          />
        )}
      </Modal.Actions>
    </Modal>
  );
});

export default PasswordResetModal;
