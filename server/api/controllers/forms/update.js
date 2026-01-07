module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
    },
    projectId: {
      type: 'string',
    },
    boardId: {
      type: 'string',
    },
    listId: {
      type: 'string',
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
    const { id, ...values } = inputs;

    const form = await Form.updateOne({
      id,
    }).set(values);

    if (!form) {
      throw 'notFound';
    }

    return {
      item: form,
    };
  },
};
