import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notifications } from "@mantine/notifications";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  usuarioApi: { delete: vi.fn() },
}));

import { usuarioApi } from "@api";
import { useDeleteUsuario } from "./useDeleteUsuario";

const Harness = ({ usuario }) => {
  const { confirmDelete } = useDeleteUsuario();
  return <button onClick={() => confirmDelete(usuario)}>Borrar</button>;
};

const USUARIO = { id: 5, username: "jperez", nombre: "Juan", apellido: "Pérez" };

describe("useDeleteUsuario (SHG-FE-121)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it.each([
    [409, "No se puede borrar al último superusuario"],
    [403, "No podés borrar a otro administrador"],
  ])("un %i del backend se muestra con su mensaje", async (status, message) => {
    const user = userEvent.setup();
    usuarioApi.delete.mockRejectedValue({
      response: { status, data: { statusCode: status, message } },
    });

    renderWithProviders(<Harness usuario={USUARIO} />);

    await user.click(screen.getByRole("button", { name: "Borrar" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});
