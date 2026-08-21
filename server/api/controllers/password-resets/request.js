/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /password-resets/request:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset email to the user if the email exists. Always returns success to prevent user enumeration.
 *     tags:
 *       - Password Resets
 *     operationId: requestPasswordReset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 256
 *                 description: Email address of the user requesting a password reset
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (or would have been sent if the email existed)
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
 *     security: []
 */

const validator = require('validator');
const escapeHtml = require('escape-html');

const Errors = {
  INVALID_EMAIL: {
    invalidEmail: 'Invalid email',
  },
  SMTP_NOT_CONFIGURED: {
    smtpNotConfigured: 'SMTP is not configured',
  },
};

module.exports = {
  inputs: {
    email: {
      type: 'string',
      maxLength: 256,
      required: true,
    },
  },

  exits: {
    invalidEmail: {
      responseType: 'badRequest',
    },
    smtpNotConfigured: {
      responseType: 'badRequest',
    },
  },

  async fn(inputs) {
    if (!validator.isEmail(inputs.email)) {
      throw Errors.INVALID_EMAIL;
    }

    const { transporter } = await sails.helpers.utils.makeSmtpTransporter({
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      dnsTimeout: 3000,
    });

    if (!transporter) {
      throw Errors.SMTP_NOT_CONFIGURED;
    }

    const user = await User.qm.getOneByEmail(inputs.email);

    // Always return success to prevent user enumeration
    if (
      user &&
      !user.isDeactivated &&
      user.email !== sails.config.custom.defaultAdminEmail &&
      !sails.config.custom.demoMode
    ) {
      const { token } = sails.helpers.utils.createJwtToken(user.id, new Date(), 60 * 60); // 1 hour

      const resetLink = `${sails.config.custom.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0a0a0f; margin: 0;">Redefinição de Senha</h2>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <p style="color: #333333; font-size: 16px; line-height: 1.5;">Olá <strong>${escapeHtml(user.name)}</strong>,</p>
            <p style="color: #333333; font-size: 16px; line-height: 1.5;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para continuar:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background-color: #f3b229; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Redefinir Senha</a>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.5;">Se você não solicitou esta redefinição, ignore este e-mail. O link expira em <strong>1 hora</strong>.</p>
            <p style="color: #666666; font-size: 14px; line-height: 1.5;">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="color: #666666; font-size: 12px; word-break: break-all; background-color: #f0f0f0; padding: 8px; border-radius: 4px;">${resetLink}</p>
          </div>
          <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 24px;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `;

      await sails.helpers.utils.sendEmail.with({
        transporter,
        to: user.email,
        subject: 'Redefinição de Senha',
        html,
      });

      transporter.close();
    }

    return {
      item: {},
    };
  },
};
