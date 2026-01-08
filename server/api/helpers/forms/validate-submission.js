/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const validator = require('validator');

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const isEmptyValue = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
};

const collectFields = (schema) => (schema.steps || []).flatMap((step) => step.fields || []);

module.exports = {
  inputs: {
    schema: {
      type: 'json',
      required: true,
    },
    values: {
      type: 'json',
      required: true,
    },
    filesCount: {
      type: 'number',
    },
  },

  fn(inputs) {
    const errors = [];
    const sanitized = {};

    if (!isPlainObject(inputs.values)) {
      return { isValid: false, errors: ['Payload inválido.'], sanitized: {} };
    }

    const fields = collectFields(inputs.schema);

    fields.forEach((field) => {
      const rawValue = inputs.values[field.id];
      const value = normalizeString(rawValue);

      if (field.type === 'file') {
        if (field.required && Number.isInteger(inputs.filesCount) && inputs.filesCount === 0) {
          errors.push(`Campo obrigatório: ${field.label}.`);
        }
        return;
      }

      if (field.required) {
        if (field.type === 'checkbox') {
          if (value !== true) {
            errors.push(`Campo obrigatório: ${field.label}.`);
          }
        } else if (isEmptyValue(value)) {
          errors.push(`Campo obrigatório: ${field.label}.`);
        }
      }

      if (isEmptyValue(value)) {
        return;
      }

      switch (field.type) {
        case 'email':
          if (typeof value !== 'string' || !validator.isEmail(value)) {
            errors.push(`E-mail inválido em ${field.label}.`);
          }
          break;
        case 'number': {
          const num = parseNumber(value);
          if (num === null) {
            errors.push(`Número inválido em ${field.label}.`);
            break;
          }
          if (field.validation) {
            if (typeof field.validation.min === 'number' && num < field.validation.min) {
              errors.push(`Valor mínimo não atendido em ${field.label}.`);
            }
            if (typeof field.validation.max === 'number' && num > field.validation.max) {
              errors.push(`Valor máximo excedido em ${field.label}.`);
            }
          }
          break;
        }
        case 'date':
          if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
            errors.push(`Data inválida em ${field.label}.`);
          }
          break;
        case 'select':
        case 'radio': {
          if (field.optionsSource === 'categoryMapping') {
            break;
          }
          const allowed = (field.options || []).map((opt) => opt.value);
          if (!allowed.includes(value)) {
            errors.push(`Opção inválida em ${field.label}.`);
          }
          break;
        }
        case 'checkbox':
          if (typeof value !== 'boolean') {
            errors.push(`Valor inválido em ${field.label}.`);
          }
          break;
        default:
          if (field.validation) {
            const textValue = String(value);
            if (
              typeof field.validation.minLength === 'number' &&
              textValue.length < field.validation.minLength
            ) {
              errors.push(`Texto muito curto em ${field.label}.`);
            }
            if (
              typeof field.validation.maxLength === 'number' &&
              textValue.length > field.validation.maxLength
            ) {
              errors.push(`Texto muito longo em ${field.label}.`);
            }
            if (field.validation.pattern) {
              try {
                const regex = new RegExp(field.validation.pattern);
                if (!regex.test(textValue)) {
                  errors.push(`Formato inválido em ${field.label}.`);
                }
              } catch (e) {
                errors.push(`Pattern inválido configurado em ${field.label}.`);
              }
            }
          }
          break;
      }

      sanitized[field.id] = value;
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  },
};
