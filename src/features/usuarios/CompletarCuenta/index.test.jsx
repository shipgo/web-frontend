import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AppShell } from "@mantine/core";

import { renderWithProviders as renderRaw } from "../../../test/renderWithProviders";

const renderPage = (ui) =>
  renderRaw(<AppShell footer={{ height: 60 }}>{ui}</AppShell>, { route: "/" });

vi.mock("@api", () => ({
  usuarioApi: { update: vi.fn() },
  sucursalApi: { getAll: vi.fn() },
  authorityApi: { getAll: vi.fn() },
  catalogsApi: { getTiposDocumento: vi.fn(), getSexos: vi.fn() },
  locationApi: { getProvincias: vi.fn(), getLocalidadesByProvincia: vi.fn() },
}));

import {
  usuarioApi,
  sucursalApi,
  authorityApi,
  catalogsApi,
  locationApi,
} from "@api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import CompletarCuenta from "./index";

const SUPER_SIN_DATOS = {
  id: 8,
  username: "nico@x.com",
  email: "nico@x.com",
  authorities: [{ name: "ROLE_SUPERUSER" }],
  sucursal: { id: 5, nombre: "Casa Central", empresa: { id: 2, nombre: "Mi Empresa" } },
};

const ORIGINAL_GET_USER_INFO = useAuthStore.getState().getUserInfo;
const mockGetUserInfo = vi.fn();

const elegirOpcion = async (user, combobox, opcion) => {
  const input = screen.getByRole("combobox", { name: combobox });
  await user.click(input);
  const listbox = within(document.getElementById(input.getAttribute("aria-controls")));
  await user.click(await listbox.findByText(opcion));
};

const completarForm = async (user) => {
  await waitFor(() => expect(locationApi.getProvincias).toHaveBeenCalled());

  await user.type(screen.getByLabelText(/^Nombre\b(?! de)/), "Nicolás");
  await user.type(screen.getByLabelText(/^Apellido/), "Nuevo");
  await user.type(screen.getByLabelText(/^Fecha de Nacimiento/), "15/09/1990");
  await elegirOpcion(user, /^Tipo de Documento/, "DNI");
  await user.type(screen.getByLabelText(/^DNI/), "30111222");
  await elegirOpcion(user, /^Sexo/, "Masculino");
  await user.type(screen.getByLabelText(/^Prefijo/), "351");
  await user.type(screen.getByLabelText(/^Teléfono/), "4222222");
  await user.type(screen.getByLabelText(/^Nombre de Calle/), "Av. Colón");
  await user.type(screen.getByLabelText(/^Número de Calle/), "500");
  await elegirOpcion(user, /^Provincia/, "Córdoba");
  await waitFor(() => expect(locationApi.getLocalidadesByProvincia).toHaveBeenCalled());
  await elegirOpcion(user, /^Localidad/, "Córdoba Capital");
};

describe("CompletarCuenta (SHG-FE-133)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/");
    mockGetUserInfo.mockResolvedValue(null);
    useAuthStore.setState({
      user: new Usuario(SUPER_SIN_DATOS),
      isAuthenticated: true,
      getUserInfo: mockGetUserInfo,
    });
    authorityApi.getAll.mockResolvedValue([
      { id: 1, name: "ROLE_SUPERUSER" },
      { id: 2, name: "ROLE_ADMIN" },
    ]);
    catalogsApi.getTiposDocumento.mockResolvedValue([{ id: 1, nombre: "DNI" }]);
    catalogsApi.getSexos.mockResolvedValue([{ id: 2, nombre: "Masculino" }]);
    locationApi.getProvincias.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    locationApi.getLocalidadesByProvincia.mockResolvedValue([
      { id: 5, nombre: "Córdoba Capital" },
    ]);
    sucursalApi.getAll.mockResolvedValue([{ id: 5, nombre: "Casa Central" }]);
  });

  afterEach(() => {
    useAuthStore.setState({ getUserInfo: ORIGINAL_GET_USER_INFO });
  });

  it("precarga username y email, y el username es editable", async () => {
    renderPage(<CompletarCuenta />);

    const username = await screen.findByLabelText(/^Usuario/);
    expect(username).toHaveValue("nico@x.com");
    expect(username).not.toBeDisabled();
    expect(screen.getByLabelText(/^Email/)).toHaveValue("nico@x.com");
    expect(screen.getByText("Completá tu cuenta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });

  it("roles y sucursal no son editables", async () => {
    renderPage(<CompletarCuenta />);

    await screen.findByLabelText(/^Usuario/);
    expect(screen.getByRole("combobox", { name: /^Roles/ })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /^Sucursal/ })).toBeDisabled();
  });

  it("si el PUT sale bien y falla whoami, avisa que se guardó y manda a /login (sin 'No se pudieron guardar')", async () => {
    const user = userEvent.setup();
    usuarioApi.update.mockResolvedValue({});
    mockGetUserInfo.mockRejectedValue(new Error("red"));
    renderPage(<CompletarCuenta />);
    await screen.findByLabelText(/^Usuario/);
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect(await screen.findByText(/Tus datos se guardaron, pero no pudimos recargar/i)).toBeInTheDocument();
    expect(screen.queryByText(/No se pudieron guardar tus datos/i)).not.toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("no envía con datos faltantes", async () => {
    const user = userEvent.setup();
    renderPage(<CompletarCuenta />);

    await user.click(await screen.findByRole("button", { name: /guardar y continuar/i }));

    expect(
      await screen.findByText("El campo nombre no puede estar vacío"),
    ).toBeInTheDocument();
    expect(usuarioApi.update).not.toHaveBeenCalled();
  });

  it("guarda con PUT sobre sí mismo (sucursalID y authorities actuales), refresca la sesión y entra a la app", async () => {
    const user = userEvent.setup();
    usuarioApi.update.mockResolvedValue({});
    renderPage(<CompletarCuenta />);
    await screen.findByLabelText(/^Usuario/);
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    await waitFor(() => expect(usuarioApi.update).toHaveBeenCalledTimes(1));
    const [id, dto] = usuarioApi.update.mock.calls[0];
    expect(id).toBe(8);
    expect(dto).toEqual({
      username: "nico@x.com",
      nombre: "Nicolás",
      apellido: "Nuevo",
      // LocalDate: YYYY-MM-DD (el parseo del tipeo en jsdom no es determinista).
      fechaNacimiento: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      prefijo: "351",
      telefono: "4222222",
      nombreCalle: "Av. Colón",
      numeroCalle: "500",
      email: "nico@x.com",
      sucursalID: 5,
      authorities: ["ROLE_SUPERUSER"],
      dni: "30111222",
      tipoDocumentoID: 1,
      sexoID: 2,
      localidadID: 5,
    });
    await waitFor(() => expect(mockGetUserInfo).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });

  it("si cambia el username la sesión se invalida y va a /login con aviso", async () => {
    const user = userEvent.setup();
    usuarioApi.update.mockResolvedValue({});
    window.localStorage.setItem("shipgo.sessionHint", "staff");
    renderPage(<CompletarCuenta />);
    const username = await screen.findByLabelText(/^Usuario/);
    await completarForm(user);
    await user.clear(username);
    await user.type(username, "nico");

    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    await waitFor(() => expect(usuarioApi.update).toHaveBeenCalledTimes(1));
    expect(usuarioApi.update.mock.calls[0][1].username).toBe("nico");
    await waitFor(() => expect(window.location.pathname).toBe("/login"));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(window.localStorage.getItem("shipgo.sessionHint")).toBeNull();
    expect(mockGetUserInfo).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/volver a iniciar sesión con el nuevo/i),
    ).toBeInTheDocument();
  });

  it("un error del backend se muestra y no sale de la pantalla", async () => {
    const user = userEvent.setup();
    usuarioApi.update.mockRejectedValue({
      response: { status: 400, data: { statusCode: 400, message: "El DNI ya está registrado." } },
    });
    renderPage(<CompletarCuenta />);
    await screen.findByLabelText(/^Usuario/);
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /guardar y continuar/i }));

    expect((await screen.findAllByText("El DNI ya está registrado.")).length).toBeGreaterThan(0);
    expect(mockGetUserInfo).not.toHaveBeenCalled();
  });
});
