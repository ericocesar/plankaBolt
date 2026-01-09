const { idInput } = require('../../../utils/inputs');

const Errors = {
  PROJECT_NOT_FOUND: {
    projectNotFound: 'Project not found',
  },
  NO_FILE_WAS_UPLOADED: {
    noFileWasUploaded: 'No file was uploaded',
  },
  FILE_IS_NOT_IMAGE: {
    fileIsNotImage: 'File is not image',
  },
  UPLOAD_ERROR: {
    uploadError: 'Upload error',
  },
};

module.exports = {
  inputs: {
    projectId: {
      ...idInput,
      required: true,
    },
    requestId: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 128,
    },
  },

  exits: {
    projectNotFound: {
      responseType: 'notFound',
    },
    noFileWasUploaded: {
      responseType: 'unprocessableEntity',
    },
    fileIsNotImage: {
      responseType: 'unprocessableEntity',
    },
    uploadError: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs, exits) {
    const { currentUser } = this.req;

    const project = await Project.qm.getOneById(inputs.projectId);

    if (!project) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    const isProjectManager = await sails.helpers.users.isProjectManager(currentUser.id, project.id);

    if (!isProjectManager) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    let files;
    try {
      files = await sails.helpers.utils.receiveFile(this.req.file('file'));
    } catch (error) {
      return exits.uploadError(error.message);
    }

    if (files.length === 0) {
      throw Errors.NO_FILE_WAS_UPLOADED;
    }

    const file = _.last(files);

    let coverData;
    try {
      coverData = await sails.helpers.coverImages.processUploadedFile(file);
    } catch (error) {
      if (error === 'fileIsNotImage') {
        throw Errors.FILE_IS_NOT_IMAGE;
      }
      throw error;
    }

    const fileManager = sails.hooks['file-manager'].getInstance();
    const { uploadedFileId, extension } = coverData;

    const dirPathSegment = `${sails.config.custom.coverImagesPathSegment}/${uploadedFileId}`;

    const coverImageUrl = fileManager.buildUrl(`${dirPathSegment}/original.${extension}`);
    const coverImageThumbnailUrl = fileManager.buildUrl(
      `${dirPathSegment}/outside-360.${extension}`,
    );

    const previousUploadedFileId = project.coverImageUploadedFileId;
    const previousUploadedFile = previousUploadedFileId
      ? await UploadedFile.findOne({ id: previousUploadedFileId })
      : null;

    const updatedProject = await sails.helpers.projects.updateOne.with({
      record: project,
      values: {
        coverImageUrl,
        coverImageThumbnailUrl,
        coverImageUploadedFileId: uploadedFileId,
      },
      actorUser: currentUser,
      request: this.req,
    });

    if (!updatedProject) {
      throw Errors.PROJECT_NOT_FOUND;
    }

    if (previousUploadedFile && previousUploadedFile.id !== uploadedFileId) {
      await sails.helpers.utils.removeUnreferencedUploadedFiles(previousUploadedFile);
    }

    return exits.success({
      item: updatedProject,
    });
  },
};
