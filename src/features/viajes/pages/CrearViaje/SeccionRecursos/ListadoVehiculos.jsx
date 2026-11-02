import { useState } from "react";

import { Card } from "@mantine/core";

import { coincideBusqueda } from "@utils/text";

import SearchVehiculos from "./SearchVehiculos";
import ListaVehiculosDisponibles from "./ListaVehiculosDisponibles";

import { useGetVehiculosDisponibles } from "../hooks/useGetVehiculosDisponibles";
import { useGetVehiculosEnMantenimiento } from "../hooks/useGetVehiculosEnMantenimiento";
import { useDisponibilidadParams } from "../hooks/useDisponibilidadParams";

const filterVehiculos = (vehiculos, search) =>
  vehiculos.filter((vehiculo) =>
    coincideBusqueda(search, [
      vehiculo.patente,
      vehiculo.modelo?.nombre,
      vehiculo.modelo?.marca?.nombre,
    ]),
  );

const ListadoVehiculos = () => {
  const [searchValue, setSearchValue] = useState("");
  const { desde, hasta } = useDisponibilidadParams();

  const vehiculosQuery = useGetVehiculosDisponibles({ desde, hasta });
  // Vehículos que `disponibles` excluye por un mantenimiento solapado (SHG-BE-108):
  // se listan deshabilitados y con el motivo. Si esta consulta falla, el selector
  // sigue funcionando sólo con los disponibles.
  const enMantenimientoQuery = useGetVehiculosEnMantenimiento({ desde, hasta });
  const { data: enMantenimientoData = [] } = enMantenimientoQuery;

  const { data = [], isError } = vehiculosQuery;
  const isFetching = vehiculosQuery.isFetching || enMantenimientoQuery.isFetching;
  const refetch = () => {
    vehiculosQuery.refetch();
    enMantenimientoQuery.refetch();
  };

  const vehiculos = filterVehiculos(data, searchValue);
  const enMantenimiento = filterVehiculos(enMantenimientoData, searchValue);

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <SearchVehiculos
        isFetching={isFetching}
        handleRefetch={refetch}
        handleOnSearch={setSearchValue}
      />
      <ListaVehiculosDisponibles
        vehiculos={vehiculos}
        enMantenimiento={enMantenimiento}
        isFetching={isFetching}
        isError={isError}
        refetch={refetch}
        fechasSeleccionadas={Boolean(desde && hasta)}
      />
    </Card>
  );
};

export default ListadoVehiculos;
