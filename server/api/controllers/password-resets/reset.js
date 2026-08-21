/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /password-resets/reset:
 *   post:
 *     summary: Reset password
 *     description: Resets a user's password using a valid reset token.
 *     tags:
 *       - Password Resets
 *     operationId: resetPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received via email
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ4...
 *               password:
 *                 type: string
 *                 maxLength: 256
 *                 description: New password (must meet password requirements)
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   type: object
 *                   description: Empty object
 *                   example: {}
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - code
 *                 - message
 *               properties:
 *                 code:
 *                   type: string
 *                   example: E_UNAUTHORIZED
 *                 message:
 *                   type: string
 *                   enum:
 *                     - Invalid or expired token
 *                   example: Invalid or expired token
 *     security: []
 */

const bcrypt = require('bcryptjs');

const { isPassword } = require('../../../utils/validators');

const Errors = {
  INVALID_TOKEN: {
    invalidToken: 'Invalid or expired token',
  },
  USER_NOT_FOUND: {
    userNotFound: 'User not found',
  },
};

module.exports = {
  inputs: {
    token: {
      type: 'string',
      required: true,
    },
    password: {
      type: 'string',
      maxLength: 256,
      custom: isPassword,
      required: true,
    },
  },

  exits: {
    invalidToken: {
      responseType: 'unauthorized',
    },
    userNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    let subject;
    try {
      ({ subject } = sails.helpers.utils.verifyJwtToken(inputs.token));
    } catch (error) {
      throw Errors.INVALID_TOKEN;
    }

    const user = await User.qm.getOneById(subject, { withDeactivated: false });

    if (!user) {
      throw Errors.USER_NOT_FOUND;
    }

    if (user.email === sails.config.custom.defaultAdminEmail || sails.config.custom.demoMode) {
      throw Errors.INVALID_TOKEN;
    }

    const password = await bcrypt.hash(inputs.password, 10);

    await User.qm.updateOne(user.id, {
      password,
      passwordChangedAt: new Date().toUTCString(),
    });

    // Invalidate all existing sessions
    await Session.qm.delete({ userId: user.id });

    return {
      item: {},
    };
  },
};
