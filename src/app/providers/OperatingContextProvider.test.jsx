import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../test/renderWithProviders";

let mockUser = null;
vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@api", () => ({
  sucursalApi: { getAll: vi.fn() },
  empresaApi: { getMia: vi.fn() },
}));

import { sucursalApi, empresaApi } from "@api";
import { useOperatingContext } from "@contexts/operatingContext";
import OperatingContextProvider from "./OperatingContextProvider";

const SUCURSALES = [
  { id: 1, nombre: "Centro" },
  { id: 2, nombre: "Norte" },
];

// Componente sonda: expone el contexto como texto/botones para poder
// asertarlo con Testing Library sin acoplarse a ningún componente de UI real.
const Probe = () => {
  const { isSuperUser, activeSucursalId, activeSucursal, setActiveSucursalId, sucursales } =
    useOperatingContext();

  return (
    <div>
      <span data-testid="is-superuser">{String(isSuperUser)}</span>
      <span data-testid="active-id">{String(activeSucursalId)}</span>
      <span data-testid="active-nombre">{activeSucursal?.nombre ?? "ninguna"}</span>
      <span data-testid="sucursales-count">{sucursales.length}</span>
      <button onClick={() => setActiveSucursalId(2)}>elegir norte</button>
      <button onClick={() => setActiveSucursalId(null)}>elegir todas</button>
    </div>
  );
};

const renderProbe = () =>
  renderWithProviders(
    <OperatingContextProvider>
      <Probe />
    </OperatingContextProvider>,
  );

describe("OperatingContextProvider (SHG-FE-052)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    sucursalApi.getAll.mockResolvedValue(SUCURSALES);
    empresaApi.getMia.mockResolvedValue({ id: 1, nombre: "ShipGo Demo S.A." });
  });

  it("ADMIN: isSuperUser false, no trae el catálogo de sucursales ni persiste nada", async () => {
    mockUser = { id: 2, authorities: [{ name: "ROLE_ADMIN" }] };
    renderProbe();

    expect(screen.getByTestId("is-superuser")).toHaveTextContent("false");
    expect(screen.getByTestId("active-id")).toHaveTextContent("null");
    await waitFor(() => expect(sucursalApi.getAll).not.toHaveBeenCalled());
  });

  it("SUPERUSER sin selección previa: default 'todas' (null) y trae el catálogo", async () => {
    mockUser = { id: 1, authorities: [{ name: "ROLE_SUPERUSER" }] };
    renderProbe();

    expect(screen.getByTestId("is-superuser")).toHaveTextContent("true");
    expect(screen.getByTestId("active-id")).toHaveTextContent("null");
    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("sucursales-count")).toHaveTextContent("2"),
    );
  });

  it("elegir una sucursal persiste en localStorage namespaced por usuario", async () => {
    mockUser = { id: 1, authorities: [{ name: "ROLE_SUPERUSER" }] };
    const user = userEvent.setup();
    renderProbe();

    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());
    await user.click(screen.getByText("elegir norte"));

    expect(screen.getByTestId("active-id")).toHaveTextContent("2");
    expect(screen.getByTestId("active-nombre")).toHaveTextContent("Norte");
    expect(window.localStorage.getItem("shipgo:operatingSucursal:1")).toBe("2");
  });

  it("volver a 'todas' limpia la persistencia", async () => {
    mockUser = { id: 1, authorities: [{ name: "ROLE_SUPERUSER" }] };
    const user = userEvent.setup();
    renderProbe();

    await waitFor(() => expect(sucursalApi.getAll).toHaveBeenCalled());
    await user.click(screen.getByText("elegir norte"));
    expect(window.localStorage.getItem("shipgo:operatingSucursal:1")).toBe("2");

    await user.click(screen.getByText("elegir todas"));
    expect(screen.getByTestId("active-id")).toHaveTextContent("null");
    expect(window.localStorage.getItem("shipgo:operatingSucursal:1")).toBeNull();
  });

  it("la selección persiste entre recargas (releída de localStorage al montar)", async () => {
    mockUser = { id: 1, authorities: [{ name: "ROLE_SUPERUSER" }] };
    window.localStorage.setItem("shipgo:operatingSucursal:1", "2");

    renderProbe();

    await waitFor(() => expect(screen.getByTestId("active-id")).toHaveTextContent("2"));
  });
});
