import socket from './socket';
import Config from '../constants/Config';

const getForms = (headers) => socket.get('/forms', undefined, headers);

const createForm = (data, headers) => socket.post('/forms', data, headers);

const updateForm = (id, data, headers) => socket.patch(`/forms/${id}`, data, headers);

const deleteForm = (id, headers) => socket.delete(`/forms/${id}`, undefined, headers);

const handleResponse = (response) => {
  if (!response.ok) {
    return response.text().then((text) => {
      // Log do erro detalhado para debug
      console.error('API Error Response:', text);
      try {
        const json = JSON.parse(text);
        if (json.message) throw new Error(json.message);
        if (json.code) throw new Error(`Error: ${json.code}`);
        // Se for um erro do Sails Action2, pode vir como { code: '...', details: ... }
        if (json.problems) throw new Error(`Validation Error: ${json.problems.join(', ')}`);
      } catch (e) {
        if (e.message !== 'Unexpected token < in JSON at position 0') {
          throw e; // Rethrow parsed error
        }
      }
      throw new Error(text || 'Server Error');
    });
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
  createForm,
  updateForm,
  deleteForm,
  createPublicTicket,
};
