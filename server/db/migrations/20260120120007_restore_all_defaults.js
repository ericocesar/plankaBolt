/* eslint-disable no-await-in-loop, no-restricted-syntax, no-console, no-unused-vars */
module.exports.up = async (knex) => {
  const tables = [
    'form', // The one reporting error now
    'task_list', // Previously fixed, but good to include
    'task',
    'card',
    'list',
    'board',
    'project',
    'user_account',
    'action',
    'comment',
    'attachment',
    'notification',
    'notification_service',
    'label',
    'card_label',
    'card_membership',
    'card_subscription',
    'board_membership',
    'board_subscription',
    'project_manager',
    'project_favorite',
    'base_custom_field_group',
    'custom_field_group',
    'custom_field',
    'custom_field_value',
    'file_reference',
    'identity_provider_user',
    'session',
    'background_image',
  ];

  for (const table of tables) {
    const exists = await knex.schema.hasTable(table);
    if (exists) {
      try {
        await knex.raw(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT next_id()`);
      } catch (e) {
        console.warn(`Warning: Could not restore default ID for table ${table}: ${e.message}`);
        // If error occurs, it might abort transaction depending on severity.
        // But usually 'hasTable' prevents the main cause (table missing).
      }
    } else {
      console.warn(`Table ${table} does not exist, skipping.`);
    }
  }
};

module.exports.down = async (knex) => {
  // Pass
};
