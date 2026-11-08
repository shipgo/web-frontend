import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";

import AuthShell from "./AuthShell";

describe("AuthShell", () => {
  it("renderiza título, subtítulo y contenido", () => {
    renderWithProviders(
      <AuthShell title="Revisá tu correo" subtitle="Te enviamos un enlace">
        <p>contenido</p>
      </AuthShell>,
    );

    expect(screen.getByRole("heading", { name: "Revisá tu correo" })).toBeInTheDocument();
    expect(screen.getByText("Te enviamos un enlace")).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  // SHG-FE-100: el logo de las pantallas de acceso linkea a `/`.
  it("el logo linkea a / (SHG-FE-100)", () => {
    renderWithProviders(<AuthShell title="Título">contenido</AuthShell>);

    expect(screen.getByRole("link", { name: /shipgo — inicio/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("variante split: renderiza el contenido, el pie y la foto decorativa", () => {
    const { container } = renderWithProviders(
      <AuthShell
        variant="split"
        title="Iniciar sesión"
        subtitle="Completá con tus datos"
        footer={<a href="/ayuda">Ayuda</a>}
      >
        <p>formulario</p>
      </AuthShell>,
    );

    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByText("formulario")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ayuda" })).toBeInTheDocument();
    // La foto es decorativa (alt vacío) y no se descarga hasta que se muestra.
    const foto = container.querySelector('img[alt=""]');
    expect(foto).toHaveAttribute("loading", "lazy");
  });

  it("ofrece el selector de tema en las dos variantes (ya no fuerza el modo claro)", () => {
    const { unmount } = renderWithProviders(<AuthShell title="Hola">x</AuthShell>);
    expect(screen.getByRole("button", { name: "Cambiar tema de color" })).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <AuthShell variant="split" title="Hola">
        x
      </AuthShell>,
    );
    expect(screen.getByRole("button", { name: "Cambiar tema de color" })).toBeInTheDocument();
  });

  it("variante split: el pie no se renderiza si no se pasa", () => {
    renderWithProviders(
      <AuthShell variant="split" title="Hola">
        <p>x</p>
      </AuthShell>,
    );

    expect(screen.queryByRole("link", { name: "Ayuda" })).not.toBeInTheDocument();
  });
});
