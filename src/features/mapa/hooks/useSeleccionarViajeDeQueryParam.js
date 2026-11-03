import { useEffect } from 'react';
import { useSearch } from 'wouter';

import { useSelectedViaje } from '../contexts/selectedViaje';

/**
 * Preselecciona el viaje pasado por `?viaje=<id>` (SHG-FE-096) — genérico a
 * propósito: lo usa el menú de fila "Monitorear" de `ListaViajesTabla` y lo
 * va a reusar "Localizar" de `ListaEnviosTabla` (SHG-FE-097).
 *
 * Si el viaje no está entre los trackeables (`ESTADOS_VIAJE_CON_TRACKING` de
 * `@domain/estados` — no despachado todavía, o ya cerrado) simplemente no
 * aparece en `viajesActivos` (`useViajesEnCurso`) y `MapDetalles` no muestra
 * el panel; no es un error, es el mismo comportamiento que si se
 * seleccionara a mano un viaje que dejó de estar activo.
 */
export const useSeleccionarViajeDeQueryParam = () => {
  const search = useSearch();
  const { setSelectedViajeId } = useSelectedViaje();

  useEffect(() => {
    const viajeParam = new URLSearchParams(search).get('viaje');
    if (!viajeParam) return;

    const viajeId = Number(viajeParam);
    if (Number.isFinite(viajeId)) setSelectedViajeId(viajeId);
  }, [search, setSelectedViajeId]);
};
