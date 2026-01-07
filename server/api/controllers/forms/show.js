module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const form = await Form.findOne({
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
