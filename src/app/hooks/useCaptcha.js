import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCaptchaSiteKey,
  isCaptchaEnabled,
} from "@config/captcha";
import { useTurnstileScript } from "./useTurnstileScript";

const DISABLED_TOKEN = "captcha-disabled";

/**
 * Hook reusable de captcha (Cloudflare Turnstile) para las superficies
 * públicas con costo — login, tracking guest, self-signup CUSTOMER,
 * recuperación de contraseña. SHG-FE-043.
 *
 * El componente que lo use monta `containerRef` en un `<div>` vacío (o usa
 * `<CaptchaField captcha={...} />`, que ya lo hace) y no puede enviar su
 * formulario hasta que `token` deje de ser `null` — con el captcha
 * desactivado (`isCaptchaEnabled() === false`) el `token` está listo desde el
 * primer render, así que no bloquea nada.
 *
 * Estados (`status`):
 * - `"disabled"`      captcha apagado (env/CI/tests) — `token` ya listo.
 * - `"loading-script"` pidiendo `api.js` a Cloudflare.
 * - `"script-error"`   no se pudo cargar el script (adblock/red) o falta la
 *                       site key estando el captcha activo — hay que mostrar
 *                       el mensaje explicativo + botón de reintento.
 * - `"pending"`        script cargado, widget montado, esperando resolución.
 * - `"ready"`           hay un token vigente listo para mandar.
 * - `"expired"`         el token venció (~300s) — hace falta resolver de nuevo.
 * - `"error"`           el widget devolvió un error (`error-callback`).
 *
 * @returns {{
 *   enabled: boolean,
 *   token: string|null,
 *   status: string,
 *   containerRef: import('react').RefObject<HTMLDivElement>,
 *   reset: () => void,
 *   retry: () => void,
 * }}
 */
export const useCaptcha = () => {
  const enabled = isCaptchaEnabled();
  const siteKey = getCaptchaSiteKey();
  const missingSiteKey = enabled && !siteKey;

  const { status: scriptStatus, turnstile, retry: retryScript } =
    useTurnstileScript(enabled && !missingSiteKey);

  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const [token, setToken] = useState(enabled ? null : DISABLED_TOKEN);
  const [widgetState, setWidgetState] = useState("pending");

  const renderWidget = useCallback(() => {
    if (!enabled || missingSiteKey || !turnstile || !containerRef.current) {
      return;
    }
    if (widgetIdRef.current) {
      turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
    setToken(null);
    setWidgetState("pending");
    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (newToken) => {
        setToken(newToken);
        setWidgetState("ready");
      },
      "expired-callback": () => {
        setToken(null);
        setWidgetState("expired");
      },
      "error-callback": () => {
        setToken(null);
        setWidgetState("error");
      },
    });
  }, [enabled, missingSiteKey, turnstile, siteKey]);

  useEffect(() => {
    if (scriptStatus === "ready") {
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current && turnstile) {
        turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `renderWidget` ya depende de `turnstile`/`siteKey`.
  }, [scriptStatus]);

  /** Descarta el token actual y vuelve a pedir uno (token de un solo uso). */
  const reset = useCallback(() => {
    if (!enabled) return;
    if (turnstile && widgetIdRef.current) {
      setToken(null);
      setWidgetState("pending");
      turnstile.reset(widgetIdRef.current);
    } else {
      renderWidget();
    }
  }, [enabled, turnstile, renderWidget]);

  const status = !enabled
    ? "disabled"
    : missingSiteKey
      ? "script-error"
      : scriptStatus === "error"
        ? "script-error"
        : scriptStatus === "loading"
          ? "loading-script"
          : widgetState;

  return {
    enabled,
    token,
    status,
    containerRef,
    reset,
    retry: retryScript,
  };
};
