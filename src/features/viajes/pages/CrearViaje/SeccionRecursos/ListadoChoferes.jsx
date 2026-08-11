import { useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  Group,
  ScrollArea,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { IconSearch, IconQrcode } from "@tabler/icons-react";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";

import ItemChofer from "./ItemChofer";

const CHOFERES = [
  {
    id: 1,
    nombre: "Juan Perez",
    email: "juan.perez@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 2,
    nombre: "Daniel Gomez",
    email: "daniel.gomez@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 3,
    nombre: "Martin Garcia",
    email: "juan.perez@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 4,
    nombre: "Lucas Garcia",
    email: "lucas.garcia@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 5,
    nombre: "Andres Martinez",
    email: "andres.martinez@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 6,
    nombre: "Fernando Ramirez",
    email: "lucas.garcia@gmail.com",
    telefono: "1234567890",
  },
  {
    id: 7,
    nombre: "Diego Lopez",
    email: "diego.lopez@gmail.com",
    telefono: "1234567890",
  },
];

const ListadoChoferes = () => {
  const [selectedChofer, setSelectedChofer] = useState(null);

  const choferesQuery = useQuery({
    queryKey: ["choferes"],
    queryFn: () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(CHOFERES);
        }, 1000);
      }),
  });

  const { refetch, isError, isFetching, data: choferes = [] } = choferesQuery;

  const handleRefetch = () => {
    refetch();
    setSelectedChofer(null);
  };

  return (
    <Card flex={1} h="500" padding="none" shadow="none" withBorder>
      <Card.Section withBorder p="md">
        <Group justify="space-between">
          <Title order={5}>Choferes disponibles</Title>
          <Button
            variant="subtle"
            onClick={handleRefetch}
            disabled={isFetching}
          >
            Actualizar listado
          </Button>
        </Group>

        <Group mt="xs" gap="sm">
          <TextInput
            flex={1}
            rightSection={<IconSearch size={16} />}
            placeholder="Buscá por nombre, mail o teléfono..."
          />
        </Group>
      </Card.Section>

      <ScreenContainer
        styleProps={{
          h: "100%",
        }}
        onError={{
          show: isError,
          title: "Error al cargar los choferes",
          description: "Error al cargar los choferes",
          onClick: refetch,
        }}
        onLoading={{
          show: isFetching,
          description: "Cargando choferes...",
        }}
        onEmptyData={{
          show: choferes.length === 0,
          title: "No hay choferes disponibles",
          description: "No hay choferes disponibles para seleccionar",
        }}
      >
        <ScrollArea p="0" m="0" flex={1} component="ul">
          <SelectableItemList
            singleSelection
            selected={selectedChofer === null}
            onClick={() => setSelectedChofer(null)}
          >
            <Avatar>
              <IconQrcode />
            </Avatar>

            <Box>
              <Text>Asignación por QR</Text>
              <Text c="dimmed" size="sm">
                El viaje quedará abierto para auto-asignación
              </Text>
            </Box>
          </SelectableItemList>
          {choferes.map((chofer) => (
            <SelectableItemList
              singleSelection
              key={chofer.id}
              selected={selectedChofer === chofer.id}
              onClick={() => setSelectedChofer(chofer.id)}
            >
              <ItemChofer chofer={chofer} />
            </SelectableItemList>
          ))}
        </ScrollArea>
      </ScreenContainer>
    </Card>
  );
};

export default ListadoChoferes;
