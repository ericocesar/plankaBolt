/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * Form.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    isActive: {
      type: 'boolean',
      defaultsTo: true,
      columnName: 'is_active',
    },
    projectId: {
      model: 'Project',
      required: true,
      columnName: 'project_id',
    },
    boardId: {
      model: 'Board',
      required: true,
      columnName: 'board_id',
    },
    listId: {
      model: 'List',
      required: true,
      columnName: 'list_id',
    },
    assigneeIds: {
      type: 'json',
      defaultsTo: [],
      columnName: 'assignee_ids',
    },
    categoryMapping: {
      type: 'json',
      defaultsTo: {}, // { "Category Name": "labelId" }
      columnName: 'category_mapping',
    },
  },
};
