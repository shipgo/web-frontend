import { Virtuoso } from "react-virtuoso";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";

import { useMap, useToggle } from "@mantine/hooks";
import {
  Card,
  Title,
  TextInput,
  Button,
  Menu,
  Stack,
  Switch,
  Text,
  Center,
} from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";

import ItemPaquete from "./ItemPaquete";
import { useInfiniteQuery } from "@tanstack/react-query";

import { PACKAGES } from "../constants/packages";
import SelectableItemList from "@components/SelectableItemList";

const ACCIONES = [
  {
    label: "Entrega local",
    value: "entrega_local",
  },
  {
    label: "Transferencia a sucursal",
    value: "transferencia_sucursal",
  },
];

const getPackages = ({ pageParam, pageSize = 25 }) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const offset = pageParam + pageSize;
      const data = PACKAGES.slice(pageParam, offset);
      const nextPage = PACKAGES.length > offset ? offset : null;
      resolve({ data, nextPage });
    }, 1000);
  });

const EnviosPendientes = ({ onPackagesAction, packagesInTrip }) => {
  const selectedPackages = useMap();
  const [hideIncludedPackages, toggleHideIncludedPackages] = useToggle();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["pending-packages"],
      queryFn: getPackages,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    });

  const getPackagesToShow = () => {
    const packages = data?.pages.flatMap((page) => page.data);

    if (hideIncludedPackages) {
      return packages.filter(
        (item) => !packagesInTrip.some((map) => map.has(item.id))
      );
    }

    return packages;
  };

  const handlePackageSelect = (item) => {
    if (selectedPackages.has(item.id)) {
      selectedPackages.delete(item.id);
      return;
    }

    selectedPackages.set(item.id, item);
  };

  const onActionSelect = (action) => {
    onPackagesAction({ items: selectedPackages, action });
    selectedPackages.clear();
  };

  return (
    <Card h="100%" flex={1} padding="none" shadow="none" withBorder>
      <Card.Section withBorder p="md">
        <Title order={5}>Envíos pendientes</Title>

        <Stack mt="xs" gap="sm">
          <TextInput
            flex={1}
            placeholder="Buscá por ID o por destino..."
            rightSection={<IconSearch size={16} />}
          />

          <Switch
            w="fit-content"
            label="Ocultar envíos ya agregados al viaje"
            checked={hideIncludedPackages}
            onChange={toggleHideIncludedPackages}
          />
        </Stack>
      </Card.Section>

      <Virtuoso
        style={{ flex: 1 }}
        data={getPackagesToShow()}
        components={{
          EmptyPlaceholder: () => (
            <ScreenContainer
              styleProps={{
                h: "100%",
              }}
              onEmptyData={{
                show: true,
                title: "No hay envíos pendientes",
                description: "No hay envíos pendientes para seleccionar",
              }}
            />
          ),
          Footer: () => {
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
        itemContent={(_, item) => (
          <SelectableItemList
            key={item.id}
            selected={selectedPackages.has(item.id)}
            onClick={() => handlePackageSelect(item)}
          >
            <ItemPaquete
              item={item}
              isIncludedInTrip={packagesInTrip.some((map) => map.has(item.id))}
            />
          </SelectableItemList>
        )}
      />

      {selectedPackages.size > 0 && (
        <Menu>
          <Menu.Target>
            <Button
              radius="0"
              variant="light"
              rightSection={<IconChevronDown size={16} />}
            >
              Marcar envíos para...
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            {ACCIONES.map((accion) => (
              <Menu.Item
                key={accion.value}
                onClick={() => onActionSelect(accion.value)}
              >
                {accion.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
    </Card>
  );
};

export default EnviosPendientes;
