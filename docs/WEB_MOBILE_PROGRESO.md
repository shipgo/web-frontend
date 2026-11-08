# Web mobile: registro de avance

Objetivo: que toda la web funcione en el navegador de un celular. Propuesta de diseño completa en el artefacto
"Web mobile ShipGo" (https://claude.ai/artifact/Js4EpWpE4pwjGLjtzHQNh3). Rama de trabajo: `feat/web-mobile` (desde `main` @ a05ca76).
Sin tareas SHG-FE: se hace todo en esta rama y este archivo es el registro. Al retomar en otra sesión, leer este archivo y seguir por "Pendiente".

## Decisiones tomadas
- Navegación mobile de gestión: **cajón** con hamburguesa (aprobada por el owner).
- Tablas en mobile: **tarjetas por fila** (recomendación, no contradicha).
- Palabra de entrega: **solo por email** (opción A). La web no la muestra. Requiere cambio de backend (ver "Pendiente de backend").
- Ubicación del transportista: se quita de la web y debe quitarse del DTO público.
- Landing: campo de seguimiento en el hero (hipótesis sin medir).
- Corte mobile único: `< sm` (768 px) con `useIsMobile` (`src/app/hooks/useIsMobile.js`). Mismo corte en CSS: `visibleFrom`/`hiddenFrom="sm"`.
- Modelos de los workers: solo sonnet o haiku.

## Reglas para quien toque código
- Objetivos táctiles de al menos 44 px; campos con texto de 16 px (`size="md"` en mobile); sin scroll horizontal del body.
- `100dvh` y `env(safe-area-inset-bottom)` en todo lo fijo abajo.
- Verificar a 360/390/768 px. Técnica sin teléfono: iframe same-origin de 390 px dentro de una página de `localhost:5173`.
- No usar `git stash` (compartido entre worktrees). No commitear fuera de lo pedido.

## Hecho
- [x] Rama `feat/web-mobile` y hook `useIsMobile`.
- [x] Ola 1 (commit e57a5f0), verificada a 390 px en navegador:
  - Shell: cajón con hamburguesa, header de una fila, sucursal y usuario dentro del cajón (toda la navegación, Manual y usuario en una sola zona que scrollea), footer con área segura, inicio en 2 columnas.
  - Tracking: sin ubicación ni palabra en la UI, tarjeta de estado con avance, historial de un solo color en orden descendente, búsqueda compacta, botón "Ingresar" en el header público. Landing a 390 px: de 3.984 a 1.639 px de alto.
  - Componentes compartidos (`src/app/components`): `ResponsiveList`, `ListCard`, `FilterSheet`, `StickyActionBar`, `ActionMenu`, `ResponsiveModal`, `AvailableSelectedTabs`, `useFieldSize`; `PageHeader`/`PageBreadcrumbsHeader` con `primaryAction`/`secondaryActions`; `RowActionsMenu`, `ResultsCounter` y `PageContainer` responsive. Todavía NINGUNA pantalla los usa (eso es la ola 2).
  - Landing con seguimiento en el hero, accesos en filas, login/registro/recuperar y portal (búsqueda por código y chips por estado, filtra solo la página cargada).
  - Copy de la landing corregido: ya no promete "ubicación" ni "tiempo real".

## Pendiente de pulido de la ola 1
- [ ] Tracking: segmentos del hero en verde (`green` de Mantine) y puntos del historial en color primario; unificar a un solo color.
- [ ] Campana de notificaciones y `PublicLayout`: objetivo táctil de 44 px y ancho a 360 px sin verificar.
- [ ] Footer fijo en iOS: el `padding-bottom` de safe-area reduce el alto útil (alto fijo de 70 px); subir el alto en `AppShell footer` si queda justo.
- [ ] Portal: filtro y contadores cuentan solo la página cargada (`useMisEnvios(page)`); con más de 10 envíos no cubren todo.
- [ ] Etiqueta del burger cambia a "Cerrar menú" pero el scrim lo tapa abierto.

## En curso (ola 2: 5 workers sonnet en paralelo, una carpeta de features por worker, sin tocar `src/app/components`)
- Envíos (`features/envios`): lista, detalle, crear, editar.
- Viajes (`features/viajes`): lista, detalle, crear, editar.
- Usuarios y vehículos.
- Catálogo (marcas/modelos), mantenimientos y sucursales.
- Mapa, dashboard, historial de notificaciones, onboarding y pantallas sueltas (404, "usá la app", error de conexión).

## Pendiente
- [ ] Revisar la ola 2 a 390 px en el navegador, corregir y commitear.
- [ ] Revisar a 390 px lo que no se pudo capturar: etiqueta de envío (impresión), modales, onboarding de empresa.
- [ ] Pasada final: suite completa de vitest con `--maxWorkers=2`, build, lint, y pasada visual de escritorio para confirmar que no cambió.
- [ ] Probar en un teléfono real (teclado, safe-area, gestos de mapa): lo verificado hasta acá es un iframe de 390 px.

## Pendiente de backend (otro repo, ../backend)
- [ ] Quitar `ultimaUbicacionAprox` de `PublicTrackingDTO` y `PublicTrackingService` (línea ~54).
- [ ] Quitar `palabraEntrega` del endpoint público `/api/public/tracking/{codigo}` y del endpoint del portal (línea ~58). Mientras no se haga, el JSON sigue exponiéndola aunque la web la oculte.
- [ ] Actualizar contrato y tests de ese endpoint.

## Bitácora
- 2026-11-07: relevamiento (77 capturas) y artefacto de propuesta. Se crea la rama y este registro.
- 2026-11-07: ola 1 completa y commiteada (e57a5f0). Arranca la ola 2.
