import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import CaptchaField from "./CaptchaField";

/**
 * `CaptchaField` es puramente presentacional: se le pasa un objeto con la
 * forma de `useCaptcha()` armado a mano, sin depender del widget real de
 * Cloudflare (eso ya lo cubre `useCaptcha.test.jsx`).
 */
const baseCaptcha = (overrides = {}) => ({
  enabled: true,
  status: "pending",
  containerRef: { current: null },
  reset: vi.fn(),
  retry: vi.fn(),
  token: null,
  ...overrides,
});

describe("CaptchaField", () => {
  it("no renderiza nada con el captcha desactivado (dev/CI)", () => {
    const { container } = renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ enabled: false })} />,
    );
    // `MantineProvider` inyecta sus propios `<style>` en el árbol; lo que nos
    // importa es que `CaptchaField` en sí no monte ni el widget ni ningún
    // mensaje ni ningún otro elemento visible.
    expect(screen.queryByTestId("captcha-widget")).not.toBeInTheDocument();
    expect(container.querySelectorAll("*:not(style)")).toHaveLength(0);
  });

  it("muestra el loader mientras carga el script", () => {
    renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ status: "loading-script" })} />,
    );
    expect(
      screen.getByText(/cargando verificación de seguridad/i),
    ).toBeInTheDocument();
  });

  it('script-error: mensaje explicativo + botón "Reintentar" que llama a retry()', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ status: "script-error", retry })} />,
    );

    expect(
      screen.getByText(/no pudimos cargar la verificación de seguridad/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reintentar/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("expired: avisa que hay que resolver de nuevo", () => {
    renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ status: "expired" })} />,
    );
    expect(screen.getByText(/venció/i)).toBeInTheDocument();
  });

  it("error: avisa que no se pudo validar", () => {
    renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ status: "error" })} />,
    );
    expect(screen.getByText(/no pudimos validar la verificación/i)).toBeInTheDocument();
  });

  it("siempre monta el contenedor del widget (donde Cloudflare lo renderiza)", () => {
    renderWithProviders(
      <CaptchaField captcha={baseCaptcha({ status: "pending" })} />,
    );
    expect(screen.getByTestId("captcha-widget")).toBeInTheDocument();
  });
});
