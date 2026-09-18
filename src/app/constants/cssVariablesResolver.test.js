import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, mergeMantineTheme } from "@mantine/core";

import { THEME } from "./theme";
import { cssVariablesResolver } from "./cssVariablesResolver";

/**
 * SHG-FE-060: `estadoBadge`/`BUTTON_ACTION_TEXT_COLOR` (`@domain/estados`)
 * dejaron de hardcodear un color de texto único y ahora referencian estos
 * tokens (`var(--shg-badge-text-*)`/`var(--shg-button-text-*)`) — este test
 * asegura que el resolver los define en AMBAS ramas (`light`/`dark`) y que
 * no son el mismo string (si lo fueran, el fix de contraste en dark mode no
 * estaría aplicado). SHG-FE-067 sumó `--shg-badge-text-indigo` (mismo
 * patrón, para `<Badge color="indigo">`, "En vehículo") a la lista.
 * SHG-FE-069 sumó `--shg-button-text-primary` (mismo patrón, para
 * `<Button variant="light">` sin `color` explícito — el color PRIMARIO del
 * theme, ej. "Ver viaje" en `DetalleEnvio`). No reemplaza la verificación de
 * contraste real con axe-core (ver `e2e/cases/axe-dark-mode-badges.js`) —
 * sólo previene que alguien borre por accidente la rama `dark` o deje el
 * mismo valor en las dos.
 */
describe("cssVariablesResolver — tokens de contraste de badges/botones de estado", () => {
  const fullTheme = mergeMantineTheme(DEFAULT_THEME, THEME);
  const result = cssVariablesResolver(fullTheme);

  const TOKENS = [
    "--shg-badge-text-orange",
    "--shg-badge-text-green",
    "--shg-badge-text-indigo",
    "--shg-button-text-green",
    "--shg-button-text-red",
    "--shg-button-text-primary",
  ];

  it("define los 6 tokens en la rama light y en la rama dark", () => {
    for (const token of TOKENS) {
      expect(result.light[token], `light.${token}`).toBeTruthy();
      expect(result.dark[token], `dark.${token}`).toBeTruthy();
    }
  });

  it("el valor de dark es distinto al de light para cada token (si no, no hay fix de dark mode)", () => {
    for (const token of TOKENS) {
      expect(result.dark[token], token).not.toBe(result.light[token]);
    }
  });

  /**
   * SHG-FE-067: `--mantine-color-dimmed`/`--mantine-color-placeholder` ahora
   * también tienen rama `dark` (antes sólo `light`, SHG-FE-041) — apuntan a
   * `dark.1` (≥4.5:1 contra los fondos reales de la app, confirmado por
   * axe-core real en `e2e/cases/axe-dark-mode-badges.js`), no al shade
   * default de Mantine (`dark.2`/`dark.3`) que motivó esta tarea.
   */
  it("no toca las variables de color existentes fuera de los tokens nuevos (dimmed/placeholder: light sin cambios, dark ahora definido y no es el shade default)", () => {
    expect(result.light["--mantine-color-dimmed"]).toBe("var(--mantine-color-gray-7)");
    expect(result.light["--mantine-color-placeholder"]).toBe("var(--mantine-color-gray-7)");
    expect(result.dark["--mantine-color-dimmed"]).toBe("var(--mantine-color-dark-1)");
    expect(result.dark["--mantine-color-placeholder"]).toBe("var(--mantine-color-dark-1)");
  });

  /**
   * SHG-FE-069: `--shg-button-text-primary` en `light` mantiene el mismo
   * shade que ya usa `variant="light"` por default (`colorPalette-9`, el
   * `primaryShade` del theme — sin cambio visual en light mode) y en `dark`
   * apunta a un shade MÁS CLARO de la MISMA escala (`colorPalette-2`) en vez
   * del shade 4 default (el que medía axe-core en ~4.05:1, por debajo de
   * 4.5:1 — ver comentario arriba del resolver).
   */
  it("--shg-button-text-primary usa el color primario del theme (colorPalette-9 en light, colorPalette-2 en dark)", () => {
    expect(result.light["--shg-button-text-primary"]).toBe(
      `var(--mantine-color-${fullTheme.primaryColor}-9)`,
    );
    expect(result.dark["--shg-button-text-primary"]).toBe(
      `var(--mantine-color-${fullTheme.primaryColor}-2)`,
    );
  });
});
