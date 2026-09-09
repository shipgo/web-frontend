import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";

const mockLogin = vi.fn();
let mockUser = null;

vi.mock("@stores/auth.store", () => {
  const useAuthStore = () => ({ login: mockLogin });
  useAuthStore.getState = () => ({ user: mockUser });
  return { useAuthStore };
});

import LoginPage from "./index";

describe("LoginPage — captcha (SHG-FE-043)", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockUser = null;
    window.localStorage.clear();
    delete window.turnstile;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("con el captcha desactivado (default bajo Vitest) el submit manda un captchaToken en las credenciales", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(true);
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Usuario"), "juan");
    await user.type(screen.getByLabelText("Contraseña"), "Shipgo123!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    const credentials = mockLogin.mock.calls[0][0];
    expect(credentials).toMatchObject({ username: "juan", password: "Shipgo123!" });
    expect(credentials.captchaToken).toEqual(expect.any(String));
    expect(credentials.captchaToken.length).toBeGreaterThan(0);
  });

  it("captcha activado: el submit queda deshabilitado hasta que el widget resuelve un token", async () => {
    vi.stubEnv("VITE_TURNSTILE_ENABLED", "true");
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "0xSITE-KEY");
    const render = vi.fn(() => "widget-1");
    window.turnstile = { render, remove: vi.fn(), reset: vi.fn() };

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Usuario"), "juan");
    await user.type(screen.getByLabelText("Contraseña"), "Shipgo123!");

    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();

    // El widget resuelve: dispara el callback que le pasó `useCaptcha`.
    const { callback } = render.mock.calls[0][1];
    callback("cf-token-abc");

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled(),
    );

    mockLogin.mockResolvedValue(true);
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ captchaToken: "cf-token-abc" }),
      ),
    );
  });

  it('captcha rechazado por el backend ("captcha_invalid"): avisa y re-emite el challenge, sin mostrar "usuario/contraseña incorrectos"', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({
      response: {
        status: 400,
        data: { statusCode: 400, message: "Verificación de seguridad inválida o faltante.", code: "captcha_invalid" },
      },
    });
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText("Usuario"), "juan");
    await user.type(screen.getByLabelText("Contraseña"), "Shipgo123!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText(/no pudimos verificar que sos una persona/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/usuario y\/o contraseña incorrectos/i),
    ).not.toBeInTheDocument();
  });
});
