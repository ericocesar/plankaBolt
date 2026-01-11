/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Accordion, Button, Form, Segment } from 'semantic-ui-react';
import { useDidUpdate, useToggle } from '../../../lib/hooks';

import { useForm } from '../../../hooks';
import { isUrl } from '../../../utils/validator';
import Item from './Item';
import Editor from './Editor';

import styles from './Webhooks.module.scss';

const DEFAULT_DATA = {
  name: '',
  url: '',
  accessToken: '',
  events: [],
  excludedEvents: [],
};

const Webhooks = React.memo(({ ids, onCreate }) => {
  const [data, handleFieldChange, setData] = useForm(DEFAULT_DATA);
  const [focusNameFieldState, focusNameField] = useToggle();

  const editorRef = useRef(null);

  const handleCreateSubmit = useCallback(() => {
    const cleanData = {
      ...data,
      name: data.name.trim(),
      url: data.url.trim(),
      accessToken: data.accessToken.trim() || null,
      events: data.events.length === 0 ? null : data.events,
      excludedEvents: data.excludedEvents.length === 0 ? null : data.excludedEvents,
    };

    if (!cleanData.name) {
      editorRef.current.selectNameField();
      return;
    }

    if (!cleanData.url || !isUrl(cleanData.url)) {
      editorRef.current.selectUrlField();
      return;
    }

    onCreate(cleanData);
    setData(DEFAULT_DATA);
    focusNameField();
  }, [onCreate, data, setData, focusNameField]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focusNameField();
    }
  }, []);

  useDidUpdate(() => {
    if (editorRef.current) {
      editorRef.current.focusNameField();
    }
  }, [focusNameFieldState]);

  return (
    <>
      <div className={styles.headerContainer}>
        <div className={styles.searchPlaceholder}>
          {/* Search field placeholder - will be implemented later */}
        </div>
        {ids.length < 10 && (
          <Button
            className={styles.addButton}
            icon="plus"
            content="Novo Webhook"
            onClick={handleCreateSubmit}
          />
        )}
      </div>
      {ids.length > 0 && (
        <Accordion styled fluid className={styles.accordion}>
          {ids.map((id) => (
            <Item key={id} id={id} />
          ))}
        </Accordion>
      )}
      {ids.length < 10 && (
        <Segment className={styles.segment}>
          <Form onSubmit={handleCreateSubmit}>
            <Editor ref={editorRef} data={data} onFieldChange={handleFieldChange} />
          </Form>
        </Segment>
      )}
    </>
  );
});

Webhooks.propTypes = {
  ids: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  onCreate: PropTypes.func.isRequired,
};

export default Webhooks;
