import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Header,
  Form,
  Grid,
  Segment,
  Button,
  TextArea,
  Icon,
  Message,
} from 'semantic-ui-react';
import styles from './Support.module.scss'; // Reuse styles or create new ones

function EmbedCode() {
  const { formId } = useParams();
  const [options, setOptions] = useState({
    width: '100%',
    height: '600px',
    hideHeader: false,
    theme: 'light',
    autoResize: true,
  });
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Get the base URL of the current window (or configured env)
    setBaseUrl(window.location.origin);
  }, []);

  const handleChange = (e, { name, value, checked }) => {
    setOptions((prev) => ({
      ...prev,
      [name]: value !== undefined ? value : checked,
    }));
  };

  const generateSrc = () => {
    const params = new URLSearchParams();
    if (options.hideHeader) params.append('hideHeader', '1');
    if (options.theme !== 'light') params.append('theme', options.theme);
    // autoResize logic is client-side in the parent, but we might pass a param if needed.
    // Currently Support component sends postMessage regardless of param if isEmbed is true.
    // But we can add it to URL for clarity or future use.
    if (options.autoResize) params.append('autoResize', '1');

    return `${baseUrl}/support/${formId}/embed?${params.toString()}`;
  };

  const generateCode = () => {
    const src = generateSrc();
    const style = `width:${options.width};height:${options.height};border:0;border-radius:16px;`;

    let script = '';
    if (options.autoResize) {
      script = `
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'planka-embed-resize') {
      var iframe = document.querySelector('iframe[src^="${baseUrl}/support/${formId}/embed"]');
      if (iframe) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>`;
    }

    return `<iframe src="${src}" 
        style="${style}" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade"></iframe>${script}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Container className={styles.container}>
      <Header as="h1" className={styles.title} style={{ color: '#1f2937' }}>
        Gerador de Embed
      </Header>
      <p className={styles.subtitle} style={{ color: '#4b5563' }}>
        Configure e copie o código abaixo para adicionar o formulário ao seu site.
      </p>

      <Grid stackable columns={2}>
        <Grid.Column width={6}>
          <Segment>
            <Header as="h3">Configurações</Header>
            <Form>
              <Form.Input
                label="Largura"
                name="width"
                value={options.width}
                onChange={handleChange}
                placeholder="100% ou 500px"
              />
              <Form.Input
                label="Altura Inicial"
                name="height"
                value={options.height}
                onChange={handleChange}
                placeholder="600px"
              />
              <Form.Group grouped>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label>Opções de Visualização</label>
                <Form.Checkbox
                  label="Esconder Cabeçalho"
                  name="hideHeader"
                  checked={options.hideHeader}
                  onChange={handleChange}
                />
                <Form.Checkbox
                  label="Redimensionamento Automático"
                  name="autoResize"
                  checked={options.autoResize}
                  onChange={handleChange}
                  toggle
                />
              </Form.Group>
              <Form.Select
                label="Tema"
                name="theme"
                options={[
                  { key: 'light', text: 'Claro', value: 'light' },
                  { key: 'dark', text: 'Escuro', value: 'dark' },
                ]}
                value={options.theme}
                onChange={handleChange}
              />
            </Form>
          </Segment>

          <Segment color="green">
            <Header as="h3">Código para Copiar</Header>
            <Form>
              <TextArea
                value={generateCode()}
                readOnly
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
            </Form>
            <Button
              primary
              icon
              labelPosition="left"
              onClick={copyToClipboard}
              style={{ marginTop: '1rem' }}
            >
              <Icon name={copied ? 'check' : 'copy'} />
              {copied ? 'Copiado!' : 'Copiar Código'}
            </Button>
          </Segment>
        </Grid.Column>

        <Grid.Column width={10}>
          <Header as="h3">Pré-visualização</Header>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              background: options.theme === 'dark' ? '#1f2937' : '#f9fafb',
              minHeight: '600px',
            }}
          >
            <iframe
              title="Preview"
              src={generateSrc()}
              style={{
                width: options.width,
                height: options.height,
                border: '0',
                borderRadius: '16px',
                background: 'transparent',
              }}
            />
          </div>
          {options.autoResize && (
            <Message
              info
              size="small"
              style={{ marginTop: '1rem' }}
              icon="info circle"
              content="O script de redimensionamento automático ajustará a altura do iframe conforme o conteúdo."
            />
          )}
        </Grid.Column>
      </Grid>
    </Container>
  );
}

export default EmbedCode;
