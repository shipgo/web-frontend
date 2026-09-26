import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

vi.mock("@api", () => ({
  usuarioApi: {
    delete: vi.fn(),
    requestPasswordReset: vi.fn(),
  },
}));

import { useAuthStore } from "@stores/auth.store";
import ListaUsuariosTabla from "./ListaUsuariosTabla";

const LOGGED_IN_USER = { id: 1, username: "yo" };

const SELF = {
  id: 1,
  nombre: "Yo",
  apellido: "Mismo",
  username: "yo",
  email: "yo@shipgo.com",
  authorities: ["ROLE_ADMIN"],
};

const OTRO_MULTI_ROL = {
  id: 2,
  nombre: "Otra",
  apellido: "Persona",
  username: "otra",
  email: "otra@shipgo.com",
  authorities: ["ROLE_ADMIN", "ROLE_SUPERUSER"],
};

const renderWithProviders = (ui) =>
  render(
    <MantineProvider>
      <ModalsProvider>{ui}</ModalsProvider>
    </MantineProvider>
  );

describe("ListaUsuariosTabla (SHG-FE-094)", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: LOGGED_IN_USER });
  });

  it("no ofrece 'Eliminar' en la fila del propio usuario logueado", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));

    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });

  it("sí ofrece 'Eliminar' en la fila de otro usuario", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Otra Persona"));

    expect(await screen.findByText("Eliminar")).toBeInTheDocument();
  });

  it("no tiene la acción 'Desactivar' en ninguna fila", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ListaUsuariosTabla
        items={[SELF, OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Acciones de Yo Mismo"));
    expect(screen.queryByText("Desactivar")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Acciones de Otra Persona"));
    expect(screen.queryByText("Desactivar")).not.toBeInTheDocument();
  });

  it("muestra un badge por cada rol (authority) del usuario", () => {
    renderWithProviders(
      <ListaUsuariosTabla
        items={[OTRO_MULTI_ROL]}
        selectedIds={new Set()}
        onToggle={vi.fn()}
        onToggleAll={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    const row = screen.getByText("Otra Persona").closest("tr");
    expect(within(row).getByText("Administrador")).toBeInTheDocument();
    expect(within(row).getByText("Superusuario")).toBeInTheDocument();
  });
});
