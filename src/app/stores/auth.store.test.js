import { describe, expect, it, vi, beforeEach } from "vitest";

import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { useAuthStore, Usuario } from "./auth.store";
import { usuarioApi } from "@api/usuario.api";

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

const resetStore = () => {
  window.localStorage.clear();
  useAuthStore.setState({ user: null, isLoading: false, isAuthenticated: false });
};

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

const CUSTOMER_ME = {
  email: "cliente@mail.com",
  nombre: "Carla",
  apellido: "Cliente",
};
const ADMIN_ME = {
  id: 1,
  nombre: "Ana",
  apellido: "Admin",
  authorities: [{ name: "ROLE_ADMIN" }],
};

const urlsLlamadas = () => restclient.get.mock.calls.map(([url]) => url);

describe("auth.store · pista de sesión (SHG-FE-112)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetStore();
  });

  it("CUSTOMER con pista: no llama a /whoami y recuerda la pista", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "customer");
    restclient.get.mockResolvedValueOnce({ data: CUSTOMER_ME });

    const user = await useAuthStore.getState().getUserInfo();

    expect(urlsLlamadas()).toEqual([API_URLS.CUSTOMER_ME_URL]);
    expect(user.getAuthorities()).toEqual(["ROLE_CUSTOMER"]);
  });

  it("sin pista un CUSTOMER entra por el fallback y deja la pista para la próxima", async () => {
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockResolvedValueOnce({ data: CUSTOMER_ME });
    await useAuthStore.getState().getUserInfo();
    expect(window.localStorage.getItem("shipgo.sessionHint")).toBe("customer");

    restclient.get.mockClear();
    restclient.get.mockResolvedValueOnce({ data: CUSTOMER_ME });
    await useAuthStore.getState().getUserInfo();
    expect(urlsLlamadas()).toEqual([API_URLS.CUSTOMER_ME_URL]);
  });

  it("ADMIN con pista de staff: no llama a /customer/me", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "staff");
    restclient.get.mockResolvedValueOnce({ data: ADMIN_ME });

    const user = await useAuthStore.getState().getUserInfo();

    expect(urlsLlamadas()).toEqual([API_URLS.WHOAMI_URL]);
    expect(user.getAuthorities()).toEqual(["ROLE_ADMIN"]);
    expect(window.localStorage.getItem("shipgo.sessionHint")).toBe("staff");
  });

  it("pista de customer pero ahora es ADMIN: customer/me da 403, entra por /whoami con su rol", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "customer");
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockResolvedValueOnce({ data: ADMIN_ME });

    const user = await useAuthStore.getState().getUserInfo();

    expect(urlsLlamadas()).toEqual([API_URLS.CUSTOMER_ME_URL, API_URLS.WHOAMI_URL]);
    expect(user.getAuthorities()).toEqual(["ROLE_ADMIN"]);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(window.localStorage.getItem("shipgo.sessionHint")).toBe("staff");
  });

  it("pista de staff pero ahora es CUSTOMER: /whoami da 403, entra por /customer/me", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "staff");
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockResolvedValueOnce({ data: CUSTOMER_ME });

    const user = await useAuthStore.getState().getUserInfo();

    expect(urlsLlamadas()).toEqual([API_URLS.WHOAMI_URL, API_URLS.CUSTOMER_ME_URL]);
    expect(user.getAuthorities()).toEqual(["ROLE_CUSTOMER"]);
    expect(window.localStorage.getItem("shipgo.sessionHint")).toBe("customer");
  });

  it("la pista no otorga permisos: con pista de customer el rol sale de la respuesta de /whoami", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "customer");
    restclient.get
      .mockRejectedValueOnce(forbidden())
      .mockResolvedValueOnce({ data: ADMIN_ME });
    const user = await useAuthStore.getState().getUserInfo();
    expect(user.hasRole("ROLE_CUSTOMER")).toBe(false);
  });

  it("pista de customer y customer/me da 500: propaga el error sin probar /whoami", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "customer");
    const err = new Error("server");
    err.response = { status: 500 };
    restclient.get.mockRejectedValueOnce(err);

    await expect(useAuthStore.getState().getUserInfo()).rejects.toThrow("server");
    expect(urlsLlamadas()).toEqual([API_URLS.CUSTOMER_ME_URL]);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("pista de customer y ambos endpoints deniegan: propaga el error y no autentica", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "customer");
    restclient.get.mockRejectedValueOnce(forbidden()).mockRejectedValueOnce(forbidden());

    await expect(useAuthStore.getState().getUserInfo()).rejects.toBeDefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("un valor basura en la pista se ignora (primero /whoami)", async () => {
    window.localStorage.setItem("shipgo.sessionHint", "ROLE_ADMIN");
    restclient.get.mockResolvedValueOnce({ data: ADMIN_ME });
    await useAuthStore.getState().getUserInfo();
    expect(urlsLlamadas()).toEqual([API_URLS.WHOAMI_URL]);
  });

  it("si localStorage tira error, getUserInfo funciona igual", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    restclient.get.mockResolvedValueOnce({ data: ADMIN_ME });
    const user = await useAuthStore.getState().getUserInfo();
    expect(user.isAdmin()).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("auth.store · logout y updateToken (SHG-FE-112)", () => {
  const { updateToken: updateTokenApi } = usuarioApi;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    resetStore();
    restclient.post.mockResolvedValue({});
    // jsdom no implementa la navegación de `location.href`; se ignora.
  });

  it("logout de CUSTOMER no llama a updateToken pero sí cierra la sesión", async () => {
    useAuthStore.setState({
      user: new Usuario({ ...CUSTOMER_ME, authorities: [{ name: "ROLE_CUSTOMER" }] }),
      isAuthenticated: true,
    });
    await useAuthStore.getState().logout();
    expect(updateTokenApi).not.toHaveBeenCalled();
    expect(restclient.post).toHaveBeenCalledWith(API_URLS.LOGOUT_URL, {});
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("logout de ADMIN sigue llamando a updateToken(null)", async () => {
    useAuthStore.setState({ user: new Usuario(ADMIN_ME), isAuthenticated: true });
    await useAuthStore.getState().logout();
    expect(updateTokenApi).toHaveBeenCalledWith(null);
    expect(restclient.post).toHaveBeenCalledWith(API_URLS.LOGOUT_URL, {});
  });

  it("logout de ADMIN cierra la sesión aunque updateToken falle", async () => {
    updateTokenApi.mockRejectedValueOnce(forbidden());
    useAuthStore.setState({ user: new Usuario(ADMIN_ME), isAuthenticated: true });
    await useAuthStore.getState().logout();
    expect(restclient.post).toHaveBeenCalledWith(API_URLS.LOGOUT_URL, {});
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
