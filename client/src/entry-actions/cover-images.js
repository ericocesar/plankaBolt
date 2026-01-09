import EntryActionTypes from '../constants/EntryActionTypes';

const createCoverImageInCurrentProject = (data) => ({
  type: EntryActionTypes.COVER_IMAGE_IN_CURRENT_PROJECT_CREATE,
  payload: {
    data,
  },
});

export default {
  createCoverImageInCurrentProject,
};
