import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, within, fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../test/renderWithProviders";

const mockUseMisEnvios = vi.fn();
vi.mock("./hooks/useMisEnvios", () => ({
  PORTAL_ENVIOS_PAGE_SIZE: 10,
  useMisEnvios: () => mockUseMisEnvios(),
}));

const mockNavigate = vi.fn();
vi.mock("wouter", async (importOriginal) => ({
  ...(await importOriginal()),
  useLocation: () => ["/portal/envios", mockNavigate],
}));

import PortalEnviosPage from "./index";

const base = {
  envios: [],
  totalPages: 0,
  totalElements: 0,
  isLoading: false,
  isError: false,
  isFetching: false,
};

describe("PortalEnviosPage", () => {
  beforeEach(() => {
    mockUseMisEnvios.mockReset();
    mockNavigate.mockReset();
  });

  it("muestra el estado vacío", () => {
    mockUseMisEnvios.mockReturnValue({ ...base });
    renderWithProviders(<PortalEnviosPage />);
    expect(screen.getByText("Todavía no tenés envíos")).toBeInTheDocument();
  });

  it("muestra el estado de error", () => {
    mockUseMisEnvios.mockReturnValue({ ...base, isError: true });
    renderWithProviders(<PortalEnviosPage />);
    expect(
      screen.getByText("No pudimos cargar tus envíos"),
    ).toBeInTheDocument();
  });

  it("renderiza una fila por envío con código, estado y destino", () => {
    mockUseMisEnvios.mockReturnValue({
      ...base,
      totalElements: 1,
      envios: [
        {
          id: 1,
          codigoSeguimiento: "SEED000001",
          estado: "en_camino",
          historialEstado: [
            { estado: "creado", fechaHoraInicio: "2026-01-01T09:00:00" },
          ],
          destino: {
            localidad: { nombre: "Córdoba", provincia: { nombre: "Córdoba" } },
          },
        },
      ],
    });
    renderWithProviders(<PortalEnviosPage />);

    expect(screen.getByText("SEED000001")).toBeInTheDocument();
    expect(screen.getByText("En camino")).toBeInTheDocument();
    expect(screen.getByText("Córdoba, Córdoba")).toBeInTheDocument();
  });

  it("una fila sin codigoSeguimiento no rompe ni queda clickeable", () => {
    mockUseMisEnvios.mockReturnValue({
      ...base,
      totalElements: 1,
      envios: [{ id: 7, estado: "creado", codigoSeguimiento: null, historialEstado: [] }],
    });
    renderWithProviders(<PortalEnviosPage />);

    const row = screen.getByText("Creado").closest("tr");
    expect(row).toBeInTheDocument();
    expect(row).not.toHaveAttribute("style", expect.stringContaining("cursor"));
  });

  describe("a 390 px (SHG-FE-112)", () => {
    const originalMatchMedia = window.matchMedia;
    const mockMobile = (matches) => {
      window.matchMedia = (query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    };
    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    const envioLargo = {
      id: 1,
      codigoSeguimiento: "SEED000001",
      estado: "asignado",
      historialEstado: [{ estado: "creado", fechaHoraInicio: "2026-01-05T09:00:00" }],
      destino: {
        localidad: { nombre: "San Salvador de Jujuy", provincia: { nombre: "Jujuy" } },
      },
    };

    it("renderiza cards (sin tabla) con código, estado, fecha y destino completos", () => {
      mockMobile(true);
      mockUseMisEnvios.mockReturnValue({ ...base, totalElements: 1, envios: [envioLargo] });
      renderWithProviders(<PortalEnviosPage />);

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const cards = screen.getByTestId("portal-envios-cards");
      expect(within(cards).getByText("SEED000001")).toBeInTheDocument();
      expect(within(cards).getByText(/asign/i)).toBeInTheDocument();
      expect(within(cards).getByText(/05\/01\/2026/)).toBeInTheDocument();
      expect(within(cards).getByText(/San Salvador de Jujuy, Jujuy/)).toBeInTheDocument();
    });

    it("la card con código navega con Enter, Espacio y click; la card sin código no navega", () => {
      mockMobile(true);
      mockUseMisEnvios.mockReturnValue({
        ...base,
        totalElements: 2,
        envios: [envioLargo, { id: 9, estado: "creado", codigoSeguimiento: null, historialEstado: [] }],
      });
      renderWithProviders(<PortalEnviosPage />);

      const botones = screen.getAllByRole("button", { name: /ver detalle/i });
      expect(botones).toHaveLength(1);
      const destino = "~/portal/envios/SEED000001";

      fireEvent.keyDown(botones[0], { key: "Enter" });
      expect(mockNavigate).toHaveBeenLastCalledWith(destino);
      mockNavigate.mockClear();
      fireEvent.keyDown(botones[0], { key: " " });
      expect(mockNavigate).toHaveBeenLastCalledWith(destino);
      mockNavigate.mockClear();
      fireEvent.keyDown(botones[0], { key: "a" });
      expect(mockNavigate).not.toHaveBeenCalled();
      fireEvent.click(botones[0]);
      expect(mockNavigate).toHaveBeenLastCalledWith(destino);

      mockNavigate.mockClear();
      const sinCodigo = screen.getByText("Creado").closest("[class*=Paper]");
      fireEvent.click(sinCodigo);
      fireEvent.keyDown(sinCodigo, { key: "Enter" });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("en escritorio sigue siendo la tabla", () => {
      mockMobile(false);
      mockUseMisEnvios.mockReturnValue({ ...base, totalElements: 1, envios: [envioLargo] });
      renderWithProviders(<PortalEnviosPage />);

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.queryByTestId("portal-envios-cards")).not.toBeInTheDocument();
    });
  });
});
