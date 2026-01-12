const { v4: uuid } = require('uuid');
const { rimraf } = require('rimraf');
const sharp = require('sharp');

// Handle file-type v16.5.4+ which may have different export structures
let fileTypeFromFile;
try {
  // eslint-disable-next-line global-require
  ({ fileTypeFromFile } = require('file-type'));
} catch (error) {
  // Fallback for ESM-only versions
  fileTypeFromFile = null;
}

const { MAX_SIZE_TO_PROCESS_AS_IMAGE } = require('../../../constants');

module.exports = {
  inputs: {
    file: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    fileIsNotImage: {},
  },

  async fn(inputs) {
    const fileManager = sails.hooks['file-manager'].getInstance();

    // Lazy load file-type if not already loaded (for ESM versions)
    if (!fileTypeFromFile) {
      const fileTypeModule = await import('file-type');
      fileTypeFromFile = fileTypeModule.fileTypeFromFile;
    }

    const fileType = await fileTypeFromFile(inputs.file.fd);
    const { mime: mimeType = null } = fileType || {};
    const { size } = inputs.file;

    if (!mimeType || !mimeType.startsWith('image/') || size > MAX_SIZE_TO_PROCESS_AS_IMAGE) {
      await rimraf(inputs.file.fd);
      throw 'fileIsNotImage';
    }

    let image = sharp(inputs.file.fd, {
      animated: true,
    });

    let metadata;
    try {
      metadata = await image.metadata();
    } catch (error) {
      await rimraf(inputs.file.fd);
      throw 'fileIsNotImage';
    }

    if (metadata.orientation && metadata.orientation > 4) {
      image = image.rotate();
    }

    const { id: uploadedFileId } = await UploadedFile.qm.createOne({
      mimeType,
      size,
      id: uuid(),
      type: UploadedFile.Types.PROJECT_COVER_IMAGE,
    });

    const dirPathSegment = `${sails.config.custom.coverImagesPathSegment}/${uploadedFileId}`;
    const extension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;

    const outside360 = image
      .clone()
      .resize(360, 360, {
        fit: 'outside',
        withoutEnlargement: true,
      })
      .png({
        quality: 75,
        force: false,
      });

    try {
      await Promise.all([
        fileManager.save(`${dirPathSegment}/original.${extension}`, image, inputs.file.type),
        fileManager.save(
          `${dirPathSegment}/outside-360.${extension}`,
          outside360,
          inputs.file.type,
        ),
      ]);
    } catch (error) {
      sails.log.warn(error.stack);

      await fileManager.deleteDir(dirPathSegment);
      await rimraf(inputs.file.fd);
      await UploadedFile.qm.deleteOne(uploadedFileId);

      throw 'fileIsNotImage';
    }

    await rimraf(inputs.file.fd);

    return {
      uploadedFileId,
      extension,
      size,
    };
  },
};
