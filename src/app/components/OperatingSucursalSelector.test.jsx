import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/renderWithProviders";
import { OperatingContext } from "@contexts/operatingContext";
import OperatingSucursalSelector from "./OperatingSucursalSelector";

const renderSelector = (value) =>
  renderWithProviders(
    <OperatingContext.Provider value={value}>
      <OperatingSucursalSelector />
    </OperatingContext.Provider>,
  );

describe("OperatingSucursalSelector (SHG-FE-052)", () => {
  it("no renderiza nada para un rol que no sea SUPERUSER", () => {
    renderSelector({ isSuperUser: false, sucursales: [], activeSucursalId: null });

    expect(
      screen.queryByRole("combobox", { name: /sucursal operativa activa/i }),
    ).not.toBeInTheDocument();
  });

  it("SUPERUSER: muestra 'Todas las sucursales' por default (sin selección)", () => {
    renderSelector({
      isSuperUser: true,
      sucursales: [
        { id: 1, nombre: "Centro" },
        { id: 2, nombre: "Norte" },
      ],
      activeSucursalId: null,
      setActiveSucursalId: () => {},
      isLoadingSucursales: false,
    });

    expect(screen.getByDisplayValue("Todas las sucursales")).toBeInTheDocument();
  });

  it("elegir una sucursal llama a setActiveSucursalId con su id", async () => {
    const user = userEvent.setup();
    const calls = [];

    renderSelector({
      isSuperUser: true,
      sucursales: [
        { id: 1, nombre: "Centro" },
        { id: 2, nombre: "Norte" },
      ],
      activeSucursalId: null,
      setActiveSucursalId: (id) => calls.push(id),
      isLoadingSucursales: false,
    });

    const combobox = screen.getByRole("combobox", {
      name: /sucursal operativa activa/i,
    });
    await user.click(combobox);
    await user.click(await screen.findByText("Norte"));

    expect(calls).toEqual(["2"]);
  });
});
