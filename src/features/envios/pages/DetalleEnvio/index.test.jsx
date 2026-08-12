import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Route } from "wouter";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  envioApi: {
    getById: vi.fn(),
  },
}));

import { envioApi } from "@api";
import DetalleEnvio from "./index";

const EXISTING_ENVIO = {
  id: 9,
  nombre: "Juan",
  apellido: "García",
  emailRemitente: "remitente@test.com",
  emailReceptor: "receptor@test.com",
  prefijo: "351",
  telefono: "1234567",
  estado: "CREADO",
  codigoSeguimiento: "ABC123XYZ",
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
};

describe("DetalleEnvio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envioApi.getById.mockResolvedValue(EXISTING_ENVIO);
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
    expect(screen.getByText("Av. Colón 1234")).toBeInTheDocument();
    expect(screen.getAllByText("Córdoba").length).toBeGreaterThan(0);
    expect(screen.getByText("Documentación")).toBeInTheDocument();
    expect(screen.getByText("ABC123XYZ", { exact: false })).toBeInTheDocument();
  });
});
