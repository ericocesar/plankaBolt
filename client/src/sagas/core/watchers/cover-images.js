import { takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* coverImagesWatchers() {
  yield takeEvery(EntryActionTypes.COVER_IMAGE_IN_CURRENT_PROJECT_CREATE, ({ payload: { data } }) =>
    services.createCoverImageInCurrentProject(data),
  );
}
