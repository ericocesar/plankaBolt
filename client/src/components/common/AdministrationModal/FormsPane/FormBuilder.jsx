/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Header, Icon, Message } from 'semantic-ui-react';
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

const paletteItems = FIELD_TYPES.filter((type) => type !== 'checkbox');
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

function FormBuilder({ schema, customFields, labels, onChange }) {
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

  const updateStep = (stepId, updates) => {
    updateSchema((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
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

  const renderCanvasFieldInput = (field) => {
    if (field.type === 'file') {
      return (
        <div className={styles.fileUploadMock}>
          <Icon name="cloud upload" />
          <span>{field.placeholder || 'Arraste ou clique para anexar um arquivo'}</span>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          disabled={field.readOnly}
          readOnly
          rows={3}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select disabled={field.readOnly} defaultValue={field.defaultValue || ''}>
          <option value="" disabled>
            {field.placeholder || 'Selecione uma opção...'}
          </option>
          {(field.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type === 'date' ? 'text' : field.type}
        placeholder={field.type === 'date' ? 'DD/MM/AAAA' : field.placeholder}
        defaultValue={field.defaultValue}
        disabled={field.readOnly}
        readOnly
      />
    );
  };

  const renderSettings = () => {
    if (selectedField) {
      return (
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
            style={{ marginBottom: '1rem' }}
          />

          <div className={styles.formField}>
            <span className={styles.fieldLabel}>Largura do Campo</span>
            <Form.Dropdown
              selection
              value={selectedField.width || '100%'}
              options={[
                { text: 'Largura Total (100%)', value: '100%' },
                { text: 'Metade (50%)', value: '50%' },
              ]}
              onChange={(e, { value }) => updateField(selectedField.id, { width: value })}
            />
          </div>

          {(selectedField.type === 'text' ||
            selectedField.type === 'textarea' ||
            selectedField.type === 'email' ||
            selectedField.type === 'phone' ||
            selectedField.type === 'number' ||
            selectedField.type === 'date') && (
            <>
              <div className={styles.formField}>
                <Form.Input
                  label="Placeholder (Dica)"
                  value={selectedField.placeholder || ''}
                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                  placeholder="Ex: Digite aqui..."
                />
              </div>
              <div className={styles.formField}>
                <Form.Input
                  label="Valor Padrão"
                  value={selectedField.defaultValue || ''}
                  onChange={(e) => updateField(selectedField.id, { defaultValue: e.target.value })}
                  placeholder="Valor inicial preenchido"
                />
              </div>
            </>
          )}

          <div className={styles.formField}>
            <Form.TextArea
              label="Texto de Ajuda (Descrição)"
              value={selectedField.description || ''}
              onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
              placeholder="Ex: Instruções detalhadas abaixo do campo"
              rows={2}
            />
          </div>

          {selectedField.type === 'text' && (
            <div className={styles.formField}>
              <Form.Input
                label="Máscara (Opcional)"
                value={selectedField.mask || ''}
                onChange={(e) => updateField(selectedField.id, { mask: e.target.value })}
                placeholder="Ex: 999.999.999-99"
              />
            </div>
          )}

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
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '10px',
                    alignItems: 'center',
                  }}
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
                    icon={
                      selectedField.defaultValue === option.value
                        ? 'check circle'
                        : 'circle outline'
                    }
                    size="mini"
                    circular
                    onClick={() =>
                      updateField(selectedField.id, {
                        defaultValue:
                          selectedField.defaultValue === option.value ? '' : option.value,
                      })
                    }
                    title={
                      selectedField.defaultValue === option.value
                        ? 'Remover padrão'
                        : 'Definir como padrão'
                    }
                    style={{
                      background:
                        selectedField.defaultValue === option.value
                          ? 'rgba(26, 201, 204, 0.2)'
                          : 'rgba(255,255,255,0.05)',
                      color:
                        selectedField.defaultValue === option.value
                          ? '#1ac9cc'
                          : 'rgba(255,255,255,0.4)',
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
      );
    }

    if (selectedStep) {
      return (
        <Form size="small" className={styles.settingsForm}>
          <div className={styles.formField}>
            <Form.Input
              label="Título da Etapa"
              value={selectedStep.title || ''}
              onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
              placeholder="Ex: Dados Pessoais"
            />
          </div>
          <div className={styles.formField}>
            <Form.TextArea
              label="Descrição (Opcional)"
              value={selectedStep.description || ''}
              onChange={(e) => updateStep(selectedStep.id, { description: e.target.value })}
              placeholder="Instruções para o usuário..."
              rows={3}
              style={{ background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px' }}
            />
          </div>
          <div className={styles.formField}>
            <Form.Input
              label="Texto do Botão de Avançar"
              value={selectedStep.buttonText || ''}
              onChange={(e) => updateStep(selectedStep.id, { buttonText: e.target.value })}
              placeholder="Ex: Próximo"
            />
          </div>
        </Form>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
        <Icon name="settings" size="large" style={{ marginBottom: '1rem' }} />
        <p>Selecione um passo ou campo para editar suas propriedades</p>
      </div>
    );
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

      <div className={styles.builderGrid}>
        {/* Palette */}
        <div className={styles.toolBoxColumn}>
          <Header as="h4" className={styles.sectionTitle}>
            Componentes
          </Header>
          <div className={styles.paletteContainer}>
            {paletteItems.map((item) => (
              <div
                key={item.type}
                className={styles.paletteItem}
                onMouseEnter={() => setHoveredPaletteType(item.type)}
                onMouseLeave={() => setHoveredPaletteType(null)}
              >
                <Icon name={FIELD_TYPE_DETAILS[item.type]?.icon || 'circle'} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <Button
                  icon="plus"
                  size="mini"
                  circular
                  className={styles.addButton}
                  onClick={() => addFieldToStep(item.type)}
                  title={`Adicionar ${item.label}`}
                />
              </div>
            ))}
          </div>
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
        </div>

        {/* Canvas */}
        <div className={styles.canvasColumn}>
          <div className={styles.canvasHeader}>
            <Header as="h4" className={styles.sectionTitle}>
              Estrutura do Formulário
            </Header>
            <div className={styles.actionButtons}>
              <Button
                icon="eye"
                active={showPreview}
                onClick={() => setShowPreview(!showPreview)}
                title="Alternar Visualização"
                className={showPreview ? styles.activeButton : ''}
              />
              <Button icon="plus" content="Nova Etapa" onClick={addStep} title="Adicionar Etapa" />
            </div>
          </div>

          <div className={styles.stepsContainer}>
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
                    className={styles.canvasArea}
                    style={{
                      background: snapshot.isDraggingOver
                        ? 'rgba(26, 201, 204, 0.05)'
                        : 'rgba(0,0,0,0.2)',
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
                              style={{
                                ...draggableProvided.draggableProps.style,
                                width: field.width === '50%' ? 'calc(50% - 8px)' : '100%',
                              }}
                              onClick={() => setSelectedFieldId(field.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedFieldId(field.id);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <div style={{ position: 'relative' }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '8px',
                                  }}
                                >
                                  <span className={styles.fieldLabel}>
                                    {field.label || '(Sem Rótulo)'}
                                    {field.required && (
                                      <span className={styles.requiredStar}>*</span>
                                    )}
                                  </span>
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

                                {renderCanvasFieldInput(field)}

                                {field.description && (
                                  <div className={styles.helpText}>{field.description}</div>
                                )}
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
        </div>

        {/* Settings */}
        <div className={styles.settingsColumn}>
          <Header as="h4" className={styles.sectionTitle}>
            Propriedades
          </Header>
          {renderSettings()}
          {selectedField && (
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className={styles.sectionTitle}
                style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#1ac9cc' }}
              >
                Mapeamento do Campo
              </div>
              <Form size="small" className={styles.settingsForm}>
                <div className={styles.formField}>
                  <span className={styles.fieldLabel}>Salvar valor em:</span>
                  <Form.Dropdown
                    selection
                    value={selectedField.mapTo || 'description'}
                    options={[
                      { text: 'Descrição do Cartão', value: 'description' },
                      { text: 'Rótulos (Labels)', value: 'labels' },
                      { text: 'Lista de Tarefas', value: 'task' },
                      ...(selectedField.type === 'file' ? [{ text: 'Anexo', value: 'file' }] : []),
                      { text: 'Campo Personalizado', value: 'custom-field' },
                    ]}
                    onChange={(e, { value }) =>
                      updateField(selectedField.id, { mapTo: value, customFieldId: null })
                    }
                  />
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: '4px',
                    }}
                  >
                    Onde os dados preenchidos serão salvos no cartão criado.
                  </div>
                </div>

                {selectedField.mapTo === 'labels' && (
                  <div className={styles.formField}>
                    <span className={styles.fieldLabel}>Selecione o Rótulo</span>
                    {!labels || labels.length === 0 ? (
                      <div
                        style={{
                          background: 'rgba(255, 188, 66, 0.1)',
                          color: '#ffbc42',
                          border: '1px solid rgba(255, 188, 66, 0.3)',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <p style={{ margin: 0 }}>Nenhum rótulo disponível neste quadro.</p>
                      </div>
                    ) : (
                      <Form.Dropdown
                        selection
                        placeholder="Selecione um rótulo..."
                        value={selectedField.labelId || ''}
                        options={labels.map((l) => ({
                          key: l.id,
                          text: l.name || '(Sem nome)',
                          value: l.id,
                          label: { color: l.color, empty: true, circular: true },
                        }))}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, { labelId: value })
                        }
                      />
                    )}
                  </div>
                )}

                {selectedField.mapTo === 'custom-field' && (
                  <div className={styles.formField}>
                    <span className={styles.fieldLabel}>Selecione o Campo Personalizado</span>
                    {!customFields || customFields.length === 0 ? (
                      <div
                        style={{
                          background: 'rgba(255, 188, 66, 0.1)',
                          color: '#ffbc42',
                          border: '1px solid rgba(255, 188, 66, 0.3)',
                          padding: '10px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <p style={{ margin: 0 }}>Nenhum campo personalizado disponível.</p>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.8 }}>
                          Crie campos nas configurações do quadro.
                        </p>
                      </div>
                    ) : (
                      <Form.Dropdown
                        selection
                        placeholder="Selecione um campo..."
                        value={selectedField.customFieldId || ''}
                        options={customFields.map((cf) => ({
                          key: cf.id,
                          text: cf.name,
                          value: cf.id,
                          content: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#1ac9cc',
                                  opacity: 0.7,
                                }}
                              />
                              {cf.name}
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  opacity: 0.5,
                                  marginLeft: 'auto',
                                }}
                              >
                                {cf.type}
                              </span>
                            </div>
                          ),
                        }))}
                        onChange={(e, { value }) =>
                          updateField(selectedField.id, { customFieldId: value })
                        }
                      />
                    )}
                  </div>
                )}
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

FormBuilder.propTypes = {
  schema: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  customFields: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  labels: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
};

FormBuilder.defaultProps = {
  customFields: [],
  labels: [],
};

export default FormBuilder;
