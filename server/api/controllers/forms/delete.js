module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const form = await Form.destroyOne({
      id: inputs.id,
    });

    if (!form) {
      throw 'notFound';
    }

    return {
      item: form,
    };
  },
};
