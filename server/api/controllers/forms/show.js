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

    let publishedSchemaVersion = null;
    if (form.publishedSchemaVersionId) {
      publishedSchemaVersion = await FormSchemaVersion.findOne({
        id: form.publishedSchemaVersionId,
      });
    }

    return {
      item: {
        ...form,
        publishedSchema: publishedSchemaVersion ? publishedSchemaVersion.schema : null,
        publishedSchemaVersion: publishedSchemaVersion ? publishedSchemaVersion.version : null,
      },
    };
  },
};
