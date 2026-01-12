module.exports.up = async (knex) => {
  const hasDueDateType = await knex.schema.hasColumn('form', 'due_date_type');
  if (!hasDueDateType) {
    await knex.schema.alterTable('form', (table) => {
      table.string('due_date_type').defaultTo('none');
    });
  }

  const hasDueDateQuantity = await knex.schema.hasColumn('form', 'due_date_quantity');
  if (!hasDueDateQuantity) {
    await knex.schema.alterTable('form', (table) => {
      table.float('due_date_quantity');
    });
  }

  const hasDueDateUnit = await knex.schema.hasColumn('form', 'due_date_unit');
  if (!hasDueDateUnit) {
    await knex.schema.alterTable('form', (table) => {
      table.string('due_date_unit');
    });
  }

  const hasDueDateFixed = await knex.schema.hasColumn('form', 'due_date_fixed');
  if (!hasDueDateFixed) {
    await knex.schema.alterTable('form', (table) => {
      table.string('due_date_fixed');
    });
  }

  const hasCardType = await knex.schema.hasColumn('form', 'card_type');
  if (!hasCardType) {
    await knex.schema.alterTable('form', (table) => {
      table.string('card_type').defaultTo('project');
    });
  }
};

module.exports.down = async (knex) => {
  await knex.schema.alterTable('form', (table) => {
    table.dropColumn('due_date_type');
    table.dropColumn('due_date_quantity');
    table.dropColumn('due_date_unit');
    table.dropColumn('due_date_fixed');
    table.dropColumn('card_type');
  });
};
