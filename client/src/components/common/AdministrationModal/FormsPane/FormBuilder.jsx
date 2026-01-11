/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Grid, Header, Icon, Message } from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { nanoid } from 'nanoid';
import {
  FIELD_TYPES,
  createField,
  createStep,
  buildInitialValues,
  collectFields,
  normalizeSchema,
} from '../../../../utils/formSchema';
import DynamicFormFields from '../../../forms/DynamicFormFields';

import styles from './FormBuilder.module.scss';

const paletteItems = FIELD_TYPES;
const FIELD_TYPE_DETAILS = {
  text: {
    icon: 'font',
    hint: 'Linha curta de texto. Ex: "Joao Silva".',
  },
  textarea: {
    icon: 'align left',
    hint: 'Resposta longa. Ex: "Conte mais detalhes do problema".',
  },
  email: {
    icon: 'mail',
    hint: 'Endereco de e-mail. Ex: "nome@empresa.com".',
  },
  phone: {
    icon: 'phone',
    hint: 'Telefone/WhatsApp. Ex: "(11) 99999-0000".',
  },
  number: {
    icon: 'calculator',
    hint: 'Somente numeros. Ex: "42".',
  },
  select: {
    icon: 'dropdown',
    hint: 'Escolha uma opcao. Ex: "Reclamacao".',
  },
  radio: {
    icon: 'dot circle outline',
    hint: 'Escolha unica entre opcoes. Ex: "Plano A".',
  },
  checkbox: {
    icon: 'check square outline',
    hint: 'Marcar/desmarcar. Ex: "Aceito os termos".',
  },
  date: {
    icon: 'calendar alternate outline',
    hint: 'Selecione uma data. Ex: "01/01/2026".',
  },
  file: {
    icon: 'paperclip',
    hint: 'Envio de arquivo. Ex: "curriculo.pdf".',
  },
};

function FormBuilder({ schema, onChange }) {
  const normalized = useMemo(() => normalizeSchema(schema), [schema]);
  const [selectedStepId, setSelectedStepId] = useState(normalized.steps[0]?.id || null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [hoveredPaletteType, setHoveredPaletteType] = useState(null);

  useEffect(() => {
    if (!normalized.steps.find((step) => step.id === selectedStepId)) {
      setSelectedStepId(normalized.steps[0]?.id || null);
      setSelectedFieldId(null);
    }
  }, [normalized.steps, selectedStepId]);

  useEffect(() => {
    if (previewStepIndex >= normalized.steps.length) {
      setPreviewStepIndex(0);
    }
  }, [normalized.steps.length, previewStepIndex]);

  const selectedStep = normalized.steps.find((step) => step.id === selectedStepId);
  const selectedField = selectedStep?.fields.find((field) => field.id === selectedFieldId);
  const hasFileField = collectFields(normalized).some((field) => field.type === 'file');
  const previewValues = useMemo(() => buildInitialValues(normalized), [normalized]);

  const updateSchema = (updater) => {
    const nextSchema = updater(normalized);
    onChange(nextSchema);
  };

  const updateField = (fieldId, updates) => {
    updateSchema((current) => ({
      ...current,
      steps: current.steps.map((step) => ({
        ...step,
        fields: step.fields.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field,
        ),
      })),
    }));
  };

  const addFieldToStep = (type, destinationIndex = null) => {
    if (type === 'file' && hasFileField) {
      setError('Apenas um campo de arquivo é permitido por formulário.');
      return;
    }

    const newField = createField(type);
    updateSchema((current) => ({
      ...current,
      steps: current.steps.map((step) => {
        if (step.id !== selectedStepId) return step;
        const nextFields = [...step.fields];
        const insertAt =
          typeof destinationIndex === 'number' ? destinationIndex : nextFields.length;
        nextFields.splice(insertAt, 0, newField);
        return { ...step, fields: nextFields };
      }),
    }));

    setSelectedFieldId(newField.id);
    setError(null);
  };

  const removeField = (fieldId) => {
    updateSchema((current) => ({
      ...current,
      steps: current.steps.map((step) => ({
        ...step,
        fields: step.fields.filter((field) => field.id !== fieldId),
      })),
    }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const addStep = () => {
    const newStep = createStep('Novo Step');
    updateSchema((current) => ({
      ...current,
      steps: [...current.steps, newStep],
    }));
    setSelectedStepId(newStep.id);
    setSelectedFieldId(null);
  };

  const removeStep = (stepId) => {
    if (normalized.steps.length === 1) return;
    updateSchema((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepId),
    }));
    if (selectedStepId === stepId) {
      setSelectedStepId(normalized.steps[0]?.id || null);
      setSelectedFieldId(null);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (source.droppableId === 'palette' && destination.droppableId === 'canvas') {
      const type = draggableId.replace('palette-', '');
      addFieldToStep(type, destination.index);
      return;
    }

    if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      if (source.index === destination.index) return;

      updateSchema((current) => ({
        ...current,
        steps: current.steps.map((step) => {
          if (step.id !== selectedStepId) return step;
          const nextFields = [...step.fields];
          const [moved] = nextFields.splice(source.index, 1);
          nextFields.splice(destination.index, 0, moved);
          return { ...step, fields: nextFields };
        }),
      }));
    }

    if (source.droppableId === 'steps' && destination.droppableId === 'steps') {
      if (source.index === destination.index) return;

      updateSchema((current) => {
        const nextSteps = [...current.steps];
        const [moved] = nextSteps.splice(source.index, 1);
        nextSteps.splice(destination.index, 0, moved);
        return { ...current, steps: nextSteps };
      });
    }
  };

  const handleOptionChange = (field, index, updates) => {
    const nextOptions = [...(field.options || [])];
    nextOptions[index] = { ...nextOptions[index], ...updates };
    updateField(field.id, { options: nextOptions });
  };

  const addOption = (field) => {
    const nextOptions = [...(field.options || [])];
    nextOptions.push({ label: 'Nova opção', value: `opcao_${nanoid(4)}` });
    updateField(field.id, { options: nextOptions });
  };

  const removeOption = (field, index) => {
    const nextOptions = [...(field.options || [])];
    nextOptions.splice(index, 1);
    updateField(field.id, { options: nextOptions });
  };

  return (
    <div className={styles.builderWrapper}>
      {error && (
        <Message
          error
          onDismiss={() => setError(null)}
          header="Erro na Estrutura"
          content={error}
        />
      )}

      <Grid className={styles.builderGrid}>
        {/* Palette */}
        <Grid.Column className={styles.paletteColumn}>
          <Header as="h4" className={styles.sectionTitle}>
            Componentes
          </Header>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="palette" isDropDisabled>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {paletteItems.map((item, index) => (
                    <Draggable key={item.type} draggableId={`palette-${item.type}`} index={index}>
                      {(draggableProvided, draggableSnapshot) => (
                        <>
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                            className={styles.paletteItem}
                            onMouseEnter={() => setHoveredPaletteType(item.type)}
                            onMouseLeave={() => setHoveredPaletteType(null)}
                          >
                            <Icon name={FIELD_TYPE_DETAILS[item.type]?.icon || 'circle'} />
                            {item.label}
                          </div>
                          {draggableSnapshot.isDragging && (
                            <div className={styles.paletteItem}>
                              <Icon name={FIELD_TYPE_DETAILS[item.type]?.icon || 'circle'} />
                              {item.label}
                            </div>
                          )}
                        </>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          {hoveredPaletteType && (
            <Message
              info
              size="mini"
              style={{
                marginTop: '1rem',
                background: 'rgba(26, 201, 204, 0.05)',
                border: '1px solid rgba(26, 201, 204, 0.2)',
                color: '#1ac9cc',
              }}
            >
              <p>{FIELD_TYPE_DETAILS[hoveredPaletteType]?.hint}</p>
            </Message>
          )}
        </Grid.Column>

        {/* Canvas */}
        <Grid.Column className={styles.mainColumn}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <Header as="h4" className={styles.sectionTitle} style={{ marginBottom: 0 }}>
              Estrutura do Formulário
            </Header>
            <Button.Group size="mini">
              <Button
                icon="eye"
                active={showPreview}
                onClick={() => setShowPreview(!showPreview)}
                title="Alternar Visualização"
              />
              <Button icon="plus" content="Nova Etapa" onClick={addStep} title="Adicionar Etapa" />
            </Button.Group>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            {normalized.steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={`${styles.stepLabel} ${selectedStepId === step.id ? styles.active : ''}`}
                onClick={() => {
                  setSelectedStepId(step.id);
                  setPreviewStepIndex(index);
                }}
              >
                Etapa {index + 1}
                {normalized.steps.length > 1 && (
                  <Icon
                    name="delete"
                    style={{ marginLeft: '10px', fontSize: '0.8rem', opacity: 0.6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {showPreview ? (
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '16px' }}>
              <Header
                as="h5"
                style={{ color: '#1ac9cc', textTransform: 'uppercase', fontSize: '0.8rem' }}
              >
                Preview: Etapa {previewStepIndex + 1}
              </Header>
              {normalized.steps[previewStepIndex] && (
                <DynamicFormFields
                  step={normalized.steps[previewStepIndex]}
                  values={previewValues}
                  errors={{}}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="canvas">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                      minHeight: '300px',
                      padding: '10px',
                      background: snapshot.isDraggingOver
                        ? 'rgba(26, 201, 204, 0.05)'
                        : 'transparent',
                      borderRadius: '16px',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {selectedStep?.fields.length === 0 ? (
                      <div className={styles.emptyCanvas}>
                        <Icon name="hand pointer" size="huge" />
                        <p>Arraste componentes aqui para começar</p>
                      </div>
                    ) : (
                      selectedStep?.fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(draggableProvided) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              className={`${styles.fieldItem} ${selectedFieldId === field.id ? styles.selected : ''}`}
                              onClick={() => setSelectedFieldId(field.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedFieldId(field.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <div>
                                  <span className={styles.fieldLabel}>
                                    {field.label || '(Sem Rótulo)'}
                                    {field.required && (
                                      <span style={{ color: '#db2828', marginLeft: '4px' }}>*</span>
                                    )}
                                  </span>
                                  <span className={styles.fieldTypeLabel}>{field.type}</span>
                                </div>
                                <Button
                                  className={styles.deleteButton}
                                  icon="trash"
                                  size="mini"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeField(field.id);
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </Grid.Column>

        {/* Settings */}
        <Grid.Column className={styles.settingsColumn}>
          <Header as="h4" className={styles.sectionTitle}>
            Propriedades
          </Header>
          {selectedField ? (
            <Form size="small" className={styles.settingsForm}>
              <div className={styles.formField}>
                <Form.Input
                  label="Rótulo da Pergunta"
                  value={selectedField.label || ''}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  placeholder="Ex: Seu Nome Completo"
                />
              </div>
              <Form.Checkbox
                label="Campo Obrigatório"
                checked={!!selectedField.required}
                onChange={(e, { checked }) => updateField(selectedField.id, { required: checked })}
              />

              {(selectedField.type === 'select' || selectedField.type === 'radio') && (
                <div style={{ marginTop: '2.5rem' }}>
                  <div
                    className={styles.sectionTitle}
                    style={{ fontSize: '0.8rem', marginBottom: '1rem' }}
                  >
                    Opções
                  </div>
                  {(selectedField.options || []).map((option) => (
                    <div
                      key={option.value}
                      style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}
                    >
                      <input
                        value={option.label || ''}
                        onChange={(e) => {
                          const index = selectedField.options.findIndex(
                            (o) => o.value === option.value,
                          );
                          handleOptionChange(selectedField, index, { label: e.target.value });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: '0.9rem',
                        }}
                      />
                      <Button
                        icon="trash"
                        size="mini"
                        circular
                        className={styles.deleteOptionButton}
                        onClick={() => {
                          const index = selectedField.options.findIndex(
                            (o) => o.value === option.value,
                          );
                          removeOption(selectedField, index);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    size="small"
                    icon="plus"
                    content="Adicionar Opção"
                    onClick={() => addOption(selectedField)}
                    style={{
                      marginTop: '10px',
                      background: 'rgba(26, 201, 204, 0.1)',
                      color: '#1ac9cc',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
              )}
            </Form>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
              <Icon name="settings" size="large" style={{ marginBottom: '1rem' }} />
              <p>Selecione um campo para editar suas propriedades</p>
            </div>
          )}
        </Grid.Column>
      </Grid>
    </div>
  );
}

FormBuilder.propTypes = {
  schema: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
};

export default FormBuilder;
