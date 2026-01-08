/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {
  Button,
  Divider,
  Form,
  Grid,
  Header,
  Icon,
  Label,
  Message,
  Popup,
  Segment,
} from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { nanoid } from 'nanoid';
import {
  FIELD_TYPES,
  FIELD_ROLES,
  createField,
  createStep,
  buildInitialValues,
  collectFields,
  normalizeSchema,
} from '../../../../utils/formSchema';
import DynamicFormFields from '../../../forms/DynamicFormFields';

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

function FormBuilder({
  schema,
  onChange,
  onSaveDraft,
  onSave,
  onCancel,
  saveDisabled,
  cancelDisabled,
}) {
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
  const canvasColumns = Math.max(1, selectedStep?.columns || 1);
  const dragPortal = typeof document !== 'undefined' ? document.body : null;
  const propertiesGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75em 1em',
    alignItems: 'start',
  };

  const updateSchema = (updater) => {
    const nextSchema = updater(normalized);
    onChange(nextSchema);
  };

  const updateStep = (stepId, updates) => {
    updateSchema((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
    }));
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

  const updateSettings = (updates) => {
    updateSchema((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...updates,
      },
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
    <div style={{ padding: '0.75em 0.5em' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.5em',
          marginBottom: '0.75em',
        }}
      >
        <Button color="green" onClick={onSaveDraft} disabled={!onSaveDraft}>
          Salvar Rascunho
        </Button>
        <Button
          basic
          icon={showPreview ? 'eye slash' : 'eye'}
          content={showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
          onClick={() => setShowPreview((prev) => !prev)}
        />
        {onSave && (
          <Button primary onClick={onSave} disabled={saveDisabled}>
            Salvar
          </Button>
        )}
        {onCancel && (
          <Button onClick={onCancel} disabled={cancelDisabled}>
            Cancelar
          </Button>
        )}
      </div>
      {error && <Message warning content={error} onDismiss={() => setError(null)} />}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid stackable columns={3} style={{ alignItems: 'flex-start' }}>
          <Grid.Column width={2} style={{ paddingRight: '0.75rem' }}>
            <Header as="h5">Paleta</Header>
            <Droppable droppableId="palette" isDropDisabled>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {paletteItems.map((item, index) => (
                    <Draggable key={item.type} draggableId={`palette-${item.type}`} index={index}>
                      {(dragProvided, dragSnapshot) => {
                        const paletteMeta = FIELD_TYPE_DETAILS[item.type] || {};
                        const isHovered =
                          hoveredPaletteType === item.type && !dragSnapshot.isDragging;
                        const { style: dragStyle } = dragProvided.draggableProps;
                        const draggableStyle = dragStyle || {};
                        let { transform } = draggableStyle;
                        if (!dragSnapshot.isDragging && isHovered) {
                          transform = 'scale(1.2)';
                        }
                        const paletteCard = (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            onMouseEnter={() => setHoveredPaletteType(item.type)}
                            onMouseLeave={() => setHoveredPaletteType(null)}
                            style={{
                              ...draggableStyle,
                              padding: '0.5em',
                              marginBottom: '0.5em',
                              background: '#dcfce7',
                              border: '1px solid #86efac',
                              borderRadius: '6px',
                              cursor: 'grab',
                              width: '85%',
                              transition: 'transform 0.15s ease',
                              transform,
                              transformOrigin: 'left center',
                              zIndex: isHovered ? 2 : 1,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '0.5em',
                              }}
                            >
                              <span>{item.label}</span>
                              <Icon name={paletteMeta.icon || 'puzzle'} />
                            </div>
                          </div>
                        );

                        if (dragSnapshot.isDragging && dragPortal) {
                          return ReactDOM.createPortal(paletteCard, dragPortal);
                        }

                        return (
                          <Popup
                            content={paletteMeta.hint || 'Campo do formulario.'}
                            position="top right"
                            inverted
                            disabled={dragSnapshot.isDragging}
                            trigger={paletteCard}
                          />
                        );
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Grid.Column>
          <Grid.Column width={9} style={{ paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
            <Header as="h5">Canvas</Header>
            <div style={{ marginBottom: '0.75em' }}>
              <Droppable droppableId="steps" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5em',
                      alignItems: 'center',
                      paddingBottom: '0.5em',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {normalized.steps.map((step, index) => (
                      <Draggable key={step.id} draggableId={step.id} index={index}>
                        {(dragProvided, dragSnapshot) => {
                          const stepTab = (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => {
                                setSelectedStepId(step.id);
                                setSelectedFieldId(null);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedStepId(step.id);
                                  setSelectedFieldId(null);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              style={{
                                padding: '0.45em 0.9em',
                                borderRadius: '10px 10px 6px 6px',
                                border:
                                  step.id === selectedStepId
                                    ? '1px solid #93c5fd'
                                    : '1px solid transparent',
                                borderBottom:
                                  step.id === selectedStepId
                                    ? '2px solid #2563eb'
                                    : '2px solid transparent',
                                background: step.id === selectedStepId ? '#eff6ff' : '#f8fafc',
                                color: step.id === selectedStepId ? '#1d4ed8' : '#475569',
                                fontWeight: step.id === selectedStepId ? 600 : 500,
                                boxShadow:
                                  step.id === selectedStepId
                                    ? '0 6px 14px rgba(37, 99, 235, 0.12)'
                                    : 'none',
                                cursor: 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5em',
                                ...dragProvided.draggableProps.style,
                              }}
                            >
                              <span
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '999px',
                                  background: step.id === selectedStepId ? '#2563eb' : '#cbd5f5',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {index + 1}
                              </span>
                              <span>{step.title || `Step ${index + 1}`}</span>
                              <Button
                                icon="trash"
                                size="mini"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeStep(step.id);
                                }}
                              />
                            </div>
                          );

                          if (dragSnapshot.isDragging && dragPortal) {
                            return ReactDOM.createPortal(stepTab, dragPortal);
                          }

                          return stepTab;
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <Button
                      icon
                      labelPosition="left"
                      onClick={addStep}
                      size="mini"
                      style={{
                        border: '1px dashed #93c5fd',
                        background: '#f0f9ff',
                      }}
                    >
                      <Icon name="plus" />
                      Adicionar Step
                    </Button>
                  </div>
                )}
              </Droppable>
            </div>
            <Segment
              style={{
                minHeight: '300px',
                background: '#e0f2fe',
                border: '1px dashed #cbd5f5',
              }}
            >
              <Droppable droppableId="canvas">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        canvasColumns > 1 ? `repeat(${canvasColumns}, minmax(0, 1fr))` : '1fr',
                      gap: '0.75em',
                    }}
                  >
                    {selectedStep?.fields.length === 0 && (
                      <div style={{ color: '#6b7280', gridColumn: '1 / -1' }}>
                        Arraste um campo da paleta.
                      </div>
                    )}
                    {selectedStep?.fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(dragProvided, dragSnapshot) => {
                          const isFullWidth = !field.width || field.width === 'full';
                          const columnSpan =
                            canvasColumns > 1 && isFullWidth ? `span ${canvasColumns}` : 'span 1';
                          const fieldCard = (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setSelectedFieldId(field.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedFieldId(field.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              style={{
                                padding: '0.75em',
                                background: field.id === selectedFieldId ? '#dbeafe' : '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                cursor: 'grab',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gridColumn: columnSpan,
                                ...dragProvided.draggableProps.style,
                              }}
                            >
                              <div>
                                <strong>{field.label || 'Campo'}</strong>
                                <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                                  {field.type}
                                  {field.required ? ' • obrigatório' : ''}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '0.35em',
                                  alignItems: 'center',
                                }}
                              >
                                <Button
                                  icon="pencil"
                                  size="mini"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedFieldId(field.id);
                                  }}
                                />
                                <Button
                                  icon="trash"
                                  size="mini"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeField(field.id);
                                  }}
                                />
                              </div>
                            </div>
                          );

                          if (dragSnapshot.isDragging && dragPortal) {
                            return ReactDOM.createPortal(fieldCard, dragPortal);
                          }

                          return fieldCard;
                        }}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Segment>
          </Grid.Column>
          <Grid.Column width={5} style={{ paddingLeft: '0.75rem' }}>
            <Header as="h5">Propriedades</Header>
            {selectedField ? (
              <Form>
                <div style={propertiesGridStyle}>
                  <Form.Input
                    label="Label"
                    value={selectedField.label || ''}
                    onChange={(e, { value }) => updateField(selectedField.id, { label: value })}
                  />
                  <Form.Input
                    label="Placeholder"
                    value={selectedField.placeholder || ''}
                    onChange={(e, { value }) =>
                      updateField(selectedField.id, { placeholder: value })
                    }
                  />
                  <Form.TextArea
                    label="Texto de ajuda"
                    rows={2}
                    style={{ gridColumn: '1 / -1' }}
                    value={selectedField.helpText || ''}
                    onChange={(e, { value }) => updateField(selectedField.id, { helpText: value })}
                  />
                  <Form.Select
                    label="Largura"
                    options={[
                      { text: 'Largura total', value: 'full' },
                      { text: 'Meia largura', value: 'half' },
                    ]}
                    value={selectedField.width || 'full'}
                    onChange={(e, { value }) => updateField(selectedField.id, { width: value })}
                  />
                  <Form.Select
                    label="Mapeamento"
                    options={FIELD_ROLES.map((role) => ({
                      text: role.label,
                      value: role.value,
                    }))}
                    value={selectedField.role || ''}
                    onChange={(e, { value }) => updateField(selectedField.id, { role: value })}
                  />
                  <Form.Checkbox
                    label="Obrigatório"
                    checked={!!selectedField.required}
                    style={{
                      alignSelf: 'end',
                      gridColumn:
                        selectedField.type === 'text' || selectedField.type === 'phone'
                          ? 'auto'
                          : '1 / -1',
                    }}
                    onChange={(e, { checked }) =>
                      updateField(selectedField.id, { required: checked })
                    }
                  />
                  {selectedField.type === 'text' || selectedField.type === 'phone' ? (
                    <Form.Input
                      label="Máscara"
                      value={selectedField.mask || ''}
                      onChange={(e, { value }) => updateField(selectedField.id, { mask: value })}
                    />
                  ) : null}
                  {['select', 'radio'].includes(selectedField.type) ? (
                    <>
                      <Form.Select
                        label="Fonte das opções"
                        style={{ gridColumn: '1 / -1' }}
                        options={[
                          { text: 'Estático', value: 'static' },
                          { text: 'Categorias do formulário', value: 'categoryMapping' },
                        ]}
                        value={selectedField.optionsSource || 'static'}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            optionsSource: value,
                            options: value === 'static' ? selectedField.options || [] : [],
                          })
                        }
                      />
                      {selectedField.optionsSource !== 'categoryMapping' && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <Label size="tiny" color="blue">
                            Opções
                          </Label>
                          {(selectedField.options || []).map((option, index) => {
                            const optionKey = option.value || option.label || `opt-${nanoid(4)}`;
                            return (
                              <Form.Group
                                key={`${selectedField.id}-opt-${optionKey}`}
                                widths="equal"
                              >
                                <Form.Input
                                  label="Label"
                                  value={option.label}
                                  onChange={(e, { value }) =>
                                    handleOptionChange(selectedField, index, { label: value })
                                  }
                                />
                                <Form.Input
                                  label="Valor"
                                  value={option.value}
                                  onChange={(e, { value }) =>
                                    handleOptionChange(selectedField, index, { value })
                                  }
                                />
                                <Button
                                  icon="trash"
                                  onClick={() => removeOption(selectedField, index)}
                                  style={{ marginTop: '1.75em' }}
                                />
                              </Form.Group>
                            );
                          })}
                          <Button
                            type="button"
                            size="mini"
                            icon="plus"
                            content="Adicionar opção"
                            onClick={() => addOption(selectedField)}
                          />
                        </div>
                      )}
                    </>
                  ) : null}
                  {selectedField.type === 'number' ? (
                    <>
                      <Form.Input
                        label="Mínimo"
                        type="number"
                        value={selectedField.validation?.min ?? ''}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              min: value === '' ? null : Number(value),
                            },
                          })
                        }
                      />
                      <Form.Input
                        label="Máximo"
                        type="number"
                        value={selectedField.validation?.max ?? ''}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              max: value === '' ? null : Number(value),
                            },
                          })
                        }
                      />
                    </>
                  ) : null}
                  {['text', 'textarea', 'email', 'phone'].includes(selectedField.type) ? (
                    <>
                      <Form.Input
                        label="Mínimo de caracteres"
                        type="number"
                        value={selectedField.validation?.minLength ?? ''}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              minLength: value === '' ? null : Number(value),
                            },
                          })
                        }
                      />
                      <Form.Input
                        label="Máximo de caracteres"
                        type="number"
                        value={selectedField.validation?.maxLength ?? ''}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              maxLength: value === '' ? null : Number(value),
                            },
                          })
                        }
                      />
                      <Form.Input
                        label="Pattern"
                        style={{ gridColumn: '1 / -1' }}
                        value={selectedField.validation?.pattern || ''}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, {
                            validation: {
                              ...selectedField.validation,
                              pattern: value,
                            },
                          })
                        }
                      />
                    </>
                  ) : null}
                </div>
              </Form>
            ) : (
              <Form>
                <div style={propertiesGridStyle}>
                  <Form.Input
                    label="Título do step"
                    value={selectedStep?.title || ''}
                    onChange={(e, { value }) => updateStep(selectedStepId, { title: value })}
                  />
                  <Form.Select
                    label="Colunas"
                    options={[
                      { text: '1 coluna', value: 1 },
                      { text: '2 colunas', value: 2 },
                    ]}
                    value={selectedStep?.columns || 1}
                    onChange={(e, { value }) => updateStep(selectedStepId, { columns: value })}
                  />
                  <Form.TextArea
                    label="Descrição"
                    rows={2}
                    style={{ gridColumn: '1 / -1' }}
                    value={selectedStep?.description || ''}
                    onChange={(e, { value }) => updateStep(selectedStepId, { description: value })}
                  />
                </div>
                <Divider />
                <Header as="h5">Configurações</Header>
                <div style={propertiesGridStyle}>
                  <Form.Input
                    label="Texto do botão"
                    value={normalized.settings?.submitLabel || ''}
                    onChange={(e, { value }) => updateSettings({ submitLabel: value })}
                  />
                  <Form.Input
                    label="Título de sucesso"
                    value={normalized.settings?.successTitle || ''}
                    onChange={(e, { value }) => updateSettings({ successTitle: value })}
                  />
                  <Form.TextArea
                    label="Mensagem de sucesso"
                    rows={2}
                    style={{ gridColumn: '1 / -1' }}
                    value={normalized.settings?.successMessage || ''}
                    onChange={(e, { value }) => updateSettings({ successMessage: value })}
                  />
                </div>
                <Message info content="Selecione um campo para editar suas propriedades." />
              </Form>
            )}
          </Grid.Column>
        </Grid>
      </DragDropContext>
      {showPreview && (
        <>
          <Divider />
          <Segment style={{ marginTop: '1em' }}>
            <Header as="h5">Preview</Header>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1em' }}>
              <Button
                size="mini"
                icon="arrow left"
                content="Anterior"
                disabled={previewStepIndex === 0}
                onClick={() => setPreviewStepIndex((prev) => Math.max(prev - 1, 0))}
              />
              <span>
                {normalized.steps[previewStepIndex]?.title || `Step ${previewStepIndex + 1}`}
              </span>
              <Button
                size="mini"
                icon="arrow right"
                content="Próximo"
                disabled={previewStepIndex >= normalized.steps.length - 1}
                onClick={() =>
                  setPreviewStepIndex((prev) => Math.min(prev + 1, normalized.steps.length - 1))
                }
              />
            </div>
            <Form>
              {normalized.steps[previewStepIndex] && (
                <DynamicFormFields
                  step={normalized.steps[previewStepIndex]}
                  values={previewValues}
                  errors={{}}
                  onChange={() => {}}
                  readOnly
                />
              )}
            </Form>
          </Segment>
        </>
      )}
    </div>
  );
}

FormBuilder.propTypes = {
  schema: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  saveDisabled: PropTypes.bool,
  cancelDisabled: PropTypes.bool,
};

FormBuilder.defaultProps = {
  onSaveDraft: null,
  onSave: null,
  onCancel: null,
  saveDisabled: false,
  cancelDisabled: false,
};

export default FormBuilder;
