import { useMemo } from "react";

import { useFormContext } from "../contexts/EnviosFormContext";

const useEnviosStats = () => {
  const {
    values: { enviosIncluidos },
  } = useFormContext();

  return useMemo(() => {
    return Array.from(enviosIncluidos.entries()).reduce(
      ({ totalPackages, totalStops, pesoTotal }, [key, entry]) => ({
        totalPackages: totalPackages + entry.packages.size,
        totalStops:
          totalStops +
          (key === "entrega_local" ? entry.packages.size : 1),
        pesoTotal:
          pesoTotal +
          Array.from(entry.packages.values()).reduce(
            (sum, pkg) => sum + pkg.peso,
            0,
          ),
      }),
      { totalPackages: 0, totalStops: 0, pesoTotal: 0 },
    );
  }, [enviosIncluidos]);
};

export default useEnviosStats;
