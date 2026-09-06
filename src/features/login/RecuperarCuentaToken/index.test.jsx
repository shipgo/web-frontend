import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("wouter", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useParams: () => ({ token: "tok-123" }) };
});

const mockVerifyToken = vi.fn();
const mockResetPassword = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: (selector) =>
    selector({
      verifyToken: mockVerifyToken,
      resetPasswordWithToken: mockResetPassword,
    }),
}));

import RecuperarCuentaToken from "./index";

describe("RecuperarCuentaToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con token inválido muestra el error y el link para pedir otro", async () => {
    mockVerifyToken.mockRejectedValue({ response: { status: 404, data: {} } });
    renderWithProviders(<RecuperarCuentaToken />);

    expect(await screen.findByText("Enlace no válido")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pedir un nuevo enlace" })
    ).toBeInTheDocument();
    expect(mockVerifyToken).toHaveBeenCalledWith("tok-123");
  });

  it("con token válido muestra el form y al enviar cambia la contraseña", async () => {
    const user = userEvent.setup();
    mockVerifyToken.mockResolvedValue({ mensaje: "ok" });
    mockResetPassword.mockResolvedValue(null);
    renderWithProviders(<RecuperarCuentaToken />);

    const nueva = await screen.findByLabelText("Nueva contraseña");
    await user.type(nueva, "claveNueva1");
    await user.type(screen.getByLabelText("Repetí la contraseña"), "claveNueva1");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: "tok-123",
        newPassword: "claveNueva1",
      })
    );
    expect(await screen.findByText("Contraseña actualizada")).toBeInTheDocument();
  });

  it("no envía si las contraseñas no coinciden", async () => {
    const user = userEvent.setup();
    mockVerifyToken.mockResolvedValue({ mensaje: "ok" });
    renderWithProviders(<RecuperarCuentaToken />);

    const nueva = await screen.findByLabelText("Nueva contraseña");
    await user.type(nueva, "claveNueva1");
    await user.type(screen.getByLabelText("Repetí la contraseña"), "otraClave2");
    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText("Las contraseñas no coinciden")
    ).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});
