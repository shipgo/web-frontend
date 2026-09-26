import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../../test/renderWithProviders";

import AuthCardShell from "./AuthCardShell";

describe("AuthCardShell", () => {
  it("renderiza título, subtítulo y contenido", () => {
    renderWithProviders(
      <AuthCardShell title="Revisá tu correo" subtitle="Te enviamos un enlace">
        <p>contenido</p>
      </AuthCardShell>,
    );

    expect(screen.getByRole("heading", { name: "Revisá tu correo" })).toBeInTheDocument();
    expect(screen.getByText("Te enviamos un enlace")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  // SHG-FE-100: el logo de las pantallas de recuperar cuenta (RecuperarCuenta,
  // RecuperarCuentaToken) no linkeaba a `/` — quedaba como una imagen suelta,
  // a diferencia del logo de LoginPage. Mismo `Anchor` que usa el login.
  it("el logo linkea a / (SHG-FE-100)", () => {
    renderWithProviders(<AuthCardShell title="Título">contenido</AuthCardShell>);

    expect(screen.getByRole("link", { name: /shipgo — inicio/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
