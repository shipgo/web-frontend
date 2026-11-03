import { createContext, useContext } from 'react';

/**
 * "Contexto operativo" del SUPERUSER (SHG-FE-052) — qué sucursal está mirando
 * mientras opera el panel (listados, Crear Viaje/Envío, Dashboard).
 *
 * Default = "sin selección" (`activeSucursalId: null`), que equivale a "toda
 * la empresa" — el mismo default que ya aplica el backend cuando un SUPERUSER
 * no manda un filtro de sucursal (`CONTRACTS.md §3`, `SHG-BE-023`).
 *
 * A diferencia de `AuthContext` (que exige un `AuthProvider`, ver `useAuth`),
 * este hook NO tira si no hay `OperatingContextProvider` en el árbol: en la
 * app real siempre está montado (`App.jsx`), pero mantenerlo "opcional" evita
 * tener que envolver cada test existente de `ListaEnvios`/`ListaViajes`/
 * `ListaUsuarios`/`Dashboard`/`CrearViaje`/`CrearEnvios`/`Header` sólo para
 * poder importar el hook — sin provider, todos esos consumidores ven
 * `isSuperUser: false` (comportamiento idéntico al que tenían antes de esta
 * tarea).
 */
export const DEFAULT_OPERATING_CONTEXT = {
  /** `true` sólo si el usuario logueado tiene `ROLE_SUPERUSER`. */
  isSuperUser: false,
  /** Id de la sucursal operativa activa, o `null` = "todas las sucursales". */
  activeSucursalId: null,
  /** Objeto `SucursalDTO` completo de `activeSucursalId`, o `null`. */
  activeSucursal: null,
  /** Cambia la sucursal operativa activa (`null` para volver a "todas"). */
  setActiveSucursalId: () => {},
  /** Catálogo de sucursales disponibles para elegir (vacío si no es SUPERUSER). */
  sucursales: [],
  isLoadingSucursales: false,
  /** `EmpresaDTO` de la empresa del SUPERUSER (`GET /api/empresa/mia`), o `null`. */
  empresa: null,
  /** `true` si el usuario logueado tiene una sucursal propia asignada. */
  hasSucursalPropia: false,
};

export const OperatingContext = createContext(DEFAULT_OPERATING_CONTEXT);

export const useOperatingContext = () => useContext(OperatingContext);
