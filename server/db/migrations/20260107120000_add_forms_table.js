module.exports.up = async (knex) => {
  await knex.schema.createTable('form', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('project_id').notNullable();
    table.bigInteger('board_id').notNullable();
    table.bigInteger('list_id').notNullable();

    table.text('name').notNullable();
    table.jsonb('assignee_ids').notNullable().defaultTo('[]');
    table.jsonb('category_mapping').notNullable().defaultTo('{}');
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.index('project_id');
    table.index('board_id');
    table.index('list_id');
  });
};

module.exports.down = (knex) => knex.schema.dropTable('form');
