import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";

import ThemeMenu from "./ThemeMenu";

const KEY = "mantine-color-scheme-value";

describe("ThemeMenu", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.removeItem(KEY);
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.localStorage.removeItem(KEY);
  });

  // El dropdown anima su entrada y los ítems tardan en ser "accesibles" para role queries:
  // se buscan por texto y se verifica el rol del ítem.
  const abrir = async (user) => {
    await user.click(screen.getByRole("button", { name: "Cambiar tema de color" }));
    return {
      auto: await screen.findByText("Automático"),
      claro: await screen.findByText("Claro"),
      oscuro: await screen.findByText("Oscuro"),
    };
  };

  it("ofrece Automático, Claro y Oscuro, y marca el que está activo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeMenu />);

    const { auto, claro, oscuro } = await abrir(user);

    // El `MantineProvider` de los tests arranca en "light" (el de la app, en "auto").
    expect(claro.closest("[role=menuitem]")).toHaveAttribute("aria-current", "true");
    expect(auto.closest("[role=menuitem]")).not.toHaveAttribute("aria-current");
    expect(oscuro.closest("[role=menuitem]")).not.toHaveAttribute("aria-current");
  });

  it("elegir Oscuro lo guarda y lo marca como activo; después se puede volver a Claro", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeMenu />);

    await user.click((await abrir(user)).oscuro);
    expect(window.localStorage.getItem(KEY)).toBe("dark");

    const segunda = await abrir(user);
    expect(segunda.oscuro.closest("[role=menuitem]")).toHaveAttribute("aria-current", "true");
    await user.click(segunda.claro);

    expect(window.localStorage.getItem(KEY)).toBe("light");
  });
});
