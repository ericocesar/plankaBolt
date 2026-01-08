module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    limit: {
      type: 'number',
      defaultsTo: 50,
    },
    offset: {
      type: 'number',
      defaultsTo: 0,
    },
  },

  async fn(inputs) {
    const responses = await FormResponse.find({
      formId: inputs.id,
    })
      .sort('createdAt DESC')
      .limit(inputs.limit)
      .skip(inputs.offset);

    return {
      items: responses,
    };
  },
};
