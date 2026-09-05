import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "../../../test/renderWithProviders";

vi.mock("@api", () => ({
  usuarioApi: { uploadProfileFile: vi.fn() },
}));

import { usuarioApi } from "@api";
import FotoPerfilUpload from "./FotoPerfilUpload";

const getFileInput = (container) => container.querySelector('input[type="file"]');

describe("FotoPerfilUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sube una imagen válida y notifica al padre con el UserDTO actualizado", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    const usuarioActualizado = { id: 1, profile: "nuevo-archivo.png" };
    usuarioApi.uploadProfileFile.mockResolvedValue(usuarioActualizado);

    const { container } = renderWithProviders(
      <FotoPerfilUpload profile={null} fullName="Juan Pérez" onUploaded={onUploaded} />
    );

    const file = new File(["contenido"], "foto.png", { type: "image/png" });
    await user.upload(getFileInput(container), file);

    await waitFor(() =>
      expect(usuarioApi.uploadProfileFile).toHaveBeenCalledWith(file)
    );
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(usuarioActualizado));
  });

  it("rechaza un archivo que no es imagen sin llamar a la API", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();

    const { container } = renderWithProviders(
      <FotoPerfilUpload profile={null} fullName="Juan Pérez" onUploaded={onUploaded} />
    );

    const file = new File(["contenido"], "documento.pdf", {
      type: "application/pdf",
    });
    await user.upload(getFileInput(container), file);

    expect(usuarioApi.uploadProfileFile).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("muestra el avatar existente cuando se pasa `profile`", () => {
    const { container } = renderWithProviders(
      <FotoPerfilUpload profile="foto-actual.jpg" fullName="Juan Pérez" onUploaded={vi.fn()} />
    );

    const avatarImg = container.querySelector("img");
    expect(avatarImg).toHaveAttribute("src", "/api/files/foto-actual.jpg");
  });
});
