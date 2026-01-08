/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const ALLOWED_FIELD_TYPES = [
  'text',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'date',
  'file',
  'email',
  'number',
  'phone',
];

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

module.exports = {
  inputs: {
    schema: {
      type: 'json',
      required: true,
    },
  },

  fn(inputs) {
    const errors = [];
    const { schema } = inputs;

    if (!isPlainObject(schema)) {
      return { isValid: false, errors: ['Schema inválido.'] };
    }

    if (!Array.isArray(schema.steps) || schema.steps.length === 0) {
      errors.push('Schema deve conter ao menos um step.');
    }

    const fieldIds = new Set();
    let fileFieldCount = 0;

    (schema.steps || []).forEach((step, stepIndex) => {
      if (!isPlainObject(step)) {
        errors.push(`Step ${stepIndex + 1} inválido.`);
        return;
      }

      if (!step.id || typeof step.id !== 'string') {
        errors.push(`Step ${stepIndex + 1} precisa de um id.`);
      }

      if (!step.title || typeof step.title !== 'string') {
        errors.push(`Step ${stepIndex + 1} precisa de um título.`);
      }

      if (!Array.isArray(step.fields)) {
        errors.push(`Step ${stepIndex + 1} precisa ter campos.`);
        return;
      }

      step.fields.forEach((field, fieldIndex) => {
        if (!isPlainObject(field)) {
          errors.push(`Campo ${fieldIndex + 1} do step ${stepIndex + 1} inválido.`);
          return;
        }

        if (!field.id || typeof field.id !== 'string') {
          errors.push(`Campo ${fieldIndex + 1} do step ${stepIndex + 1} precisa de id.`);
        } else if (fieldIds.has(field.id)) {
          errors.push(`Campo com id duplicado: ${field.id}.`);
        } else {
          fieldIds.add(field.id);
        }

        if (!field.type || !ALLOWED_FIELD_TYPES.includes(field.type)) {
          errors.push(`Campo ${field.id || fieldIndex + 1} tem tipo inválido.`);
        }

        if (!field.label || typeof field.label !== 'string') {
          errors.push(`Campo ${field.id || fieldIndex + 1} precisa de label.`);
        }

        if (field.type === 'file') {
          fileFieldCount += 1;
        }

        if (['select', 'radio'].includes(field.type)) {
          const usesCategorySource = field.optionsSource === 'categoryMapping';
          if (
            !usesCategorySource &&
            (!Array.isArray(field.options) || field.options.length === 0)
          ) {
            errors.push(`Campo ${field.id || fieldIndex + 1} precisa de opções.`);
          }
        }
      });
    });

    if (fileFieldCount > 1) {
      errors.push('Apenas um campo de arquivo é permitido por formulário.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
