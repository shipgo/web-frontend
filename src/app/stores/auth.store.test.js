import { describe, expect, it, vi, beforeEach } from "vitest";

import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { useAuthStore } from "./auth.store";

vi.mock("@config/restclient", () => ({
  restclient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock("@api/usuario.api", () => ({
  usuarioApi: { updateToken: vi.fn() },
}));

const forbidden = () => {
  const err = new Error("Forbidden");
  err.response = { status: 403, data: { statusCode: 403, message: "No tiene permisos" } };
  return err;
};

const resetStore = () =>
  useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false });

describe("auth.store · getUserInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("con /whoami OK construye el Usuario normal (SU/AD)", async () => {
    restclient.get.mockResolvedValueOnce({
      data: {
        id: 1,
        nombre: "Ana",
        apellido: "Admin",
        email: "admin@shipgo.dev",
        authorities: [{ name: "ROLE_ADMIN" }],
      },
    });

    const user = await useAuthStore.getState().getUserInfo();

    expect(restclient.get).toHaveBeenCalledTimes(1);
    expect(restclient.get).toHaveBeenCalledWith(API_URLS.WHOAMI_URL);
    expect(user.getAuthorities()).toContain("ROLE_ADMIN");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("si /whoami da 403, hace fallback a /customer/me y arma un Usuario CUSTOMER", async () => {
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockResolvedValueOnce({
        data: {
          email: "cliente@mail.com",
          nombre: "Carla",
          apellido: "Cliente",
          telefono: "3511111111",
          emailVerificado: true,
        },
      });

    const user = await useAuthStore.getState().getUserInfo();

    expect(restclient.get).toHaveBeenNthCalledWith(1, API_URLS.WHOAMI_URL);
    expect(restclient.get).toHaveBeenNthCalledWith(2, API_URLS.CUSTOMER_ME_URL);
    expect(user.getAuthorities()).toEqual(["ROLE_CUSTOMER"]);
    expect(user.getFullName()).toBe("Carla Cliente");
    expect(user.email).toBe("cliente@mail.com");
    expect(user.emailVerificado).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("si /whoami y /customer/me fallan, propaga el error y no autentica", async () => {
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockRejectedValueOnce(new Error("boom"));

    await expect(useAuthStore.getState().getUserInfo()).rejects.toThrow("boom");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("un 500 en /whoami NO dispara el fallback a /customer/me", async () => {
    const err = new Error("server");
    err.response = { status: 500 };
    restclient.get.mockRejectedValueOnce(err);

    await expect(useAuthStore.getState().getUserInfo()).rejects.toThrow("server");
    expect(restclient.get).toHaveBeenCalledTimes(1);
  });
});

describe("auth.store · initUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("un CUSTOMER con sesión activa se inicializa vía el fallback", async () => {
    restclient.get
      .mockResolvedValueOnce({ data: { access_token: "tok" } }) // /refresh
      .mockRejectedValueOnce(forbidden()) // /whoami
      .mockResolvedValueOnce({
        data: {
          email: "cliente@mail.com",
          nombre: "Carla",
          apellido: "Cliente",
          telefono: "3511111111",
          emailVerificado: true,
        },
      }); // /customer/me

    const ok = await useAuthStore.getState().initUser();

    expect(ok).toBe(true);
    expect(useAuthStore.getState().user.getAuthorities()).toEqual(["ROLE_CUSTOMER"]);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
