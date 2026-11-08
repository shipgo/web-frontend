import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

import SplashScreen from "./SplashScreen";

describe("SplashScreen", () => {
  it("es una pantalla completa verde de marca, anunciada a lectores de pantalla", () => {
    renderWithProviders(<SplashScreen />);

    const splash = screen.getByTestId("splash-screen");
    expect(splash).toHaveAttribute("role", "status");
    expect(splash).toHaveAccessibleName("Cargando ShipGO!");
    expect(splash).toHaveStyle({ background: "#006b5a" });
  });

  it("muestra el logo (camión + wordmark) como imagen decorativa", () => {
    const { container } = renderWithProviders(<SplashScreen />);

    const logo = container.querySelector('img[src="/splash.svg"]');
    expect(logo).not.toBeNull();
    expect(logo).toHaveAttribute("alt", "");
  });
});
