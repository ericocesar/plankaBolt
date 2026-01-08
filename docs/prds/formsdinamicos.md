Contexto:
Os formulários públicos para coleta de dados estao sendo criados em administração/formulários, porém hoje os campos estão engessados (voltados para o form de suporte).

Quero implementar um “Form Builder” com campos personalizados via drag & drop.

Stack:
- Backend: Node.js (Sails), Postgres (Knex), REST/Swagger, sockets.
- Frontend: React 18 + Vite, Redux, já uso react-beautiful-dnd, Gravity UI e Semantic UI.

Objetivo:
Definir o caminho mais recomendado para implementar um construtor de formulários (drag & drop), com:
- Paleta de campos (input, textarea, select, radio, checkbox, date, file, etc.)
- Canvas para montar o formulário (ordem, seções/steps, colunas/linhas opcional)
- Painel de propriedades por campo (label, placeholder, required, validação, máscara, opções, help text)
- Preview do formulário
- Publicação do formulário e coleta de respostas
- Validação no frontend e no backend com base no schema
- Versionamento do schema do formulário e migração segura entre versões

Opções técnicas (avaliar e escolher uma):
A) DIY controlado: dnd-kit + craft.js + react-hook-form + zod/ajv
B) Schema-driven: dnd-kit + rjsf (react-jsonschema-form) + ajv
C) Pronto/rápido: SurveyJS Creator (ou Form.io)

Sua tarefa:
1) Analise o contexto/stack e escolha UMA opção como recomendação principal (A, B ou C).
2) Justifique a decisão com critérios objetivos:
   - tempo de implementação (MVP vs completo)
   - esforço de manutenção
   - flexibilidade para UX “com a cara do produto”
   - compatibilidade com libs atuais (React 18, Vite, Redux, Gravity UI, dnd atual)
   - performance e escalabilidade
   - riscos (lock-in, licenciamento, complexidade)
3) Gere um PLANO DETALHADO para executar a opção escolhida, incluindo:
   - Arquitetura (componentes do builder, renderer, armazenamento do schema, APIs)
   - Modelo de dados do “Form Schema” (JSON): exemplo completo com steps/seções e campos
   - Estratégia de validação (frontend + backend): como garantir que submissões batem com o schema salvo
   - UX do builder: fluxo do usuário, telas, estados, regras de DnD, constraints (ex: não dropar dentro de si)
   - Persistência/Versionamento: como salvar, versionar, publicar e manter submissões antigas válidas
   - Migrations no Postgres (tabelas sugeridas e índices)
   - Endpoints necessários (CRUD form, publish/unpublish, submit response, list responses)
   - Segurança: rate-limit, antifraude/recaptcha opcional, CORS, sanitização, proteção contra schema malicioso
   - Observabilidade: logs, métricas e auditoria de alterações no schema
   - Estratégia de testes: unit, integração e E2E (casos críticos e edge cases)
   - Entregáveis por fase: MVP (2-3 sprints) e evolução (condicionais, lógica, uploads, integrações)
4) Ao final, liste um backlog priorizado (P0/P1/P2) com estimativa de complexidade (S/M/L) e dependências.

Formato de saída:
- Comece com a recomendação (A/B/C) e o porquê.
- Depois, o plano em etapas numeradas.
- Seja específico (nomes de módulos/pastas sugeridas, contratos de API, exemplos de schema).
- Não pergunte nada; assuma decisões razoáveis quando faltar detalhe.
