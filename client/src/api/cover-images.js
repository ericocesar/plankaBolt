import http from './http';

/* Actions */

const createCoverImage = (projectId, { file, ...data }, headers) =>
  http.post(
    `/projects/${projectId}/cover-images`,
    {
      ...data,
      file,
    },
    headers,
  );

export default {
  createCoverImage,
};
