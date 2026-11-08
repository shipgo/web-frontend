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

- [x] Ola 2 (commit 6d53fe8 + pulido): listas en tarjetas con hoja de filtros, detalles con acción fija y secciones plegables, formularios en una columna, mapa a pantalla completa con hoja de viajes, dashboard 2×2, notificaciones, onboarding y pantallas 404/error/"usá la app". Cubre envíos, viajes, usuarios, vehículos, marcas, modelos, mantenimientos y sucursales.
- [x] Pulido tras revisar a 390 px: "Cancelar viaje" en rojo cuando es la única acción (`StickyActionBar` ahora acepta `color`), nombre completo en tarjetas de usuario (`ListCard` acepta `badgeBelow`), selector "Retiro en sucursal" que envuelve, hero de tracking entregado en el mismo color que el historial, atribución de Mapbox visible sobre la hoja, aire bajo la lista cuando hay selección activa.
- Verificación: suite completa 163 archivos / 1343 tests OK, `eslint .` 0 errores (8 warnings que ya existían), build OK; escritorio comparado contra las capturas del relevamiento (envíos, detalle, mapa, crear viaje) sin cambios. Mobile visto a 390 px en iframe: landing, login, tracking, shell y cajón, lista y detalle de envíos, crear envío, lista/detalle/crear viaje, usuarios, vehículos, mapa, dashboard.

## Pendiente (para retomar en otra sesión)
Verificación visual a 390/360 px de lo que NO se vio todavía:
- [ ] Detalle y crear/editar de usuario y vehículo, mantenimientos, sucursales, marcas/modelos, historial de notificaciones, onboarding de empresa, 404, "usá la app", error de conexión, etiqueta de envío, recuperar cuenta con token, verificar cuenta, portal (lista y detalle) tras los cambios.
- [ ] Dropdowns de `Select`/`MultiSelect` dentro de los acordeones de usuarios/vehículos, modal del selector de rango del dashboard, etiquetas de ejes de los gráficos.
- [ ] Probar en un teléfono real: teclado abierto en login/registro/formularios, safe-area, arrastre de la hoja del mapa (choque de gestos con el mapa), primer render del mapa mobile, scroll de listas virtualizadas (Virtuoso) dentro de acordeones plegados.
Cosas que quedaron distintas de la propuesta:
- [ ] Crear/editar envío, mantenimiento y sucursal: tarjetas apiladas sin `Accordion` (si un error cae en una sección cerrada no se vería). Crear envío: el mapa va debajo del campo con 240 px, sin hoja a pantalla completa; falta probar si el arrastre del mapa pelea con el scroll de la página.
- [ ] Modales de eliminar (`useDeleteMantenimiento`, `useDeleteSucursal`, `useDeleteMarca`, `useDeleteModelo`, y similares) siguen `centered`; pasarlos a `fullScreen: isMobile`.
- [ ] CrearViaje: al cambiar de pestaña "Pendientes"/"Incluidos" se pierde el texto del buscador y la selección no pasada a "Incluidos". Listas de vehículos y choferes con alto fijo de 500 px apiladas.
- [ ] Las tarjetas no tienen "seleccionar todos" (solo checkbox por tarjeta; el `SelectionBanner` permite limpiar).
- [ ] `CambiarPasswordCard` (`src/app/components`) no usa `useFieldSize`: sus inputs pueden quedar con texto menor a 16 px en mobile.
- [ ] Tooltips de info (KPIs y gráficos del dashboard) dependen de hover y no funcionan en táctil.
- [ ] Subtítulo de las cabeceras de lista se corta con puntos suspensivos ("Administrá los usuarios de la pl…"): dejar que envuelva o use `lineClamp`.
- [ ] `EtiquetaEnvio`: la flecha "Volver" de mobile lleva a la lista, no al detalle.
- [ ] "Filtros (N)": el rango de fechas cuenta como 2 filtros.
- [ ] Portal: búsqueda y contadores cuentan solo la página cargada (`useMisEnvios(page)`).
- [ ] Footer fijo en iOS: el `padding-bottom` de safe-area reduce el alto útil (alto fijo de 70 px); subir el alto en `AppShell footer` si queda justo.
- [ ] Etiqueta del burger pasa a "Cerrar menú" pero el scrim lo tapa con el cajón abierto.
- [ ] Hay un caso donde el detalle de viaje deja "Cancelar viaje" como acción única (estado listo para salir): ya va en rojo; confirmar que ese es el comportamiento deseado.
Cierre de la rama:
- [ ] Decidir si se pushea `feat/web-mobile` y se abre PR (no se hizo; el owner decide). La rama tiene 4 commits sobre `main` @ a05ca76.
- [ ] Actualizar el artefacto "Web mobile ShipGo" marcando lo hecho (opcional).

## Pendiente de backend (otro repo, ../backend)
- [ ] Quitar `ultimaUbicacionAprox` de `PublicTrackingDTO` y `PublicTrackingService` (línea ~54).
- [ ] Quitar `palabraEntrega` del endpoint público `/api/public/tracking/{codigo}` y del endpoint del portal (línea ~58). Mientras no se haga, el JSON sigue exponiéndola aunque la web la oculte.
- [ ] Actualizar contrato y tests de ese endpoint.

## Bitácora
- 2026-11-07: relevamiento (77 capturas) y artefacto de propuesta. Se crea la rama y este registro.
- 2026-11-07: ola 1 completa y commiteada (e57a5f0).
- 2026-11-07: ola 2 completa (6d53fe8) con pulido posterior; verificación a 390 px en iframe. Backend pendiente (ver arriba).
