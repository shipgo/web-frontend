import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import ListaSucursalesTabla from "./components/ListaSucursalesTabla";

const mockDelete = vi.fn();

vi.mock("@api/sucursal.api", () => ({
  sucursalApi: {
    delete: (...args) => mockDelete(...args),
    get: vi.fn(),
    getById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
  },
}));

const sucursal = {
  id: 3,
  nombre: "Sucursal Sur",
  email: "sur@shipgo.com",
  prefijo: "+54",
  telefono: "3510000000",
  puntoEntrega: {
    nombreCalle: "Bv. San Juan",
    numeroCalle: "500",
    localidad: { id: 1, nombre: "Córdoba Capital", provincia: { id: 2, nombre: "Córdoba" } },
  },
};

const renderWithProviders = (ui) =>
  render(
    <MantineProvider>
      <ModalsProvider>{ui}</ModalsProvider>
    </MantineProvider>
  );

describe("ListaSucursalesTabla", () => {
  beforeEach(() => {
    mockDelete.mockReset();
    mockDelete.mockResolvedValue({});
  });

  it("does not render Estado column", () => {
    renderWithProviders(
      <ListaSucursalesTabla items={[sucursal]} />
    );

    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts).not.toContain("Estado");
  });

  it("calls sucursalApi.delete when the deletion is confirmed", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    renderWithProviders(
      <ListaSucursalesTabla items={[sucursal]} onRefresh={onRefresh} />
    );

    await user.click(screen.getByLabelText("Acciones de Sucursal Sur"));
    await user.click(await screen.findByText("Eliminar"));

    expect(
      await screen.findByRole("heading", { name: "Eliminar sucursal" })
    ).toBeInTheDocument();

    const confirmButtons = await screen.findAllByRole("button", {
      name: "Eliminar",
    });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(3));
    await waitFor(() => expect(onRefresh).toHaveBeenCalled());
  });

  it("prevents double-click on delete confirmation button", async () => {
    const user = userEvent.setup({ delay: null });
    mockDelete.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({}), 500)));

    renderWithProviders(
      <ListaSucursalesTabla items={[sucursal]} />
    );

    await user.click(screen.getByLabelText("Acciones de Sucursal Sur"));
    await user.click(await screen.findByText("Eliminar"));

    expect(
      await screen.findByRole("heading", { name: "Eliminar sucursal" })
    ).toBeInTheDocument();

    const confirmButtons = await screen.findAllByRole("button", {
      name: "Eliminar",
    });
    const confirmButton = confirmButtons[confirmButtons.length - 1];

    await user.click(confirmButton);
    await user.click(confirmButton);

    await waitFor(() => expect(mockDelete).toHaveBeenCalledTimes(1), { timeout: 1000 });
  });
});
