import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

/**
 * Decorador para documentar endpoints que requieren autenticación
 */
export function ApiAuth() {
  return applyDecorators(ApiBearerAuth('JWT-auth'));
}

/**
 * Decorador para documentar endpoints con respuestas comunes
 */
export function ApiCommonResponses() {
  return applyDecorators(
    ApiResponse({
      status: 401,
      description: 'No autenticado - Token JWT inválido o faltante',
    }),
    ApiResponse({
      status: 403,
      description: 'No autorizado - Permisos insuficientes',
    }),
    ApiResponse({
      status: 500,
      description: 'Error interno del servidor',
    }),
  );
}

/**
 * Decorador para documentar endpoints con paginación
 */
export function ApiPagination() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número de página (por defecto: 1)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Elementos por página (por defecto: 20)',
    }),
  );
}

/**
 * Decorador para documentar endpoints con filtro por store_id
 */
export function ApiStoreFilter() {
  return applyDecorators(
    ApiQuery({
      name: 'store_id',
      required: false,
      type: String,
      description: 'Filtrar por ID de tienda (automático desde JWT)',
    }),
  );
}

/**
 * Decorador completo para endpoints autenticados
 */
export function ApiAuthenticatedEndpoint(
  summary: string,
  description?: string,
  tag?: string,
) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ...(tag ? [ApiTags(tag)] : []),
    ApiAuth(),
    ApiCommonResponses(),
  );
}
