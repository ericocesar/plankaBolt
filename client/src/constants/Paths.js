/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import Config from './Config';

const ROOT = `${Config.BASE_PATH}/`;
const LOGIN = `${Config.BASE_PATH}/login`;
const OIDC_CALLBACK = `${Config.BASE_PATH}/oidc-callback`;
const RESET_PASSWORD = `${Config.BASE_PATH}/reset-password`;
const PROJECTS = `${Config.BASE_PATH}/projects/:id`;
const BOARDS = `${Config.BASE_PATH}/boards/:id`;
const CARDS = `${Config.BASE_PATH}/cards/:id`;
const SUPPORT = `${Config.BASE_PATH}/support/:formId`;
const SUPPORT_EMBED = `${Config.BASE_PATH}/support/:formId/embed`;
const SUPPORT_EMBED_CODE = `${Config.BASE_PATH}/support/:formId/embed-code`;

export default {
  ROOT,
  LOGIN,
  OIDC_CALLBACK,
  RESET_PASSWORD,
  PROJECTS,
  BOARDS,
  CARDS,
  SUPPORT,
  SUPPORT_EMBED,
  SUPPORT_EMBED_CODE,
};
