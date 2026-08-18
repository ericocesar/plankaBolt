/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports.up = async (knex) => {
  const hasInternalConfig = await knex.schema.hasTable('internal_config');
  if (hasInternalConfig) {
    await knex('internal_config').update({
      active_users_limit: null,
    });
  }

  const hasUserAccount = await knex.schema.hasTable('user_account');
  if (hasUserAccount) {
    await knex('user_account').update({
      is_deactivated: false,
    });
  }
};

module.exports.down = async () => {};
