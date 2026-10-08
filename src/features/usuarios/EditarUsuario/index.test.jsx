import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AppShell } from "@mantine/core";
import { Route } from "wouter";

import { renderWithProviders as renderRaw } from "../../../test/renderWithProviders";

const renderEditar = (ui, id) =>
  renderRaw(
    <AppShell footer={{ height: 60 }}>
      <Route path="/usuarios/:id/editar">{ui}</Route>
    </AppShell>,
    { route: `/usuarios/${id}/editar` }
  );

vi.mock("@api", () => ({
  usuarioApi: { getById: vi.fn(), update: vi.fn() },
  sucursalApi: { getAll: vi.fn() },
  authorityApi: { getAll: vi.fn() },
  catalogsApi: { getTiposDocumento: vi.fn(), getSexos: vi.fn() },
  locationApi: { getProvincias: vi.fn(), getLocalidadesByProvincia: vi.fn() },
}));

import { usuarioApi, sucursalApi, authorityApi, catalogsApi, locationApi } from "@api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import EditarUsuario from "./index";

const buildUsuarioDto = (overrides = {}) => ({
  id: 1,
  username: "admin1",
  nombre: "Ana",
  apellido: "Gómez",
  fechaNacimiento: "1990-05-10",
  prefijo: "351",
  telefono: "1234567",
  nombreCalle: "Av. Siempreviva",
  numeroCalle: "742",
  email: "ana@example.com",
  dni: "30111222",
  sucursal: { id: 7, nombre: "Sucursal Centro" },
  tipoDocumento: { id: 1 },
  sexo: { id: 2 },
  localidad: { id: 5, provincia: { id: 2 } },
  authorities: [{ name: "ROLE_ADMIN" }],
  ...overrides,
});

describe("EditarUsuario (SHG-FE-121)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: new Usuario({
        id: 1,
        username: "admin1",
        authorities: ["ROLE_ADMIN"],
        sucursal: { id: 7, nombre: "Sucursal Centro" },
      }),
      isAuthenticated: true,
    });
    authorityApi.getAll.mockResolvedValue([
      { id: 1, name: "ROLE_SUPERUSER" },
      { id: 2, name: "ROLE_ADMIN" },
      { id: 3, name: "ROLE_CHOFER" },
    ]);
    catalogsApi.getTiposDocumento.mockResolvedValue([{ id: 1, nombre: "DNI" }]);
    catalogsApi.getSexos.mockResolvedValue([{ id: 2, nombre: "Femenino" }]);
    locationApi.getProvincias.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    locationApi.getLocalidadesByProvincia.mockResolvedValue([{ id: 5, nombre: "Córdoba Capital" }]);
    sucursalApi.getAll.mockResolvedValue([]);
  });

  it("un ADMIN que edita su propio usuario sigue enviando ROLE_ADMIN en authorities", async () => {
    const user = userEvent.setup();
    usuarioApi.getById.mockResolvedValue(buildUsuarioDto());
    usuarioApi.update.mockResolvedValue({});

    renderEditar(<EditarUsuario />, 1);

    const guardar = await screen.findByRole("button", { name: /guardar cambios/i });
    await waitFor(() => expect(authorityApi.getAll).toHaveBeenCalled());
    await user.click(guardar);

    await waitFor(() => expect(usuarioApi.update).toHaveBeenCalledTimes(1));
    expect(usuarioApi.update.mock.calls[0][0]).toBe("1");
    expect(usuarioApi.update.mock.calls[0][1].authorities).toEqual(["ROLE_ADMIN"]);
  });

  it("un 403 al guardar muestra el mensaje del backend", async () => {
    const user = userEvent.setup();
    usuarioApi.getById.mockResolvedValue(buildUsuarioDto());
    usuarioApi.update.mockRejectedValue({
      response: { status: 403, data: { statusCode: 403, message: "No tenés permisos para asignar el rol ROLE_ADMIN." } },
    });

    renderEditar(<EditarUsuario />, 1);
    await user.click(await screen.findByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByText("No tenés permisos para asignar el rol ROLE_ADMIN.")).toBeInTheDocument();
  });

  it("un 409 al guardar muestra el mensaje del backend", async () => {
    const user = userEvent.setup();
    usuarioApi.getById.mockResolvedValue(buildUsuarioDto());
    usuarioApi.update.mockRejectedValue({
      response: {
        status: 409,
        data: { statusCode: 409, message: "No se le puede quitar el rol de superusuario al último superusuario de la empresa." },
      },
    });

    renderEditar(<EditarUsuario />, 1);
    await user.click(await screen.findByRole("button", { name: /guardar cambios/i }));

    expect(
      await screen.findByText("No se le puede quitar el rol de superusuario al último superusuario de la empresa.")
    ).toBeInTheDocument();
  });

  it("entrando por URL a otro ADMIN, un ADMIN no ve el formulario (se redirige con aviso)", async () => {
    usuarioApi.getById.mockResolvedValue(buildUsuarioDto({ id: 9, username: "otro" }));

    renderEditar(<EditarUsuario />, 9);

    expect(await screen.findByText("No tenés permisos para editar a este usuario")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /guardar cambios/i })).not.toBeInTheDocument();
    expect(usuarioApi.update).not.toHaveBeenCalled();
  });
});
