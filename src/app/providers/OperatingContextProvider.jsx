import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@contexts/auth";
import { OperatingContext } from "@contexts/operatingContext";
import { hasRole, ROLE_SUPERUSER } from "@domain/roles";
import { sucursalApi, empresaApi } from "@api";

const STORAGE_PREFIX = "shipgo:operatingSucursal:";
const STALE_TIME = 5 * 60_000;

/**
 * Lee la sucursal operativa persistida para un usuario dado. Namespaced por
 * `userId` para no filtrar la selección de un SUPERUSER a la sesión de otro
 * usuario en el mismo navegador (ej. dos SUPERUSER que comparten una máquina).
 */
const readStoredSucursalId = (userId) => {
  if (typeof window === "undefined" || userId == null) return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw == null || raw === "") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    // localStorage no disponible (modo privado, cuotas, etc.) — la selección
    // sigue funcionando en memoria durante la sesión, sólo no persiste.
    return null;
  }
};

const writeStoredSucursalId = (userId, sucursalId) => {
  if (typeof window === "undefined" || userId == null) return;
  try {
    const key = `${STORAGE_PREFIX}${userId}`;
    if (sucursalId == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(sucursalId));
    }
  } catch {
    // Ídem: falla silenciosa, no es crítico para operar.
  }
};

/**
 * Contexto operativo del SUPERUSER (SHG-FE-052): expone la sucursal que el
 * SUPERUSER eligió para operar (ver selector en el header, `ROLES_WEB`
 * `Header.jsx`), persistida en `localStorage` por usuario.
 *
 * **Default ("sin selección") = `activeSucursalId: null`** → "toda la
 * empresa", que es exactamente lo que el backend ya devuelve para un
 * SUPERUSER que no manda un filtro de sucursal (`CONTRACTS.md §3`, tenant
 * scoping de `SHG-BE-023`) — no hace falta forzar al SUPERUSER a elegir algo
 * al entrar.
 *
 * **SUPERUSER sin sucursal propia** (`user.sucursal == null`, caso real del
 * seed dev — usuario `super`): el catálogo de sucursales (`GET
 * /api/sucursal/all`) y el de empresa (`GET /api/empresa/mia`) igual se traen
 * con normalidad (son server-side por el usuario logueado, no dependen de
 * `user.sucursal`), así que el selector funciona igual. Lo que SÍ queda
 * limitado — documentado para el orquestador, no se resuelve acá — es que
 * ciertas pantallas (`CrearViaje`, `CrearEnvios`) no pueden hacer que el
 * backend real HONRE la sucursal elegida acá como "sucursal de origen": ver
 * los comentarios en esas pantallas.
 */
const OperatingContextProvider = ({ children }) => {
  const { user } = useAuth();
  const isSuperUser = Boolean(user) && hasRole(user, ROLE_SUPERUSER);
  const userId = user?.id ?? null;

  const [activeSucursalId, setActiveSucursalIdState] = useState(() =>
    isSuperUser ? readStoredSucursalId(userId) : null,
  );

  // Si cambia el usuario logueado (login/logout, o "cambiar de cuenta" en la
  // misma pestaña) recargar la selección persistida de ESE usuario, o limpiar
  // si no es SUPERUSER.
  useEffect(() => {
    setActiveSucursalIdState(isSuperUser ? readStoredSucursalId(userId) : null);
  }, [userId, isSuperUser]);

  const setActiveSucursalId = useCallback(
    (nextId) => {
      const normalized = nextId == null || nextId === "" ? null : Number(nextId);
      setActiveSucursalIdState(Number.isFinite(normalized) ? normalized : null);
      writeStoredSucursalId(userId, Number.isFinite(normalized) ? normalized : null);
    },
    [userId],
  );

  // `GET /api/sucursal/all` es SUPERUSER-only (`CONTRACTS.md §3`) — la query
  // queda deshabilitada para cualquier otro rol.
  const sucursalesQuery = useQuery({
    queryKey: ["operating-context", "sucursales"],
    queryFn: () => sucursalApi.getAll(),
    enabled: isSuperUser,
    staleTime: STALE_TIME,
  });

  // `GET /api/empresa/mia` (SHG-BE-022) — sólo informativo (nombre de la
  // empresa); si falla no bloquea el selector de sucursal.
  const empresaQuery = useQuery({
    queryKey: ["operating-context", "empresa"],
    queryFn: () => empresaApi.getMia(),
    enabled: isSuperUser,
    staleTime: STALE_TIME,
    retry: false,
  });

  const sucursales = useMemo(() => sucursalesQuery.data ?? [], [sucursalesQuery.data]);

  const activeSucursal = useMemo(
    () => sucursales.find((s) => s.id === activeSucursalId) ?? null,
    [sucursales, activeSucursalId],
  );

  const value = useMemo(
    () => ({
      isSuperUser,
      activeSucursalId: isSuperUser ? activeSucursalId : null,
      activeSucursal: isSuperUser ? activeSucursal : null,
      setActiveSucursalId,
      sucursales: isSuperUser ? sucursales : [],
      isLoadingSucursales: isSuperUser && sucursalesQuery.isLoading,
      empresa: isSuperUser ? (empresaQuery.data ?? null) : null,
      hasSucursalPropia: Boolean(user?.sucursal),
    }),
    [
      isSuperUser,
      activeSucursalId,
      activeSucursal,
      setActiveSucursalId,
      sucursales,
      sucursalesQuery.isLoading,
      empresaQuery.data,
      user?.sucursal,
    ],
  );

  return (
    <OperatingContext.Provider value={value}>{children}</OperatingContext.Provider>
  );
};

export default OperatingContextProvider;
