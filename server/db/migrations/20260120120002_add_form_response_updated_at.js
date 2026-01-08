module.exports.up = async (knex) => {
  await knex.schema.alterTable('form_response', (table) => {
    table.timestamp('updated_at', true);
  });
};

module.exports.down = async (knex) => {
  await knex.schema.alterTable('form_response', (table) => {
    table.dropColumn('updated_at');
  });
};
