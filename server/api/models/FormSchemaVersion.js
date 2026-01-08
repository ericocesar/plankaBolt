/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * FormSchemaVersion.js
 *
 * @description :: Stores published schema versions for public forms.
 */

module.exports = {
  tableName: 'form_schema_version',
  attributes: {
    formId: {
      model: 'Form',
      required: true,
      columnName: 'form_id',
    },
    version: {
      type: 'number',
      required: true,
    },
    schema: {
      type: 'json',
      required: true,
    },
    publishedAt: {
      type: 'ref',
      columnName: 'published_at',
    },
  },
};
