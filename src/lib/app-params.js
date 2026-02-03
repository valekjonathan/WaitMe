// ===============================
// 2) /src/lib/app-params.js
// (NO persistir functions_version; borrar cache viejo si estorba)
// ===============================
const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

// Lee de URL y (opcional) guarda en storage.
// IMPORTANTE: para algunos params (functions_version) NO queremos guardar ni reutilizar cache.
const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false, persist = true } = {}
) => {
  if (isNode) return defaultValue;

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl =
      `${window.location.pathname}` +
      `${urlParams.toString() ? `?${urlParams.toString()}` : ''}` +
      `${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  // 1) Si viene por URL, úsalo (y guarda si procede)
  if (searchParam) {
    if (persist) storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  // 2) Si hay default, úsalo (y guarda si procede)
  if (defaultValue !== undefined && defaultValue !== null) {
    if (persist) storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  // 3) Si NO persistimos este param, NO uses el cache antiguo
  if (!persist) {
    return null;
  }

  // 4) Fallback a storage
  const storedValue = storage.getItem(storageKey);
  if (storedValue) return storedValue;

  return null;
};

const getAppParams = () => {
  // Limpieza típica
  if (getAppParamValue('clear_access_token') === 'true') {
    storage.removeItem('base44_access_token');
    storage.removeItem('token');
  }

  // CLAVE: evita quedarte “enganchado” a un functions_version viejo
  // Si no viene en URL, lo dejamos en null y además limpiamos el storage viejo.
  const functionsVersionFromUrl = getAppParamValue('functions_version', { persist: false });
  if (!functionsVersionFromUrl) {
    storage.removeItem('base44_functions_version');
  }

  return {
    appId: getAppParamValue('app_id', { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
    serverUrl: getAppParamValue('server_url', { defaultValue: import.meta.env.VITE_BASE44_BACKEND_URL }),
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', { defaultValue: window.location.href }),
    functionsVersion: functionsVersionFromUrl,
  };
};

export const appParams = {
  ...getAppParams(),
};