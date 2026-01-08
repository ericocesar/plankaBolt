export const parsePrefill = (prefillParam) => {
  if (!prefillParam) return {};
  try {
    const json = atob(prefillParam);
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
};

export const getEmbedCSP = (allowedOrigins) => {
  return `frame-ancestors 'self' ${allowedOrigins || 'https://bolt360.com.br'}`;
};
