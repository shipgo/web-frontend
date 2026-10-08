import { create } from "zustand";
import { AxiosError } from "axios";
import { restclient } from "@config/restclient";
import {
  BOOTSTRAP_TIMEOUT_MS,
  BOOTSTRAP_TOTAL_TIMEOUT_MS,
} from "@constants/timeouts";
import { classifyConnectionError } from "@utils/connectionError";
import { API_URLS } from "@constants/apiUrls";
import { captchaHeader } from "@config/captcha";
import { usuarioApi } from "@api/usuario.api";
import {
  HINT_CUSTOMER,
  HINT_STAFF,
  readSessionHint,
  writeSessionHint,
} from "@utils/sessionHint";
import {
  hasAnyRole,
  hasRole,
  isAdminOrSuper,
  rolesDe,
  ROLE_ADMIN,
  ROLE_CUSTOMER,
  ROLE_SUPERUSER,
} from "@domain/roles";

/**
 * Usuario class con métodos auxiliares
 */
export class Usuario {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.fechaNacimiento = data.fechaNacimiento;
    this.prefijo = data.prefijo;
    this.telefono = data.telefono;
    this.numeroCalle = data.numeroCalle;
    this.nombreCalle = data.nombreCalle;
    this.notificationToken = data.notificationToken;
    this.notificaciones = data.notificaciones || [];
    this.email = data.email;
    // Sólo lo trae `CustomerMeDTO` (portal CUSTOMER, SHG-BE-024); `undefined`
    // para SU/AD/CH/CA. No romper `getFullName()` etc. si falta.
    this.emailVerificado = data.emailVerificado;
    this.dni = data.dni;
    this.localidad = data.localidad;
    this.sucursal = data.sucursal;
    this.sexo = data.sexo;
    this.tipoDocumento = data.tipoDocumento;
    this.profile = data.profile
      ? `${API_URLS.FILES_URL}/${data.profile}`
      : null;
    this.authorities = data.authorities || [];
  }

  getFullName() {
    return `${this.nombre} ${this.apellido}`;
  }

  getPhoneNumber() {
    return `${this.prefijo} ${this.telefono}`;
  }

  getAddress() {
    return `${this.nombreCalle} ${this.numeroCalle}`;
  }

  getLocation() {
    return `${this.localidad?.nombre || ""}, ${
      this.localidad?.provincia?.nombre || ""
    }`;
  }

  getInitials() {
    return `${this.nombre?.charAt(0) || ""}${this.apellido?.charAt(0) || ""}`;
  }

  getAuthorities() {
    return rolesDe(this);
  }

  hasRole(role) {
    return hasRole(this, role);
  }

  hasAnyRole(roles) {
    return hasAnyRole(this, roles);
  }

  isAdmin() {
    return hasRole(this, ROLE_ADMIN);
  }

  isSuperUser() {
    return hasRole(this, ROLE_SUPERUSER);
  }

  isAdminOrSuper() {
    return isAdminOrSuper(this);
  }
}

/**
 * Zustand store para autenticación
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  // SHG-FE-110: `'network'` (timeout / sin respuesta) o `'server'` (5xx) si el
  // bootstrap no pudo hablar con la API; `null` en cualquier otro caso. NO es
  // "no autenticado": no se sabe si la sesión es válida.
  connectionError: null,

  // Inicializar usuario al cargar la app
  initUser: async () => {
    let totalTimer;
    try {
      set({ isLoading: true, connectionError: null });

      const bootstrap = async () => {
        const response = await restclient.get(API_URLS.REFRESH_TOKEN_URL, {
          timeout: BOOTSTRAP_TIMEOUT_MS,
        });

        if (response.data?.access_token) {
          await get().getUserInfo();
          return true;
        }
        return false;
      };

      // Tope total del bootstrap (SHG-FE-110): envuelve refresh + whoami (+ el
      // fallback customer/me) sin alterar su lógica.
      const deadline = new Promise((_, reject) => {
        totalTimer = setTimeout(
          () =>
            reject(
              new AxiosError("timeout", AxiosError.ECONNABORTED, undefined),
            ),
          BOOTSTRAP_TOTAL_TIMEOUT_MS,
        );
      });

      return await Promise.race([bootstrap(), deadline]);
    } catch (error) {
      console.error("Error initializing user:", error);
      set({
        user: null,
        isAuthenticated: false,
        connectionError: classifyConnectionError(error),
      });
      return false;
    } finally {
      clearTimeout(totalTimer);
      set({ isLoading: false });
    }
  },

  // Obtener información del usuario actual.
  //
  // `GET /api/whoami` es SU/AD/CH/CA (CONTRACT-007): un `ROLE_CUSTOMER` recibe
  // `403`. En ese caso hacemos fallback a `GET /api/customer/me` (SHG-BE-024,
  // `CustomerMeDTO`) y construimos un `Usuario` mínimo con rol `ROLE_CUSTOMER`.
  // Así el login y el refresh al cargar la app (`initUser`) funcionan igual para
  // un customer con sesión activa.
  //
  // SHG-FE-112: para no generar un 403 seguro en cada carga de un CUSTOMER, se
  // recuerda (localStorage, `sessionHint`) el tipo de la última sesión y se
  // prueba primero el endpoint que corresponde. Es sólo una optimización: si la
  // pista está mal o vencida, el 403/401 del primer endpoint se resuelve
  // probando el otro, y los roles salen siempre de la respuesta del backend.
  getUserInfo: async () => {
    const fetchStaff = async () => {
      const response = await restclient.get(API_URLS.WHOAMI_URL);
      return { user: new Usuario(response.data), hint: HINT_STAFF };
    };
    const fetchCustomer = async () => {
      const { data } = await restclient.get(API_URLS.CUSTOMER_ME_URL);
      return {
        user: new Usuario({ ...data, authorities: [{ name: ROLE_CUSTOMER }] }),
        hint: HINT_CUSTOMER,
      };
    };
    const isDenied = (error) =>
      error?.response?.status === 403 || error?.response?.status === 401;

    const customerFirst = readSessionHint() === HINT_CUSTOMER;
    const [first, second] = customerFirst
      ? [fetchCustomer, fetchStaff]
      : [fetchStaff, fetchCustomer];

    let result;
    try {
      result = await first();
    } catch (error) {
      // Sin pista (o con pista de staff) sólo el 403 de `whoami` indica "es un
      // CUSTOMER" (comportamiento previo). Con pista de customer, un 401/403 de
      // `customer/me` indica que la pista está mal.
      const fallsBack = customerFirst
        ? isDenied(error)
        : error?.response?.status === 403;
      if (!fallsBack) {
        console.error("Error getting user info:", error);
        throw error;
      }
      try {
        result = await second();
      } catch (secondError) {
        // Un 401/403 acá es esperable (sesión vencida / rol sin acceso): no es
        // un error a nivel `error`. Sólo se loguea lo inesperado.
        const st = secondError?.response?.status;
        if (st !== 401 && st !== 403) {
          console.warn("Error getting user info (fallback):", secondError);
        }
        throw secondError;
      }
    }
    writeSessionHint(result.hint);
    set({ user: result.user, isAuthenticated: true });
    return result.user;
  },

  // Login.
  // `credentials.captchaToken` (SHG-FE-043 / SHG-BE-032) viaja en el header
  // `X-Captcha-Token` — el backend lo exige vía `TurnstileLoginFilter` antes de
  // intentar autenticar (400 `captcha_invalid` si falta/es inválido/venció).
  login: async (credentials) => {
    // OJO: no se prende `isLoading` acá. `AuthProvider` reemplaza TODA la app por
    // un loader mientras `isLoading` es true, lo que desmontaba `/login` y le
    // hacía perder el usuario tipeado tras un login fallido (SHG-FE-107). La
    // pantalla de login ya tiene su propio overlay de carga.
    try {
      set({ connectionError: null });

      const body = `username=${credentials.username}&password=${credentials.password}`;
      await restclient.post(API_URLS.LOGIN_URL, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...captchaHeader(credentials.captchaToken),
        },
      });

      await get().getUserInfo();
      // Hay sesión: un `connectionError` viejo del bootstrap ya no aplica.
      set({ connectionError: null });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  /**
   * Registra (o limpia, con `null`) el token de notificaciones push del usuario
   * logueado — `PUT /api/user/updateToken`. Lo llama `usePushNotifications` tras
   * suscribir el navegador a OneSignal, y `logout` para limpiarlo.
   */
  updateToken: async (token) => {
    try {
      await usuarioApi.updateToken(token ?? null);
    } catch (error) {
      console.error("Error updating notification token:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      const user = get().user;
      // `PUT /api/user/updateToken` es SU/AD/CH/CA (UserController): para un
      // CUSTOMER siempre responde 403, así que no se llama (SHG-FE-112).
      if (user && !hasRole(user, ROLE_CUSTOMER)) {
        // Limpiar token de notificaciones (best-effort: no bloquea el logout)
        try {
          await get().updateToken(null);
        } catch {
          /* el token se limpia igual en el próximo login; seguimos con el logout */
        }
      }

      await restclient.post(API_URLS.LOGOUT_URL, {});
      set({ user: null, isAuthenticated: false });

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      set({ user: null, isAuthenticated: false });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  // Cambiar contraseña del usuario logueado.
  // `POST /api/changePassword` espera `ChangePasswordForm` → `{ oldPassword, newPassword }`
  // (re-autentica con `oldPassword`). En éxito se cierra la sesión: el backend
  // invalida el token viejo y hay que volver a loguearse con la nueva.
  changePassword: async ({ oldPassword, newPassword }) => {
    try {
      await restclient.post(API_URLS.CHANGE_PASSWORD_URL, {
        oldPassword,
        newPassword,
      });
      await get().logout();
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },

  // Verificar token de recuperación
  verifyToken: async (token) => {
    try {
      const response = await restclient.get(`${API_URLS.TOKEN_URL}/${token}`);
      return response.data;
    } catch (error) {
      console.error("Verify token error:", error);
      throw error;
    }
  },

  // Verificar email para recuperación.
  // `POST /api/user/resetPassword` espera `MailFormReq` → `{ userEmail }` (público).
  // Exige captcha (SHG-FE-043 / SHG-BE-032) vía header `X-Captcha-Token`.
  verifyEmail: async (email, captchaToken) => {
    try {
      const response = await restclient.post(
        API_URLS.RECUPERAR_CUENTA_URL,
        { userEmail: email },
        { headers: captchaHeader(captchaToken) },
      );
      return response.data;
    } catch (error) {
      console.error("Verify email error:", error);
      throw error;
    }
  },

  // Cambiar contraseña con token de recuperación.
  // `POST /api/user/changePassword` espera `ChangePasswordTokenForm` →
  // `{ token, newPassword }` (público).
  resetPasswordWithToken: async ({ token, newPassword }) => {
    try {
      const response = await restclient.post(
        API_URLS.RECUPERAR_CUENTA_CONTRASEÑA_URL,
        { token, newPassword }
      );
      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  },

  // Actualizar usuario en el store
  setUser: (user) => {
    set({
      user: user ? new Usuario(user) : null,
      isAuthenticated: !!user,
      ...(user ? { connectionError: null } : {}),
    });
  },
}));
