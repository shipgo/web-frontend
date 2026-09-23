import { useMap } from "@mantine/hooks";
import { Center, Text } from "@mantine/core";

import { Virtuoso } from "react-virtuoso";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";
import { VirtuosoItem } from "@components/VirtuosoListA11y";
import { formatDireccion } from "@domain/format";

import { TIPO_ENTREGA } from "@features/envios/constants";
import { formatDestinoEnvio } from "@features/envios/utils";

import ItemPaquete from "./ItemPaquete";
import EnviosAcciones from "./EnviosAcciones";

import { ACTIONS } from "../constants";
import { useFormContext } from "../contexts/EnviosFormContext";
import { coordsDePunto } from "./utils";

/**
 * `formatDestinoEnvio` (`SHG-FE-085`) devuelve "Retiro en sucursal · <nombre>"
 * para envíos de retiro, así que la búsqueda por destino también matchea el
 * nombre de la sucursal — no sólo la dirección de entrega a domicilio.
 */
const matchesSearch = (envio, search) => {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;

  const destino = formatDestinoEnvio(envio, { completa: true });
  return [String(envio.id), envio.codigoSeguimiento, destino]
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
   *
   * `coords` (`SHG-FE-048`) se calcula una sola vez acá — al crear la
   * entrada — a partir del `destino` del primer envío (entrega local) o del
   * `puntoEntrega` de la sucursal elegida (transferencia); lo consume el
   * mapa de `SeccionResumen` y `hooks/useRouteCalculation`.
   *
   * `SHG-FE-086`: un envío `tipoEntrega = 'sucursal'` (`SHG-CONTRACT-012`) no
   * tiene `destino` — su destino final ES la sucursal que eligió el
   * remitente (`envio.sucursalEntrega`). Agruparlo por `destino?.id` (como
   * antes) mandaba todos los retiros a la misma key `local_undefined` con
   * `puntoEntregaID` y `sucursalDestinoID` ambos `null` (payload inválido,
   * `CONTRACTS.md §8` exige XOR). Acá "entrega a destino final" para un
   * retiro se rutea igual que el backend espera: como recorrido de sucursal
   * (`sucursalDestinoID = envio.sucursalEntrega.id`, key `sucursal_<id>`,
   * agrupado por sucursal de retiro — dos envíos de sucursales distintas dan
   * dos recorridos). Los envíos a domicilio siguen el camino de siempre.
   *
   * Si dos envíos de retiro comparten sucursal con una entrada ya creada por
   * "Transferencia a sucursal" (misma `sucursal_<id>`), se fusionan en el
   * mismo recorrido — es el mismo destino físico, ver `ENDPOINTS.md §4`
   * ("El front elige `sucursalDestinoID = envio.sucursalEntrega.id`").
   */
  const handleOnSelectedAction = ({ action, sucursal }) => {
    const seleccionados = Array.from(selectedPackages.values());
    const updated = new Map(enviosIncluidos);

    if (action === ACTIONS.ENTREGA_LOCAL) {
      const porDestino = new Map();
      const porSucursalRetiro = new Map();

      seleccionados.forEach((envio) => {
        if (envio.tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
          const sucursalId = envio.sucursalEntrega?.id;
          if (!porSucursalRetiro.has(sucursalId))
            porSucursalRetiro.set(sucursalId, []);
          porSucursalRetiro.get(sucursalId).push(envio);
          return;
        }

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
          coords: coordsDePunto(enviosDelDestino[0].destino),
          packages: new Map(),
        };

        const newPackages = new Map(prev.packages);
        enviosDelDestino.forEach((envio) => newPackages.set(envio.id, envio));

        updated.set(key, { ...prev, packages: newPackages });
      });

      porSucursalRetiro.forEach((enviosDeLaSucursal, sucursalId) => {
        // `sucursalId` sólo puede faltar si un envío `tipoEntrega=sucursal`
        // llega sin `sucursalEntrega` — no debería pasar (`CONTRACTS.md §12`
        // la exige obligatoria en ese caso), pero si pasa no generamos una
        // entrada `puntoEntregaID`/`sucursalDestinoID` ambos `null`:
        // `buildEnviosPuntoEntrega` (`CrearViaje/utils.js`) la filtra igual,
        // así que acá directamente no se agrupa (el envío queda sin marcar,
        // visible como "pendiente" en vez de armar un recorrido inválido).
        if (sucursalId == null) return;

        const sucursalEntrega = enviosDeLaSucursal[0].sucursalEntrega;
        const key = `sucursal_${sucursalId}`;
        const prev = updated.get(key) ?? {
          puntoEntregaID: null,
          sucursalDestinoID: sucursalId,
          label: sucursalEntrega?.nombre ?? "—",
          coords: coordsDePunto(sucursalEntrega?.puntoEntrega),
          packages: new Map(),
        };

        const newPackages = new Map(prev.packages);
        enviosDeLaSucursal.forEach((envio) => newPackages.set(envio.id, envio));

        updated.set(key, { ...prev, packages: newPackages });
      });
    } else {
      const key = `sucursal_${sucursal.id}`;
      const prev = updated.get(key) ?? {
        puntoEntregaID: null,
        sucursalDestinoID: sucursal.id,
        label: sucursal.nombre,
        coords: coordsDePunto(sucursal.puntoEntrega),
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
          Item: VirtuosoItem,
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
