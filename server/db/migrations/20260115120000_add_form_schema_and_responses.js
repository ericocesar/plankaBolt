module.exports.up = async (knex) => {
  await knex.schema.table('form', (table) => {
    table.jsonb('draft_schema');
    table.bigInteger('published_schema_version_id');
  });

  await knex.schema.createTable('form_schema_version', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('form_id').notNullable();
    table.integer('version').notNullable();
    table.jsonb('schema').notNullable();
    table.timestamp('published_at', true);

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    table.index('form_id');
    table.index(['form_id', 'version']);
  });

  await knex.schema.createTable('form_response', (table) => {
    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('form_id').notNullable();
    table.bigInteger('form_schema_version_id');
    table.jsonb('data').notNullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');

    table.timestamp('created_at', true);

    table.index('form_id');
    table.index('form_schema_version_id');
    table.index('created_at');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.dropTable('form_response');
  await knex.schema.dropTable('form_schema_version');

  await knex.schema.table('form', (table) => {
    table.dropColumn('draft_schema');
    table.dropColumn('published_schema_version_id');
  });
};
