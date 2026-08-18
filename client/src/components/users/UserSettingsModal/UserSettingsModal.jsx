/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Tab } from 'semantic-ui-react';

import entryActions from '../../../entry-actions';
import { useClosableModal } from '../../../hooks';
import AccountPane from './AccountPane';
import PreferencesPane from './PreferencesPane';
import NotificationsPane from './NotificationsPane';
import SecurityPane from './SecurityPane';

import styles from './UserSettingsModal.module.scss';

const UserSettingsModal = React.memo(() => {
  const dispatch = useDispatch();
  const [t] = useTranslation();
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleClose = useCallback(() => {
    dispatch(entryActions.closeModal());
  }, [dispatch]);

  const handleTabChange = useCallback((_, { activeIndex }) => {
    setActiveTabIndex(activeIndex);
  }, []);

  const [ClosableModal] = useClosableModal();

  const panes = [
    {
      menuItem: t('common.account', {
        context: 'title',
      }),
      render: () => <AccountPane />,
    },
    {
      menuItem: t('common.preferences', {
        context: 'title',
      }),
      render: () => <PreferencesPane />,
    },
    {
      menuItem: t('common.notifications', {
        context: 'title',
      }),
      render: () => <NotificationsPane />,
    },
    {
      menuItem: t('common.security', {
        context: 'title',
      }),
      render: () => <SecurityPane />,
    },
  ];

  return (
    <ClosableModal
      open
      closeIcon
      size="small"
      centered={false}
      onClose={handleClose}
      className={styles.wrapper}
    >
      <ClosableModal.Content>
        <Tab
          menu={{
            secondary: true,
            pointing: true,
          }}
          panes={panes}
          activeIndex={activeTabIndex}
          onTabChange={handleTabChange}
        />
      </ClosableModal.Content>
    </ClosableModal>
  );
});

export default UserSettingsModal;
