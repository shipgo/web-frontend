import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DEFAULT_OPERATING_CONTEXT, OperatingContext } from "@contexts/operatingContext";

vi.mock("@api", () => ({
  envioApi: { get: vi.fn() },
}));

import { envioApi } from "@api";
import { useGetEnvios } from "./useGetEnvios";

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

describe("useGetEnvios — filtro `sucursal` desde el contexto operativo (SHG-FE-052)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envioApi.get.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });
  });

  it("sin selección: NO manda el param `sucursal` (alcance normal del backend)", async () => {
    renderHook(() => useGetEnvios(), {
      wrapper: wrapperFor(DEFAULT_OPERATING_CONTEXT),
    });

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
    expect(envioApi.get.mock.calls[0][0].sucursal).toBeUndefined();
  });

  it("ADMIN con activeSucursalId seteado (no debería pasar): igual NO manda `sucursal` — el gate es isSuperUser", async () => {
    renderHook(() => useGetEnvios(), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: false, activeSucursalId: 3 }),
    });

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
    expect(envioApi.get.mock.calls[0][0].sucursal).toBeUndefined();
  });

  it("SUPERUSER con sucursal operativa activa: manda `sucursal=<id>`", async () => {
    renderHook(() => useGetEnvios(), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: true, activeSucursalId: 3 }),
    });

    await waitFor(() => expect(envioApi.get).toHaveBeenCalled());
    expect(envioApi.get.mock.calls[0][0].sucursal).toBe(3);
  });
});
