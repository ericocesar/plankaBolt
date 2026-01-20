const moment = require('moment');
const nodemailer = require('nodemailer');
const validator = require('validator');

const collectFields = (schema) => {
  if (schema && Array.isArray(schema.steps)) {
    return schema.steps.flatMap((step) => step.fields || []);
  }
  return [];
};

const formatValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const resolveSelectableLabel = (field, rawValue) => {
  if (!field || !['select', 'radio'].includes(field.type)) {
    return rawValue;
  }

  const options = Array.isArray(field.options) ? field.options : [];
  const match = options.find((option) => option && option.value === rawValue);
  if (match && match.label !== undefined && match.label !== null && match.label !== '') {
    return match.label;
  }

  return rawValue;
};

const buildValuesFromLegacy = (schema, legacy) => {
  if (!schema) {
    return {};
  }

  const roleMap = {
    name: legacy.name,
    email: legacy.email,
    phone: legacy.phone,
    company: legacy.company,
    product: legacy.product,
    category: legacy.category,
    priority: legacy.priority,
    subject: legacy.subject,
    description: legacy.description,
  };

  const values = {};
  collectFields(schema).forEach((field) => {
    if (field.role && roleMap[field.role] !== undefined) {
      values[field.id] = roleMap[field.role];
      return;
    }
    if (legacy[field.id] !== undefined) {
      values[field.id] = legacy[field.id];
    }
  });

  return values;
};

const buildTicketDataFromSchema = (schema, values, fallbackSubject) => {
  const derived = {
    name: null,
    email: null,
    phone: null,
    company: null,
    product: null,
    category: null,
    priority: null,
    subject: null,
    description: null,
  };

  const extraLines = [];

  collectFields(schema).forEach((field) => {
    const rawValue = values[field.id];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return;
    }

    const displayValue = resolveSelectableLabel(field, rawValue);

    if (field.role && field.role in derived) {
      derived[field.role] = displayValue;
    } else {
      extraLines.push(`**${field.label}:** ${formatValue(displayValue)}`);
    }
  });

  const infoLines = [];
  if (derived.name) infoLines.push(`**Name:** ${derived.name}`);
  if (derived.email) infoLines.push(`**Email:** ${derived.email}`);
  if (derived.phone) infoLines.push(`**Phone:** ${derived.phone}`);
  if (derived.company) infoLines.push(`**Company:** ${derived.company}`);
  if (derived.product) infoLines.push(`**Product:** ${derived.product}`);
  if (derived.category) infoLines.push(`**Category:** ${derived.category}`);
  if (derived.priority) infoLines.push(`**Priority:** ${derived.priority}`);

  const descriptionLines = [...infoLines, ...extraLines];
  let description = descriptionLines.join('\n');

  if (derived.description) {
    description = description
      ? `${description}\n\n---\n\n${derived.description}`
      : derived.description;
  }

  return {
    subject: derived.subject || fallbackSubject,
    description: description || '',
    category: derived.category,
    priority: derived.priority,
    name: derived.name,
    email: derived.email,
  };
};

const Errors = {
  FORM_NOT_FOUND: {
    notFound: 'Formulário não encontrado',
  },
  INVALID_SUBMISSION: {
    invalidSubmission: {
      message: 'Dados inválidos.',
    },
  },
  MISSING_REQUIRED: {
    invalidSubmission: {
      message: 'Campos obrigatórios não informados.',
    },
  },
  INVALID_EMAIL: {
    invalidSubmission: {
      message: 'E-mail inválido.',
    },
  },
};

module.exports = {
  inputs: {
    formId: {
      type: 'string',
      required: true,
    },
    name: {
      type: 'string',
    },
    email: {
      type: 'string',
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
    },
    description: {
      type: 'string',
    },
    values: {
      type: 'json',
    },
  },
  exits: {
    notFound: {
      responseType: 'notFound',
    },
    invalidSubmission: {
      responseType: 'badRequest',
    },
  },

  async fn(inputs) {
    // 1. Fetch Form Configuration
    const form = await Form.findOne({ id: inputs.formId });
    if (!form || !form.isActive) {
      throw Errors.FORM_NOT_FOUND;
    }

    const legacyValues = {
      name: inputs.name,
      email: inputs.email,
      phone: inputs.phone,
      company: inputs.company,
      product: inputs.product,
      category: inputs.category,
      priority: inputs.priority,
      subject: inputs.subject,
      description: inputs.description,
    };

    let publishedSchemaVersion = null;
    let publishedSchema = null;

    if (form.publishedSchemaVersionId) {
      publishedSchemaVersion = await FormSchemaVersion.findOne({
        id: form.publishedSchemaVersionId,
      });
      if (publishedSchemaVersion) {
        publishedSchema = publishedSchemaVersion.schema;
      }
    }

    if (!publishedSchema && form.draftSchema) {
      publishedSchema = form.draftSchema;
    }

    let { values } = inputs;

    if (!values && this.req && this.req.body && this.req.body.values) {
      values = this.req.body.values;
    }

    if (typeof values === 'string') {
      try {
        values = JSON.parse(values);
      } catch (e) {
        values = null;
      }
    }

    if (!values && publishedSchema) {
      values = buildValuesFromLegacy(publishedSchema, legacyValues);
    }

    if (!values) {
      values = {};
    }

    let sanitizedValues = values;

    if (publishedSchema) {
      /* eslint-disable no-underscore-dangle */
      const { _fileparser: fileParser } = this.req || {};
      const parserFiles = fileParser && Array.isArray(fileParser._files) ? fileParser._files : null;
      /* eslint-enable no-underscore-dangle */
      const filesCount = parserFiles ? parserFiles.length : undefined;

      const submissionValidation = await sails.helpers.forms.validateSubmission.with({
        schema: publishedSchema,
        values,
        ...(Number.isInteger(filesCount) ? { filesCount } : {}),
      });

      if (!submissionValidation.isValid) {
        throw {
          invalidSubmission: {
            ...Errors.INVALID_SUBMISSION.invalidSubmission,
            details: submissionValidation.errors,
          },
        };
      }

      sanitizedValues = submissionValidation.sanitized;
    } else {
      if (
        !legacyValues.name ||
        !legacyValues.email ||
        !legacyValues.subject ||
        !legacyValues.description
      ) {
        throw Errors.MISSING_REQUIRED;
      }

      if (!validator.isEmail(legacyValues.email)) {
        throw Errors.INVALID_EMAIL;
      }
    }

    let subject = legacyValues.subject || form.name;
    let description = '';
    let categoryValue = legacyValues.category;
    let requesterName = legacyValues.name;
    let requesterEmail = legacyValues.email;

    if (publishedSchema) {
      const ticketData = buildTicketDataFromSchema(
        publishedSchema,
        sanitizedValues,
        legacyValues.subject || form.name,
      );

      subject = ticketData.subject || form.name;
      description = ticketData.description;
      categoryValue = ticketData.category || legacyValues.category;
      requesterName = ticketData.name || legacyValues.name;
      requesterEmail = ticketData.email || legacyValues.email;

      await FormResponse.create({
        formId: form.id,
        formSchemaVersionId: publishedSchemaVersion ? publishedSchemaVersion.id : null,
        data: sanitizedValues,
        metadata: {
          ip: this.req.ip,
          userAgent: this.req.headers['user-agent'] || null,
        },
      });
    } else {
      description = `**Name:** ${legacyValues.name}\n**Email:** ${legacyValues.email}`;
      if (legacyValues.phone) description += `\n**Phone:** ${legacyValues.phone}`;
      if (legacyValues.company) description += `\n**Company:** ${legacyValues.company}`;
      if (legacyValues.product) description += `\n**Product:** ${legacyValues.product}`;
      if (legacyValues.category) description += `\n**Category:** ${legacyValues.category}`;
      if (legacyValues.priority) description += `\n**Priority:** ${legacyValues.priority}`;
      description += `\n\n---\n\n${legacyValues.description}`;
    }

    // Calculate position (append to bottom)
    const lastCard = await Card.find({ listId: form.listId }).sort('position DESC').limit(1);
    const position = lastCard.length > 0 ? lastCard[0].position + 65536 : 65536;

    // Calculate Due Date based on Form settings
    let dueDate = null; // Default to none
    if (form.dueDateType === 'fixed') {
      dueDate = form.dueDateFixed;
    } else if (form.dueDateType === 'relative' && form.dueDateQuantity && form.dueDateUnit) {
      dueDate = moment().add(form.dueDateQuantity, form.dueDateUnit).toISOString();
    }

    // Determine Card Type
    // Map form types to valid Card model types (project, story)
    let cardType = 'story';
    if (form.cardType === 'project') {
      cardType = 'project';
    }

    // 3. Create Card
    const card = await Card.create({
      boardId: form.boardId,
      listId: form.listId,
      name: subject,
      description,
      type: cardType,
      position,
      dueDate,
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

    // 5. Add Labels (Default + Category Mapping)
    const labelIdsToApply = new Set();

    if (Array.isArray(form.labelIds) && form.labelIds.length > 0) {
      const validLabels = await Label.find({
        id: { in: form.labelIds },
        boardId: form.boardId,
      });
      validLabels.forEach((label) => labelIdsToApply.add(label.id));
    }

    // Category Mapping
    // Logic:
    // 1. Check if the category is mapped in form.categoryMapping.
    // 2. If mapped to a specific label ID, use it.
    // 3. If mapped to 'auto-create' or not mapped, search/create label by name.
    if (categoryValue) {
      let labelIdToUse = null;
      const mapping = form.categoryMapping || {};

      if (mapping[categoryValue] && mapping[categoryValue] !== 'auto-create') {
        // Use mapped label ID
        labelIdToUse = mapping[categoryValue];
      } else {
        // Search for existing label by name
        let label = await Label.findOne({
          boardId: form.boardId,
          name: categoryValue,
        });

        if (!label) {
          // Create new label
          try {
            const lastLabel = await Label.find({ boardId: form.boardId })
              .sort('position DESC')
              .limit(1);
            const labelPosition = lastLabel.length > 0 ? lastLabel[0].position + 65536 : 65536;

            label = await Label.create({
              boardId: form.boardId,
              name: categoryValue,
              color: 'lagoon-blue',
              position: labelPosition,
            }).fetch();
          } catch (e) {
            sails.log.error('Error creating label for category:', e);
          }
        }

        if (label) {
          labelIdToUse = label.id;
        }
      }

      if (labelIdToUse) {
        labelIdsToApply.add(labelIdToUse);
      }
    }

    if (labelIdsToApply.size > 0) {
      await CardLabel.createEach(
        Array.from(labelIdsToApply).map((labelId) => ({
          cardId: card.id,
          labelId,
        })),
      );
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
      if (smtpConfig && smtpConfig.host && requesterEmail) {
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
           <p>Hello ${requesterName || 'there'},</p>
           <p>We have received your support request.</p>
           <p><strong>Ticket ID:</strong> ${card.id}</p>
           <p><strong>Subject:</strong> ${subject}</p>
           <p>We will get back to you soon.</p>
           <br>
           <p>Best regards,</p>
           <p>Support Team</p>
         `;

        try {
          await sails.helpers.utils.sendEmail.with({
            transporter,
            to: requesterEmail,
            subject: `Ticket Received: ${card.name}`,
            html,
          });
        } finally {
          if (typeof transporter.close === 'function') {
            transporter.close();
          }
        }
      } else if (!smtpConfig || !smtpConfig.host) {
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
