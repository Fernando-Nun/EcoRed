# Reporte de pruebas unitarias — EcoRed

**Fecha de ejecución:** 24 de septiembre de 2026  
**Comando:** `pnpm run test:coverage`

## Resultado

- Suites: **3 aprobadas de 3**
- Pruebas: **11 aprobadas de 11**
- Cobertura total de los módulos incluidos en Jest:
  - Sentencias: **95.00 %**
  - Ramas: **85.96 %**
  - Funciones: **100 %**
  - Líneas: **94.91 %**
- Umbral configurado: **80 %** en sentencias, ramas, funciones y líneas.

## Alcance medido

Se probaron las funciones de hash/verificación de contraseña, firma y validación JWT, los requisitos de perfil organizacional, y las transiciones permitidas para estados de donación. La cobertura no incluye las rutas HTTP, las consultas de base de datos ni los componentes de frontend. Los archivos HTML y LCOV de Jest están junto a este resumen en `reports/tests/coverage/`.
