import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DEFAULT_OPERATING_CONTEXT, OperatingContext } from "@contexts/operatingContext";

vi.mock("@api/viaje.api", () => ({
  viajeApi: { get: vi.fn(), getAll: vi.fn() },
  detalleRecorridoApi: {},
}));

import { viajeApi } from "@api/viaje.api";
import { useGetViajes } from "./useGetViajes";

const VIAJE_CENTRO = { id: 1, sucursal: { id: 1, nombre: "Centro" } };
const VIAJE_NORTE = { id: 2, sucursal: { id: 2, nombre: "Norte" } };
const VIAJE_NORTE_2 = { id: 3, sucursal: { id: 2, nombre: "Norte" } };

const wrapperFor = (operatingContextValue) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <OperatingContext.Provider value={operatingContextValue}>
        {children}
      </OperatingContext.Provider>
    </QueryClientProvider>
  );
};

describe("useGetViajes — scoping por sucursal (SHG-FE-052)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sin OperatingContextProvider (default): pagina 100% server-side, como siempre", async () => {
    viajeApi.get.mockResolvedValue({
      content: [VIAJE_CENTRO],
      totalElements: 1,
      totalPages: 1,
    });

    const { result } = renderHook(() => useGetViajes(), {
      wrapper: wrapperFor(DEFAULT_OPERATING_CONTEXT),
    });

    await waitFor(() => expect(result.current.viajesQuery.data).toBeTruthy());

    expect(viajeApi.get).toHaveBeenCalledTimes(1);
    expect(viajeApi.getAll).not.toHaveBeenCalled();
    expect(result.current.viajesQuery.data.results).toEqual([VIAJE_CENTRO]);
  });

  it("ADMIN (isSuperUser: false) con activeSucursalId seteado (no debería pasar, pero por las dudas): ignora el scoping", async () => {
    viajeApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    const { result } = renderHook(() => useGetViajes(), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: false, activeSucursalId: 2 }),
    });

    await waitFor(() => expect(result.current.viajesQuery.data).toBeTruthy());
    expect(viajeApi.getAll).not.toHaveBeenCalled();
  });

  it("SUPERUSER con sucursal operativa activa: usa GET /api/viaje/all, filtra por sucursal.id y pagina client-side", async () => {
    viajeApi.getAll.mockResolvedValue([VIAJE_CENTRO, VIAJE_NORTE, VIAJE_NORTE_2]);

    const { result } = renderHook(() => useGetViajes(2), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: true, activeSucursalId: 2 }),
    });

    await waitFor(() => expect(result.current.viajesQuery.data).toBeTruthy());

    expect(viajeApi.get).not.toHaveBeenCalled();
    expect(viajeApi.getAll).toHaveBeenCalledTimes(1);
    // Total refleja SÓLO los viajes filtrados por sucursal (no los 3 totales).
    expect(result.current.viajesQuery.data.total).toBe(2);
    expect(result.current.viajesQuery.data.results).toEqual([VIAJE_NORTE, VIAJE_NORTE_2]);
  });

  it("SUPERUSER sin selección (activeSucursalId: null): vuelve al paginado server-side normal", async () => {
    viajeApi.get.mockResolvedValue({
      content: [VIAJE_CENTRO, VIAJE_NORTE],
      totalElements: 2,
      totalPages: 1,
    });

    const { result } = renderHook(() => useGetViajes(), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: true, activeSucursalId: null }),
    });

    await waitFor(() => expect(result.current.viajesQuery.data).toBeTruthy());
    expect(viajeApi.get).toHaveBeenCalledTimes(1);
    expect(viajeApi.getAll).not.toHaveBeenCalled();
  });
});
