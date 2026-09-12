import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "wouter";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  envioApi: {
    getById: vi.fn(),
    entregar: vi.fn(),
    falloEntrega: vi.fn(),
  },
}));

import { envioApi } from "@api";
import { useAuthStore, Usuario } from "@stores/auth.store";
import DetalleEnvio from "./index";

const EXISTING_ENVIO = {
  id: 9,
  nombre: "Juan",
  apellido: "García",
  emailRemitente: "remitente@test.com",
  emailReceptor: "receptor@test.com",
  prefijo: "351",
  telefono: "1234567",
  estado: "en_camino",
  codigoSeguimiento: "ABC123XYZ",
  fechaEntrega: "2026-09-10",
  sucursal: { id: 1, nombre: "Sucursal Centro" },
  destino: {
    id: 3,
    nombreCalle: "Av. Colón",
    numeroCalle: "1234",
    localidad: {
      id: 5,
      nombre: "Córdoba",
      provincia: { id: 2, nombre: "Córdoba" },
    },
  },
  detalleEnvios: [
    { id: 11, categoria: { id: 1, nombre: "Documentación" }, descripcion: "Sobre", peso: 0.5 },
  ],
  historialEstado: [
    { id: 1, estado: "creado", fechaHoraInicio: "2026-09-01T08:00:00" },
    { id: 2, estado: "en_sucursal", fechaHoraInicio: "2026-09-01T09:00:00" },
    { id: 3, estado: "en_camino", fechaHoraInicio: "2026-09-02T10:00:00" },
  ],
  detalleRecorridos: [
    {
      id: 50,
      recorrido: {
        id: 5,
        estado: "en_camino",
        orden: 1,
        puntoEntrega: { nombreCalle: "Av. Colón", numeroCalle: "1234" },
        viaje: { id: 77 },
      },
    },
  ],
};

describe("DetalleEnvio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envioApi.getById.mockResolvedValue(EXISTING_ENVIO);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("renders sender, receiver, destino and package info from the API response", async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    await waitFor(() => {
      expect(envioApi.getById).toHaveBeenCalledWith("9");
    });

    expect(await screen.findByText("Juan García")).toBeInTheDocument();
    expect(screen.getByText("remitente@test.com")).toBeInTheDocument();
    expect(screen.getByText("receptor@test.com")).toBeInTheDocument();
    expect(screen.getByText("351 1234567")).toBeInTheDocument();
    expect(screen.getAllByText("Av. Colón 1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Córdoba").length).toBeGreaterThan(0);
    expect(screen.getByText("Documentación")).toBeInTheDocument();
    expect(screen.getByText("ABC123XYZ", { exact: false })).toBeInTheDocument();
  });

  it("renders the estado badge via @domain/estados", async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    expect((await screen.findAllByText("En camino")).length).toBeGreaterThan(0);
  });

  it("renders sucursal de origen and fecha de entrega", async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    expect(await screen.findByText("Sucursal Centro")).toBeInTheDocument();
    expect(screen.getByText("10/09/2026")).toBeInTheDocument();
  });

  it("renders the historial de estados timeline ordered by fecha", async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    expect(await screen.findByText("Historial de estados")).toBeInTheDocument();
    expect(screen.getByText("Creado")).toBeInTheDocument();
    expect(screen.getByText("En sucursal")).toBeInTheDocument();
    expect(screen.getAllByText("En camino").length).toBeGreaterThan(0);
  });

  it("renders the viaje asociado with a link to DetalleViaje and estado del recorrido", async () => {
    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    expect(await screen.findByText("Viaje #77")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando el envío no está asignado a un viaje", async () => {
    envioApi.getById.mockResolvedValue({ ...EXISTING_ENVIO, detalleRecorridos: [] });

    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    expect(
      await screen.findByText("Este envío todavía no fue asignado a un viaje."),
    ).toBeInTheDocument();
  });

  it("no muestra el botón Editar cuando el estado es terminal", async () => {
    envioApi.getById.mockResolvedValue({ ...EXISTING_ENVIO, estado: "entregado" });

    renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
      route: "/envios/9",
    });

    await screen.findByText("Juan García");
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
  });

  describe("estados de carga/error/vacío (SHG-QA-003)", () => {
    it("muestra el estado de error cuando envioApi.getById rechaza, y reintentar hace una nueva llamada", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      error.response = { status: 500 };
      envioApi.getById.mockRejectedValueOnce(error);

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledWith("9");
      });

      expect(await screen.findByText("No se pudo cargar el envío")).toBeInTheDocument();
      expect(screen.getByText("Ocurrió un error al obtener la información del envío.")).toBeInTheDocument();

      const reintentar = screen.getByRole("button", { name: /reintentar/i });
      expect(reintentar).toBeInTheDocument();

      envioApi.getById.mockResolvedValueOnce(EXISTING_ENVIO);
      await user.click(reintentar);

      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledTimes(2);
      });

      expect(await screen.findByText("Juan García")).toBeInTheDocument();
    });

    it("muestra el estado vacío cuando envioApi.getById retorna null", async () => {
      vi.clearAllMocks();
      envioApi.getById.mockResolvedValue(null);

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledWith("9");
      });

      expect(await screen.findByText("Envío no encontrado")).toBeInTheDocument();
      expect(screen.getByText("No encontramos información para este envío.")).toBeInTheDocument();
    });
  });

  describe("acciones de estado (SHG-FE-007)", () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: new Usuario({ id: 1, username: "admin1", authorities: ["ROLE_ADMIN"] }),
        isAuthenticated: true,
      });
    });

    it("no muestra los botones de acción para un usuario sin rol admin/superuser", async () => {
      useAuthStore.setState({
        user: new Usuario({ id: 2, username: "carga1", authorities: ["ROLE_CARGA"] }),
        isAuthenticated: true,
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await screen.findByText("Juan García");
      expect(screen.queryByRole("button", { name: /entregar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /marcar fallo/i })).not.toBeInTheDocument();
    });

    it("no muestra los botones de acción si el estado no es en_camino/en_vehiculo", async () => {
      envioApi.getById.mockResolvedValue({ ...EXISTING_ENVIO, estado: "en_sucursal" });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await screen.findByText("Juan García");
      expect(screen.queryByRole("button", { name: /entregar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /marcar fallo/i })).not.toBeInTheDocument();
    });

    it("muestra los botones habilitados para un ADMIN con el envío en_camino", async () => {
      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      const entregarBtn = await screen.findByRole("button", { name: /entregar/i });
      expect(entregarBtn).toBeEnabled();
      expect(screen.getByRole("button", { name: /marcar fallo/i })).toBeEnabled();
    });

    it("entrega el envío con dniReceptor tras confirmar y refetchea el detalle (SHG-FE-058)", async () => {
      const user = userEvent.setup();
      envioApi.entregar.mockResolvedValue({ ...EXISTING_ENVIO, estado: "entregado" });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText(/dni de quien recibe/i), "30111222");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      await waitFor(() => {
        expect(envioApi.entregar).toHaveBeenCalledWith("9", { dniReceptor: "30111222" });
      });
      expect(await screen.findByText("Envío entregado")).toBeInTheDocument();
      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledTimes(2);
      });
    });

    it("entrega el envío mandando también la palabra de entrega si se ingresó", async () => {
      const user = userEvent.setup();
      envioApi.entregar.mockResolvedValue({ ...EXISTING_ENVIO, estado: "entregado" });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText(/dni de quien recibe/i), "30111222");
      await user.type(within(dialog).getByLabelText(/palabra de entrega/i), "AB23K9");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      await waitFor(() => {
        expect(envioApi.entregar).toHaveBeenCalledWith("9", {
          dniReceptor: "30111222",
          palabraEntregaIngresada: "AB23K9",
        });
      });
    });

    it("regresión SHG-FE-058: el modal de Entregar no confirma sin dniReceptor, y no llama a la API sin body", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      expect(
        within(dialog).getByText("El DNI de quien recibe es obligatorio"),
      ).toBeInTheDocument();
      // Antes de SHG-FE-058 esto disparaba `entregar(id)` sin body → 400 real
      // contra `EntregaEnvioReqDTO.dniReceptor` (`@NotEmpty`, `SHG-BE-042`).
      expect(envioApi.entregar).not.toHaveBeenCalled();
    });

    it("delivery_word_mismatch: muestra el error dentro del modal, no lo cierra y mantiene el DNI tipeado", async () => {
      const user = userEvent.setup();
      envioApi.entregar.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: "La palabra de entrega ingresada no coincide con la registrada para este envío.",
            code: "delivery_word_mismatch",
          },
        },
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      const dniInput = within(dialog).getByLabelText(/dni de quien recibe/i);
      await user.type(dniInput, "30111222");
      await user.type(within(dialog).getByLabelText(/palabra de entrega/i), "WRONG1");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      expect(
        await within(dialog).findByText(
          "La palabra de entrega ingresada no coincide con la registrada para este envío.",
        ),
      ).toBeInTheDocument();
      // el modal sigue abierto y el DNI ya tipeado no se pierde
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(dniInput).toHaveValue("30111222");
      expect(envioApi.getById).toHaveBeenCalledTimes(1);
    });

    it("dniReceptor faltante (ApiFieldError del backend): se muestra como error de campo estándar sin cerrar el modal", async () => {
      const user = userEvent.setup();
      envioApi.entregar.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: "Revisá los campos marcados.",
            fields: [{ field: "dniReceptor", error: "no debe estar vacío" }],
          },
        },
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      // el cliente ya valida el DNI localmente, pero igual la request puede
      // volver con un `ApiFieldError` estándar (`CONTRACTS.md §5`) — se
      // muestra vía `applyApiError`, igual que el resto de los forms del repo.
      await user.type(within(dialog).getByLabelText(/dni de quien recibe/i), "30111222");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      expect(await within(dialog).findByText("no debe estar vacío")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("el modal de fallo de entrega no confirma sin motivo (obligatorio)", async () => {
      const user = userEvent.setup();

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /marcar fallo/i }));

      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Marcar fallo de entrega" }));

      expect(within(dialog).getByText("El motivo es obligatorio")).toBeInTheDocument();
      expect(envioApi.falloEntrega).not.toHaveBeenCalled();
    });

    it("registra el fallo de entrega con motivo y refetchea el detalle", async () => {
      const user = userEvent.setup();
      envioApi.falloEntrega.mockResolvedValue({ ...EXISTING_ENVIO, estado: "rechazado" });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /marcar fallo/i }));

      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText(/motivo/i), "Destinatario ausente");
      await user.click(within(dialog).getByRole("button", { name: "Marcar fallo de entrega" }));

      await waitFor(() => {
        expect(envioApi.falloEntrega).toHaveBeenCalledWith("9", { motivo: "Destinatario ausente" });
      });
      expect(await screen.findByText("Fallo de entrega registrado")).toBeInTheDocument();
      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledTimes(2);
      });
    });

    it("muestra una advertencia si el backend rechaza la transición (409)", async () => {
      const user = userEvent.setup();
      envioApi.entregar.mockRejectedValue({
        response: { status: 409, data: { message: "El envío no está en camino" } },
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await user.click(await screen.findByRole("button", { name: /entregar/i }));

      const dialog = await screen.findByRole("dialog");
      await user.type(within(dialog).getByLabelText(/dni de quien recibe/i), "30111222");
      await user.click(within(dialog).getByRole("button", { name: "Sí, entregar" }));

      expect(await screen.findByText("No se puede completar la acción")).toBeInTheDocument();
      expect(screen.getByText("El envío no está en camino")).toBeInTheDocument();
    });
  });

  describe("dniReceptor en Remitente y receptor (SHG-FE-058)", () => {
    it("muestra el DNI del receptor cuando el envío está entregado", async () => {
      envioApi.getById.mockResolvedValue({
        ...EXISTING_ENVIO,
        estado: "entregado",
        dniReceptor: "30111222",
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      expect(await screen.findByText("DNI de quien recibió")).toBeInTheDocument();
      expect(screen.getByText("30111222")).toBeInTheDocument();
    });

    it("no muestra la sección de DNI de receptor cuando el envío todavía no fue entregado", async () => {
      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await screen.findByText("Juan García");
      expect(screen.queryByText("DNI de quien recibió")).not.toBeInTheDocument();
    });

    it("nunca muestra palabraEntrega en el panel de operador, aunque el backend la mande por error", async () => {
      envioApi.getById.mockResolvedValue({
        ...EXISTING_ENVIO,
        estado: "entregado",
        dniReceptor: "30111222",
        palabraEntrega: "AB23K9",
      });

      renderWithProviders(<Route path="/envios/:id" component={DetalleEnvio} />, {
        route: "/envios/9",
      });

      await screen.findByText("Juan García");
      expect(screen.queryByText("AB23K9")).not.toBeInTheDocument();
    });
  });
});
