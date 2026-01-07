module.exports = {
  inputs: {
    formId: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    const form = await Form.findOne({ id: inputs.formId });

    if (!form || !form.isActive) {
      throw 'notFound';
    }

    // We only expose necessary fields for the public form
    // For categories, if we are using the new system (auto-label), we should just return the keys of categoryMapping
    // OR, if we migrated, just return the list.
    // Assuming categoryMapping keys ARE the category names.
    return {
      name: form.name,
      isActive: form.isActive,
      categoryMapping: form.categoryMapping || {}, // { "Category Name": "ignored" } - we just need keys
    };
  },
};
