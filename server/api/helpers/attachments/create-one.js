/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    list: {
      type: 'ref',
      required: true,
    },
    requestId: {
      type: 'string',
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { values } = inputs;

    const attachment = await Attachment.qm.createOne({
      ...values,
      cardId: values.card.id,
      creatorUserId: values.creatorUser ? values.creatorUser.id : null,
    });

    sails.sockets.broadcast(
      `board:${inputs.board.id}`,
      'attachmentCreate',
      {
        item: sails.helpers.attachments.presentOne(attachment),
        requestId: inputs.requestId,
      },
      inputs.request,
    );

    if (values.creatorUser) {
      const webhooks = await Webhook.qm.getAll();

      sails.helpers.utils.sendWebhooks.with({
        webhooks,
        event: Webhook.Events.ATTACHMENT_CREATE,
        buildData: () => ({
          item: sails.helpers.attachments.presentOne(attachment),
          included: {
            projects: [inputs.project],
            boards: [inputs.board],
            lists: [inputs.list],
            cards: [values.card],
          },
        }),
        user: values.creatorUser,
      });
    }

    if (!values.card.coverAttachmentId && values.creatorUser) {
      if (attachment.type === Attachment.Types.FILE && attachment.data.image) {
        const webhooks = await Webhook.qm.getAll(); // Fetch webhooks again or reuse if I moved it up?
        // To be safe and clean, let's fetch webhooks inside the if block or reuse if visible.
        // I'll fetch it inside since I made the previous block conditional.

        await sails.helpers.cards.updateOne.with({
          webhooks,
          record: values.card,
          values: {
            coverAttachmentId: attachment.id,
          },
          project: inputs.project,
          board: inputs.board,
          list: inputs.list,
          actorUser: values.creatorUser,
        });
      }
    }

    return attachment;
  },
};
