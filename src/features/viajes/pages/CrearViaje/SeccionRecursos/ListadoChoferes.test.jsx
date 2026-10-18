import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { renderWithProviders } from "../../../../../test/renderWithProviders";

vi.mock("@api", () => ({
  usuarioApi: { getChoferesDisponibles: vi.fn() },
}));

vi.mock("@contexts/auth", () => ({
  useAuth: () => ({ user: { sucursal: { id: 3, nombre: "Sucursal Norte" } } }),
}));

vi.mock("../hooks/useDisponibilidadParams", () => ({
  useDisponibilidadParams: () => ({
    desde: "2026-08-01T09:00:00",
    hasta: "2026-08-01T17:00:00",
  }),
}));

import { usuarioApi } from "@api";
import ListadoChoferes from "./ListadoChoferes";
import { FormProvider, useForm } from "../contexts/EnviosFormContext";

const JUAN = { id: 10, nombre: "Juan", apellido: "Perez" };

const Harness = () => {
  const form = useForm({ initialValues: { choferes: [] } });
  return (
    <FormProvider form={form}>
      <ListadoChoferes />
    </FormProvider>
  );
};

describe("ListadoChoferes — sucursal del viaje (SHG-FE-132)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuarioApi.getChoferesDisponibles.mockResolvedValue([JUAN]);
  });

  it("pide sólo los choferes de la sucursal del usuario (la del viaje que se crea)", async () => {
    renderWithProviders(<Harness />);

    await waitFor(() =>
      expect(usuarioApi.getChoferesDisponibles).toHaveBeenCalledWith(
        expect.objectContaining({ sucursalId: 3 }),
      ),
    );
    expect(await screen.findByText(/Juan/)).toBeInTheDocument();
  });
});
