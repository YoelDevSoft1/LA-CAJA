import axios from 'axios';
import { useAuth } from '@/stores/auth.store'

// Detectar automáticamente la URL del API basándose en la URL actual
function getApiUrl(): string {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    throw new Error('VITE_API_URL is not set in production');
  }

  // Si estamos en localhost, usar localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // Si estamos accediendo desde la red (ej: 192.168.1.8:5173), usar la misma IP para el API
  const hostname = window.location.hostname;
  return `http://${hostname}:3000`;
}

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Timeout de 30 segundos (aumentado para importaciones largas)
});

// Interceptor para agregar token JWT y bloquear peticiones offline
api.interceptors.request.use(
  (config) => {
    // Bloquear peticiones si está offline
    if (!navigator.onLine) {
      return Promise.reject({
        code: 'ERR_INTERNET_DISCONNECTED',
        message: 'Sin conexión a internet',
        isOffline: true,
      });
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Variable para evitar múltiples redirecciones simultáneas
let isRedirecting = false;

// Variable para evitar múltiples refresh simultáneos
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Función para suscribirse a la resolución del refresh
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Función para notificar a todos los suscriptores
function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si es un error offline, no hacer nada más (ya fue manejado en el request interceptor)
    if (error.isOffline || error.code === 'ERR_INTERNET_DISCONNECTED') {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // ✅ OFFLINE-FIRST: Marcar error como no-retriable para React Query
      error.isAuthError = true;

      // Marcar que ya intentamos hacer refresh para este request
      originalRequest._retry = true;

      // 🔄 REFRESH TOKEN: Intentar renovar el token automáticamente
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        console.warn('[API] 401 pero no hay refresh_token - redirigiendo a login...');
        if (!isRedirecting && !window.location.pathname.includes('/login')) {
          isRedirecting = true;
          localStorage.removeItem('auth_token');
          useAuth.getState().logout();
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        return Promise.reject(error);
      }

      // Si ya hay un refresh en progreso, esperar a que termine
      if (isRefreshing) {
        console.log('[API] 🔄 Esperando refresh en progreso...');
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      console.log('[API] 🔄 Intentando renovar token con refresh_token...');

      try {
        // Hacer el refresh sin pasar por el interceptor (para evitar bucle)
        const response = await axios.post(
          `${originalRequest.baseURL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token: newRefreshToken } = response.data;

        console.log('[API] ✅ Token renovado exitosamente');

        // Actualizar tokens en localStorage y store
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);
        useAuth.getState().setToken(access_token);

        // Notificar a todos los requests que esperaban
        onRefreshed(access_token);

        // Actualizar el token en el request original y reintentarlo
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] ❌ Error al renovar token:', refreshError);
        isRefreshing = false;

        // Si falla el refresh, cerrar sesión
        if (!isRedirecting && !window.location.pathname.includes('/login')) {
          isRedirecting = true;
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          useAuth.getState().logout();
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }

        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      const auth = useAuth.getState()
      const currentUser = auth.user
      if (currentUser) {
        auth.setUser({
          ...currentUser,
          license_status: currentUser.license_status ?? 'suspended',
        })
      }
      window.location.href = '/license'
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
