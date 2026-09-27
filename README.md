# EcoRed — Donaciones y reciclaje

EcoRed conecta a personas que donan materiales reutilizables o reciclables con centros de acopio y organizaciones sociales. La plataforma registra cada donación, aplica validación por roles y conserva el historial de cambios de estado.

## Funciones incluidas

- Registro e inicio de sesión con contraseñas protegidas y tokens JWT.
- Registro de organizaciones con municipio, descripción y categorías para revisión administrativa.
- Roles de donante, organización receptora y administrador.
- Registro de donaciones con categoría, cantidad, unidad y destino.
- El formulario ofrece organizaciones verificadas que reciben la categoría elegida; la API vuelve a validar estos requisitos.
- Directorio público de organizaciones verificadas.
- Revisión administrativa de organizaciones y aprobación o rechazo de donaciones pendientes.
- Aceptación de donaciones pendientes y confirmación posterior de la entrega por la organización destinataria.
- Panel con actividad reciente y peso confirmado en kilogramos.
- Interfaz responsive en español.

## Ejecutar en Replit

Los servicios de la aplicación ya están configurados en el proyecto. Para ejecutarlos manualmente:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/ecored run dev
```

Requisitos de entorno:

- `DATABASE_URL`: conexión PostgreSQL del entorno.
- `SESSION_SECRET`: secreto de al menos 32 caracteres para firmar JWT. Debe guardarse en Secrets y no en el repositorio.

La base de datos de desarrollo se actualiza con:

```bash
pnpm --filter @workspace/db run push
```

## Cuentas y roles

1. Registra una cuenta de donante o una cuenta de organización desde la aplicación.
2. Las organizaciones nuevas quedan pendientes de verificación; el administrador debe aprobarlas antes de que aparezcan en el directorio público.
3. Para preparar una cuenta administradora en un entorno de desarrollo, registra primero una cuenta y cambia su rol desde la base de datos de desarrollo:

```sql
UPDATE users
SET role = 'admin'
WHERE email = lower('correo-de-la-cuenta@ejemplo.mx');
```

No se permite elegir el rol administrador desde el formulario público.

## Calidad y seguridad

```bash
pnpm run test:coverage
pnpm run typecheck
pnpm run build
```

La configuración de Jest aplica un mínimo de 80 % a las líneas, ramas, funciones y sentencias de los módulos críticos de seguridad y autorización cubiertos por pruebas unitarias. El reporte identifica ese alcance; no representa cobertura completa de cada ruta HTTP ni de la interfaz. En la última ejecución documentada se aprobaron 13 pruebas en 3 suites, con 95.31 % de sentencias, 87.09 % de ramas, 100 % de funciones y 95.23 % de líneas en ese alcance.

El workflow `.github/workflows/ci.yml` ejecuta generación OpenAPI, Jest, verificación de tipos y compilación. El análisis SonarQube, el escaneo OWASP ZAP y la notificación de despliegue a staging se activan al configurar las variables y secretos indicados en `docs/testing-and-security.md`.

## Documentación

- `docs/architecture-and-requirements.md`: alcance, actores, requisitos y arquitectura.
- `docs/closure-report.md`: comparación entre la planificación inicial y lo ejecutado, lecciones y mejora continua.
- `docs/testing-and-security.md`: evidencia disponible y configuración pendiente de ZAP/SonarQube/staging.
- `docs/Informe_de_cierre_EcoRed.docx`: informe de cierre para entregar.
- `reports/`: resultados reproducibles de pruebas y análisis.
- `artifacts/ecored/deliverables/EcoRed-entrega.zip`: repositorio Git con código y reportes.

El ZIP de entrega contiene un repositorio limpio con un commit de snapshot; no arrastra el historial privado del workspace.

Para regenerar el informe Word o el ZIP:

```bash
python3 scripts/generate_report.py
python3 scripts/package_delivery.py
```

## Arquitectura resumida

- Frontend: React, TypeScript, Vite y React Query.
- API: Express 5, OpenAPI, validación Zod y JWT firmado con `SESSION_SECRET`.
- Persistencia: PostgreSQL y Drizzle ORM.
- Contrato compartido: `lib/api-spec/openapi.yaml`; ejecutar codegen después de editarlo.
