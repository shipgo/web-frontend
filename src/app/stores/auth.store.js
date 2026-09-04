import { create } from "zustand";
import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import {
  hasAnyRole,
  hasRole,
  isAdminOrSuper,
  rolesDe,
  ROLE_ADMIN,
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

  // Obtener información del usuario actual
  getUserInfo: async () => {
    try {
      const response = await restclient.get(API_URLS.WHOAMI_URL);
      const user = new Usuario(response.data);
      set({ user, isAuthenticated: true });
      return user;
    } catch (error) {
      console.error("Error getting user info:", error);
      throw error;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      set({ isLoading: true });

      const body = `username=${credentials.username}&password=${credentials.password}`;
      await restclient.post(API_URLS.LOGIN_URL, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
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

  // Logout
  logout: async () => {
    try {
      const user = get().user;
      if (user) {
        // Limpiar token de notificaciones
        await restclient.put(`${API_URLS.USER_URL}/updateToken`, {
          token: null,
        });
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

  // Cambiar contraseña
  changePassword: async (passwordData) => {
    try {
      await restclient.post(API_URLS.CHANGE_PASSWORD_URL, passwordData);
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

  // Verificar email para recuperación
  verifyEmail: async (email) => {
    try {
      const response = await restclient.post(
        API_URLS.RECUPERAR_CUENTA_URL,
        email
      );
      return response.data;
    } catch (error) {
      console.error("Verify email error:", error);
      throw error;
    }
  },

  // Cambiar contraseña con token
  resetPasswordWithToken: async (data) => {
    try {
      const response = await restclient.post(
        API_URLS.RECUPERAR_CUENTA_CONTRASEÑA_URL,
        data
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
