/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { AccessTokenSteps, TRUST_DEVICE_COOKIE_NAME } = require('../../../constants');

const PENDING_TOKEN_EXPIRES_IN = 10 * 60;

module.exports = {
  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
      required: true,
    },
    response: {
      type: 'ref',
      required: true,
    },
    remoteAddress: {
      type: 'string',
      required: true,
    },
    withHttpOnlyToken: {
      type: 'boolean',
    },
  },

  exits: {
    totpVerificationRequired: {},
  },

  async fn(inputs) {
    const internalConfig = await InternalConfig.qm.getOneMain();

    if (!internalConfig.isInitialized) {
      await InternalConfig.qm.updateOneMain({
        isInitialized: true,
      });
    }

    if (inputs.user.isTotpEnabled) {
      const trustCookie =
        inputs.request.cookies && inputs.request.cookies[TRUST_DEVICE_COOKIE_NAME];

      const isDeviceTrusted = trustCookie
        ? await sails.helpers.trustedDevices.checkToken.with({
            userId: inputs.user.id,
            plainToken: trustCookie,
          })
        : false;

      if (!isDeviceTrusted) {
        const { token: pendingToken, payload: pendingTokenPayload } =
          sails.helpers.utils.createJwtToken(
            AccessTokenSteps.VERIFY_TOTP,
            undefined,
            PENDING_TOKEN_EXPIRES_IN,
          );

        const session = await sails.helpers.sessions.createOne.with({
          values: {
            pendingToken,
            userId: inputs.user.id,
            remoteAddress: inputs.remoteAddress,
            userAgent: inputs.request.headers['user-agent'],
          },
          withHttpOnlyToken: inputs.withHttpOnlyToken,
        });

        if (session.httpOnlyToken && !inputs.request.isSocket) {
          sails.helpers.utils.setHttpOnlyTokenCookie(
            session.httpOnlyToken,
            pendingTokenPayload,
            inputs.response,
          );
        }

        throw {
          totpVerificationRequired: {
            pendingToken,
            message: 'TOTP verification required',
            step: AccessTokenSteps.VERIFY_TOTP,
          },
        };
      }
    }

    const { token: accessToken, payload: accessTokenPayload } = sails.helpers.utils.createJwtToken(
      inputs.user.id,
    );

    const session = await sails.helpers.sessions.createOne.with({
      values: {
        accessToken,
        userId: inputs.user.id,
        remoteAddress: inputs.remoteAddress,
        userAgent: inputs.request.headers['user-agent'],
      },
      withHttpOnlyToken: inputs.withHttpOnlyToken,
    });

    if (session.httpOnlyToken && !inputs.request.isSocket) {
      sails.helpers.utils.setHttpOnlyTokenCookie(
        session.httpOnlyToken,
        accessTokenPayload,
        inputs.response,
      );
    }

    return {
      item: accessToken,
    };
  },
};
