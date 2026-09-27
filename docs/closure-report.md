# Informe de cierre: EcoRed

**Responsable:** Luis Fernando Núñez Díaz  
**Materia:** Ingeniería de Software  
**Docente:** Luis Carlos Tarango Colmenero  
**Fecha de corte:** 26 de septiembre de 2026

## Resumen ejecutivo

Se construyó un MVP web que conecta donantes de materiales con organizaciones receptoras. El flujo permite registrar donaciones a organizaciones verificadas que aceptan su categoría; la organización destinataria puede aceptar una donación pendiente y confirmar después la entrega. Administración conserva la opción de aprobar o rechazar donaciones pendientes. Los cambios se registran con actor y estados para mantener la trazabilidad.

La aplicación y la API están implementadas; la última ejecución de Jest aprobó 13 pruebas en 3 suites. La cobertura supera el 80 % en los módulos críticos configurados, pero no representa cobertura total de rutas ni de interfaz. El despliegue automático a staging, OWASP ZAP y SonarQube continúan pendientes de configuración externa y ejecución; no se reportan como completados.

Los análisis dinámicos de OWASP ZAP, el análisis de SonarQube y el despliegue automático no se reportan como ejecutados: falta enlazar una URL de staging y configurar el servicio de SonarQube y el webhook de despliegue en el repositorio GitHub. Sus workflows quedan preparados para activarse al proporcionar esa configuración.

## Comparación entre planificación e implementación

| Plan del avance inicial | Resultado de esta entrega | Evaluación |
| --- | --- | --- |
| Registrar ciudadanos y centros de reciclaje | Registro de donantes y organizaciones receptoras con roles distintos | Implementado en el MVP |
| Geolocalizar centros por tipo de residuo | Directorio de organizaciones y categorías aceptadas; sin mapa ni cálculo de distancia | Parcial; geolocalización se difiere |
| Clasificar materiales | Categorías de electrónicos, plásticos, vidrio, papel, metal, ropa, alimentos y otros | Implementado |
| Validar la información de los centros | Las organizaciones nuevas requieren aprobación administrativa | Implementado |
| Registrar y recibir donaciones con trazabilidad | El donante elige una organización verificada compatible; la organización receptora puede aceptar pendientes y confirmar entregas; administración puede aprobar o rechazar pendientes | Implementado en el MVP |
| Incentivos y notificaciones | No se añadieron recompensas ni avisos automáticos | Diferido para no ampliar el MVP |
| Reportes de impacto | Se muestra el peso entregado en kg; no se calculan equivalencias ambientales | Parcial; métricas avanzadas diferidas |
| Cuatro sprints en ocho semanas | Se priorizó una entrega funcional centrada en registro, seguridad y flujo de donación | El cronograma original no se puede comparar por días porque no se registraron fechas reales de sprint |
| Cobertura unitaria ≥80 % | Jest mide seguridad y reglas de transición de estado; la última ejecución obtuvo 95.31 % de sentencias, 87.09 % de ramas, 100 % de funciones y 95.23 % de líneas | Cumplido para esos módulos; no equivale a cobertura total de rutas y frontend |
| Auditoría estática/dependencias/privacidad | Escáneres disponibles en Replit ejecutados el 24 de septiembre de 2026 | 0 resultados en los tres escáneres; el detalle queda en `reports/security/scan-results.md` |
| OWASP ZAP y SonarQube | CI preparado para analizar una URL de staging y un servidor SonarQube | Pendiente de configuración y ejecución; no se inventan resultados |
| CI/CD con despliegue de prueba | CI valida código, pruebas y compilación; el paso de staging llama un webhook configurado por el equipo | El pipeline está definido; el despliegue queda condicionado a las credenciales/URL del proveedor |

## Lecciones aprendidas

1. **Alinear el alcance con la rúbrica desde el inicio.** El proyecto original incluía mapas, recompensas e informes, mientras la actividad pedía un módulo demostrable de donaciones y seguridad. Integrar el flujo de donaciones con centros de reciclaje mantuvo la continuidad sin intentar implementar todo en la primera versión.
2. **Diseñar permisos junto al flujo de negocio.** La administración puede aprobar o rechazar registros pendientes; la organización destinataria puede aceptar y confirmar la entrega. Restringir cada transición por actor y estado evita que donantes u organizaciones ajenas alteren el recorrido.
3. **La trazabilidad requiere un historial, no solo una etiqueta.** Mantener eventos de cambio conserva quién actuó y cuándo.
4. **Una cobertura parcial debe declararse con claridad.** La meta del 80 % aplica a los módulos críticos cubiertos por las pruebas unitarias, no al total de rutas y pantallas.
5. **La seguridad del despliegue depende de servicios externos.** ZAP, SonarQube y el destino de staging necesitan variables y credenciales que no son parte del código y deben cargarse en los secretos de GitHub.

## Plan de mejora continua

### Siguiente iteración

- Probar rutas con pruebas de integración: autenticación, aislamiento de datos por rol, verificación organizacional y transiciones concurrentes.
- Completar cobertura de API y UI y mantener el mínimo del 80 % en la lógica de dominio.
- Conectar el workflow a un staging real; ejecutar OWASP ZAP y conservar su reporte por cada despliegue.
- Configurar SonarQube y establecer una línea base para deuda técnica, code smells y duplicación.
- Agregar límites de intentos para autenticación, verificación de correo y mecanismo de revocación/renovación de sesión.

### Evolución del producto

- Integrar geolocalización y filtros de proximidad.
- Añadir notificaciones de cambios de estado y recordatorios.
- Calcular impacto únicamente con factores ambientales documentados y trazables.
- Diseñar recompensas con reglas auditables para evitar incentivos manipulables.
- Incorporar reportes descargables para organizaciones y gobiernos locales.

## Estado de cierre

El MVP de aplicación queda implementado y ejecutable. Las pruebas unitarias y los tres análisis de seguridad ejecutados en Replit están resumidos en `reports/`; no equivalen a un escaneo OWASP ZAP. Los resultados de ZAP y SonarQube y el despliegue automático a staging quedan explícitamente pendientes hasta configurar y ejecutar esos servicios en CI. El workflow no debe interpretarse como evidencia de que ya se realizaron.
