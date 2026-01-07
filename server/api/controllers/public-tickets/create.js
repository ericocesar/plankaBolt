const moment = require('moment');
const nodemailer = require('nodemailer');

module.exports = {
  inputs: {
    formId: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    phone: {
      type: 'string',
    },
    company: {
      type: 'string',
    },
    product: {
      type: 'string',
    },
    category: {
      type: 'string',
    },
    priority: {
      type: 'string',
    },
    subject: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
  },

  async fn(inputs) {
    // 1. Fetch Form Configuration
    const form = await Form.findOne({ id: inputs.formId });
    if (!form || !form.isActive) {
      throw 'notFound'; // Or a specific error
    }

    // 2. Prepare Card Data
    let description = `**Name:** ${inputs.name}\n**Email:** ${inputs.email}`;
    if (inputs.phone) description += `\n**Phone:** ${inputs.phone}`;
    if (inputs.company) description += `\n**Company:** ${inputs.company}`;
    if (inputs.product) description += `\n**Product:** ${inputs.product}`;
    if (inputs.category) description += `\n**Category:** ${inputs.category}`;
    if (inputs.priority) description += `\n**Priority:** ${inputs.priority}`;
    description += `\n\n---\n\n${inputs.description}`;

    // Calculate position (append to bottom)
    const lastCard = await Card.find({ listId: form.listId }).sort('position DESC').limit(1);
    const position = lastCard.length > 0 ? lastCard[0].position + 65536 : 65536;

    // 3. Create Card
    const card = await Card.create({
      boardId: form.boardId,
      listId: form.listId,
      name: inputs.subject,
      description,
      type: 'story', // Default type (was 'card' which is invalid)
      position,
      dueDate: moment().add(1, 'days').toISOString(),
      creatorUserId: null, // Public
    }).fetch();

    // 3.5 Save Protocol Number in Description (Prepended)
    // We update the card description to include the protocol number at the top
    try {
      const protocolText = `**Protocolo:** ${card.id}\n`;
      const updatedDescription = protocolText + description;

      await Card.update({ id: card.id }).set({
        description: updatedDescription,
      });
    } catch (e) {
      sails.log.error('Error updating card description with protocol:', e);
    }

    // 4. Assign Members
    if (form.assigneeIds && form.assigneeIds.length > 0) {
      await CardMembership.createEach(
        form.assigneeIds.map((userId) => ({
          cardId: card.id,
          userId,
        })),
      );
    }

    // 5. Add Labels (Category Mapping)
    // We expect 'inputs.category' to be a string name.
    // Logic: Search for a label with this name in the board. If found, link it.
    // If not found, create it (with a default color) and link it.
    if (inputs.category) {
      // Search for existing label by name (case-insensitive search would be better but let's stick to exact for now or assume simple strings)
      // Sails waterline case-sensitivity depends on DB adapter.
      let label = await Label.findOne({
        boardId: form.boardId,
        name: inputs.category,
      });

      if (!label) {
        // Create new label
        try {
          // Get last label position
          const lastLabel = await Label.find({ boardId: form.boardId })
            .sort('position DESC')
            .limit(1);
          const labelPosition = lastLabel.length > 0 ? lastLabel[0].position + 65536 : 65536;

          label = await Label.create({
            boardId: form.boardId,
            name: inputs.category,
            color: 'lagoon-blue', // Use a valid color from whitelist
            position: labelPosition, // Position is required
          }).fetch();
        } catch (e) {
          // Handle race condition or error
          sails.log.error('Error creating label for category:', e);
        }
      }

      if (label) {
        await CardLabel.create({
          cardId: card.id,
          labelId: label.id,
        });
      }
    }

    // 6. Handle Attachments
    // 'files' is the field name we'll use in the frontend
    // Sails handles multipart uploads via req.file()
    // eslint-disable-next-line no-underscore-dangle
    if (this.req.file && this.req._fileparser) {
      // We check for _fileparser because Sails crashes if we call req.file() on a non-multipart request
      // But we still need to check if 'files' field exists in the stream
      try {
        const uploadedFiles = await sails.helpers.utils.receiveFile(this.req.file('files'));

        if (uploadedFiles.length > 0) {
          // We need 'project' to store attachments correctly
          const project = await Project.findOne({ id: form.projectId });

          // eslint-disable-next-line no-restricted-syntax
          for (const file of uploadedFiles) {
            // eslint-disable-next-line no-await-in-loop
            const fileData = await sails.helpers.attachments.processUploadedFile(file);

            // eslint-disable-next-line no-await-in-loop
            await sails.helpers.attachments.createOne.with({
              project,
              board: { id: form.boardId }, // Mock board object
              list: { id: form.listId }, // Mock list object
              values: {
                type: 'file',
                name: file.filename, // Use original filename
                data: fileData,
                card,
                creatorUser: null, // System/Public
              },
              request: this.req,
            });
          }
        }
      } catch (err) {
        sails.log.error('Attachment upload failed:', err);
        // Continue even if upload fails? Or throw?
        // For now log and continue
      }
    }

    // 7. Send Email Confirmation
    // We'll use the existing helper if possible, or simple nodemailer
    try {
      // Create a temporary transporter or use a configured one
      // For now, let's assume we might need to configure this properly or check if global transporter exists
      // But looking at send-email helper, it requires 'transporter' as input.
      // We should probably get it from configuration or another helper.

      // Check if SMTP is configured
      const smtpConfig = sails.config.custom.smtp;
      if (smtpConfig && smtpConfig.host) {
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure, // true for 465, false for other ports
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
          },
          tls: {
            rejectUnauthorized: smtpConfig.rejectUnauthorized,
          },
        });

        const html = `
           <p>Hello ${inputs.name},</p>
           <p>We have received your support request.</p>
           <p><strong>Ticket ID:</strong> ${card.id}</p>
           <p><strong>Subject:</strong> ${inputs.subject}</p>
           <p>We will get back to you soon.</p>
           <br>
           <p>Best regards,</p>
           <p>Support Team</p>
         `;

        await sails.helpers.utils.sendEmail.with({
          transporter,
          to: inputs.email,
          subject: `Ticket Received: ${card.name}`,
          html,
        });
      } else {
        sails.log.info('SMTP not configured, skipping email confirmation.');
      }
    } catch (err) {
      sails.log.error('Failed to send confirmation email:', err);
    }

    // Notify Internal Team (Assignees)
    // Optional: Iterate assignees and send email/notification

    return {
      protocol: card.id,
      message: 'Ticket created successfully',
    };
  },
};
