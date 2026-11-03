import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@api", () => ({
  usuarioApi: { requestPasswordReset: vi.fn() },
}));

import { usuarioApi } from "@api";
import { usePasswordReset } from "./usePasswordReset";

const Harness = ({ usuario }) => {
  const { confirmReset } = usePasswordReset();
  return <button onClick={() => confirmReset(usuario)}>Resetear</button>;
};

describe("usePasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pide confirmación y, al confirmar, dispara POST /api/user/resetPassword con el email del usuario", async () => {
    const user = userEvent.setup();
    usuarioApi.requestPasswordReset.mockResolvedValue(null);

    renderWithProviders(
      <Harness
        usuario={{ email: "juan@example.com", nombre: "Juan", apellido: "Pérez" }}
      />
    );

    await user.click(screen.getByRole("button", { name: "Resetear" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("juan@example.com");
    expect(usuarioApi.requestPasswordReset).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Enviar email" }));

    await waitFor(() =>
      expect(usuarioApi.requestPasswordReset).toHaveBeenCalledWith(
        "juan@example.com"
      )
    );
  });

  it("cancelar el modal no dispara ningún request", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <Harness usuario={{ email: "juan@example.com", username: "jperez" }} />
    );

    await user.click(screen.getByRole("button", { name: "Resetear" }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(usuarioApi.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("sin email en el usuario, no abre el modal ni llama a la API", async () => {
    const user = userEvent.setup();

    renderWithProviders(<Harness usuario={{ username: "jperez" }} />);

    await user.click(screen.getByRole("button", { name: "Resetear" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(usuarioApi.requestPasswordReset).not.toHaveBeenCalled();
  });
});
