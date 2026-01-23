/**
 * PM2 Ecosystem Configuration para LA-CAJA API
 * 
 * Uso:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 logs la-caja-api
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'la-caja-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 2, // Usar 2 instancias (cluster mode)
      exec_mode: 'cluster', // Cluster mode para mejor rendimiento
      
      // Variables de entorno
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Auto-restart
      autorestart: true,
      max_restarts: 10, // Máximo 10 reinicios en 1 minuto
      min_uptime: '10s', // Tiempo mínimo de uptime para considerar "estable"
      restart_delay: 4000, // Esperar 4s entre reinicios
      
      // Memory management
      max_memory_restart: '1G', // Reiniciar si usa más de 1GB por instancia
      
      // Watch mode (solo desarrollo)
      watch: false, // Desactivado en producción
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Advanced
      kill_timeout: 5000, // Tiempo para graceful shutdown
      listen_timeout: 10000, // Tiempo para que la app esté lista
      shutdown_with_message: true, // Graceful shutdown
      
      // Source map support
      source_map_support: true,
      
      // Instance vars
      instance_var: 'INSTANCE_ID',
    },
  ],
};
