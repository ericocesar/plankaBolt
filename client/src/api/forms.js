import socket from './socket';
import Config from '../constants/Config';

const getForms = (headers) => socket.get('/forms', undefined, headers);

const createForm = (data, headers) => socket.post('/forms', data, headers);

const updateForm = (id, data, headers) => socket.patch(`/forms/${id}`, data, headers);

const deleteForm = (id, headers) => socket.delete(`/forms/${id}`, undefined, headers);

const createPublicTicket = (formId, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'files') {
      Array.from(data[key]).forEach((file) => {
        formData.append('files', file);
      });
    } else {
      formData.append(key, data[key]);
    }
  });

  return fetch(`${Config.SERVER_BASE_URL}/api/public-tickets/${formId}`, {
    method: 'POST',
    body: formData,
    // Content-Type header skipped to let browser set boundary
  }).then((response) => {
    if (!response.ok) {
      return response.text().then((text) => {
        throw new Error(text || 'Server Error');
      });
    }
    return response.json();
  });
};

export default {
  getForms,
  createForm,
  updateForm,
  deleteForm,
  createPublicTicket,
};
