import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@mantine/core";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "wouter";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  envioApi: {
    getById: vi.fn(),
    update: vi.fn(),
  },
  categoriaApi: { getAll: vi.fn() },
  provinciaApi: { getAll: vi.fn() },
  localidadApi: { getByProvincia: vi.fn() },
  sucursalApi: { getParaEntrega: vi.fn() },
}));

// El mapa (mapbox-gl / react-map-gl) no corre en jsdom; el stub expone
// `data-initial-center` (el prop `initialCenter` de `MapCard`) para poder
// verificar que EditarEnvio centra el mapa en las coordenadas del envío
// precargado y no en `DEFAULT_CENTER` (SHG-FE-078).
vi.mock("@features/mapa/components/MapCard", () => ({
  default: ({ children, initialCenter }) => (
    <div
      data-testid="map-card"
      data-initial-center={`${initialCenter.lat},${initialCenter.lng}`}
    >
      {children}
    </div>
  ),
}));
vi.mock("react-map-gl/mapbox", () => ({
  Marker: () => null,
}));

// El geocoding real (Mapbox Search JS) se prueba en useAddressAutofill; acá se
// stubea porque EditarEnvio precarga las coordenadas del envío y no necesita
// re-geocodificar.
vi.mock("../CrearEnvios/hooks/useAddressAutofill", () => ({
  useAddressAutofill: () => ({
    autocompleteData: [],
    handleChange: vi.fn(),
    handleSelect: vi.fn(),
    loadingInput: false,
    loadingMap: false,
    selectedId: null,
  }),
}));

import {
  envioApi,
  categoriaApi,
  provinciaApi,
  localidadApi,
  sucursalApi,
} from "@api";
import EditarEnvio from "./index";

const EXISTING_ENVIO = {
  id: 9,
  nombre: "Juan",
  apellido: "García",
  emailRemitente: "remitente@test.com",
  emailReceptor: "receptor@test.com",
  prefijo: "351",
  telefono: "1234567",
  estado: "CREADO",
  destino: {
    id: 3,
    nombreCalle: "Av. Colón",
    numeroCalle: "1234",
    latitud: -31.4,
    longitud: -64.18,
    localidad: {
      id: 5,
      nombre: "Córdoba",
      provincia: { id: 2, nombre: "Córdoba" },
    },
  },
  detalleEnvios: [
    { id: 11, categoria: { id: 1, nombre: "Documentación" }, descripcion: "Sobre", peso: 0.5 },
  ],
};

const renderEditarEnvio = () =>
  renderWithProviders(
    <AppShell footer={{ height: 60 }}>
      <Route path="/envios/editar/:id" component={EditarEnvio} />
    </AppShell>,
    { route: "/envios/editar/9" },
  );

describe("EditarEnvio", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    categoriaApi.getAll.mockResolvedValue([
      { id: 1, nombre: "Documentación" },
      { id: 2, nombre: "Electrónica" },
    ]);
    provinciaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    localidadApi.getByProvincia.mockResolvedValue([{ id: 5, nombre: "Córdoba" }]);
    sucursalApi.getParaEntrega.mockResolvedValue([
      {
        id: 5,
        nombre: "Sucursal Centro",
        puntoEntrega: { nombreCalle: "Av. Colón", numeroCalle: "500" },
      },
    ]);
    envioApi.getById.mockResolvedValue(EXISTING_ENVIO);
    envioApi.update.mockResolvedValue({ id: 9 });
  });

  it("usa el header canónico (breadcrumbs Envíos / Editar envío + Necesito ayuda)", async () => {
    renderEditarEnvio();

    expect(await screen.findByText("Editar envío")).toBeInTheDocument();
    expect(screen.getAllByText("Envíos").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /necesito ayuda/i }),
    ).toBeInTheDocument();
  });

  it("loads and prefills the existing envío data into the form", async () => {
    renderEditarEnvio();

    await waitFor(() => {
      expect(envioApi.getById).toHaveBeenCalledWith("9");
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    expect(screen.getByLabelText(/apellido/i)).toHaveValue("García");
    expect(screen.getByLabelText(/email del remitente/i)).toHaveValue(
      "remitente@test.com",
    );
    expect(screen.getByLabelText(/email del receptor/i)).toHaveValue(
      "receptor@test.com",
    );
    expect(screen.getByLabelText(/^calle/i)).toHaveValue("Av. Colón");
    expect(screen.getByText("Documentación")).toBeInTheDocument();
  });

  it("submits changes and calls envioApi.update with the EnvioReqDTO shape", async () => {
    const user = userEvent.setup();
    renderEditarEnvio();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    const nombreInput = screen.getByLabelText(/^nombre/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, "Pedro");

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(envioApi.update).toHaveBeenCalledTimes(1);
    });

    expect(envioApi.update).toHaveBeenCalledWith(
      "9",
      expect.objectContaining({
        nombre: "Pedro",
        apellido: "García",
        emailRemitente: "remitente@test.com",
        emailReceptor: "receptor@test.com",
        prefijo: "351",
        telefono: "1234567",
        destino: expect.objectContaining({
          id: 3,
          nombreCalle: "Av. Colón",
          numeroCalle: "1234",
          localidad: { id: 5 },
        }),
        detalleEnvios: [
          expect.objectContaining({
            id: 11,
            categoria: { id: 1 },
            descripcion: "Sobre",
            peso: 0.5,
          }),
        ],
      }),
    );
  });

  it("muestra el error de campo devuelto por PUT /api/envio/{id} (400 de validación, CONTRACTS.md §5)", async () => {
    const user = userEvent.setup();
    envioApi.update.mockRejectedValue({
      response: {
        data: {
          statusCode: 400,
          message: "Error en la validación de los campos.",
          fields: [{ field: "telefono", error: "El teléfono no es válido." }],
        },
      },
    });

    renderEditarEnvio();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(envioApi.update).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("El teléfono no es válido."),
    ).toBeInTheDocument();
  });

  it("centra el mapa en las coordenadas del envío precargado, no en DEFAULT_CENTER (SHG-FE-078)", async () => {
    renderEditarEnvio();

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    expect(screen.getByTestId("map-card")).toHaveAttribute(
      "data-initial-center",
      `${EXISTING_ENVIO.destino.latitud},${EXISTING_ENVIO.destino.longitud}`,
    );
  });

  it("no permite editar un envío en estado terminal (entregado/rechazado)", async () => {
    envioApi.getById.mockResolvedValue({ ...EXISTING_ENVIO, estado: "entregado" });

    renderEditarEnvio();

    await waitFor(() => {
      expect(envioApi.getById).toHaveBeenCalledWith("9");
    });

    expect(
      await screen.findByText(/no se puede editar en su estado actual/i),
    ).toBeInTheDocument();

    expect(screen.queryByLabelText(/^nombre/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guardar cambios/i }),
    ).not.toBeInTheDocument();
  });

  describe("SHG-FE-079/SHG-CONTRACT-012 — retiro en sucursal como método de entrega", () => {
    it("precarga un envío de retiro en sucursal con el selector de sucursal, sin buscador/mapa", async () => {
      envioApi.getById.mockResolvedValue({
        ...EXISTING_ENVIO,
        tipoEntrega: "sucursal",
        sucursalEntrega: { id: 5, nombre: "Sucursal Centro" },
        destino: null,
      });

      renderEditarEnvio();

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      });

      expect(
        screen.getByRole("radio", { name: /retiro en sucursal/i }),
      ).toBeChecked();
      expect(
        await screen.findByText(/sucursal centro — av\. colón 500/i),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/buscar dirección/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId("map-card")).not.toBeInTheDocument();
    });

    it("permite cambiar de domicilio a retiro en sucursal y guarda tipoEntrega/sucursalEntregaId", async () => {
      const user = userEvent.setup();
      renderEditarEnvio();

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      });

      await user.click(
        screen.getByRole("radio", { name: /retiro en sucursal/i }),
      );

      const combobox = screen.getByRole("combobox", {
        name: /sucursal de retiro/i,
      });
      await user.click(combobox);
      const listboxId = combobox.getAttribute("aria-controls");
      const listbox = document.getElementById(listboxId);
      const option = await within(listbox).findByText(/sucursal centro/i);
      await user.click(option);

      await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

      await waitFor(() => {
        expect(envioApi.update).toHaveBeenCalledTimes(1);
      });

      expect(envioApi.update).toHaveBeenCalledWith(
        "9",
        expect.objectContaining({
          tipoEntrega: "sucursal",
          sucursalEntregaId: 5,
        }),
      );
      const [, payload] = envioApi.update.mock.calls[0];
      expect(payload).not.toHaveProperty("destino");
    });
  });

  describe("estados de carga/error/vacío (SHG-QA-003)", () => {
    it("muestra el estado de error cuando envioApi.getById rechaza, y reintentar hace una nueva llamada", async () => {
      const user = userEvent.setup();
      const error = new Error("Network error");
      error.response = { status: 500 };
      envioApi.getById.mockRejectedValueOnce(error);

      renderEditarEnvio();

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

      await waitFor(() => {
        expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
      });
    });

    it("muestra el estado vacío cuando envioApi.getById retorna null", async () => {
      vi.clearAllMocks();
      envioApi.getById.mockResolvedValue(null);
      categoriaApi.getAll.mockResolvedValue([
        { id: 1, nombre: "Documentación" },
        { id: 2, nombre: "Electrónica" },
      ]);
      provinciaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
      localidadApi.getByProvincia.mockResolvedValue([{ id: 5, nombre: "Córdoba" }]);

      renderEditarEnvio();

      await waitFor(() => {
        expect(envioApi.getById).toHaveBeenCalledWith("9");
      });

      expect(await screen.findByText("Envío no encontrado")).toBeInTheDocument();
      expect(screen.getByText("No encontramos información para este envío.")).toBeInTheDocument();
    });
  });
});
