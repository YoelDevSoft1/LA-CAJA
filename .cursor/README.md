# Cursor Configuration & Prompts
## Sistema Optimizado de Prompts para Agentes de IA

Este directorio contiene la configuración optimizada para usar agentes de IA en Cursor de manera eficiente.

## 📁 Estructura

```
.cursor/
├── README.md (este archivo)
├── prompts/
│   ├── backend.md      # Prompt para desarrollador backend
│   ├── frontend.md     # Prompt para desarrollador frontend
│   ├── ml.md           # Prompt para ingeniero ML
│   ├── devops.md        # Prompt para ingeniero DevOps
│   ├── qa.md           # Prompt para ingeniero QA
│   ├── data.md         # Prompt para ingeniero de datos
│   ├── security.md     # Prompt para ingeniero de seguridad
│   └── architect.md    # Prompt para arquitecto de software
└── .cursorrules        # (en raíz) Reglas generales del proyecto
```

## 🚀 Uso Rápido

### Método 1: Mencionar el Rol en el Chat

En el chat de Cursor, simplemente menciona el rol al inicio:

```
@backend Implementa un endpoint para gestionar turnos de cajeros
```

```
@frontend Crea un componente de dashboard de ventas en tiempo real
```

```
@ml Desarrolla un modelo para predecir demanda de productos
```

### Método 2: Usar el Prompt Completo

1. Abre el archivo del prompt correspondiente (`.cursor/prompts/[rol].md`)
2. Copia el contenido
3. Pégalo al inicio de tu conversación en Cursor
4. Luego escribe tu solicitud

### Método 3: Referenciar desde .cursorrules

El archivo `.cursorrules` en la raíz ya incluye las reglas generales. Cursor lo lee automáticamente.

## 📋 Roles Disponibles

| Rol | Comando | Descripción |
|-----|---------|-------------|
| **Backend** | `@backend` | NestJS, Event Sourcing, APIs |
| **Frontend** | `@frontend` | React, PWA, Offline-First |
| **ML Engineer** | `@ml` | Python, TensorFlow, Forecasting |
| **DevOps** | `@devops` | Docker, CI/CD, Infrastructure |
| **QA** | `@qa` | Testing, Automation, Quality |
| **Data Engineer** | `@data` | Analytics, TimescaleDB, ETL |
| **Security** | `@security` | OWASP, JWT, Encryption |
| **Architect** | `@architect` | System Design, DDD, Scalability |

## 💡 Mejores Prácticas

### 1. Contexto Específico
Siempre proporciona contexto específico de la tarea:
```
@backend Implementa un endpoint POST /shifts/open que:
- Valide que no haya un turno abierto
- Cree un evento ShiftOpenedEvent
- Retorne el turno creado
```

### 2. Referencias al Código
Menciona archivos o patrones existentes:
```
@frontend Crea un componente similar a ProductsPage pero para gestionar turnos
```

### 3. Restricciones Específicas
Menciona restricciones importantes:
```
@backend El endpoint debe funcionar offline, generar eventos y validar store_id
```

### 4. Ejemplos del Codebase
Si es posible, referencia ejemplos existentes:
```
@backend Sigue el mismo patrón que CashModule para implementar ShiftModule
```

## 🔧 Configuración Avanzada

### Personalizar Prompts

Puedes editar los archivos en `.cursor/prompts/` para ajustarlos a tus necesidades específicas.

### Agregar Nuevos Roles

1. Crea un nuevo archivo `.cursor/prompts/[nuevo-rol].md`
2. Sigue la estructura de los prompts existentes
3. Actualiza esta documentación

### Integrar con .cursorrules

El archivo `.cursorrules` en la raíz es leído automáticamente por Cursor. Incluye:
- Reglas generales del proyecto
- Convenciones de código
- Patrones específicos
- Referencias a roles

## 📚 Documentación Completa

Para prompts más detallados con ejemplos y técnicas avanzadas, ver:
- `docs/PROMPTS_AGENTES_DESARROLLO.md` - Documentación completa con todas las técnicas

## 🎯 Ejemplos de Uso

### Ejemplo 1: Implementar Feature Backend
```
@backend 

Necesito implementar el módulo de turnos (shifts) con:
- Apertura de turno con arqueo inicial
- Cierre de turno con corte X y Z
- Historial de turnos por cajero

Sigue el patrón de CashModule y genera eventos para todas las acciones.
```

### Ejemplo 2: Crear Componente Frontend
```
@frontend

Crea un componente ShiftManagement que:
- Muestre el turno actual si existe
- Permita abrir un nuevo turno
- Muestre historial de turnos
- Funcione completamente offline

Usa React Query para data fetching y Zustand para estado local.
```

### Ejemplo 3: Modelo ML
```
@ml

Desarrolla un modelo de predicción de demanda que:
- Use datos históricos de ventas
- Prediga demanda por producto para los próximos 7 días
- Tenga latencia < 100ms para real-time
- Sea interpretable

Integra con el backend NestJS mediante FastAPI.
```

## 🔄 Actualización

Los prompts se actualizan periódicamente. Para la versión más reciente:
1. Revisa `docs/PROMPTS_AGENTES_DESARROLLO.md`
2. Sincroniza los archivos en `.cursor/prompts/`

## 📝 Notas

- Cursor lee automáticamente `.cursorrules` de la raíz
- Los prompts modulares permiten activar roles específicos
- Puedes combinar roles: `@backend @security` para seguridad en backend
- Los prompts usan técnicas avanzadas: Chain-of-Thought, Few-Shot, Self-Criticism

---

**Última actualización:** Enero 2025

