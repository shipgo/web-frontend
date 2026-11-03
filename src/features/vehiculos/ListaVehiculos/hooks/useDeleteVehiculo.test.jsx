import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Button } from "@mantine/core";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  vehiculoApi: {
    delete: vi.fn(),
  },
}));

import { vehiculoApi } from "@api";
import { useDeleteVehiculo } from "./useDeleteVehiculo";

const VEHICULO = { id: 42, patente: "AB123CD" };

const TestComponent = ({ onSuccess }) => {
  const { confirmDelete } = useDeleteVehiculo(onSuccess);
  return (
    <Button onClick={() => confirmDelete(VEHICULO)}>Eliminar</Button>
  );
};

describe("useDeleteVehiculo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehiculoApi.delete.mockResolvedValue({});
  });

  it("calls vehiculoApi.delete after the user confirms the modal", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    renderWithProviders(<TestComponent onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    const dialog = await screen.findByRole("dialog");
    const { getByRole } = within(dialog);
    await user.click(getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(vehiculoApi.delete).toHaveBeenCalledWith(42);
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
