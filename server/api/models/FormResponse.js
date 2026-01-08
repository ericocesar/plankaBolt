/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * FormResponse.js
 *
 * @description :: Stores submissions for published public forms.
 */

module.exports = {
  tableName: 'form_response',
  attributes: {
    formId: {
      model: 'Form',
      required: true,
      columnName: 'form_id',
    },
    formSchemaVersionId: {
      model: 'FormSchemaVersion',
      columnName: 'form_schema_version_id',
    },
    data: {
      type: 'json',
      required: true,
    },
    metadata: {
      type: 'json',
      defaultsTo: {},
      columnName: 'metadata',
    },
  },
};
