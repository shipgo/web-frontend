import { useEffect, useState } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SCRIPT_ID = "cf-turnstile-script";

/** Promesa compartida a nivel módulo: el script se pide UNA sola vez por sesión de la app. */
let scriptPromise = null;

const loadScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("no-window"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  // Si quedó un <script> de un intento anterior fallido, lo sacamos: una
  // etiqueta que ya disparó "error" no vuelve a pedir la red aunque le
  // reenganchemos listeners — `retry()` necesita una etiqueta nueva para que
  // el navegador reintente la request de verdad.
  document.getElementById(SCRIPT_ID)?.remove();

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(window.turnstile), {
      once: true,
    });
    script.addEventListener(
      "error",
      () => reject(new Error("turnstile-script-error")),
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((err) => {
    // No dejar la promesa "envenenada": un `retry()` debe poder reintentar
    // pedir el script (por ejemplo, si el usuario desactivó el adblocker).
    scriptPromise = null;
    throw err;
  });

  return scriptPromise;
};

/**
 * Carga el script de Cloudflare Turnstile (`api.js`) una sola vez a nivel app
 * y expone su estado. No renderiza ningún widget — sólo el script global
 * `window.turnstile`. Usado por `useCaptcha`.
 *
 * @param {boolean} enabled  Si es `false`, no pide el script (captcha off).
 * @returns {{ status: 'disabled'|'loading'|'ready'|'error', turnstile: object|null, retry: () => void }}
 */
export const useTurnstileScript = (enabled) => {
  const [status, setStatus] = useState(() => (enabled ? "loading" : "disabled"));
  const [turnstileApi, setTurnstileApi] = useState(() =>
    typeof window !== "undefined" ? window.turnstile ?? null : null,
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setStatus("disabled");
      return undefined;
    }

    let active = true;
    setStatus((current) => (current === "ready" ? current : "loading"));

    loadScript()
      .then((api) => {
        if (!active) return;
        setTurnstileApi(api);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [enabled, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  return { status, turnstile: turnstileApi, retry };
};
