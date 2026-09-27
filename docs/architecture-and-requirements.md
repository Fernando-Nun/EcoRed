# EcoRed: alcance y diseño del sistema

## Contexto

El avance original propone localizar centros de reciclaje y clasificar residuos. La actividad añade la gestión de donaciones entre personas y organizaciones sociales. EcoRed une ambas ideas: una persona registra materiales, elige una organización receptora y puede consultar la trazabilidad hasta la entrega.

## Objetivo

Facilitar donaciones responsables de materiales reutilizables o reciclables y ofrecer un registro verificable de quién dona, qué material se entrega, a qué organización y en qué estado está.

## Alcance de esta versión

### Incluido

- Registro e inicio de sesión para personas donantes y organizaciones; las organizaciones proporcionan nombre, municipio, descripción y categorías de materiales aceptadas.
- Roles de donante, organización y administrador; las altas públicas no pueden crear administradores.
- Directorio de organizaciones verificadas.
- Creación de donaciones por categoría, descripción, cantidad, unidad y destino; el destino debe estar verificado y aceptar esa categoría.
- Aceptación de donaciones pendientes por la organización destinataria; la administración también puede aprobarlas o rechazarlas.
- Confirmación de entrega por la organización destinataria después de aceptar o recibir una donación aprobada.
- Verificación administrativa de organizaciones nuevas.
- Resumen por rol, historial de actividad y peso entregado expresado únicamente en kg.
- Registro de eventos de estado para mantener trazabilidad.

### Fuera de la primera entrega

- Geolocalización y mapas.
- Recompensas digitales y notificaciones.
- Reportes gubernamentales o certificaciones de impacto ambiental.
- Integraciones con campañas municipales o plataformas de terceros.

## Actores

| Actor | Necesidad | Permisos principales |
| --- | --- | --- |
| Donante | Registrar y consultar sus donaciones | Crear donaciones y ver su historial |
| Organización receptora | Publicar su perfil y recibir materiales | Consultar donaciones dirigidas a ella, aceptarlas y confirmar las entregas |
| Administrador | Mantener confiable el directorio y los registros | Verificar organizaciones, aprobar/rechazar donaciones y consultar información global |

## Requisitos funcionales

1. El sistema permite registrar cuentas de donante y de organización.
2. El sistema asigna roles desde el servidor y no permite autoasignar el rol de administrador.
3. Una organización nueva requiere verificación administrativa para publicarse en el directorio.
4. Un donante puede registrar materiales destinados a una organización verificada que acepte la categoría seleccionada.
5. La donación inicia en estado `pending`.
6. Administración puede cambiar una donación pendiente a `approved` o `rejected`.
7. La organización destinataria puede cambiar una donación pendiente a `approved` (mostrada como «Aceptada») y después una donación aprobada a `delivered`.
8. Cada cambio de estado conserva actor, estado anterior, estado nuevo y fecha.
9. El panel presenta totales y actividad adecuados al rol.

`approved` es el estado interno compartido por la aceptación de la organización y la aprobación administrativa; la interfaz lo presenta como «Aceptada». La organización destinataria es el único actor que puede confirmar la entrega como `delivered`.

## Requisitos no funcionales

- Diseño responsive en español.
- Contraseñas no reversibles con sal aleatoria; sesiones firmadas como JWT.
- Validación de payloads con esquemas generados desde OpenAPI.
- Persistencia en PostgreSQL y consultas parametrizadas por Drizzle ORM.
- Los permisos se vuelven a consultar desde la base de datos en cada solicitud autenticada.
- Límite de 32 KB para cuerpos JSON de la API.
- La meta de pruebas unitarias se aplica a los módulos críticos de seguridad/autorización incluidos en el alcance de pruebas; la cobertura de rutas y UI queda documentada como brecha.

## Modelo de datos

- **users**: identidad, correo normalizado, hash de contraseña, rol y vínculo opcional a organización.
- **organizations**: nombre, municipio, descripción, categorías aceptadas y estado de verificación.
- **donations**: persona donante, organización receptora, categoría, descripción, cantidad, unidad y estado actual.
- **donation_events**: historial inmutable de los cambios de estado.

## Arquitectura técnica

La aplicación usa un frontend React/Vite, una API Express compartida y PostgreSQL con Drizzle ORM. `lib/api-spec/openapi.yaml` es la fuente de verdad del contrato. Orval genera hooks React Query para la interfaz y esquemas Zod para validar las solicitudes y respuestas. La autenticación usa JWT HS256 con expiración de una hora; el token se conserva en `sessionStorage` durante la sesión del navegador.
