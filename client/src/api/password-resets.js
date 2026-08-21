/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import http from './http';

/* Actions */

const requestPasswordReset = (data, headers) =>
  http.post('/password-resets/request', data, headers);

const resetPassword = (data, headers) => http.post('/password-resets/reset', data, headers);

export default {
  requestPasswordReset,
  resetPassword,
};
