/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console, no-unused-vars */
module.exports.up = async (knex) => {
  const tables = ['form_response', 'form_schema_version'];

  for (const table of tables) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      try {
        await knex.raw(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT next_id()`);
      } catch (e) {
        console.warn(`Warning: Could not restore default ID for table ${table}: ${e.message}`);
      }
    } else {
      console.warn(`Table ${table} does not exist, skipping.`);
    }
  }
};

module.exports.down = async (knex) => {
  // Pass
};
