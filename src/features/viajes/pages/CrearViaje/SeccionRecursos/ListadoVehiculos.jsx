import { useState } from "react";

import { Card } from "@mantine/core";

import { useIsMobile } from "@hooks/useIsMobile";

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
  const isMobile = useIsMobile();
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
    // Mobile: `flex="none"`. Dentro de la `Stack` (columna) un `flex={1}` ignora el alto
    // y la tarjeta quedaba del tamaño de su contenido; como la lista virtualizada no
    // tiene alto propio, medía 0 y no se veía ningún vehículo.
    <Card flex={isMobile ? "none" : 1} h="500" padding="none" shadow="none" withBorder>
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
