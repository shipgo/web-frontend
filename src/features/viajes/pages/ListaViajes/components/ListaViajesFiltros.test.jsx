import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../../test/renderWithProviders";
import ListaViajesFiltros from "./ListaViajesFiltros";

const ISO_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

describe("ListaViajesFiltros", () => {
  it("no dispara onFiltersChange al montar (sin quick-filter por defecto)", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaViajesFiltros onFiltersChange={onFiltersChange} />);

    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it("'En curso' manda estado=en_camino como valor canónico", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaViajesFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("En curso"));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        estado: { label: "estado", values: ["en_camino"] },
      });
    });
  });

  it("'Atrasados' manda estado=planificado + fechaHasta=ahora (no rango de día)", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaViajesFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("Atrasados"));

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());

    const payload = onFiltersChange.mock.calls.at(-1)[0];
    expect(payload.estado).toEqual({ label: "estado", values: ["planificado"] });
    expect(payload.fechaHasta.values).toMatch(ISO_LOCAL_DATE_TIME);
    expect(payload.fechaDesde).toBeUndefined();
    expect(payload.search).toBeUndefined();
  });

  it("clickear de nuevo la misma quick-filter la deselecciona y limpia los filtros", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaViajesFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("En curso"));
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(1));

    await user.click(screen.getByText("En curso"));
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(2));

    expect(onFiltersChange).toHaveBeenLastCalledWith({});
  });

  it("tipear en el buscador manda search luego del debounce", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaViajesFiltros onFiltersChange={onFiltersChange} />);

    await user.type(screen.getByLabelText("Buscar viaje"), "AB123CD");

    await waitFor(
      () => {
        expect(onFiltersChange).toHaveBeenCalledWith({
          search: { label: "search", values: "AB123CD" },
        });
      },
      { timeout: 2000 },
    );
  });
});
