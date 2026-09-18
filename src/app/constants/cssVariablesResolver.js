import { v8CssVariablesResolver } from "@mantine/core";

/**
 * Envuelve el resolver oficial de compat v8 de Mantine (`v8CssVariablesResolver`,
 * usado para mantener los colores de la variante `light` iguales a v8 — ver
 * CLAUDE.md) para corregir tokens semánticos que ese resolver hereda de
 * v8 con contraste insuficiente (WCAG 2 AA, 4.5:1) — confirmado por axe-core
 * (`color-contrast`, impacto `serious`) en las rutas MVP auditadas:
 *
 * - `--mantine-color-dimmed` → `gray.6` (`#868e96`, ~3.3:1 contra blanco).
 *   Todo lo que usa `c="dimmed"` (subtítulos, KPIs, `EmptyState`, etc.).
 *   Rama `light` — SHG-FE-041.
 * - `--mantine-color-placeholder` → `gray.5` (`#adb5bd`, ~2.1:1). Placeholder
 *   de cualquier input (`DatePickerInput`/`DateTimePicker` vacíos, etc.).
 *   Rama `light` — SHG-FE-041.
 * - `--shg-badge-text-orange` / `--shg-badge-text-green` / `--shg-button-text-green` /
 *   `--shg-button-text-red`: el texto de `<Badge variant="light"
 *   color="orange|green">` ("En camino"/"Entregado"/"Finalizado") y de
 *   `<Button variant="light" color="green|red">` (acciones
 *   Entregar/Marcar fallo/Finalizar/Cancelar). Esos colores ya usan el shade
 *   MÁS OSCURO de su escala [9] y el fondo tintado que arma `variant="light"`
 *   sigue sin llegar a 4.5:1 con el shade default — por eso `estadoBadge`/
 *   `BUTTON_ACTION_TEXT_COLOR` (`@domain/estados`) no fuerzan un color fijo,
 *   sino que apuntan `c` a estos tokens, que sí cambian por `light`/`dark`.
 *   Valores `light` confirmados por axe-core en SHG-FE-041/045 (contra el
 *   fondo tintado claro: `orange`/`green` shade [9] con 10% de alpha sobre
 *   blanco). Valores `dark` agregados en SHG-FE-060: el resolver v8 no tenía
 *   rama `dark` para estos tokens (el fondo tintado en dark mode usa un
 *   shade más claro de la escala [7] con 15% de alpha sobre `dark.7`, texto
 *   shade [9] de la escala se funde con ese fondo — casi ilegible,
 *   confirmado en vivo) — se resuelve apuntando el texto a un shade CLARO de
 *   la misma escala (`orange-5`/`green-5`/`red-4`, ya definidos por
 *   `v8CssVariablesResolver` en `result.variables`, no dependen de scheme),
 *   confirmado ≥4.5:1 por axe-core real contra `/envios` y `/viajes` en dark
 *   mode (ver `e2e/cases/axe-dark-mode-badges.js`).
 *
 * SHG-FE-067 (auditoría real de dark mode, encontrada corriendo axe-core en
 * `e2e/cases/axe-dark-mode-badges.js` — antes sólo forzaba dark mode para
 * los 3 tokens de arriba, nunca se había auditado el resto):
 *
 * - `--mantine-color-dimmed`/`--mantine-color-placeholder` en rama `dark`:
 *   nunca existían (el comentario viejo de este archivo decía "sólo light,
 *   el resto no mostró problemas" — resultó ser una suposición nunca
 *   verificada, no una auditoría real). El resolver v8 les da por default
 *   `dark.2` (`#828282`, dimmed) y `dark.3` (`#696969`, placeholder) — contra
 *   los fondos reales de la app (`#212529`/`#242424`/`#2e2e2e`) dan
 *   3.53–4.03:1 y 2.47:1 respectivamente axe-core en mano. Se resuelve
 *   apuntando ambos a `dark.1` (`#b8b8b8`), que da ≥6.8:1 contra esos mismos
 *   fondos (mismo patrón: shade ya existente de la escala `dark`, no un
 *   color nuevo).
 * - `--shg-badge-text-indigo`: análogo a `--shg-badge-text-orange`/`-green`
 *   pero para `<Badge variant="light" color="indigo">` ("En vehículo",
 *   `ESTADO_ENVIO.en_vehiculo`) — el único color de los 4 mapas `ESTADO_*`
 *   sin override que falló al auditar los 4 completos en dark mode (todos
 *   los demás — `gray`/`cyan`/`blue`/`red`/`yellow` — pasan con su shade
 *   default tanto en `light` como en `dark`, confirmado por axe-core real,
 *   no descartados a ojo). Rama `light`: `indigo-9` (`#364fc7`), que es
 *   exactamente el shade default que ya usa `variant="light"` en light mode
 *   (confirmado ≥4.5:1 por axe-core — SHG-FE-041) — se fija explícito acá
 *   sólo porque `estadoBadge` ahora pasa `c` con este token para `indigo`
 *   también, no porque haya cambiado nada visualmente en light mode. Rama
 *   `dark`: `indigo-3` (`#91a7ff`) reemplaza el shade default `indigo-4`
 *   (`#748ffc`, 4.02:1 contra su fondo tintado) — confirmado ≥4.5:1 por
 *   axe-core real (ver `e2e/cases/axe-dark-mode-badges.js`).
 *
 * Ajuste puntual: no se inventa ningún color nuevo (todos los tokens de dark
 * mode son shades ya existentes de la MISMA escala orange/green/red/dark/
 * indigo), no se toca `COLOR_PALETTE` ni el resto de `v8CssVariablesResolver`.
 *
 * SHG-FE-069 (bug detectado y pospuesto dos veces — SHG-FE-060, SHG-FE-067 —
 * sin abrir tarea de seguimiento, ver nit del `revisor` en la revisión de
 * PR #148):
 *
 * - `--shg-button-text-primary`: análogo a `--shg-button-text-green`/`-red`
 *   pero para `<Button variant="light">` SIN `color` explícito, es decir
 *   usando el color PRIMARIO del theme (`colorPalette`, teal —
 *   `COLOR_PALETTE` en `constants/colorPalette.js`), como el botón "Ver
 *   viaje" de `DetalleEnvio`. Con `primaryShade: 9` (único valor, misma
 *   sombra en `light`/`dark` — `theme.js`), el default de
 *   `v8CssVariablesResolver` para `--mantine-color-colorPalette-light-color`
 *   en dark mode es el shade `primaryShade - 5 = 4` (`#26a69a`) — el mismo
 *   shade que mide axe-core en este botón, ~4.05:1 contra el fondo tintado
 *   de `variant="light"` (`alpha(colorPalette-7, .15)` sobre el fondo real
 *   de la card, `dark.6`/`#2e2e2e`), por debajo de 4.5:1. Rama `light`: sin
 *   cambios de verdad, sólo se fija explícito el mismo shade que ya usa por
 *   default (`colorPalette-9`, `primaryShade`) para no depender de la cadena
 *   `--mantine-primary-color-light-color` → ... Rama `dark`: `colorPalette-2`
 *   (`#80cbc4`) en vez del shade 4 default — mismo patrón que
 *   `--shg-badge-text-indigo` (shade ya existente de la MISMA escala, no un
 *   color nuevo), confirmado ≥4.5:1 por axe-core real (ver
 *   `e2e/cases/axe-dark-mode-badges.js`).
 * - No se agrega a `BUTTON_ACTION_TEXT_COLOR` (`@domain/estados`): ese mapa
 *   es semántica de acción positiva/negativa (`green`/`red`, Entregar/
 *   Cancelar/etc.), no aplica a "Ver viaje" (sin semántica de estado, sólo
 *   el color primario del theme) — se referencia el token directo en el
 *   `Button` que lo necesita, igual que cualquier otro `c="var(--shg-...)"`
 *   de este archivo.
 * - Auditados el resto de los `<Button variant="light">` en las pantallas
 *   que ya cubre `e2e/cases/axe-dark-mode-badges.js` (`/envios`, `/viajes`,
 *   `/vehiculos`, `/envios/:id`, `/viajes/:id`): todos los demás pasan
 *   `color` explícito (`green`/`red`/`blue`, no el primario) — "Ver viaje"
 *   es el único caso real de este bug en esas pantallas.
 */
export const cssVariablesResolver = (theme) => {
  const result = v8CssVariablesResolver(theme);
  return {
    ...result,
    light: {
      ...result.light,
      "--mantine-color-dimmed": "var(--mantine-color-gray-7)",
      "--mantine-color-placeholder": "var(--mantine-color-gray-7)",
      "--shg-badge-text-orange": "#99350a",
      "--shg-badge-text-green": "#1f6e33",
      "--shg-badge-text-indigo": "var(--mantine-color-indigo-9)",
      "--shg-button-text-green": "#1f6e33",
      "--shg-button-text-red": "#a51818",
      "--shg-button-text-primary": `var(--mantine-color-${theme.primaryColor}-9)`,
    },
    dark: {
      ...result.dark,
      "--mantine-color-dimmed": "var(--mantine-color-dark-1)",
      "--mantine-color-placeholder": "var(--mantine-color-dark-1)",
      "--shg-badge-text-orange": "var(--mantine-color-orange-5)",
      "--shg-badge-text-green": "var(--mantine-color-green-5)",
      "--shg-badge-text-indigo": "var(--mantine-color-indigo-3)",
      "--shg-button-text-green": "var(--mantine-color-green-5)",
      "--shg-button-text-red": "var(--mantine-color-red-4)",
      "--shg-button-text-primary": `var(--mantine-color-${theme.primaryColor}-2)`,
    },
  };
};

export default cssVariablesResolver;
