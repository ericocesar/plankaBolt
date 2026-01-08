const Errors = {
  FORM_NOT_FOUND: {
    notFound: 'Formulário não encontrado',
  },
  FORM_WITHOUT_SCHEMA: {
    invalidSchema: {
      message: 'Formulário sem schema para publicar.',
    },
  },
  INVALID_SCHEMA: {
    invalidSchema: {
      message: 'Schema inválido.',
    },
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    notFound: {
      responseType: 'notFound',
    },
    invalidSchema: {
      responseType: 'badRequest',
    },
  },

  async fn(inputs) {
    const form = await Form.findOne({ id: inputs.id });

    if (!form) {
      throw Errors.FORM_NOT_FOUND;
    }

    if (!form.draftSchema) {
      throw Errors.FORM_WITHOUT_SCHEMA;
    }

    const validation = await sails.helpers.forms.validateSchema.with({
      schema: form.draftSchema,
    });

    if (!validation.isValid) {
      throw {
        invalidSchema: {
          ...Errors.INVALID_SCHEMA.invalidSchema,
          details: validation.errors,
        },
      };
    }

    const latestVersion = await FormSchemaVersion.find({
      formId: form.id,
    })
      .sort('version DESC')
      .limit(1);

    const nextVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

    const schemaVersion = await FormSchemaVersion.create({
      formId: form.id,
      version: nextVersion,
      schema: form.draftSchema,
      publishedAt: new Date().toISOString(),
    }).fetch();

    const updatedForm = await Form.updateOne({ id: form.id }).set({
      publishedSchemaVersionId: schemaVersion.id,
    });

    return {
      item: {
        ...updatedForm,
        publishedSchema: schemaVersion.schema,
        publishedSchemaVersion: schemaVersion.version,
      },
    };
  },
};
