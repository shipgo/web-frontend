import { v8CssVariablesResolver } from "@mantine/core";

/**
 * Envuelve el resolver oficial de compat v8 de Mantine (`v8CssVariablesResolver`,
 * usado para mantener los colores de la variante `light` iguales a v8 — ver
 * CLAUDE.md) para corregir dos tokens semánticos que ese resolver hereda de
 * v8 con contraste insuficiente (WCAG 2 AA, 4.5:1) — confirmado por axe-core
 * (`color-contrast`, impacto `serious`) en las 9 rutas MVP auditadas por
 * SHG-FE-041:
 *
 * - `--mantine-color-dimmed` → `gray.6` (`#868e96`, ~3.3:1 contra blanco).
 *   Todo lo que usa `c="dimmed"` (subtítulos, KPIs, `EmptyState`, etc.).
 * - `--mantine-color-placeholder` → `gray.5` (`#adb5bd`, ~2.1:1). Placeholder
 *   de cualquier input (`DatePickerInput`/`DateTimePicker` vacíos, etc.).
 *
 * (El contraste de `<Badge variant="light" color="orange|green">` —
 * "En camino"/"Entregado"/"Finalizado" — es un problema distinto: esos dos
 * colores ya usan el shade MÁS OSCURO de su escala [9] y sigue sin llegar a
 * 4.5:1, así que no hay un shade existente al que "reapuntar" — se resuelve
 * en `estadoBadge` (`@domain/estados`, `BADGE_TEXT_CONTRAST_OVERRIDE`), no
 * acá.)
 *
 * Ajuste puntual: cada línea reapunta UN token existente a un shade más
 * oscuro de la MISMA escala de color (no se inventa ningún color nuevo, no
 * se toca `COLOR_PALETTE` ni el resto de `v8CssVariablesResolver`, ni el modo
 * `dark` — no auditado, no mostró estos problemas).
 */
export const cssVariablesResolver = (theme) => {
  const result = v8CssVariablesResolver(theme);
  return {
    ...result,
    light: {
      ...result.light,
      "--mantine-color-dimmed": "var(--mantine-color-gray-7)",
      "--mantine-color-placeholder": "var(--mantine-color-gray-7)",
    },
  };
};

export default cssVariablesResolver;
