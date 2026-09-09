import { useEffect } from "react";

import { Virtuoso } from "react-virtuoso";
import { Center, Text } from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";
import { VirtuosoItem } from "@components/VirtuosoListA11y";

import ItemVehiculo from "./ItemVehiculo";
import { useFormContext } from "../contexts/EnviosFormContext";
import useEnviosStats from "../hooks/useEnviosStats";

const ListaVehiculosDisponibles = ({
  vehiculos,
  isFetching,
  isError,
  refetch,
  fechasSeleccionadas,
}) => {
  const {
    setFieldValue,
    values: { vehiculo },
  } = useFormContext();

  const { pesoTotal } = useEnviosStats();

  // Si cambian las fechas planificadas y el vehículo que ya estaba
  // seleccionado deja de figurar entre los disponibles, se limpia la
  // selección (evita postear un vehículo que ya no está libre en la ventana).
  useEffect(() => {
    if (!vehiculo || isFetching) return;
    if (!vehiculos.some((v) => v.id === vehiculo.id)) {
      setFieldValue("vehiculo", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculos]);

  const handleSelectedVehicle = (vehicle) => {
    setFieldValue("vehiculo", vehicle);
  };

  return (
    <Virtuoso
      data={vehiculos}
      style={{ flex: 1 }}
      components={{
        Item: VirtuosoItem,
        EmptyPlaceholder: () => (
          <ScreenContainer
            styleProps={{
              h: "100%",
            }}
            onLoading={{
              show: isFetching,
              description: "Cargando vehículos disponibles...",
            }}
            onError={{
              show: isError,
              onClick: refetch,
              title: "Error al cargar los vehículos",
              description:
                "Hubo un error al cargar los vehículos disponibles, por favor intenta nuevamente",
            }}
            onEmptyData={{
              show: !isFetching && !isError && vehiculos.length === 0,
              title: fechasSeleccionadas
                ? "No hay vehículos disponibles"
                : "Seleccioná las fechas del viaje",
              description: fechasSeleccionadas
                ? "No hay vehículos disponibles para la ventana de fechas seleccionada"
                : "Completá la fecha de salida y llegada planificadas en \"Detalles del viaje\" para ver los vehículos disponibles",
            }}
          />
        ),
        Footer: () => {
          if (isFetching || isError || vehiculos.length === 0) return null;

          return (
            <Center h="72px">
              <Text c="dimmed">No hay más vehículos disponibles</Text>
            </Center>
          );
        },
      }}
      itemContent={(_, vehicle) => (
        <SelectableItemList
          singleSelection
          key={vehicle.id}
          selected={vehiculo?.id === vehicle.id}
          onClick={() => handleSelectedVehicle(vehicle)}
        >
          <ItemVehiculo vehicle={vehicle} pesoTotal={pesoTotal} />
        </SelectableItemList>
      )}
    />
  );
};

export default ListaVehiculosDisponibles;
