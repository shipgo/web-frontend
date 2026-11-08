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

## En curso (ola 1, 4 workers sonnet en paralelo sobre archivos disjuntos, sin commitear)
- Tracking: `src/features/tracking/**`, `PublicLayout.jsx`, `estados.js` (solo agrega un export), `PortalEnvioDetalle`.
- Shell: `src/app/layout/**` (sin PublicLayout), `OperatingSucursalSelector`, `PageFooter`, `features/home`.
- Componentes compartidos de listas/detalles/formularios: `src/app/components/*` (GridData, FiltersList, headers, RowActionsMenu, SelectableItemList) y nuevos (`StickyActionBar`, `ActionMenu`, `ResponsiveModal`).
- Landing, login, registro, recuperar y `PortalEnvios` (búsqueda y chips).

## Pendiente
- [ ] Ola 0 tracking: sacar mapa y palabra de `TrackingResultado`, historial de un solo color, tarjeta de estado, búsqueda compacta, header público con "Ingresar".
- [ ] Ola 1 shell: cajón, header de una fila, sucursal y usuario en el cajón, footer con área segura, inicio en 2 columnas.
- [ ] Ola 2 listados: componentes compartidos (`ResponsiveList`, `FilterSheet`, header de lista, `RowActionsMenu`) y aplicarlos a las 8 listas.
- [ ] Ola 2 detalles: título compacto, `StickyActionBar`, secciones plegables, modales como hoja inferior.
- [ ] Ola 3 formularios: una columna, secciones plegables, mapa en hoja, selección en pestañas, campos de 48 px.
- [ ] Ola 4 mapa y dashboard.
- [ ] Ola 5 landing, login, registro y portal (búsqueda y chips por estado).
- [ ] Revisar a 390 px las pantallas no capturadas: crear usuario/vehículo/mantenimiento, editar, etiqueta, modales, 404, "usá la app", error de conexión, onboarding de empresa.

## Pendiente de backend (otro repo, ../backend)
- [ ] Quitar `ultimaUbicacionAprox` de `PublicTrackingDTO` y `PublicTrackingService` (línea ~54).
- [ ] Quitar `palabraEntrega` del endpoint público `/api/public/tracking/{codigo}` y del endpoint del portal (línea ~58). Mientras no se haga, el JSON sigue exponiéndola aunque la web la oculte.
- [ ] Actualizar contrato y tests de ese endpoint.

## Bitácora
- 2026-11-07: relevamiento (77 capturas) y artefacto de propuesta. Se crea la rama y este registro.
