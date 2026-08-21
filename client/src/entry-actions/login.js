/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const authenticate = (data) => ({
  type: EntryActionTypes.AUTHENTICATE,
  payload: {
    data,
  },
});

const clearAuthenticateError = () => ({
  type: EntryActionTypes.AUTHENTICATE_ERROR_CLEAR,
  payload: {},
});

const openPasswordResetModal = () => ({
  type: EntryActionTypes.OPEN_PASSWORD_RESET_MODAL,
  payload: {},
});

const closePasswordResetModal = () => ({
  type: EntryActionTypes.CLOSE_PASSWORD_RESET_MODAL,
  payload: {},
});

const requestPasswordReset = (data) => ({
  type: EntryActionTypes.PASSWORD_RESET_REQUEST,
  payload: { data },
});

const clearPasswordResetRequestError = () => ({
  type: EntryActionTypes.PASSWORD_RESET_REQUEST_ERROR_CLEAR,
  payload: {},
});

const resetPassword = (data) => ({
  type: EntryActionTypes.PASSWORD_RESET,
  payload: { data },
});

const clearPasswordResetError = () => ({
  type: EntryActionTypes.PASSWORD_RESET_ERROR_CLEAR,
  payload: {},
});

const acceptTerms = (signature) => ({
  type: EntryActionTypes.TERMS_ACCEPT,
  payload: {
    signature,
  },
});

const cancelTerms = () => ({
  type: EntryActionTypes.TERMS_CANCEL,
  payload: {},
});

const updateTermsLanguage = (value) => ({
  type: EntryActionTypes.TERMS_LANGUAGE_UPDATE,
  payload: {
    value,
  },
});

const verifyTotp = (data) => ({
  type: EntryActionTypes.TOTP_VERIFY,
  payload: {
    data,
  },
});

const cancelTotpChallenge = () => ({
  type: EntryActionTypes.TOTP_CHALLENGE_CANCEL,
  payload: {},
});

export default {
  authenticate,
  clearAuthenticateError,
  openPasswordResetModal,
  closePasswordResetModal,
  requestPasswordReset,
  clearPasswordResetRequestError,
  resetPassword,
  clearPasswordResetError,
  acceptTerms,
  cancelTerms,
  updateTermsLanguage,
  verifyTotp,
  cancelTotpChallenge,
};
