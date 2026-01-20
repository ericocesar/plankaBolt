import { nanoid } from 'nanoid';

export const FIELD_TYPES = [
  { type: 'text', label: 'Texto curto' },
  { type: 'textarea', label: 'Texto longo' },
  { type: 'email', label: 'E-mail' },
  { type: 'phone', label: 'Telefone' },
  { type: 'number', label: 'Número' },
  { type: 'select', label: 'Seleção' },
  { type: 'radio', label: 'Múltipla escolha' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'date', label: 'Data' },
  { type: 'file', label: 'Arquivo' },
];

export const FIELD_ROLES = [
  { value: '', label: 'Sem mapeamento' },
  { value: 'name', label: 'Nome' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'company', label: 'Empresa' },
  { value: 'product', label: 'Produto' },
  { value: 'category', label: 'Categoria' },
  { value: 'priority', label: 'Prioridade' },
  { value: 'subject', label: 'Assunto' },
  { value: 'description', label: 'Descrição' },
  { value: 'consent', label: 'Consentimento' },
];

export const DEFAULT_PRIORITY_OPTIONS = [
  { label: 'Baixa', value: 'Baixa' },
  { label: 'Média', value: 'Média' },
  { label: 'Alta', value: 'Alta' },
];

export const createField = (type) => {
  const base = {
    id: `field-${nanoid(8)}`,
    type,
    label: 'Campo',
    placeholder: '',
    required: false,
    helpText: '',
    options: [],
    optionsSource: 'static',
    validation: {},
    width: '100%',
    role: '',
    mask: '',
  };

  switch (type) {
    case 'text':
      return { ...base, label: 'Texto', placeholder: 'Digite aqui' };
    case 'textarea':
      return { ...base, label: 'Texto longo', placeholder: 'Digite aqui' };
    case 'email':
      return { ...base, label: 'E-mail', placeholder: 'email@exemplo.com', role: 'email' };
    case 'phone':
      return { ...base, label: 'Telefone', placeholder: '(00) 00000-0000', role: 'phone' };
    case 'number':
      return { ...base, label: 'Número', placeholder: '0' };
    case 'select':
      return {
        ...base,
        label: 'Seleção',
        options: [
          { label: 'Opção 1', value: 'opcao_1' },
          { label: 'Opção 2', value: 'opcao_2' },
        ],
      };
    case 'radio':
      return {
        ...base,
        label: 'Múltipla escolha',
        options: [
          { label: 'Opção A', value: 'opcao_a' },
          { label: 'Opção B', value: 'opcao_b' },
        ],
      };
    case 'checkbox':
      return { ...base, label: 'Concordo', required: false };
    case 'date':
      return { ...base, label: 'Data' };
    case 'file':
      return { ...base, label: 'Anexo', helpText: 'Envie um arquivo', required: false };
    default:
      return base;
  }
};

export const createStep = (title = 'Novo Step') => ({
  id: `step-${nanoid(6)}`,
  title,
  description: '',
  columns: 2,
  fields: [],
});

export const createDefaultSchema = (title = 'Formulário') => ({
  version: 1,
  title,
  steps: [
    {
      id: `step-${nanoid(6)}`,
      title: 'Etapa 1',
      description: '',
      columns: 2,
      fields: [],
    },
  ],
  settings: {
    submitLabel: 'Enviar',
    successTitle: 'Ticket Enviado!',
    successMessage: 'Seu número de protocolo é:',
  },
});

export const normalizeSchema = (schema, titleFallback = 'Formulário') => {
  if (!schema || typeof schema !== 'object') {
    return createDefaultSchema(titleFallback);
  }

  const steps = Array.isArray(schema.steps) ? schema.steps : [];

  if (steps.length === 0) {
    return createDefaultSchema(titleFallback);
  }

  return {
    version: schema.version || 1,
    title: schema.title || titleFallback,
    settings: schema.settings || {},
    steps: steps.map((step) => ({
      id: step.id || `step-${nanoid(6)}`,
      title: step.title || 'Step',
      description: step.description || '',
      columns: step.columns || 1,
      fields: Array.isArray(step.fields) ? step.fields : [],
    })),
  };
};

export const collectFields = (schema) =>
  schema && Array.isArray(schema.steps) ? schema.steps.flatMap((step) => step.fields || []) : [];

export const validateSubmission = (schema, values, filesCount = null) => {
  const fieldErrors = {};

  if (!schema || !values || typeof values !== 'object') {
    return { isValid: false, fieldErrors: { _form: 'Dados inválidos.' } };
  }

  collectFields(schema).forEach((field) => {
    const value = values[field.id];

    if (field.type === 'file') {
      if (field.required && Number.isInteger(filesCount) && filesCount === 0) {
        fieldErrors[field.id] = 'Campo obrigatório.';
      }
      return;
    }

    if (field.required) {
      if (field.type === 'checkbox') {
        if (value !== true) {
          fieldErrors[field.id] = 'Campo obrigatório.';
          return;
        }
      } else if (value === undefined || value === null || value === '') {
        fieldErrors[field.id] = 'Campo obrigatório.';
        return;
      }
    }

    if (value === undefined || value === null || value === '') {
      return;
    }

    if (['select', 'radio'].includes(field.type)) {
      const allowed = (field.options || []).map((opt) => opt.value);
      if (allowed.length > 0 && !allowed.includes(value)) {
        fieldErrors[field.id] = 'Opção inválida.';
      }
    }

    if (field.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof value !== 'string' || !emailPattern.test(value)) {
        fieldErrors[field.id] = 'E-mail inválido.';
      }
    }

    if (field.type === 'number') {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        fieldErrors[field.id] = 'Número inválido.';
      }
      if (field.validation) {
        if (typeof field.validation.min === 'number' && numeric < field.validation.min) {
          fieldErrors[field.id] = 'Valor abaixo do mínimo.';
        }
        if (typeof field.validation.max === 'number' && numeric > field.validation.max) {
          fieldErrors[field.id] = 'Valor acima do máximo.';
        }
      }
    }

    if (field.validation) {
      const textValue = String(value);
      if (
        typeof field.validation.minLength === 'number' &&
        textValue.length < field.validation.minLength
      ) {
        fieldErrors[field.id] = 'Texto muito curto.';
      }
      if (
        typeof field.validation.maxLength === 'number' &&
        textValue.length > field.validation.maxLength
      ) {
        fieldErrors[field.id] = 'Texto muito longo.';
      }
      if (field.validation.pattern) {
        try {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(textValue)) {
            fieldErrors[field.id] = 'Formato inválido.';
          }
        } catch (e) {
          fieldErrors[field.id] = 'Pattern inválido.';
        }
      }
    }
  });

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
};

export const buildInitialValues = (schema, prefillData = {}) => {
  const values = {};
  if (!schema || !Array.isArray(schema.steps)) {
    return values;
  }

  schema.steps.forEach((step) => {
    (step.fields || []).forEach((field) => {
      let value = prefillData[field.id];
      if (value === undefined && field.role) {
        value = prefillData[field.role];
      }
      if (value === undefined || value === null) {
        if (field.type === 'checkbox') {
          value = typeof field.defaultValue === 'boolean' ? field.defaultValue : false;
        } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
          value = field.defaultValue;
        } else {
          value = '';
        }
      }
      values[field.id] = value;
    });
  });

  return values;
};
