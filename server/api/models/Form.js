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
    labelIds: {
      type: 'json',
      defaultsTo: [],
      columnName: 'label_ids',
    },
    categoryMapping: {
      type: 'json',
      defaultsTo: {}, // { "Category Name": "labelId" }
      columnName: 'category_mapping',
    },
    draftSchema: {
      type: 'json',
      columnName: 'draft_schema',
    },
    publishedSchemaVersionId: {
      model: 'FormSchemaVersion',
      columnName: 'published_schema_version_id',
    },
    dueDateType: {
      type: 'string',
      isIn: ['none', 'relative', 'fixed'],
      defaultsTo: 'none',
      columnName: 'due_date_type',
    },
    dueDateQuantity: {
      type: 'number',
      allowNull: true,
      columnName: 'due_date_quantity',
    },
    dueDateUnit: {
      type: 'string',
      isIn: ['days', 'hours'],
      allowNull: true,
      columnName: 'due_date_unit',
    },
    dueDateFixed: {
      type: 'string', // ISO date string
      allowNull: true,
      columnName: 'due_date_fixed',
    },
    cardType: {
      type: 'string',
      isIn: ['card', 'project', 'history'], // 'card' is default generic if needed? User asked Project/History options. Let's include card as fallback or existing?
      defaultsTo: 'project',
      columnName: 'card_type',
    },
  },
};
