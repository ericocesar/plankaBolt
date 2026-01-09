import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';

export function* createCoverImage(projectId, data) {
  let project;

  try {
    ({ item: project } = yield call(request, api.createCoverImage, projectId, data));
  } catch (error) {
    return;
  }

  yield put(actions.updateProject.success(project));
}

export function* createCoverImageInCurrentProject(data) {
  const { projectId } = yield select(selectors.selectPath);

  yield call(createCoverImage, projectId, data);
}

export default {
  createCoverImage,
  createCoverImageInCurrentProject,
};
