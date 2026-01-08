import socket from './socket';
import Config from '../constants/Config';

const getForms = (headers) => socket.get('/forms', undefined, headers);

const createForm = (data, headers) => socket.post('/forms', data, headers);

const updateForm = (id, data, headers) => socket.patch(`/forms/${id}`, data, headers);

const deleteForm = (id, headers) => socket.delete(`/forms/${id}`, undefined, headers);

const getForm = (id, headers) => socket.get(`/forms/${id}`, undefined, headers);

const publishForm = (id, headers) => socket.post(`/forms/${id}/publish`, undefined, headers);

const safeJsonParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = safeJsonParse(text);
      if (json) {
        if (json.message) throw new Error(json.message);
        if (json.code) throw new Error(`Error: ${json.code}`);
        if (json.problems) throw new Error(`Validation Error: ${json.problems.join(', ')}`);
      }
    }
    throw new Error(text || 'Server Error');
  }
  return response.json();
};

const createPublicTicket = (formId, data) => {
  const hasFiles = data.files && data.files.length > 0;

  if (hasFiles) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (key === 'files') {
        Array.from(data[key]).forEach((file) => {
          formData.append('files', file);
        });
      } else if (key === 'values' && typeof data[key] === 'object') {
        formData.append('values', JSON.stringify(data[key]));
      } else {
        formData.append(key, data[key]);
      }
    });

    return fetch(`${Config.SERVER_BASE_URL}/api/public-tickets/${formId}`, {
      method: 'POST',
      body: formData,
    }).then(handleResponse);
  }

  return fetch(`${Config.SERVER_BASE_URL}/api/public-tickets/${formId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(handleResponse);
};

export default {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  createPublicTicket,
};
