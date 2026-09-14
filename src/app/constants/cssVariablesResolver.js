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
 *   Sólo `light` — SHG-FE-041.
 * - `--mantine-color-placeholder` → `gray.5` (`#adb5bd`, ~2.1:1). Placeholder
 *   de cualquier input (`DatePickerInput`/`DateTimePicker` vacíos, etc.).
 *   Sólo `light` — SHG-FE-041.
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
 * Ajuste puntual: no se inventa ningún color nuevo (los tokens de dark mode
 * son shades ya existentes de la MISMA escala orange/green/red), no se toca
 * `COLOR_PALETTE` ni el resto de `v8CssVariablesResolver`.
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
      "--shg-button-text-green": "#1f6e33",
      "--shg-button-text-red": "#a51818",
    },
    dark: {
      ...result.dark,
      "--shg-badge-text-orange": "var(--mantine-color-orange-5)",
      "--shg-badge-text-green": "var(--mantine-color-green-5)",
      "--shg-button-text-green": "var(--mantine-color-green-5)",
      "--shg-button-text-red": "var(--mantine-color-red-4)",
    },
  };
};

export default cssVariablesResolver;
