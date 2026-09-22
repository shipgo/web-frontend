import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";

// El mapa real de react-map-gl no corre en jsdom. Este mock sólo nos interesa
// para verificar que `MapCard` reenvía el prop `onClick` al `<Map>` (SHG-FE-078,
// usado por `SeccionOrigen` para el click-to-place) — expone el prop recibido
// vía un botón clickeable en vez de renderizar un mapa real.
vi.mock("react-map-gl/mapbox", () => ({
  default: ({ children, onClick }) => (
    <div data-testid="mapbox-map">
      <button
        type="button"
        onClick={() => onClick?.({ lngLat: { lat: -1.23, lng: -4.56 } })}
      >
        simular click en el mapa
      </button>
      {children}
    </div>
  ),
  FullscreenControl: () => null,
  NavigationControl: () => null,
}));

import MapCard from "./MapCard";

const renderMapCard = (props) =>
  render(
    <MantineProvider>
      <MapCard {...props} />
    </MantineProvider>,
  );

describe("MapCard", () => {
  it("reenvía el prop onClick al <Map> de react-map-gl (SHG-FE-078)", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderMapCard({ onClick: handleClick });

    await user.click(
      screen.getByRole("button", { name: /simular click en el mapa/i }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith({
      lngLat: { lat: -1.23, lng: -4.56 },
    });
  });

  it("no rompe si no se pasa onClick", async () => {
    const user = userEvent.setup();

    renderMapCard();

    await expect(
      user.click(
        screen.getByRole("button", { name: /simular click en el mapa/i }),
      ),
    ).resolves.not.toThrow();
  });
});
