import { Virtuoso } from "react-virtuoso";
import { Button, Center, Text } from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";

import ItemVehiculo from "./ItemVehiculo";
import { useFormContext } from "../contexts/EnviosFormContext";
import useEnviosStats from "../hooks/useEnviosStats";

const ListaVehiculosDisponibles = ({ vehiculosQuery }) => {
  const {
    setFieldValue,
    values: { vehiculo },
  } = useFormContext();

  const { pesoTotal } = useEnviosStats();
  const {
    data,
    isFetching,
    refetch,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = vehiculosQuery;

  const handleSelectedVehicle = (vehicle) => {
    setFieldValue("vehiculo", vehicle);
  };

  const vehicles = data?.pages?.flatMap((page) => page.data) ?? [];

  return (
    <Virtuoso
      data={vehicles}
      style={{ flex: 1 }}
      components={{
        EmptyPlaceholder: () => (
          <ScreenContainer
            styleProps={{
              h: "100%",
            }}
            onLoading={{
              show: isFetching,
              description: "Cargando vehículos pendientes...",
            }}
            onError={{
              show: isError,
              onClick: refetch,
              title: "Error al cargar los vehículos",
              description:
                "Hubo un error al cargar los vehículos pendientes, por favor intenta nuevamente",
            }}
            onEmptyData={{
              show: !isFetching && !isError && vehicles.length === 0,
              title: "No hay vehículos pendientes",
              description: "No hay vehículos pendientes para seleccionar",
            }}
          />
        ),
        Footer: () => {
          if (isFetching || isError) {
            return null;
          }

          if (hasNextPage) {
            return (
              <Button
                radius={0}
                fullWidth
                h="72px"
                variant="subtle"
                onClick={fetchNextPage}
                loading={isFetchingNextPage}
                loaderProps={{
                  type: "dots",
                }}
              >
                Cargar más envíos
              </Button>
            );
          }

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
