import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notifications } from "@mantine/notifications";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockChangePassword = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: (selector) =>
    selector({ changePassword: mockChangePassword }),
}));

import CambiarPasswordCard from "./CambiarPasswordCard";

describe("CambiarPasswordCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
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

  it.each([
    [
      '400 con code "password_incorrecta" (SHG-BE-083)',
      { status: 400, data: { message: "Otro texto", code: "password_incorrecta" } },
    ],
  ])("contraseña actual incorrecta (%s): mensaje específico", async (_n, response) => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue({ response });
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
    expect(
      (await screen.findAllByText("La contraseña actual es incorrecta")).length,
    ).toBeGreaterThan(0);
  });

  it("un 401 (sesión vencida) NO se muestra como contraseña incorrecta", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue({
      response: { status: 401, data: { message: "Bad credentials" } },
    });
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveMala1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveNueva2");
    await user.type(screen.getByLabelText("Repetí la contraseña"), "claveNueva2");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalled());
    expect(
      screen.queryByText("La contraseña actual es incorrecta"),
    ).not.toBeInTheDocument();
  });

  it("otro error sin mensaje (ej. 400 vacío): mensaje genérico", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue({ response: { status: 400, data: {} } });
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveVieja1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveNueva2");
    await user.type(screen.getByLabelText("Repetí la contraseña"), "claveNueva2");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(
      (await screen.findAllByText("No se pudo cambiar la contraseña. Intentá nuevamente.")).length,
    ).toBeGreaterThan(0);
  });

  it("otro error del backend muestra su mensaje", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue({
      response: { status: 400, data: { message: "Algo salió mal" } },
    });
    renderWithProviders(<CambiarPasswordCard />);

    await user.type(screen.getByLabelText("Contraseña actual"), "claveVieja1");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveNueva2");
    await user.type(screen.getByLabelText("Repetí la contraseña"), "claveNueva2");
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("Algo salió mal")).toBeInTheDocument();
  });

  it("enviar vacío muestra errores inline en español (sin tooltip nativo)", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<CambiarPasswordCard />);
    await user.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect(await screen.findByText("Ingresá tu contraseña actual")).toBeInTheDocument();
    expect(container.querySelector("form")).toHaveAttribute("novalidate");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });
});
