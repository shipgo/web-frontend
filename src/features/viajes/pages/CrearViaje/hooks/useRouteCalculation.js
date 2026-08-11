import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { useFormContext } from "../contexts/EnviosFormContext";

const DEFAULT_CALCULATED_STATE = { ids: new Set(), returnOrigin: false };

const getIncludedPackages = (enviosIncluidos) =>
  Array.from(enviosIncluidos.values()).flatMap((entry) =>
    Array.from(entry.packages.keys()),
  );

const useRouteCalculation = () => {
  const {
    values: { enviosIncluidos },
  } = useFormContext();

  const [returnOrigin, setReturnOrigin] = useState(false);
  const [calculatedState, setCalculatedState] = useState(
    DEFAULT_CALCULATED_STATE,
  );

  const { data, mutate, reset, isPending, isError } = useMutation({
    mutationFn: () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulación de error aleatorio
          if (Math.random() < 0.5) {
            reject(new Error("Error al calcular la ruta"));
          } else {
            resolve({
              ids: new Set(getIncludedPackages(enviosIncluidos)),
              returnOrigin,
            });
          }
        }, 5000);
      });
    },
    mutationKey: ["calculatedRoute"],
    onSuccess: (_, variables) => setCalculatedState(variables),
    onError: () =>
      notifications.show({
        color: "red",
        title: "Error al calcular la ruta",
        message:
          "Ocurrió un error al calcular el trayecto. Intentá nuevamente.",
      }),
  });

  useEffect(() => {
    if (enviosIncluidos.size === 0) {
      setCalculatedState(DEFAULT_CALCULATED_STATE);
      reset();
    }
  }, [enviosIncluidos.size, reset]);

  const includedPackages = useMemo(
    () => new Set(getIncludedPackages(enviosIncluidos)),
    [enviosIncluidos],
  );

  const canCalculateNewRoute =
    !isPending &&
    enviosIncluidos.size > 0 &&
    (includedPackages.symmetricDifference(calculatedState.ids).size > 0 ||
      calculatedState.returnOrigin !== returnOrigin);

  const showAlert = calculatedState.ids.size > 0 && canCalculateNewRoute;

  const handleRouteCalculation = () =>
    mutate({ ids: includedPackages, returnOrigin });

  return {
    data,
    isError,
    isPending,
    returnOrigin,
    setReturnOrigin,
    canCalculateNewRoute,
    showAlert,
    handleRouteCalculation,
  };
};

export default useRouteCalculation;
