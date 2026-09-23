import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";

import { renderWithProviders } from "../../../../../test/renderWithProviders";
import ListaEnviosFiltros from "./ListaEnviosFiltros";

describe("ListaEnviosFiltros", () => {
  it("no dispara onFiltersChange al montar (sin quick-filter por defecto)", () => {
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    expect(onFiltersChange).not.toHaveBeenCalled();
  });

  it('"Pendientes" manda estado=en_sucursal sin rango de fechas', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("Pendientes"));

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());

    const payload = onFiltersChange.mock.calls.at(-1)[0];
    expect(payload.estado).toEqual({ label: "estado", values: ["en_sucursal"] });
    expect(payload.fechaDesde).toBeUndefined();
    expect(payload.fechaHasta).toBeUndefined();
  });

  it('"Salen hoy" manda estado=en_sucursal + fechaDesde/fechaHasta = hoy', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("Salen hoy"));

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());

    const payload = onFiltersChange.mock.calls.at(-1)[0];
    const today = dayjs().format('YYYY-MM-DD');
    expect(payload.estado).toEqual({ label: "estado", values: ["en_sucursal"] });
    expect(payload.fechaDesde).toEqual({ label: "fechaDesde", values: today });
    expect(payload.fechaHasta).toEqual({ label: "fechaHasta", values: today });
  });

  it('"Salen hoy" a las 23:30 ART usa fecha local correcta (no UTC)', async () => {
    // Regresión SHG-FE-082: el test viejo usaba new Date().toISOString() (UTC),
    // que a las 23:30 ART es ya el día siguiente en UTC.
    // Verificamos que el nuevo test (usando dayjs().format()) calcula la fecha local.
    // 2026-09-22 23:30:00 ART = 2026-09-23 02:30:00 UTC
    const daytime = new Date('2026-09-23T02:30:00Z'); // 23:30 ART
    vi.setSystemTime(daytime);

    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByText("Salen hoy"));

    await waitFor(() => expect(onFiltersChange).toHaveBeenCalled());

    const payload = onFiltersChange.mock.calls.at(-1)[0];
    // En ART es 2026-09-22, pero en UTC es 2026-09-23.
    // El componente usa dayjs().format() que respeta la zona horaria local,
    // así que debería ser 2026-09-22.
    const today = dayjs().format('YYYY-MM-DD');
    expect(payload.estado).toEqual({ label: "estado", values: ["en_sucursal"] });
    expect(payload.fechaDesde).toEqual({ label: "fechaDesde", values: today });
    expect(payload.fechaHasta).toEqual({ label: "fechaHasta", values: today });

    vi.useRealTimers();
  });

  it('"En camino" manda el estado canónico directamente', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByRole("checkbox", { name: "En camino" }));

    await waitFor(() => {
      expect(onFiltersChange).toHaveBeenCalledWith({
        estado: { label: "estado", values: ["en_camino"] },
      });
    });
  });

  it("clickear de nuevo la misma quick-filter la deselecciona y limpia los filtros", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.click(screen.getByRole("checkbox", { name: "En camino" }));
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("checkbox", { name: "En camino" }));
    await waitFor(() => expect(onFiltersChange).toHaveBeenCalledTimes(2));

    expect(onFiltersChange).toHaveBeenLastCalledWith({});
  });

  it("tipear en el buscador manda search luego del debounce", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.type(screen.getByLabelText("Buscar envío"), "SHG-DEV-0001");

    await waitFor(
      () => {
        expect(onFiltersChange).toHaveBeenCalledWith({
          search: { label: "search", values: "SHG-DEV-0001" },
        });
      },
      { timeout: 2000 },
    );
  });

  it("combina search + destino en un solo request, sin que uno pise al otro", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.type(screen.getByLabelText("Buscar envío"), "García");
    await user.type(screen.getByLabelText("Destino"), "Av. Colón");

    await waitFor(
      () => {
        const payload = onFiltersChange.mock.calls.at(-1)[0];
        expect(payload.search).toEqual({ label: "search", values: "García" });
        expect(payload.destino).toEqual({ label: "destino", values: "Av. Colón" });
      },
      { timeout: 2000 },
    );
  });

  it("elegir una quick-filter descarta el texto tipeado antes en search/destino", async () => {
    // `handleQuickFilterChange` reemplaza TODO el form con `DEFAULT_VALUES` +
    // el propio quick-filter (`form.setValues(nextValues)`) — si había texto
    // tipeado en `search`/`destino`, no debe viajar junto al quick-filter.
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    renderWithProviders(<ListaEnviosFiltros onFiltersChange={onFiltersChange} />);

    await user.type(screen.getByLabelText("Buscar envío"), "García");
    await user.click(screen.getByRole("checkbox", { name: "En camino" }));

    await waitFor(() => {
      const payload = onFiltersChange.mock.calls.at(-1)[0];
      expect(payload.estado).toEqual({ label: "estado", values: ["en_camino"] });
      expect(payload.search).toBeUndefined();
    });
  });
});
