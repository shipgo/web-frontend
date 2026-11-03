import { useMemo } from "react";

import { useFormContext } from "../contexts/EnviosFormContext";

/**
 * Cada entrada de `enviosIncluidos` es ya un recorrido 1:1 (un `puntoEntregaID`
 * o `sucursalDestinoID` único, ver `CrearViaje/utils.js`), así que cada una es
 * exactamente una parada — sin importar si es entrega local o transferencia.
 */
const useEnviosStats = () => {
  const {
    values: { enviosIncluidos },
  } = useFormContext();

  return useMemo(() => {
    return Array.from(enviosIncluidos.values()).reduce(
      (acc, entry) => ({
        totalPackages: acc.totalPackages + entry.packages.size,
        totalStops: acc.totalStops + 1,
        pesoTotal:
          acc.pesoTotal +
          Array.from(entry.packages.values()).reduce(
            (sum, pkg) => sum + (pkg.peso ?? 0),
            0,
          ),
      }),
      { totalPackages: 0, totalStops: 0, pesoTotal: 0 },
    );
  }, [enviosIncluidos]);
};

export default useEnviosStats;
