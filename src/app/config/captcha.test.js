import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CAPTCHA_ERROR_CODE,
  CAPTCHA_TOKEN_HEADER,
  captchaHeader,
  getCaptchaSiteKey,
  isCaptchaApiError,
  isCaptchaEnabled,
} from "./captcha";

/**
 * SHG-FE-043 — config del captcha. `isCaptchaEnabled`/`getCaptchaSiteKey`
 * leen `import.meta.env`, así que cada test restaura las env vars con
 * `vi.unstubAllEnvs()` para no filtrar entre tests.
 */
describe("captcha config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isCaptchaEnabled", () => {
    it("está apagado por default bajo Vitest (import.meta.env.TEST)", () => {
      expect(import.meta.env.TEST).toBeTruthy();
      expect(isCaptchaEnabled()).toBe(false);
    });

    it('VITE_TURNSTILE_ENABLED="false" explícito lo apaga', () => {
      vi.stubEnv("VITE_TURNSTILE_ENABLED", "false");
      expect(isCaptchaEnabled()).toBe(false);
    });

    it('VITE_TURNSTILE_ENABLED="true" explícito lo prende aunque estemos en test', () => {
      vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
      expect(isCaptchaEnabled()).toBe(true);
    });
  });

  describe("getCaptchaSiteKey", () => {
    it("devuelve la site key configurada", () => {
      vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "0xSITE-KEY");
      expect(getCaptchaSiteKey()).toBe("0xSITE-KEY");
    });

    it("devuelve null si no hay site key (nunca cae a la de test en silencio)", () => {
      vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
      expect(getCaptchaSiteKey()).toBeNull();
    });
  });

  describe("isCaptchaApiError", () => {
    it('true si el 400 trae code: "captcha_invalid" (SHG-BE-032)', () => {
      const error = {
        response: { status: 400, data: { statusCode: 400, message: "x", code: CAPTCHA_ERROR_CODE } },
      };
      expect(isCaptchaApiError(error)).toBe(true);
    });

    it("false para otros 400 (validación de negocio, sin `code`)", () => {
      const error = { response: { status: 400, data: { statusCode: 400, message: "Email ya registrado" } } };
      expect(isCaptchaApiError(error)).toBe(false);
    });

    it("false sin response (error de red) o sin error", () => {
      expect(isCaptchaApiError({ message: "Network Error" })).toBe(false);
      expect(isCaptchaApiError(undefined)).toBe(false);
    });
  });

  describe("captchaHeader", () => {
    it("arma el header acordado con backend cuando hay token", () => {
      expect(captchaHeader("tok-123")).toEqual({ [CAPTCHA_TOKEN_HEADER]: "tok-123" });
    });

    it("no manda el header (objeto vacío) sin token", () => {
      expect(captchaHeader(null)).toEqual({});
      expect(captchaHeader(undefined)).toEqual({});
      expect(captchaHeader("")).toEqual({});
    });
  });
});
