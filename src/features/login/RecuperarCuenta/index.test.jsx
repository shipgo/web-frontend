import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../test/renderWithProviders";

const mockVerifyEmail = vi.fn();
vi.mock("@stores/auth.store", () => ({
  useAuthStore: (selector) => selector({ verifyEmail: mockVerifyEmail }),
}));

import RecuperarCuenta from "./index";

describe("RecuperarCuenta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no llama a la API si el email es inválido", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecuperarCuenta />);

    await user.type(screen.getByLabelText("Email"), "no-es-un-email");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(await screen.findByText("El email no es válido")).toBeInTheDocument();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });

  it("con un email válido dispara verifyEmail y muestra el mensaje de éxito", async () => {
    const user = userEvent.setup();
    mockVerifyEmail.mockResolvedValue(null);
    renderWithProviders(<RecuperarCuenta />);

    await user.type(screen.getByLabelText("Email"), "juan@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    await waitFor(() =>
      expect(mockVerifyEmail).toHaveBeenCalledWith("juan@example.com")
    );
    expect(await screen.findByText("Revisá tu correo")).toBeInTheDocument();
  });

  it("muestra un error si la API falla", async () => {
    const user = userEvent.setup();
    mockVerifyEmail.mockRejectedValue({
      response: { status: 500, data: {} },
    });
    renderWithProviders(<RecuperarCuenta />);

    await user.type(screen.getByLabelText("Email"), "juan@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(await screen.findByText("No se pudo enviar")).toBeInTheDocument();
    expect(screen.queryByText("Revisá tu correo")).not.toBeInTheDocument();
  });
});
