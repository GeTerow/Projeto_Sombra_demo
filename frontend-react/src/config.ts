const getApiUrl = (): string => {
  if (import.meta.env.DEV) {
    const { hostname } = window.location;
    return `http://${hostname}:3001/api/v1`;
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
};

export const API_URL = getApiUrl();