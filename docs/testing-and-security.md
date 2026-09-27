# Pruebas, seguridad y CI/CD

## Pruebas unitarias

Comando:

```bash
pnpm run test:coverage
```

Jest cubre los módulos críticos de protección de contraseñas, firma/verificación JWT y política de autorización de estados. El umbral está fijado en 80 % para sentencias, ramas, funciones y líneas de ese conjunto. El reporte generado se guarda en `reports/tests/coverage/` en formatos HTML y LCOV.

**Alcance:** la medición actual no incluye todas las rutas HTTP, componentes ni flujos de navegador. En particular, faltan pruebas de integración con PostgreSQL y pruebas de interfaz. Por eso, el porcentaje de cobertura de los módulos críticos no debe presentarse como cobertura global del sistema.

## Controles implementados

- Hash de contraseñas con scrypt y salt aleatoria.
- JWT HS256 firmado con `SESSION_SECRET`, con una hora de expiración.
- El rol no se acepta como `admin` en el registro público.
- El middleware consulta el rol vigente en la base de datos en cada solicitud protegida.
- Validación de entrada/salida basada en esquemas Zod generados desde OpenAPI.
- Drizzle ORM parametriza los valores de SQL.
- La API desactiva `X-Powered-By` y establece políticas de contenido para respuestas API, protección contra MIME sniffing/iframes y `Cache-Control: no-store`.
- Directorio público filtrado por organizaciones verificadas.
- Transiciones autorizadas: administración puede aprobar o rechazar donaciones pendientes; solo la organización destinataria puede aceptar una pendiente y confirmar después una aprobada como entregada.
- Eventos de estado guardan actor, estados anterior/nuevo y fecha.
- El logger no registra cuerpos de solicitud ni encabezados de autorización; la API limita JSON a 32 KB.
- El token en `sessionStorage` se elimina al cerrar sesión y al cerrar la pestaña/ventana; un XSS podría leerlo mientras la pestaña permanece abierta, por lo que producción debe mantener CSP estricta y revisar dependencias.

## Escáneres automatizados ejecutados

El 24 de septiembre de 2026 se ejecutaron la auditoría de dependencias, SAST y análisis de privacidad/flujo de datos disponibles en Replit. Los tres completaron sin hallazgos: **0 vulnerabilidades de dependencias** (0 críticas, altas, moderadas, bajas o informativas), **0 resultados SAST** y **0 resultados de privacidad**. El detalle y las limitaciones están en `reports/security/scan-results.md`.

## Resultado de Jest disponible

La última ejecución local reportó **3 suites y 13 pruebas aprobadas**. La cobertura observada en el alcance configurado fue:

| Métrica | Resultado |
| --- | ---: |
| Sentencias | 95.31 % |
| Ramas | 87.09 % |
| Funciones | 100 % |
| Líneas | 95.23 % |

Los reportes completos están en `reports/tests/coverage/`. Estos porcentajes se limitan a los módulos listados en `jest.config.cjs`.

## OWASP ZAP

**Estado: pendiente de ejecución contra staging.** No hay una URL pública de staging configurada en este repositorio; ejecutar un escaneo contra un servidor local inaccesible desde GitHub no produciría evidencia útil. El workflow `.github/workflows/ci.yml` ejecuta ZAP baseline al definir la variable de repositorio `STAGING_URL`. El artefacto de CI se conserva bajo `ecored-owasp-zap`.

La ausencia de un reporte no significa que se haya demostrado que no existan vulnerabilidades. Tras configurar `STAGING_URL`, revisar el reporte JSON/HTML, corregir hallazgos confirmados y volver a ejecutar el escaneo.

## SonarQube

**Estado: pendiente de conexión y ejecución.** `sonar-project.properties` define fuentes, exclusiones y el reporte LCOV. Para activar el job, agregar la variable `SONAR_HOST_URL` y el secreto `SONAR_TOKEN` al repositorio de GitHub. El job publica sus métricas en el servidor configurado; no se agregan valores ficticios de deuda técnica o code smells.

## Pipeline CI/CD

El workflow ejecuta:

1. Instalación reproducible desde `pnpm-lock.yaml`.
2. Regeneración de hooks y esquemas Zod desde OpenAPI.
3. Pruebas Jest con cobertura mínima configurada.
4. Typecheck de paquetes.
5. Build del API y del frontend.
6. Job opcional de SonarQube.
7. Job opcional de ZAP contra staging.
8. En la rama `staging`, notificación de despliegue a un webhook.

Para habilitar la notificación de despliegue automático en GitHub, configurar la variable `STAGING_DEPLOY_HOOK` y el secreto `STAGING_DEPLOY_TOKEN`. El webhook debe validar el token, recuperar el commit indicado y ejecutar el procedimiento de despliegue del proveedor. Mientras estas variables no existan, CI hace las comprobaciones de código pero no despliega la aplicación.

## Riesgos y trabajo pendiente

- El JWT se conserva en `sessionStorage` para cumplir el flujo Bearer de la actividad; una vulnerabilidad XSS podría acceder al token. Valorar cookies `HttpOnly`, renovación y protección CSRF antes de usar información real.
- No se configuró limitación de intentos de inicio de sesión ni verificación de correo.
- La cobertura no es global; añadir pruebas de integración para roles y persistencia.
- El escaneo ZAP requiere staging públicamente alcanzable.
- Las métricas de SonarQube requieren instancia y token propios del equipo.
