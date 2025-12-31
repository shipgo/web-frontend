import { Fragment } from "react";

import { IconPlus, IconSearch } from "@tabler/icons-react";
import {
  Card,
  Group,
  Title,
  Button,
  TextInput,
  Divider,
  Box,
} from "@mantine/core";

import MapListadoViajesItem from "./MapListadoViajesItem";

const MapListadoViajes = () => {
  return (
    <Card flex="1" maw="400" h="100%">
      <Group justify="space-between">
        <Title order={4}>Listado de viajes</Title>
        <Button size="xs" variant="light" leftSection={<IconPlus size={16} />}>
          Nuevo viaje
        </Button>
      </Group>

      <TextInput
        my="md"
        radius="xl"
        variant="filled"
        placeholder="Buscar viaje"
        rightSection={<IconSearch cursor="pointer" size={16} />}
      />

      <Card withBorder shadow="none" p="0" style={{ overflowY: "auto" }}>
        {Array.from({ length: 10 }).map((_, index) => (
          <Fragment key={index}>
            <MapListadoViajesItem viajeId={index} />
            {index !== 9 && <Divider />}
          </Fragment>
        ))}
      </Card>
    </Card>
  );
};

export default MapListadoViajes;
