/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console, no-unused-vars */
module.exports.up = async (knex) => {
  const tables = [
    'task_list',
    'task',
    'card',
    'list',
    'board',
    'project',
    'attachment',
    'comment',
    'action',
    'notification',
  ];

  for (const table of tables) {
    try {
      // Check if table exists first to avoid error?
      // Knex raw will just throw if table doesn't exist.
      // We assume these tables exist as they are core.
      // We set the DEFAULT to next_id() which is the custom Snowflake generator.
      await knex.raw(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT next_id()`);
    } catch (e) {
      // Ignore if specifically table missing (unlikely) or other minor issue,
      // but warn so we know.
      console.warn(`Warning: Could not restore default ID for table ${table}: ${e.message}`);
    }
  }
};

module.exports.down = async (knex) => {
  // We do not want to remove the defaults in down,
  // as they are required for correct operation.
};
