module.exports = {
  async fn() {
    const forms = await Form.find().populate('publishedSchemaVersionId').sort('createdAt DESC');

    const items = forms.map((form) => {
      const published = form.publishedSchemaVersionId;
      let hasUnpublishedChanges = false;

      // If we have a draft schema...
      if (form.draftSchema) {
        if (!published) {
          // No published version exists, so it's all unpublished changes
          hasUnpublishedChanges = true;
        } else {
          // Compare draft with published
          // Using JSON.stringify for simple deep comparison (order matters, but usually consistently saved)
          const draftStr = JSON.stringify(form.draftSchema);
          const pubStr = JSON.stringify(published.schema);
          hasUnpublishedChanges = draftStr !== pubStr;
        }
      }

      return {
        ...form,
        publishedVersion: published ? published.version : null,
        publishedAt: published ? published.publishedAt : null,
        hasUnpublishedChanges,
      };
    });

    return {
      items,
    };
  },
};
