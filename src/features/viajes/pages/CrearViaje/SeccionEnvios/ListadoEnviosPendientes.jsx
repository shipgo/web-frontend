import { useMap } from "@mantine/hooks";
import { Button, Center, Text } from "@mantine/core";

import { Virtuoso } from "react-virtuoso";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";

import ItemPaquete from "./ItemPaquete";
import EnviosAcciones from "./EnviosAcciones";

import { ACTIONS } from "../constants";
import { useFormContext } from "../contexts/EnviosFormContext";

const ListadoEnviosPendientes = ({ queryState, hideIncludedPackages }) => {
  const {
    data,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isPending,
    isFetchingNextPage,
    isFetchNextPageError,
  } = queryState;

  const hasError = isFetchNextPageError || isError;

  const {
    setFieldValue,
    values: { enviosIncluidos },
  } = useFormContext();

  const selectedPackages = useMap();

  const getPackages = () => {
    const packages = data?.pages?.flatMap((page) => page.data) ?? [];

    if (hideIncludedPackages) {
      return packages.filter(
        (item) =>
          !enviosIncluidos
            .values()
            .some((entry) => entry.packages.has(item.id)),
      );
    }

    return packages;
  };

  const packages = getPackages();

  const handlePackageSelect = (item) => {
    if (selectedPackages.has(item.id)) {
      selectedPackages.delete(item.id);
      return;
    }

    selectedPackages.set(item.id, item);
  };

  const handleOnSelectedAction = ({ action, sucursal }) => {
    const key =
      action === ACTIONS.ENTREGA_LOCAL
        ? ACTIONS.ENTREGA_LOCAL
        : `${ACTIONS.TRANSFERENCIA_SUCURSAL}_${sucursal.id}`;

    const prev = enviosIncluidos.get(key) ?? {
      sucursal: sucursal ?? null,
      packages: new Map(),
    };

    const newPackages = new Map([...prev.packages, ...selectedPackages]);

    setFieldValue(
      "enviosIncluidos",
      new Map([...enviosIncluidos, [key, { ...prev, packages: newPackages }]]),
    );

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
        show: hasError,
        onClick: refetch,
        title: "Error al cargar los envíos",
        description:
          "Hubo un error al cargar los envíos pendientes, por favor intenta nuevamente",
      }}
      onEmptyData={{
        show: !isPending && packages.length === 0,
        title: "No hay envíos pendientes",
        description: "No hay envíos pendientes para seleccionar",
      }}
    >
      <Virtuoso
        data={packages}
        style={{ flex: 1 }}
        components={{
          Footer: () => {
            if (isFetchingNextPage) {
              return (
                <Center h="72px">
                  <Text c="dimmed">Cargando más envíos pendientes...</Text>
                </Center>
              );
            }

            if (isPending || hasError) {
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
                <Text c="dimmed">No hay más envíos pendientes</Text>
              </Center>
            );
          },
        }}
        itemContent={(_, item) => {
          const isIncludedInTrip = enviosIncluidos
            .values()
            .some((entry) => entry.packages.has(item.id));

          return (
            <SelectableItemList
              key={item.id}
              disabled={isIncludedInTrip}
              selected={selectedPackages.has(item.id)}
              onClick={() => handlePackageSelect(item)}
            >
              <ItemPaquete item={item} isIncludedInTrip={isIncludedInTrip} />
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
