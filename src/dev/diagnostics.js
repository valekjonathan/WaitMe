window.__WAITME_DIAG__ = {
  version: "dev",
  started: Date.now(),
  react: true
};

window.onerror = function (msg, url, line, col, error) {
  console.error("WAITME GLOBAL ERROR:", msg, url, line, col, error);
};

window.onunhandledrejection = function (event) {
  console.error("WAITME PROMISE ERROR:", event.reason);
};
