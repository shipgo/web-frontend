import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DEFAULT_OPERATING_CONTEXT, OperatingContext } from "@contexts/operatingContext";

vi.mock("@api/usuario.api", () => ({
  usuarioApi: { get: vi.fn(), getAll: vi.fn() },
  authorityApi: {},
}));

import { usuarioApi } from "@api/usuario.api";
import { useGetUsuarios } from "./useGetUsuarios";

const USUARIO_CENTRO = { id: 1, sucursal: { id: 1, nombre: "Centro" } };
const USUARIO_NORTE = { id: 2, sucursal: { id: 2, nombre: "Norte" } };

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

describe("useGetUsuarios — scoping por sucursal (SHG-FE-052)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sin selección (default): pagina 100% server-side, como siempre", async () => {
    usuarioApi.get.mockResolvedValue({
      content: [USUARIO_CENTRO, USUARIO_NORTE],
      totalElements: 2,
      totalPages: 1,
    });

    const { result } = renderHook(() => useGetUsuarios(), {
      wrapper: wrapperFor(DEFAULT_OPERATING_CONTEXT),
    });

    await waitFor(() => expect(result.current.usuariosQuery.data).toBeTruthy());
    expect(usuarioApi.get).toHaveBeenCalledTimes(1);
    expect(usuarioApi.getAll).not.toHaveBeenCalled();
  });

  it("SUPERUSER con sucursal operativa activa: usa GET /api/user/all, filtra por sucursal.id y pagina client-side", async () => {
    usuarioApi.getAll.mockResolvedValue([USUARIO_CENTRO, USUARIO_NORTE]);

    const { result } = renderHook(() => useGetUsuarios(), {
      wrapper: wrapperFor({ ...DEFAULT_OPERATING_CONTEXT, isSuperUser: true, activeSucursalId: 2 }),
    });

    await waitFor(() => expect(result.current.usuariosQuery.data).toBeTruthy());

    expect(usuarioApi.get).not.toHaveBeenCalled();
    expect(usuarioApi.getAll).toHaveBeenCalledTimes(1);
    expect(result.current.usuariosQuery.data.total).toBe(1);
    expect(result.current.usuariosQuery.data.results).toEqual([USUARIO_NORTE]);
  });
});
