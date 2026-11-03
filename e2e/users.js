/**
 * Usuarios seed por rol (`planning/DEV_ENV.md` §3, sólo lectura — el seed lo
 * define `SHG-BE-017`). Todos comparten la contraseña `Shipgo123!`. El campo
 * que espera `/api/login` es el `username` (no el email).
 *
 * La web (`ROLES_WEB` en `src/app/domain/roles.js`) es exclusiva de
 * `super`/`admin`; `chofer`/`carga` sólo tienen app mobile y caen en
 * `MobileOnlyScreen` tras loguear — el helper de login los soporta igual
 * (por ej. para casos que verifiquen ese guard), sólo que no hay pantallas de
 * gestión "detrás" para navegar.
 */
export const SEED_USERS = {
  super: { username: "super", role: "ROLE_SUPERUSER" },
  admin: { username: "admin", role: "ROLE_ADMIN" },
  admin2: { username: "admin2", role: "ROLE_ADMIN" },
  chofer: { username: "chofer", role: "ROLE_CHOFER" },
  chofer2: { username: "chofer2", role: "ROLE_CHOFER" },
  carga: { username: "carga", role: "ROLE_CARGA" },
  customer: { username: "customer", role: "ROLE_CUSTOMER" },
};

export const SEED_PASSWORD = "Shipgo123!";
