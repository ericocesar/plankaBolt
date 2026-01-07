import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Message, Segment, Header } from 'semantic-ui-react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'redux-orm';
import orm from '../../../../orm';
import api from '../../../../api/forms';
import { getAccessToken } from '../../../../utils/access-token-storage';
import boardActions from '../../../../actions/boards';

const selectProjects = createSelector(orm, (session) => session.Project.all().toRefArray());
const selectBoards = createSelector(orm, (session) => session.Board.all().toRefArray());
const selectLists = createSelector(orm, (session) => session.List.all().toRefArray());
const selectUsers = createSelector(orm, (session) => session.User.all().toRefArray());

function FormEditor({ form, onSave, onCancel }) {
  const [name, setName] = useState(form ? form.name : '');
  const [projectId, setProjectId] = useState(form ? form.projectId : null);
  const [boardId, setBoardId] = useState(form ? form.boardId : null);
  const [listId, setListId] = useState(form ? form.listId : null);
  const [assigneeIds, setAssigneeIds] = useState(form ? form.assigneeIds || [] : []);
  const [categoryMapping, setCategoryMapping] = useState(form ? form.categoryMapping || {} : {});
  const [isActive, setIsActive] = useState(form ? form.isActive : true);

  // State for new category input
  const [newCategoryName, setNewCategoryName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();

  const projects = useSelector(selectProjects);
  const allBoards = useSelector(selectBoards);
  const allLists = useSelector(selectLists);
  const allUsers = useSelector(selectUsers);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ key: p.id, text: p.name, value: p.id })),
    [projects],
  );

  const boardOptions = useMemo(
    () =>
      allBoards
        .filter((b) => b.projectId === projectId)
        .map((b) => ({ key: b.id, text: b.name, value: b.id })),
    [allBoards, projectId],
  );

  const listOptions = useMemo(
    () =>
      allLists
        .filter((l) => l.boardId === boardId)
        .map((l) => ({ key: l.id, text: l.name, value: l.id })),
    [allLists, boardId],
  );

  const userOptions = useMemo(
    () =>
      allUsers.map((u) => ({
        key: u.id,
        text: u.name || u.username || u.email,
        value: u.id,
        image: u.avatarUrl ? { avatar: true, src: u.avatarUrl } : undefined,
      })),
    [allUsers],
  );

  const handleProjectIdChange = useCallback((e, { value }) => {
    setProjectId(value);
    setBoardId(null);
    setListId(null);
  }, []);

  const handleBoardIdChange = useCallback(
    (e, { value }) => {
      setBoardId(value);
      setListId(null);

      if (value) {
        dispatch(boardActions.fetchBoard(value));
      }
    },
    [dispatch],
  );

  const handleListIdChange = useCallback((e, { value }) => {
    setListId(value);
  }, []);

  const handleAssigneeIdsChange = useCallback((e, { value }) => {
    setAssigneeIds(value);
  }, []);

  const handleIsActiveChange = useCallback((e, { checked }) => {
    setIsActive(checked);
  }, []);

  const handleNameChange = useCallback((e, { value }) => {
    setName(value);
  }, []);

  const handleAddCategory = () => {
    if (newCategoryName && !categoryMapping[newCategoryName]) {
      // Store empty string or any value, we only care about the key (Category Name)
      setCategoryMapping((prev) => ({ ...prev, [newCategoryName]: 'auto-create' }));
      setNewCategoryName('');
    }
  };

  const handleRemoveCategory = (cat) => {
    setCategoryMapping((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const data = {
      name,
      projectId,
      boardId,
      listId,
      assigneeIds,
      categoryMapping,
      isActive,
    };

    try {
      const accessToken = getAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };

      if (form) {
        await api.updateForm(form.id, data, headers);
      } else {
        await api.createForm(data, headers);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form loading={loading} error={!!error}>
      <Message error header="Error" content={error} />

      <Form.Input label="Form Name" value={name} onChange={handleNameChange} required />

      <Form.Group widths="equal">
        <Form.Select
          label="Project"
          options={projectOptions}
          value={projectId}
          onChange={handleProjectIdChange}
          placeholder="Select Project"
          search
          selection
        />
        <Form.Select
          label="Board"
          options={boardOptions}
          value={boardId}
          onChange={handleBoardIdChange}
          placeholder="Select Board"
          disabled={!projectId}
          search
          selection
        />
        <Form.Select
          label="List"
          options={listOptions}
          value={listId}
          onChange={handleListIdChange}
          placeholder="Select List"
          disabled={!boardId}
          search
          selection
        />
      </Form.Group>

      <Form.Dropdown
        label="Auto-Assign Members"
        placeholder="Select Members"
        fluid
        multiple
        selection
        search
        options={userOptions}
        value={assigneeIds}
        onChange={handleAssigneeIdsChange}
        disabled={!projectId}
      />

      <Segment>
        <Header as="h5">Category to Label Mapping</Header>
        <div style={{ marginBottom: '1em', display: 'flex', gap: '0.5em' }}>
          <Form.Input
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={(e, { value }) => setNewCategoryName(value)}
            action={{
              icon: 'plus',
              onClick: handleAddCategory,
              disabled: !newCategoryName,
            }}
          />
        </div>
        {Object.keys(categoryMapping).map((cat) => (
          <Form.Group key={cat} inline>
            <Form.Input value={cat} readOnly width={14} />
            {/* No need to select label anymore, it's automatic */}
            <Button icon="trash" color="red" onClick={() => handleRemoveCategory(cat)} />
          </Form.Group>
        ))}
        {Object.keys(categoryMapping).length === 0 && <p>No categories defined.</p>}
      </Segment>

      <Form.Checkbox label="Is Active" checked={isActive} onChange={handleIsActiveChange} />

      <Button primary onClick={handleSubmit} disabled={!name || !listId}>
        Save
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </Form>
  );
}

FormEditor.propTypes = {
  form: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

FormEditor.defaultProps = {
  form: null,
};

export default FormEditor;
