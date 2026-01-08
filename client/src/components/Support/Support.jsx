import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Form, Message, Header, Button, Container, Icon, Popup } from 'semantic-ui-react';
import classNames from 'classnames';
import api from '../../api/forms';
import styles from './Support.module.scss';
import StackedCardsUpload from './StackedCardsUpload';
import DynamicFormFields from '../forms/DynamicFormFields';
import { buildInitialValues, normalizeSchema, validateSubmission } from '../../utils/formSchema';

const PRIORITIES = ['Baixa', 'Média', 'Alta'];
const LEGACY_FIELD_LABELS = {
  name: 'Nome Completo',
  email: 'E-mail',
  phone: 'Telefone',
  company: 'Empresa',
  category: 'Categoria',
  priority: 'Prioridade',
  subject: 'Assunto',
  description: 'Descrição',
  consent: 'Concordo com o processamento dos meus dados pessoais.',
};

const LEGACY_STEPS = [
  {
    id: 1,
    label: 'Contato',
    title: 'Seus Dados de Contato',
    fields: ['name', 'email', 'phone', 'company'],
    tip: {
      title: 'Por que precisamos desses dados?',
      text: 'Essas informações são essenciais para que possamos entrar em contato com você sobre o andamento do seu chamado.',
    },
  },
  {
    id: 2,
    label: 'Classificação',
    title: 'Classifique o Problema',
    fields: ['category', 'priority'],
    tip: {
      title: 'Ajude-nos a priorizar',
      text: 'A classificação correta ajuda nossa equipe técnica a identificar a urgência e direcionar para o especialista certo.',
    },
  },
  {
    id: 3,
    label: 'Detalhes',
    title: 'Descreva o Ocorrido',
    fields: ['subject', 'description', 'files', 'consent'],
    tip: {
      title: 'Seja específico',
      text: 'Quanto mais detalhes você fornecer, mais rápido poderemos diagnosticar e resolver o problema.',
    },
  },
];

function StepIllustration({ step }) {
  const commonProps = {
    viewBox: '0 0 400 300',
    xmlns: 'http://www.w3.org/2000/svg',
    style: { maxWidth: '100%', height: 'auto', maxHeight: '300px' },
  };

  switch (step) {
    case 1: // Contato
      return (
        <svg viewBox={commonProps.viewBox} xmlns={commonProps.xmlns} style={commonProps.style}>
          <circle cx="200" cy="150" r="140" fill="#ecfdf5" />
          <circle cx="200" cy="110" r="40" fill="#10b981" />
          <path d="M120 230 C 120 180, 280 180, 280 230" fill="#34d399" />
          <rect x="100" y="250" width="200" height="15" rx="7.5" fill="#a7f3d0" />
          <rect x="130" y="275" width="140" height="10" rx="5" fill="#d1fae5" />
        </svg>
      );
    case 2: // Classificação
      return (
        <svg viewBox={commonProps.viewBox} xmlns={commonProps.xmlns} style={commonProps.style}>
          <circle cx="200" cy="150" r="140" fill="#ecfdf5" />
          <rect x="120" y="80" width="160" height="40" rx="8" fill="#10b981" />
          <rect x="120" y="140" width="160" height="40" rx="8" fill="#34d399" />
          <rect x="120" y="200" width="160" height="40" rx="8" fill="#6ee7b7" />
          <circle cx="260" cy="100" r="10" fill="#ffffff" opacity="0.5" />
          <circle cx="260" cy="160" r="10" fill="#ffffff" opacity="0.5" />
          <circle cx="260" cy="220" r="10" fill="#ffffff" opacity="0.5" />
        </svg>
      );
    case 3: // Detalhes
      return (
        <svg viewBox={commonProps.viewBox} xmlns={commonProps.xmlns} style={commonProps.style}>
          <circle cx="200" cy="150" r="140" fill="#ecfdf5" />
          <rect
            x="100"
            y="60"
            width="200"
            height="180"
            rx="10"
            fill="#ffffff"
            stroke="#10b981"
            strokeWidth="2"
          />
          <line
            x1="120"
            y1="90"
            x2="280"
            y2="90"
            stroke="#34d399"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="120"
            x2="280"
            y2="120"
            stroke="#d1fae5"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <line
            x1="120"
            y1="150"
            x2="250"
            y2="150"
            stroke="#d1fae5"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M150 200 L170 220 L220 170"
            stroke="#10b981"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

StepIllustration.propTypes = {
  step: PropTypes.number.isRequired,
};

function Support({ isEmbed = false, hideHeader = false, prefillData = {} }) {
  const { formId } = useParams();
  const containerRef = useRef(null);
  const [data, setData] = useState({
    name: prefillData.name || '',
    email: prefillData.email || '',
    phone: prefillData.phone || '',
    company: prefillData.company || '',
    category: prefillData.category || '',
    priority: prefillData.priority || '',
    subject: prefillData.subject || '',
    description: prefillData.description || '',
    consent: false,
  });
  const [schema, setSchema] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConsentError, setShowConsentError] = useState(false);

  useEffect(() => {
    // Fetch form config (public)
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL || ''}/api/public-tickets/${formId}`,
        );
        if (response.ok) {
          const config = await response.json();
          setFormConfig(config);
          if (config.categoryMapping) {
            setCategories(Object.keys(config.categoryMapping));
          }
          if (config.schema) {
            setSchema(normalizeSchema(config.schema, config.name));
          } else {
            setSchema(null);
          }
        } else {
          setError('Formulário não encontrado ou inativo.');
        }
      } catch (e) {
        setError('Erro ao carregar configurações do formulário.');
      }
    };
    fetchConfig();
  }, [formId]);

  useEffect(() => {
    if (schema) {
      setData(buildInitialValues(schema, prefillData));
      setFieldErrors({});
      setCurrentStep(1);
    }
  }, [schema, prefillData]);

  useEffect(() => {
    if (isEmbed && containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const height = entry.contentRect.height + 50; // Add some buffer
          window.parent.postMessage({ type: 'planka-embed-resize', height }, '*');
        });
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }

    return undefined;
  }, [isEmbed, currentStep, success, error]);

  const handleChange = (e, { name, value, checked }) => {
    setData((prev) => ({ ...prev, [name]: value !== undefined ? value : checked }));
    if (name) {
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
  };

  const isDynamic = Boolean(schema);
  const steps = isDynamic ? schema.steps : LEGACY_STEPS;
  const successTitle =
    isDynamic && schema?.settings?.successTitle ? schema.settings.successTitle : 'Ticket Enviado!';
  const successMessage =
    isDynamic && schema?.settings?.successMessage
      ? schema.settings.successMessage
      : 'Seu número de protocolo é:';
  const submitLabel =
    isDynamic && schema?.settings?.submitLabel ? schema.settings.submitLabel : 'Enviar Ticket';

  const getStepValidation = () => {
    const currentStepData = steps[currentStep - 1];
    if (!currentStepData) {
      return { isValid: false, fieldErrors: {} };
    }

    if (!isDynamic) {
      const currentFields = currentStepData.fields;
      const isValid = currentFields.every((field) => {
        if (field === 'files') return true;
        if (field === 'consent') return data.consent;
        if (field === 'category' && categories.length === 0) return true;
        if (!data[field] && field !== 'company' && field !== 'phone') {
          return false;
        }
        return true;
      });
      return { isValid, fieldErrors: {} };
    }

    const stepSchema = {
      steps: [currentStepData],
      settings: schema.settings,
    };
    return validateSubmission(stepSchema, data, files.length);
  };

  const runStepValidation = () => {
    const validation = getStepValidation();
    if (!validation.isValid) {
      setFieldErrors((prev) => ({ ...prev, ...validation.fieldErrors }));
    }
    return validation.isValid;
  };

  const handleNext = () => {
    if (runStepValidation()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    } else {
      // Could show a toast or highlight fields
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getMinLengthHint = (step) => {
    if (!step || !Array.isArray(step.fields)) {
      return null;
    }

    const deficits = step.fields
      .filter(
        (field) =>
          field.validation &&
          typeof field.validation.minLength === 'number' &&
          field.validation.minLength > 0,
      )
      .map((field) => {
        const value = data[field.id];
        const { length } = String(value || '');
        const missing = field.validation.minLength - length;
        if (missing > 0) {
          return {
            label: field.label,
            missing,
          };
        }
        return null;
      })
      .filter(Boolean);

    if (deficits.length === 0) {
      return null;
    }

    const first = deficits[0];
    const suffix = deficits.length > 1 ? ' (e outros campos)' : '';
    const plural = first.missing > 1 ? 'caracteres' : 'caractere';
    return `Adicione mais ${first.missing} ${plural} em "${first.label}".${suffix}`;
  };

  const handleSubmit = async () => {
    if (isDynamic && schema) {
      const validation = validateSubmission(schema, data, files.length);
      if (!validation.isValid) {
        setFieldErrors(validation.fieldErrors);
        setError('Verifique os campos obrigatórios antes de enviar.');
        return;
      }
    } else {
      if (!data.consent) {
        setError('Você deve concordar com a política de processamento de dados.');
        setShowConsentError(true);
        return;
      }

      if (!validateEmail(data.email)) {
        setError('Por favor, insira um endereço de e-mail válido (ex: nome@exemplo.com).');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let payload;

      if (isDynamic && schema) {
        payload = {
          values: data,
        };

        if (files.length > 0) {
          payload.files = files;
        }
      } else {
        const cleanData = { ...data, formId }; // Ensure formId is in payload
        // Remove fields not expected by the backend
        delete cleanData.consent;

        // Remove empty optional strings
        if (!cleanData.company) delete cleanData.company;
        if (!cleanData.phone) delete cleanData.phone;
        if (!cleanData.category) delete cleanData.category;
        if (!cleanData.priority) delete cleanData.priority;

        payload = { ...cleanData };
        if (files.length > 0) {
          payload.files = files;
        }
      }

      const response = await api.createPublicTicket(formId, payload);
      setSuccess(response);
    } catch (err) {
      setError(err.message || 'Falha ao enviar o ticket. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;
  const stepValidation = getStepValidation();
  const isStepValid = stepValidation.isValid;
  const displayFieldErrors =
    isDynamic && !isStepValid ? { ...fieldErrors, ...stepValidation.fieldErrors } : fieldErrors;
  const submitHint = isDynamic && !isStepValid ? getMinLengthHint(currentStepData) : null;
  const submitDisabledHint = (() => {
    if (!isLastStep || isStepValid || loading) {
      return null;
    }

    if (isDynamic) {
      if (submitHint) return submitHint;
      const errors = stepValidation.fieldErrors || {};
      const firstFieldId = Object.keys(errors)[0];
      if (!firstFieldId) return 'Verifique os campos obrigatórios.';
      const field = (currentStepData.fields || []).find((item) => item.id === firstFieldId);
      const message = errors[firstFieldId];
      if (field) {
        if (field.type === 'checkbox') {
          return `Marque "${field.label}".`;
        }
        if (message === 'Campo obrigatório.') {
          return `Preencha "${field.label}".`;
        }
        return `${field.label}: ${message}`;
      }
      return 'Verifique os campos obrigatórios.';
    }

    if (currentStepData.fields.includes('consent') && data.consent !== true) {
      return 'Marque o aceite de processamento de dados.';
    }
    if (currentStepData.fields.includes('category') && categories.length === 0) {
      return 'Selecione uma categoria antes de enviar.';
    }

    const missingField = currentStepData.fields.find(
      (field) => !['files', 'consent', 'company', 'phone'].includes(field) && !data[field],
    );
    if (missingField) {
      return `Preencha "${LEGACY_FIELD_LABELS[missingField] || missingField}".`;
    }

    return 'Verifique os campos obrigatórios.';
  })();

  const renderStepContent = () => {
    if (isDynamic && schema) {
      const step = steps[currentStep - 1];
      if (!step) return null;

      return (
        <DynamicFormFields
          step={step}
          values={data}
          errors={displayFieldErrors}
          onChange={(fieldId, value) => handleChange(null, { name: fieldId, value })}
          categories={categories}
          files={files}
          onFilesChange={handleFilesChange}
          readOnly={loading}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <>
            <Form.Group widths="equal">
              <Form.Input
                label="Nome Completo"
                className={styles.input}
                name="name"
                value={data.name}
                onChange={handleChange}
                required
                placeholder="Seu nome"
              />
              <Form.Input
                label="E-mail"
                className={styles.input}
                name="email"
                type="email"
                value={data.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
              />
            </Form.Group>
            <Form.Group widths="equal">
              <Form.Input
                label="Telefone / WhatsApp"
                className={styles.input}
                name="phone"
                value={data.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
              <Form.Input
                label="Empresa"
                className={styles.input}
                name="company"
                value={data.company}
                onChange={handleChange}
                placeholder="Nome da sua empresa"
              />
            </Form.Group>
          </>
        );
      case 2:
        return (
          <Form.Group widths="equal">
            <Form.Select
              label="Categoria"
              className={styles.select}
              name="category"
              options={categories.map((c) => ({ key: c, text: c, value: c }))}
              value={data.category}
              onChange={handleChange}
              required
              placeholder="Selecione..."
              disabled={categories.length === 0}
            />
            <Form.Select
              label="Prioridade"
              className={styles.select}
              name="priority"
              options={PRIORITIES.map((p) => {
                let color = 'green';
                if (p === 'Alta') color = 'red';
                else if (p === 'Média') color = 'yellow';

                return {
                  key: p,
                  text: p,
                  value: p,
                  label: {
                    color,
                    empty: true,
                    circular: true,
                  },
                };
              })}
              value={data.priority}
              onChange={handleChange}
              required
              placeholder="Selecione..."
            />
          </Form.Group>
        );
      case 3:
        return (
          <div className={styles.detailsGrid}>
            <div className={styles.leftColumn}>
              <Form.Input
                label="Assunto"
                className={styles.input}
                name="subject"
                value={data.subject}
                onChange={handleChange}
                required
                placeholder="Resumo do problema"
              />
              <Form.TextArea
                label="Descrição Detalhada"
                className={styles.textArea}
                name="description"
                value={data.description}
                onChange={handleChange}
                required
                placeholder="Descreva o que aconteceu, passos para reproduzir, etc."
                style={{ flex: 1, minHeight: 200 }}
              />
              <Form.Checkbox
                label="Concordo com o processamento dos meus dados pessoais para fins de suporte."
                name="consent"
                checked={data.consent}
                onChange={(e, { checked }) => {
                  handleChange(e, { name: 'consent', checked });
                  if (checked) setShowConsentError(false);
                }}
                required
                className={classNames(styles.checkbox, {
                  [styles.checkboxError]: showConsentError,
                })}
                style={{ marginTop: 'auto' }}
              />
            </div>

            <div className={styles.rightColumn}>
              <div className={styles.attachmentsWrapper}>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className={styles.label}>Anexos (Opcional)</label>
                <StackedCardsUpload files={files} onFilesChange={handleFilesChange} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container className={isEmbed ? styles.embedContainer : styles.container}>
        <div ref={containerRef}>
          <div className={styles.formCard}>
            <div className={styles.successMessage}>
              <Icon name="check circle outline" className={styles.successIcon} />
              <Header as="h2" className={styles.successTitle}>
                {successTitle}
              </Header>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '1.5rem' }}>
                {successMessage}
              </p>
              <p style={{ marginBottom: '2rem' }}>
                <strong className={styles.protocol}>{success.protocol}</strong>
              </p>
              <Button
                className={classNames(styles.navButton, styles.nextButton)}
                onClick={() => window.location.reload()}
              >
                Enviar Outro
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error && !formConfig) {
    return (
      <Container className={isEmbed ? styles.embedContainer : styles.container}>
        <div ref={containerRef}>
          <Message error content={error} />
        </div>
      </Container>
    );
  }

  const submitButton = (
    <Button
      className={classNames(styles.navButton, styles.nextButton)}
      onClick={handleSubmit}
      disabled={!isStepValid || loading}
      loading={loading}
    >
      {submitLabel}
    </Button>
  );
  let primaryAction = (
    <Button
      className={classNames(styles.navButton, styles.nextButton)}
      onClick={handleNext}
      disabled={!isStepValid}
    >
      Próximo
    </Button>
  );

  if (isLastStep) {
    primaryAction = submitDisabledHint ? (
      <Popup
        content={submitDisabledHint}
        position="top right"
        inverted
        trigger={<span style={{ display: 'inline-block' }}>{submitButton}</span>}
      />
    ) : (
      submitButton
    );
  }

  return (
    <Container className={isEmbed ? styles.embedContainer : styles.container}>
      <div ref={containerRef}>
        {!hideHeader && !isEmbed && (
          <>
            <Header as="h1" className={styles.title}>
              {formConfig ? formConfig.name : 'Suporte'}
            </Header>
            <p className={styles.subtitle}>
              Preencha as informações abaixo para abrir seu chamado.
            </p>
          </>
        )}

        {/* Stepper */}
        <div className={styles.stepperContainer}>
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            return (
              <div key={step.id || stepNumber} className={styles.stepWrapper}>
                <div
                  className={classNames(styles.stepCircle, {
                    [styles.active]: stepNumber === currentStep,
                    [styles.completed]: stepNumber < currentStep,
                  })}
                >
                  {stepNumber < currentStep ? <Icon name="check" /> : stepNumber}
                </div>
                <span
                  className={classNames(styles.stepLabel, {
                    [styles.active]: stepNumber === currentStep,
                  })}
                >
                  {step.label || step.title || `Step ${stepNumber}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className={isEmbed || isDynamic ? styles.embedWrapper : styles.mainWrapper}>
          <div className={styles.formCard}>
            {error && <Message error content={error} style={{ margin: '1rem' }} />}

            <div className={styles.formContent}>
              <Header as="h3" className={styles.sectionTitle}>
                {currentStepData.title}
              </Header>

              <Form loading={loading} size="large">
                {renderStepContent()}
              </Form>
            </div>

            {/* Navigation Actions */}
            <div className={styles.formActions}>
              <Button
                className={classNames(styles.navButton, styles.prevButton)}
                onClick={handlePrev}
                disabled={isFirstStep || loading}
              >
                Voltar
              </Button>
              {primaryAction}
            </div>
          </div>

          {!isEmbed && !isDynamic && (
            <div className={styles.illustrationColumn}>
              <StepIllustration step={currentStep} />
              {/* Tips Section */}
              {currentStepData.tip && (
                <div className={styles.tipsContainer}>
                  <Icon name="lightbulb outline" className={styles.tipsIcon} />
                  <div className={styles.tipsContent}>
                    <h4>{currentStepData.tip.title}</h4>
                    <p>{currentStepData.tip.text}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

Support.propTypes = {
  isEmbed: PropTypes.bool,
  hideHeader: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  prefillData: PropTypes.object,
};

Support.defaultProps = {
  isEmbed: false,
  hideHeader: false,
  prefillData: {},
};

export default Support;
