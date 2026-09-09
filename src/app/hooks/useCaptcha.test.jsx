import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, waitFor } from "@testing-library/react";

import { useCaptcha } from "./useCaptcha";

/**
 * `useCaptcha` monta el widget de Turnstile en el `<div>` que le pasan vía
 * `containerRef` — `renderHook` no renderiza DOM real, así que estos tests
 * usan un componente "harness" chiquito que sí lo monta y expone el último
 * valor del hook en `captchaRef.current` en cada render.
 */
let captchaRef;
const Harness = () => {
  const captcha = useCaptcha();
  captchaRef.current = captcha;
  return <div ref={captcha.containerRef} data-testid="host" />;
};

describe("useCaptcha", () => {
  beforeEach(() => {
    captchaRef = { current: null };
    delete window.turnstile;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("captcha desactivado (default bajo Vitest): token listo desde el primer render, no bloquea el form", () => {
    render(<Harness />);

    expect(captchaRef.current.enabled).toBe(false);
    expect(captchaRef.current.status).toBe("disabled");
    expect(captchaRef.current.token).toEqual(expect.any(String));
    expect(captchaRef.current.token.length).toBeGreaterThan(0);
  });

  it("activado sin site key configurada: degrada a script-error (nunca cae a una site key de test en silencio)", () => {
    vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");

    render(<Harness />);

    expect(captchaRef.current.enabled).toBe(true);
    expect(captchaRef.current.status).toBe("script-error");
    expect(captchaRef.current.token).toBeNull();
  });

  describe("activado con site key y script cargado", () => {
    let turnstileApi;

    beforeEach(() => {
      vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
      vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "0xSITE-KEY");
      turnstileApi = {
        render: vi.fn(() => "widget-1"),
        remove: vi.fn(),
        reset: vi.fn(),
      };
      // Al estar ya seteado antes del mount, `useTurnstileScript` resuelve
      // "ready" sin tener que inyectar/disparar el <script> real.
      window.turnstile = turnstileApi;
    });

    it("monta el widget con la site key configurada y arranca sin token (pending)", async () => {
      render(<Harness />);

      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));
      const [container, options] = turnstileApi.render.mock.calls[0];
      expect(container).toBeInstanceOf(HTMLElement);
      expect(options.sitekey).toBe("0xSITE-KEY");
      expect(typeof options.callback).toBe("function");

      expect(captchaRef.current.token).toBeNull();
      expect(captchaRef.current.status).toBe("pending");
    });

    it("callback(token) del widget deja un token listo para mandar", async () => {
      render(<Harness />);
      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));

      const { callback } = turnstileApi.render.mock.calls[0][1];
      callback("cf-token-123");

      await waitFor(() => expect(captchaRef.current.status).toBe("ready"));
      expect(captchaRef.current.token).toBe("cf-token-123");
    });

    it('"expired-callback" limpia el token y pide resolver de nuevo', async () => {
      render(<Harness />);
      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));

      const options = turnstileApi.render.mock.calls[0][1];
      options.callback("cf-token-123");
      await waitFor(() => expect(captchaRef.current.status).toBe("ready"));

      options["expired-callback"]();
      await waitFor(() => expect(captchaRef.current.status).toBe("expired"));
      expect(captchaRef.current.token).toBeNull();
    });

    it('"error-callback" del widget deja status "error" sin token', async () => {
      render(<Harness />);
      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));

      const options = turnstileApi.render.mock.calls[0][1];
      options["error-callback"]();

      await waitFor(() => expect(captchaRef.current.status).toBe("error"));
      expect(captchaRef.current.token).toBeNull();
    });

    it("reset() pide un token nuevo (el anterior es de un solo uso) vía turnstile.reset", async () => {
      render(<Harness />);
      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));

      const options = turnstileApi.render.mock.calls[0][1];
      options.callback("cf-token-123");
      await waitFor(() => expect(captchaRef.current.token).toBe("cf-token-123"));

      act(() => {
        captchaRef.current.reset();
      });

      expect(turnstileApi.reset).toHaveBeenCalledWith("widget-1");
      expect(captchaRef.current.token).toBeNull();
      expect(captchaRef.current.status).toBe("pending");
    });

    it("al desmontar remueve el widget (turnstile.remove)", async () => {
      const { unmount } = render(<Harness />);
      await waitFor(() => expect(turnstileApi.render).toHaveBeenCalledTimes(1));

      unmount();

      expect(turnstileApi.remove).toHaveBeenCalledWith("widget-1");
    });
  });
});
