import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@stores/auth.store";
import OnboardingEmpresa from "./index";

const mockSave = vi.fn();
const mockProvincias = vi.fn();
const mockLocalidades = vi.fn();

vi.mock("@api", () => ({
  empresaApi: { save: (...args) => mockSave(...args) },
  provinciaApi: { getAll: (...args) => mockProvincias(...args) },
  localidadApi: { getByProvincia: (...args) => mockLocalidades(...args) },
}));

const USER_VINCULADO = {
  id: 8,
  username: "supernuevo",
  nombre: "Nicolas",
  apellido: "Nuevo",
  authorities: [{ id: 1, name: "ROLE_SUPERUSER" }],
  sucursal: {
    id: 5,
    nombre: "Casa Central",
    empresa: { id: 2, nombre: "Mi Empresa S.R.L." },
  },
};

const ORIGINAL_GET_USER_INFO = useAuthStore.getState().getUserInfo;
let queryClient;

const renderPage = () => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(queryClient, "invalidateQueries");
  window.history.pushState({}, "", "/usuarios");
  return render(
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <AppShell footer={{ height: 60 }}>
          <OnboardingEmpresa />
        </AppShell>
        <Notifications />
      </MantineProvider>
    </QueryClientProvider>,
  );
};

const completarForm = async (user) => {
  await waitFor(() => expect(mockProvincias).toHaveBeenCalled());

  await user.type(screen.getByLabelText(/^Nombre de la empresa/), "Mi Empresa S.R.L.");
  await user.type(screen.getByLabelText(/^Nombre(?! de la empresa)/), "Casa Central");
  await user.type(screen.getByLabelText(/^Prefijo/), "351");
  await user.type(screen.getByLabelText(/^Teléfono/), "4222222");
  await user.type(screen.getByLabelText(/^Calle/), "Av. Colón");
  await user.type(screen.getByLabelText(/^Número/), "500");

  await user.click(screen.getByRole("combobox", { name: /^Provincia/ }));
  await user.click(await screen.findByText("Córdoba"));
  await waitFor(() => expect(mockLocalidades).toHaveBeenCalled());
  await user.click(screen.getByRole("combobox", { name: /^Localidad/ }));
  await user.click(await screen.findByText("Córdoba Capital"));
};

describe("OnboardingEmpresa (SHG-FE-116)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProvincias.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    mockLocalidades.mockResolvedValue([{ id: 5, nombre: "Córdoba Capital" }]);
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      connectionError: null,
      getUserInfo: ORIGINAL_GET_USER_INFO,
    });
  });

  it("crea empresa + sucursal con un solo POST, refresca la sesión y entra al panel", async () => {
    const user = userEvent.setup();
    mockSave.mockResolvedValue(USER_VINCULADO);
    renderPage();
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /crear empresa/i }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave).toHaveBeenCalledWith({
      nombre: "Mi Empresa S.R.L.",
      sucursal: {
        nombre: "Casa Central",
        email: null,
        prefijo: "351",
        telefono: "4222222",
        puntoEntrega: {
          numeroCalle: "500",
          nombreCalle: "Av. Colón",
          localidadID: 5,
        },
      },
    });

    // La sesión se refresca con el UserDTO de la respuesta (ya con sucursal)...
    await waitFor(() =>
      expect(useAuthStore.getState().user?.sucursal?.empresa?.nombre).toBe(
        "Mi Empresa S.R.L.",
      ),
    );
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    // ...el contexto operativo se invalida...
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["operating-context"],
    });
    // ...y entra al panel.
    await waitFor(() => expect(window.location.pathname).toBe("/"));
  });

  it("doble clic en el botón dispara un solo POST /api/empresa", async () => {
    const user = userEvent.setup();
    let resolver;
    mockSave.mockImplementation(
      () => new Promise((resolve) => (resolver = resolve)),
    );
    renderPage();
    await completarForm(user);

    const boton = screen.getByRole("button", { name: /crear empresa/i });
    await user.dblClick(boton);
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(boton).toBeDisabled();

    resolver(USER_VINCULADO);
    await waitFor(() => expect(window.location.pathname).toBe("/"));
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("enviar vacío muestra errores inline y no hace POST", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(mockProvincias).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /crear empresa/i }));

    expect(
      await screen.findByText("Ingresá el nombre de la empresa"),
    ).toBeInTheDocument();
    // (el toast "Revisá el formulario" repite el primer error: por eso getAllBy)
    expect(screen.getAllByText("Ingresá el nombre").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ingresá el prefijo").length).toBeGreaterThan(0);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("marca los errores por campo del backend (nombre de la empresa y DTO anidado sucursal.)", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          message: "Error de validación",
          fields: [
            { field: "nombre", error: "ya existe una empresa con ese nombre" },
            { field: "sucursal.telefono", error: "teléfono inválido en el servidor" },
            {
              field: "sucursal.puntoEntrega.nombreCalle",
              error: "calle inválida en el servidor",
            },
          ],
        },
      },
    });
    renderPage();
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /crear empresa/i }));

    expect(
      await screen.findByText("ya existe una empresa con ese nombre"),
    ).toBeInTheDocument();
    expect(screen.getByText("teléfono inválido en el servidor")).toBeInTheDocument();
    expect(screen.getByText("calle inválida en el servidor")).toBeInTheDocument();
    // Sigue en el onboarding, sin sesión nueva y con el botón otra vez disponible.
    expect(useAuthStore.getState().user).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /crear empresa/i })).toBeEnabled(),
    );
  });

  it("un error sin campos (400 'ya tiene sucursal') muestra el mensaje del backend, no uno genérico", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue({
      response: {
        status: 400,
        data: { statusCode: 400, message: "El usuario ya tiene una sucursal asignada." },
      },
    });
    renderPage();
    await completarForm(user);

    await user.click(screen.getByRole("button", { name: /crear empresa/i }));

    expect(
      await screen.findByText("El usuario ya tiene una sucursal asignada."),
    ).toBeInTheDocument();
  });

  it("no ofrece 'Cancelar' (no hay a dónde volver)", async () => {
    renderPage();
    await waitFor(() => expect(mockProvincias).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /cancelar/i })).not.toBeInTheDocument();
  });

  describe("resincronización si la respuesta del POST se perdió", () => {
    const timeoutError = () =>
      Object.assign(new Error("timeout of 15000ms exceeded"), {
        isAxiosError: true,
        code: "ECONNABORTED",
      });

    it("timeout y el whoami ya trae sucursal → entra al panel", async () => {
      const user = userEvent.setup();
      mockSave.mockRejectedValue(timeoutError());
      const getUserInfo = vi.fn().mockResolvedValue(USER_VINCULADO);
      useAuthStore.setState({ getUserInfo });
      renderPage();
      await completarForm(user);

      await user.click(screen.getByRole("button", { name: /crear empresa/i }));

      await waitFor(() => expect(getUserInfo).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(window.location.pathname).toBe("/"));
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it("timeout y el whoami sigue sin sucursal → se queda en el onboarding con el error", async () => {
      const user = userEvent.setup();
      mockSave.mockRejectedValue(timeoutError());
      const getUserInfo = vi.fn().mockResolvedValue({ id: 8, sucursal: null });
      useAuthStore.setState({ getUserInfo });
      renderPage();
      await completarForm(user);

      await user.click(screen.getByRole("button", { name: /crear empresa/i }));

      await waitFor(() => expect(getUserInfo).toHaveBeenCalledTimes(1));
      expect(window.location.pathname).toBe("/usuarios");
      expect((await screen.findAllByText("Error")).length).toBeGreaterThan(0);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: /crear empresa/i })).toBeEnabled(),
      );
    });

    it("400 'ya tiene una sucursal asignada' y el whoami trae sucursal → entra al panel", async () => {
      const user = userEvent.setup();
      mockSave.mockRejectedValue({
        response: {
          status: 400,
          data: { statusCode: 400, message: "El usuario ya tiene una sucursal asignada." },
        },
      });
      const getUserInfo = vi.fn().mockResolvedValue(USER_VINCULADO);
      useAuthStore.setState({ getUserInfo });
      renderPage();
      await completarForm(user);

      await user.click(screen.getByRole("button", { name: /crear empresa/i }));

      await waitFor(() => expect(window.location.pathname).toBe("/"));
      expect(getUserInfo).toHaveBeenCalledTimes(1);
    });
  });
});
