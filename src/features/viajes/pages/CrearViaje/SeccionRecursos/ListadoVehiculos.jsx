import { useState } from "react";

import { Card } from "@mantine/core";

import { useToggle } from "@mantine/hooks";

import SearchVehiculos from "./SearchVehiculos";
import ListaVehiculosDisponibles from "./ListaVehiculosDisponibles";

import { useGetVehiculosDisponibles } from "../hooks/useGetVehiculosDisponibles";

const ListadoVehiculos = () => {
  const [searchValue, setSearchValue] = useState("");
  // const [hideUnavailableVehicles, switchHideUnavailableVehicles] = useToggle();

  const vehiculosQuery = useGetVehiculosDisponibles({ searchValue });
  const { isFetching, refetch } = vehiculosQuery;

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <SearchVehiculos
        isFetching={isFetching}
        handleRefetch={refetch}
        handleOnSearch={setSearchValue}
      />
      <ListaVehiculosDisponibles vehiculosQuery={vehiculosQuery} />
    </Card>
  );
};

export default ListadoVehiculos;
