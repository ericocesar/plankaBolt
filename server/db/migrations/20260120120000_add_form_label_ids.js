module.exports.up = async (knex) => {
  await knex.schema.alterTable('form', (table) => {
    table.jsonb('label_ids').notNullable().defaultTo('[]');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.alterTable('form', (table) => {
    table.dropColumn('label_ids');
  });
};
