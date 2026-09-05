import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
}));

import { envioApi, categoriaApi, provinciaApi, localidadApi } from "@api";
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

describe("EditarEnvio", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    categoriaApi.getAll.mockResolvedValue([
      { id: 1, nombre: "Documentación" },
      { id: 2, nombre: "Electrónica" },
    ]);
    provinciaApi.getAll.mockResolvedValue([{ id: 2, nombre: "Córdoba" }]);
    localidadApi.getByProvincia.mockResolvedValue([{ id: 5, nombre: "Córdoba" }]);
    envioApi.getById.mockResolvedValue(EXISTING_ENVIO);
    envioApi.update.mockResolvedValue({ id: 9 });
  });

  it("loads and prefills the existing envío data into the form", async () => {
    renderWithProviders(
      <Route path="/envios/editar/:id" component={EditarEnvio} />,
      { route: "/envios/editar/9" }
    );

    await waitFor(() => {
      expect(envioApi.getById).toHaveBeenCalledWith("9");
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    expect(screen.getByLabelText(/apellido/i)).toHaveValue("García");
    expect(screen.getByLabelText(/email del remitente/i)).toHaveValue(
      "remitente@test.com"
    );
    expect(screen.getByLabelText(/email del receptor/i)).toHaveValue(
      "receptor@test.com"
    );
    expect(screen.getByLabelText(/^calle/i)).toHaveValue("Av. Colón");
    expect(screen.getByText("Documentación")).toBeInTheDocument();
  });

  it("submits changes and calls envioApi.update with the EnvioReqDTO shape", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Route path="/envios/editar/:id" component={EditarEnvio} />,
      { route: "/envios/editar/9" }
    );

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
      })
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

    renderWithProviders(
      <Route path="/envios/editar/:id" component={EditarEnvio} />,
      { route: "/envios/editar/9" }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^nombre/i)).toHaveValue("Juan");
    });

    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(envioApi.update).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("El teléfono no es válido.")
    ).toBeInTheDocument();
  });

  it("no permite editar un envío en estado terminal (entregado/rechazado)", async () => {
    envioApi.getById.mockResolvedValue({ ...EXISTING_ENVIO, estado: "entregado" });

    renderWithProviders(
      <Route path="/envios/editar/:id" component={EditarEnvio} />,
      { route: "/envios/editar/9" }
    );

    await waitFor(() => {
      expect(envioApi.getById).toHaveBeenCalledWith("9");
    });

    expect(
      await screen.findByText(/no se puede editar en su estado actual/i)
    ).toBeInTheDocument();

    expect(screen.queryByLabelText(/^nombre/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guardar cambios/i })
    ).not.toBeInTheDocument();
  });
});
