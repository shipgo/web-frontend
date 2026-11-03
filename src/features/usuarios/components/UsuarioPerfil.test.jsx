import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../../test/renderWithProviders";
import UsuarioPerfil from "./UsuarioPerfil";

describe("UsuarioPerfil — usuario sin datos personales (SHG-FE-133)", () => {
  const usuario = {
    id: 8,
    username: "nico@x.com",
    email: "nico@x.com",
    authorities: [{ name: "ROLE_SUPERUSER" }],
    fechaCreacion: "2026-10-19T10:00:00",
  };

  it("no muestra 'undefined' y usa el username como título y '—' en los datos ausentes", () => {
    const { container } = renderWithProviders(<UsuarioPerfil usuario={usuario} />);

    expect(container.textContent).not.toMatch(/undefined|null/);
    expect(screen.getByRole("heading", { level: 2, name: "nico@x.com" })).toBeInTheDocument();
    // Nombre completo, documento, sexo, nacimiento, teléfono, calle, localidad, provincia, sucursal.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(8);
  });

  it("el avatar usa la inicial del username", () => {
    renderWithProviders(<UsuarioPerfil usuario={usuario} />);

    expect(screen.getByText("N")).toBeInTheDocument();
  });
});
