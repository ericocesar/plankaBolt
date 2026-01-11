import React, { useState, useEffect, useCallback } from 'react';
import { Button, List, Icon, Header, Confirm } from 'semantic-ui-react';
import QRCode from 'qrcode';
import api from '../../../../api/forms';
import FormEditor from './FormEditor';
import { getAccessToken } from '../../../../utils/access-token-storage';

import styles from './FormsPane.module.scss';

function FormsPane() {
  const [forms, setForms] = useState([]);
  const [editingForm, setEditingForm] = useState(null); // null = list, 'new' = create, object = edit
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDownloadQRCode = async (form) => {
    try {
      const url = `${window.location.origin}/support/${form.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 1024,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qrcode-${form.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating QR code', err); // eslint-disable-line no-console
    }
  };

  const handleCopyLink = (formId) => {
    const link = `${window.location.origin}/support/${formId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter forms
  const filteredForms = forms.filter((form) => {
    const search = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const name = (form.name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const id = (form.id || '').toLowerCase();

    return name.includes(search) || id.includes(search);
  });

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
    <div className={styles.wrapper}>
      <div className={styles.headerContainer}>
        <div className={styles.titleSection}>
          <Header as="h2" className={styles.headerTitle}>
            Formulários
          </Header>
        </div>
        <div className={styles.actionsSection}>
          <div className={`ui input icon ${styles.searchInputWrapper}`}>
            <input
              type="text"
              placeholder="Pesquisar formulário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <i aria-hidden="true" className="search icon" onClick={() => {}} />
          </div>

          <Button
            className={styles.addButton}
            icon="plus"
            content="Novo Formulário"
            onClick={() => setEditingForm('new')}
          />
        </div>
      </div>

      {forms.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <Icon name="wpforms" size="huge" />
          <p>Nenhum formulário criado ainda.</p>
        </div>
      ) : (
        <List className={styles.formList}>
          {filteredForms.map((form) => (
            <List.Item key={form.id} className={styles.formItem}>
              <div className={styles.formContent}>
                <span className={styles.formName}>{form.name}</span>
                <span className={styles.formMeta}>
                  {form.id} • {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.formActions}>
                <Button
                  className={styles.actionButton}
                  icon="external alternate"
                  title="Abrir formulário"
                  as="a"
                  href={`/support/${form.id}`}
                  target="_blank"
                />
                <Button
                  className={styles.actionButton}
                  icon={copiedId === form.id ? 'check' : 'copy'}
                  title="Copiar link"
                  onClick={() => handleCopyLink(form.id)}
                  color={copiedId === form.id ? 'teal' : undefined}
                />
                <Button
                  className={styles.actionButton}
                  icon="qrcode"
                  title="Download QR Code"
                  onClick={() => handleDownloadQRCode(form)}
                />
                <Button
                  className={styles.actionButton}
                  icon="edit"
                  title="Editar"
                  onClick={() => setEditingForm(form)}
                />
                <Button
                  className={`${styles.actionButton} ${styles.delete}`}
                  icon="trash"
                  title="Excluir"
                  onClick={() => setConfirmDeleteId(form.id)}
                />
              </div>
            </List.Item>
          ))}
        </List>
      )}

      <Confirm
        open={!!confirmDeleteId}
        content="Tem certeza que deseja excluir este formulário?"
        confirmButton="Excluir"
        cancelButton="Cancelar"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        size="mini"
      />
    </div>
  );
}

export default FormsPane;
