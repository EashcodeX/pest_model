export type BackendMode = 'mac' | 'pi';

export const getBackendMode = (): BackendMode => {
  return 'mac';
};

export const setBackendMode = (mode: BackendMode) => {
  // No-op
};

export const getBackendBaseUrl = () => {
  return 'https://lovely-facilitate-front-nyc.trycloudflare.com';
};
