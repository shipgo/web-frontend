import { create } from "zustand";
import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { captchaHeader } from "@config/captcha";
import { usuarioApi } from "@api/usuario.api";
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

  // Inicializar usuario al cargar la app
  initUser: async () => {
    try {
      set({ isLoading: true });
      const response = await restclient.get(API_URLS.REFRESH_TOKEN_URL);

      if (response.data?.access_token) {
        await get().getUserInfo();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error initializing user:", error);
      set({ user: null, isAuthenticated: false });
      return false;
    } finally {
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
  getUserInfo: async () => {
    try {
      const response = await restclient.get(API_URLS.WHOAMI_URL);
      const user = new Usuario(response.data);
      set({ user, isAuthenticated: true });
      return user;
    } catch (error) {
      if (error?.response?.status === 403) {
        try {
          const { data } = await restclient.get(API_URLS.CUSTOMER_ME_URL);
          const user = new Usuario({
            ...data,
            authorities: [{ name: ROLE_CUSTOMER }],
          });
          set({ user, isAuthenticated: true });
          return user;
        } catch (customerError) {
          // Un 401/403 acá es esperable (sesión vencida / no es un CUSTOMER):
          // no es un error a nivel `error`. Sólo se loguea lo inesperado.
          const st = customerError?.response?.status;
          if (st !== 401 && st !== 403) {
            console.warn("Error getting customer info:", customerError);
          }
          throw customerError;
        }
      }
      console.error("Error getting user info:", error);
      throw error;
    }
  },

  // Login.
  // `credentials.captchaToken` (SHG-FE-043 / SHG-BE-032) viaja en el header
  // `X-Captcha-Token` — el backend lo exige vía `TurnstileLoginFilter` antes de
  // intentar autenticar (400 `captcha_invalid` si falta/es inválido/venció).
  login: async (credentials) => {
    try {
      set({ isLoading: true });

      const body = `username=${credentials.username}&password=${credentials.password}`;
      await restclient.post(API_URLS.LOGIN_URL, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...captchaHeader(credentials.captchaToken),
        },
      });

      await get().getUserInfo();
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
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
      if (user) {
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
    set({ user: user ? new Usuario(user) : null, isAuthenticated: !!user });
  },
}));
