import { useMemo } from 'react';

import { TrackingContext } from '../contexts/tracking';
import { useTrackingStream } from '../hooks/useTrackingStream';
import { useViajesEnCurso } from '../hooks/useViajesEnCurso';

/**
 * Provee a todo el mapa una única suscripción SSE a /api/tracking/stream
 * (novedades de los viajes en_camino de las sucursales a las que el usuario
 * tiene acceso) junto con el listado de viajes en curso real.
 */
const TrackingProvider = ({ children }) => {
  const { locationsByViajeId, viajesFinalizados, viajesNuevosTick, status } =
    useTrackingStream();
  const { viajes, isLoading } = useViajesEnCurso(viajesNuevosTick);

  const viajesActivos = useMemo(
    () => viajes.filter((viaje) => !viajesFinalizados.has(viaje.id)),
    [viajes, viajesFinalizados],
  );

  return (
    <TrackingContext.Provider
      value={{ viajesActivos, locationsByViajeId, status, isLoading }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export default TrackingProvider;
