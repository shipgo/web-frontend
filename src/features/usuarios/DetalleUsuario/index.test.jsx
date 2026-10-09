import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

vi.mock("@api", () => ({
  usuarioApi: {
    getById: vi.fn(),
    requestPasswordReset: vi.fn(),
  },
}));

import { usuarioApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import DetalleUsuario from "./index";

const ADMIN = { id: 1, username: "yo", authorities: ["ROLE_ADMIN"] };
const SUPERUSER = { id: 9, username: "su", authorities: ["ROLE_SUPERUSER"] };
const mk = (id, role) => ({
  id,
  nombre: "Nom",
  apellido: `Ape${id}`,
  username: `u${id}`,
  email: `u${id}@shipgo.com`,
  authorities: [role],
});

const renderDetalle = async (currentUser, target) => {
  useAuthStore.setState({ user: currentUser });
  usuarioApi.getById.mockResolvedValue(target);
  const { hook } = memoryLocation({ path: `/usuarios/${target.id}`, static: true });
  render(
    <MantineProvider>
      <ModalsProvider>
        <Router hook={hook}>
          <Route path="/usuarios/:id" component={DetalleUsuario} />
        </Router>
      </ModalsProvider>
    </MantineProvider>,
  );
  await screen.findByText("Detalle de usuario", {}, { timeout: 5000 });
};

describe("DetalleUsuario — Resetear contraseña (SHG-FE-123)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("un ADMIN no lo ve sobre otro ADMIN", async () => {
    await renderDetalle(ADMIN, mk(2, "ROLE_ADMIN"));
    expect(screen.queryByRole("button", { name: /Resetear contraseña/ })).not.toBeInTheDocument();
  });

  it("un ADMIN no lo ve sobre el SUPERUSER", async () => {
    await renderDetalle(ADMIN, mk(3, "ROLE_SUPERUSER"));
    expect(screen.queryByRole("button", { name: /Resetear contraseña/ })).not.toBeInTheDocument();
  });

  it("un ADMIN lo ve sobre un chofer", async () => {
    await renderDetalle(ADMIN, mk(4, "ROLE_CHOFER"));
    expect(screen.getByRole("button", { name: /Resetear contraseña/ })).toBeInTheDocument();
  });

  it("un ADMIN lo ve sobre su propio usuario", async () => {
    await renderDetalle(ADMIN, mk(1, "ROLE_ADMIN"));
    expect(screen.getByRole("button", { name: /Resetear contraseña/ })).toBeInTheDocument();
  });

  it("un SUPERUSER lo ve sobre otro ADMIN", async () => {
    await renderDetalle(SUPERUSER, mk(2, "ROLE_ADMIN"));
    expect(screen.getByRole("button", { name: /Resetear contraseña/ })).toBeInTheDocument();
  });
});
