import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockChangePassword = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: (selector) =>
    selector({ changePassword: mockChangePassword }),
}));

import CambiarPasswordCard from "./CambiarPasswordCard";

describe("CambiarPasswordCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envía { oldPassword, newPassword } al store", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue(undefined);
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveVieja1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveNueva2");
    await user.type(
      screen.getByLabelText("Repetí la contraseña"),
      "claveNueva2"
    );
    await user.click(
      screen.getByRole("button", { name: "Cambiar contraseña" })
    );

    await waitFor(() =>
      expect(mockChangePassword).toHaveBeenCalledWith({
        oldPassword: "claveVieja1",
        newPassword: "claveNueva2",
      })
    );
  });

  it("valida que la nueva contraseña sea distinta de la actual", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveIgual1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveIgual1");
    await user.type(
      screen.getByLabelText("Repetí la contraseña"),
      "claveIgual1"
    );
    await user.click(
      screen.getByRole("button", { name: "Cambiar contraseña" })
    );

    expect(
      await screen.findByText(
        "La nueva contraseña debe ser distinta de la actual"
      )
    ).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("muestra un error si el cambio falla", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue({
      response: { status: 401, data: { message: "Bad credentials" } },
    });
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveMala1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveNueva2");
    await user.type(
      screen.getByLabelText("Repetí la contraseña"),
      "claveNueva2"
    );
    await user.click(
      screen.getByRole("button", { name: "Cambiar contraseña" })
    );

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalled());
    expect(await screen.findByText("Bad credentials")).toBeInTheDocument();
  });
});
