import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const SCRIPT_ID = "cf-turnstile-script";

/**
 * `useTurnstileScript` cachea el script a nivel MÓDULO (una sola carga por
 * sesión de la app) — cada test usa `vi.resetModules()` + import dinámico
 * para arrancar con ese cache limpio, y limpia el `<script>` y `window.turnstile`
 * que pudo haber dejado el test anterior.
 */
describe("useTurnstileScript", () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.turnstile;
    document.getElementById(SCRIPT_ID)?.remove();
  });

  it('enabled=false: no inyecta el script y queda "disabled"', async () => {
    const { useTurnstileScript } = await import("./useTurnstileScript");
    const { result } = renderHook(() => useTurnstileScript(false));

    expect(result.current.status).toBe("disabled");
    expect(document.getElementById(SCRIPT_ID)).toBeNull();
  });

  it('enabled=true: inyecta el script UNA vez y pasa a "ready" al cargar', async () => {
    const { useTurnstileScript } = await import("./useTurnstileScript");
    const { result } = renderHook(() => useTurnstileScript(true));

    expect(result.current.status).toBe("loading");
    const script = document.getElementById(SCRIPT_ID);
    expect(script).not.toBeNull();
    expect(script.src).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/api.js",
    );

    window.turnstile = { render: vi.fn(), remove: vi.fn(), reset: vi.fn() };
    script.dispatchEvent(new Event("load"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.turnstile).toBe(window.turnstile);
  });

  it('si el script falla (adblock/red) queda "error" y no deja el form mudo', async () => {
    const { useTurnstileScript } = await import("./useTurnstileScript");
    const { result } = renderHook(() => useTurnstileScript(true));

    document.getElementById(SCRIPT_ID).dispatchEvent(new Event("error"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.turnstile).toBeNull();
  });

  it("retry() vuelve a pedir el script (etiqueta nueva) tras un fallo", async () => {
    const { useTurnstileScript } = await import("./useTurnstileScript");
    const { result } = renderHook(() => useTurnstileScript(true));

    const firstScript = document.getElementById(SCRIPT_ID);
    firstScript.dispatchEvent(new Event("error"));
    await waitFor(() => expect(result.current.status).toBe("error"));

    result.current.retry();
    await waitFor(() =>
      expect(result.current.status).toBe("loading"),
    );

    const secondScript = document.getElementById(SCRIPT_ID);
    expect(secondScript).not.toBeNull();
    expect(secondScript).not.toBe(firstScript); // etiqueta nueva, no la muerta

    window.turnstile = { render: vi.fn(), remove: vi.fn(), reset: vi.fn() };
    secondScript.dispatchEvent(new Event("load"));
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("si window.turnstile ya existe (otro hook ya lo cargó) no inyecta un segundo script", async () => {
    window.turnstile = { render: vi.fn(), remove: vi.fn(), reset: vi.fn() };
    const { useTurnstileScript } = await import("./useTurnstileScript");
    const { result } = renderHook(() => useTurnstileScript(true));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(document.getElementById(SCRIPT_ID)).toBeNull();
  });
});
