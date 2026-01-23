#!/bin/bash

# Script de backup automático para base de datos LA-CAJA
# Uso: ./scripts/backup-db.sh
# Configurar en crontab para backups automáticos: 0 2 * * * /path/to/backup-db.sh

set -e

# Configuración
BACKUP_DIR="${HOME}/backups/la-caja"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Cargar variables de entorno desde .env
if [ -f "apps/api/.env" ]; then
  export $(cat apps/api/.env | grep -v '^#' | xargs)
fi

# Verificar que DATABASE_URL esté configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL no está configurada"
  exit 1
fi

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup
BACKUP_FILE="$BACKUP_DIR/db_$DATE.sql"

echo "🔄 Iniciando backup de base de datos..."
echo "📁 Destino: $BACKUP_FILE"

# Realizar backup usando pg_dump
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
  echo "✅ Backup SQL creado exitosamente"
else
  echo "❌ ERROR: Fallo al crear backup"
  exit 1
fi

# Comprimir backup
echo "📦 Comprimiendo backup..."
if gzip "$BACKUP_FILE"; then
  BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
  BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
  echo "✅ Backup comprimido: $BACKUP_FILE_GZ ($BACKUP_SIZE)"
else
  echo "⚠️  ADVERTENCIA: No se pudo comprimir el backup"
fi

# Limpiar backups antiguos (mantener solo últimos N días)
echo "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
DELETED=$(find "$BACKUP_DIR" -name "db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l | tr -d ' ')
if [ "$DELETED" -gt 0 ]; then
  echo "🗑️  Eliminados $DELETED backups antiguos"
else
  echo "✅ No hay backups antiguos para eliminar"
fi

# Listar backups actuales
echo ""
echo "📋 Backups disponibles:"
ls -lh "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | tail -5 || echo "  (ninguno)"

echo ""
echo "✅ Backup completado exitosamente"
echo "📊 Espacio usado: $(du -sh "$BACKUP_DIR" | cut -f1)"
