import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile-optimizations.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// VitePWA registra automáticamente el Service Worker
// No registrar manualmente para evitar conflictos y loops infinitos

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutos por defecto - aprovechar vistas materializadas para datos más frescos
      gcTime: 1000 * 60 * 10, // 10 minutos - mantener en caché tiempo razonable
      retry: (failureCount, error: any) => {
        // ✅ OFFLINE-FIRST: NUNCA reintentar errores de autenticación (401)
        if (error?.response?.status === 401 || error?.isAuthError) {
          console.warn('[React Query] 401 detected - NO RETRY');
          return false;
        }

        // ✅ OFFLINE-FIRST: NUNCA reintentar errores offline (ya están manejados)
        if (error?.isOffline || error?.code === 'ERR_INTERNET_DISCONNECTED') {
          console.warn('[React Query] Offline detected - NO RETRY');
          return false;
        }

        // Para otros errores, reintentar máximo 2 veces
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana (evitar refetches innecesarios)
      refetchOnReconnect: true, // Refetch cuando se recupera conexión
      refetchOnMount: false, // No refetch al montar si hay datos en caché (usar cache primero)
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // ✅ OFFLINE-FIRST: NUNCA reintentar mutations con errores de auth
        if (error?.response?.status === 401 || error?.isAuthError) {
          return false;
        }

        // ✅ OFFLINE-FIRST: Mutations offline se manejan con sync service
        if (error?.isOffline || error?.code === 'ERR_INTERNET_DISCONNECTED') {
          return false;
        }

        // Reintentar una vez para otros errores
        return failureCount < 1;
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
)
