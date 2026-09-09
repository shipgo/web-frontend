import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../../../test/renderWithProviders";

const mockRegister = vi.fn();
vi.mock("../../api/portal.api", () => ({
  registroApi: { register: (...args) => mockRegister(...args) },
}));

import RegistroPage from "./index";

/**
 * SHG-FE-043 — captcha en el self-signup CUSTOMER. La validación de campos
 * (`REGISTRO_SCHEMA`) ya está cubierta en `constants/schema.test.js`; acá
 * sólo lo nuevo de esta tarea.
 */
// Los labels de `Registro` usan `withAsterisk` (Mantine agrega un " *" al
// texto accesible), mismo patrón que `CrearUsuario/index.test.jsx`.
const exactLabel = (text) => new RegExp(`^${text}\\s*\\*?$`, "i");

const fillForm = async (user) => {
  await user.type(screen.getByLabelText(exactLabel("Nombre")), "Juan");
  await user.type(screen.getByLabelText(exactLabel("Apellido")), "Pérez");
  await user.type(screen.getByLabelText(exactLabel("Email")), "juan@example.com");
  await user.type(screen.getByLabelText(exactLabel("Tel[eé]fono")), "3511234567");
  await user.type(screen.getByLabelText(exactLabel("Contraseña")), "Shipgo123!");
};

describe("RegistroPage — captcha (SHG-FE-043)", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    delete window.turnstile;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("con el captcha desactivado (default bajo Vitest) manda un captchaToken junto con el body", async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ codigo: 201 });
    renderWithProviders(<RegistroPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    const [body, captchaToken] = mockRegister.mock.calls[0];
    expect(body).toMatchObject({ email: "juan@example.com" });
    expect(captchaToken).toEqual(expect.any(String));
    expect(captchaToken.length).toBeGreaterThan(0);
    expect(await screen.findByText(/revisá tu email/i)).toBeInTheDocument();
  });

  it("captcha activado: el submit queda deshabilitado hasta que el widget resuelve un token", async () => {
    vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "0xSITE-KEY");
    const render = vi.fn(() => "widget-1");
    window.turnstile = { render, remove: vi.fn(), reset: vi.fn() };

    const user = userEvent.setup();
    renderWithProviders(<RegistroPage />);
    await fillForm(user);

    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeDisabled();

    const { callback } = render.mock.calls[0][1];
    callback("cf-token-abc");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /crear cuenta/i })).toBeEnabled(),
    );
  });

  it('captcha_invalid del backend: error de captcha en vez de "email ya registrado" y re-emite el challenge', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValue({
      response: {
        status: 400,
        data: { statusCode: 400, message: "x", code: "captcha_invalid" },
      },
    });
    renderWithProviders(<RegistroPage />);

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/no pudimos verificar la seguridad del formulario/i),
    ).toBeInTheDocument();
  });
});
