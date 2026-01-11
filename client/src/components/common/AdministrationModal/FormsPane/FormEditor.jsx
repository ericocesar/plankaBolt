import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Message, Segment, Header, Tab, Divider, Icon } from 'semantic-ui-react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'redux-orm';
import orm from '../../../../orm';
import api from '../../../../api/forms';
import { getAccessToken } from '../../../../utils/access-token-storage';
import boardActions from '../../../../actions/boards';
import FormBuilder from './FormBuilder';
import { normalizeSchema } from '../../../../utils/formSchema';

import styles from './FormEditor.module.scss';

const selectProjects = createSelector(orm, (session) => session.Project.all().toRefArray());
const selectBoards = createSelector(orm, (session) => session.Board.all().toRefArray());
const selectLists = createSelector(orm, (session) => session.List.all().toRefArray());
const selectUsers = createSelector(orm, (session) => session.User.all().toRefArray());
const selectLabels = createSelector(orm, (session) => session.Label.all().toRefArray());

function FormEditor({ form, onSave, onCancel }) {
  const [name, setName] = useState(form ? form.name : '');
  const [projectId, setProjectId] = useState(form ? form.projectId : null);
  const [boardId, setBoardId] = useState(form ? form.boardId : null);
  const [listId, setListId] = useState(form ? form.listId : null);
  const [assigneeIds, setAssigneeIds] = useState(form ? form.assigneeIds || [] : []);
  const [labelIds, setLabelIds] = useState(form ? form.labelIds || [] : []);
  const [categoryMapping, setCategoryMapping] = useState(form ? form.categoryMapping || {} : {});
  const [isActive, setIsActive] = useState(form ? form.isActive : true);
  const [draftSchema, setDraftSchema] = useState(
    normalizeSchema(form ? form.draftSchema : null, form ? form.name : 'Formulário'),
  );
  const [publishedSchemaVersion, setPublishedSchemaVersion] = useState(
    form ? form.publishedSchemaVersion : null,
  );
  const [currentFormId, setCurrentFormId] = useState(form ? form.id : null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState(null);

  const dispatch = useDispatch();

  const projects = useSelector(selectProjects);
  const allBoards = useSelector(selectBoards);
  const allLists = useSelector(selectLists);
  const allUsers = useSelector(selectUsers);
  const allLabels = useSelector(selectLabels);

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

  const labelOptions = useMemo(
    () =>
      allLabels
        .filter((l) => l.boardId === boardId)
        .map((l) => ({
          key: l.id,
          text: l.name || '(Sem nome)',
          value: l.id,
          label: { color: l.color, empty: true, circular: true },
        })),
    [allLabels, boardId],
  );

  const labelsById = useMemo(
    () =>
      allLabels.reduce((acc, label) => {
        acc[label.id] = label;
        return acc;
      }, {}),
    [allLabels],
  );

  const handleProjectIdChange = useCallback((e, { value }) => {
    setProjectId(value);
    setBoardId(null);
    setListId(null);
    setLabelIds([]);
    setCategoryMapping({});
  }, []);

  const handleBoardIdChange = useCallback(
    (e, { value }) => {
      setBoardId(value);
      setListId(null);
      setLabelIds([]);
      setCategoryMapping({});

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

  const handleLabelIdsChange = useCallback(
    (e, { value }) => {
      setLabelIds(value);
      setCategoryMapping(() => {
        const nextMapping = {};
        value.forEach((labelId) => {
          const label = labelsById[labelId];
          if (!label) return;
          const key = label.name || `Etiqueta ${label.id}`;
          nextMapping[key] = labelId;
        });
        return nextMapping;
      });
    },
    [labelsById],
  );

  const handleTabChange = useCallback((_, { activeIndex }) => {
    setActiveTabIndex(activeIndex);
  }, []);

  const handleIsActiveChange = useCallback((e, { checked }) => {
    setIsActive(checked);
  }, []);

  const handleNameChange = useCallback((e, { value }) => {
    setName(value);
  }, []);

  const hydrateFormState = useCallback((data) => {
    const mappingLabelIds = Object.values(data?.categoryMapping || {}).filter(
      (value) => value && value !== 'auto-create',
    );
    const uniqueMappingIds = Array.from(new Set(mappingLabelIds));
    const nextLabelIds =
      data?.labelIds && data.labelIds.length > 0 ? data.labelIds : uniqueMappingIds;

    setName(data?.name || '');
    setProjectId(data?.projectId || null);
    setBoardId(data?.boardId || null);
    setListId(data?.listId || null);
    setAssigneeIds(data?.assigneeIds || []);
    setLabelIds(nextLabelIds);
    setCategoryMapping(data?.categoryMapping || {});
    setIsActive(typeof data?.isActive === 'boolean' ? data.isActive : true);
    setDraftSchema(normalizeSchema(data?.draftSchema || null, data?.name || 'Formulário'));
    setPublishedSchemaVersion(data?.publishedSchemaVersion || null);
    setCurrentFormId(data?.id || null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadForm = async () => {
      if (!form) {
        hydrateFormState(null);
        return;
      }

      setLoadingForm(true);
      try {
        const accessToken = getAccessToken();
        const headers = { Authorization: `Bearer ${accessToken}` };
        const response = await api.getForm(form.id, headers);
        if (!isMounted) return;
        hydrateFormState(response?.item || form);
      } catch (err) {
        if (!isMounted) return;
        hydrateFormState(form);
      } finally {
        if (isMounted) {
          setLoadingForm(false);
        }
      }
    };

    loadForm();

    return () => {
      isMounted = false;
    };
  }, [form, hydrateFormState]);

  const handleSubmit = async ({ closeOnSuccess = true } = {}) => {
    setLoading(true);
    setError(null);

    const data = {
      name,
      projectId,
      boardId,
      listId,
      assigneeIds,
      labelIds,
      categoryMapping,
      isActive,
      draftSchema,
    };

    try {
      const accessToken = getAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      const formId = form?.id || currentFormId;

      if (formId) {
        await api.updateForm(formId, data, headers);
      } else {
        const response = await api.createForm(data, headers);
        if (response?.item?.id) {
          setCurrentFormId(response.item.id);
        }
      }
      if (closeOnSuccess) {
        onSave();
      }
    } catch (err) {
      setError(err.message || 'Falha ao salvar o formulário');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    const formId = form?.id || currentFormId;
    if (!formId) return;
    setPublishLoading(true);
    setPublishError(null);

    try {
      const accessToken = getAccessToken();
      const headers = { Authorization: `Bearer ${accessToken}` };
      await api.updateForm(formId, { draftSchema }, headers);
      const response = await api.publishForm(formId, headers);
      if (response && response.item) {
        setPublishedSchemaVersion(response.item.publishedSchemaVersion || null);
      }
    } catch (err) {
      setPublishError(err.message || 'Falha ao publicar o formulário');
    } finally {
      setPublishLoading(false);
    }
  };

  const hasSavedForm = Boolean(form?.id || currentFormId);
  const isBusy = loading || loadingForm || publishLoading;

  const panes = [
    {
      menuItem: 'Setup',
      render: () => (
        <Tab.Pane
          attached={false}
          segment={false}
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}
        >
          <Form>
            <Form.Input
              label="Nome do Formulário"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="Digite o nome do formulário"
            />

            <Form.Group widths="equal">
              <Form.Select
                label="Projeto"
                options={projectOptions}
                value={projectId}
                onChange={handleProjectIdChange}
                placeholder="Selecionar Projeto"
                search
                selection
                required
              />
              <Form.Select
                label="Quadro"
                options={boardOptions}
                value={boardId}
                onChange={handleBoardIdChange}
                placeholder="Selecionar Quadro"
                disabled={!projectId}
                search
                selection
                required
              />
              <Form.Select
                label="Lista"
                options={listOptions}
                value={listId}
                onChange={handleListIdChange}
                placeholder="Selecionar Lista"
                disabled={!boardId}
                search
                selection
                required
              />
            </Form.Group>

            <Form.Group widths="equal">
              <Form.Dropdown
                label="Atribuir Membros Automaticamente"
                placeholder="Selecionar Membros"
                fluid
                multiple
                selection
                search
                options={userOptions}
                value={assigneeIds}
                onChange={handleAssigneeIdsChange}
                disabled={!projectId}
              />
              <Form.Dropdown
                label="Selecionar Rótulos"
                placeholder="Selecionar Rótulos"
                fluid
                multiple
                selection
                search
                options={labelOptions}
                value={labelIds}
                onChange={handleLabelIdsChange}
                disabled={!boardId}
              />
            </Form.Group>

            <Divider />
            <Form.Checkbox label="Ativo" checked={isActive} onChange={handleIsActiveChange} />
          </Form>
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Campos',
      render: () => (
        <Tab.Pane attached={false} segment={false}>
          <FormBuilder schema={draftSchema} onChange={setDraftSchema} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Publicação',
      render: () => (
        <Tab.Pane attached={false} segment={false}>
          <Segment>
            <Header as="h5">
              <Icon name="cloud upload" />
              Publicar formulário
            </Header>
            {hasSavedForm ? (
              <>
                <p>
                  {publishedSchemaVersion
                    ? `Publicado: v${publishedSchemaVersion}`
                    : 'Nenhuma versão publicada ainda.'}
                </p>
                <Button
                  color="green"
                  onClick={handlePublish}
                  loading={publishLoading}
                  disabled={publishLoading}
                >
                  Publicar
                </Button>
              </>
            ) : (
              <Message info content="Salve o formulário antes de publicar." />
            )}
            {publishError && <Message error header="Erro ao publicar" content={publishError} />}
          </Segment>
        </Tab.Pane>
      ),
    },
  ];

  return (
    <div className={styles.wrapper}>
      {error && <Message error header="Erro" content={error} />}
      <div className={styles.headerContainer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Button className={styles.backButton} icon="arrow left" onClick={onCancel} />
          <Header as="h2" className={styles.headerTitle}>
            {hasSavedForm ? `Editar: ${name}` : 'Novo Formulário'}
          </Header>
        </div>
        <div className={styles.headerActions}>
          <Button
            className={styles.cancelButton}
            content="Cancelar"
            onClick={onCancel}
            disabled={isBusy}
          />
          <Button
            className={styles.saveButton}
            content="Salvar Alterações"
            loading={loading}
            disabled={isBusy || !name || !listId}
            onClick={() => handleSubmit()}
          />
        </div>
      </div>

      <div className={styles.tabContainer}>
        <Tab
          menu={{ secondary: true, pointing: false }}
          panes={panes}
          activeIndex={activeTabIndex}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
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
