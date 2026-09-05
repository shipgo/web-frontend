import { useMap } from "@mantine/hooks";
import { Center, Text } from "@mantine/core";

import { Virtuoso } from "react-virtuoso";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";
import { formatDireccion } from "@domain/format";

import ItemPaquete from "./ItemPaquete";
import EnviosAcciones from "./EnviosAcciones";

import { ACTIONS } from "../constants";
import { useFormContext } from "../contexts/EnviosFormContext";

const matchesSearch = (envio, search) => {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;

  const direccion = formatDireccion(envio.destino, { completa: true });
  return [String(envio.id), envio.codigoSeguimiento, direccion]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(term));
};

const ListadoEnviosPendientes = ({
  queryState,
  searchValue,
  hideIncludedPackages,
}) => {
  const { data = [], isError, refetch, isPending } = queryState;

  const {
    setFieldValue,
    values: { enviosIncluidos },
  } = useFormContext();

  const selectedPackages = useMap();

  const isIncludedInTrip = (envioId) =>
    Array.from(enviosIncluidos.values()).some((entry) =>
      entry.packages.has(envioId),
    );

  const envios = data
    .filter((envio) => matchesSearch(envio, searchValue))
    .filter((envio) => !hideIncludedPackages || !isIncludedInTrip(envio.id));

  const handlePackageSelect = (item) => {
    if (selectedPackages.has(item.id)) {
      selectedPackages.delete(item.id);
      return;
    }

    selectedPackages.set(item.id, item);
  };

  /**
   * Traduce la acción elegida ("entrega a destino final" / "transferencia a
   * sucursal") a entradas de `enviosIncluidos`. Cada entrada = un recorrido
   * (`CONTRACTS.md §8`): para entrega local se agrupa por el `destino.id`
   * propio de cada envío (puede haber varios envíos con el mismo punto de
   * entrega); para transferencia todo lo seleccionado va al mismo
   * `sucursalDestinoID` elegido en el modal.
   */
  const handleOnSelectedAction = ({ action, sucursal }) => {
    const seleccionados = Array.from(selectedPackages.values());
    const updated = new Map(enviosIncluidos);

    if (action === ACTIONS.ENTREGA_LOCAL) {
      const porDestino = new Map();
      seleccionados.forEach((envio) => {
        const destinoId = envio.destino?.id;
        if (!porDestino.has(destinoId)) porDestino.set(destinoId, []);
        porDestino.get(destinoId).push(envio);
      });

      porDestino.forEach((enviosDelDestino, destinoId) => {
        const key = `local_${destinoId}`;
        const prev = updated.get(key) ?? {
          puntoEntregaID: destinoId,
          sucursalDestinoID: null,
          label: formatDireccion(enviosDelDestino[0].destino, {
            completa: true,
          }),
          packages: new Map(),
        };

        const newPackages = new Map(prev.packages);
        enviosDelDestino.forEach((envio) => newPackages.set(envio.id, envio));

        updated.set(key, { ...prev, packages: newPackages });
      });
    } else {
      const key = `sucursal_${sucursal.id}`;
      const prev = updated.get(key) ?? {
        puntoEntregaID: null,
        sucursalDestinoID: sucursal.id,
        label: sucursal.nombre,
        packages: new Map(),
      };

      const newPackages = new Map(prev.packages);
      seleccionados.forEach((envio) => newPackages.set(envio.id, envio));

      updated.set(key, { ...prev, packages: newPackages });
    }

    setFieldValue("enviosIncluidos", updated);
    selectedPackages.clear();
  };

  return (
    <ScreenContainer
      styleProps={{
        h: "100%",
      }}
      onLoading={{
        show: isPending,
        description: "Cargando envíos pendientes...",
      }}
      onError={{
        show: isError,
        onClick: refetch,
        title: "Error al cargar los envíos",
        description:
          "Hubo un error al cargar los envíos pendientes, por favor intenta nuevamente",
      }}
      onEmptyData={{
        show: !isPending && !isError && envios.length === 0,
        title: "No hay envíos pendientes",
        description: "No hay envíos pendientes para seleccionar",
      }}
    >
      <Virtuoso
        data={envios}
        style={{ flex: 1 }}
        components={{
          Footer: () =>
            envios.length > 0 ? (
              <Center h="72px">
                <Text c="dimmed">No hay más envíos pendientes</Text>
              </Center>
            ) : null,
        }}
        itemContent={(_, item) => {
          const included = isIncludedInTrip(item.id);

          return (
            <SelectableItemList
              key={item.id}
              disabled={included}
              selected={selectedPackages.has(item.id)}
              onClick={() => handlePackageSelect(item)}
            >
              <ItemPaquete item={item} isIncludedInTrip={included} />
            </SelectableItemList>
          );
        }}
      />
      <EnviosAcciones
        selectedPackages={selectedPackages}
        onSelectedAction={handleOnSelectedAction}
      />
    </ScreenContainer>
  );
};

export default ListadoEnviosPendientes;
