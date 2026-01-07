/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const ROOT = '/';
const LOGIN = '/login';
const OIDC_CALLBACK = '/oidc-callback';
const PROJECTS = '/projects/:id';
const BOARDS = '/boards/:id';
const CARDS = '/cards/:id';
const SUPPORT = '/support/:formId';
const SUPPORT_EMBED = '/support/:formId/embed';
const SUPPORT_EMBED_CODE = '/support/:formId/embed-code';

export default {
  ROOT,
  LOGIN,
  OIDC_CALLBACK,
  PROJECTS,
  BOARDS,
  CARDS,
  SUPPORT,
  SUPPORT_EMBED,
  SUPPORT_EMBED_CODE,
};
