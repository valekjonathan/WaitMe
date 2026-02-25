export function createPageUrl(pageName: string) {
    const raw = String(pageName || '').trim();
  
    // Mantener querystring si viene (ej: "Chat?alertId=123")
    const qIndex = raw.indexOf('?');
    const pathPart = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).trim();
    const queryPart = qIndex >= 0 ? raw.slice(qIndex) : '';
  
    // Mapeo de rutas reales (coinciden con pages.config.js)
    const ROUTES: Record<string, string> = {
      home: 'Home',
      chats: 'Chats',
      chat: 'Chat',
      history: 'History',
      navigate: 'Navigate',
      notifications: 'Notifications',
      notificationsettings: 'NotificationSettings',
      profile: 'Profile',
      settings: 'Settings',
      alertas: 'History', // alias por si alguien llama "Alertas"
    };
  
    // Normaliza: quita espacios y pasa a minúsculas
    const key = pathPart.replace(/\s+/g, '').toLowerCase();
  
    // Si está en el mapa, usa la ruta correcta; si no, respeta lo que venga
    const route = ROUTES[key] || pathPart;
  
    return '/' + route + queryPart;
  }