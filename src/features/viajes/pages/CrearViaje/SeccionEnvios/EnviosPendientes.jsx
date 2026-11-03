import { useMemo, useState } from "react";
import { Card } from "@mantine/core";

import ListadoEnviosPendientes from "./ListadoEnviosPendientes";
import SearchEnviosPendientes from "./SearchEnviosPendientes";

import { useEnviosPendientes } from "../hooks/useEnviosPendientes";

/**
 * `extraEnvios` (opcional, `SHG-FE-049`): envíos a sumar a los que devuelve
 * `GET /api/envio/paraViaje` sin refetchear — los usa `EditarViaje` para que
 * los envíos YA asignados al viaje que se está editando (que no están
 * `creado`/`en_sucursal`, así que `paraViaje` no los trae) sigan apareciendo
 * en este listado. `ListadoEnviosPendientes` ya los marca "Incluido"
 * (deshabilitados) vía `isIncludedInTrip`, porque están precargados en
 * `enviosIncluidos` — el comportamiento visual es idéntico al de un envío
 * agregado durante la misma sesión de `CrearViaje`. Se deduplica por `id` por
 * si el backend llegara a devolver el mismo envío en ambas fuentes.
 */
const EnviosPendientes = ({ extraEnvios = [] }) => {
  const [searchValue, setSearchValue] = useState("");
  const [hideIncludedPackages, setHideIncludedPackages] = useState(true);

  const enviosPendientesQuery = useEnviosPendientes();

  const data = useMemo(() => {
    const base = enviosPendientesQuery.data ?? [];
    if (extraEnvios.length === 0) return base;

    const idsExistentes = new Set(base.map((envio) => envio.id));
    const extra = extraEnvios.filter((envio) => !idsExistentes.has(envio.id));
    return extra.length > 0 ? [...base, ...extra] : base;
  }, [enviosPendientesQuery.data, extraEnvios]);

  return (
    <Card h="100%" flex={1} padding="none" shadow="none" withBorder>
      <SearchEnviosPendientes
        onSearchChange={setSearchValue}
        onToggleShowIncluded={setHideIncludedPackages}
      />
      <ListadoEnviosPendientes
        queryState={{ ...enviosPendientesQuery, data }}
        searchValue={searchValue}
        hideIncludedPackages={hideIncludedPackages}
      />
    </Card>
  );
};

export default EnviosPendientes;
