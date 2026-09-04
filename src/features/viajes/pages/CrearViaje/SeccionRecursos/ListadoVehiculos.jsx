import { useState } from "react";

import { Card } from "@mantine/core";

import SearchVehiculos from "./SearchVehiculos";
import ListaVehiculosDisponibles from "./ListaVehiculosDisponibles";

import { useGetVehiculosDisponibles } from "../hooks/useGetVehiculosDisponibles";
import { useDisponibilidadParams } from "../hooks/useDisponibilidadParams";

const filterVehiculos = (vehiculos, search) => {
  if (!search) return vehiculos;
  const term = search.trim().toLowerCase();
  if (!term) return vehiculos;

  return vehiculos.filter((vehiculo) =>
    [vehiculo.patente, vehiculo.modelo?.nombre, vehiculo.modelo?.marca?.nombre]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(term)),
  );
};

const ListadoVehiculos = () => {
  const [searchValue, setSearchValue] = useState("");
  const { desde, hasta } = useDisponibilidadParams();

  const vehiculosQuery = useGetVehiculosDisponibles({ desde, hasta });
  const { data = [], isFetching, isError, refetch } = vehiculosQuery;

  const vehiculos = filterVehiculos(data, searchValue);

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <SearchVehiculos
        isFetching={isFetching}
        handleRefetch={refetch}
        handleOnSearch={setSearchValue}
      />
      <ListaVehiculosDisponibles
        vehiculos={vehiculos}
        isFetching={isFetching}
        isError={isError}
        refetch={refetch}
        fechasSeleccionadas={Boolean(desde && hasta)}
      />
    </Card>
  );
};

export default ListadoVehiculos;
