/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Input, Message, Tab } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { usePopupInClosableContext } from '../../../hooks';
import ConfirmationStep from '../../common/ConfirmationStep';

import apiKeyStyles from '../../common/AdministrationModal/UserEditModal/ApiKeyPane.module.scss';
import styles from './PreferencesPane.module.scss';

const ApiPane = React.memo(() => {
  const user = useSelector(selectors.selectCurrentUser);

  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const ConfirmationPopup = usePopupInClosableContext(ConfirmationStep);

  useEffect(
    () => () => {
      if (user.apiKeyState.value) {
        dispatch(entryActions.clearUserApiKeyValue(user.id));
      }
    },
    [dispatch, user.id, user.apiKeyState.value],
  );

  const handleCreateClick = useCallback(() => {
    dispatch(entryActions.createUserApiKey(user.id));
  }, [dispatch, user.id]);

  const handleRegenerateConfirm = useCallback(() => {
    dispatch(entryActions.createUserApiKey(user.id));
  }, [dispatch, user.id]);

  const handleDeleteConfirm = useCallback(() => {
    dispatch(entryActions.deleteUserApiKey(user.id));
  }, [dispatch, user.id]);

  const handleCopyClick = useCallback(() => {
    if (isCopied || !user.apiKeyState.value) {
      return;
    }

    navigator.clipboard.writeText(user.apiKeyState.value);

    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  }, [user.apiKeyState.value, isCopied]);

  return (
    <Tab.Pane attached={false} className={styles.wrapper}>
      {user.apiKeyPrefix ? (
        <>
          {!user.apiKeyState.isCreating &&
            (user.apiKeyState.value ? (
              <>
                <Message
                  positive
                  header={t('common.apiKeyCreated', {
                    context: 'title',
                  })}
                  content={t('common.saveThisKeyItWillNotBeShownAgain')}
                />
                <div className={apiKeyStyles.valueWrapper}>
                  <Input
                    fluid
                    readOnly
                    value={user.apiKeyState.value}
                    className={apiKeyStyles.value}
                  />
                  <Button className={apiKeyStyles.copyButton} onClick={handleCopyClick}>
                    <Icon fitted name={isCopied ? 'check' : 'copy'} />
                  </Button>
                </div>
              </>
            ) : (
              <Message
                warning
                header={`${user.apiKeyPrefix}_...`}
                content={t('common.fullKeyIsHiddenForSecurityReasons')}
              />
            ))}

          <ConfirmationPopup
            title="common.regenerateApiKey"
            content="common.areYouSureYouWantToRegenerateThisApiKey"
            buttonType="positive"
            buttonContent="action.regenerateApiKey"
            onConfirm={handleRegenerateConfirm}
          >
            <Button
              fluid
              content={t('action.regenerateApiKey')}
              loading={user.apiKeyState.isCreating}
              disabled={user.apiKeyState.isCreating}
              className={apiKeyStyles.actionButton}
            />
          </ConfirmationPopup>

          <ConfirmationPopup
            title="common.deleteApiKey"
            content="common.areYouSureYouWantToDeleteThisApiKey"
            buttonContent="action.deleteApiKey"
            onConfirm={handleDeleteConfirm}
          >
            <Button
              fluid
              content={t('action.deleteApiKey')}
              className={apiKeyStyles.actionButton}
            />
          </ConfirmationPopup>
        </>
      ) : (
        <>
          <div className={apiKeyStyles.content}>{t('common.noApiKeyCreated')}</div>
          <Button
            fluid
            positive
            content={t('action.createApiKey')}
            loading={user.apiKeyState.isCreating}
            disabled={user.apiKeyState.isCreating}
            onClick={handleCreateClick}
          />
        </>
      )}
    </Tab.Pane>
  );
});

export default ApiPane;
