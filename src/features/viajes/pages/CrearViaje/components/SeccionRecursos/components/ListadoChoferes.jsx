import { useState } from "react";

import { Box, Button, Card, Group, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import ScreenContainer from "@components/ScreenContainer";
import SelectableItemList from "@components/SelectableItemList";

import ItemChofer from "./ItemChofer";
import { useQuery } from "@tanstack/react-query";

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
          <Title order={5}>Choferes disponibles (Opcional)</Title>
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
            placeholder="Buscá por nombre completo, mail o teléfono..."
          />
        </Group>
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
          {choferes.map((chofer) => (
            <SelectableItemList
              key={chofer.id}
              selected={selectedChofer === chofer.id}
              onClick={() => setSelectedChofer(chofer.id)}
            >
              <ItemChofer chofer={chofer} />
            </SelectableItemList>
          ))}
        </ScreenContainer>
      </Box>
    </Card>
  );
};

export default ListadoChoferes;
