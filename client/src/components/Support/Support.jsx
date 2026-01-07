import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Form, Message, Header, Button, Container, Icon } from 'semantic-ui-react';
import api from '../../api/forms';
import styles from './Support.module.scss';
import StackedCardsUpload from './StackedCardsUpload';

const PRIORITIES = ['Baixa', 'Média', 'Alta'];

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

  useEffect(() => {
    // Fetch form config (public)
    const fetchConfig = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:1337'}/api/public-tickets/${formId}`,
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

  const handleSubmit = async () => {
    if (!data.consent) {
      setError('Você deve concordar com a política de processamento de dados.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = { ...data, files }; // files is array of File objects
      const response = await api.createPublicTicket(formId, payload);
      setSuccess(response);
    } catch (err) {
      setError('Falha ao enviar o ticket. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container className={styles.container}>
        <div className={styles.successMessage}>
          <Header icon className={styles.successTitle}>
            <Icon name="check circle" color="green" />
            Ticket Enviado com Sucesso!
          </Header>
          <p style={{ fontSize: '1.1rem', color: '#4b5563' }}>Seu número de protocolo é:</p>
          <p>
            <strong className={styles.protocol}>{success.protocol}</strong>
          </p>
          <Button
            className={styles.submitButton}
            onClick={() => window.location.reload()}
            style={{ marginTop: '2rem' }}
          >
            Enviar Outro
          </Button>
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

  return (
    <Container className={styles.container}>
      <Header as="h1" className={styles.title}>
        {formConfig ? formConfig.name : 'Abrir um Chamado de Suporte'}
      </Header>

      <div className={styles.formCard}>
        {error && <Message error content={error} style={{ borderRadius: '8px' }} />}

        <Form loading={loading} onSubmit={handleSubmit} size="large">
          <Form.Group widths="equal">
            <Form.Input
              label="Nome"
              className={styles.input}
              name="name"
              value={data.name}
              onChange={handleChange}
              required
              placeholder="Nome Completo"
            />
            <Form.Input
              label="E-mail"
              className={styles.input}
              name="email"
              type="email"
              value={data.email}
              onChange={handleChange}
              required
              placeholder="contato@exemplo.com"
            />
            <Form.Input
              label="Telefone / WhatsApp"
              className={styles.input}
              name="phone"
              value={data.phone}
              onChange={handleChange}
              placeholder="+55 11 99999-9999"
            />
          </Form.Group>

          <Form.Group widths="equal">
            <Form.Input
              label="Empresa"
              className={styles.input}
              name="company"
              value={data.company}
              onChange={handleChange}
              placeholder="Nome da Empresa"
            />
            <Form.Select
              label="Categoria"
              className={styles.select}
              name="category"
              options={categories.map((c) => ({ key: c, text: c, value: c }))}
              value={data.category}
              onChange={handleChange}
              required
              placeholder="Selecione a Categoria"
              disabled={categories.length === 0}
            />
            <Form.Select
              label="Prioridade"
              className={styles.select}
              name="priority"
              options={PRIORITIES.map((p) => ({ key: p, text: p, value: p }))}
              value={data.priority}
              onChange={handleChange}
              required
              placeholder="Selecione a Prioridade"
            />
          </Form.Group>

          <Form.Input
            label="Assunto"
            className={styles.input}
            name="subject"
            value={data.subject}
            onChange={handleChange}
            required
            placeholder="Breve resumo do problema"
          />

          <Form.TextArea
            label="Descrição"
            className={styles.textArea}
            name="description"
            value={data.description}
            onChange={handleChange}
            required
            placeholder="Descreva detalhadamente o que está acontecendo..."
            style={{ minHeight: 150 }}
          />

          <div style={{ marginBottom: '1.5rem' }}>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
              Anexos (Máx 10MB)
            </label>
            <StackedCardsUpload files={files} onFilesChange={handleFilesChange} />
          </div>

          <Form.Checkbox
            label="Concordo com o processamento dos meus dados pessoais para fins de suporte."
            name="consent"
            checked={data.consent}
            onChange={handleChange}
            required
            style={{ marginTop: '1rem', marginBottom: '1.5rem' }}
          />

          <Button className={styles.submitButton} fluid size="large" type="submit">
            Enviar Ticket
          </Button>
        </Form>
      </div>
    </Container>
  );
}

export default Support;
