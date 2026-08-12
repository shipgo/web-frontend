import { useEffect, useRef, useState } from 'react';

import { trackingApi } from '@api/tracking.api';

/**
 * Se suscribe vía SSE a las novedades de ubicación de los viajes en_camino
 * de las sucursales a las que el usuario tiene acceso (el backend resuelve
 * el alcance según el rol: ADMIN -> su sucursal, SUPERUSER -> toda la empresa).
 *
 * Expone:
 * - locationsByViajeId: última ubicación conocida en vivo, por viajeId
 * - viajesFinalizados: Set de viajeIds que dejaron de estar en_camino
 * - viajesNuevos: cantidad de eventos "viaje-iniciado" recibidos, útil como
 *   trigger para refetchear el listado de viajes en curso
 * - status: 'connecting' | 'open' | 'error'
 */
export const useTrackingStream = () => {
  const [locationsByViajeId, setLocationsByViajeId] = useState({});
  const [viajesFinalizados, setViajesFinalizados] = useState(() => new Set());
  const [viajesNuevosTick, setViajesNuevosTick] = useState(0);
  const [status, setStatus] = useState('connecting');
  const emitterRef = useRef(null);

  useEffect(() => {
    const emitter = new EventSource(trackingApi.getStreamUrl(), {
      withCredentials: true,
    });
    emitterRef.current = emitter;

    emitter.onopen = () => setStatus('open');
    emitter.onerror = () => setStatus('error');

    emitter.addEventListener('subscribed', () => setStatus('open'));

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

    return () => {
      emitter.close();
      emitterRef.current = null;
    };
  }, []);

  return { locationsByViajeId, viajesFinalizados, viajesNuevosTick, status };
};
