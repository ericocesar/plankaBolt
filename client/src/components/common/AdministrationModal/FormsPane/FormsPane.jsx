import React, { useState, useEffect, useCallback } from 'react';
import { Button, List, Icon, Segment, Header, Confirm } from 'semantic-ui-react';
import api from '../../../../api/forms';
import FormEditor from './FormEditor';
import { getAccessToken } from '../../../../utils/access-token-storage';

function FormsPane() {
  const [forms, setForms] = useState([]);
  const [editingForm, setEditingForm] = useState(null); // null = list, 'new' = create, object = edit
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const accessToken = getAccessToken();
      const data = await api.getForms({
        Authorization: `Bearer ${accessToken}`,
      });
      if (data && data.items) {
        setForms(data.items);
      } else {
        setForms([]);
      }
    } catch (e) {
      // Fallback for 401
      if (e && (e.status === 401 || e.statusCode === 401)) {
        // Retry with socket?
        // Since we don't have socket api for forms yet, we can't easily fallback.
        // But we should handle the error gracefully so it doesn't crash.
        setForms([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleDelete = async () => {
    if (confirmDeleteId) {
      try {
        const accessToken = getAccessToken();
        await api.deleteForm(confirmDeleteId, {
          Authorization: `Bearer ${accessToken}`,
        });
        loadForms();
      } catch (e) {
        // Silently fail or handle error
      } finally {
        setConfirmDeleteId(null);
      }
    }
  };

  const handleCopyLink = (formId) => {
    const link = `${window.location.origin}/support/${formId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (editingForm) {
    return (
      <FormEditor
        form={editingForm === 'new' ? null : editingForm}
        onSave={() => {
          setEditingForm(null);
          loadForms();
        }}
        onCancel={() => setEditingForm(null)}
      />
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: '1em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Header as="h3" style={{ margin: 0 }}>
          Public Support Forms
        </Header>
        <Button primary onClick={() => setEditingForm('new')}>
          <Icon name="plus" /> New Form
        </Button>
      </div>

      <Segment loading={loading}>
        <List divided relaxed>
          {forms.length === 0 && <List.Item>No forms found.</List.Item>}
          {forms.map((form) => (
            <List.Item key={form.id}>
              <List.Content floated="right">
                <Button icon onClick={() => setEditingForm(form)}>
                  <Icon name="pencil" />
                </Button>
                <Button icon color="red" onClick={() => setConfirmDeleteId(form.id)}>
                  <Icon name="trash" />
                </Button>
              </List.Content>
              <List.Content>
                <List.Header>{form.name}</List.Header>
                <List.Description>
                  ID: {form.id} | Active: {form.isActive ? 'Yes' : 'No'} | Public Link:{' '}
                  <a
                    href={`${window.location.origin}/support/${form.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    /support/{form.id}
                  </a>
                  <Button
                    icon
                    size="mini"
                    compact
                    onClick={() => handleCopyLink(form.id)}
                    style={{ marginLeft: '0.5em' }}
                    title={copiedId === form.id ? 'Copied!' : 'Copy Link'}
                    color={copiedId === form.id ? 'green' : undefined}
                  >
                    <Icon name={copiedId === form.id ? 'check' : 'copy'} />
                  </Button>
                </List.Description>
              </List.Content>
            </List.Item>
          ))}
        </List>
      </Segment>

      <Confirm
        open={!!confirmDeleteId}
        content="Are you sure you want to delete this form?"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default FormsPane;
