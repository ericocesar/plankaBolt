/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import PropTypes from 'prop-types';
import { Form, Label } from 'semantic-ui-react';
import InputMask from 'react-input-mask';
import StackedCardsUpload from '../Support/StackedCardsUpload';
import { DEFAULT_PRIORITY_OPTIONS } from '../../utils/formSchema';

const buildRows = (fields, columns = 1) => {
  if (columns <= 1) {
    return fields.map((field) => [field]);
  }

  const rows = [];
  let currentRow = [];

  fields.forEach((field) => {
    if (field.width === 'full') {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      rows.push([field]);
      return;
    }

    currentRow.push(field);
    if (currentRow.length === columns) {
      rows.push(currentRow);
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};

const getOptionsForField = (field, categories = []) => {
  if (field.optionsSource === 'categoryMapping') {
    return categories.map((category) => ({
      key: category,
      text: category,
      value: category,
    }));
  }

  if ((!field.options || field.options.length === 0) && field.role === 'priority') {
    return DEFAULT_PRIORITY_OPTIONS.map((option) => ({
      key: option.value,
      text: option.label,
      value: option.value,
    }));
  }

  return (field.options || []).map((option) => ({
    key: option.value,
    text: option.label,
    value: option.value,
  }));
};

function DynamicFormFields({
  step,
  values,
  errors,
  onChange,
  categories,
  files,
  onFilesChange,
  readOnly,
}) {
  const rows = buildRows(step.fields || [], step.columns || 1);

  const handleValueChange = (fieldId, value) => {
    if (readOnly) return;
    onChange(fieldId, value);
  };

  return (
    <>
      {rows.map((row) => {
        const rowKey = row.map((field) => field.id).join('-');
        const rowContent = row.map((field) => {
          const errorMessage = errors[field.id];
          const fieldValue = values[field.id];
          const fieldDomId = `field-${field.id}`;
          const hasError = Boolean(errorMessage);
          const errorLabel = hasError ? (
            <Label basic color="red" pointing>
              {errorMessage}
            </Label>
          ) : null;

          if (field.type === 'textarea') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <label htmlFor={fieldDomId}>{field.label}</label>
                <Form.TextArea
                  id={fieldDomId}
                  value={fieldValue || ''}
                  placeholder={field.placeholder || ''}
                  onChange={(e, { value }) => handleValueChange(field.id, value)}
                  disabled={readOnly}
                />
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          if (field.type === 'select') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <label htmlFor={fieldDomId}>{field.label}</label>
                <Form.Select
                  id={fieldDomId}
                  options={getOptionsForField(field, categories)}
                  value={fieldValue || ''}
                  placeholder={field.placeholder || ''}
                  onChange={(e, { value }) => handleValueChange(field.id, value)}
                  disabled={readOnly}
                />
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          if (field.type === 'radio') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <div style={{ fontWeight: 600, marginBottom: '0.35em' }}>{field.label}</div>
                {(getOptionsForField(field, categories) || []).map((option) => (
                  <Form.Radio
                    key={`${field.id}-${option.value}`}
                    name={field.id}
                    label={option.text}
                    value={option.value}
                    checked={fieldValue === option.value}
                    onChange={(e, { value }) => handleValueChange(field.id, value)}
                    disabled={readOnly}
                  />
                ))}
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <Form.Checkbox
                  id={fieldDomId}
                  label={field.label}
                  checked={fieldValue === true}
                  onChange={(e, { checked }) => handleValueChange(field.id, checked)}
                  disabled={readOnly}
                />
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          if (field.type === 'date') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <label htmlFor={fieldDomId}>{field.label}</label>
                <Form.Input
                  id={fieldDomId}
                  type="date"
                  value={fieldValue || ''}
                  onChange={(e, { value }) => handleValueChange(field.id, value)}
                  disabled={readOnly}
                />
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          if (field.type === 'file') {
            return (
              <Form.Field key={field.id} error={hasError}>
                <div style={{ fontWeight: 600, marginBottom: '0.35em' }}>{field.label}</div>
                {readOnly ? (
                  <div>Pré-visualização de anexos indisponível.</div>
                ) : (
                  <StackedCardsUpload files={files} onFilesChange={onFilesChange} />
                )}
                {field.helpText && <small>{field.helpText}</small>}
                {errorLabel}
              </Form.Field>
            );
          }

          let inputType = 'text';
          if (field.type === 'number') inputType = 'number';
          if (field.type === 'email') inputType = 'email';
          if (field.type === 'phone') inputType = 'tel';

          return (
            <Form.Field key={field.id} error={hasError}>
              <label htmlFor={fieldDomId}>{field.label}</label>
              {field.mask ? (
                <InputMask
                  mask={field.mask}
                  value={fieldValue || ''}
                  onChange={(event) => handleValueChange(field.id, event.target.value)}
                  disabled={readOnly}
                >
                  {(maskProps) => (
                    <Form.Input
                      {...maskProps}
                      id={fieldDomId}
                      placeholder={field.placeholder || ''}
                      disabled={readOnly}
                    />
                  )}
                </InputMask>
              ) : (
                <Form.Input
                  id={fieldDomId}
                  type={inputType}
                  value={fieldValue || ''}
                  placeholder={field.placeholder || ''}
                  onChange={(e, { value }) => handleValueChange(field.id, value)}
                  disabled={readOnly}
                />
              )}
              {field.helpText && <small>{field.helpText}</small>}
              {errorLabel}
            </Form.Field>
          );
        });

        if (row.length > 1) {
          return (
            <Form.Group widths="equal" key={rowKey}>
              {rowContent}
            </Form.Group>
          );
        }

        return <div key={rowKey}>{rowContent}</div>;
      })}
    </>
  );
}

DynamicFormFields.propTypes = {
  step: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  values: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  errors: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
  categories: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  files: PropTypes.array, // eslint-disable-line react/forbid-prop-types
  onFilesChange: PropTypes.func,
  readOnly: PropTypes.bool,
};

DynamicFormFields.defaultProps = {
  errors: {},
  categories: [],
  files: [],
  onFilesChange: () => {},
  readOnly: false,
};

export default DynamicFormFields;
