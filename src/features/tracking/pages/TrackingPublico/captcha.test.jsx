import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route } from "wouter";

import { renderWithProviders } from "../../../../test/renderWithProviders";

/**
 * SHG-FE-043 — captcha en el tracking guest, con el widget de Turnstile
 * forzado a `enabled` (a diferencia de `index.test.jsx`, que corre con el
 * captcha apagado por default bajo Vitest). Cubre lo que ese archivo no
 * puede: la autoconsulta esperando el token, y el re-challenge en un
 * `captcha_invalid` del backend.
 */
const mockTrack = vi.fn();
vi.mock("../../api/tracking.api", () => ({
  publicTrackingApi: { track: (...args) => mockTrack(...args) },
}));

vi.mock("../../components/TrackingUbicacionMapa", () => ({
  default: () => <div data-testid="mapa-ubicacion" />,
}));

import TrackingPublicoPage from "./index";

const renderAt = (route) =>
  renderWithProviders(
    <Route path="/tracking/:codigo?" component={TrackingPublicoPage} />,
    { route },
  );

describe("TrackingPublicoPage — captcha activado (SHG-FE-043)", () => {
  let turnstileApi;

  beforeEach(() => {
    mockTrack.mockReset();
    vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "0xSITE-KEY");
    turnstileApi = { render: vi.fn(() => "widget-1"), remove: vi.fn(), reset: vi.fn() };
    window.turnstile = turnstileApi;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it("la autoconsulta de /tracking/:codigo espera a que el widget resuelva un token antes de pegarle al backend", async () => {
    renderAt("/tracking/7K2M9QX4TP");

    await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));
    expect(mockTrack).not.toHaveBeenCalled();

    const { callback } = turnstileApi.render.mock.calls[0][1];
    mockTrack.mockResolvedValue({
      codigoSeguimiento: "7K2M9QX4TP",
      estado: "creado",
      estadoLabel: "Creado",
      historial: [{ estado: "creado", fecha: "2026-09-01T10:00:00" }],
    });
    callback("cf-token-xyz");

    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith("7K2M9QX4TP", "cf-token-xyz"),
    );
  });

  it('el buscador no deja enviar el form sin token: input y botón quedan disabled hasta que resuelve', async () => {
    renderAt("/tracking");

    await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText(/código de seguimiento/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /consultar/i })).toBeDisabled();

    const { callback } = turnstileApi.render.mock.calls[0][1];
    callback("cf-token-xyz");

    await waitFor(() =>
      expect(screen.getByLabelText(/código de seguimiento/i)).toBeEnabled(),
    );
    expect(screen.getByRole("button", { name: /consultar/i })).toBeEnabled();
  });

  it('captcha_invalid del backend: muestra el error dedicado y "Reintentar" re-emite el challenge', async () => {
    const user = userEvent.setup();
    renderAt("/tracking/7K2M9QX4TP");

    await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));
    const { callback } = turnstileApi.render.mock.calls[0][1];
    mockTrack.mockRejectedValue({
      response: {
        status: 400,
        data: { statusCode: 400, message: "x", code: "captcha_invalid" },
      },
    });
    callback("cf-token-viejo");

    expect(
      await screen.findByText(/no pudimos verificar que sos una persona/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(turnstileApi.reset).toHaveBeenCalledWith("widget-1");
  });
});
