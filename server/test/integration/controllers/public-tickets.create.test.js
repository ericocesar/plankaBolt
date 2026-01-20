const request = require('supertest');
const { expect } = require('chai');

describe('public-tickets/create (controller)', () => {
  it('should render select value using option label in card description', async () => {
    const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const project = await Project.create({ id: `1000${suffix}`, name: 'Test Project' }).fetch();
    const board = await Board.create({
      id: `2000${suffix}`,
      projectId: project.id,
      position: 65536,
      name: 'Test Board',
    }).fetch();
    const list = await List.create({
      id: `3000${suffix}`,
      boardId: board.id,
      type: 'active',
      position: 65536,
      name: 'Test List',
    }).fetch();

    const schema = {
      version: 1,
      title: 'Formulário Teste',
      steps: [
        {
          id: 'step-1',
          title: 'Etapa 1',
          columns: 1,
          fields: [
            {
              id: 'field-priority',
              type: 'select',
              label: 'PRIORIDADE',
              required: true,
              optionsSource: 'static',
              options: [
                { label: 'Normal', value: 'opcao_1' },
                { label: 'Alta', value: 'opcao_2' },
              ],
            },
          ],
        },
      ],
      settings: {},
    };

    const form = await Form.create({
      id: `4000${suffix}`,
      name: 'Form',
      isActive: true,
      projectId: project.id,
      boardId: board.id,
      listId: list.id,
      draftSchema: schema,
      cardType: 'project',
    }).fetch();

    await request(sails.hooks.http.app)
      .post(`/api/public-tickets/${form.id}`)
      .send({ values: { 'field-priority': 'opcao_1' } })
      .expect(200);

    const [card] = await Card.find({ listId: list.id }).sort('createdAt DESC').limit(1);

    expect(card).to.not.equal(undefined);
    expect(card.description).to.include('**PRIORIDADE:** Normal');
    expect(card.description).to.not.include('opcao_1');
  });
});
