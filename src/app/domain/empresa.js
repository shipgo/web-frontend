import { hasRole, ROLE_SUPERUSER } from './roles';

/**
 * Onboarding de empresa (SHG-FE-116, `CONTRACTS.md §16.1`).
 *
 * Una empresa arranca con un SUPERUSER dado de alta a mano y SIN sucursal: esa
 * persona crea su empresa + primera sucursal con `POST /api/empresa`, que además
 * lo vincula. La sesión (`GET /api/whoami`) ya trae `sucursal` (con
 * `sucursal.empresa`), así que "sin empresa" es `sucursal == null` en el usuario
 * ya cargado: no hay una consulta aparte que pueda estar a medio cargar ni que
 * pueda fallar por red (si el whoami falla no hay `user`, y la guarda de sesión /
 * `ConnectionErrorScreen` ya se ocupan).
 */

/** `code` del `409` que devuelve el backend a un SUPERUSER sin empresa (§13/§16.1). */
export const EMPRESA_REQUERIDA_CODE = 'empresa_requerida';

/** Evento de `window` que dispara `restclient` al ver un `409 empresa_requerida`. */
export const EMPRESA_REQUERIDA_EVENT = 'shipgo:empresa-requerida';

/**
 * `true` si el usuario es SUPERUSER y todavía no tiene empresa (sin sucursal).
 * ADMIN/CHOFER/CARGA/CUSTOMER y un `user` ausente → siempre `false`.
 */
export const necesitaOnboardingEmpresa = (user) =>
  Boolean(user) && hasRole(user, ROLE_SUPERUSER) && !user.sucursal;

/** `true` si el error de axios es el `409 empresa_requerida` del backend. */
export const esEmpresaRequerida = (error) =>
  error?.response?.status === 409 &&
  error?.response?.data?.code === EMPRESA_REQUERIDA_CODE;
