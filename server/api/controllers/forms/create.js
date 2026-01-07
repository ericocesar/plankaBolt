module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    projectId: {
      type: 'string',
      required: true,
    },
    boardId: {
      type: 'string',
      required: true,
    },
    listId: {
      type: 'string',
      required: true,
    },
    assigneeIds: {
      type: 'json',
    },
    categoryMapping: {
      type: 'json',
    },
    isActive: {
      type: 'boolean',
    },
  },

  async fn(inputs) {
    const form = await Form.create(inputs).fetch();

    return {
      item: form,
    };
  },
};
