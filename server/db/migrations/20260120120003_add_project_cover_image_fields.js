exports.up = async (knex) => {
  await knex.schema.table('project', (table) => {
    table.text('cover_image_url');
    table.text('cover_image_thumbnail_url');
    table.text('cover_image_uploaded_file_id').nullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.table('project', (table) => {
    table.dropColumn('cover_image_url');
    table.dropColumn('cover_image_thumbnail_url');
    table.dropColumn('cover_image_uploaded_file_id');
  });
};
