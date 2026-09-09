/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Loader } from 'semantic-ui-react';

import selectors from '../../../selectors';
import Content from './Content';

import styles from './Content.module.scss';

const Login = React.memo(() => {
  const isInitializing = useSelector(selectors.selectIsInitializing);

  if (isInitializing) {
    return (
      <div role="status" aria-live="polite" className={styles.initLoader}>
        <Loader active size="massive" />
        <span className={styles.srOnly}>Loading…</span>
      </div>
    );
  }

  return <Content />;
});

export default Login;
