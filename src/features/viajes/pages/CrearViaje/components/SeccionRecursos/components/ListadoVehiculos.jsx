import { useState } from "react";
import {
  Card,
  Title,
  Stack,
  TextInput,
  Switch,
  Box,
  Alert,
  Group,
  Button,
} from "@mantine/core";
import { useDebouncedState, useToggle } from "@mantine/hooks";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";

import ScreenContainer from "@components/ScreenContainer";

import ItemVehiculo from "./ItemVehiculo";
import { useQuery } from "@tanstack/react-query";
import SelectableItemList from "@components/SelectableItemList";
import { IconLoader } from "@tabler/icons-react";

const VEHICLES = [
  {
    id: 1,
    patente: "KE6224",
    capacidad: 9443,
    disponible: true,
  },
  {
    id: 2,
    patente: "SA8898",
    capacidad: 1748,
    disponible: true,
  },
  {
    id: 3,
    patente: "AF5408",
    capacidad: 3888,
    disponible: false,
  },
  {
    id: 4,
    patente: "AF4803",
    capacidad: 9685,
    disponible: true,
  },
  {
    id: 5,
    patente: "LH2472",
    capacidad: 7555,
    disponible: true,
  },
  {
    id: 6,
    patente: "AV1393",
    capacidad: 2860,
    disponible: false,
  },
  {
    id: 7,
    patente: "TG5404",
    capacidad: 7577,
    disponible: true,
  },
  {
    id: 8,
    patente: "WN8004",
    capacidad: 7903,
    disponible: true,
  },
  {
    id: 9,
    patente: "SA2814",
    capacidad: 3351,
    disponible: false,
  },
  {
    id: 10,
    patente: "AI6015",
    capacidad: 7617,
    disponible: true,
  },
];

const ListadoVehiculos = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [hideUnavailableVehicles, switchHideUnavailableVehicles] = useToggle();
  const [query, setQuery] = useDebouncedState("", 1000);

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", query],
    select: (data) => {
      if (hideUnavailableVehicles) {
        return data.filter((vehicle) => vehicle.capacidad >= 5000);
      }

      return data;
    },
    queryFn: () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.5) {
            resolve(VEHICLES);
          } else {
            reject(new Error());
          }
        }, 2000);
      }),
  });

  const { data: vehicles = [], isFetching, isError, refetch } = vehiclesQuery;

  const handleRefetch = () => {
    refetch();
    setSelectedVehicle(null);
  };

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <Card.Section withBorder p="md">
        <Group justify="space-between">
          <Title order={5}>Vehículos disponibles</Title>
          <Button
            variant="subtle"
            onClick={handleRefetch}
            disabled={isFetching}
          >
            Actualizar listado
          </Button>
        </Group>

        <Stack mt="xs" gap="sm">
          <TextInput
            flex={1}
            defaultValue={query}
            rightSection={
              isFetching ? <IconLoader size="16" /> : <IconSearch size={16} />
            }
            placeholder="Buscá por patente o por capacidad..."
            onChange={(event) => setQuery(event.target.value)}
          />

          <Switch
            w="fit-content"
            label="Ocultar vehículos sin capacidad suficiente"
            checked={hideUnavailableVehicles}
            onChange={switchHideUnavailableVehicles}
          />

          {selectedVehicle?.capacidad < 5000 && (
            <Alert variant="light" color="orange" icon={<IconAlertCircle />}>
              Seleccionaste un vehículo con capacidad insuficiente.
            </Alert>
          )}
        </Stack>
      </Card.Section>

      <Box
        p="0"
        m="0"
        flex={1}
        component="ul"
        style={{ listStyle: "none", overflowY: "auto" }}
      >
        <ScreenContainer
          styleProps={{
            h: "100%",
            bg: "transparent",
          }}
          onError={{
            show: isError,
            title: "Error al cargar los vehículos",
            description: "Por favor, intentá nuevamente o contactá a soporte",
            onClick: refetch,
          }}
          onLoading={{
            show: isFetching,
            description: "Cargando vehículos...",
          }}
          onEmptyData={{
            show: vehicles.length === 0,
            title: "No hay vehículos disponibles",
            description: "No hay vehículos disponibles para seleccionar",
          }}
        >
          {vehicles.map((vehicle) => (
            <SelectableItemList
              key={vehicle.id}
              selected={selectedVehicle?.id === vehicle.id}
              onClick={() => setSelectedVehicle(vehicle)}
            >
              <ItemVehiculo vehicle={vehicle} />
            </SelectableItemList>
          ))}
        </ScreenContainer>
      </Box>
    </Card>
  );
};

export default ListadoVehiculos;
