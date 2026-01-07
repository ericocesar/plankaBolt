export const parsePrefill = (prefillParam) => {
  if (!prefillParam) return {};
  try {
    const json = atob(prefillParam);
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse prefill data', e);
    return {};
  }
};

export const getEmbedCSP = (allowedOrigins) => {
  return `frame-ancestors ${allowedOrigins || 'https://bolt360.com.br'}`;
};
