export type BackendMode = 'mac' | 'pi';

export const getBackendMode = (): BackendMode => {
  return 'mac';
};

export const setBackendMode = (mode: BackendMode) => {
  // No-op
};

export const getBackendBaseUrl = () => {
  // Production URL (Cloudflare Tunnel)
  // This is hardcoded to ensure Vercel deployments connect to the correct backend.
  return 'https://lovely-facilitate-front-nyc.trycloudflare.com';
};
