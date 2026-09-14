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
 * estaría aplicado). No reemplaza la verificación de contraste real con
 * axe-core (ver `e2e/cases/axe-dark-mode-badges.js`) — sólo previene que
 * alguien borre por accidente la rama `dark` o deje el mismo valor en las
 * dos.
 */
describe("cssVariablesResolver — tokens de contraste de badges/botones de estado", () => {
  const fullTheme = mergeMantineTheme(DEFAULT_THEME, THEME);
  const result = cssVariablesResolver(fullTheme);

  const TOKENS = [
    "--shg-badge-text-orange",
    "--shg-badge-text-green",
    "--shg-button-text-green",
    "--shg-button-text-red",
  ];

  it("define los 4 tokens en la rama light y en la rama dark", () => {
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

  it("no toca las variables de color existentes fuera de los tokens nuevos (dimmed/placeholder siguen siendo sólo light)", () => {
    expect(result.light["--mantine-color-dimmed"]).toBe("var(--mantine-color-gray-7)");
    expect(result.light["--mantine-color-placeholder"]).toBe("var(--mantine-color-gray-7)");
    expect(result.dark["--mantine-color-dimmed"]).not.toBe("var(--mantine-color-gray-7)");
  });
});
