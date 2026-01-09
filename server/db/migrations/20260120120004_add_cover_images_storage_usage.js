exports.up = async (knex) => {
  await knex.schema.table('storage_usage', (table) => {
    table.bigInteger('cover_images').notNullable().defaultTo(0);
  });

  await knex('storage_usage').update({ cover_images: 0 });
};

exports.down = async (knex) => {
  await knex.schema.table('storage_usage', (table) => {
    table.dropColumn('cover_images');
  });
};
