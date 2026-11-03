import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { trackingApi } from '@api/tracking.api';

const BACKOFF_BASE_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

/**
 * Se suscribe vía SSE a las novedades de ubicación de los viajes en_camino
 * de las sucursales a las que el usuario tiene acceso (el backend resuelve
 * el alcance según el rol: ADMIN -> su sucursal, SUPERUSER -> toda la empresa).
 *
 * Si el `EventSource` corta (`onerror`), reconecta automáticamente con backoff
 * exponencial (1s, 2s, 4s... hasta un tope de 30s) en lugar de depender del
 * reintento nativo del browser (sin backoff propio, puede machacar al server).
 * Al reconectar con éxito luego de un corte, dispara un refetch de
 * `useViajesEnCurso` (vía `viajesNuevosTick`, igual que un `viaje-iniciado`) y
 * de las últimas ubicaciones conocidas (`GET /api/tracking/viaje/{id}/last`,
 * `SHG-FE-014`) — mientras el stream estuvo caído pueden haber quedado
 * viejas.
 *
 * Expone:
 * - locationsByViajeId: última ubicación conocida en vivo, por viajeId
 * - viajesFinalizados: Set de viajeIds que dejaron de estar en_camino
 * - viajesNuevosTick: cantidad de eventos "viaje-iniciado" recibidos + veces
 *   que se reconectó tras un corte, útil como trigger para refetchear el
 *   listado de viajes en curso
 * - status: 'connecting' | 'open' | 'error'
 */
export const useTrackingStream = () => {
  const [locationsByViajeId, setLocationsByViajeId] = useState({});
  const [viajesFinalizados, setViajesFinalizados] = useState(() => new Set());
  const [viajesNuevosTick, setViajesNuevosTick] = useState(0);
  const [status, setStatus] = useState('connecting');
  const emitterRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  // Track si alguna vez tuvimos una conexión exitosa, para distinguir
  // "primera conexión fallida que se recupera" de "reconexión genuina tras un corte".
  const everOpenedRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      const emitter = new EventSource(trackingApi.getStreamUrl(), {
        withCredentials: true,
      });
      emitterRef.current = emitter;

      emitter.onopen = () => {
        if (cancelled) return;
        // Solo refetch si es una RECONEXIÓN genuina: ya tuvimos conexión exitosa,
        // luego falló, y ahora se recuperó. NO si es la primera conexión exitosa
        // después de un fallo inicial (no había eventos previos que recuperar).
        const eraUnaReconexion = everOpenedRef.current && reconnectAttemptRef.current > 0;
        everOpenedRef.current = true;
        reconnectAttemptRef.current = 0;
        setStatus('open');

        if (eraUnaReconexion) {
          setViajesNuevosTick((prev) => prev + 1);
          queryClient.invalidateQueries({ queryKey: ['ultima-ubicacion'] });
        }
      };

      emitter.onerror = () => {
        if (cancelled) return;
        setStatus('error');
        emitter.close();
        scheduleReconnect();
      };

      emitter.addEventListener('subscribed', () => {
        if (!cancelled) setStatus('open');
      });

      emitter.addEventListener('location-update', (event) => {
        const ubicacion = JSON.parse(event.data);
        setLocationsByViajeId((prev) => ({
          ...prev,
          [ubicacion.viajeId]: ubicacion,
        }));
      });

      emitter.addEventListener('viaje-iniciado', () => {
        setViajesNuevosTick((prev) => prev + 1);
      });

      emitter.addEventListener('viaje-finalizado', (event) => {
        const { viajeId } = JSON.parse(event.data);
        setViajesFinalizados((prev) => new Set(prev).add(viajeId));
        setLocationsByViajeId((prev) => {
          const next = { ...prev };
          delete next[viajeId];
          return next;
        });
      });
    };

    const scheduleReconnect = () => {
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(BACKOFF_BASE_MS * 2 ** (attempt - 1), BACKOFF_MAX_MS);

      reconnectTimeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        setStatus('connecting');
        connect();
      }, delay);
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      emitterRef.current?.close();
      emitterRef.current = null;
    };
  }, [queryClient]);

  return { locationsByViajeId, viajesFinalizados, viajesNuevosTick, status };
};
