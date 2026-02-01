// src/lib/app-params.js
const isNode = typeof window === 'undefined';

const memoryStorage = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
})();

const safeStorage = (() => {
  if (isNode) return memoryStorage;

  try {
    const ls = window.localStorage;
    // test duro: en iOS puede existir pero fallar setItem (modo privado / restricciones)
    const testKey = '__b44_test__';
    ls.setItem(testKey, '1');
    ls.removeItem(testKey);
    return ls;
  } catch (e) {
    return memoryStorage;
  }
})();

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

const safeSetItem = (key, value) => {
  try {
    safeStorage.setItem(key, value);
  } catch (e) {
    // si incluso el storage “seguro” falla, caemos a memoria
    try {
      memoryStorage.setItem(key, value);
    } catch (_) {}
  }
};

const safeRemoveItem = (key) => {
  try {
    safeStorage.removeItem(key);
  } catch (e) {
    try {
      memoryStorage.removeItem(key);
    } catch (_) {}
  }
};

const safeGetItem = (key) => {
  try {
    return safeStorage.getItem(key);
  } catch (e) {
    try {
      return memoryStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {}
) => {
  if (isNode) return defaultValue;

  const storageKey = `base44_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    try {
      urlParams.delete(paramName);
      const newUrl =
        `${window.location.pathname}` +
        `${urlParams.toString() ? `?${urlParams.toString()}` : ''}` +
        `${window.location.hash}`;
      window.history.replaceState({}, document.title, newUrl);
    } catch (e) {
      // si history falla, no bloqueamos el arranque
    }
  }

  if (searchParam) {
    safeSetItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
    safeSetItem(storageKey, defaultValue);
    return defaultValue;
  }

  const storedValue = safeGetItem(storageKey);
  if (storedValue) return storedValue;

  return null;
};

const getAppParams = () => {
  try {
    if (getAppParamValue('clear_access_token') === 'true') {
      safeRemoveItem('base44_access_token');
      safeRemoveItem('token');
    }
  } catch (e) {
    // no bloqueamos el arranque
  }

  return {
    appId: getAppParamValue('app_id', { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
    serverUrl: getAppParamValue('server_url', { defaultValue: import.meta.env.VITE_BASE44_BACKEND_URL }),
    token: getAppParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getAppParamValue('from_url', { defaultValue: window.location.href }),
    functionsVersion: getAppParamValue('functions_version'),
  };
};

export const appParams = {
  ...getAppParams(),
};