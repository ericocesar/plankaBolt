import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Form, Message, Header, Button, Container, Icon } from 'semantic-ui-react';
import classNames from 'classnames';
import api from '../../api/forms';
import styles from './Support.module.scss';
import StackedCardsUpload from './StackedCardsUpload';

const PRIORITIES = ['Baixa', 'Média', 'Alta'];

const STEPS = [
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

function Support() {
  const { formId } = useParams();
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: '',
    priority: '',
    subject: '',
    description: '',
    consent: false,
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);

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
        } else {
          setError('Formulário não encontrado ou inativo.');
        }
      } catch (e) {
        setError('Erro ao carregar configurações do formulário.');
      }
    };
    fetchConfig();
  }, [formId]);

  const handleChange = (e, { name, value, checked }) => {
    setData((prev) => ({ ...prev, [name]: value !== undefined ? value : checked }));
  };

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
  };

  const validateStep = () => {
    const currentFields = STEPS[currentStep - 1].fields;
    return currentFields.every((field) => {
      if (field === 'files') return true;
      if (field === 'consent') return data.consent;
      if (field === 'category' && categories.length === 0) return true;
      if (!data[field] && field !== 'company' && field !== 'phone') {
        return false;
      }
      return true;
    });
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      // Could show a toast or highlight fields
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!data.consent) {
      setError('Você deve concordar com a política de processamento de dados.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanData = { ...data, formId }; // Ensure formId is in payload
      // Remove fields not expected by the backend
      delete cleanData.consent;

      // Remove empty optional strings
      if (!cleanData.company) delete cleanData.company;
      if (!cleanData.phone) delete cleanData.phone;
      if (!cleanData.category) delete cleanData.category;
      if (!cleanData.priority) delete cleanData.priority;

      const payload = { ...cleanData };
      if (files.length > 0) {
        payload.files = files;
      }

      const response = await api.createPublicTicket(formId, payload);
      setSuccess(response);
    } catch (err) {
      console.error(err); // Log error to console
      setError(err.message || 'Falha ao enviar o ticket. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
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
          <>
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
              style={{ minHeight: 200 }}
            />
            <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className={styles.label}>Anexos (Opcional)</label>
              <StackedCardsUpload files={files} onFilesChange={handleFilesChange} />
            </div>
            <Form.Checkbox
              label="Concordo com o processamento dos meus dados pessoais para fins de suporte."
              name="consent"
              checked={data.consent}
              onChange={handleChange}
              required
              className={styles.checkbox}
            />
          </>
        );
      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container className={styles.container}>
        <div className={styles.formCard}>
          <div className={styles.successMessage}>
            <Icon name="check circle outline" className={styles.successIcon} />
            <Header as="h2" className={styles.successTitle}>
              Ticket Enviado!
            </Header>
            <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '1.5rem' }}>
              Seu número de protocolo é:
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
      </Container>
    );
  }

  if (error && !formConfig) {
    return (
      <Container className={styles.container}>
        <Message error content={error} />
      </Container>
    );
  }

  const currentStepData = STEPS[currentStep - 1];
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === STEPS.length;
  const isStepValid = validateStep();

  return (
    <Container className={styles.container}>
      <Header as="h1" className={styles.title}>
        {formConfig ? formConfig.name : 'Suporte'}
      </Header>
      <p className={styles.subtitle}>Preencha as informações abaixo para abrir seu chamado.</p>

      {/* Stepper */}
      <div className={styles.stepperContainer}>
        {STEPS.map((step) => (
          <div key={step.id} className={styles.stepWrapper}>
            <div
              className={classNames(styles.stepCircle, {
                [styles.active]: step.id === currentStep,
                [styles.completed]: step.id < currentStep,
              })}
            >
              {step.id < currentStep ? <Icon name="check" /> : step.id}
            </div>
            <span
              className={classNames(styles.stepLabel, {
                [styles.active]: step.id === currentStep,
              })}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.mainWrapper}>
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

            {isLastStep ? (
              <Button
                className={classNames(styles.navButton, styles.nextButton)}
                onClick={handleSubmit}
                disabled={!isStepValid || loading}
                loading={loading}
              >
                Enviar Ticket
              </Button>
            ) : (
              <Button
                className={classNames(styles.navButton, styles.nextButton)}
                onClick={handleNext}
                disabled={!isStepValid}
              >
                Próximo
              </Button>
            )}
          </div>
        </div>

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
      </div>
    </Container>
  );
}

export default Support;
